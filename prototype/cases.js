(() => {
  const filterRoot = document.querySelector("[data-cases-filter]");
  const caseCards = [...document.querySelectorAll("[data-case-card]")];
  const pagination = document.querySelector("[data-cases-pagination]");
  const pageList = document.querySelector("[data-cases-page-list]");
  const pagePrevious = document.querySelector("[data-cases-page-prev]");
  const pageNext = document.querySelector("[data-cases-page-next]");
  const catalogStatus = document.querySelector("[data-cases-status]");
  const pageSize = 6;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (filterRoot && caseCards.length) {
    const buttons = [...filterRoot.querySelectorAll("[data-case-filter]")];
    const allowed = new Set(buttons.map((button) => button.dataset.caseFilter));
    let activeFilter = "all";
    let activePage = 1;

    const getCatalogUrl = ({ filter = activeFilter, page = activePage } = {}) => {
      const url = new URL(window.location.href);
      url.searchParams.delete("category");
      url.searchParams.delete("page");

      if (filter !== "all") {
        url.searchParams.set("category", filter);
      }

      if (page > 1) {
        url.searchParams.set("page", String(page));
      }

      url.hash = "cases-list";
      return url;
    };

    const updateDirectionLink = (link, targetPage, disabled) => {
      if (!link) {
        return;
      }

      link.dataset.casesPage = String(targetPage);

      if (disabled) {
        link.setAttribute("aria-disabled", "true");
        link.removeAttribute("href");
        link.setAttribute("tabindex", "-1");
        return;
      }

      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      link.href = getCatalogUrl({ page: targetPage });
    };

    const renderPagination = (pageCount) => {
      if (!pagination || !pageList) {
        return;
      }

      pagination.hidden = pageCount <= 1;
      pageList.replaceChildren();

      if (pageCount <= 1) {
        updateDirectionLink(pagePrevious, 1, true);
        updateDirectionLink(pageNext, 1, true);
        return;
      }

      for (let page = 1; page <= pageCount; page += 1) {
        const pageLink = document.createElement("a");
        pageLink.href = getCatalogUrl({ page });
        pageLink.dataset.casesPage = String(page);
        pageLink.textContent = String(page);
        pageLink.setAttribute("aria-label", `Страница ${page}`);

        if (page === activePage) {
          pageLink.setAttribute("aria-current", "page");
        }

        pageList.append(pageLink);
      }

      updateDirectionLink(pagePrevious, Math.max(activePage - 1, 1), activePage === 1);
      updateDirectionLink(pageNext, Math.min(activePage + 1, pageCount), activePage === pageCount);
    };

    const updateCatalog = ({ announce = false } = {}) => {
      const matchingCards = caseCards.filter(
        (card) => activeFilter === "all" || card.dataset.caseCard === activeFilter,
      );
      const pageCount = Math.max(Math.ceil(matchingCards.length / pageSize), 1);
      activePage = Math.min(Math.max(activePage, 1), pageCount);
      const firstCardIndex = (activePage - 1) * pageSize;
      const visibleCards = matchingCards.slice(firstCardIndex, firstCardIndex + pageSize);

      buttons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.caseFilter === activeFilter),
        );
      });

      caseCards.forEach((card) => {
        card.hidden = !visibleCards.includes(card);
      });

      renderPagination(pageCount);

      if (announce && catalogStatus) {
        catalogStatus.textContent = `Страница ${activePage} из ${pageCount}. Показано ${visibleCards.length} из ${matchingCards.length} кейсов.`;
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.caseFilter;
        activePage = 1;
        window.history.pushState({}, "", getCatalogUrl());
        updateCatalog({ announce: true });
      });
    });

    pagination?.addEventListener("click", (event) => {
      const pageLink = event.target.closest("[data-cases-page]");

      if (
        !pageLink ||
        pageLink.getAttribute("aria-disabled") === "true" ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      activePage = Number.parseInt(pageLink.dataset.casesPage, 10);
      window.history.pushState({}, "", pageLink.href);
      updateCatalog({ announce: true });
      pagination
        .querySelector('[data-cases-page][aria-current="page"]')
        ?.focus({ preventScroll: true });
      document.querySelector("#cases-list")?.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });

    const readLocation = () => {
      const query = new URLSearchParams(window.location.search);
      const requestedFilter = query.get("category") || "all";
      const requestedPage = Number.parseInt(query.get("page") || "1", 10);

      activeFilter = allowed.has(requestedFilter) ? requestedFilter : "all";
      activePage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
      updateCatalog();
    };

    window.addEventListener("popstate", readLocation);
    readLocation();
  }

  const proofBlocks = [...document.querySelectorAll("[data-case-proof]")];
  const reducedCaseMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const showCounterValue = (counter, value) => {
    const prefix = counter.dataset.caseCountPrefix || "";
    counter.textContent = `${prefix}${value}`;
  };

  const animateCounter = (counter) => {
    const target = Number.parseInt(counter.dataset.caseCount || "0", 10);

    if (reducedCaseMotion.matches || !Number.isFinite(target)) {
      showCounterValue(counter, target);
      return;
    }

    const duration = 520;
    const startedAt = performance.now();

    const update = (timestamp) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      showCounterValue(counter, Math.round(target * eased));

      if (progress < 1) {
        window.requestAnimationFrame(update);
      }
    };

    showCounterValue(counter, 0);
    window.requestAnimationFrame(update);
  };

  const revealProofBlock = (block) => {
    if (block.classList.contains("is-visible")) {
      return;
    }

    block.classList.add("is-visible");
    block.querySelectorAll("[data-case-count]").forEach(animateCounter);
  };

  if (proofBlocks.length) {
    if (reducedCaseMotion.matches || !("IntersectionObserver" in window)) {
      proofBlocks.forEach(revealProofBlock);
    } else {
      document.documentElement.classList.add("case-motion-ready");
      const proofObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            revealProofBlock(entry.target);
            proofObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
      );

      proofBlocks.forEach((block) => proofObserver.observe(block));
    }
  }

  const toc = document.querySelector("[data-case-toc]");
  const sections = toc
    ? [...toc.querySelectorAll('a[href*="#"]')]
        .map((link) => {
          const id = new URL(link.href).hash.slice(1);
          return { link, section: document.getElementById(id) };
        })
        .filter((item) => item.section)
    : [];

  if (!sections.length || !("IntersectionObserver" in window)) {
    return;
  }

  const setCurrent = (id) => {
    sections.forEach(({ link, section }) => {
      if (section.id === id) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]) {
        setCurrent(visible[0].target.id);
      }
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: 0 }
  );

  sections.forEach(({ section }) => observer.observe(section));
})();
