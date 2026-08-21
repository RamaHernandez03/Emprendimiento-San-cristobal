const config = window.CC_SUPABASE;
const sessionKey = 'cc2590_admin_session';
const loginScreen = document.querySelector('#login-screen');
const panel = document.querySelector('#panel-content');
const loginStatus = document.querySelector('#login-status');
const panelMessage = document.querySelector('#panel-message');

const authFetch = (path, options = {}) => fetch(`${config.url}/auth/v1/${path}`, {
  ...options,
  headers: { apikey:config.anonKey, 'Content-Type':'application/json', ...(options.headers || {}) }
});
const saveSession = (session) => localStorage.setItem(sessionKey, JSON.stringify({ ...session, expires_at:Date.now() + (session.expires_in * 1000) - 60000 }));
const getStoredSession = () => { try { return JSON.parse(localStorage.getItem(sessionKey)); } catch { return null; } };
const clearSession = () => localStorage.removeItem(sessionKey);

const getSession = async () => {
  let session = getStoredSession();
  if (!session) return null;
  if (session.expires_at > Date.now()) return session;
  const response = await authFetch('token?grant_type=refresh_token', { method:'POST', body:JSON.stringify({ refresh_token:session.refresh_token }) });
  if (!response.ok) { clearSession(); return null; }
  session = await response.json();
  saveSession(session);
  return getStoredSession();
};

const dataFetch = async (path, options = {}) => {
  const session = await getSession();
  if (!session) throw new Error('La sesión venció. Volvé a ingresar.');
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers:{ apikey:config.anonKey, Authorization:`Bearer ${session.access_token}`, 'Content-Type':'application/json', ...(options.headers || {}) }
  });
};
const getJson = async (path) => {
  const response = await dataFetch(path);
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'No se pudieron cargar los datos.');
  return response.json();
};
const number = (value) => new Intl.NumberFormat('es-AR').format(Number(value || 0));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); loginStatus.textContent = '';
  const button = event.currentTarget.querySelector('button'); button.disabled = true;
  const response = await authFetch('token?grant_type=password', { method:'POST', body:JSON.stringify({ email:document.querySelector('#login-email').value.trim(), password:document.querySelector('#login-password').value }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { loginStatus.textContent = 'Email o contraseña incorrectos.'; loginStatus.classList.add('error'); button.disabled = false; return; }
  saveSession(body);
  const allowed = await verifyAdmin();
  if (!allowed) { clearSession(); loginStatus.textContent = 'Esta cuenta no tiene acceso administrador.'; loginStatus.classList.add('error'); button.disabled = false; return; }
  showPanel();
});

const verifyAdmin = async () => {
  try { const rows = await getJson('admins?select=user_id&limit=1'); return rows.length === 1; } catch { return false; }
};
const showPanel = () => { loginScreen.hidden = true; panel.hidden = false; void loadPanel(); };
const showLogin = () => { panel.hidden = true; loginScreen.hidden = false; };
document.querySelector('#logout-button').addEventListener('click', () => { clearSession(); showLogin(); });

const renderOverview = (data = {}) => {
  const mapping = { page:'total_page_views', sessions:'unique_sessions', units:'total_unit_views', whatsapp:'total_whatsapp_clicks', links:'seller_link_views', sellers:'active_sellers' };
  Object.entries(mapping).forEach(([id,key]) => document.querySelector(`#kpi-${id}`).textContent = number(data[key]));
};
const renderChart = (rows) => {
  const chart = document.querySelector('#daily-chart');
  if (!rows.length) { chart.innerHTML = '<p class="hint">Todavía no hay actividad registrada.</p>'; return; }
  const max = Math.max(...rows.map((row) => Number(row.page_views)), 1);
  chart.innerHTML = rows.map((row) => `<div class="chart-day" title="${escapeHtml(row.day)} · ${number(row.page_views)} visitas"><div class="chart-bar" style="height:${Math.max(3,(Number(row.page_views)/max)*100)}%"></div><small>${escapeHtml(row.day.slice(5))}</small></div>`).join('');
};
const unitNames = {1:'2 ambientes · 48 m²',2:'Monoambiente · 25 m²',3:'Monoambiente · 31 m²'};
const renderUnits = (rows) => {
  const byUnit = Object.fromEntries(rows.map((row) => [row.unit_id,row]));
  document.querySelector('#unit-metrics').innerHTML = [1,2,3].map((id) => { const row=byUnit[id] || {}; return `<article class="unit-metric"><span>${unitNames[id]}</span><strong>${number(row.detail_views)} aperturas</strong><small>${number(row.whatsapp_clicks)} clics a WhatsApp</small></article>`; }).join('');
};
const renderSellers = (rows) => {
  const tbody = document.querySelector('#seller-table');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="6">Todavía no hay vendedores registrados.</td></tr>'; return; }
  tbody.innerHTML = rows.map((seller) => `<tr><td><span class="seller-name">${escapeHtml(seller.name)}</span><br><a class="seller-link" target="_blank" href="/?vendedor=${encodeURIComponent(seller.slug)}">${escapeHtml(seller.slug)}</a></td><td>${escapeHtml(seller.email)}<br>+${escapeHtml(seller.whatsapp)}</td><td>${number(seller.link_views)}</td><td>${number(seller.unit_views)}</td><td>${number(seller.whatsapp_clicks)}</td><td><button class="status-pill ${seller.is_active?'active':'inactive'}" data-id="${seller.id}" data-active="${seller.is_active}">${seller.is_active?'Activo':'Inactivo'}</button></td></tr>`).join('');
  tbody.querySelectorAll('.status-pill').forEach((button) => button.addEventListener('click', () => toggleSeller(button)));
};
const toggleSeller = async (button) => {
  const next = button.dataset.active !== 'true';
  button.disabled = true;
  const response = await dataFetch(`sellers?id=eq.${encodeURIComponent(button.dataset.id)}`, { method:'PATCH', headers:{Prefer:'return=minimal'}, body:JSON.stringify({is_active:next}) });
  if (!response.ok) panelMessage.textContent = 'No se pudo actualizar el vendedor.';
  await loadPanel();
};
const loadPanel = async () => {
  panelMessage.textContent = '';
  try {
    const [overview,daily,units,sellers] = await Promise.all([
      getJson('admin_overview?select=*'), getJson('admin_daily_metrics?select=*'), getJson('admin_unit_stats?select=*'), getJson('admin_seller_stats?select=*&order=created_at.desc')
    ]);
    renderOverview(overview[0]); renderChart(daily); renderUnits(units); renderSellers(sellers);
  } catch (error) { panelMessage.textContent = error.message; if (/sesión/i.test(error.message)) { clearSession(); showLogin(); } }
};

(async () => { if (await getSession() && await verifyAdmin()) showPanel(); else showLogin(); })();
