(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  if (query.get('playful') === 'off' || query.get('objects') === 'off') return;
  const scene = document.querySelector('.type-study [data-footer-system]');
  if (!scene) return;
  const art = scene.querySelector('.footer-system__art');
  const word = scene.querySelector('.footer-system__word');
  const elements = [...scene.querySelectorAll('.footer-system__object')];
  const control = scene.querySelector('.footer-system__control');
  if (!art || !word || elements.length !== 3 || !control) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const labels = ['Подвинуть объект «Сайт»', 'Подвинуть объект «Продвижение»', 'Подвинуть объект «Аналитика»'];
  const original = elements.map(element => Object.fromEntries(
    ['role', 'tabindex', 'aria-label', 'aria-description'].map(name => [name, element.getAttribute(name)])));
  const artHidden = art.getAttribute('aria-hidden');
  const wordHidden = word.getAttribute('aria-hidden');
  const controlPressed = control.getAttribute('aria-pressed');
  let enabled = false;
  let inView = false;
  let bodies = [];
  let bounds;
  let frame = 0;
  let previousTime = 0;
  let lastInput = 0;
  let steadyFrames = 0;
  let drag = null;
  let touch = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const restore = (element, name, value) => value === null
    ? element.removeAttribute(name) : element.setAttribute(name, value);

  function paint() {
    bodies.forEach(body => {
      body.element.style.setProperty('--play-x', `${(body.x - body.homeX).toFixed(2)}px`);
      body.element.style.setProperty('--play-y', `${(body.y - body.homeY).toFixed(2)}px`);
      body.element.style.setProperty('--play-angle', `${body.angle.toFixed(2)}deg`);
    });
  }

  function releasePointer() {
    if (!drag) return;
    const { body, pointerId } = drag;
    drag = null;
    body.element.removeAttribute('data-dragging');
    if (body.element.hasPointerCapture(pointerId)) body.element.releasePointerCapture(pointerId);
  }

  function reset(immediate = true) {
    if (!enabled) return;
    releasePointer();
    touch = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    steadyFrames = 0;
    if (immediate) {
      bodies.forEach(body => Object.assign(body, { x: body.homeX, y: body.homeY, vx: 0, vy: 0, angle: 0 }));
      paint();
      scene.dataset.footerPhysicsState = 'idle';
    } else {
      lastInput = 0;
      wake();
    }
  }

  function confine(body) {
    const minX = body.radius + 8;
    const maxX = bounds.width - body.radius - 8;
    const minY = body.radius + 4;
    const maxY = body.homeY;
    if (body.x < minX || body.x > maxX) { body.x = clamp(body.x, minX, maxX); body.vx *= -.38; }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy) * .3; }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * .32; }
  }

  function collide(a, b) {
    const dx = b.x === a.x && b.y === a.y ? .01 : b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy) || .01;
    const overlap = a.radius + b.radius - distance;
    if (overlap <= 0) return;
    const nx = dx / distance, ny = dy / distance;
    const ia = drag?.body === a ? 0 : 1;
    const ib = drag?.body === b ? 0 : 1;
    const inverse = ia + ib;
    if (!inverse) return;
    a.x -= nx * overlap * ia / inverse;
    a.y -= ny * overlap * ia / inverse;
    b.x += nx * overlap * ib / inverse;
    b.y += ny * overlap * ib / inverse;
    const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (approach < 0) {
      const impulse = -1.42 * approach / inverse;
      a.vx -= impulse * nx * ia; a.vy -= impulse * ny * ia;
      b.vx += impulse * nx * ib; b.vy += impulse * ny * ib;
    }
  }

  function tick(time) {
    frame = 0;
    if (!enabled || !inView || document.hidden) { reset(); return; }
    const dt = Math.min(.032, previousTime ? (time - previousTime) / 1000 : 1 / 60);
    previousTime = time;
    const returning = !drag && time - lastInput > 1200;
    bodies.forEach(body => {
      if (drag?.body === body) {
        body.x = drag.x; body.y = drag.y;
      } else {
        if (returning) {
          body.vx += ((body.homeX - body.x) * 30 - body.vx * 11) * dt;
          body.vy += ((body.homeY - body.y) * 30 - body.vy * 11) * dt;
        } else {
          body.vy += 820 * dt;
          body.vx *= Math.pow(.986, dt * 60);
          body.vy *= Math.pow(.992, dt * 60);
        }
        body.x += body.vx * dt; body.y += body.vy * dt;
      }
      confine(body);
      const tilt = returning ? 0 : clamp(body.vx * .022, -11, 11);
      body.angle += (tilt - body.angle) * Math.min(1, dt * 10);
    });
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j]);
    bodies.forEach(confine);
    paint();
    scene.dataset.footerPhysicsState = drag ? 'dragging' : returning ? 'returning' : 'playing';
    const settled = returning && bodies.every(body =>
      Math.hypot(body.x - body.homeX, body.y - body.homeY) < .25 && Math.hypot(body.vx, body.vy) < 1.5);
    steadyFrames = settled ? steadyFrames + 1 : 0;
    if (steadyFrames >= 5 || (!drag && time - lastInput > 6000)) reset();
    else frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!enabled || !inView || document.hidden || reduced.matches) return;
    if (!frame) { previousTime = 0; frame = requestAnimationFrame(tick); }
  }

  function nudge(body, dx = null, dy = null) {
    if (!enabled || !body) return;
    lastInput = performance.now();
    body.vx = clamp(body.vx + (dx ?? (body.homeX < bounds.width / 2 ? 190 : -190)), -900, 900);
    body.vy = clamp(body.vy + (dy ?? (fine.matches ? -260 : -180)), -900, 900);
    wake();
  }

  function measure() {
    if (!enabled) return;
    reset();
    bounds = art.getBoundingClientRect();
    bodies = elements.map(element => {
      const rect = element.getBoundingClientRect();
      const x = rect.left - bounds.left + rect.width / 2;
      const y = rect.top - bounds.top + rect.height / 2;
      return { element, homeX: x, homeY: y, x, y, vx: 0, vy: 0, angle: 0, radius: rect.width * .34 };
    });
  }

  function enable() {
    if (enabled || reduced.matches || navigator.connection?.saveData || !['finished', 'reduced'].includes(scene.dataset.footerState)) return;
    enabled = true;
    art.style.removeProperty('--footer-pointer-x');
    art.style.removeProperty('--footer-pointer-y');
    scene.dataset.footerPhysics = 'ready';
    art.removeAttribute('aria-hidden');
    word.setAttribute('aria-hidden', 'true');
    elements.forEach((element, index) => {
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-label', labels[index]);
      element.setAttribute('aria-description', 'Нажмите, чтобы подбросить объект. Стрелки перемещают его, Escape возвращает композицию.');
    });
    control.setAttribute('aria-label', 'Вернуть объекты на место');
    control.removeAttribute('aria-pressed');
    measure();
  }

  function disable() {
    if (!enabled) return;
    reset();
    enabled = false;
    scene.removeAttribute('data-footer-physics');
    scene.removeAttribute('data-footer-physics-state');
    restore(art, 'aria-hidden', artHidden);
    restore(word, 'aria-hidden', wordHidden);
    elements.forEach((element, index) => {
      Object.entries(original[index]).forEach(([name, value]) => restore(element, name, value));
      ['--play-x', '--play-y', '--play-angle'].forEach(name => element.style.removeProperty(name));
    });
    control.setAttribute('aria-label', 'Повторить анимацию');
    restore(control, 'aria-pressed', controlPressed);
    bodies = [];
  }

  elements.forEach((element, index) => {
    element.addEventListener('pointerdown', event => {
      if (!enabled || !event.isPrimary || event.button !== 0) return;
      const body = bodies[index];
      if (event.pointerType !== 'mouse' || !fine.matches) {
        touch = { id: event.pointerId, body, x: event.clientX, y: event.clientY, moved: false };
        return;
      }
      event.preventDefault();
      releasePointer();
      bounds = art.getBoundingClientRect();
      drag = { body, pointerId: event.pointerId, x: body.x, y: body.y,
        offsetX: body.x - event.clientX + bounds.left, offsetY: body.y - event.clientY + bounds.top,
        last: performance.now(), distance: 0 };
      element.setPointerCapture(event.pointerId);
      element.dataset.dragging = '';
      lastInput = performance.now();
      wake();
    });
    element.addEventListener('pointermove', event => {
      if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 9) touch.moved = true;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const now = performance.now(), dt = Math.max(.008, (now - drag.last) / 1000);
      const x = event.clientX - bounds.left + drag.offsetX;
      const y = event.clientY - bounds.top + drag.offsetY;
      drag.body.vx = drag.body.vx * .4 + clamp((x - drag.x) / dt, -1200, 1200) * .6;
      drag.body.vy = drag.body.vy * .4 + clamp((y - drag.y) / dt, -1200, 1200) * .6;
      drag.distance += Math.hypot(x - drag.x, y - drag.y);
      drag.x = x; drag.y = y; drag.last = now;
      lastInput = now;
      wake();
    }, { passive: true });
    element.addEventListener('pointerup', event => {
      if (touch?.id === event.pointerId) {
        const tap = touch; touch = null;
        if (!tap.moved) nudge(tap.body);
      }
      if (!drag || drag.pointerId !== event.pointerId) return;
      const { body, distance } = drag;
      releasePointer();
      lastInput = performance.now();
      if (distance < 5) nudge(body); else wake();
    });
    element.addEventListener('pointercancel', () => { touch = null; if (drag?.body.element === element) reset(); });
    element.addEventListener('lostpointercapture', () => { if (drag?.body.element === element) reset(false); });
    element.addEventListener('dragstart', event => { if (enabled) event.preventDefault(); });
    element.addEventListener('keydown', event => {
      if (!enabled) return;
      if (event.key === 'Escape') { event.preventDefault(); reset(false); }
      else if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const impulses = { ArrowLeft: [-240, -70], ArrowRight: [240, -70], ArrowUp: [0, -280], ArrowDown: [0, 180] };
        nudge(bodies[index], ...(impulses[event.key] || []));
      }
    });
  });

  control.addEventListener('click', () => { if (enabled) reset(false); });
  new MutationObserver(enable).observe(scene, { attributes: true, attributeFilter: ['data-footer-state'] });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) reset();
    else enable();
  }).observe(scene);
  else inView = true;
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('blur', () => reset());
  window.addEventListener('pagehide', () => reset());
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  reduced.addEventListener('change', () => reduced.matches ? disable() : enable());
  navigator.connection?.addEventListener('change', () => navigator.connection.saveData ? disable() : enable());
  enable();
})();
