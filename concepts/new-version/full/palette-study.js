(() => {
  'use strict';
  const bar = document.querySelector('.palette-bar');
  if (!bar) return;
  const choices = new Set(['neutral', 'warm', 'original']);
  const url = new URL(location.href);
  const requested = url.searchParams.get('surface');
  const initial = requested === 'mint' ? 'original' : requested;
  if (!choices.has(initial)) return;
  const root = document.documentElement;
  root.dataset.palettePreview = '';
  bar.hidden = false;
  function select(value) {
    if (!choices.has(value)) return;
    if (value === 'original') delete root.dataset.surface;
    else root.dataset.surface = value;
    bar.querySelectorAll('[data-palette]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.palette === value));
    });
    const state = new URL(location.href);
    state.searchParams.set('surface', value);
    history.replaceState(null, '', state.pathname + state.search + state.hash);
  }
  bar.querySelectorAll('[data-palette]').forEach(button => {
    button.addEventListener('click', () => select(button.dataset.palette));
  });
  select(initial);
})();
