/* Play the portrait reel only while visible, with an explicit pause and a static first frame. */
(() => {
  const reel = document.querySelector('.service-reel');
  if (!reel) return;
  const video = reel.querySelector('video');
  const button = reel.querySelector('.service-reel__toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  let visible = !('IntersectionObserver' in window);
  let wantsPlayback = !reduced.matches && !saveData;

  function updateControl() {
    const playing = !video.paused;
    button.toggleAttribute('data-playing', playing);
    const label = playing ? 'Приостановить видео' : 'Воспроизвести видео';
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  function syncPlayback() {
    if (visible && wantsPlayback && !document.hidden) {
      video.play().catch(updateControl);
    } else {
      video.pause();
    }
  }

  button.addEventListener('click', () => {
    wantsPlayback = video.paused;
    syncPlayback();
  });
  video.addEventListener('playing', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', () => { button.hidden = true; });
  video.controls = false;
  button.hidden = false;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }).observe(reel);
  }
  reduced.addEventListener('change', () => {
    wantsPlayback = !reduced.matches && !saveData;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  syncPlayback();

  if (!reduced.matches && scrollY < 40 && Element.prototype.animate) {
    reel.closest('.service-opening').querySelectorAll('.hero-statement .type-line').forEach((line, index) => {
      line.animate(
        [{ opacity: .45, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 560, delay: index * 48, easing: 'cubic-bezier(.16,1,.3,1)' }
      );
    });
  }
})();


(() => {
  const index = document.querySelector('[data-section-index]');
  if (!index) return;
  const track = index.querySelector('#service-index-links');
  const button = index.querySelector('button[aria-controls]');
  const caption = button.querySelector('span');
  const pageName = caption.textContent;
  const compact = matchMedia('(max-width: 960px)');
  const links = [...track.querySelectorAll('a[href^="#"]')];
  const headings = links.map(link => document.getElementById(link.hash.slice(1)));
  const sections = headings.map(heading => heading.closest('[data-source-section]'));
  let offsets = [];
  let current = -1;
  let frame = 0;

  function update() {
    frame = 0;
    const line = scrollY + index.offsetHeight + Math.min(150, innerHeight * .22);
    const active = offsets.findIndex(bounds => bounds.top <= line && line < bounds.bottom);
    if (active === current) return;
    if (current >= 0) links[current].removeAttribute('aria-current');
    current = active;
    caption.textContent = current < 0 ? pageName : links[current].textContent;
    if (current < 0) return;
    const link = links[current];
    link.setAttribute('aria-current', 'location');
    if (!compact.matches && track.scrollWidth > track.clientWidth && !track.matches(':focus-within')) {
      const delta = link.getBoundingClientRect().left - track.getBoundingClientRect().left;
      if (delta < 0 || delta + link.offsetWidth > track.clientWidth) {
        track.scrollBy({left: delta - (track.clientWidth - link.offsetWidth) / 2, behavior: 'instant'});
      }
    }
  }
  function measure() {
    offsets = sections.map(section => {
      const rect = section.getBoundingClientRect();
      return {top: rect.top + scrollY, bottom: rect.bottom + scrollY};
    });
    update();
  }
  function revealTarget() {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    const fold = target?.closest('details');
    if (fold && !fold.open) fold.open = true;
  }
  function setMenu(open) {
    button.setAttribute('aria-expanded', String(open));
  }
  function layout() {
    const focusWasInMenu = track.contains(document.activeElement);
    button.hidden = !compact.matches;
    index.toggleAttribute('data-compact', compact.matches);
    setMenu(false);
    if (compact.matches && focusWasInMenu) button.focus({preventScroll:true});
    measure();
  }
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  track.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !compact.matches) return;
    setMenu(false);
    const target = document.getElementById(link.hash.slice(1));
    target.setAttribute('tabindex', '-1');
    target.focus({preventScroll:true});
  });
  index.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setMenu(false); button.focus({preventScroll:true});
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!index.contains(event.target)) setMenu(false);
  }, {passive:true});
  index.addEventListener('focusout', event => { if (!index.contains(event.relatedTarget)) setMenu(false); });
  compact.addEventListener('change', layout);
  layout();
  revealTarget();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  document.fonts?.ready.then(measure);
  addEventListener('resize', measure, { passive: true });
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('hashchange', revealTarget);
})();
