/* case video preview */
(() => {
  const video = document.querySelector('video[data-case-video-src]');
  if (!video || !('IntersectionObserver' in window)) return;

  const cover = video.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const minimumVisibility = .4;

  function syncPlayback() {
    const { top, bottom, height } = cover.getBoundingClientRect();
    const visibleHeight = Math.min(bottom, window.innerHeight) - Math.max(top, 0);
    if (!height || visibleHeight < height * minimumVisibility || document.hidden || reduced.matches) {
      video.pause();
      return;
    }
    if (video.error) return;
    if (!video.hasAttribute('src')) video.src = video.dataset.caseVideoSrc;
    if (video.paused) video.play().catch(() => {});
  }

  video.muted = true;
  video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });
  video.addEventListener('error', () => video.classList.remove('is-ready'));
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', syncPlayback);

  new IntersectionObserver(syncPlayback, { threshold: minimumVisibility }).observe(cover);
  // Fragment navigation and cover entry motion can settle after the first observer callback.
  cover.addEventListener('animationend', syncPlayback);
  window.addEventListener('pageshow', syncPlayback);
  requestAnimationFrame(syncPlayback);
})();

/* resonance-case-motion */
(() => {
  'use strict';
  const section = document.querySelector('#cases');
  if (!section || section.dataset.resonanceCases || !('IntersectionObserver' in window)) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 759px), (max-height: 360px)');
  const soft = document.body?.dataset.motionTempo === 'soft';
  if (reduced.matches || compact.matches) return;

  const records = [...section.querySelectorAll('.project-case')].map(card => {
    const cover = card.querySelector('.project-cover');
    return { card, cover, image: cover?.querySelector('img'), target: soft ? card : cover, done: false };
  }).filter(record => record.cover && record.image);
  if (!records.length) return;
  section.dataset.resonanceCases = 'ready';
  const byTarget = new Map(records.map(record => [record.target, record]));
  let observer;

  function finish(record) {
    record.done = true;
    observer?.unobserve(record.target);
    record.cover.classList.remove('is-resonance-pending', 'is-resonance-entering');
    record.cover.style.removeProperty('--cover-enter-delay');
  }

  function finishAll() {
    records.forEach(finish);
    observer?.disconnect();
  }

  function reveal(record, delay) {
    if (record.done) return;
    record.done = true;
    // The slower trial keeps watching until completion, so fast exits settle it.
    if (!soft) observer.unobserve(record.target);
    // Never hide media while loading, after a deep jump, or as a fallback.
    if (reduced.matches || compact.matches || document.hidden || !record.image.complete || !record.image.naturalWidth) {
      finish(record);
      return;
    }
    record.cover.style.setProperty('--cover-enter-delay', `${delay}ms`);
    record.cover.classList.add('is-resonance-entering');
    record.cover.classList.remove('is-resonance-pending');
  }

  observer = new IntersectionObserver(entries => {
    if (soft) entries.forEach(entry => {
      const record = byTarget.get(entry.target);
      if (record && (entry.boundingClientRect.top < 0 || (record.done && !entry.isIntersecting))) finish(record);
    });
    const incoming = entries.filter(entry => entry.isIntersecting && (
      !soft || entry.intersectionRatio >= .32 || entry.boundingClientRect.height * .32 > innerHeight - 48
    ))
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    let rowTop = -Infinity;
    let row = -1;
    let column = 0;
    incoming.forEach(entry => {
      const record = byTarget.get(entry.target);
      if (!record || record.done) return;
      const top = entry.boundingClientRect.top;
      if (top < 0) { finish(record); return; }
      if (Math.abs(top - rowTop) > 4) {
        rowTop = top;
        row += 1;
        column = 0;
      }
      reveal(record, soft ? Math.min(row, 2) * 80 : Math.min(column++, 2) * 65);
    });
  }, {
    rootMargin: soft ? '0px 0px -48px 0px' : '0px 0px 16px 0px',
    threshold: soft ? [0, .32] : 0
  });

  records.forEach(record => {
    // Anything already in or above the viewport remains fully visible at boot.
    if (record.cover.getBoundingClientRect().top < innerHeight) finish(record);
    else {
      if (soft) record.cover.classList.add('is-resonance-pending');
      observer.observe(record.target);
    }
    record.card.addEventListener('focusin', () => finish(record));
    record.cover.addEventListener('animationend', event => {
      if (event.animationName === 'resonance-cover-enter' || event.animationName === 'resonance-cover-enter-soft') finish(record);
    });
  });

  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
  compact.addEventListener('change', () => { if (compact.matches) finishAll(); });
  const finishAnimating = () => {
    records.forEach(record => {
      if (record.cover.classList.contains('is-resonance-entering')) finish(record);
    });
  };
  window.addEventListener('resize', finishAnimating, { passive: true });
  window.addEventListener('pagehide', finishAll);
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishAnimating();
  });
})();
