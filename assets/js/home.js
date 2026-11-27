/* showreel */
(() => {
  'use strict';
  const stage = document.querySelector('.showreel-stage');
  if (!stage) return;
  const origin = stage.querySelector('.hero-reel-slot');
  const runway = stage.querySelector('.showreel-runway');
  const player = stage.querySelector('.showreel-player');
  const video = player.querySelector('video');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Matches the breakpoint where the hero gains its second column.
  const desktopLayout = matchMedia('(min-width: 1000px)');
  let geometry;
  let frame = 0;
  let lastProgress = -1;
  let inView = false;
  let userPaused = false;

  // The same player stays in normal flow on compact screens and expands on desktop.
  video.controls = false;
  video.tabIndex = 0;
  video.setAttribute('role', 'button');

  function paint() {
    frame = 0;
    if (!geometry || !desktopLayout.matches) return;
    const g = geometry;
    let p = reduced.matches ? 0 : Math.min(1, Math.max(0, (scrollY - g.start) / Math.max(1, g.end - g.start)));
    if (p === lastProgress) return;
    lastProgress = p;
    const eased = p * p * (3 - 2 * p);
    const x = g.ox + (g.tx - g.ox) * eased;
    const y = g.oy + (g.ty - g.oy) * eased;
    const s = g.startScale + (1 - g.startScale) * eased;
    player.style.setProperty('--reel-x', `${x.toFixed(2)}px`);
    player.style.setProperty('--reel-y', `${y.toFixed(2)}px`);
    player.style.setProperty('--reel-scale', s.toFixed(5));
    player.style.setProperty('--reel-inverse', (1 / s).toFixed(5));
    player.style.setProperty('--reel-radius', `${(20 * (1 - eased)).toFixed(2)}px`);
    stage.dataset.reelProgress = p.toFixed(3);
    stage.style.setProperty('--reel-proof-opacity', String(Math.max(0, 1 - Math.max(0, p - .12) / .32)));
    stage.toggleAttribute('data-expanded', p >= .44);
    stage.toggleAttribute('data-settled', p === 0 || p === 1 || reduced.matches);
  }
  function queue() { if (geometry && !frame) frame = requestAnimationFrame(paint); }
  function measure() {
    stage.toggleAttribute('data-reduced', reduced.matches);
    if (!desktopLayout.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      geometry = null;
      lastProgress = -1;
      stage.removeAttribute('data-enhanced');
      stage.removeAttribute('data-expanded');
      stage.removeAttribute('data-settled');
      delete stage.dataset.reelProgress;
      stage.style.removeProperty('--reel-proof-opacity');
      ['--reel-x', '--reel-y', '--reel-scale', '--reel-inverse', '--reel-radius'].forEach(name => player.style.removeProperty(name));
      ['--reel-width', '--reel-height'].forEach(name => stage.style.removeProperty(name));
      if (player.parentElement !== origin) origin.append(player);
      playback();
      return;
    }
    if (player.parentElement !== stage) stage.append(player);
    stage.dataset.enhanced = '';
    const base = stage.getBoundingClientRect();
    const rect = origin.getBoundingClientRect();
    const palette = document.querySelector('.palette-bar:not([hidden])');
    const toolbar = palette?.getBoundingClientRect().height || 0;
    const availableHeight = Math.max(180, innerHeight - toolbar - 24);
    const width = reduced.matches ? rect.width : Math.min(document.documentElement.clientWidth, availableHeight * 16 / 9);
    const height = width * 9 / 16;
    stage.style.setProperty('--reel-width', `${width}px`);
    stage.style.setProperty('--reel-height', `${height}px`);
    const destination = runway.getBoundingClientRect();
    const originalPageY = rect.top + scrollY;
    const destinationPageY = destination.top + scrollY + 40;
    const viewportTop = toolbar + Math.max(12, (innerHeight - toolbar - height) / 2);
    const start = Math.max(0, originalPageY - innerHeight * .7);
    geometry = {
      ox: rect.left - base.left,
      oy: rect.top - base.top,
      tx: (base.width - width) / 2,
      ty: reduced.matches ? rect.top - base.top : destination.top - base.top + 40,
      start,
      end: Math.max(start + innerHeight * .45, destinationPageY - viewportTop),
      startScale: rect.width / width
    };
    lastProgress = -1;
    paint();
    playback();
  }
  function syncPlaybackState() {
    const playing = !video.paused && !video.ended;
    player.toggleAttribute('data-playing', playing);
    video.setAttribute('aria-label', playing ? 'Приостановить шоурил' : 'Воспроизвести шоурил');
    video.setAttribute('aria-pressed', String(playing));
  }
  function playback() {
    if (inView && !document.hidden && !userPaused && !reduced.matches) video.play().catch(syncPlaybackState);
    else video.pause();
  }
  function togglePlayback() {
    if (video.controls) return;
    if (video.paused) { userPaused = false; video.play().catch(syncPlaybackState); }
    else { userPaused = true; video.pause(); }
  }
  video.addEventListener('click', togglePlayback);
  video.addEventListener('keydown', event => {
    if (video.controls || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    togglePlayback();
  });
  video.addEventListener('play', syncPlaybackState);
  video.addEventListener('pause', syncPlaybackState);
  video.addEventListener('ended', syncPlaybackState);
  video.addEventListener('error', () => {
    video.controls = true;
    video.removeAttribute('role');
    video.removeAttribute('aria-pressed');
  });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', playback);
  reduced.addEventListener('change', () => { measure(); playback(); });
  desktopLayout.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(origin);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; playback(); }, { threshold: .08 }).observe(player);
  } else { inView = true; playback(); }
  document.fonts?.ready.then(measure);
  measure();
  syncPlaybackState();
})();

