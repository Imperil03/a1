(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const mobileScene = window.matchMedia('(max-width: 520px)');
  const duration = 2600;
  const arrival = 'cubic-bezier(0.16, 1, 0.3, 1)';

  const waitForImage = async (image) => {
    if (!image.complete) {
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }
    if (!image.naturalWidth) return false;
    if (typeof image.decode === 'function') {
      try { await image.decode(); } catch { /* A loaded image remains usable. */ }
    }
    return true;
  };

  document.querySelectorAll('[data-footer-system]').forEach((scene) => {
    const art = scene.querySelector('.footer-system__art');
    const word = scene.querySelector('.footer-system__word');
    const objects = [...scene.querySelectorAll('.footer-system__object')];
    const lines = [...scene.querySelectorAll('.footer-system__connections path')];
    const control = scene.querySelector('.footer-system__control');
    const images = [...scene.querySelectorAll('.footer-system__object img')];
    if (!art || !word || !control || objects.length !== 3 || !Element.prototype.animate) return;

    let ready = false;
    let inView = false;
    let phase = 'waiting';
    let userPaused = false;
    let pageSuspended = false;
    let animations = [];
    let runId = 0;
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;

    const updateControl = () => {
      const active = animations.length > 0 && !userPaused;
      control.setAttribute('aria-label', active ? 'Остановить анимацию' : 'Повторить анимацию');
      control.setAttribute('aria-pressed', String(userPaused));
    };

    const resetPointer = () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      pointerX = pointerY = targetX = targetY = 0;
      art.style.removeProperty('--footer-pointer-x');
      art.style.removeProperty('--footer-pointer-y');
    };

    const canFollowPointer = () => phase === 'finished' && inView && !document.hidden &&
      !pageSuspended && !reducedMotion.matches && finePointer.matches;

    const pointerTick = () => {
      pointerFrame = 0;
      if (!canFollowPointer()) return resetPointer();
      pointerX += (targetX - pointerX) * .12;
      pointerY += (targetY - pointerY) * .12;
      art.style.setProperty('--footer-pointer-x', `${pointerX.toFixed(2)}px`);
      art.style.setProperty('--footer-pointer-y', `${pointerY.toFixed(2)}px`);
      if (Math.abs(targetX - pointerX) + Math.abs(targetY - pointerY) > .03) {
        pointerFrame = requestAnimationFrame(pointerTick);
      }
    };

    const requestPointerFrame = () => {
      if (!pointerFrame && canFollowPointer()) pointerFrame = requestAnimationFrame(pointerTick);
    };

    const clearAnimations = () => {
      runId += 1;
      animations.forEach((animation) => animation.cancel());
      animations = [];
      lines.forEach((line) => {
        line.style.removeProperty('stroke-dasharray');
        line.style.removeProperty('stroke-dashoffset');
      });
      scene.classList.remove('is-assembling');
    };

    const syncPlayback = () => {
      if (!animations.length) return;
      const paused = userPaused || !inView || document.hidden || pageSuspended;
      animations.forEach((animation) => paused ? animation.pause() : animation.play());
      phase = paused ? 'paused' : 'running';
      scene.dataset.footerState = paused ? (userPaused ? 'paused-user' : 'paused-auto') : 'running';
      if (paused) resetPointer();
      updateControl();
    };

    const finish = () => {
      clearAnimations();
      phase = 'finished';
      userPaused = false;
      scene.dataset.footerState = 'finished';
      control.hidden = reducedMotion.matches;
      updateControl();
    };

    const start = () => {
      if (!ready || reducedMotion.matches) return;
      clearAnimations();
      resetPointer();
      userPaused = false;
      phase = 'running';
      scene.dataset.footerState = 'running';
      scene.classList.add('is-assembling');
      control.hidden = false;
      const activeRun = runId;
      const compact = mobileScene.matches;
      const starts = compact ? [
        'translate3d(-3%, -32%, 0) rotate(-13deg) scale(.9)',
        'translate3d(0, -52%, 0) rotate(12deg) scale(.9)',
        'translate3d(3%, -30%, 0) rotate(14deg) scale(.9)',
      ] : [
        'translate3d(-30%, -30%, 0) rotate(-16deg) scale(.92)',
        'translate3d(2%, -52%, 0) rotate(12deg) scale(.92)',
        'translate3d(30%, -28%, 0) rotate(17deg) scale(.92)',
      ];

      objects.forEach((object, index) => {
        const hold = .1 + index * .07;
        const settled = .81 + index * .04;
        animations.push(object.animate([
          { transform: starts[index], offset: 0 },
          { transform: starts[index], offset: hold, easing: arrival },
          { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', offset: settled },
          { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', offset: 1 },
        ], { duration, fill: 'both' }));
      });

      animations.push(word.animate([
        { opacity: .92, transform: 'translateX(-50%) scale(.975)', offset: 0, easing: arrival },
        { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: .62 },
        { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 1 },
      ], { duration, fill: 'both' }));

      lines.forEach((line) => {
        const length = line.getTotalLength();
        line.style.strokeDasharray = String(length);
        animations.push(line.animate([
          { strokeDashoffset: length, offset: 0 },
          { strokeDashoffset: length, offset: .45, easing: arrival },
          { strokeDashoffset: 0, offset: .96 },
          { strokeDashoffset: 0, offset: 1 },
        ], { duration, fill: 'both' }));
      });

      syncPlayback();
      Promise.all(animations.map((animation) => animation.finished)).then(() => {
        if (activeRun === runId) finish();
      }).catch(() => { /* Replay/reduced motion cancels the previous bounded sequence. */ });
    };

    const maybeStart = () => {
      if (ready && inView && !document.hidden && !pageSuspended && phase === 'waiting' && !reducedMotion.matches) start();
    };

    control.addEventListener('click', () => {
      if (animations.length && !userPaused) {
        userPaused = true;
        syncPlayback();
      } else start();
    });

    scene.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !canFollowPointer()) return;
      if (control.contains(event.target)) {
        targetX = targetY = 0;
      } else {
        const bounds = art.getBoundingClientRect();
        targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2)) * 9;
        targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2)) * 6;
      }
      requestPointerFrame();
    }, { passive: true });

    scene.addEventListener('pointerleave', () => {
      targetX = targetY = 0;
      requestPointerFrame();
    }, { passive: true });

    const onVisibility = () => {
      if (document.hidden) resetPointer();
      maybeStart();
      syncPlayback();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', () => {
      pageSuspended = true;
      resetPointer();
      syncPlayback();
    });
    window.addEventListener('pageshow', () => {
      pageSuspended = false;
      onVisibility();
    });

    reducedMotion.addEventListener('change', () => {
      resetPointer();
      if (reducedMotion.matches) {
        clearAnimations();
        phase = 'finished';
        userPaused = false;
        scene.dataset.footerState = 'reduced';
        control.hidden = true;
        updateControl();
      } else {
        control.hidden = !ready || phase === 'waiting';
        maybeStart();
      }
    });
    finePointer.addEventListener('change', resetPointer);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .5;
        if (!inView) resetPointer();
        maybeStart();
        syncPlayback();
      }, { threshold: [0, .5] });
      observer.observe(scene);
    } else {
      // Browsers without IO keep the complete static scene and explicit replay.
      inView = true;
      phase = 'finished';
    }

    Promise.all(images.map(waitForImage)).then((loaded) => {
      ready = loaded.every(Boolean);
      if (!ready) return;
      if (reducedMotion.matches || phase === 'finished') {
        phase = 'finished';
        scene.dataset.footerState = reducedMotion.matches ? 'reduced' : 'finished';
        control.hidden = reducedMotion.matches;
        updateControl();
      } else maybeStart();
    });
  });
})();
