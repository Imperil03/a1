(() => {
  const scene = document.getElementById('motion-scene');
  const canvas = document.getElementById('light-canvas');
  if (!scene || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = false, paused = reduced.matches, visible = true, frame = 0;
  let width = 1, height = 1, elapsed = 0, last = 0;
  const draw = () => {
    const wine = scene.dataset.theme === 'wine';
    const pigment = wine ? '232,155,108' : '88,158,250';
    const light = wine ? '250,206,166' : '255,255,255';
    ctx.clearRect(0, 0, width, height);
    const drift = Math.sin(elapsed * .16);
    const field = ctx.createRadialGradient(width * 1.06, height * (.75 + drift * .035), 0, width, height * .8, width * .83);
    field.addColorStop(0, `rgba(${pigment},${wine ? .19 : .16})`);
    field.addColorStop(.65, `rgba(${pigment},${wine ? .04 : .025})`);
    field.addColorStop(1, `rgba(${pigment},0)`);
    ctx.fillStyle = field; ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 4; i++) {
      const shift = Math.sin(elapsed * .19 + i * .72) * height * .035;
      const offset = (i - 1.5) * height * .13;
      const path = new Path2D();
      path.moveTo(-width * .12, height * 1.18 + offset + shift);
      path.bezierCurveTo(width * .36, height * .64 + offset, width * .85, height * 1.16 + offset - shift, width * 1.06, height * .55 + offset);
      path.bezierCurveTo(width * 1.22, height * .13 + offset + shift, width * .79, height * .54 + offset, width * 1.14, height * .06 + offset);
      ctx.save(); ctx.strokeStyle = `rgba(${pigment},${wine ? .024 : .034})`;
      ctx.lineWidth = width * .045; ctx.shadowColor = `rgba(${pigment},.16)`; ctx.shadowBlur = Math.min(42, width * .035); ctx.stroke(path);
      ctx.shadowBlur = Math.min(18, width * .015); ctx.shadowColor = `rgba(${light},.4)`;
      ctx.strokeStyle = `rgba(${light},${wine ? .23 : .72})`; ctx.lineWidth = Math.max(1, width * .002); ctx.stroke(path); ctx.restore();
    }
  };
  const resize = () => {
    const box = scene.getBoundingClientRect();
    if (!box.width || !box.height) return;
    width = box.width; height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  };
  const running = () => active && !paused && visible && !document.hidden;
  const tick = (now) => {
    frame = 0;
    if (!running()) return;
    if (!last || now - last >= 33) {
      if (last) elapsed += Math.min((now - last) / 1000, .1);
      last = now; draw();
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (!running() && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    if (running() && !frame) { last = 0; frame = requestAnimationFrame(tick); }
  };
  new ResizeObserver(resize).observe(scene);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(scene);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); window.dispatchEvent(new Event('review-motion-state')); });
  window.reviewMotion = {
    show(theme) { scene.dataset.theme = theme; active = true; paused = reduced.matches; resize(); sync(); },
    hide() { active = false; sync(); },
    toggle() { paused = !paused; sync(); return paused; },
    isPaused() { return paused; }
  };
})();
