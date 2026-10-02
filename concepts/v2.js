(() => {
  const dialog = document.querySelector('.v2-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('viewer-image');
  const title = document.getElementById('viewer-title');
  const count = document.getElementById('viewer-count');
  const original = document.getElementById('original-link');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const close = document.getElementById('close-viewer');
  const zoom = document.getElementById('zoom-toggle');
  const status = document.getElementById('viewer-status');
  const caption = document.getElementById('viewer-caption');
  const error = document.getElementById('viewer-error');
  const content = document.querySelector('.viewer-content');
  const variants = [...document.querySelectorAll('.v2-grid .concept')].map(card => ({
    title: card.querySelector('[data-title]').textContent,
    code: card.dataset.code,
    src: card.querySelector('.preview img').getAttribute('src'),
    alt: card.querySelector('.preview img').alt,
    width: Number(card.querySelector('.preview img').getAttribute('width')),
  }));
  let current = 0;
  let trigger;
  let previousOverflow = '';
  const setZoom = wanted => {
    content.dataset.zoom = String(wanted);
    zoom.setAttribute('aria-pressed', String(wanted));
    zoom.textContent = wanted ? 'По ширине' : '100%';
    content.scrollTop = 0;
    content.scrollLeft = 0;
  };
  const render = index => {
    const focused = document.activeElement;
    current = index;
    const variant = variants[current];
    title.textContent = variant.title;
    count.textContent = variant.code + ' · ' + (index + 1) + ' / ' + variants.length;
    image.alt = variant.alt;
    image.hidden = false;
    error.hidden = true;
    image.src = variant.src;
    original.href = variant.src;
    content.style.setProperty('--image-width', variant.width + 'px');
    previous.disabled = index === 0;
    next.disabled = index === variants.length - 1;
    caption.textContent = 'Вариант первого экрана главной страницы A1.';
    status.textContent = 'Вариант ' + variant.code + ': ' + variant.title;
    setZoom(false);
    if (focused === next && next.disabled) previous.focus();
    if (focused === previous && previous.disabled) next.focus();
  };
  image.addEventListener('load', () => content.style.setProperty('--image-width', image.naturalWidth + 'px'));
  image.addEventListener('error', () => { image.hidden = true; error.hidden = false; });
  document.querySelectorAll('[data-open]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      trigger = link;
      previousOverflow = document.body.style.overflow;
      render(Number(link.dataset.open));
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      close.focus();
    });
  });
  zoom.addEventListener('click', () => setZoom(content.dataset.zoom !== 'true'));
  previous.addEventListener('click', () => { if (current > 0) render(current - 1); });
  next.addEventListener('click', () => { if (current < variants.length - 1) render(current + 1); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); render(current - 1); }
    if (event.key === 'ArrowRight' && current < variants.length - 1) { event.preventDefault(); render(current + 1); }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    trigger?.focus();
  });
})();
