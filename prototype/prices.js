(() => {
  const filter = document.querySelector("[data-price-filter]");
  const catalog = document.querySelector("[data-price-catalog]");

  if (!filter || !catalog) return;

  const buttons = Array.from(filter.querySelectorAll("button[data-price-filter-value]"));
  const sections = Array.from(catalog.querySelectorAll("[data-price-section]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const applyFilter = (category, moveToCatalog = false) => {
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.priceFilterValue === category),
      );
    });

    sections.forEach((section) => {
      section.hidden = category !== "all" && section.dataset.priceSection !== category;
    });

    if (moveToCatalog) {
      window.requestAnimationFrame(() => {
        catalog.scrollIntoView({
          block: "start",
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.priceFilterValue, true);
    });
  });

  applyFilter("all");
})();
