(() => {
  'use strict';
  const root = document.querySelector('.type-study');
  if (!root || typeof Element.prototype.animate !== 'function') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 759px)');
  const arrival = 'cubic-bezier(.16, 1, .3, 1)';
  const running = new Map();

  // No persistent animation styles: cancellation always restores the native state.
  function cancel(target) {
    const animation = running.get(target);
    if (!animation) return;
    running.delete(target);
    animation.cancel();
    visibility?.unobserve(target);
  }
  function cancelAll() {
    [...running.keys()].forEach(cancel);
  }
  const visibility = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => { if (!entry.isIntersecting) cancel(entry.target); });
    })
    : null;

  function play(target, frames, duration) {
    if (!target) return;
    cancel(target);
    if (document.hidden || !target.getClientRects().length) return;
    const animation = target.animate(frames, { duration, easing: arrival });
    running.set(target, animation);
    visibility?.observe(target);
    const cleanup = () => {
      if (running.get(target) !== animation) return;
      running.delete(target);
      visibility?.unobserve(target);
    };
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
  }

  function appear(target, spatial = false) {
    if (!target) return;
    const frames = reduced.matches || !spatial
      ? [{ opacity: .68 }, { opacity: 1 }]
      : [{ opacity: .72, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' }];
    play(target, frames, reduced.matches ? 80 : 180);
  }

  // Disclosure events observe the final open state. They never defer activation
  // or take over the click, keyboard handling, focus or closing behavior.
  const disclosures = [...root.querySelectorAll(`.faq-list > details,
    .site-header .nav-pop, .site-header .city-choice`)];
  disclosures.forEach(disclosure => {
    const faq = disclosure.closest('.faq-list');
    const panel = faq
      ? disclosure.querySelector('.faq-answer')
      : disclosure.querySelector(':scope > .catalog-menu, :scope > .company-drop, :scope > div');
    if (!panel) return;
    let open = disclosure.open;
    disclosure.addEventListener('toggle', () => {
      const next = disclosure.open;
      if (open === next) return;
      open = next;
      if (!open) { cancel(panel); return; }
      // The header's opacity-only entrance cannot move the pointer bridge.
      appear(panel, Boolean(faq));
    });
  });

  const panels = [...root.querySelectorAll('.svc-body, [data-catalog-panel]')];
  const openState = new WeakMap(panels.map(panel => [panel, !panel.hidden]));
  const panelsObserver = new MutationObserver(records => {
    const changed = new Set(records.map(record => record.target));
    changed.forEach(panel => {
      const open = !panel.hidden;
      if (openState.get(panel) === open) return;
      openState.set(panel, open);
      const content = panel.matches('.svc-body')
        ? panel.querySelector('.svc-description') || panel
        : panel;
      if (!open) { cancel(content); return; }
      appear(content, true);
    });
  });
  panels.forEach(panel => panelsObserver.observe(panel, {
    attributes: true, attributeFilter: ['hidden']
  }));

  const nav = root.querySelector('#site-nav');
  if (nav) {
    let open = nav.classList.contains('is-open');
    new MutationObserver(() => {
      const next = nav.classList.contains('is-open');
      if (next === open) return;
      open = next;
      const content = nav.querySelector('.site-navigation');
      if (!open) cancel(content);
      else if (mobile.matches) appear(content);
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  // Acknowledgment moves only the icon, so hit areas never shrink or shift.
  const buttons = [...root.querySelectorAll(`.svc-toggle, .track-controls button,
    .menu-toggle, .showreel-control, .case-motion-control,
    .clients-marquee__control, .footer-system__control`)];
  function acknowledge(button) {
    if (button.disabled) return;
    const icon = [...button.querySelectorAll(':scope > svg')]
      .find(candidate => candidate.getClientRects().length);
    const frames = reduced.matches
      ? [{ opacity: 1 }, { opacity: .65 }, { opacity: 1 }]
      : [{ scale: '1' }, { scale: '.9', offset: .35 }, { scale: '1' }];
    play(icon, frames, reduced.matches ? 80 : 120);
  }
  buttons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.button === 0) acknowledge(button);
    }, { passive: true });
    button.addEventListener('click', event => {
      // Pointer clicks already acknowledged at press; keyboard gets the same feedback.
      if (event.detail === 0) acknowledge(button);
    });
  });

  const range = root.querySelector('.review-position-visual');
  if (range) {
    let previous = range.textContent;
    let currentNumber = range.querySelector('strong');
    new MutationObserver(() => {
      const current = range.textContent;
      if (current === previous) return;
      previous = current;
      if (currentNumber) cancel(currentNumber);
      // Only the current number changes appearance. Drag and track scroll are untouched.
      const number = range.querySelector('strong');
      currentNumber = number;
      play(number, [{ opacity: .6 }, { opacity: 1 }], reduced.matches ? 80 : 140);
    }).observe(range, { childList: true, subtree: true, characterData: true });
  }

  reduced.addEventListener('change', cancelAll);
  mobile.addEventListener('change', cancelAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
  window.addEventListener('pagehide', cancelAll);
  root.dataset.homeInteractionMotion = 'ready';
})();