/* clients-marquee */
/* One CSS loop, measured from the original list; no frame-by-frame scripting. */
(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed = 50; // px/s at every viewport width.

  document.querySelectorAll('[data-clients-marquee]').forEach((root) => {
    const viewport = root.querySelector('.clients-marquee__viewport');
    const track = root.querySelector('.clients-marquee__track');
    const original = track?.querySelector('.clients-marquee__list');
    if (!viewport || !track || !original) return;

    let hovering = false;
    let visible = false;
    let distance = 0;
    let scheduledMeasure = 0;
    let clones = [];

    function updatePlayback() {
      const paused = hovering || viewport.matches(':focus-visible') || !visible || document.hidden || motionPreference.matches;
      root.dataset.motionPaused = String(paused);
    }

    function cloneList() {
      const clone = original.cloneNode(true);
      clone.dataset.marqueeClone = '';
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      clone.querySelectorAll('img').forEach((image) => {
        image.alt = '';
        image.loading = 'eager';
      });
      track.append(clone);
      return clone;
    }

    function measure() {
      scheduledMeasure = 0;
      if (motionPreference.matches || !root.hasAttribute('data-clients-enhanced')) return;
      const nextDistance = original.getBoundingClientRect().width;
      if (!nextDistance) return;

      // Retain the travelled distance when responsive dimensions change.
      const animation = track.getAnimations?.().find((item) => item.animationName === 'clients-marquee-loop');
      const travelled = distance && animation && typeof animation.currentTime === 'number'
        ? ((animation.currentTime / 1000 * speed) % distance)
        : 0;
      distance = nextDistance;
      root.style.setProperty('--clients-distance', `${distance}px`);
      root.style.setProperty('--clients-duration', `${distance / speed}s`);

      // Enough complete groups to fill the viewport even on an ultrawide screen.
      const count = Math.max(1, Math.ceil(viewport.clientWidth / distance));
      while (clones.length < count) clones.push(cloneList());
      while (clones.length > count) clones.pop().remove();

      const resizedAnimation = track.getAnimations?.().find((item) => item.animationName === 'clients-marquee-loop');
      if (resizedAnimation) resizedAnimation.currentTime = (travelled % distance) / speed * 1000;
      updatePlayback();
    }

    function scheduleMeasure() {
      if (!scheduledMeasure) scheduledMeasure = requestAnimationFrame(measure);
    }

    function updateMotionPreference() {
      if (motionPreference.matches) {
        root.removeAttribute('data-clients-enhanced');
        viewport.removeAttribute('tabindex');
        clones.forEach((clone) => clone.remove());
        clones = [];
        distance = 0;
      } else {
        root.setAttribute('data-clients-enhanced', '');
        viewport.tabIndex = 0;
        measure();
      }
      updatePlayback();
    }

    viewport.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovering = true;
      updatePlayback();
    });
    viewport.addEventListener('pointerleave', () => {
      hovering = false;
      updatePlayback();
    });
    viewport.addEventListener('focus', updatePlayback);
    viewport.addEventListener('blur', updatePlayback);
    document.addEventListener('visibilitychange', updatePlayback);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        updatePlayback();
      });
      observer.observe(viewport);
    } else {
      const checkVisibility = () => {
        const bounds = viewport.getBoundingClientRect();
        visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
        updatePlayback();
      };
      window.addEventListener('scroll', checkVisibility, { passive: true });
      window.addEventListener('resize', checkVisibility, { passive: true });
      checkVisibility();
    }

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(scheduleMeasure);
      observer.observe(viewport);
      observer.observe(original);
    } else {
      window.addEventListener('resize', scheduleMeasure, { passive: true });
    }
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', updateMotionPreference);
    else motionPreference.addListener(updateMotionPreference);
    updateMotionPreference();
  });
})();

