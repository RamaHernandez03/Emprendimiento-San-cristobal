const config = window.CC_SUPABASE;
const form = document.querySelector('#seller-form');
const statusNode = document.querySelector('#form-status');
const submitButton = form.querySelector('button[type="submit"]');
const successBox = document.querySelector('#success-box');
const whatsappInput = document.querySelector('#seller-whatsapp');

const normalizeNationalNumber = (value) => {
  let digits = String(value ?? '').replace(/\D/g, '').replace(/^00/, '');
  if (digits.length > 10 && digits.startsWith('54')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('9')) digits = digits.slice(1);
  digits = digits.replace(/^0/, '');
  return digits;
};

whatsappInput.addEventListener('input', () => {
  whatsappInput.value = normalizeNationalNumber(whatsappInput.value).slice(0, 10);
  whatsappInput.setCustomValidity('');
});

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
  const nationalNumber = normalizeNationalNumber(data.get('whatsapp'));
  if (!/^\d{10}$/.test(nationalNumber)) {
    whatsappInput.setCustomValidity('Ingresá los 10 dígitos del número, sin +54, 0 ni 15.');
    whatsappInput.reportValidity();
    statusNode.textContent = 'Revisá el WhatsApp: deben ser 10 dígitos, sin +54, 0 ni 15.';
    statusNode.classList.add('error');
    return;
  }
  const whatsapp = `549${nationalNumber}`;
  submitButton.disabled = true;
  submitButton.textContent = 'Generando…';
  try {
    await apiRequest({ action:'registerSeller', name:data.get('name'), email:data.get('email'), whatsapp, website:data.get('website') });
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
