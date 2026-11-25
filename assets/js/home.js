/* type-reviews */
(() => {
  'use strict';
  const track = document.querySelector('[data-reviews-controller="enhanced"]');
  if (!track) return;
  const section = track.closest('#reviews');
  const cards = [...track.querySelectorAll('.review-card')];
  const navigation = section.querySelector('.review-navigation');
  const previous = navigation.querySelector('[data-track-prev]');
  const next = navigation.querySelector('[data-track-next]');
  const status = navigation.querySelector('.review-position');
  const visual = status.querySelector('.review-position-visual');
  const announcement = status.querySelector('.review-position-announcement');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tolerance = 2;
  let targets = [];
  let pendingTarget = null;
  let scrollFrame = 0;
  let settleTimer = 0;
  let lastRange = '';
  let drag = null;
  let suppressDragClick = false;

  function measure() {
    const left = track.getBoundingClientRect().left;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    targets = cards.map(card => Math.min(max, Math.max(0,
      card.getBoundingClientRect().left - left + track.scrollLeft
    ))).filter((value, index, all) => index === 0 || value - all[index - 1] > tolerance);
  }

  function nearestTarget() {
    return targets.reduce((best, value, index) =>
      Math.abs(value - track.scrollLeft) < Math.abs(targets[best] - track.scrollLeft) ? index : best, 0);
  }

  function updateButtons() {
    const position = pendingTarget === null ? track.scrollLeft : targets[pendingTarget];
    previous.disabled = position <= targets[0] + tolerance;
    next.disabled = position >= targets[targets.length - 1] - tolerance;
  }

  function updatePosition() {
    const viewport = track.getBoundingClientRect();
    // A small preview of the next card does not count as a displayed review.
    const visible = cards.map((card, index) => ({ box: card.getBoundingClientRect(), index }))
      .filter(({ box }) => Math.min(box.right, viewport.right) - Math.max(box.left, viewport.left) > box.width / 2);
    if (!visible.length) return;
    const first = visible[0].index + 1;
    const last = visible[visible.length - 1].index + 1;
    const range = first === last ? String(first) : `${first}–${last}`;
    if (range === lastRange) return;
    lastRange = range;
    const current = document.createElement('strong');
    current.textContent = range;
    visual.replaceChildren(current, document.createTextNode(` / ${cards.length}`));
    announcement.textContent = first === last
      ? `Отзыв ${first} из ${cards.length}`
      : `Отзывы ${first}–${last} из ${cards.length}`;
  }

  function settle() {
    if (drag) return;
    clearTimeout(settleTimer);
    pendingTarget = null;
    track.classList.remove('review-drag-snap');
    updateButtons();
    updatePosition();
  }

  function goTo(index) {
    status.setAttribute('aria-live', 'polite');
    pendingTarget = Math.max(0, Math.min(targets.length - 1, index));
    track.scrollTo({ left: targets[pendingTarget], behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    updateButtons();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  }

  function move(direction) {
    goTo((pendingTarget ?? nearestTarget()) + direction);
  }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) {
      track.removeAttribute('data-review-pointer-focus');
    }
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finishDrag(true);
      return;
    }
    if (event.target !== track) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(targets.length - 1);
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  function directInteraction() {
    pendingTarget = null;
    status.setAttribute('aria-live', 'polite');
  }
  function startDrag(event) {
    suppressDragClick = false;
    directInteraction();
    if (event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0 || drag) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.target.closest('a, button, input, textarea, select, summary, [contenteditable]')) return;
    if (targets.length < 2) return;
    // Touch keeps native scrolling. Mouse movement is captured even outside
    // the card, and modified clicks retain native text-selection behavior.
    event.preventDefault();
    clearTimeout(settleTimer);
    track.classList.add('review-drag-snap');
    track.scrollTo({ left: track.scrollLeft, behavior: 'auto' });
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: track.scrollLeft,
      target: nearestTarget(),
      active: false,
    };
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
    track.setAttribute('data-review-pointer-focus', '');
    track.focus({ preventScroll: true });
  }

  function dragMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!(event.buttons & 1)) { finishDrag(true); return; }
    const distance = drag.x - event.clientX;
    if (!drag.active) {
      if (Math.abs(event.clientY - drag.y) > Math.max(12, Math.abs(distance))) {
        finishDrag(true);
        return;
      }
      if (Math.abs(distance) < 8) return;
      drag.active = true;
    }
    event.preventDefault();
    track.scrollLeft = drag.left + distance;
  }

  function finishDrag(cancelled = false) {
    if (!drag) return;
    const completed = drag;
    drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(completed.pointerId)) track.releasePointerCapture(completed.pointerId);
    if (cancelled || !completed.active) { settle(); return; }
    suppressDragClick = true;
    const travelled = track.scrollLeft - completed.left;
    const direction = Math.sign(travelled);
    let destination = nearestTarget();
    const adjacent = Math.max(0, Math.min(targets.length - 1, completed.target + direction));
    const step = Math.abs(targets[adjacent] - targets[completed.target]);
    // An intentional short swipe advances one card; a longer drag can cross
    // several. No momentum keeps the review text under the reader's control.
    if (direction && Math.abs(travelled) >= Math.min(64, step * .2)) {
      destination = direction > 0 ? Math.max(destination, adjacent) : Math.min(destination, adjacent);
    }
    goTo(destination);
  }

  track.addEventListener('pointerdown', startDrag);
  track.addEventListener('pointermove', dragMove);
  track.addEventListener('pointerup', event => {
    if (drag?.pointerId === event.pointerId) finishDrag();
  });
  track.addEventListener('pointercancel', () => finishDrag(true));
  track.addEventListener('lostpointercapture', () => finishDrag(true));
  track.addEventListener('blur', () => track.removeAttribute('data-review-pointer-focus'));
  window.addEventListener('blur', () => finishDrag(true));
  track.addEventListener('click', event => {
    if (suppressDragClick && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
    suppressDragClick = false;
  }, true);
  track.addEventListener('dragstart', event => {
    if (drag) event.preventDefault();
  });
  track.addEventListener('wheel', () => {
    finishDrag(true);
    directInteraction();
  }, { passive: true });
  track.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateButtons();
    });
    clearTimeout(settleTimer);
    if (drag) return;
    settleTimer = setTimeout(settle, 140);
  }, { passive: true });
  track.addEventListener('scrollend', settle);
  function resize() {
    finishDrag(true);
    status.setAttribute('aria-live', 'off');
    pendingTarget = null;
    measure();
    updateButtons();
    updatePosition();
  }
  new ResizeObserver(resize).observe(track);
  resize();
  navigation.hidden = false;
  section.dataset.reviewsReady = '';
})();

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

