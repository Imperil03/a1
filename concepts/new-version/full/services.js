(() => {
  'use strict';
  const roots = [...document.querySelectorAll('.services-lab')];
  roots.forEach(root => {
    root.querySelectorAll('.svc-item').forEach(item => item.addEventListener('toggle', () => {
      if (!item.open) return;
      root.querySelectorAll('.svc-item').forEach(other => {
        if (other !== item) other.open = false;
      });
    }));
  });
})();
