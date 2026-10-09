(() => {
  'use strict';
  const desktop = document.querySelector('#desktop-view');
  const mobile = document.querySelector('#mobile-view');
  const modes = [...document.querySelectorAll('[data-mode]')];
  const zoom = document.querySelector('.zoom-button');
  const canvas = document.querySelector('.canvas-scroll');
  const contents = document.querySelector('.contents');
  const error = document.querySelector('.viewer-error');
  document.querySelector('.mode-buttons').hidden = false;

  function setMode(mode, scroll = true) {
    const phone = mode === 'mobile';
    desktop.hidden = phone;
    mobile.hidden = !phone;
    zoom.hidden = phone;
    contents.hidden = phone;
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    canvas.classList.remove('is-enlarged');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = 'Крупнее';
    const url = new URL(location.href);
    if (phone) url.searchParams.set('view', 'mobile');
    else url.searchParams.delete('view');
    if (phone && !['#mobile-view', '#mobile-services', '#services-phone'].includes(url.hash)) url.hash = '';
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
  }
  modes.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  zoom.addEventListener('click', () => {
    const enabled = canvas.classList.toggle('is-enlarged');
    zoom.setAttribute('aria-pressed', String(enabled));
    zoom.textContent = enabled ? 'По ширине' : 'Крупнее';
    if (!enabled) canvas.scrollLeft = 0;
  });
  contents.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { contents.open = false; }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') contents.open = false;
  });
  document.addEventListener('click', event => {
    if (contents.open && !contents.contains(event.target)) contents.open = false;
  });

  const reviewImage = document.querySelector('#reviews-image');
  const previous = [document.querySelector('#reviews-prev'), document.querySelector('.previous-hit')];
  const next = [document.querySelector('#reviews-next'), document.querySelector('.next-hit')];
  const count = document.querySelector('#reviews-count');
  const reviews = document.querySelector('#reviews');
  let reviewIndex = 0;
  const reviewStates = [
    { src: 'assets/05-reviews-a.png', alt: 'Отзывы Алексея Петрова, Марины Козловой и Игоря Сидоренко', label: '1–3 из 6' },
    { src: 'assets/05-reviews-b.png', alt: 'Отзывы Елены Фроловой, Дмитрия Волкова и Ольги Назаровой', label: '4–6 из 6' },
  ];
  function setReviews(index) {
    if (index < 0 || index >= reviewStates.length || index === reviewIndex) return;
    reviewIndex = index;
    const state = reviewStates[index];
    reviews.setAttribute('aria-busy', 'true');
    reviewImage.src = state.src;
    reviewImage.alt = state.alt;
    count.textContent = state.label;
    previous.forEach(button => { button.disabled = index === 0; });
    next.forEach(button => { button.disabled = index === reviewStates.length - 1; });
  }
  previous.forEach(button => { button.hidden = false; button.addEventListener('click', () => setReviews(reviewIndex - 1)); });
  next.forEach(button => { button.hidden = false; button.addEventListener('click', () => setReviews(reviewIndex + 1)); });
  document.querySelector('.review-controls').hidden = false;
  reviewImage.addEventListener('load', () => reviews.removeAttribute('aria-busy'));
  reviewImage.addEventListener('error', () => reviews.removeAttribute('aria-busy'));
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => { error.hidden = false; });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) error.hidden = false;
  });
  const initialMode = new URL(location.href).searchParams.get('view') === 'mobile' || location.hash === '#mobile-view' ? 'mobile' : 'desktop';
  setMode(initialMode, false);
})();
