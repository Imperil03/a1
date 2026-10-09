(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-nav');
  function closeMenu() { menu.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); }
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const wasOpen = menu.classList.contains('is-open');
    closeMenu();
    document.querySelectorAll('.site-header details[open]').forEach(d => { d.open = false; });
    if (wasOpen) menuButton.focus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) {
      closeMenu();
      document.querySelectorAll('.site-header .nav-pop[open],.city-choice[open]').forEach(d => { d.open = false; });
    }
  });
  document.querySelectorAll('.nav-pop').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) document.querySelectorAll('.nav-pop').forEach(other => { if (other !== d) other.open = false; });
  }));
  document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => {
    const root = button.closest('.city-choice');
    root.querySelector('summary').textContent = button.dataset.city;
    root.open = false;
    root.querySelector('summary').focus();
  }));
  const track = document.querySelector('.review-track');
  const previous = document.querySelector('[data-track-prev]');
  const next = document.querySelector('[data-track-next]');
  function update() { previous.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; }
  function move(direction) {
    const item = track.querySelector('.review-card');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.scrollBy({ left:direction * (item.getBoundingClientRect().width + gap), behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update, {passive:true});
  update();
})();
