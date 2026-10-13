(() => {
  'use strict';

  const page = document.querySelector('body.type-study');
  if (!page || page.dataset.homeNarrativeMotion === 'ready') return;
  page.dataset.homeNarrativeMotion = 'ready';

  // The selected diagram is fully orange and static; only reading position moves.
  const system = page.querySelector('#system');
  if (system) system.dataset.homeSystemMotion = 'static';
  const processGrid = page.querySelector('#process .process-grid');
  const processRows = processGrid ? [...processGrid.children] : [];
  let processObserver;
  let processVisible = false;
  let scrollAttached = false;
  let readingFrame = 0;
  let currentRow = null;

  const visible = (element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  };

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
    requestReadingUpdate();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        attachScroll(false);
      return;
    }
    if (processGrid && processObserver) processVisible = visible(processGrid);
    attachScroll(processVisible);
    requestReadingUpdate();
  });

  window.addEventListener('pagehide', () => {
    attachScroll(false);
  });

  window.addEventListener('pageshow', () => {
    if (processGrid && processObserver) processVisible = visible(processGrid);
    attachScroll(processVisible && !document.hidden);
    requestReadingUpdate();
  });
})();