/* home-narrative-motion */
(() => {
  'use strict';

  const page = document.querySelector('body.type-study');
  if (!page || page.dataset.homeNarrativeMotion === 'ready') return;
  page.dataset.homeNarrativeMotion = 'ready';

  // The selected diagram is fully orange and static; only reading position moves.
  const system = page.querySelector('#system');
  if (system) system.dataset.homeSystemMotion = 'static';
  const processGrid = page.querySelector('#process .process-grid');
  const workboard = page.querySelector('#process .process-workboard');
  const processRows = processGrid ? [...processGrid.children] : [];
  const boardControls = workboard?.querySelector('.process-workboard__meter');
  const boardButtons = boardControls ? [...boardControls.querySelectorAll('[data-board-step]')] : [];
  const boardStatus = workboard?.querySelector('.process-workboard__status');
  const boardViews = workboard?.querySelectorAll('.process-workboard__panels > [data-view]') ?? [];
  let processObserver;
  let processVisible = false;
  let scrollAttached = false;
  let readingFrame = 0;
  let currentStepIndex = -1;
  let manualScrollY = null;
  let boardFollowTimer = 0;

  const highlightProcessStep = (stepIndex) => {
    if (stepIndex === currentStepIndex) return;
    currentStepIndex = stepIndex;
    processRows.forEach((row, index) => {
      const otherState = index < stepIndex ? 'passed' : 'idle';
      row.dataset.processState = index === stepIndex ? 'current' : otherState;
    });
  };

  const showBoardStep = (step, announce = false) => {
    if (!workboard || workboard.dataset.step === step) return;
    workboard.dataset.step = step;
    boardViews.forEach(view => {
      view.toggleAttribute('inert', view.dataset.view !== step);
    });
    boardButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.boardStep === step));
    });
    if (announce && boardStatus) {
      const activeButton = boardButtons.find(button => button.dataset.boardStep === step);
      boardStatus.textContent = activeButton?.getAttribute('aria-label') || '';
    }
  };

  if (boardButtons.length) {
    boardButtons.forEach(button => button.addEventListener('click', () => {
      const step = button.dataset.boardStep;
      window.clearTimeout(boardFollowTimer);
      manualScrollY = window.scrollY;
      highlightProcessStep(Number(step) - 1);
      showBoardStep(step, true);
    }));
    boardControls.hidden = false;
  }

  const visible = (element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  };

  const updateReadingPosition = () => {
    readingFrame = 0;
    if (!processVisible || document.hidden || !processRows.length) return;
    if (manualScrollY !== null && Math.abs(window.scrollY - manualScrollY) < 40) return;
    manualScrollY = null;
    const readingLine = window.innerHeight * .38;
    let stepIndex = -1;
    let nearestDistance = Infinity;

    processRows.forEach((candidate, index) => {
      const bounds = candidate.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const distance = bounds.top > readingLine
        ? bounds.top - readingLine
        : Math.max(0, readingLine - bounds.bottom);
      if (distance < nearestDistance) {
        stepIndex = index;
        nearestDistance = distance;
      }
    });

    highlightProcessStep(stepIndex);
    if (stepIndex < 0) return;

    const step = String(stepIndex + 1);
    if (!boardButtons.length) {
      showBoardStep(step);
    } else if (step !== workboard.dataset.step) {
      boardFollowTimer = window.setTimeout(() => showBoardStep(step), 330);
    }
  };

  const requestReadingUpdate = () => {
    if (!processVisible || document.hidden) return;
    window.clearTimeout(boardFollowTimer);
    if (!readingFrame) readingFrame = window.requestAnimationFrame(updateReadingPosition);
  };

  const attachScroll = (attach) => {
    if (attach === scrollAttached) return;
    scrollAttached = attach;
    if (attach) window.addEventListener('scroll', requestReadingUpdate, { passive: true });
    else {
      window.removeEventListener('scroll', requestReadingUpdate);
      window.cancelAnimationFrame(readingFrame);
      window.clearTimeout(boardFollowTimer);
      readingFrame = 0;
    }
  };

  if (processGrid && processRows.length && 'IntersectionObserver' in window) {
    processGrid.dataset.processMotion = 'ready';
    processObserver = new IntersectionObserver((entries) => {
      processVisible = entries[0].isIntersecting;
      attachScroll(processVisible && !document.hidden);
      requestReadingUpdate();
    }, { threshold: 0 });
    processObserver.observe(processGrid);
  }

  window.addEventListener('resize', () => {
    requestReadingUpdate();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        attachScroll(false);
      return;
    }
    if (processGrid && processObserver) processVisible = visible(processGrid);
    attachScroll(processVisible);
    requestReadingUpdate();
  });

  window.addEventListener('pagehide', () => {
    attachScroll(false);
  });

  window.addEventListener('pageshow', () => {
    if (processGrid && processObserver) processVisible = visible(processGrid);
    attachScroll(processVisible && !document.hidden);
    requestReadingUpdate();
  });
})();

