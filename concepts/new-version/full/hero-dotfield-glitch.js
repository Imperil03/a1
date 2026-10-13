/* Decorative Quordix slice copies are hidden from the accessibility tree.
   CSS owns the source's 7 s cycle; the canvas owns the shared motion state. */
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
})();
