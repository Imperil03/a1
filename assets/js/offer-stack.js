/* resonance-service-stack */
(() => {
  'use strict';

  const grid = document.querySelector('body[data-motion-tempo="soft"] :is(#services:is([data-services-layout="catalog"], [data-services-layout="list"]), [data-service-sheets]) .offers-grid');
  if (!grid || !('IntersectionObserver' in window) || !CSS.supports('selector(:has(.offer-link:focus-visible))')) return;

  const cards = [...grid.querySelectorAll(':scope > .offer')];
  const hasContactShadow = grid.classList.contains('services-list');
  const motion = matchMedia('(min-width: 1100px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)');
  let layers = [];
  let near = false;
  let frame = 0;
  let lastTime = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function schedule() {
    if (near && motion.matches && !document.hidden && layers.length && !frame) {
      frame = requestAnimationFrame(paint);
    }
  }

  function paint(time) {
    frame = 0;
    if (!motion.matches || grid.querySelector('.offer-link:focus-visible, details[open]')) {
      stop();
      return;
    }

    const top = grid.getBoundingClientRect().top;
    const bounds = hasContactShadow ? cards.map(card => card.getBoundingClientRect()) : null;
    const elapsed = lastTime ? Math.min(50, time - lastTime) : 16.7;
    const ease = 1 - Math.exp(-elapsed / 140);
    let moving = false;
    lastTime = time;

    layers.forEach((layer, index) => {
      const nextTop = top + layer.nextOffset;
      const goal = Math.max(0, Math.min(1, (layer.start - nextTop) / layer.travel));
      const delta = goal - layer.depth;
      const depth = Math.abs(delta) < .002 ? goal : layer.depth + delta * ease;
      if (depth !== layer.depth) {
        layer.depth = depth;
        layer.card.style.setProperty('--offer-stack-depth', depth.toFixed(4));
      }
      if (bounds) {
        const previous = bounds[index];
        const incoming = bounds[index + 1];
        const overlap = Math.min(previous.bottom, incoming.bottom) - Math.max(previous.top, incoming.top);
        const contact = Math.max(0, Math.min(1, overlap / 56)).toFixed(3);
        if (contact !== layer.contact) {
          layer.contact = contact;
          cards[index + 1].style.setProperty('--offer-stack-contact', contact);
        }
      }
      moving ||= depth !== goal;
    });

    if (moving) schedule();
    else lastTime = 0;
  }

  function measure() {
    if (!motion.matches) {
      stop();
      layers = [];
      cards.forEach(card => {
        card.style.removeProperty('--offer-stack-depth');
        if (hasContactShadow) card.style.removeProperty('--offer-stack-contact');
      });
      return;
    }
    if (grid.querySelector('.offer-link:focus-visible, details[open]')) return;

    // Use untransformed flow sizes so the visual scale never feeds back into progress.
    const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
    const tops = cards.map(card => parseFloat(getComputedStyle(card).top) || 0);
    let offset = 0;
    layers = cards.slice(0, -1).map((card, index) => {
      const height = card.offsetHeight;
      offset += height + gap;
      const start = tops[index] + height + 72;
      return {
        card,
        nextOffset: offset,
        start,
        travel: Math.max(1, start - tops[index + 1]),
        depth: layers[index]?.depth ?? 0,
        contact: layers[index]?.contact
      };
    });
    schedule();
  }

  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) measure();
    else stop();
  }, { rootMargin: '180px 0px' }).observe(grid);

  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(grid);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  grid.addEventListener('toggle', measure, true);
  grid.addEventListener('focusout', () => requestAnimationFrame(measure));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else schedule();
  });
  motion.addEventListener('change', measure);
})();
