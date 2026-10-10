(() => {
  'use strict';
  const hero = document.querySelector('.home-hero--flow');
  const art = hero?.querySelector('.hero-visual-motion');
  if (!art) return;
  const motion = matchMedia('(min-width: 1000px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  let x = 0;
  let y = 0;
  function render() {
    art.style.setProperty('--hero-x', `${x}px`);
    art.style.setProperty('--hero-y', `${y}px`);
    frame = 0;
  }
  function reset() {
    cancelAnimationFrame(frame);
    x = 0;
    y = 0;
    render();
  }
  hero.addEventListener('pointermove', event => {
    if (!motion.matches || event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - .5) * 22;
    y = ((event.clientY - rect.top) / rect.height - .5) * 16;
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  hero.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
