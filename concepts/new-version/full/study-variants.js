(() => {
  'use strict';
  document.querySelectorAll('[data-study-variant]').forEach(link => {
    link.addEventListener('click', () => {
      const target = new URL(link.getAttribute('href'), location.href);
      const surface = new URL(location.href).searchParams.get('surface');
      if (['neutral', 'warm', 'original'].includes(surface)) target.searchParams.set('surface', surface);
      target.hash = location.hash || '#top';
      link.href = target.href;
    });
  });
})();
