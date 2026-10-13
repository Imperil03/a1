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
  let drag = null;
  let suppressDragClick = false;

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
    if (drag) return;
    clearTimeout(settleTimer);
    pendingTarget = null;
    track.classList.remove('review-drag-snap');
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
    if (['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) {
      track.removeAttribute('data-review-pointer-focus');
    }
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finishDrag(true);
      return;
    }
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
  function startDrag(event) {
    suppressDragClick = false;
    directInteraction();
    if (event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0 || drag) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.target.closest('a, button, input, textarea, select, summary, [contenteditable]')) return;
    if (targets.length < 2) return;
    // Touch keeps native scrolling. Mouse movement is captured even outside
    // the card, and modified clicks retain native text-selection behavior.
    event.preventDefault();
    clearTimeout(settleTimer);
    track.classList.add('review-drag-snap');
    track.scrollTo({ left: track.scrollLeft, behavior: 'auto' });
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: track.scrollLeft,
      target: nearestTarget(),
      active: false,
    };
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
    track.setAttribute('data-review-pointer-focus', '');
    track.focus({ preventScroll: true });
  }

  function dragMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!(event.buttons & 1)) { finishDrag(true); return; }
    const distance = drag.x - event.clientX;
    if (!drag.active) {
      if (Math.abs(event.clientY - drag.y) > Math.max(12, Math.abs(distance))) {
        finishDrag(true);
        return;
      }
      if (Math.abs(distance) < 8) return;
      drag.active = true;
    }
    event.preventDefault();
    track.scrollLeft = drag.left + distance;
  }

  function finishDrag(cancelled = false) {
    if (!drag) return;
    const completed = drag;
    drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(completed.pointerId)) track.releasePointerCapture(completed.pointerId);
    if (cancelled || !completed.active) { settle(); return; }
    suppressDragClick = true;
    const travelled = track.scrollLeft - completed.left;
    const direction = Math.sign(travelled);
    let destination = nearestTarget();
    const adjacent = Math.max(0, Math.min(targets.length - 1, completed.target + direction));
    const step = Math.abs(targets[adjacent] - targets[completed.target]);
    // An intentional short swipe advances one card; a longer drag can cross
    // several. No momentum keeps the review text under the reader's control.
    if (direction && Math.abs(travelled) >= Math.min(64, step * .2)) {
      destination = direction > 0 ? Math.max(destination, adjacent) : Math.min(destination, adjacent);
    }
    goTo(destination);
  }

  track.addEventListener('pointerdown', startDrag);
  track.addEventListener('pointermove', dragMove);
  track.addEventListener('pointerup', event => {
    if (drag?.pointerId === event.pointerId) finishDrag();
  });
  track.addEventListener('pointercancel', () => finishDrag(true));
  track.addEventListener('lostpointercapture', () => finishDrag(true));
  track.addEventListener('blur', () => track.removeAttribute('data-review-pointer-focus'));
  window.addEventListener('blur', () => finishDrag(true));
  track.addEventListener('click', event => {
    if (suppressDragClick && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
    suppressDragClick = false;
  }, true);
  track.addEventListener('dragstart', event => {
    if (drag) event.preventDefault();
  });
  track.addEventListener('wheel', () => {
    finishDrag(true);
    directInteraction();
  }, { passive: true });
  track.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateButtons();
    });
    clearTimeout(settleTimer);
    if (drag) return;
    settleTimer = setTimeout(settle, 140);
  }, { passive: true });
  track.addEventListener('scrollend', settle);
  function resize() {
    finishDrag(true);
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
