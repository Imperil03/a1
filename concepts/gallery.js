(() => {
  const dialog = document.querySelector('.viewer');
  const image = document.getElementById('viewer-image');
  const title = document.getElementById('viewer-title');
  const count = document.getElementById('viewer-count');
  const original = document.getElementById('original-link');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const close = document.getElementById('close-viewer');
  const status = document.getElementById('viewer-status');
  const content = document.querySelector('.viewer-content');
  const scene = document.getElementById('motion-scene');
  const note = document.getElementById('motion-note');
  const mode = document.getElementById('motion-toggle');
  const pause = document.getElementById('motion-pause');
  const variants = [...document.querySelectorAll('.concept')].map((card) => ({
    title: card.querySelector('h2').textContent,
    code: card.dataset.code,
    theme: card.dataset.theme,
    src: card.querySelector('.preview img').getAttribute('src'),
    alt: card.querySelector('.preview img').alt,
  }));
  let current = 0;
  let trigger = null;
  let motionMode = false;
  const updatePause = () => {
    const paused = window.reviewMotion?.isPaused() ?? true;
    pause.textContent = paused ? 'Продолжить' : 'Пауза';
    pause.setAttribute('aria-pressed', String(paused));
  };
  const setMode = (wanted) => {
    motionMode = Boolean(wanted && variants[current].theme && window.reviewMotion);
    image.hidden = motionMode;
    scene.hidden = !motionMode;
    note.hidden = !motionMode;
    pause.hidden = !motionMode;
    mode.textContent = motionMode ? 'Показать макет' : 'Движение фона';
    mode.setAttribute('aria-pressed', String(motionMode));
    if (motionMode) window.reviewMotion.show(variants[current].theme);
    else window.reviewMotion?.hide();
    updatePause();
  };
  const render = (index, animate = false) => {
    const previousFocus = document.activeElement;
    current = index;
    const variant = variants[index];
    title.textContent = variant.title;
    count.textContent = variant.code;
    image.src = variant.src;
    image.alt = variant.alt;
    original.href = variant.src;
    previous.disabled = index === 0;
    next.disabled = index === variants.length - 1;
    status.textContent = `Вариант ${variant.code}: ${variant.title}`;
    mode.hidden = !variant.theme;
    content.scrollTop = 0;
    content.scrollLeft = 0;
    setMode(animate);
    if ((previousFocus === pause && pause.hidden) || (previousFocus === mode && mode.hidden)) close.focus();
    else if (previousFocus === next && next.disabled) previous.focus();
    else if (previousFocus === previous && previous.disabled) next.focus();
  };
  const open = (index, element, animate = false) => {
    trigger = element;
    dialog.showModal();
    render(index, animate);
    document.body.style.overflow = 'hidden';
  };
  document.querySelectorAll('[data-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      open(Number(link.dataset.open), link);
    });
  });
  document.querySelectorAll('[data-motion]').forEach((button) => {
    button.addEventListener('click', () => open(Number(button.dataset.motion), button, true));
  });
  mode.addEventListener('click', () => setMode(!motionMode));
  pause.addEventListener('click', () => { window.reviewMotion?.toggle(); updatePause(); });
  window.addEventListener('review-motion-state', updatePause);
  previous.addEventListener('click', () => { if (current > 0) render(current - 1, motionMode); });
  next.addEventListener('click', () => { if (current < variants.length - 1) render(current + 1, motionMode); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); render(current - 1, motionMode); }
    if (event.key === 'ArrowRight' && current < variants.length - 1) { event.preventDefault(); render(current + 1, motionMode); }
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    window.reviewMotion?.hide();
    document.body.style.overflow = '';
    trigger?.focus();
  });
})();
