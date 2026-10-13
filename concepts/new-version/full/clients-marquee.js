/* One CSS loop, measured from the original list; no frame-by-frame scripting. */
(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed = 28; // px/s: calm, continuous movement at every viewport width.

  document.querySelectorAll('[data-clients-marquee]').forEach((root) => {
    const viewport = root.querySelector('.clients-marquee__viewport');
    const track = root.querySelector('.clients-marquee__track');
    const original = track?.querySelector('.clients-marquee__list');
    const control = root.querySelector('.clients-marquee__control');
    if (!viewport || !track || !original || !control) return;

    let userPaused = false;
    let hovering = false;
    let focused = false;
    let visible = false;
    let distance = 0;
    let scheduledMeasure = 0;
    let clones = [];

    // The HTML may provide its icons. Keep the control functional if it does not.
    if (!control.querySelector('[data-marquee-pause]') || !control.querySelector('[data-marquee-play]')) {
      control.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><g data-marquee-pause><path d="M8 5v14M16 5v14"/></g><path data-marquee-play d="m9 5 10 7-10 7Z"/></svg>';
    }

    function updatePlayback() {
      const paused = userPaused || hovering || focused || !visible || document.hidden || motionPreference.matches;
      root.dataset.motionPaused = String(paused);
      control.setAttribute('aria-pressed', String(userPaused));
      control.setAttribute('aria-label', userPaused ? 'Возобновить движение логотипов' : 'Приостановить движение логотипов');
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
        clones.forEach((clone) => clone.remove());
        clones = [];
        distance = 0;
        control.hidden = true;
      } else {
        root.setAttribute('data-clients-enhanced', '');
        control.hidden = false;
        measure();
      }
      updatePlayback();
    }

    control.addEventListener('click', () => {
      userPaused = !userPaused;
      // An explicit resume must work even while the keyboard focus stays here.
      focused = false;
      updatePlayback();
    });
    viewport.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovering = true;
      updatePlayback();
    });
    viewport.addEventListener('pointerleave', () => {
      hovering = false;
      updatePlayback();
    });
    root.addEventListener('pointerdown', () => {
      focused = false;
      updatePlayback();
    });
    root.addEventListener('focusin', (event) => {
      focused = event.target.matches(':focus-visible');
      updatePlayback();
    });
    root.addEventListener('focusout', (event) => {
      focused = root.contains(event.relatedTarget);
      updatePlayback();
    });
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
