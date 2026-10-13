(() => {
  'use strict';
  if (document.body?.dataset.heroVariant !== 'dotfield') return;
  const stage = document.querySelector('.showreel-stage');
  const hero = stage?.querySelector('#hero');
  const title = hero?.querySelector('.hero-title');
  if (!stage || !hero || !title || hero.querySelector('.hero-dotfield-canvas')) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  canvas.className = 'hero-dotfield-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 999px), (hover: none), (pointer: coarse)');
  const lifetime = new AbortController();
  const passive = { passive: true, signal: lifetime.signal };
  const maxPoints = 2000;
  const maxPixels = 4000000;
  const scanDuration = 780;
  let bounds = { width: 0, height: 0, pageX: 0, pageY: 0 };
  let points = [];
  let baseColor = [124, 117, 109];
  let actionColor = [211, 67, 9];
  let frame = 0;
  let frameCount = 0;
  let inView = false;
  let titleInView = false;
  let measurePending = false;
  let scanStart = null;
  let scanDone = false;
  let lastTime = 0;
  let scanY = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 };

  function diagnose(reason) {
    const state = document.hidden ? 'hidden' : !inView ? 'offscreen' : reduced.matches ? 'reduced' : frame ? (scanStart !== null ? 'scan' : 'responding') : 'static';
    stage.dataset.dotfieldState = state;
    stage.dataset.dotfieldDiagnostics = JSON.stringify({ activeRAF: Boolean(frame), inView, pointCount: points.length, frameCount, reason });
  }

  function cancelFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function paint() {
    if (!bounds.width || !bounds.height) return;
    context.clearRect(0, 0, bounds.width, bounds.height);
    const radius = compact.matches ? 108 : 124;
    for (const point of points) {
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = dx * dx + dy * dy;
      const influence = pointer.strength && distance < radius * radius ? Math.pow(1 - Math.sqrt(distance) / radius, 2) * pointer.strength : 0;
      const mix = Math.min(1, influence * 1.55);
      const alpha = point.alpha * (.32 + influence * .48);
      context.fillStyle = `rgba(${Math.round(baseColor[0] + (actionColor[0] - baseColor[0]) * mix)},${Math.round(baseColor[1] + (actionColor[1] - baseColor[1]) * mix)},${Math.round(baseColor[2] + (actionColor[2] - baseColor[2]) * mix)},${alpha.toFixed(3)})`;
      context.beginPath();
      context.arc(point.x, point.y, 1.15 + influence * 2, 0, Math.PI * 2);
      context.fill();
    }
    frameCount += 1;
  }

  function stop(reason, repaint = true) {
    cancelFrame();
    scanStart = null;
    pointer.strength = 0;
    pointer.targetStrength = 0;
    if (repaint) paint();
    diagnose(reason);
  }

  function queue(reason) {
    if (frame || !inView || document.hidden || reduced.matches || !points.length) return;
    frame = requestAnimationFrame(tick);
    diagnose(reason);
  }

  function tick(time) {
    frame = 0;
    if (!inView || document.hidden || reduced.matches) { stop('inactive'); return; }
    const delta = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    if (scanStart !== null) {
      const progress = Math.min(1, (time - scanStart) / scanDuration);
      pointer.x = -124 + (bounds.width + 248) * progress;
      pointer.y = scanY;
      pointer.strength = .58 * Math.sin(progress * Math.PI);
      paint();
      if (progress < 1) queue('scan');
      else stop('scan-complete');
      return;
    }
    const ease = 1 - Math.exp(-delta / 66);
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;
    pointer.strength += (pointer.targetStrength - pointer.strength) * ease;
    const unsettled = Math.abs(pointer.targetX - pointer.x) + Math.abs(pointer.targetY - pointer.y) > .12 || Math.abs(pointer.targetStrength - pointer.strength) > .002;
    if (!unsettled) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      pointer.strength = pointer.targetStrength;
      lastTime = 0;
    }
    paint();
    if (unsettled) queue('pointer-settling');
    else diagnose('pointer-settled');
  }

  function maybeScan() {
    if (scanDone || !compact.matches || reduced.matches || !inView || !titleInView || document.hidden || !points.length) return;
    scanDone = true;
    scanStart = performance.now();
    queue('scan-start');
  }

  function measure() {
    const rect = hero.getBoundingClientRect();
    bounds = { width: rect.width, height: rect.height, pageX: rect.left + scrollX, pageY: rect.top + scrollY };
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(1.5, devicePixelRatio || 1, Math.sqrt(maxPixels / (bounds.width * bounds.height)));
    canvas.width = Math.max(1, Math.round(bounds.width * dpr));
    canvas.height = Math.max(1, Math.round(bounds.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const styles = getComputedStyle(canvas);
    const color = styles.color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (color?.length === 3) actionColor = color;
    const base = styles.getPropertyValue('--dotfield-base').split(',').map(Number);
    if (base.length === 3 && base.every(Number.isFinite)) baseColor = base;
    const masks = [...hero.querySelectorAll('.hero-title, .hero-copy, .hero-facts')].map(element => {
      const box = element.getBoundingClientRect();
      return { left: box.left - rect.left - 18, right: box.right - rect.left + 18, top: box.top - rect.top - 14, bottom: box.bottom - rect.top + 14 };
    });
    const heading = title.getBoundingClientRect();
    scanY = Math.min(bounds.height, heading.top - rect.top + heading.height * .7);
    // Increase spacing on unusually large canvases instead of spending more frames.
    const spacing = Math.max(34, Math.sqrt(bounds.width * bounds.height / (maxPoints - 160)));
    points = [];
    for (let y = spacing / 2; y < bounds.height && points.length < maxPoints; y += spacing) {
      for (let x = spacing / 2; x < bounds.width && points.length < maxPoints; x += spacing) {
        const underText = masks.some(mask => x >= mask.left && x <= mask.right && y >= mask.top && y <= mask.bottom);
        const edge = Math.min(1, x / 40, (bounds.width - x) / 40, (bounds.height - y) / 90);
        points.push({ x, y, alpha: Math.max(0, edge) * (underText ? .17 : 1) });
      }
    }
    paint();
    diagnose('measured');
    maybeScan();
  }

  function scheduleMeasure() {
    if (measurePending) return;
    measurePending = true;
    queueMicrotask(() => {
      measurePending = false;
      if (!lifetime.signal.aborted) measure();
    });
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || compact.matches || reduced.matches || document.hidden || !inView) return;
    pointer.targetX = event.clientX + scrollX - bounds.pageX;
    pointer.targetY = event.clientY + scrollY - bounds.pageY;
    if (!pointer.strength) { pointer.x = pointer.targetX; pointer.y = pointer.targetY; }
    pointer.targetStrength = 1;
    queue('pointer-move');
  }

  function onPointerLeave() {
    if (compact.matches || reduced.matches) return;
    pointer.targetStrength = 0;
    queue('pointer-leave');
  }

  function onPreference() {
    stop('preference-change');
    measure();
    maybeScan();
  }

  function onVisibility() {
    if (document.hidden) stop('hidden');
    else { measure(); maybeScan(); }
  }

  hero.addEventListener('pointermove', onPointerMove, passive);
  hero.addEventListener('pointerleave', onPointerLeave, passive);
  document.addEventListener('visibilitychange', onVisibility, { signal: lifetime.signal });
  window.addEventListener('resize', scheduleMeasure, passive);
  reduced.addEventListener('change', onPreference, { signal: lifetime.signal });
  compact.addEventListener('change', onPreference, { signal: lifetime.signal });

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
      else { diagnose('visible'); maybeScan(); }
    }, { threshold: 0 });
    titleObserver = new IntersectionObserver(entries => {
      titleInView = entries[0].isIntersecting;
      maybeScan();
    }, { threshold: .15 });
    heroObserver.observe(hero);
    titleObserver.observe(title);
  } else {
    const rect = title.getBoundingClientRect();
    inView = titleInView = rect.bottom > 0 && rect.top < innerHeight;
    window.addEventListener('scroll', () => {
      const box = hero.getBoundingClientRect();
      inView = box.bottom > 0 && box.top < innerHeight;
      if (!inView) stop('offscreen-fallback');
    }, passive);
  }

  window.addEventListener('pagehide', event => {
    stop('pagehide', false);
    if (event.persisted) return;
    lifetime.abort();
    resizeObserver?.disconnect();
    heroObserver?.disconnect();
    titleObserver?.disconnect();
  }, { signal: lifetime.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) { measure(); maybeScan(); } }, { signal: lifetime.signal });
  document.fonts?.ready.then(() => { if (!lifetime.signal.aborted) scheduleMeasure(); });
  measure();
})();
