(() => {
  const button = document.querySelector('#zoom');
  const viewport = document.querySelector('.canvas-viewport');
  if (!button || !viewport) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    const enlarged = viewport.classList.toggle('is-enlarged');
    button.setAttribute('aria-pressed', String(enlarged));
    button.textContent = enlarged ? 'По ширине' : 'Крупнее';
    if (!enlarged) viewport.scrollLeft = 0;
  });
})();