/* home-heading-reveal */
(() => {
  'use strict';
  const root = document.querySelector('body.type-study');
  if (!root || new URLSearchParams(location.search).get('headings') === 'off') return;
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 759px)');
  const chapterEntrance = root.dataset.headingEntrance === 'chapter';
  const records = new Map();
  let observer;

  function finish(record) {
    if (record.state === 'done') return;
    record.state = 'done';
    observer?.unobserve(record.heading);
    record.animations.forEach(animation => animation.cancel());
    record.animations = [];
    // Restore the actual original text nodes, preserving existing inline emphasis
    // and any unrelated DOM added by other effects while the heading was animating.
    record.parts.forEach(({ marker, node, generated }) => {
      generated.forEach(element => element.remove());
      marker.replaceWith(node);
    });
    record.parts = [];
    record.words = [];
    if (record.labelAdded) record.heading.removeAttribute('aria-label');
    record.heading.dataset.headingReveal = 'done';
  }

  function finishAll() { records.forEach(finish); }
  function finishRunning() {
    records.forEach(record => { if (record.state === 'running') finish(record); });
  }

  function reveal(record) {
    if (record.state !== 'pending') return;
    if (reduced.matches || document.hidden) { finish(record); return; }
    record.state = 'running';
    record.heading.dataset.headingReveal = 'running';
    const timing = chapterEntrance
      ? (compact.matches ? [480, 155, 48] : [640, 290, 58])
      : (compact.matches ? [420, 120, 42] : [560, 220, 42]);
    const [duration, maxStagger, maxStep] = timing;
    const step = Math.min(maxStep, maxStagger / Math.max(1, record.words.length - 1));
    try {
      record.words.forEach((word, index) => {
        record.animations.push(word.animate([
          { transform: 'translateY(125%)' },
          { transform: 'translateY(0)' }
        ], {
          duration,
          delay: index * step,
          easing: 'cubic-bezier(.16, 1, .3, 1)',
          fill: 'both'
        }));
      });
      Promise.all(record.animations.map(animation => animation.finished.catch(() => {})))
        .then(() => { if (record.state === 'running') finish(record); });
    } catch { finish(record); }
  }

  function prepare(heading) {
    const record = { heading, state: 'pending', parts: [], words: [], animations: [], labelAdded: false };
    records.set(heading, record);
    try {
      const originalText = heading.textContent;
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim() && !node.parentElement.closest('svg, [aria-hidden="true"]')) nodes.push(node);
      }
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const marker = document.createComment('a1-heading');
        const generated = [];
        fragment.append(marker);
        node.textContent.split(/(\s+)/u).filter(Boolean).forEach(token => {
          let element;
          if (/^\s+$/u.test(token)) element = document.createTextNode(token);
          else {
            element = document.createElement('span');
            element.className = 'a1-heading-mask';
            const word = document.createElement('span');
            word.className = 'a1-heading-word';
            word.textContent = token;
            element.append(word);
            record.words.push(word);
          }
          fragment.append(element);
          generated.push(element);
        });
        record.parts.push({ marker, node, generated });
        node.replaceWith(fragment);
      });
      if (heading.textContent !== originalText || !record.words.length) {
        finish(record);
        return;
      }
      // Screen readers receive one unchanged phrase, not a list of animated words.
      if (!heading.hasAttribute('aria-label') && !heading.hasAttribute('aria-labelledby')) {
        heading.setAttribute('aria-label', originalText.trim());
        record.labelAdded = true;
      }
      record.words.forEach(word => word.parentElement.setAttribute('aria-hidden', 'true'));
      heading.dataset.headingReveal = 'pending';
      observer.observe(heading);
    } catch { finish(record); }
  }

  function init() {
    if (reduced.matches) {
      root.dataset.headingRevealReady = 'reduced';
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.get(entry.target);
        if (!record) return;
        if (entry.isIntersecting) reveal(record);
        else if (record.state === 'running') finish(record);
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: .01 });

    root.querySelectorAll('.home-section h2:not([data-contact-stroke-heading]), .services-lab h2, #system h2, .svc-additional > h3')
      .forEach(heading => {
        // Never hide a title the visitor could already have seen, including deep links.
        if (heading.getBoundingClientRect().top < innerHeight) heading.dataset.headingReveal = 'done';
        else prepare(heading);
      });
    root.dataset.headingRevealReady = 'ready';
  }

  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
  window.addEventListener('resize', finishRunning, { passive: true });
  window.addEventListener('pagehide', finishAll);
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishRunning(); });
  Promise.resolve(document.fonts?.ready).then(init).catch(finishAll);
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

