/* Outline and liquid fill for the contact heading. */
(() => {
  'use strict';

  const heading = document.querySelector('[data-contact-stroke-heading]');
  const label = heading?.querySelector('.contact-stroke-label');
  if (!label || !('IntersectionObserver' in window)) return;

  const namespace = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const drawTime = 720;
  const stagger = 26;
  const fillStart = 440;
  const fillTime = 900;
  const lineDelay = 155;
  const accent = '#ffa276';
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => value * value * (3 - 2 * value);
  let scene;
  let visible = false;
  let played = false;
  let hovering = false;
  let started = null;
  let transition;
  let fill = 1;
  let frame = 0;

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(namespace, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }

  function measure() {
    const node = label.firstChild;
    if (node?.nodeType !== Node.TEXT_NODE) return;
    const box = heading.getBoundingClientRect();
    if (!box.width || !box.height) return;

    const range = document.createRange();
    const letters = [];
    let offset = 0;
    for (const text of node.textContent) {
      const next = offset + text.length;
      if (text.trim()) {
        range.setStart(node, offset);
        range.setEnd(node, next);
        const rect = range.getBoundingClientRect();
        if (rect.width) letters.push({ text, rect });
      }
      offset = next;
    }
    if (!letters.length) return;

    // The inline marker provides the same baseline as the final line of real text.
    const marker = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    label.append(marker);
    const baselineOffset = marker.getBoundingClientRect().top - letters.at(-1).rect.top;
    marker.remove();
    if (baselineOffset < 0 || baselineOffset > letters.at(-1).rect.height * 1.4) return;

    const typography = getComputedStyle(label);
    const fontSize = parseFloat(typography.fontSize);
    const color = typography.color;
    const strokeWidth = Math.max(1, fontSize * .014);
    const art = svgElement('svg', {
      class: 'contact-stroke-art', 'aria-hidden': 'true', focusable: 'false',
      viewBox: `0 0 ${box.width} ${box.height}`,
    });
    art.style.fontFamily = typography.fontFamily;
    art.style.fontSize = typography.fontSize;
    art.style.fontWeight = typography.fontWeight;
    art.style.letterSpacing = '0px';

    const defs = svgElement('defs');
    const outlines = svgElement('g', { fill: 'none', stroke: color, 'stroke-width': strokeWidth });
    const tips = svgElement('g', { fill: 'none', stroke: accent, 'stroke-width': strokeWidth * 1.55 });
    art.append(defs, outlines, tips);
    const lines = [];

    for (const letter of letters) {
      const { rect, text } = letter;
      const x = rect.left - box.left;
      const top = rect.top - box.top;
      const y = top + baselineOffset;
      let line = lines.at(-1);
      if (!line || Math.abs(line.top - top) > 1) {
        const id = `contact-stroke-line-${lines.length}`;
        const clip = svgElement('clipPath', { id });
        const liquid = svgElement('path', { fill: color });
        const surface = svgElement('path', { fill: 'none', stroke: accent, 'stroke-width': strokeWidth * 1.4 });
        const group = svgElement('g', { 'clip-path': `url(#${id})` });
        defs.append(clip);
        group.append(liquid, surface);
        art.insertBefore(group, outlines);
        line = { top, bottom: rect.bottom - box.top, clip, liquid, surface, left: x, right: x };
        lines.push(line);
      }
      line.right = Math.max(line.right, x + rect.width);
      const glyph = svgElement('text', { x, y });
      glyph.textContent = text;
      line.clip.append(glyph);
      letter.stroke = glyph.cloneNode(true);
      letter.tip = glyph.cloneNode(true);
      letter.dash = rect.width * 2.4 + fontSize * 1.05;
      outlines.append(letter.stroke);
      tips.append(letter.tip);
    }

    scene?.art.remove();
    heading.append(art);
    return { art, lines, letters, fontSize, width: box.width, height: box.height };
  }

  function paintLiquid(line, level, now) {
    const { fontSize } = scene;
    const inset = fontSize * .09;
    const left = line.left - inset;
    const right = line.right + inset;
    const y = line.bottom + inset - (line.bottom - line.top + inset * 2) * level;
    const amplitude = level > 0 && level < 1 ? fontSize * .045 * Math.sin(Math.PI * level) : 0;
    const points = [];
    for (let i = 0; i <= 24; i++) {
      const x = left + (right - left) * i / 24;
      const wave = Math.sin(x / (fontSize * .55) + now / 130) * amplitude;
      points.push(`${x.toFixed(2)} ${(y + wave).toFixed(2)}`);
    }
    const edge = `M${points.join('L')}`;
    const bottom = line.bottom + fontSize;
    line.liquid.setAttribute('d', `${edge}L${right} ${bottom}H${left}Z`);
    line.surface.setAttribute('d', amplitude ? edge : '');
  }

  function paintOutline(letter, progress) {
    const length = letter.dash;
    const tip = Math.max(3, scene.fontSize * .07);
    letter.stroke.setAttribute('stroke-dasharray', progress >= 1 ? 'none' : `${length} ${length}`);
    letter.stroke.setAttribute('stroke-dashoffset', (length * (1 - progress)).toFixed(2));
    letter.stroke.setAttribute('opacity', progress > 0 ? '1' : '0');
    letter.tip.setAttribute('stroke-dasharray', `${tip} ${length * 3}`);
    letter.tip.setAttribute('stroke-dashoffset', (tip - length * progress).toFixed(2));
    letter.tip.setAttribute('opacity', Math.min(1, progress * 7, (1 - progress) * 5).toFixed(2));
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    started = null;
    transition = null;
    fill = 1;
    hovering = false;
    delete heading.dataset.contactStrokeActive;
  }

  function gatherScene() {
    if (!scene) scene = measure();
    return scene;
  }

  function slide(to, now) {
    if (!gatherScene()) return;
    if (!heading.hasAttribute('data-contact-stroke-active')) {
      scene.letters.forEach(letter => paintOutline(letter, 1));
      scene.lines.forEach(line => paintLiquid(line, 1, now));
    }
    heading.dataset.contactStrokeActive = 'hover';
    transition = { from: fill, to, at: now, duration: Math.max(100, Math.abs(fill - to) * (to < fill ? 570 : 440)) };
    schedule();
  }

  function runFrame(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches || !scene) { stop(); return; }
    if (started !== null) {
      const elapsed = now - started;
      scene.letters.forEach((letter, index) => paintOutline(letter, ease(clamp((elapsed - index * stagger) / drawTime))));
      scene.lines.forEach((line, index) => paintLiquid(line, ease(clamp((elapsed - fillStart - index * lineDelay) / fillTime)), now));
      if (elapsed < Math.max(drawTime + (scene.letters.length - 1) * stagger, fillStart + (scene.lines.length - 1) * lineDelay + fillTime)) {
        schedule();
        return;
      }
      started = null;
      if (hovering) slide(0, now);
      else stop();
    } else if (transition) {
      const progress = clamp((now - transition.at) / transition.duration);
      fill = transition.from + (transition.to - transition.from) * ease(progress);
      scene.lines.forEach(line => paintLiquid(line, fill, now));
      if (progress < 1) schedule();
      else {
        transition = null;
        if (fill === 1) stop();
      }
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(runFrame);
  }

  function updateVisibility() {
    const rect = heading.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < innerHeight;
    if (!visible || document.hidden || reduced.matches) { stop(); return; }
    const heightVisible = Math.min(rect.bottom, innerHeight) - Math.max(0, rect.top);
    if (played || heightVisible < rect.height * .3) return;
    try {
      if (!gatherScene()) return;
      played = true;
      started = performance.now();
      runFrame(started);
      heading.dataset.contactStrokeActive = 'entrance';
    } catch { stop(); }
  }

  Promise.resolve(document.fonts?.ready).then(() => {
    new IntersectionObserver(updateVisibility, { threshold: [0, .3] }).observe(heading);
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        if (!scene) return;
        const box = heading.getBoundingClientRect();
        if (Math.abs(box.width - scene.width) < .25 && Math.abs(box.height - scene.height) < .25) return;
        stop();
        scene.art.remove();
        scene = null;
      }).observe(heading);
    }
    document.addEventListener('visibilitychange', updateVisibility);
    reduced.addEventListener('change', updateVisibility);
    fine.addEventListener('change', stop);
    window.addEventListener('pageshow', updateVisibility);
    window.addEventListener('pagehide', stop);
    requestAnimationFrame(updateVisibility);
  }).catch(stop);

  heading.addEventListener('pointerenter', event => {
    if (!played || !visible || !fine.matches || reduced.matches || event.pointerType !== 'mouse') return;
    hovering = true;
    if (started === null) {
      try { slide(0, performance.now()); } catch { stop(); }
    }
  });
  heading.addEventListener('pointerleave', () => {
    hovering = false;
    if (started === null && heading.dataset.contactStrokeActive === 'hover') {
      try { slide(1, performance.now()); } catch { stop(); }
    }
  });
})();
