/* Decorative Quordix slice copies are hidden from the accessibility tree.
   CSS owns the source's 7 s cycle. When points are hidden, visibility and the
   existing reel control gate that cycle without creating a canvas or RAF. */
(() => {
  'use strict';
  if (document.body?.dataset.heroVariant !== 'dotfield') return;
  const accent = document.querySelector('#hero .hero-statement .type-line--accent');
  if (!accent || accent.querySelector('.hero-dotfield-glitch')) return;

  const words = accent.textContent.replace(/\s+/g, ' ').trim();
  if (!words) return;
  const decoration = document.createElement('span');
  decoration.className = 'hero-dotfield-glitch';
  decoration.setAttribute('aria-hidden', 'true');
  decoration.dataset.text = words;
  accent.append(decoration);

  // In the original point-field variant the canvas controller still owns this state.
  if (document.body.dataset.heroPoints !== 'hidden') return;
  const stage = document.querySelector('.showreel-stage');
  const title = document.querySelector('#hero .hero-title');
  const video = stage?.querySelector('.showreel-player video');
  if (!stage || !title) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lifetime = new AbortController();
  const options = { signal: lifetime.signal };
  const passive = { passive: true, signal: lifetime.signal };
  let titleInView = false;
  let pagePaused = false;
  // Allow the effect while the muted reel initially loads, as the point-field did.
  let videoPaused = false;
  let titleObserver;

  function sync(reason) {
    const state = pagePaused ? 'paused' : document.hidden ? 'hidden' : !titleInView ? 'offscreen' : reduced.matches ? 'reduced' : connection?.saveData ? 'data-saving' : videoPaused ? 'video-paused' : 'running';
    const motion = !lifetime.signal.aborted && state === 'running' ? 'running' : 'paused';
    if (stage.dataset.dotfieldMotion !== motion) stage.dataset.dotfieldMotion = motion;
    stage.dataset.dotfieldState = state;
    stage.dataset.dotfieldDiagnostics = JSON.stringify({
      pointsHidden: true, activeRAF: false, pointCount: 0, particleCount: 0,
      titleInView, videoPaused, cssLoop: motion === 'running', reason
    });
  }

  function measureTitle(reason) {
    const rect = title.getBoundingClientRect();
    titleInView = rect.bottom > 0 && rect.top < innerHeight;
    sync(reason);
  }

  if ('IntersectionObserver' in window) {
    titleObserver = new IntersectionObserver(entries => {
      titleInView = entries[0].isIntersecting;
      sync('title-visibility');
    }, { threshold: .15 });
    titleObserver.observe(title);
  } else {
    window.addEventListener('scroll', () => measureTitle('scroll'), passive);
    window.addEventListener('resize', () => measureTitle('resize'), passive);
  }

  reduced.addEventListener('change', () => sync('preference-change'), options);
  connection?.addEventListener?.('change', () => sync('connection-change'), options);
  document.addEventListener('visibilitychange', () => measureTitle('visibility-change'), options);
  video?.addEventListener('pause', () => { videoPaused = true; sync('video-pause'); }, options);
  video?.addEventListener('play', () => { videoPaused = false; measureTitle('video-play'); }, options);
  window.addEventListener('pagehide', event => {
    pagePaused = true;
    sync('pagehide');
    if (event.persisted) return;
    lifetime.abort();
    titleObserver?.disconnect();
  }, options);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    pagePaused = false;
    measureTitle('pageshow');
  }, options);
  measureTitle('initialized');
})();
