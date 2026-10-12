(() => {
  'use strict';
  const stage = document.querySelector('.showreel-stage');
  if (!stage) return;
  const origin = stage.querySelector('.hero-reel-slot');
  const runway = stage.querySelector('.showreel-runway');
  const player = stage.querySelector('.showreel-player');
  const video = player.querySelector('video');
  const button = player.querySelector('.showreel-control');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Matches the breakpoint where the hero gains its second column.
  const desktopLayout = matchMedia('(min-width: 1000px)');
  let geometry;
  let frame = 0;
  let lastProgress = -1;
  let inView = false;
  let userPaused = false;

  // The same player stays in normal flow on compact screens and expands on desktop.
  video.controls = false;
  button.hidden = false;

  function paint() {
    frame = 0;
    if (!geometry || !desktopLayout.matches) return;
    const g = geometry;
    let p = reduced.matches ? 0 : Math.min(1, Math.max(0, (scrollY - g.start) / Math.max(1, g.end - g.start)));
    if (p === lastProgress) return;
    lastProgress = p;
    const eased = p * p * (3 - 2 * p);
    const x = g.ox + (g.tx - g.ox) * eased;
    const y = g.oy + (g.ty - g.oy) * eased;
    const s = g.startScale + (1 - g.startScale) * eased;
    player.style.setProperty('--reel-x', `${x.toFixed(2)}px`);
    player.style.setProperty('--reel-y', `${y.toFixed(2)}px`);
    player.style.setProperty('--reel-scale', s.toFixed(5));
    player.style.setProperty('--reel-inverse', (1 / s).toFixed(5));
    player.style.setProperty('--reel-radius', `${(20 * (1 - eased)).toFixed(2)}px`);
    stage.dataset.reelProgress = p.toFixed(3);
    stage.style.setProperty('--reel-proof-opacity', String(Math.max(0, 1 - Math.max(0, p - .12) / .32)));
    stage.toggleAttribute('data-expanded', p >= .44);
    stage.toggleAttribute('data-settled', p === 0 || p === 1 || reduced.matches);
  }
  function queue() { if (geometry && !frame) frame = requestAnimationFrame(paint); }
  function measure() {
    stage.toggleAttribute('data-reduced', reduced.matches);
    if (!desktopLayout.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      geometry = null;
      lastProgress = -1;
      stage.removeAttribute('data-enhanced');
      stage.removeAttribute('data-expanded');
      stage.removeAttribute('data-settled');
      delete stage.dataset.reelProgress;
      stage.style.removeProperty('--reel-proof-opacity');
      ['--reel-x', '--reel-y', '--reel-scale', '--reel-inverse', '--reel-radius'].forEach(name => player.style.removeProperty(name));
      ['--reel-width', '--reel-height'].forEach(name => stage.style.removeProperty(name));
      if (player.parentElement !== origin) origin.append(player);
      playback();
      return;
    }
    if (player.parentElement !== stage) stage.append(player);
    stage.dataset.enhanced = '';
    const base = stage.getBoundingClientRect();
    const rect = origin.getBoundingClientRect();
    const palette = document.querySelector('.palette-bar:not([hidden])');
    const toolbar = palette?.getBoundingClientRect().height || 0;
    const availableHeight = Math.max(180, innerHeight - toolbar - 24);
    const width = reduced.matches ? rect.width : Math.min(document.documentElement.clientWidth, availableHeight * 16 / 9);
    const height = width * 9 / 16;
    stage.style.setProperty('--reel-width', `${width}px`);
    stage.style.setProperty('--reel-height', `${height}px`);
    const destination = runway.getBoundingClientRect();
    const originalPageY = rect.top + scrollY;
    const destinationPageY = destination.top + scrollY + 40;
    const viewportTop = toolbar + Math.max(12, (innerHeight - toolbar - height) / 2);
    const start = Math.max(0, originalPageY - innerHeight * .7);
    geometry = {
      ox: rect.left - base.left,
      oy: rect.top - base.top,
      tx: (base.width - width) / 2,
      ty: reduced.matches ? rect.top - base.top : destination.top - base.top + 40,
      start,
      end: Math.max(start + innerHeight * .45, destinationPageY - viewportTop),
      startScale: rect.width / width
    };
    lastProgress = -1;
    paint();
    playback();
  }
  function syncButton() {
    const playing = !video.paused && !video.ended;
    player.toggleAttribute('data-playing', playing);
    button.setAttribute('aria-label', playing ? 'Приостановить шоурил' : 'Воспроизвести шоурил');
  }
  function playback() {
    if (inView && !document.hidden && !userPaused && !reduced.matches) video.play().catch(syncButton);
    else video.pause();
  }
  button.addEventListener('click', () => {
    if (video.paused) { userPaused = false; video.play().catch(syncButton); }
    else { userPaused = true; video.pause(); }
  });
  video.addEventListener('play', syncButton);
  video.addEventListener('pause', syncButton);
  video.addEventListener('ended', syncButton);
  video.addEventListener('error', () => { video.controls = true; button.hidden = true; });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', playback);
  reduced.addEventListener('change', () => { measure(); playback(); });
  desktopLayout.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(origin);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; playback(); }, { threshold: .08 }).observe(player);
  } else { inView = true; playback(); }
  document.fonts?.ready.then(measure);
  measure();
  syncButton();
})();
