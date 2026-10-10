(() => {
  'use strict';
  const hero = document.querySelector('.home-hero--flow');
  const visual = hero?.querySelector('.hero-visual');
  const art = visual?.querySelector('.hero-visual-motion');
  const sculpture = visual?.querySelector('.hero-sculpture');
  const sheen = visual?.querySelector('.hero-sheen');
  const image = visual?.querySelector('img');
  if (!art || !sculpture || !sheen || !image) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(min-width: 600px) and (hover: hover) and (pointer: fine)');
  let visible = false;
  let started = false;
  let loaded = false;
  let frame = 0;
  let lastTime = 0;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let bounds;
  let intro;
  let highlight;
  function paint() {
    art.style.setProperty('--hero-x', `${(currentX * 24).toFixed(2)}px`);
    art.style.setProperty('--hero-y', `${(currentY * 16).toFixed(2)}px`);
    art.style.setProperty('--hero-rx', `${(-currentY * 5).toFixed(2)}deg`);
    art.style.setProperty('--hero-ry', `${(currentX * 7).toFixed(2)}deg`);
    art.style.setProperty('--hero-rz', `${(currentX * 1.5).toFixed(2)}deg`);
    art.style.setProperty('--hero-light', `${(50 + currentX * 35).toFixed(2)}%`);
  }
  function tick(time) {
    const dt = Math.min((time - (lastTime || time - 16.67)) / 16.67, 3);
    lastTime = time;
    const follow = 1 - Math.exp(-.11 * dt);
    currentX += (targetX - currentX) * follow;
    currentY += (targetY - currentY) * follow;
    const settled = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) < .001;
    if (settled) { currentX = targetX; currentY = targetY; }
    paint();
    if (!settled) frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      lastTime = 0;
      delete visual.dataset.motionActive;
      if (!targetX && !targetY) delete visual.dataset.lightActive;
    }
  }
  function follow() {
    if (frame) return;
    visual.dataset.motionActive = '';
    frame = requestAnimationFrame(tick);
  }
  function rest(immediate = false) {
    targetX = targetY = 0;
    bounds = undefined;
    if (immediate) {
      cancelAnimationFrame(frame);
      frame = lastTime = 0;
      currentX = currentY = 0;
      delete visual.dataset.motionActive;
      delete visual.dataset.lightActive;
      paint();
    } else if (currentX || currentY) follow();
    else delete visual.dataset.lightActive;
  }
  function stop() {
    intro?.cancel();
    highlight?.cancel();
    delete visual.dataset.introActive;
    rest(true);
  }
  function enter() {
    if (started || !loaded || !visible || document.hidden || reduced.matches || !sculpture.animate) return;
    started = true;
    const angle = parseFloat(getComputedStyle(visual).getPropertyValue('--hero-rest-angle')) || 8;
    const desktop = fine.matches;
    visual.dataset.introActive = '';
    intro = sculpture.animate([
      { transform: `translate3d(${desktop ? 24 : 10}px, ${desktop ? 52 : 24}px, 0) rotate(${angle + (desktop ? 10 : 5)}deg) scale(.94)`, filter: 'blur(2px)', opacity: .75 },
      { transform: `translate3d(0, 0, 0) rotate(${angle}deg) scale(1)`, filter: 'blur(0px)', opacity: 1 }
    ], { duration: 780, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    highlight = sheen.animate([
      { backgroundPosition: '150% 0', opacity: 0 },
      { backgroundPosition: '105% 0', opacity: .85, offset: .22 },
      { backgroundPosition: '-40% 0', opacity: .55, offset: .82 },
      { backgroundPosition: '-65% 0', opacity: 0 }
    ], { duration: 900, delay: 100, easing: 'ease-out' });
    intro.finished.then(() => { delete visual.dataset.introActive; }).catch(() => {});
    highlight.finished.catch(() => {});
  }
  hero.addEventListener('pointermove', event => {
    if (!visible || document.hidden || reduced.matches || !fine.matches || event.pointerType !== 'mouse') return;
    bounds ||= hero.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    visual.dataset.lightActive = '';
    follow();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => rest());
  window.addEventListener('scroll', () => { bounds = undefined; }, { passive: true });
  window.addEventListener('resize', () => rest(true), { passive: true });
  fine.addEventListener('change', () => rest(true));
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); else enter(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else enter(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) enter(); else stop();
    }, { threshold: .08 }).observe(visual);
  } else { visible = true; }
  function ready() { loaded = image.naturalWidth > 0; enter(); }
  if (image.complete) ready();
  else image.addEventListener('load', ready, { once: true });
})();