/* control feedback */
(() => {
  'use strict';
  const root = document.querySelector('.type-study');
  if (!root || typeof Element.prototype.animate !== 'function') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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

  // Acknowledgment moves only the icon, so hit areas never shrink or shift.
  const buttons = [...root.querySelectorAll('.track-controls button, .menu-toggle, .showreel-control')];
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
  window.addEventListener('resize', cancelAll, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
  window.addEventListener('pagehide', cancelAll);
  root.dataset.homeInteractionMotion = 'ready';
})();

/* link-effects */
(() => {
  'use strict';

  const root = document.querySelector('.type-study');
  if (!root || typeof Element.prototype.animate !== 'function') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(min-width: 760px) and (hover: hover) and (pointer: fine)');
  const ease = 'cubic-bezier(.16, 1, .3, 1)';
  const running = new Map();
  let pendingArrival = null;
  let arrivalMark = null;

  function stop(target) {
    const animation = running.get(target);
    if (!animation) return;
    running.delete(target);
    animation.cancel();
  }

  function play(target, frames, duration, finish) {
    if (typeof target.animate !== 'function' || document.hidden) return false;
    stop(target);

    let animation;
    try {
      animation = target.animate(frames, { duration, easing: ease });
    } catch {
      return false;
    }
    running.set(target, animation);
    const cleanup = () => {
      if (running.get(target) === animation) running.delete(target);
      finish?.();
    };
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
    return true;
  }

  // Match the existing A1 arrow path without affecting the other link icons.
  root.querySelectorAll('a').forEach(link => {
    const path = link.querySelector(':scope > svg > path');
    if (path?.getAttribute('d')?.replace(/\s/g, '') !== 'M519195M65h13v13') return;
    link.dataset.a1Launch = '';

    function launch() {
      const frames = reduced.matches
        ? [{ opacity: .55 }, { opacity: 1 }]
        : [{ transform: 'translate(0, 0)', opacity: 1 },
          { transform: 'translate(12px, -12px)', opacity: 0, offset: .44 },
          { transform: 'translate(-12px, 12px)', opacity: 0, offset: .45 },
          { transform: 'translate(0, 0)', opacity: 1 }];
      play(path, frames, reduced.matches ? 100 : 340);
    }

    link.addEventListener('pointerenter', event => {
      if (fine.matches && event.pointerType === 'mouse') launch();
    }, { passive: true });
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) launch(); });
    link.addEventListener('pointerleave', () => stop(path));
    link.addEventListener('blur', () => stop(path));
  });

  function removeArrivalMark(mark) {
    const heading = mark.parentElement;
    mark.remove();
    if (!heading?.querySelector('.a1-arrival-rule')) heading?.classList.remove('a1-arrival-heading');
    if (arrivalMark === mark) arrivalMark = null;
  }

  function clearArrival() {
    arrivalObserver?.disconnect();
    pendingArrival = null;
    if (!arrivalMark) return;
    const mark = arrivalMark;
    stop(mark);
    removeArrivalMark(mark);
  }

  function markArrival(heading) {
    clearArrival();
    if (document.hidden) return;
    const mark = document.createElement('span');
    mark.className = 'a1-arrival-rule';
    mark.setAttribute('aria-hidden', 'true');
    heading.classList.add('a1-arrival-heading');
    heading.append(mark);
    arrivalMark = mark;

    const frames = reduced.matches
      ? [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0 }]
      : [{ transform: 'scaleX(0)', opacity: 0 },
        { transform: 'scaleX(1)', opacity: 1, offset: .35 },
        { transform: 'scaleX(1)', opacity: 1, offset: .75 },
        { transform: 'scaleX(1)', opacity: 0 }];
    if (!play(mark, frames, reduced.matches ? 600 : 1000, () => removeArrivalMark(mark))) {
      removeArrivalMark(mark);
    }
  }

  const arrivalObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === pendingArrival && item.isIntersecting);
      if (entry) markArrival(entry.target);
    }, { threshold: .55 })
    : null;

  if (arrivalObserver) root.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id === 'top' ? 'hero' : id);
    const heading = target?.querySelector('h2') || target?.querySelector('h1');
    if (!heading) return;
    clearArrival();
    pendingArrival = heading;
    arrivalObserver.observe(heading);
  });

  function cancelAll() {
    clearArrival();
    for (const target of running.keys()) stop(target);
  }

  function preferenceChanged() {
    cancelAll();
    root.dataset.a1DelightMotion = reduced.matches ? 'reduced' : 'full';
  }

  reduced.addEventListener('change', preferenceChanged);
  window.addEventListener('blur', cancelAll);
  window.addEventListener('pagehide', cancelAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
  root.dataset.a1Delight = 'ready';
  root.dataset.a1DelightMotion = reduced.matches ? 'reduced' : 'full';
})();

