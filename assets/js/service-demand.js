(() => {
  const scene = document.querySelector('[data-demand-scene]');
  if (!scene) return;

  const drawing = scene.querySelector('.demand-columns');
  const svg = drawing.querySelector('.demand-routes');
  const browser = drawing.querySelector('.demand-browser');
  const status = scene.querySelector('[data-demand-status]');
  const inputs = [0, 1].map(index => drawing.querySelector(`[data-route-input="${index}"]`));
  const junction = drawing.querySelector('[data-route-junction]');
  const query = drawing.querySelector('.demand-route--query');
  const page = drawing.querySelector('.demand-route--page');
  const queryUnderlay = drawing.querySelector('[data-route-underlay="query"]');
  const pageUnderlay = drawing.querySelector('[data-route-underlay="page"]');
  const wide = matchMedia('(min-width: 941px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;

  function point(rect, bounds, edge, offset = 0, height = .5) {
    return {
      x: rect[edge] - bounds.left + offset,
      y: rect.top + rect.height * height - bounds.top,
    };
  }

  function curve(start, end) {
    const control = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} C ${control} ${start.y} ${control} ${end.y} ${end.x} ${end.y}`;
  }

  function paint() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!wide.matches) return;
    const key = scene.querySelector('input:checked').value;
    const group = scene.querySelector(`[data-query="${key}"]`);
    const branch = scene.querySelector(`[data-branch="${key}"]`).getBoundingClientRect();
    const bounds = drawing.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const starts = [...group.querySelectorAll('.demand-query-list li')]
      .map(row => point(row.getBoundingClientRect(), bounds, 'right'));
    const cardEdge = group.getBoundingClientRect().right - bounds.left;
    const branchStart = point(branch, bounds, 'left', -4);
    const hub = {
      x: cardEdge + (branchStart.x - cardEdge) * .45,
      y: (starts[0].y + starts[1].y) / 2,
    };
    inputs.forEach((path, index) => path.setAttribute('d', curve(starts[index], hub)));
    junction.setAttribute('cx', hub.x);
    junction.setAttribute('cy', hub.y);

    const toBranch = curve(hub, branchStart);
    const toPage = curve(
      point(branch, bounds, 'right', 2),
      point(browser.getBoundingClientRect(), bounds, 'left', -4, .42)
    );
    query.setAttribute('d', toBranch);
    queryUnderlay.setAttribute('d', toBranch);
    page.setAttribute('d', toPage);
    pageUnderlay.setAttribute('d', toPage);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function trace() {
    if (reduced.matches) return;
    scene.classList.remove('is-tracing');
    void scene.offsetWidth;
    scene.classList.add('is-tracing');
  }

  scene.addEventListener('change', event => {
    if (event.target.name !== 'demand-scenario') return;
    paint();
    trace();
    const example = scene.querySelector(`[data-page="${event.target.value}"]`);
    status.textContent = 'Выбрана страница «' + example.querySelector('h4').textContent + '»';
  });

  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(drawing);
  window.addEventListener('resize', schedule, { passive: true });
  wide.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  paint();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      paint();
      trace();
      observer.disconnect();
    }, { threshold: .13 });
    observer.observe(drawing);
  }
})();
