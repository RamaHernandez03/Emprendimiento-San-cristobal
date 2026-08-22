import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const PUBLISHABLE_KEY = 'sb_publishable_Uq7vjz4xbwXwRqWSFZwjHw_6tIlz2nX';
const SITE_URL = 'https://carloscalvo2590.com';
const allowedOrigins = new Set([
  SITE_URL,
  'https://www.carloscalvo2590.com',
  'https://carloscalvo2500.netlify.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
]);

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Vary': 'Origin'
});

const response = (body: unknown, status = 200, origin: string | null = null, extraHeaders: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), ...extraHeaders } });

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
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char] ?? char));
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'vendedor';
const normalizeWhatsapp = (value: unknown) => {
  let digits = clean(value, 24).replace(/\D/g, '').replace(/^00/, '');
  if (digits.length > 10 && digits.startsWith('54')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('9')) digits = digits.slice(1);
  digits = digits.replace(/^0/, '');
  return /^\d{10}$/.test(digits) ? `549${digits}` : '';
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clientIp = (req: Request) => clean(
  req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown',
  80
);
const hashRateLimitKey = async (action: string, ip: string) => {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SERVICE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${action}:${ip}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
const consumeRateLimit = async (req: Request, action: 'registerSeller' | 'track' | 'subscribeLead', limit: number) => {
  const windowStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const keyHash = await hashRateLimitKey(action, clientIp(req));
  const result = await db('rpc/consume_api_rate_limit', {
    method: 'POST',
    body: JSON.stringify({ p_key_hash: keyHash, p_action: action, p_window_start: windowStart, p_limit: limit })
  });
  if (!result.ok) return { allowed: false, unavailable: true };
  const rows = await result.json();
  return { allowed: rows[0]?.allowed === true, unavailable: false };
};

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
    if (clean(payload.website, 200)) return response({ seller: { pending: true } }, 201, origin);
    const rateLimit = await consumeRateLimit(req, 'registerSeller', 10);
    if (rateLimit.unavailable) return response({ error: 'No se pudo validar la solicitud. Intentá nuevamente.' }, 503, origin);
    if (!rateLimit.allowed) return response(
      { error: 'Se alcanzó el límite temporal de registros. Intentá nuevamente más tarde.' },
      429,
      origin,
      { 'Retry-After': '3600' }
    );
    const name = clean(payload.name, 100).replace(/\s+/g, ' ');
    const email = clean(payload.email, 254).toLowerCase();
    const whatsapp = normalizeWhatsapp(payload.whatsapp);
    if (name.length < 3) return response({ error: 'Ingresá nombre y apellido.' }, 422, origin);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: 'Ingresá un email válido.' }, 422, origin);
    if (!/^549[0-9]{10}$/.test(whatsapp)) return response({ error: 'Ingresá los 10 dígitos del WhatsApp, sin +54, 0 ni 15.' }, 422, origin);

    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
    const slug = `${slugify(name)}-${suffix}`;
    const result = await db('sellers', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name, email, whatsapp, slug, is_active: false })
    });
    if (!result.ok) {
      const error = await result.json().catch(() => ({}));
      if (error.code === '23505') return response({ error: 'Ya existe un vendedor registrado con ese email.' }, 409, origin);
      return response({ error: 'No se pudo generar el link. Intentá nuevamente.' }, 500, origin);
    }
    return response({ seller: { name, slug, pending: true } }, 201, origin);
  }

  if (action === 'subscribeLead') {
    if (clean(payload.website, 200)) return response({ subscribed: true }, 201, origin);
    const rateLimit = await consumeRateLimit(req, 'subscribeLead', 8);
    if (rateLimit.unavailable) return response({ error: 'No se pudo validar la solicitud. Intentá nuevamente.' }, 503, origin);
    if (!rateLimit.allowed) return response(
      { error: 'Se alcanzó el límite temporal de registros. Intentá nuevamente más tarde.' },
      429,
      origin,
      { 'Retry-After': '3600' }
    );

    const email = clean(payload.email, 254).toLowerCase();
    const consent = payload.consent === true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: 'Ingresá un email válido.' }, 422, origin);
    if (!consent) return response({ error: 'Necesitamos tu consentimiento para enviarte novedades.' }, 422, origin);

    const sellerSlug = clean(payload.sellerSlug, 64).toLowerCase();
    let sellerId: string | null = null;
    if (sellerSlug) {
      const sellerResult = await db(`sellers?select=id&slug=eq.${encodeURIComponent(sellerSlug)}&is_active=eq.true&limit=1`);
      if (sellerResult.ok) sellerId = (await sellerResult.json())[0]?.id ?? null;
    }
    const source = clean(payload.source, 80).replace(/[^a-zA-Z0-9_\-.:]/g, '') || 'site';
    const result = await db('lead_subscribers?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        email,
        source,
        seller_id: sellerId,
        consent_version: '2026-08-22',
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    if (!result.ok) return response({ error: 'No pudimos guardar tu email. Intentá nuevamente.' }, 500, origin);
    return response({ subscribed: true }, 201, origin);
  }

  if (action === 'setSellerStatus') {
    const sellerId = clean(payload.sellerId, 40);
    const isActive = payload.isActive === true;
    const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    if (!uuidPattern.test(sellerId) || !accessToken) return response({ error: 'Solicitud administrativa inválida.' }, 400, origin);

    const userResult = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${accessToken}` }
    });
    if (!userResult.ok) return response({ error: 'La sesión venció. Volvé a ingresar.' }, 401, origin);
    const user = await userResult.json();
    const adminResult = await db(`admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    const admins = adminResult.ok ? await adminResult.json() : [];
    if (!admins.length) return response({ error: 'Esta cuenta no tiene acceso administrador.' }, 403, origin);

    const sellerResult = await db(`sellers?select=id,name,email,slug,is_active,approved_at&id=eq.${encodeURIComponent(sellerId)}&limit=1`);
    const sellers = sellerResult.ok ? await sellerResult.json() : [];
    const seller = sellers[0];
    if (!seller) return response({ error: 'No se encontró el vendedor.' }, 404, origin);
    const firstApproval = isActive && !seller.is_active && !seller.approved_at;

    const updateBody: Record<string, unknown> = { is_active: isActive };
    if (firstApproval) {
      updateBody.approved_at = new Date().toISOString();
      updateBody.approved_by = user.id;
    }
    const updateResult = await db(`sellers?id=eq.${encodeURIComponent(sellerId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(updateBody)
    });
    if (!updateResult.ok) return response({ error: 'No se pudo actualizar la aprobación del vendedor.' }, 500, origin);

    let emailSent = false;
    if (firstApproval) {
      if (!RESEND_API_KEY) return response({ error: 'El vendedor fue aprobado, pero falta configurar el servicio de correo.', approved: true }, 500, origin);
      const sellerUrl = `${SITE_URL}/?vendedor=${encodeURIComponent(seller.slug)}`;
      const safeName = escapeHtml(clean(seller.name, 100));
      const safeUrl = escapeHtml(sellerUrl);
      const emailResult = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Carlos Calvo 2590 <notificaciones@carloscalvo2590.com>',
          to: [seller.email],
          reply_to: 'jorgeallaria67@gmail.com',
          subject: 'Tu link de vendedor de Carlos Calvo 2590',
          html: `<p>Hola ${safeName},</p><p>Tu link de vendedor es: <a href="${safeUrl}">${safeUrl}</a></p><p>Saludos,<br>Jorge Allaria</p>`,
          text: `Hola ${clean(seller.name, 100)},\n\nTu link de vendedor es: ${sellerUrl}\n\nSaludos,\nJorge Allaria`
        })
      });
      if (!emailResult.ok) {
        const resendError = await emailResult.json().catch(() => ({}));
        console.error('Resend error', resendError);
        return response({ error: 'El vendedor fue aprobado, pero el correo no pudo enviarse. Revisá la verificación del dominio.', approved: true }, 502, origin);
      }
      emailSent = true;
    }
    return response({ updated: true, emailSent }, 200, origin);
  }

  if (action === 'track') {
    const rateLimit = await consumeRateLimit(req, 'track', 300);
    if (rateLimit.unavailable) return response({ tracked: false }, 503, origin);
    if (!rateLimit.allowed) return response({ tracked: false }, 429, origin, { 'Retry-After': '3600' });
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
