(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  if (query.get('playful') === 'off' || query.get('particles') === 'off') return;
  const heading = document.querySelector('.type-study #contact-title');
  const container = heading?.closest('.contact-intro');
  if (!heading || !container || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 759px)');
  let canvas = null, context = null, points = [];
  let inView = false, fontsReady = false, selecting = false;
  let frame = 0, resizeTimer = 0, previousTime = 0, steady = 0;
  let width = 0, height = 0, padding = 0, fontSize = 0, signature = '';
  let baseColor = '#fff9f1';
  const pointer = { x: -1000, y: -1000, active: false, until: 0, changed: 0 };
  let touch = null;

  const allowed = () => !reduced.matches && !navigator.connection?.saveData;
  const sourceReady = () => !['pending', 'running'].includes(heading.dataset.headingReveal);

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    steady = 0;
  }

  function draw() {
    if (!context || !canvas) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = baseColor;
    context.beginPath();
    points.forEach(point => {
      context.moveTo(point.x + point.radius, point.y);
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    });
    context.fill();
    if (pointer.active) {
      context.fillStyle = '#f58a58';
      context.beginPath();
      points.forEach((point, index) => {
        if (index % 3 || !point.warm) return;
        context.moveTo(point.x + point.radius, point.y);
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      });
      context.fill();
    }
  }

  function restorePoints() {
    points.forEach(point => { point.x = point.ox; point.y = point.oy; point.vx = point.vy = 0; point.warm = false; });
  }

  function reset() {
    stop();
    pointer.active = false;
    pointer.until = 0;
    touch = null;
    restorePoints();
    if (inView && !selecting) draw();
    container.dataset.particleState = inView ? 'idle' : 'sleeping';
  }

  function destroy() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = 0;
    reset();
    canvas?.remove();
    canvas = context = null;
    points = [];
    signature = '';
    container.removeAttribute('data-particle-text');
    container.removeAttribute('data-particle-state');
  }

  function tick(now) {
    frame = 0;
    if (!inView || selecting || document.hidden || !allowed() || !canvas) { reset(); return; }
    const dt = Math.min(2, previousTime ? (now - previousTime) / 16.667 : 1);
    previousTime = now;
    if (pointer.until && now > pointer.until) { pointer.active = false; pointer.until = 0; }
    const radius = compact.matches ? Math.min(65, fontSize * 1.05) : Math.min(112, fontSize * 1.3);
    const radiusSq = radius * radius;
    let fastest = 0;
    points.forEach(point => {
      point.warm = false;
      if (pointer.active) {
        const dx = point.x - pointer.x, dy = point.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < radiusSq) {
          const distance = Math.max(1, Math.sqrt(d2));
          const force = Math.pow(1 - distance / radius, 2) * 7.5;
          point.vx += dx / distance * force * dt;
          point.vy += dy / distance * force * dt;
          point.warm = distance < radius * .85;
        }
      }
      point.vx += (point.ox - point.x) * .068 * dt;
      point.vy += (point.oy - point.y) * .068 * dt;
      const damping = Math.pow(.79, dt);
      point.vx *= damping; point.vy *= damping;
      point.x += point.vx * dt; point.y += point.vy * dt;
      const dx = point.x - point.ox, dy = point.y - point.oy;
      const travel = Math.hypot(dx, dy);
      const maxTravel = Math.max(2, Math.min(compact.matches ? 23 : 38, padding - 2));
      if (travel > maxTravel) {
        point.x = point.ox + dx / travel * maxTravel;
        point.y = point.oy + dy / travel * maxTravel;
        point.vx *= .55; point.vy *= .55;
      }
      fastest = Math.max(fastest, Math.abs(point.vx) + Math.abs(point.vy));
    });
    draw();
    steady = fastest < .025 ? steady + 1 : 0;
    const expired = now - pointer.changed > 1800;
    if (steady > 7 || expired) {
      if (!pointer.active) { restorePoints(); draw(); }
      container.dataset.particleState = 'idle';
      previousTime = 0;
    } else frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame || !canvas || !inView || selecting || document.hidden || !allowed()) return;
    container.dataset.particleState = 'active';
    previousTime = 0;
    steady = 0;
    frame = requestAnimationFrame(tick);
  }

  function rasterize(rect, style) {
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(width); mask.height = Math.ceil(height);
    const ink = mask.getContext('2d', { willReadFrequently: true });
    if (!ink) return [];
    ink.fillStyle = '#fff';
    ink.textBaseline = 'alphabetic';
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('[aria-hidden="true"]')) continue;
      const font = getComputedStyle(node.parentElement);
      ink.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      let offset = 0;
      for (const character of node.textContent) {
        const start = offset; offset += character.length;
        if (/\s/u.test(character)) continue;
        const range = document.createRange();
        range.setStart(node, start); range.setEnd(node, offset);
        const glyph = range.getBoundingClientRect();
        if (!glyph.width || !glyph.height) continue;
        const metrics = ink.measureText(character);
        const descent = metrics.fontBoundingBoxDescent ?? parseFloat(font.fontSize) * .2;
        ink.fillText(character, glyph.left - rect.left + padding, glyph.bottom - rect.top - descent + padding);
      }
    }
    const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
    let step = compact.matches ? 1.8 : Math.max(1.8, Math.min(3.1, fontSize / 39));
    let sampled;
    do {
      sampled = [];
      for (let y = 0; y < mask.height; y += step) for (let x = 0; x < mask.width; x += step) {
        if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] < 90) continue;
        const seed = (Math.floor(x) * 173 + Math.floor(y) * 131) % 101 / 101;
        const px = x + (seed - .5) * step * .22;
        const py = y + (seed - .5) * step * .18;
        sampled.push({ ox: px, oy: py, x: px, y: py, vx: 0, vy: 0, warm: false, radius: step * (.4 + seed * .13) });
      }
      step *= 1.12;
    } while (sampled.length > (compact.matches ? 4000 : 8500));
    return sampled;
  }

  function build() {
    resizeTimer = 0;
    if (!fontsReady || !inView || selecting || document.hidden || !sourceReady() || !allowed()) return;
    const rect = heading.getBoundingClientRect();
    const style = getComputedStyle(heading);
    const key = [rect.width.toFixed(1), rect.height.toFixed(1), style.fontSize, style.fontWeight, heading.textContent].join('|');
    if (canvas && key === signature) return;
    destroy();
    try {
      fontSize = parseFloat(style.fontSize);
      padding = Math.max(0, Math.min(compact.matches ? 24 : 42, rect.left,
        document.documentElement.clientWidth - rect.right));
      width = rect.width + padding * 2;
      height = rect.height + padding * 2;
      baseColor = style.color;
      points = rasterize(rect, style);
      if (points.length < 50) return;
      canvas = document.createElement('canvas');
      canvas.className = 'contact-particle-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.dataset.particleCount = String(points.length);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
      const parent = container.getBoundingClientRect();
      Object.assign(canvas.style, { width: `${width}px`, height: `${height}px`,
        left: `${rect.left - parent.left - padding}px`, top: `${rect.top - parent.top - padding}px` });
      context = canvas.getContext('2d');
      if (!context) { destroy(); return; }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
      container.append(canvas);
      signature = key;
      container.dataset.particleText = 'ready';
      container.dataset.particleState = 'idle';
    } catch { destroy(); }
  }

  function locatePointer(event, until = 0) {
    if (!canvas || !inView || selecting || !allowed()) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    pointer.until = until;
    pointer.changed = performance.now();
    wake();
  }

  heading.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') locatePointer(event);
    else if (touch && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 9) touch.moved = true;
  }, { passive: true });
  heading.addEventListener('pointerleave', () => {
    pointer.active = false; pointer.changed = performance.now(); wake();
  }, { passive: true });
  heading.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') touch = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }, { passive: true });
  heading.addEventListener('pointerup', event => {
    if (touch?.id !== event.pointerId) return;
    if (!touch.moved) locatePointer(event, performance.now() + 180);
    touch = null;
  }, { passive: true });
  heading.addEventListener('pointercancel', () => { touch = null; reset(); }, { passive: true });

  document.addEventListener('selectionchange', () => {
    const selection = document.getSelection();
    const active = Boolean(selection && !selection.isCollapsed &&
      (heading.contains(selection.anchorNode) || heading.contains(selection.focusNode)));
    if (selecting === active) return;
    selecting = active;
    reset();
    if (active) {
      container.removeAttribute('data-particle-text');
      if (canvas) canvas.hidden = true;
    } else if (canvas) {
      canvas.hidden = false;
      draw();
      container.dataset.particleText = 'ready';
    } else build();
  });

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) { build(); if (canvas) { restorePoints(); draw(); } }
    else reset();
  }).observe(heading);
  new MutationObserver(build).observe(heading, { attributes: true, attributeFilter: ['data-heading-reveal'] });
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    reset();
    resizeTimer = setTimeout(build, 100);
  }).observe(heading);
  window.addEventListener('scroll', () => {
    if (pointer.active) { pointer.active = false; pointer.changed = performance.now(); wake(); }
  }, { passive: true });
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', destroy);
  window.addEventListener('pageshow', build);
  document.addEventListener('visibilitychange', () => document.hidden ? reset() : build());
  reduced.addEventListener('change', () => reduced.matches ? destroy() : build());
  navigator.connection?.addEventListener('change', () => navigator.connection.saveData ? destroy() : build());
  Promise.resolve(document.fonts?.ready).then(() => { fontsReady = true; build(); });
})();