/* panel-effects */
(() => {
  'use strict';

  const root = document.querySelector('.type-study');
  const body = document.body;
  if (!root || !body || typeof Element.prototype.animate !== 'function') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const masks = new Map();
  let suspended = false;
  let active = false;

  function frontier(amount) {
    const points = ['0% 0%', '100% 0%'];
    for (let column = 5; column >= 0; column -= 1) {
      const edge = amount >= 1 ? 100 : Math.min(100, 58 + amount * 72 - column * 7);
      points.push(`${((column + 1) / 6 * 100).toFixed(3)}% ${edge}%`);
      points.push(`${(column / 6 * 100).toFixed(3)}% ${edge}%`);
    }
    return `polygon(${points.join(',')})`;
  }

  const frames = [
    { clipPath: frontier(0) },
    { clipPath: frontier(.54), offset: .48 },
    { clipPath: frontier(1) },
  ];
  if (!window.CSS?.supports('clip-path', frames[0].clipPath)) return;

  const maskObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => { if (!entry.isIntersecting) cancelMask(entry.target); });
    })
    : null;

  function cancelMask(target) {
    const animation = masks.get(target);
    if (!animation) return;
    masks.delete(target);
    maskObserver?.unobserve(target);
    animation.cancel();
  }

  function cancelWithin(container) {
    for (const target of masks.keys()) {
      if (target === container || container.contains(target)) cancelMask(target);
    }
  }

  function cancelAll() {
    for (const target of masks.keys()) cancelMask(target);
  }

  function reveal(target) {
    cancelMask(target);
    if (!active || document.hidden || !target.getClientRects().length) return;
    // Keep the focus ring visible during keyboard navigation.
    if (target.contains(document.activeElement)) return;
    if ([...masks.keys()].some(parent => parent.contains(target))) return;

    let animation;
    try {
      animation = target.animate(frames, { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
    } catch {
      return;
    }
    masks.set(target, animation);
    maskObserver?.observe(target);

    const finish = () => {
      if (masks.get(target) !== animation) return;
      masks.delete(target);
      maskObserver?.unobserve(target);
    };
    animation.addEventListener('finish', finish, { once: true });
    animation.addEventListener('cancel', finish, { once: true });
  }

  root.querySelectorAll('.faq-list > details, .site-header .nav-pop, .site-header .city-choice')
    .forEach(disclosure => {
      const panel = disclosure.querySelector(
        ':scope > .faq-answer, :scope > .catalog-menu, :scope > .company-drop, :scope > div',
      );
      if (!panel) return;
      let open = disclosure.open;
      disclosure.addEventListener('toggle', () => {
        if (open === disclosure.open) return;
        open = disclosure.open;
        if (open) reveal(panel);
        else cancelWithin(panel);
      });
    });

  if ('MutationObserver' in window) {
    const panels = [...root.querySelectorAll('[data-catalog-panel]')];
    const openStates = new WeakMap(panels.map(panel => [panel, !panel.hidden]));
    const observer = new MutationObserver(records => {
      for (const panel of new Set(records.map(record => record.target))) {
        const open = !panel.hidden;
        if (openStates.get(panel) === open) continue;
        openStates.set(panel, open);
        if (open) reveal(panel);
        else cancelWithin(panel);
      }
    });
    panels.forEach(panel => observer.observe(panel, {
      attributes: true, attributeFilter: ['hidden'],
    }));
  }

  root.addEventListener('focusin', event => {
    for (const target of masks.keys()) {
      if (target.contains(event.target)) cancelMask(target);
    }
  }, true);

  function updatePreference() {
    active = !suspended && !reduced.matches && !connection?.saveData;
    if (active) body.dataset.a1Overdrive = 'ready';
    else {
      delete body.dataset.a1Overdrive;
      cancelAll();
    }
  }

  reduced.addEventListener('change', updatePreference);
  connection?.addEventListener?.('change', updatePreference);
  window.addEventListener('resize', cancelAll, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
  window.addEventListener('pagehide', () => { suspended = true; updatePreference(); });
  window.addEventListener('pageshow', () => { suspended = false; updatePreference(); });
  updatePreference();
})();

/* system-route-motion */
(() => {
  const section = document.querySelector('.system-route-motion');
  if (!section || !('IntersectionObserver' in window)) return;

  const route = section.querySelector('.route-flow');
  if (!route) return;
  const steps = [...route.querySelectorAll('.route-stage')];
  if (!steps.length) return;
  const revealOnce = section.classList.contains('system-route-reveal');
  const softReveal = revealOnce && document.body.dataset.motionTempo === 'soft';
  const readingFirst = softReveal && section.hasAttribute('data-route-reading-first');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const horizontal = matchMedia('(min-width: 1100px)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const progressBetween = (position, start, end) => clamp((start - position) / (start - end));
  const easeReveal = progress => (progress * (2 - progress)).toFixed(4);
  const readingGoal = (position, desktop) => desktop
    ? Math.max(.44, Math.min(1, position))
    : Math.min(1, position);
  const lines = [...route.querySelectorAll('.route-connector')].map(track => {
    const draw = track.cloneNode(true);
    // Each pair uses the original marker definition, so SVG IDs remain unique.
    draw.querySelector('defs')?.remove();
    draw.classList.add('route-connector--draw');
    track.after(draw);
    return { track, draw, progress: 0 };
  });

  let visible = false;
  let frame = 0;
  let finished = false;
  let settled = false;
  let readingPosition = 1;
  let readingFrameTime = null;
  let readingEdge = null;

  function advanceReadingPosition(position, desktop, skipped, now) {
    const target = readingGoal(position, desktop);
    if (skipped) {
      readingPosition = target;
      readingFrameTime = null;
      return false;
    }

    const elapsed = readingFrameTime === null ? 0 : Math.min(32, now - readingFrameTime);
    const maxLag = desktop ? .55 : .24;
    const rate = desktop ? .00046 : .00105;
    const ease = 1 - Math.exp(-elapsed / (desktop ? 110 : 85));
    // One shared position keeps arrows and stages in sequence in either direction.
    const distance = target - readingPosition;
    const travel = Math.min(Math.abs(distance), maxLag);
    const remaining = travel - Math.min(elapsed * rate, travel * ease);
    const catchingUp = remaining > .001;
    readingPosition = catchingUp ? target - Math.sign(distance) * remaining : target;
    readingFrameTime = catchingUp ? now : null;
    return catchingUp;
  }

  function paint(now = performance.now()) {
    frame = 0;
    if (reduced.matches || document.hidden) return;

    const desktop = horizontal.matches;
    const viewport = window.innerHeight;
    const { top: routeTop, bottom: routeBottom } = route.getBoundingClientRect();
    const routePosition = routeTop / viewport;
    const passedRoute = softReveal && routeBottom <= 0;
    const beforeRoute = routeTop >= viewport;
    if (readingFirst) {
      const edge = passedRoute ? 'past' : beforeRoute ? 'before' : null;
      if (edge && edge === readingEdge) return;
      readingEdge = edge;
    } else if (softReveal) {
      if (finished && !passedRoute) return;
      if (beforeRoute && section.hasAttribute('data-route-reveal-ready')) return;
    }

    let start = viewport * .88;
    let travel = viewport * .69;
    const sectionTop = revealOnce ? section.getBoundingClientRect().top : 0;
    if (desktop && revealOnce && !readingFirst) {
      start = Math.min(start, routeTop - sectionTop + 24);
      const end = softReveal
        ? Math.min(viewport * .105, start * .43)
        : Math.min(viewport * .13, start * .45);
      travel = Math.max(softReveal ? 1 : 120, start - end);
    }
    const total = (start - routeTop) / travel;
    const readingLine = softReveal
      ? Math.min(viewport * .76, routeTop - sectionTop + 32 + Math.max(0, -sectionTop) * .35)
      : viewport * .76;
    const skippedReading = passedRoute || beforeRoute;
    const catchingUp = readingFirst && advanceReadingPosition(routePosition, desktop, skippedReading, now);
    const revealOffset = readingPosition - routePosition;
    const stagePositions = readingFirst
      ? steps.map(step => desktop ? readingPosition : step.getBoundingClientRect().top / viewport + revealOffset)
      : [];
    const values = lines.map(({ track }, index) => {
      if (passedRoute) return 1;
      if (readingFirst) {
        if (!desktop) return progressBetween(stagePositions[index + 1] ?? readingPosition, .90, .53);
        const arrowStart = .91 - .12 * index;
        return progressBetween(readingPosition, arrowStart, arrowStart - .21);
      }
      if (desktop) return clamp(total * lines.length - index);
      const { top, height } = track.getBoundingClientRect();
      return clamp((readingLine - top) / Math.max(1, height));
    });

    if (readingFirst) {
      steps.forEach((step, index) => {
        const markerStart = desktop ? (index === 0 ? .99 : .96 - .12 * index) : .86;
        const copyEnd = desktop ? markerStart - .15 : .47;
        const position = stagePositions[index];
        const markerValue = passedRoute ? 1 : progressBetween(position, markerStart, markerStart - .08);
        const copyValue = passedRoute ? 1 : progressBetween(position, markerStart - .04, copyEnd);
        step.style.setProperty('--route-marker-reveal', easeReveal(markerValue));
        step.style.setProperty('--route-copy-reveal', easeReveal(copyValue));
        step.toggleAttribute('data-reached', markerValue > 0);
      });
    } else {
      steps[0].setAttribute('data-reached', '');
    }
    if (passedRoute && !readingFirst) {
      settled = true;
      section.setAttribute('data-route-settled', '');
    }
    const revealAt = softReveal ? .88 : 1;
    lines.forEach((line, index) => {
      const { draw } = line;
      const value = revealOnce && !readingFirst ? Math.max(line.progress, values[index]) : values[index];
      line.progress = value;
      draw.style.setProperty('--route-drawn', value.toFixed(4));
      draw.toggleAttribute('data-drawn', value >= 1);
      const step = steps[index + 1];
      if (!readingFirst && step && (!revealOnce || value >= revealAt)) {
        step.toggleAttribute('data-reached', value >= revealAt);
      }
    });
    section.setAttribute('data-route-motion', '');
    if (revealOnce) section.setAttribute('data-route-reveal-ready', '');
    if (softReveal && !readingFirst) finished = lines.every(line => line.progress >= 1);
    if (catchingUp) schedule();
  }

  function schedule() {
    // A fast scroll may leave the viewport before the last intersection sample.
    const needsPaint = softReveal ? !settled : visible;
    if (needsPaint && !reduced.matches && !document.hidden && !frame) {
      frame = requestAnimationFrame(paint);
    }
  }

  function syncMotionPreference() {
    if (reduced.matches) {
      section.removeAttribute('data-route-motion');
      readingFrameTime = null;
      readingEdge = null;
      if (revealOnce) {
        section.removeAttribute('data-route-reveal-ready');
        // Static mode exposes every stage. One-shot routes retain their completion.
        steps.forEach(step => step.setAttribute('data-reached', ''));
        lines.forEach(line => { line.progress = 1; });
      }
    } else if (revealOnce) paint();
    else schedule();
  }

  reduced.addEventListener('change', syncMotionPreference);
  horizontal.addEventListener('change', () => {
    const position = route.getBoundingClientRect().top / window.innerHeight;
    readingPosition = readingGoal(position, horizontal.matches);
    readingFrameTime = null;
    readingEdge = null;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  if (softReveal) window.addEventListener('pageshow', schedule);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible || softReveal) schedule();
  }).observe(route);

  if (revealOnce) syncMotionPreference();
})();

/* system-assembly */
(() => {
  const scene = document.querySelector('.system-assembly-scene');
  if (!scene || !('IntersectionObserver' in window)) return;

  const connectedCycle = scene.dataset.assembly === 'connected-cycle';
  const scrollCycle = connectedCycle || scene.dataset.assembly === 'scroll-cycle';
  const motion = scrollCycle
    ? matchMedia('(prefers-reduced-motion: no-preference)')
    : matchMedia('(min-width: 1000px) and (prefers-reduced-motion: no-preference)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let visible = false;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let cycleAssembly = scrollCycle && scene.getBoundingClientRect().top >= innerHeight ? 0 : null;
  let previousAssemblyFrame = null;

  function paint(now) {
    frame = 0;
    if (!visible || !motion.matches || document.hidden) return;

    const bounds = scene.getBoundingClientRect();
    const start = scrollCycle ? .94 : .83;
    const distance = connectedCycle
      ? Math.min(440, Math.max(225, innerHeight * .43))
      : (scrollCycle ? Math.min(300, Math.max(140, innerHeight * .31)) : innerHeight * .61);
    const progress = clamp((innerHeight * start - bounds.top) / distance);
    const eased = scrollCycle && !connectedCycle
      ? 1 - (1 - progress) ** 1.65
      : progress * progress * (3 - 2 * progress);
    let assembly = eased;
    if (scrollCycle) {
      // Fast wheel jumps are still seen as motion, while slow scrolling stays proportional.
      const elapsed = previousAssemblyFrame === null ? 16 : Math.min(now - previousAssemblyFrame, 48);
      cycleAssembly ??= eased;
      const settling = connectedCycle ? 96 : 44;
      cycleAssembly += (eased - cycleAssembly) * (1 - Math.exp(-elapsed / settling));
      if (Math.abs(eased - cycleAssembly) < .006) cycleAssembly = eased;
      previousAssemblyFrame = now;
      assembly = cycleAssembly;
    }
    currentX += (pointerX - currentX) * .17;
    currentY += (pointerY - currentY) * .17;

    scene.style.setProperty('--assembled', assembly.toFixed(4));
    scene.style.setProperty('--angle-x', `${(currentY * -7).toFixed(2)}deg`);
    scene.style.setProperty('--angle-y', `${(currentX * 10).toFixed(2)}deg`);
    scene.style.setProperty('--pointer-x', currentX.toFixed(3));
    scene.style.setProperty('--pointer-y', currentY.toFixed(3));
    if (scrollCycle && assembly >= .87 && !scene.hasAttribute('data-cycle-play')) {
      scene.setAttribute('data-cycle-play', '');
    } else if (scrollCycle && assembly <= .09 && scene.hasAttribute('data-cycle-play')) {
      scene.removeAttribute('data-cycle-play');
    }
    const pointerMoving = Math.abs(currentX - pointerX) + Math.abs(currentY - pointerY) > .004;
    if (pointerMoving || assembly !== eased) schedule();
  }

  function schedule() {
    if (visible && motion.matches && !document.hidden && !frame) frame = requestAnimationFrame(paint);
  }

  function release() {
    pointerX = 0;
    pointerY = 0;
    schedule();
  }

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousAssemblyFrame = null;
    pointerX = pointerY = currentX = currentY = 0;
    scene.style.removeProperty('--angle-x');
    scene.style.removeProperty('--angle-y');
    scene.style.removeProperty('--pointer-x');
    scene.style.removeProperty('--pointer-y');
    if (!motion.matches) {
      scene.style.removeProperty('--assembled');
      cycleAssembly = null;
    }
    schedule();
  }

  scene.addEventListener('pointermove', event => {
    if (!motion.matches || !pointer.matches || event.pointerType === 'touch') return;
    const bounds = scene.getBoundingClientRect();
    pointerX = clamp((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointerY = clamp((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    schedule();
  }, { passive: true });
  scene.addEventListener('pointerleave', release);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', reset);
  motion.addEventListener('change', reset);
  pointer.addEventListener('change', release);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else reset();
  }, { rootMargin: scrollCycle ? '0px 0px 96px 0px' : '0px' }).observe(scene);
})();
