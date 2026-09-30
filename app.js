const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu(returnFocus = false) {
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  if (returnFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const opening = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(opening));
  nav.classList.toggle('is-open', opening);
  document.body.classList.toggle('menu-open', opening);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
const privacy = document.querySelector('#privacy-dialog');
document.querySelector('[data-open-privacy]').addEventListener('click', () => privacy.showModal());
document.querySelectorAll('[data-close-privacy]').forEach(button => button.addEventListener('click', () => privacy.close()));
privacy.addEventListener('click', event => { if (event.target === privacy) {
  const box = privacy.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) privacy.close();
}});

// Only the photographs change; the headline and layout remain still.
const hero = document.querySelector('.hero');
if (hero) {
const slides = [...hero.querySelectorAll('.hero-slide')];
const choices = [...hero.querySelectorAll('.hero-choice')];
const controls = hero.querySelector('.hero-controls');
const rotation = hero.querySelector('.hero-rotation');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let activeSlide = 0;
let paused = motionPreference.matches;
let hovered = false;
let inView = true;
let imagesReady = false;
let rotationTimer;

function scheduleSlide() {
  clearTimeout(rotationTimer);
  hero.dataset.rotationStatus = paused ? 'paused' : hovered ? 'hovered' : !inView ? 'offscreen' : document.hidden ? 'hidden' : !imagesReady ? 'loading' : 'running';
  if (hero.dataset.rotationStatus !== 'running') return;
  rotationTimer = setTimeout(() => showSlide((activeSlide + 1) % slides.length), 8000);
}

function updateRotationControl() {
  rotation.textContent = paused ? '再生' : '一時停止';
  rotation.setAttribute('aria-label', paused ? '画像の自動切替を再生' : '画像の自動切替を一時停止');
  hero.dataset.rotation = paused ? 'paused' : 'playing';
  scheduleSlide();
}

function showSlide(index) {
  // Never fade away the current photograph before the next has loaded.
  if (!slides[index].complete || !slides[index].naturalWidth) return;
  activeSlide = index;
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index);
    slide.setAttribute('aria-hidden', String(i !== index));
    choices[i].setAttribute('aria-pressed', String(i === index));
  });
  hero.dataset.activeSlide = String(index + 1);
  scheduleSlide();
}

choices.forEach((button, index) => button.addEventListener('click', () => {
  paused = true;
  showSlide(index);
  updateRotationControl();
}));
rotation.addEventListener('click', () => {
  paused = !paused;
  updateRotationControl();
});
hero.addEventListener('focusin', event => {
  if (event.target !== rotation) {
    paused = true;
    updateRotationControl();
  }
});
hero.addEventListener('pointerenter', event => {
  if (event.pointerType === 'mouse') { hovered = true; scheduleSlide(); }
});
hero.addEventListener('pointerleave', () => { hovered = false; scheduleSlide(); });
document.addEventListener('visibilitychange', scheduleSlide);
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) { paused = true; updateRotationControl(); }
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    scheduleSlide();
  }, { threshold: 0.1 }).observe(hero);
}
Promise.all(slides.map(slide => slide.decode().catch(() => {}))).then(() => {
  imagesReady = slides.every(slide => slide.complete && slide.naturalWidth > 0);
  scheduleSlide();
});
controls.hidden = false;
hero.dataset.activeSlide = '1';
updateRotationControl();

}

// Purpose and sample selectors progressively enhance fully readable HTML sections.
document.querySelectorAll('[data-editorial-tabs]').forEach(group => {
  const list = group.querySelector('[role="tablist"]');
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  function activate(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus({ preventScroll: true });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activate(next, true); }
    });
  });
  activate(0);
  list.hidden = false;
});

// Deep links still reveal the detailed section after it becomes optional reading.
function revealLinkedDetail(hash, scroll = false) {
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
  const target = id && document.getElementById(id);
  if (!target) return;
  let detail = target.closest('details');
  while (detail) {
    detail.open = true;
    detail = detail.parentElement?.closest('details');
  }
  if (scroll) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin === location.origin && destination.pathname === location.pathname && destination.hash) {
    revealLinkedDetail(destination.hash);
  }
});
addEventListener('hashchange', () => revealLinkedDetail(location.hash, true));
revealLinkedDetail(location.hash, true);
