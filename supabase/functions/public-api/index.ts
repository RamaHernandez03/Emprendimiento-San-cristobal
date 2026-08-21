import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const PUBLISHABLE_KEY = 'sb_publishable_Uq7vjz4xbwXwRqWSFZwjHw_6tIlz2nX';
const SITE_URL = 'https://carloscalvo2500.netlify.app';
const allowedOrigins = new Set([SITE_URL, 'http://localhost:8080', 'http://127.0.0.1:8080']);

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Vary': 'Origin'
});

const response = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), { status, headers: cors(origin) });

const db = async (path: string, init: RequestInit = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  ...init,
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...(init.headers ?? {})
  }
});

const clean = (value: unknown, max = 200) => String(value ?? '').trim().slice(0, max);
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'vendedor';
const normalizeWhatsapp = (value: unknown) => {
  let digits = clean(value, 20).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('54')) digits = `54${digits}`;
  return digits;
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return response({ error: 'Método no permitido.' }, 405, origin);
  if (req.headers.get('apikey') !== PUBLISHABLE_KEY) return response({ error: 'Aplicación no autorizada.' }, 401, origin);
  if (origin && !allowedOrigins.has(origin) && !origin.endsWith('.netlify.app')) {
    return response({ error: 'Origen no autorizado.' }, 403, origin);
  }

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return response({ error: 'Solicitud inválida.' }, 400, origin); }
  const action = clean(payload.action, 40);

  if (action === 'resolveSeller') {
    const slug = clean(payload.slug, 64).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return response({ seller: null }, 200, origin);
    const result = await db(`sellers?select=name,whatsapp,slug&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`);
    if (!result.ok) return response({ error: 'No se pudo consultar el vendedor.' }, 500, origin);
    const rows = await result.json();
    return response({ seller: rows[0] ?? null }, 200, origin);
  }

  if (action === 'registerSeller') {
    const name = clean(payload.name, 100).replace(/\s+/g, ' ');
    const email = clean(payload.email, 254).toLowerCase();
    const whatsapp = normalizeWhatsapp(payload.whatsapp);
    if (name.length < 3) return response({ error: 'Ingresá nombre y apellido.' }, 422, origin);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: 'Ingresá un email válido.' }, 422, origin);
    if (!/^54[0-9]{10,13}$/.test(whatsapp)) return response({ error: 'Ingresá un WhatsApp válido con código de área.' }, 422, origin);

    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
    const slug = `${slugify(name)}-${suffix}`;
    const result = await db('sellers', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name, email, whatsapp, slug })
    });
    if (!result.ok) {
      const error = await result.json().catch(() => ({}));
      if (error.code === '23505') return response({ error: 'Ya existe un vendedor registrado con ese email.' }, 409, origin);
      return response({ error: 'No se pudo generar el link. Intentá nuevamente.' }, 500, origin);
    }
    return response({ seller: { name, slug, link: `${SITE_URL}/?vendedor=${encodeURIComponent(slug)}` } }, 201, origin);
  }

  if (action === 'track') {
    const eventType = clean(payload.eventType, 40);
    const allowedEvents = new Set(['page_view', 'seller_link_view', 'unit_view', 'whatsapp_click']);
    const sessionId = clean(payload.sessionId, 50);
    if (!allowedEvents.has(eventType) || !uuidPattern.test(sessionId)) return response({ tracked: false }, 422, origin);

    const sellerSlug = clean(payload.sellerSlug, 64).toLowerCase();
    let sellerId: string | null = null;
    if (sellerSlug) {
      const sellerResult = await db(`sellers?select=id&slug=eq.${encodeURIComponent(sellerSlug)}&is_active=eq.true&limit=1`);
      if (sellerResult.ok) sellerId = (await sellerResult.json())[0]?.id ?? null;
    }
    const rawUnit = Number(payload.unitId);
    const unitId = [1, 2, 3].includes(rawUnit) ? rawUnit : null;
    const source = clean(payload.source, 80).replace(/[^a-zA-Z0-9_\-.:]/g, '') || 'direct';
    const pagePath = clean(payload.pagePath, 300) || '/';
    const result = await db('events', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, seller_id: sellerId, unit_id: unitId, source, session_id: sessionId, page_path: pagePath })
    });
    return response({ tracked: result.ok }, result.ok ? 202 : 500, origin);
  }

  return response({ error: 'Acción desconocida.' }, 400, origin);
});
