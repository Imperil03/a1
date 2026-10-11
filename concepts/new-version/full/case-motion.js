(() => {
  'use strict';
  const card = document.querySelector('[data-case-motion]');
  if (!card || !('IntersectionObserver' in window)) return;
  const video = card.querySelector('video');
  const control = card.querySelector('.case-motion-control');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let visible = false;
  let loaded = false;
  let pausedByUser = false;
  let manualPlay = false;
  let failed = false;

  function updateControl() {
    const playing = !video.paused && !video.ended;
    card.classList.toggle('is-playing', playing);
    const label = playing ? 'Приостановить анимацию кейса' : 'Воспроизвести анимацию кейса';
    control.setAttribute('aria-label', label);
    control.title = label;
  }

  function sync() {
    const allowed = manualPlay || (!reduced.matches && !connection?.saveData);
    const shouldPlay = !failed && visible && !document.hidden && !pausedByUser && allowed;
    if (reduced.matches && !manualPlay) card.classList.remove('is-ready');
    else if (video.readyState >= 2 && !failed) card.classList.add('is-ready');
    if (!shouldPlay) {
      video.pause();
      updateControl();
      return;
    }
    if (!loaded) {
      loaded = true;
      video.src = video.dataset.src;
      video.load();
    }
    video.play()?.catch(() => updateControl());
  }

  video.muted = true;
  video.addEventListener('loadeddata', sync);
  video.addEventListener('play', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', () => {
    failed = true;
    card.classList.remove('is-ready', 'is-playing');
    control.hidden = true;
  });
  control.addEventListener('click', () => {
    if (video.paused) {
      pausedByUser = false;
      manualPlay = true;
    } else {
      pausedByUser = true;
      manualPlay = false;
    }
    sync();
  });
  control.hidden = false;
  updateControl();
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .2;
    sync();
  }, { threshold: [0, .2, .5] }).observe(card);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { manualPlay = false; sync(); });
  connection?.addEventListener('change', sync);
})();