/* hero-dotfield-glitch */
/* Decorative Quordix slice copies are hidden from the accessibility tree.
   CSS owns the source's 7 s cycle. When points are hidden, visibility and the
   existing reel control gate that cycle without creating a canvas or RAF. */
(() => {
  'use strict';
  if (document.body?.dataset.heroVariant !== 'dotfield') return;
  const accent = document.querySelector('#hero .hero-statement .type-line--accent');
  if (!accent || accent.querySelector('.hero-dotfield-glitch')) return;

  const words = accent.textContent.replace(/\s+/g, ' ').trim();
  if (!words) return;
  const decoration = document.createElement('span');
  decoration.className = 'hero-dotfield-glitch';
  decoration.setAttribute('aria-hidden', 'true');
  decoration.dataset.text = words;
  accent.append(decoration);

  // In the original point-field variant the canvas controller still owns this state.
  if (document.body.dataset.heroPoints !== 'hidden') return;
  const stage = document.querySelector('.showreel-stage');
  const title = document.querySelector('#hero .hero-title');
  const video = stage?.querySelector('.showreel-player video');
  if (!stage || !title) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lifetime = new AbortController();
  const options = { signal: lifetime.signal };
  const passive = { passive: true, signal: lifetime.signal };
  let titleInView = false;
  let pagePaused = false;
  // Allow the effect while the muted reel initially loads, as the point-field did.
  let videoPaused = false;
  let titleObserver;

  function sync(reason) {
    const state = pagePaused ? 'paused' : document.hidden ? 'hidden' : !titleInView ? 'offscreen' : reduced.matches ? 'reduced' : connection?.saveData ? 'data-saving' : videoPaused ? 'video-paused' : 'running';
    const motion = !lifetime.signal.aborted && state === 'running' ? 'running' : 'paused';
    if (stage.dataset.dotfieldMotion !== motion) stage.dataset.dotfieldMotion = motion;
    stage.dataset.dotfieldState = state;
    stage.dataset.dotfieldDiagnostics = JSON.stringify({
      pointsHidden: true, activeRAF: false, pointCount: 0, particleCount: 0,
      titleInView, videoPaused, cssLoop: motion === 'running', reason
    });
  }

  function measureTitle(reason) {
    const rect = title.getBoundingClientRect();
    titleInView = rect.bottom > 0 && rect.top < innerHeight;
    sync(reason);
  }

  if ('IntersectionObserver' in window) {
    titleObserver = new IntersectionObserver(entries => {
      titleInView = entries[0].isIntersecting;
      sync('title-visibility');
    }, { threshold: .15 });
    titleObserver.observe(title);
  } else {
    window.addEventListener('scroll', () => measureTitle('scroll'), passive);
    window.addEventListener('resize', () => measureTitle('resize'), passive);
  }

  reduced.addEventListener('change', () => sync('preference-change'), options);
  connection?.addEventListener?.('change', () => sync('connection-change'), options);
  document.addEventListener('visibilitychange', () => measureTitle('visibility-change'), options);
  video?.addEventListener('pause', () => { videoPaused = true; sync('video-pause'); }, options);
  video?.addEventListener('play', () => { videoPaused = false; measureTitle('video-play'); }, options);
  window.addEventListener('pagehide', event => {
    pagePaused = true;
    sync('pagehide');
    if (event.persisted) return;
    lifetime.abort();
    titleObserver?.disconnect();
  }, options);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    pagePaused = false;
    measureTitle('pageshow');
  }, options);
  measureTitle('initialized');
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

