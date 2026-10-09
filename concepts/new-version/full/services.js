(() => {
  'use strict';
  const roots = [...document.querySelectorAll('.services-lab')];
  roots.forEach(root => {
    const controls = [...root.querySelectorAll('[data-service-font]')];
    root.querySelector('.svc-tools').hidden = false;
    controls.forEach(button => button.addEventListener('click', () => {
      const font = button.dataset.serviceFont;
      roots.forEach(demo => {
        demo.dataset.typeface = font;
        demo.querySelectorAll('[data-service-font]').forEach(control => {
          control.setAttribute('aria-pressed', String(control.dataset.serviceFont === font));
        });
      });
    }));
    root.querySelectorAll('.svc-item').forEach(item => item.addEventListener('toggle', () => {
      if (!item.open) return;
      root.querySelectorAll('.svc-item').forEach(other => {
        if (other !== item) other.open = false;
      });
    }));
  });
})();
