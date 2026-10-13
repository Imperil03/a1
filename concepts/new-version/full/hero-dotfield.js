(() => {
  'use strict';
  if (document.body?.dataset.heroVariant !== 'dotfield') return;
  const stage = document.querySelector('.showreel-stage');
  const hero = stage?.querySelector('#hero');
  const title = hero?.querySelector('.hero-title');
  const video = stage?.querySelector('.showreel-player video');
  if (!stage || !hero || !title || hero.querySelector('.hero-dotfield-canvas')) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  canvas.className = 'hero-dotfield-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  // Match the supplied Quordix mechanics. The established A1 surface stays underneath.
  const SPACING = 30;
  const BASE_R = 1.5;
  const HOVER_R = 100;
  const SCAN_DUR = 2500;
  const SCAN_PAUSE = 4000;
  const DEFAULT_COLOR = 'rgba(148,163,184,0.4)';
  const ACTIVE_COLOR = '#ff5500';
  const PARTICLE_COLOR = 'rgba(249,115,22,0.15)';
  const maxPoints = 4096;
  const maxPixels = 4000000;
  const frameInterval = 1000 / 60;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lifetime = new AbortController();
  const passive = { passive: true, signal: lifetime.signal };
  let bounds = { width: 0, height: 0, pageX: 0, pageY: 0 };
  let view = { top: -1, width: 0, height: 0, dpr: 1 };
  let points = [];
  let particles = [];
  let frame = 0;
  let frameCount = 0;
  let inView = false;
  let titleInView = false;
  let measurePending = false;
  let viewPending = false;
  let pagePaused = false;
  // The existing reel control also stops the decorative motion, without a second button.
  // Start ungated while the muted reel is loading; its real pause/play events take over.
  let videoPaused = false;
  let lastPaint = 0;
  let lastUpdate = 0;
  let activeTime = 0;
  let spacing = SPACING;
  const pointer = { x: -1000, y: -1000 };

  function canRun() {
    return !lifetime.signal.aborted && !pagePaused && !videoPaused && inView && !document.hidden && !reduced.matches && !connection?.saveData;
  }

  function diagnose(reason) {
    const state = pagePaused ? 'paused' : document.hidden ? 'hidden' : !inView ? 'offscreen' : reduced.matches ? 'reduced' : connection?.saveData ? 'data-saving' : videoPaused ? 'video-paused' : frame ? 'running' : 'static';
    // The text glitch follows title visibility; the field can remain active behind the reel.
    stage.dataset.dotfieldMotion = canRun() && titleInView && Boolean(frame) ? 'running' : 'paused';
    stage.dataset.dotfieldState = state;
    stage.dataset.dotfieldDiagnostics = JSON.stringify({ activeRAF: Boolean(frame), inView, titleInView, videoPaused, pointCount: points.length, particleCount: particles.length, frameCount, mobile: mobile.matches, spacing, baseRadius: BASE_R, hoverRadius: HOVER_R, activeTime: Math.round(activeTime), reason });
  }

  function cancelFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastPaint = 0;
    lastUpdate = 0;
  }

  function resizeParticles(previous) {
    const count = mobile.matches ? 12 : 40;
    if (particles.length !== count || !previous.width || !previous.height) {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * view.width,
        y: Math.random() * view.height,
        vx: (Math.random() - .5) * .5,
        vy: (Math.random() - .5) * .5,
        size: Math.random() * 2
      }));
    } else if (previous.width !== view.width || previous.height !== view.height) {
      for (const particle of particles) {
        particle.x *= view.width / previous.width;
        particle.y *= view.height / previous.height;
      }
    }
  }

  function updateView() {
    if (!bounds.width || !bounds.height) return false;
    // Keep only the visible slice in the bitmap; the grid is still anchored to the hero.
    const top = Math.max(0, Math.min(bounds.height, scrollY - bounds.pageY));
    const bottom = Math.min(bounds.height, scrollY + innerHeight - bounds.pageY);
    const visibleHeight = bottom > top ? bottom - top : Math.min(bounds.height, innerHeight);
    const width = bounds.width;
    const height = Math.max(1, visibleHeight);
    const dpr = Math.min(1.5, devicePixelRatio || 1, Math.sqrt(maxPixels / (width * height)));
    if (top === view.top && width === view.width && height === view.height && dpr === view.dpr) {
      if (particles.length !== (mobile.matches ? 12 : 40)) resizeParticles(view);
      return false;
    }
    const previous = view;
    view = { top, width, height, dpr };
    canvas.style.top = `${top}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = Math.max(SPACING, Math.sqrt(width * height / (maxPoints - 200)));
    points = [];
    const firstY = Math.ceil(top / spacing) * spacing - top;
    for (let x = 0; x < width && points.length < maxPoints; x += spacing) {
      for (let y = firstY; y < height && points.length < maxPoints; y += spacing) points.push({ x, y });
    }
    resizeParticles(previous);
    return true;
  }

  function paint(staticOnly = false, delta = 0) {
    if (!view.width || !view.height) return;
    context.clearRect(0, 0, view.width, view.height);
    context.shadowBlur = 0;
    context.shadowColor = 'transparent';
    context.fillStyle = PARTICLE_COLOR;
    for (const particle of particles) {
      if (!staticOnly) {
        particle.x += particle.vx * delta * 60 / 1000;
        particle.y += particle.vy * delta * 60 / 1000;
        if (particle.x < 0 || particle.x > view.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > view.height) particle.vy *= -1;
        particle.x = Math.max(0, Math.min(view.width, particle.x));
        particle.y = Math.max(0, Math.min(view.height, particle.y));
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
    // Draw the unchanged grid in one path, then cover active dots with opaque orange.
    context.fillStyle = DEFAULT_COLOR;
    context.beginPath();
    for (const point of points) {
      context.moveTo(point.x + BASE_R, point.y);
      context.arc(point.x, point.y, BASE_R, 0, Math.PI * 2);
    }
    context.fill();
    if (!staticOnly) {
      const loopTime = activeTime % (SCAN_DUR + SCAN_PAUSE);
      const scanY = Math.min(loopTime / SCAN_DUR, 1) * (view.height + HOVER_R * 2) - HOVER_R;
      const mouseY = pointer.y - view.top;
      context.fillStyle = ACTIVE_COLOR;
      context.shadowBlur = mobile.matches ? 0 : 15;
      context.shadowColor = mobile.matches ? 'transparent' : 'rgba(255,85,0,0.4)';
      for (const point of points) {
        const dx = point.x - pointer.x;
        const dy = point.y - mouseY;
        const distance = mobile.matches ? Math.abs(point.y - scanY) : Math.sqrt(dx * dx + dy * dy);
        if (distance >= HOVER_R) continue;
        const strength = 1 - distance / HOVER_R;
        context.beginPath();
        context.arc(point.x, point.y, BASE_R + strength * (mobile.matches ? 2 : 3), 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;
      context.shadowColor = 'transparent';
    }
    frameCount += 1;
  }

  function stop(reason, repaint = true) {
    cancelFrame();
    pointer.x = pointer.y = -1000;
    if (repaint) { updateView(); paint(true); }
    diagnose(reason);
  }

  function queue(reason) {
    if (frame || !canRun() || !points.length) { diagnose(reason); return; }
    frame = requestAnimationFrame(tick);
    diagnose(reason);
  }

  function tick(time) {
    frame = 0;
    if (!canRun()) { stop('inactive'); return; }
    if (!lastPaint) lastPaint = time - frameInterval;
    const elapsed = time - lastPaint;
    if (elapsed + .01 >= frameInterval) {
      const delta = lastUpdate ? Math.min(50, time - lastUpdate) : frameInterval;
      lastPaint = time - elapsed % frameInterval;
      lastUpdate = time;
      activeTime += delta;
      updateView();
      paint(false, delta);
    }
    queue('animation');
  }

  function measure() {
    const rect = hero.getBoundingClientRect();
    bounds = { width: rect.width, height: rect.height, pageX: rect.left + scrollX, pageY: rect.top + scrollY };
    updateView();
    paint(!canRun());
    queue('measured');
  }

  function scheduleMeasure() {
    if (measurePending) return;
    measurePending = true;
    queueMicrotask(() => {
      measurePending = false;
      if (!lifetime.signal.aborted) measure();
    });
  }

  function onScroll() {
    if (!('IntersectionObserver' in window)) {
      inView = bounds.pageY + bounds.height > scrollY && bounds.pageY < scrollY + innerHeight;
      const rect = title.getBoundingClientRect();
      titleInView = rect.bottom > 0 && rect.top < innerHeight;
    }
    if (canRun()) { queue('scroll'); return; }
    if (viewPending || !inView) { diagnose('scroll-paused'); return; }
    viewPending = true;
    queueMicrotask(() => {
      viewPending = false;
      if (!lifetime.signal.aborted && inView) { updateView(); paint(true); diagnose('scroll-static'); }
    });
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || mobile.matches || !canRun()) return;
    pointer.x = event.clientX + scrollX - bounds.pageX;
    pointer.y = event.clientY + scrollY - bounds.pageY;
    queue('pointer-move');
  }

  function onPointerLeave() {
    pointer.x = pointer.y = -1000;
  }

  function onPreference() {
    stop('preference-change');
    activeTime = 0;
    particles = [];
    measure();
  }

  function onVisibility() {
    if (document.hidden) stop('hidden');
    else measure();
  }

  function onVideoPause() {
    videoPaused = true;
    stop('video-pause');
  }

  function onVideoPlay() {
    videoPaused = false;
    measure();
  }

  hero.addEventListener('pointermove', onPointerMove, passive);
  hero.addEventListener('pointerleave', onPointerLeave, passive);
  document.addEventListener('visibilitychange', onVisibility, { signal: lifetime.signal });
  window.addEventListener('resize', scheduleMeasure, passive);
  window.addEventListener('scroll', onScroll, passive);
  reduced.addEventListener('change', onPreference, { signal: lifetime.signal });
  mobile.addEventListener('change', onPreference, { signal: lifetime.signal });
  connection?.addEventListener?.('change', onPreference, { signal: lifetime.signal });
  video?.addEventListener('pause', onVideoPause, { signal: lifetime.signal });
  video?.addEventListener('play', onVideoPlay, { signal: lifetime.signal });

  let resizeObserver;
  let heroObserver;
  let titleObserver;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(hero);
    resizeObserver.observe(title);
  }
  if ('IntersectionObserver' in window) {
    heroObserver = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView) stop('offscreen');
      else queue('visible');
    }, { threshold: 0 });
    titleObserver = new IntersectionObserver(entries => {
      titleInView = entries[0].isIntersecting;
      diagnose('title-visibility');
    }, { threshold: .15 });
    heroObserver.observe(hero);
    titleObserver.observe(title);
  } else {
    const rect = title.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    inView = heroRect.bottom > 0 && heroRect.top < innerHeight;
    titleInView = rect.bottom > 0 && rect.top < innerHeight;
  }

  window.addEventListener('pagehide', event => {
    pagePaused = true;
    stop('pagehide', false);
    if (event.persisted) return;
    lifetime.abort();
    resizeObserver?.disconnect();
    heroObserver?.disconnect();
    titleObserver?.disconnect();
  }, { signal: lifetime.signal });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    pagePaused = false;
    measure();
  }, { signal: lifetime.signal });
  document.fonts?.ready.then(() => { if (!lifetime.signal.aborted) scheduleMeasure(); });
  measure();
})();