/* case video preview */
(() => {
  const video = document.querySelector('video[data-case-video-src]');
  if (!video || !('IntersectionObserver' in window)) return;

  const cover = video.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const minimumVisibility = .4;

  function syncPlayback() {
    const { top, bottom, height } = cover.getBoundingClientRect();
    const visibleHeight = Math.min(bottom, window.innerHeight) - Math.max(top, 0);
    if (!height || visibleHeight < height * minimumVisibility || document.hidden || reduced.matches) {
      video.pause();
      return;
    }
    if (video.error) return;
    if (!video.hasAttribute('src')) video.src = video.dataset.caseVideoSrc;
    if (video.paused) video.play().catch(() => {});
  }

  video.muted = true;
  video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });
  video.addEventListener('error', () => video.classList.remove('is-ready'));
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', syncPlayback);

  new IntersectionObserver(syncPlayback, { threshold: minimumVisibility }).observe(cover);
  // Fragment navigation and cover entry motion can settle after the first observer callback.
  cover.addEventListener('animationend', syncPlayback);
  window.addEventListener('pageshow', syncPlayback);
  requestAnimationFrame(syncPlayback);
})();

/* resonance-case-motion */
(() => {
  'use strict';
  const section = document.querySelector('#cases');
  if (!section || section.dataset.resonanceCases || !('IntersectionObserver' in window)) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 759px), (max-height: 360px)');
  const soft = document.body?.dataset.motionTempo === 'soft';
  if (reduced.matches || compact.matches) return;

  const records = [...section.querySelectorAll('.project-case')].map(card => {
    const cover = card.querySelector('.project-cover');
    return { card, cover, image: cover?.querySelector('img'), target: soft ? card : cover, done: false };
  }).filter(record => record.cover && record.image);
  if (!records.length) return;
  section.dataset.resonanceCases = 'ready';
  const byTarget = new Map(records.map(record => [record.target, record]));
  let observer;

  function finish(record) {
    record.done = true;
    observer?.unobserve(record.target);
    record.cover.classList.remove('is-resonance-pending', 'is-resonance-entering');
    record.cover.style.removeProperty('--cover-enter-delay');
  }

  function finishAll() {
    records.forEach(finish);
    observer?.disconnect();
  }

  function reveal(record, delay) {
    if (record.done) return;
    record.done = true;
    // The slower trial keeps watching until completion, so fast exits settle it.
    if (!soft) observer.unobserve(record.target);
    // Never hide media while loading, after a deep jump, or as a fallback.
    if (reduced.matches || compact.matches || document.hidden || !record.image.complete || !record.image.naturalWidth) {
      finish(record);
      return;
    }
    record.cover.style.setProperty('--cover-enter-delay', `${delay}ms`);
    record.cover.classList.add('is-resonance-entering');
    record.cover.classList.remove('is-resonance-pending');
  }

  observer = new IntersectionObserver(entries => {
    if (soft) entries.forEach(entry => {
      const record = byTarget.get(entry.target);
      if (record && (entry.boundingClientRect.top < 0 || (record.done && !entry.isIntersecting))) finish(record);
    });
    const incoming = entries.filter(entry => entry.isIntersecting && (
      !soft || entry.intersectionRatio >= .32 || entry.boundingClientRect.height * .32 > innerHeight - 48
    ))
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    let rowTop = -Infinity;
    let row = -1;
    let column = 0;
    incoming.forEach(entry => {
      const record = byTarget.get(entry.target);
      if (!record || record.done) return;
      const top = entry.boundingClientRect.top;
      if (top < 0) { finish(record); return; }
      if (Math.abs(top - rowTop) > 4) {
        rowTop = top;
        row += 1;
        column = 0;
      }
      reveal(record, soft ? Math.min(row, 2) * 80 : Math.min(column++, 2) * 65);
    });
  }, {
    rootMargin: soft ? '0px 0px -48px 0px' : '0px 0px 16px 0px',
    threshold: soft ? [0, .32] : 0
  });

  records.forEach(record => {
    // Anything already in or above the viewport remains fully visible at boot.
    if (record.cover.getBoundingClientRect().top < innerHeight) finish(record);
    else {
      if (soft) record.cover.classList.add('is-resonance-pending');
      observer.observe(record.target);
    }
    record.card.addEventListener('focusin', () => finish(record));
    record.cover.addEventListener('animationend', event => {
      if (event.animationName === 'resonance-cover-enter' || event.animationName === 'resonance-cover-enter-soft') finish(record);
    });
  });

  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
  compact.addEventListener('change', () => { if (compact.matches) finishAll(); });
  const finishAnimating = () => {
    records.forEach(record => {
      if (record.cover.classList.contains('is-resonance-entering')) finish(record);
    });
  };
  window.addEventListener('resize', finishAnimating, { passive: true });
  window.addEventListener('pagehide', finishAll);
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishAnimating();
  });
})();

