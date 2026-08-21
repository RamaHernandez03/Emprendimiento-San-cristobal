const config = window.CC_SUPABASE;
const form = document.querySelector('#seller-form');
const statusNode = document.querySelector('#form-status');
const submitButton = form.querySelector('button[type="submit"]');
const successBox = document.querySelector('#success-box');
const linkInput = document.querySelector('#seller-link');
const openLink = document.querySelector('#open-link');

const apiRequest = async (payload) => {
  const response = await fetch(config.functionUrl, { method:'POST', headers:{ apikey:config.anonKey, Authorization:`Bearer ${config.anonKey}`, 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'No pudimos completar el registro.');
  return body;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusNode.textContent = '';
  statusNode.classList.remove('error');
  successBox.classList.remove('show');
  const data = new FormData(form);
  const whatsapp = `54${String(data.get('whatsapp')).replace(/\D/g,'').replace(/^0/,'')}`;
  submitButton.disabled = true;
  submitButton.textContent = 'Generando…';
  try {
    const result = await apiRequest({ action:'registerSeller', name:data.get('name'), email:data.get('email'), whatsapp });
    linkInput.value = result.seller.link;
    openLink.href = result.seller.link;
    successBox.classList.add('show');
    form.reset();
  } catch (error) {
    statusNode.textContent = error.message;
    statusNode.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Generar mi link';
  }
});

document.querySelector('#copy-link').addEventListener('click', async () => {
  await navigator.clipboard.writeText(linkInput.value);
  document.querySelector('#copy-link').textContent = 'Copiado';
});
