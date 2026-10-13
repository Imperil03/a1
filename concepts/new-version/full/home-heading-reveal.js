(() => {
  'use strict';
  const root = document.querySelector('body.type-study');
  if (!root || new URLSearchParams(location.search).get('headings') === 'off') return;
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 759px)');
  const records = new Map();
  let observer;

  function finish(record) {
    if (record.state === 'done') return;
    record.state = 'done';
    observer?.unobserve(record.heading);
    record.animations.forEach(animation => animation.cancel());
    record.animations = [];
    // Restore the actual original text nodes, preserving existing inline emphasis
    // and any unrelated DOM added by other effects while the heading was animating.
    record.parts.forEach(({ marker, node, generated }) => {
      generated.forEach(element => element.remove());
      marker.replaceWith(node);
    });
    record.parts = [];
    record.words = [];
    if (record.labelAdded) record.heading.removeAttribute('aria-label');
    record.heading.dataset.headingReveal = 'done';
  }

  function finishAll() { records.forEach(finish); }
  function finishRunning() {
    records.forEach(record => { if (record.state === 'running') finish(record); });
  }

  function reveal(record) {
    if (record.state !== 'pending') return;
    if (reduced.matches || document.hidden) { finish(record); return; }
    record.state = 'running';
    record.heading.dataset.headingReveal = 'running';
    const duration = compact.matches ? 420 : 560;
    const maxStagger = compact.matches ? 120 : 220;
    const step = Math.min(42, maxStagger / Math.max(1, record.words.length - 1));
    try {
      record.words.forEach((word, index) => {
        record.animations.push(word.animate([
          { transform: 'translateY(125%)' },
          { transform: 'translateY(0)' }
        ], {
          duration,
          delay: index * step,
          easing: 'cubic-bezier(.16, 1, .3, 1)',
          fill: 'both'
        }));
      });
      Promise.all(record.animations.map(animation => animation.finished.catch(() => {})))
        .then(() => { if (record.state === 'running') finish(record); });
    } catch { finish(record); }
  }

  function prepare(heading) {
    const record = { heading, state: 'pending', parts: [], words: [], animations: [], labelAdded: false };
    records.set(heading, record);
    try {
      const originalText = heading.textContent;
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim() && !node.parentElement.closest('svg, [aria-hidden="true"]')) nodes.push(node);
      }
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const marker = document.createComment('a1-heading');
        const generated = [];
        fragment.append(marker);
        node.textContent.split(/(\s+)/u).filter(Boolean).forEach(token => {
          let element;
          if (/^\s+$/u.test(token)) element = document.createTextNode(token);
          else {
            element = document.createElement('span');
            element.className = 'a1-heading-mask';
            const word = document.createElement('span');
            word.className = 'a1-heading-word';
            word.textContent = token;
            element.append(word);
            record.words.push(word);
          }
          fragment.append(element);
          generated.push(element);
        });
        record.parts.push({ marker, node, generated });
        node.replaceWith(fragment);
      });
      if (heading.textContent !== originalText || !record.words.length) {
        finish(record);
        return;
      }
      // Screen readers receive one unchanged phrase, not a list of animated words.
      if (!heading.hasAttribute('aria-label') && !heading.hasAttribute('aria-labelledby')) {
        heading.setAttribute('aria-label', originalText.trim());
        record.labelAdded = true;
      }
      record.words.forEach(word => word.parentElement.setAttribute('aria-hidden', 'true'));
      heading.dataset.headingReveal = 'pending';
      observer.observe(heading);
    } catch { finish(record); }
  }

  function init() {
    if (reduced.matches) {
      root.dataset.headingRevealReady = 'reduced';
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.get(entry.target);
        if (!record) return;
        if (entry.isIntersecting) reveal(record);
        else if (record.state === 'running') finish(record);
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: .01 });

    root.querySelectorAll('.home-section h2, .services-lab h2, #system h2, .svc-additional > h3')
      .forEach(heading => {
        // Never hide a title the visitor could already have seen, including deep links.
        if (heading.getBoundingClientRect().top < innerHeight) heading.dataset.headingReveal = 'done';
        else prepare(heading);
      });
    root.dataset.headingRevealReady = 'ready';
  }

  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
  window.addEventListener('resize', finishRunning, { passive: true });
  window.addEventListener('pagehide', finishAll);
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishRunning(); });
  Promise.resolve(document.fonts?.ready).then(init).catch(finishAll);
})();