/* resonance-service-stack */
(() => {
  'use strict';

  const grid = document.querySelector('body[data-motion-tempo="soft"] #services .offers-grid');
  if (!grid || !('IntersectionObserver' in window) || !CSS.supports('selector(:has(.offer-link:focus-visible))')) return;

  const cards = [...grid.querySelectorAll(':scope > .offer')];
  const motion = matchMedia('(min-width: 1100px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)');
  let layers = [];
  let near = false;
  let frame = 0;
  let lastTime = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function schedule() {
    if (near && motion.matches && !document.hidden && layers.length && !frame) {
      frame = requestAnimationFrame(paint);
    }
  }

  function paint(time) {
    frame = 0;
    if (!motion.matches || grid.querySelector('.offer-link:focus-visible')) {
      stop();
      return;
    }

    const top = grid.getBoundingClientRect().top;
    const elapsed = lastTime ? Math.min(50, time - lastTime) : 16.7;
    const ease = 1 - Math.exp(-elapsed / 140);
    let moving = false;
    lastTime = time;

    layers.forEach(layer => {
      const nextTop = top + layer.nextOffset;
      const goal = Math.max(0, Math.min(1, (layer.start - nextTop) / layer.travel));
      const delta = goal - layer.depth;
      const depth = Math.abs(delta) < .002 ? goal : layer.depth + delta * ease;
      if (depth !== layer.depth) {
        layer.depth = depth;
        layer.card.style.setProperty('--offer-stack-depth', depth.toFixed(4));
      }
      moving ||= depth !== goal;
    });

    if (moving) schedule();
    else lastTime = 0;
  }

  function measure() {
    if (!motion.matches) {
      stop();
      layers = [];
      cards.forEach(card => card.style.removeProperty('--offer-stack-depth'));
      return;
    }
    if (grid.querySelector('.offer-link:focus-visible')) return;

    // Use untransformed flow sizes so the visual scale never feeds back into progress.
    const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
    const tops = cards.map(card => parseFloat(getComputedStyle(card).top) || 0);
    let offset = 0;
    layers = cards.slice(0, -1).map((card, index) => {
      const height = card.offsetHeight;
      offset += height + gap;
      const start = tops[index] + height + 72;
      return {
        card,
        nextOffset: offset,
        start,
        travel: Math.max(1, start - tops[index + 1]),
        depth: layers[index]?.depth ?? 0
      };
    });
    schedule();
  }

  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) measure();
    else stop();
  }, { rootMargin: '180px 0px' }).observe(grid);

  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(grid);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  grid.addEventListener('focusout', () => requestAnimationFrame(measure));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else schedule();
  });
  motion.addEventListener('change', measure);
})();

