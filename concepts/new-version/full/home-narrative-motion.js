(() => {
  'use strict';

  const page = document.querySelector('body.type-study');
  if (!page || page.dataset.homeNarrativeMotion === 'ready') return;
  page.dataset.homeNarrativeMotion = 'ready';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const system = page.querySelector('#system');
  const joinWrap = system?.querySelector('.system-join-wrap');
  const join = joinWrap?.querySelector('.system-join');
  const processGrid = page.querySelector('#process .process-grid');
  const processRows = processGrid ? [...processGrid.children] : [];
  const animations = new Set();
  let systemObserver;
  let processObserver;
  let processVisible = false;
  let scrollAttached = false;
  let readingFrame = 0;
  let currentRow = null;
  let overlay;
  let bridges = [];

  const visible = (element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  };

  const settleSystem = (state = 'complete') => {
    if (!system || !join) return;
    system.dataset.homeSystemMotion = state;
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    systemObserver?.disconnect();
  };

  const animate = (element, keyframes, options) => {
    const animation = element.animate(keyframes, {
      fill: 'both',
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      ...options,
    });
    animations.add(animation);
    return animation.finished.catch(() => {});
  };

  const startSystem = () => {
    if (!system || system.dataset.homeSystemMotion !== 'idle' || document.hidden) return;
    if (reducedMotion.matches || !Element.prototype.animate) {
      settleSystem('reduced');
      return;
    }

    system.dataset.homeSystemMotion = 'running';
    const parts = bridges.map((bridge, index) => {
      const vertical = bridge.offsetHeight > bridge.offsetWidth;
      const scale = vertical ? 'scaleY' : 'scaleX';
      return animate(bridge, [
        { transform: `${scale}(0)` },
        { transform: `${scale}(1)` },
      ], { duration: 400, delay: index * 110 });
    });

    [...overlay.querySelectorAll('path')].forEach((path, index) => {
      if (getComputedStyle(path).display === 'none') return;
      parts.push(animate(path, [
        { strokeDashoffset: '1' },
        { strokeDashoffset: '0' },
      ], { duration: 720, delay: 340 + index * 80 }));
    });

    Promise.all(parts).then(() => {
      if (system.dataset.homeSystemMotion === 'running') settleSystem();
    });
  };

  if (system && join && joinWrap) {
    system.dataset.homeSystemMotion = reducedMotion.matches ? 'reduced' : 'idle';
    if (!reducedMotion.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
      overlay = join.cloneNode(true);
      overlay.classList.add('home-system-trace');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('focusable', 'false');
      overlay.removeAttribute('id');
      overlay.querySelectorAll('path').forEach((path) => path.setAttribute('pathLength', '1'));
      joinWrap.append(overlay);
      bridges = [...system.querySelectorAll('.system-step:not(:last-child)')].map((step) => {
        const bridge = document.createElement('span');
        bridge.className = 'home-system-bridge';
        bridge.setAttribute('aria-hidden', 'true');
        step.append(bridge);
        return bridge;
      });
      systemObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= .6) startSystem();
        else if (!entry.isIntersecting && system.dataset.homeSystemMotion === 'running') settleSystem();
      }, { threshold: [0, .6], rootMargin: '0px 0px -10% 0px' });
      systemObserver.observe(joinWrap);
    } else {
      system.dataset.homeSystemMotion = 'reduced';
    }
  }

  const updateReadingPosition = () => {
    readingFrame = 0;
    if (!processVisible || document.hidden || !processRows.length) return;
    const readingLine = window.innerHeight * .38;
    let row = null;
    let nearestDistance = Infinity;

    processRows.forEach((candidate) => {
      const bounds = candidate.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const distance = bounds.top > readingLine
        ? bounds.top - readingLine
        : Math.max(0, readingLine - bounds.bottom);
      if (distance < nearestDistance) {
        row = candidate;
        nearestDistance = distance;
      }
    });

    if (row === currentRow) return;
    if (currentRow) currentRow.dataset.processState = 'idle';
    currentRow = row;
    if (row) row.dataset.processState = 'current';
  };

  const requestReadingUpdate = () => {
    if (!readingFrame && processVisible && !document.hidden) {
      readingFrame = window.requestAnimationFrame(updateReadingPosition);
    }
  };

  const attachScroll = (attach) => {
    if (attach === scrollAttached) return;
    scrollAttached = attach;
    if (attach) window.addEventListener('scroll', requestReadingUpdate, { passive: true });
    else {
      window.removeEventListener('scroll', requestReadingUpdate);
      window.cancelAnimationFrame(readingFrame);
      readingFrame = 0;
    }
  };

  if (processGrid && processRows.length && 'IntersectionObserver' in window) {
    processGrid.dataset.processMotion = 'ready';
    processObserver = new IntersectionObserver((entries) => {
      processVisible = entries[0].isIntersecting;
      attachScroll(processVisible && !document.hidden);
      requestReadingUpdate();
    }, { threshold: 0 });
    processObserver.observe(processGrid);
  }

  window.addEventListener('resize', () => {
    if (system?.dataset.homeSystemMotion === 'running') settleSystem();
    requestReadingUpdate();
  }, { passive: true });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && system && join) settleSystem('reduced');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (system?.dataset.homeSystemMotion === 'running') settleSystem();
      attachScroll(false);
      return;
    }
    if (processGrid && processObserver) processVisible = visible(processGrid);
    attachScroll(processVisible);
    requestReadingUpdate();
    if (joinWrap && overlay && visible(joinWrap)) startSystem();
  });

  window.addEventListener('pagehide', () => {
    if (system?.dataset.homeSystemMotion === 'running') settleSystem();
    attachScroll(false);
  });

  window.addEventListener('pageshow', () => {
    if (processGrid && processObserver) processVisible = visible(processGrid);
    attachScroll(processVisible && !document.hidden);
    requestReadingUpdate();
  });
})();
