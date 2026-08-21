const WHATSAPP_NUMBER = '5491162740672';

const units = {
  1: {
    kicker: '2 ambientes · Al frente',
    title: '2 ambientes con balcón',
    price: 'USD 91.400',
    specs: [['48 m²', 'superficie total'], ['42 m²', 'cubiertos'], ['6 m²', 'semicubiertos']],
    summary: 'Departamento de 2 ambientes al frente, con orientación Norte, dormitorio independiente y balcón de 6 m². Ofrece 42 m² cubiertos, vista abierta, buena entrada de luz y entrega inmediata.',
    features: ['2 ambientes', '1 dormitorio', '1 baño completo', 'Balcón al frente', 'Orientación Norte', 'Vista abierta', 'Cocina', 'Muy luminoso', 'Termotanque eléctrico', 'Preinstalación de aire acondicionado', 'Preinstalación para lavarropas', 'Entrega inmediata', 'Financiación disponible'],
    meta: ['Antigüedad: 0 años', 'Edificio: PB + 9 pisos', 'MLS-ID: 421531079-110', 'Ubicación: Carlos Calvo 2590, San Cristóbal'],
    images: [20, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    count: 19,
    message: 'Hola, quiero consultar disponibilidad y condiciones por el departamento de 2 ambientes de 48 m² publicado a USD 91.400 (MLS 421531079-110).'
  },
  2: {
    kicker: 'Monoambiente · Contrafrente',
    title: 'Monoambiente compacto',
    price: 'USD 52.900',
    specs: [['25 m²', 'superficie total'], ['25 m²', 'cubiertos'], ['1', 'ambiente']],
    summary: 'Monoambiente de 25 m² cubiertos al contrafrente, con orientación Sur, vista abierta y cocina eléctrica. Una planta compacta, a estrenar y con entrega inmediata.',
    features: ['1 ambiente', '1 baño completo', 'Al contrafrente', 'Orientación Sur', 'Vista abierta', 'Muy luminoso', 'Cocina eléctrica', 'Termotanque eléctrico', 'Preinstalación de aire acondicionado', 'Preinstalación para lavarropas', 'Entrega inmediata'],
    meta: ['Antigüedad: 0 años', 'Edificio: PB + 9 pisos', 'MLS-ID: 421531079-109', 'Ubicación: Carlos Calvo 2590, San Cristóbal'],
    images: [13, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    count: 13,
    message: 'Hola, quiero consultar disponibilidad y condiciones por el monoambiente de 25 m² publicado a USD 52.900 (MLS 421531079-109).'
  },
  3: {
    kicker: 'Monoambiente · Contrafrente',
    title: 'Monoambiente amplio',
    price: 'USD 62.500',
    specs: [['31 m²', 'superficie total'], ['31 m²', 'cubiertos'], ['1', 'ambiente']],
    summary: 'Monoambiente de 31 m² cubiertos al contrafrente, con orientación Sur, vista abierta y cocina eléctrica. Una alternativa de mayor superficie, a estrenar y con entrega inmediata.',
    features: ['1 ambiente', '1 baño completo', 'Al contrafrente', 'Orientación Sur', 'Vista abierta', 'Muy luminoso', 'Cocina eléctrica', 'Termotanque eléctrico', 'Preinstalación de aire acondicionado', 'Preinstalación para lavarropas', 'Entrega inmediata'],
    meta: ['Antigüedad: 0 años', 'Edificio: PB + 9 pisos', 'MLS-ID: 421531079-108', 'Ubicación: Carlos Calvo 2590, San Cristóbal'],
    images: [23, 22, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    count: 23,
    message: 'Hola, quiero consultar disponibilidad y condiciones por el monoambiente de 31 m² publicado a USD 62.500 (MLS 421531079-108).'
  }
};

const whatsappUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
document.querySelectorAll('.whatsapp').forEach((link) => {
  link.href = whatsappUrl(link.dataset.message || 'Hola, quiero recibir información sobre Carlos Calvo 2590.');
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('[data-type]').forEach((card) => {
      card.classList.toggle('hidden', button.dataset.filter !== 'all' && card.dataset.type !== button.dataset.filter);
    });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const motionTargets = [...document.querySelectorAll('.section > *, .connections article, .nearby-card, .nearby-grid article, .features-grid li, .accordion details')]
  .filter((element) => !element.classList.contains('reveal'));
motionTargets.forEach((element, index) => {
  element.classList.add('section-reveal');
  element.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
});
const motionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      motionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
motionTargets.forEach((element) => motionObserver.observe(element));

const hero = document.querySelector('.hero');
const heroSlides = [...document.querySelectorAll('.hero-slide')];
const heroDots = document.querySelector('.hero-dots');
let activeHeroSlide = 0;
let heroTimer;

heroSlides.forEach((_, index) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = index === 0 ? 'active' : '';
  dot.setAttribute('aria-label', `Ver imagen ${index + 1}`);
  dot.addEventListener('click', () => {
    setHeroSlide(index);
    restartHeroTimer();
  });
  heroDots.appendChild(dot);
});

const setHeroSlide = (index) => {
  activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === activeHeroSlide));
  [...heroDots.children].forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === activeHeroSlide));
};
const restartHeroTimer = () => {
  clearInterval(heroTimer);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroTimer = setInterval(() => setHeroSlide(activeHeroSlide + 1), 5500);
  }
};
hero.addEventListener('mouseenter', () => clearInterval(heroTimer));
hero.addEventListener('mouseleave', restartHeroTimer);
document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(heroTimer) : restartHeroTimer());
restartHeroTimer();

