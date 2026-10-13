(() => {
  'use strict';
  const root = document.querySelector('.type-study');
  if (!root || new URLSearchParams(location.search).get('delight') === 'off') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(min-width: 760px) and (hover: hover) and (pointer: fine)');
  const ease = 'cubic-bezier(.16, 1, .3, 1)';
  const running = new Map();
  const properties = ['--delight-x', '--delight-y', '--delight-rx', '--delight-ry', '--delight-scale'];
  let activeCard = null;
  let frame = 0;
  let pointer = null;
  let pendingArrival = null;
  let arrivalMark = null;

  function stop(target) {
    const animation = running.get(target);
    if (!animation) return;
    running.delete(target);
    animation.cancel();
  }

  function play(target, keyframes, duration, finished = () => {}) {
    if (typeof target?.animate !== 'function' || document.hidden) return;
    stop(target);
    const animation = target.animate(keyframes, { duration, easing: ease });
    running.set(target, animation);
    const cleanup = () => {
      if (running.get(target) === animation) running.delete(target);
      finished();
    };
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
  }

  function resetCard() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (activeCard) {
      activeCard.removeAttribute('data-a1-tracking');
      properties.forEach(name => activeCard.style.removeProperty(name));
    }
    activeCard = null;
    pointer = null;
  }

  function paintCard() {
    frame = 0;
    if (!activeCard || !pointer) return;
    const rect = activeCard.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (pointer.x - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (pointer.y - rect.top) / rect.height * 2 - 1));
    activeCard.style.setProperty('--delight-x', `${(x * 6).toFixed(2)}px`);
    activeCard.style.setProperty('--delight-y', `${(y * 4 - 4).toFixed(2)}px`);
    activeCard.style.setProperty('--delight-rx', `${(-y * 3).toFixed(2)}deg`);
    activeCard.style.setProperty('--delight-ry', `${(x * 4).toFixed(2)}deg`);
    activeCard.style.setProperty('--delight-scale', '1.035');
  }

  function trackCard(card, event) {
    if (!fine.matches || reduced.matches || event.pointerType !== 'mouse') return;
    if (activeCard !== card) resetCard();
    activeCard = card;
    card.dataset.a1Tracking = '';
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(paintCard);
  }

  // The existing first-case video already owns the focal motion; it is excluded.
  root.querySelectorAll('.case-tile:not(.case-motion-card)').forEach(card => {
    if (card.closest('.case-motion-card') || !card.querySelector('.case-art')) return;
    card.dataset.a1Depth = '';
    card.addEventListener('pointerenter', event => trackCard(card, event), { passive: true });
    card.addEventListener('pointermove', event => trackCard(card, event), { passive: true });
    card.addEventListener('pointerleave', () => { if (activeCard === card) resetCard(); });
    card.addEventListener('pointercancel', () => { if (activeCard === card) resetCard(); });
  });

  // Reuse the actual A1 link arrow. Other icons and media controls are untouched.
  root.querySelectorAll('a').forEach(link => {
    const path = link.querySelector(':scope > svg > path');
    if (!path || path.getAttribute('d')?.replace(/\s/g, '') !== 'M519195M65h13v13') return;
    link.dataset.a1Launch = '';
    function launch() {
      const frames = reduced.matches
        ? [{ opacity: .55 }, { opacity: 1 }]
        : [{ transform: 'translate(0, 0)', opacity: 1 },
          { transform: 'translate(12px, -12px)', opacity: 0, offset: .44 },
          { transform: 'translate(-12px, 12px)', opacity: 0, offset: .45 },
          { transform: 'translate(0, 0)', opacity: 1 }];
      play(path, frames, reduced.matches ? 100 : 340);
    }
    link.addEventListener('pointerenter', event => {
      if (fine.matches && event.pointerType === 'mouse') launch();
    }, { passive: true });
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) launch(); });
    link.addEventListener('pointerleave', () => stop(path));
    link.addEventListener('blur', () => stop(path));
  });

  function clearArrival() {
    arrivalObserver?.disconnect();
    pendingArrival = null;
    if (arrivalMark) {
      const mark = arrivalMark;
      arrivalMark = null;
      stop(mark);
      mark.parentElement?.classList.remove('a1-arrival-heading');
      mark.remove();
    }
  }

  function markArrival(heading) {
    clearArrival();
    if (typeof heading.animate !== 'function') return;
    const mark = document.createElement('span');
    mark.className = 'a1-arrival-rule';
    mark.setAttribute('aria-hidden', 'true');
    heading.classList.add('a1-arrival-heading');
    heading.append(mark);
    arrivalMark = mark;
    const frames = reduced.matches
      ? [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0 }]
      : [{ transform: 'scaleX(0)', opacity: 0 },
        { transform: 'scaleX(1)', opacity: 1, offset: .35 },
        { transform: 'scaleX(1)', opacity: 1, offset: .75 },
        { transform: 'scaleX(1)', opacity: 0 }];
    play(mark, frames, reduced.matches ? 600 : 1000, () => {
      mark.remove();
      if (!heading.querySelector('.a1-arrival-rule')) heading.classList.remove('a1-arrival-heading');
      if (arrivalMark === mark) arrivalMark = null;
    });
  }

  const arrivalObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === pendingArrival && item.isIntersecting);
      if (entry) markArrival(entry.target);
    }, { threshold: .55 })
    : null;

  root.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || !arrivalObserver) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id === 'top' ? 'hero' : id);
    const heading = target?.querySelector('h2') || target?.querySelector('h1');
    if (!heading) return;
    clearArrival();
    pendingArrival = heading;
    arrivalObserver.observe(heading);
  });

  function cancelAll() {
    resetCard();
    clearArrival();
    [...running.keys()].forEach(stop);
  }
  function preferenceChanged() {
    cancelAll();
    root.dataset.a1DelightMotion = reduced.matches ? 'reduced' : 'full';
  }
  reduced.addEventListener('change', preferenceChanged);
  fine.addEventListener('change', resetCard);
  window.addEventListener('scroll', resetCard, { passive: true });
  window.addEventListener('resize', resetCard, { passive: true });
  window.addEventListener('blur', cancelAll);
  window.addEventListener('pagehide', cancelAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
  root.dataset.a1Delight = 'ready';
  root.dataset.a1DelightMotion = reduced.matches ? 'reduced' : 'full';
})();
