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
  const variants = [...document.querySelectorAll('.concept')].map((card) => ({
    title: card.querySelector('h2').textContent,
    src: card.querySelector('.preview img').getAttribute('src'),
    alt: card.querySelector('.preview img').alt,
  }));
  let current = 0;
  let trigger = null;
  const render = (index) => {
    current = index;
    const variant = variants[index];
    title.textContent = variant.title;
    count.textContent = `${index + 1} / ${variants.length}`;
    image.src = variant.src;
    image.alt = variant.alt;
    original.href = variant.src;
    previous.disabled = index === 0;
    next.disabled = index === variants.length - 1;
    status.textContent = `Вариант ${index + 1}: ${variant.title}`;
    content.scrollTop = 0;
    content.scrollLeft = 0;
  };
  document.querySelectorAll('[data-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      trigger = link;
      render(Number(link.dataset.open));
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });
  previous.addEventListener('click', () => { if (current > 0) render(current - 1); });
  next.addEventListener('click', () => { if (current < variants.length - 1) render(current + 1); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); render(current - 1); }
    if (event.key === 'ArrowRight' && current < variants.length - 1) { event.preventDefault(); render(current + 1); }
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    trigger?.focus();
  });
})();
