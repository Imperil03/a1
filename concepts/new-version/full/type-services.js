(() => {
  'use strict';
  document.querySelectorAll('.type-study .services-lab').forEach(root => {
    const items = [...root.querySelectorAll('.svc-item')].map(item => ({
      item,
      row: item.querySelector('.svc-row'),
      toggle: item.querySelector('.svc-toggle'),
      panel: item.querySelector('.svc-body'),
    }));

    const setExpanded = (entry, expanded) => {
      entry.item.dataset.expanded = String(expanded);
      entry.toggle.setAttribute('aria-expanded', String(expanded));
      entry.panel.hidden = !expanded;
    };

    items.forEach(entry => {
      setExpanded(entry, entry.item.hasAttribute('data-initial-open'));
      entry.toggle.hidden = false;
      entry.row.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        const selection = window.getSelection();
        if (!event.target.closest('button') && selection && !selection.isCollapsed && entry.row.contains(selection.anchorNode)) return;
        const expand = entry.toggle.getAttribute('aria-expanded') !== 'true';
        items.forEach(other => setExpanded(other, other === entry && expand));
      });
    });
    root.dataset.rowDisclosure = '';
  });
})();
