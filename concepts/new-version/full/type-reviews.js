(() => {
  'use strict';
  const track = document.querySelector('[data-reviews-controller="enhanced"]');
  if (!track) return;
  const section = track.closest('#reviews');
  const cards = [...track.querySelectorAll('.review-card')];
  const navigation = section.querySelector('.review-navigation');
  const previous = navigation.querySelector('[data-track-prev]');
  const next = navigation.querySelector('[data-track-next]');
  const status = navigation.querySelector('.review-position');
  const visual = status.querySelector('.review-position-visual');
  const announcement = status.querySelector('.review-position-announcement');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tolerance = 2;
  let targets = [];
  let pendingTarget = null;
  let scrollFrame = 0;
  let settleTimer = 0;
  let lastRange = '';

  function measure() {
    const left = track.getBoundingClientRect().left;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    targets = cards.map(card => Math.min(max, Math.max(0,
      card.getBoundingClientRect().left - left + track.scrollLeft
    ))).filter((value, index, all) => index === 0 || value - all[index - 1] > tolerance);
  }

  function nearestTarget() {
    return targets.reduce((best, value, index) =>
      Math.abs(value - track.scrollLeft) < Math.abs(targets[best] - track.scrollLeft) ? index : best, 0);
  }

  function updateButtons() {
    const position = pendingTarget === null ? track.scrollLeft : targets[pendingTarget];
    previous.disabled = position <= targets[0] + tolerance;
    next.disabled = position >= targets[targets.length - 1] - tolerance;
  }

  function updatePosition() {
    const viewport = track.getBoundingClientRect();
    // A small preview of the next card does not count as a displayed review.
    const visible = cards.map((card, index) => ({ box: card.getBoundingClientRect(), index }))
      .filter(({ box }) => Math.min(box.right, viewport.right) - Math.max(box.left, viewport.left) > box.width / 2);
    if (!visible.length) return;
    const first = visible[0].index + 1;
    const last = visible[visible.length - 1].index + 1;
    const range = first === last ? String(first) : `${first}–${last}`;
    if (range === lastRange) return;
    lastRange = range;
    const current = document.createElement('strong');
    current.textContent = range;
    visual.replaceChildren(current, document.createTextNode(` / ${cards.length}`));
    announcement.textContent = first === last
      ? `Отзыв ${first} из ${cards.length}`
      : `Отзывы ${first}–${last} из ${cards.length}`;
  }

  function settle() {
    clearTimeout(settleTimer);
    pendingTarget = null;
    updateButtons();
    updatePosition();
  }

  function goTo(index) {
    status.setAttribute('aria-live', 'polite');
    pendingTarget = Math.max(0, Math.min(targets.length - 1, index));
    track.scrollTo({ left: targets[pendingTarget], behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    updateButtons();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  }

  function move(direction) {
    goTo((pendingTarget ?? nearestTarget()) + direction);
  }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(targets.length - 1);
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  function directInteraction() {
    pendingTarget = null;
    status.setAttribute('aria-live', 'polite');
  }
  track.addEventListener('pointerdown', directInteraction, { passive: true });
  track.addEventListener('wheel', directInteraction, { passive: true });
  track.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateButtons();
    });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 140);
  }, { passive: true });
  track.addEventListener('scrollend', settle);
  function resize() {
    status.setAttribute('aria-live', 'off');
    pendingTarget = null;
    measure();
    updateButtons();
    updatePosition();
  }
  new ResizeObserver(resize).observe(track);
  resize();
  navigation.hidden = false;
  section.dataset.reviewsReady = '';
})();
