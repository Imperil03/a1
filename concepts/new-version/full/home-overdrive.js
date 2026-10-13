(() => {
  'use strict';
  const root = document.querySelector('.type-study');
  const body = document.body;
  if (!root || !body) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const queryOff = new URLSearchParams(location.search).get('overdrive') === 'off';
  const player = root.querySelector('.showreel-player');
  const video = player?.querySelector('video');
  const control = player?.querySelector('.showreel-control');
  const masks = new Map();
  const effectCleanups = [];
  const preferenceCleanups = [];
  const errors = [];
  let requested = !queryOff;
  let active = false;
  let reason = queryOff ? 'query-off' : 'ready';
  let generation = 0;
  let renderer;
  let rendererFacts = null;
  let reelObserver;
  let maskObserver;
  let panelObserver;
  let visibleRatio = 0;
  let initialAttempted = false;
  let explicitIntentUntil = 0;
  let assemblyCount = 0;
  let maskCount = 0;
  let maskCancelCount = 0;

  function blocked() {
    if (reduced.matches) return 'reduced-motion';
    if (connection?.saveData) return 'save-data';
    return '';
  }

  function diagnostics() {
    return {
      requested, active, reason, queryOff,
      preferences: { reducedMotion: reduced.matches, saveData: Boolean(connection?.saveData) },
      showreel: {
        visibleRatio, initialAttempted, assemblyCount,
        renderer: renderer?.diagnostics() || rendererFacts
      },
      masks: { running: masks.size, opened: maskCount, cancelled: maskCancelCount },
      errors: [...errors]
    };
  }

  function publish() {
    body.dataset.overdriveDiagnostics = JSON.stringify(diagnostics());
  }

  function listen(target, name, handler, options, collection = effectCleanups) {
    if (!target?.addEventListener) return;
    target.addEventListener(name, handler, options);
    collection.push(() => target.removeEventListener(name, handler, options));
  }

  function recordError(error) {
    errors.push(String(error?.message || error));
    if (errors.length > 6) errors.shift();
    publish();
  }

  function cancelMask(target) {
    const animation = masks.get(target);
    if (!animation) return;
    masks.delete(target);
    maskObserver?.unobserve(target);
    animation.cancel();
    maskCancelCount += 1;
    publish();
  }

  function cancelWithin(container) {
    [...masks.keys()].forEach(target => {
      if (target === container || container.contains(target)) cancelMask(target);
    });
  }

  function cancelReel(cause) {
    explicitIntentUntil = 0;
    if (renderer) {
      renderer.cancel(cause);
      rendererFacts = renderer.diagnostics();
    }
    publish();
  }

  // A six-column frontier echoes the source logo's pixel steps. The native panel
  // is already open; no opacity or transform is added to its existing animation.
  function frontier(amount) {
    const points = ['0% 0%', '100% 0%'];
    for (let column = 5; column >= 0; column -= 1) {
      const edge = amount >= 1 ? 100 : Math.min(100, 58 + amount * 72 - column * 7);
      points.push(`${((column + 1) / 6 * 100).toFixed(3)}% ${edge}%`);
      points.push(`${(column / 6 * 100).toFixed(3)}% ${edge}%`);
    }
    return `polygon(${points.join(',')})`;
  }

  function reveal(target) {
    cancelMask(target);
    if (!active || blocked() || document.hidden || !target.getClientRects().length) return;
    // Never briefly clip a keyboard focus indicator while its owner is active.
    if (target.contains(document.activeElement)) return;
    if ([...masks.keys()].some(parent => parent.contains(target))) return;
    if (typeof target.animate !== 'function' ||
      !window.CSS?.supports('clip-path', frontier(0))) return;
    try {
      const animation = target.animate([
        { clipPath: frontier(0) },
        { clipPath: frontier(.54), offset: .48 },
        { clipPath: frontier(1) }
      ], { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
      masks.set(target, animation);
      maskCount += 1;
      maskObserver?.observe(target);
      const finish = () => {
        if (masks.get(target) !== animation) return;
        masks.delete(target);
        maskObserver?.unobserve(target);
        publish();
      };
      animation.addEventListener('finish', finish, { once: true });
      animation.addEventListener('cancel', finish, { once: true });
      publish();
    } catch (error) {
      recordError(error);
    }
  }

  function makeRenderer() {
    if (renderer) return renderer;
    if (!player || !video || typeof window.A1OverdriveRenderer?.create !== 'function') {
      reason = 'renderer-unavailable';
      publish();
      return null;
    }
    renderer = window.A1OverdriveRenderer.create(player, video, {
      onStateChange(facts) { rendererFacts = facts; publish(); }
    });
    return renderer;
  }

  async function assemble(cause) {
    if (!active || blocked() || document.hidden || visibleRatio < .5) return false;
    const localGeneration = generation;
    try {
      const scene = makeRenderer();
      if (!scene) return false;
      scene.cancel('repeat');
      initialAttempted = true;
      assemblyCount += 1;
      reason = cause;
      publish();
      const completed = await scene.play();
      if (generation === localGeneration) {
        rendererFacts = scene.diagnostics();
        publish();
      }
      return completed;
    } catch (error) {
      recordError(error);
      cancelReel('controller-error');
      return false;
    }
  }

  function measureVisibility() {
    if (!player) return;
    const rect = player.getBoundingClientRect();
    const area = Math.max(0, rect.width) * Math.max(0, rect.height);
    const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    visibleRatio = area ? width * height / area : 0;
    if (!visibleRatio) cancelReel('offscreen');
    else if (visibleRatio >= .5 && !initialAttempted) assemble('initial');
    publish();
  }

  function installPanels() {
    if ('IntersectionObserver' in window) {
      maskObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (!entry.isIntersecting) cancelMask(entry.target); });
      });
    }
    root.querySelectorAll('.faq-list > details, .site-header .nav-pop, .site-header .city-choice')
      .forEach(disclosure => {
        const panel = disclosure.querySelector(
          ':scope > .faq-answer, :scope > .catalog-menu, :scope > .company-drop, :scope > div');
        if (!panel) return;
        let open = disclosure.open;
        listen(disclosure, 'toggle', () => {
          if (open === disclosure.open) return;
          open = disclosure.open;
          if (open) reveal(panel);
          else cancelWithin(panel);
        });
      });

    const panels = [...root.querySelectorAll('.svc-body, [data-catalog-panel]')];
    const states = new WeakMap(panels.map(panel => [panel, !panel.hidden]));
    panelObserver = new MutationObserver(records => {
      new Set(records.map(record => record.target)).forEach(panel => {
        const open = !panel.hidden;
        if (states.get(panel) === open) return;
        states.set(panel, open);
        const content = panel.matches('.svc-body')
          ? panel.querySelector('.svc-description') || panel : panel;
        if (open) reveal(content);
        else cancelWithin(content);
      });
    });
    panels.forEach(panel => panelObserver.observe(panel, {
      attributes: true, attributeFilter: ['hidden']
    }));
    listen(root, 'focusin', event => {
      [...masks.keys()].forEach(target => {
        if (target.contains(event.target)) cancelMask(target);
      });
    }, true);
  }

  function stop(cause) {
    active = false;
    reason = cause;
    generation += 1;
    effectCleanups.splice(0).forEach(remove => remove());
    reelObserver?.disconnect();
    panelObserver?.disconnect();
    [...masks.keys()].forEach(cancelMask);
    maskObserver?.disconnect();
    reelObserver = null;
    panelObserver = null;
    maskObserver = null;
    explicitIntentUntil = 0;
    if (renderer) {
      renderer.destroy();
      rendererFacts = renderer.diagnostics();
      renderer = null;
    }
    delete body.dataset.a1Overdrive;
    publish();
  }

  function start() {
    if (!requested || active) return;
    if (!preferenceCleanups.length) {
      let previousBlocked = blocked();
      const updatePreference = () => {
        const nextBlocked = blocked();
        // Network-quality changes do not own this scene. Only a change in an
        // actual motion/data restriction may tear down and restore the layer.
        if (nextBlocked === previousBlocked) return;
        previousBlocked = nextBlocked;
        stop(nextBlocked || 'preference-change');
        if (requested && !nextBlocked) start();
      };
      listen(reduced, 'change', updatePreference, undefined, preferenceCleanups);
      listen(connection, 'change', updatePreference, undefined, preferenceCleanups);
      listen(window, 'pageshow', () => { if (requested) start(); }, undefined, preferenceCleanups);
    }
    reason = blocked() || 'ready';
    if (blocked()) { publish(); return; }
    active = true;
    body.dataset.a1Overdrive = 'ready';
    installPanels();

    if (player && video) {
      // Source playback remains the sole authority. Only a captured user intent
      // followed by a real play event may repeat the assembly after the first.
      const rememberIntent = () => {
        if (video.paused || video.ended) explicitIntentUntil = performance.now() + 2000;
      };
      listen(control, 'click', rememberIntent, true);
      listen(video, 'pointerdown', rememberIntent, true);
      listen(video, 'keydown', event => {
        if ([' ', 'Enter', 'MediaPlayPause', 'k'].includes(event.key)) rememberIntent();
      }, true);
      listen(video, 'play', () => {
        const explicit = explicitIntentUntil > performance.now();
        explicitIntentUntil = 0;
        if (explicit) assemble('explicit-play');
      });
      listen(video, 'pause', () => cancelReel('video-pause'));
      listen(video, 'ended', () => cancelReel('video-ended'));
      listen(video, 'error', () => cancelReel('video-error'));

      if ('IntersectionObserver' in window) {
        reelObserver = new IntersectionObserver(entries => {
          const entry = entries[entries.length - 1];
          visibleRatio = entry.intersectionRatio;
          if (!entry.isIntersecting) cancelReel('offscreen');
          else if (visibleRatio >= .5 && !initialAttempted) assemble('initial');
          publish();
        }, { threshold: [0, .5] });
        reelObserver.observe(player);
      } else {
        listen(window, 'scroll', measureVisibility, { passive: true });
        measureVisibility();
      }
    }
    listen(window, 'resize', () => {
      cancelReel('resize');
      [...masks.keys()].forEach(cancelMask);
      // Resize resets only this overlay; the showreel controller recalculates
      // its own geometry before any later explicit replay.
      if (!reelObserver) measureVisibility();
    }, { passive: true });
    listen(document, 'visibilitychange', () => {
      if (!document.hidden) return;
      cancelReel('document-hidden');
      [...masks.keys()].forEach(cancelMask);
    });
    listen(window, 'pagehide', () => stop('page-hidden'));
    publish();
  }

  window.A1Overdrive = Object.freeze({
    enable() {
      requested = true;
      start();
      return diagnostics();
    },
    disable() {
      requested = false;
      stop('disabled');
      preferenceCleanups.splice(0).forEach(remove => remove());
      return diagnostics();
    },
    replay() { return assemble('api-replay'); },
    diagnostics
  });
  start();
  publish();
})();
