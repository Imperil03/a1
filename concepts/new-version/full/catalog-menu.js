(() => {
  'use strict';
  const catalog = document.querySelector('.catalog-menu');
  if (!catalog) return;
  const desktop = matchMedia('(min-width: 760px)');
  const hover = matchMedia('(min-width: 760px) and (hover: hover) and (pointer: fine)');
  const pops = [...document.querySelectorAll('.site-header .nav-pop')];
  const states = new Map(pops.map(pop => {
    const summary = pop.querySelector(':scope > summary');
    const panel = pop.querySelector('.catalog-menu, .company-drop');
    const bridge = document.createElement('span');
    bridge.className = 'nav-pointer-bridge';
    bridge.setAttribute('aria-hidden', 'true');
    bridge.hidden = true;
    pop.insertBefore(bridge, panel);
    return [pop, { timer: 0, suppressed: false, summary, panel, bridge }];
  }));

  function fitMenu() {
    if (desktop.matches && catalog.closest('details').open) {
      catalog.style.setProperty('--catalog-available', `${Math.max(180, innerHeight - catalog.getBoundingClientRect().top - 16)}px`);
    }
    pops.forEach(pop => {
      const { summary, panel, bridge } = states.get(pop);
      if (!pop.open || !hover.matches) { bridge.hidden = true; return; }
      const triggerRect = summary.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const top = triggerRect.bottom - 2;
      const bottom = panelRect.top + 2;
      if (bottom <= top) { bridge.hidden = true; return; }
      bridge.hidden = false;
      const parentRect = bridge.offsetParent.getBoundingClientRect();
      const left = Math.min(triggerRect.left, panelRect.left);
      const right = Math.max(triggerRect.right, panelRect.right);
      // A sibling avoids clipping by the dropdown's scroll container.
      Object.assign(bridge.style, {
        left: `${left - parentRect.left}px`,
        top: `${top - parentRect.top}px`,
        width: `${right - left}px`,
        height: `${bottom - top}px`
      });
    });
  }
  function cancelClose(pop) { clearTimeout(states.get(pop).timer); }
  function open(pop) {
    cancelClose(pop);
    pops.forEach(other => { if (other !== pop) { cancelClose(other); other.open = false; } });
    pop.open = true;
    fitMenu();
  }
  function scheduleClose(pop) {
    cancelClose(pop);
    states.get(pop).timer = setTimeout(() => {
      if (!pop.matches(':hover') && !pop.contains(document.activeElement)) pop.open = false;
    }, 220);
  }
  pops.forEach(pop => {
    const { summary, panel, bridge } = states.get(pop);
    pop.addEventListener('pointerenter', () => {
      if (hover.matches && !states.get(pop).suppressed) open(pop);
    });
    pop.addEventListener('pointerleave', () => {
      states.get(pop).suppressed = false;
      if (hover.matches) scheduleClose(pop);
    });
    pop.addEventListener('focusin', () => cancelClose(pop));
    pop.addEventListener('focusout', () => scheduleClose(pop));
    pop.addEventListener('toggle', fitMenu);
    [panel, bridge].forEach(region => region.addEventListener('pointerenter', () => cancelClose(pop)));
    summary.addEventListener('click', event => {
      if (hover.matches && event.detail > 0) { event.preventDefault(); open(pop); }
    });
    summary.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      open(pop);
      const first = pop.querySelector('.catalog-tab[aria-selected=true], .catalog-tab, .company-drop a');
      first?.focus();
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const pop = pops.find(item => item.open);
    if (!pop) return;
    cancelClose(pop);
    states.get(pop).suppressed = true;
    const restore = pop.contains(document.activeElement);
    pop.open = false;
    if (restore) {
      event.preventDefault();
      event.stopPropagation();
      pop.querySelector(':scope > summary').focus();
    }
  }, true);

  const tabs = [...catalog.querySelectorAll('[data-catalog-tab]')];
  const panels = [...catalog.querySelectorAll('[data-catalog-panel]')];
  const tabList = catalog.querySelector('.catalog-tabs');
  const panelList = catalog.querySelector('.catalog-panels');
  const featureImage = catalog.querySelector('[data-catalog-art]');
  const featureHeadline = catalog.querySelector('[data-catalog-headline]');
  let selected = tabs[0].dataset.catalogTab;
  let mobileOpen = null;
  let switchTimer;

  function render() {
    tabs.forEach((tab, i) => {
      const active = tab.dataset.catalogTab === (desktop.matches ? selected : mobileOpen);
      const panel = panels[i];
      if (desktop.matches) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(active));
        tab.removeAttribute('aria-expanded');
        tab.tabIndex = active ? 0 : -1;
        panel.setAttribute('role', 'tabpanel');
        panel.tabIndex = 0;
      } else {
        tab.removeAttribute('role');
        tab.removeAttribute('aria-selected');
        tab.removeAttribute('tabindex');
        tab.setAttribute('aria-expanded', String(active));
        panel.setAttribute('role', 'region');
        panel.removeAttribute('tabindex');
      }
      panel.hidden = !active;
      if (active) {
        if (featureImage && featureImage.getAttribute('src') !== panel.dataset.menuArt) featureImage.src = panel.dataset.menuArt;
        if (featureHeadline && featureHeadline.textContent !== panel.dataset.menuHeadline) featureHeadline.textContent = panel.dataset.menuHeadline;
      }
    });
  }
  function select(tab) {
    selected = tab.dataset.catalogTab;
    render();
  }
  function adapt() {
    clearTimeout(switchTimer);
    if (desktop.matches) {
      tabList.setAttribute('role', 'tablist');
      tabList.setAttribute('aria-orientation', 'vertical');
      panels.forEach(panel => panelList.append(panel));
    } else {
      tabList.removeAttribute('role');
      tabList.removeAttribute('aria-orientation');
      tabs.forEach((tab, i) => tab.after(panels[i]));
    }
    catalog.dataset.enhanced = '';
    render();
    fitMenu();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('pointerenter', () => {
      if (!hover.matches || panels.some(panel => panel.contains(document.activeElement))) return;
      clearTimeout(switchTimer);
      switchTimer = setTimeout(() => select(tab), 100);
    });
    tab.addEventListener('pointerleave', () => clearTimeout(switchTimer));
    tab.addEventListener('focus', () => { if (desktop.matches) select(tab); });
    tab.addEventListener('click', () => {
      if (desktop.matches) select(tab);
      else { mobileOpen = mobileOpen === tab.dataset.catalogTab ? null : tab.dataset.catalogTab; render(); }
    });
    tab.addEventListener('keydown', event => {
      if (!desktop.matches) return;
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === 'ArrowRight') { event.preventDefault(); panels[index].focus(); return; }
      else return;
      event.preventDefault();
      tabs[next].focus();
    });
  });
  panels.forEach((panel, index) => panel.addEventListener('keydown', event => {
    if (desktop.matches && event.key === 'ArrowLeft') { event.preventDefault(); tabs[index].focus(); }
  }));
  document.querySelectorAll('.site-header a[href]').forEach(link => link.addEventListener('click', () => {
    pops.forEach(pop => { cancelClose(pop); pop.open = false; });
    document.querySelector('#site-nav').classList.remove('is-open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  }));
  desktop.addEventListener('change', adapt);
  hover.addEventListener('change', fitMenu);
  window.addEventListener('resize', fitMenu, { passive: true });
  document.fonts?.ready.then(fitMenu);
  adapt();
})();