/* team-entrance */
(() => {
  'use strict';
  const team = document.querySelector('#team');
  if (!team || team.dataset.teamEntrance || !('IntersectionObserver' in window)) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 1800px)');
  if (reduced.matches) return;

  const portraits = [...team.querySelectorAll('.people-grid .person-photo')].map(element => ({
    element,
    cell: element.closest('li') || element,
    image: element.querySelector('img'),
    className: 'is-team-entering',
    animationName: 'team-portrait-in',
    done: false
  }));
  const art = document.querySelector('#director .director-art');
  const director = art ? {
    element: art,
    cell: art,
    image: art.querySelector('img'),
    className: 'is-director-entering',
    animationName: 'director-art-in',
    done: false
  } : null;
  const records = director ? [...portraits, director] : portraits;
  if (!records.length) return;
  team.dataset.teamEntrance = 'ready';
  const byElement = new Map(records.map(record => [record.element, record]));
  let observer;

  function finish(record) {
    record.done = true;
    observer?.unobserve(record.element);
    record.element.classList.remove(record.className);
    record.element.style.removeProperty('--team-enter-delay');
  }

  function finishAll() {
    records.forEach(finish);
    observer?.disconnect();
  }

  function finishRunning() {
    records.forEach(record => {
      if (record.element.classList.contains(record.className)) finish(record);
    });
  }

  function start(record, delay) {
    if (record.done) return;
    if (reduced.matches || document.hidden || !record.image?.complete || !record.image.naturalWidth) {
      finish(record);
      return;
    }
    record.done = true;
    if (record !== director) record.element.style.setProperty('--team-enter-delay', `${delay}ms`);
    record.element.classList.add(record.className);
    // Observe until completion so a fast exit can settle the image immediately.
  }

  function observe(record) {
    if (record.done) return;
    const bounds = record.element.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom <= 0) finish(record);
    else if (bounds.width && bounds.height) observer.observe(record.element);
  }

  observer = new IntersectionObserver(entries => {
    // Grid-cell positions do not move with the portrait's entrance transform.
    const positions = portraits.map(record => ({ record, bounds: record.cell.getBoundingClientRect() }));
    entries.forEach(entry => {
      const record = byElement.get(entry.target);
      if (!record) return;
      if (record === director && !wide.matches) {
        observer.unobserve(record.element);
        return;
      }
      const bounds = entry.boundingClientRect;
      if (record.done) {
        if (!entry.isIntersecting) finish(record);
        return;
      }
      if (bounds.top < 0 || bounds.bottom <= 0) { finish(record); return; }
      if (!entry.isIntersecting || bounds.top >= innerHeight) return;
      if (record === director) {
        if (wide.matches) start(record, 0);
        return;
      }
      const current = positions.find(position => position.record === record);
      const row = positions.filter(position => Math.abs(position.bounds.top - current.bounds.top) < 4)
        .sort((a, b) => a.bounds.left - b.bounds.left);
      const column = row.findIndex(position => position.record === record);
      start(record, Math.min(Math.max(column, 0), 5) * 55);
    });
  }, { rootMargin: '0px 0px -16px 0px', threshold: .01 });

  portraits.forEach(observe);

  function syncDirector() {
    if (!director) return;
    if (!wide.matches) {
      observer.unobserve(director.element);
      if (director.element.classList.contains(director.className)) finish(director);
    } else observe(director);
  }
  syncDirector();

  records.forEach(record => {
    const complete = event => {
      if (event.animationName === record.animationName) finish(record);
    };
    record.element.addEventListener('animationend', complete);
    record.element.addEventListener('animationcancel', complete);
    record.cell.addEventListener('focusin', () => finish(record));
  });

  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
  wide.addEventListener('change', syncDirector);
  window.addEventListener('resize', finishRunning, { passive: true });
  window.addEventListener('pagehide', finishAll);
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishRunning(); });
})();
