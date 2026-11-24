const host = document.querySelector('[data-critter-host]');
const target = host?.querySelector('[data-critter-mount]');

if (target) {
  const showPoster = () => { host.dataset.critterFallback = 'true'; };
  const mount = () => {
    import('./scene.js?v=3')
      .then(({ mountCritters }) => mountCritters(target, showPoster))
      .catch(showPoster);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      mount();
    }, { rootMargin: '240px 0px' });
    observer.observe(host.querySelector('[data-critter-landing]') ?? host);
  } else {
    mount();
  }
}