const videoDialog = document.querySelector('#video-dialog');
const tourVideo = document.querySelector('#tour-video');
const videoDialogTitle = document.querySelector('#video-dialog-title');
const videoWhatsapp = document.querySelector('#video-whatsapp');

document.querySelectorAll('.open-video').forEach((button) => {
  button.addEventListener('click', () => {
    const id = Number(button.dataset.video);
    const unit = units[id];
    videoDialogTitle.textContent = unit.title;
    videoWhatsapp.href = whatsappUrl(unit.message);
    tourVideo.poster = imagePath(id, 1);
    tourVideo.src = `assets/videos/dpto-${id}.m4v`;
    tourVideo.load();
    videoDialog.showModal();
    document.body.classList.add('dialog-open');
    tourVideo.play().catch(() => {});
  });
});
const closeVideoDialog = () => videoDialog.close();
document.querySelector('.video-close').addEventListener('click', closeVideoDialog);
videoDialog.addEventListener('click', (event) => {
  const rect = videoDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeVideoDialog();
});
videoDialog.addEventListener('close', () => {
  tourVideo.pause();
  tourVideo.removeAttribute('src');
  tourVideo.load();
  document.body.classList.remove('dialog-open');
});

const dialog = document.querySelector('#unit-dialog');
const mainImage = document.querySelector('#gallery-main');
const thumbs = document.querySelector('#gallery-thumbs');
const counter = document.querySelector('#gallery-counter');
let activeUnit = 1;
let activeImage = 1;

const imagePath = (unit, position) => {
  const fileNumber = units[unit].images[position - 1];
  return `assets/images/dpto-${unit}/${String(fileNumber).padStart(2, '0')}.webp`;
};
const showImage = (image) => {
  const unit = units[activeUnit];
  activeImage = image < 1 ? unit.count : image > unit.count ? 1 : image;
  mainImage.src = imagePath(activeUnit, activeImage);
  mainImage.alt = `${unit.title}, fotografía ${activeImage} de ${unit.count}`;
  counter.textContent = `${activeImage} / ${unit.count}`;
  thumbs.querySelectorAll('button').forEach((button, index) => button.classList.toggle('active', index + 1 === activeImage));
  thumbs.querySelector(`button:nth-child(${activeImage})`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
};

const openUnit = (id) => {
  activeUnit = Number(id);
  activeImage = 1;
  const unit = units[activeUnit];
  document.querySelector('#dialog-kicker').textContent = unit.kicker;
  document.querySelector('#dialog-title').textContent = unit.title;
  document.querySelector('#dialog-price').textContent = unit.price;
  document.querySelector('#dialog-summary').textContent = unit.summary;
  document.querySelector('#dialog-specs').innerHTML = unit.specs.map(([value, label]) => `<div><b>${value}</b><span>${label}</span></div>`).join('');
  document.querySelector('#dialog-features').innerHTML = unit.features.map((item) => `<li>${item}</li>`).join('');
  document.querySelector('#dialog-meta').innerHTML = unit.meta.map((item) => `<span>${item}</span>`).join('');
  const dialogWhatsapp = document.querySelector('#dialog-whatsapp');
  dialogWhatsapp.href = whatsappUrl(unit.message);
  dialogWhatsapp.target = '_blank';
  dialogWhatsapp.rel = 'noopener noreferrer';
  thumbs.innerHTML = Array.from({ length: unit.count }, (_, index) => `<button aria-label="Ver fotografía ${index + 1}"><img src="${imagePath(activeUnit, index + 1)}" loading="lazy" alt=""></button>`).join('');
  thumbs.querySelectorAll('button').forEach((button, index) => button.addEventListener('click', () => showImage(index + 1)));
  showImage(1);
  dialog.showModal();
  document.body.classList.add('dialog-open');
};

document.querySelectorAll('.open-unit').forEach((button) => button.addEventListener('click', () => openUnit(button.dataset.unit)));
document.querySelectorAll('.unit-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('.whatsapp, .open-unit')) return;
    openUnit(card.dataset.unit);
  });
  card.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
      event.preventDefault();
      openUnit(card.dataset.unit);
    }
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('.gallery-arrow.prev').addEventListener('click', () => showImage(activeImage - 1));
document.querySelector('.gallery-arrow.next').addEventListener('click', () => showImage(activeImage + 1));
dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
document.addEventListener('keydown', (event) => {
  if (!dialog.open) return;
  if (event.key === 'ArrowLeft') showImage(activeImage - 1);
  if (event.key === 'ArrowRight') showImage(activeImage + 1);
});
