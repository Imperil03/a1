const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "summary",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const header = document.querySelector("[data-header]");
const popovers = Array.from(document.querySelectorAll("[data-popover]"));
const popoverToggles = Array.from(
  document.querySelectorAll("[data-popover-toggle]"),
);
const servicesShell = document.querySelector("[data-services-shell]");
const servicesMenu = document.querySelector("[data-services-menu]");
const servicesHover = window.matchMedia("(hover: hover) and (pointer: fine)");
let openPopoverId = null;
let popoverReturnFocus = null;
let servicesCloseTimer = null;

function getPopoverToggle(popoverId) {
  return popoverToggles.find(
    (toggle) => toggle.dataset.popoverToggle === popoverId,
  );
}

function closePopover({ restoreFocus = false } = {}) {
  if (!openPopoverId) {
    return;
  }

  const popover = document.getElementById(openPopoverId);
  const toggle = getPopoverToggle(openPopoverId);

  if (popover) {
    popover.hidden = true;
  }

  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }

  const focusTarget = popoverReturnFocus;
  openPopoverId = null;
  popoverReturnFocus = null;

  if (restoreFocus && focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
}

function openPopover(popoverId, toggle) {
  const popover = document.getElementById(popoverId);

  if (!popover) {
    return;
  }

  if (popoverId === servicesMenu?.id) {
    cancelServicesClose();
  }

  if (openPopoverId && openPopoverId !== popoverId) {
    closePopover();
  }

  popover.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  openPopoverId = popoverId;
  popoverReturnFocus = toggle;
}

popoverToggles.forEach((toggle) => {
  toggle.addEventListener("click", (event) => {
    const popoverId = toggle.dataset.popoverToggle;
    const isServicesMouseClick =
      popoverId === servicesMenu?.id &&
      servicesHover.matches &&
      event.detail > 0;

    if (isServicesMouseClick) {
      if (openPopoverId !== popoverId) {
        openPopover(popoverId, toggle);
      }

      return;
    }

    if (openPopoverId === popoverId) {
      closePopover();
    } else {
      openPopover(popoverId, toggle);

      if (event.detail === 0) {
        window.requestAnimationFrame(() => {
          const popover = document.getElementById(popoverId);
          const firstFocusable = popover
            ? getFocusableElements(popover)[0]
            : null;
          firstFocusable?.focus();
        });
      }
    }
  });
});

document.addEventListener("pointerdown", (event) => {
  if (!openPopoverId) {
    return;
  }

  const openPopover = document.getElementById(openPopoverId);
  const openToggle = getPopoverToggle(openPopoverId);

  if (
    !openPopover?.contains(event.target) &&
    !openToggle?.contains(event.target)
  ) {
    closePopover();
  }
});

function cancelServicesClose() {
  window.clearTimeout(servicesCloseTimer);
}

function scheduleServicesClose() {
  cancelServicesClose();
  servicesCloseTimer = window.setTimeout(() => {
    const activeElement = document.activeElement;
    const focusIsInside =
      servicesShell?.contains(activeElement) ||
      servicesMenu?.contains(activeElement);
    const pointerIsInside =
      servicesShell?.matches(":hover") ||
      servicesMenu?.matches(":hover");

    if (
      openPopoverId === servicesMenu?.id &&
      !focusIsInside &&
      !pointerIsInside
    ) {
      closePopover();
    }
  }, 180);
}

servicesShell?.addEventListener("pointerenter", () => {
  if (!servicesHover.matches || !servicesMenu) {
    return;
  }

  const toggle = getPopoverToggle(servicesMenu.id);

  if (toggle && openPopoverId !== servicesMenu.id) {
    openPopover(servicesMenu.id, toggle);
  }
});

[servicesShell, servicesMenu].forEach((element) => {
  element?.addEventListener("pointerenter", cancelServicesClose);
  element?.addEventListener("pointerleave", scheduleServicesClose);
  element?.addEventListener("focusin", cancelServicesClose);
});

const serviceTabs = Array.from(
  document.querySelectorAll("[data-service-tab]"),
);
const servicePanels = Array.from(
  document.querySelectorAll("[data-service-panel]"),
);

function activateServicePanel(panelId) {
  serviceTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.serviceTab === panelId);
  });

  servicePanels.forEach((panel) => {
    panel.hidden = panel.dataset.servicePanel !== panelId;
  });
}

serviceTabs.forEach((tab) => {
  const activate = () => activateServicePanel(tab.dataset.serviceTab);
  tab.addEventListener("pointerenter", activate);
  tab.addEventListener("focus", activate);
});

const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileMenuToggle = document.querySelector("[data-mobile-menu-toggle]");
const mobileMenuClose = document.querySelector("[data-mobile-menu-close]");
const mobileMenuOverlay = document.querySelector("[data-mobile-menu-overlay]");
const mobileServiceDetails = Array.from(
  mobileMenu?.querySelectorAll("details") ?? [],
);
let mobileReturnFocus = null;

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(focusableSelector)).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0,
  );
}

function closeMobileMenu({ restoreFocus = true } = {}) {
  if (!mobileMenu || !mobileMenuToggle || mobileMenu.hidden) {
    return;
  }

  mobileMenu.hidden = true;
  mobileMenuOverlay.hidden = true;
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  mobileMenuToggle.setAttribute("aria-label", "Открыть меню");
  document.body.classList.remove("menu-open");
  updatePageState();

  if (restoreFocus && mobileReturnFocus instanceof HTMLElement) {
    mobileReturnFocus.focus();
  }

  mobileReturnFocus = null;
}

function openMobileMenu() {
  if (!mobileMenu || !mobileMenuToggle || !mobileMenuOverlay) {
    return;
  }

  closePopover();
  mobileReturnFocus = document.activeElement;
  mobileMenu.hidden = false;
  mobileMenuOverlay.hidden = false;
  mobileMenuToggle.setAttribute("aria-expanded", "true");
  mobileMenuToggle.setAttribute("aria-label", "Закрыть меню");
  document.body.classList.add("menu-open");
  updatePageState();

  window.requestAnimationFrame(() => {
    const firstFocusable = getFocusableElements(mobileMenu)[0];
    firstFocusable?.focus();
  });
}

mobileMenuToggle?.addEventListener("click", () => {
  if (mobileMenu?.hidden) {
    openMobileMenu();
  } else {
    closeMobileMenu();
  }
});

mobileMenuClose?.addEventListener("click", () => closeMobileMenu());
mobileMenuOverlay?.addEventListener("click", () => closeMobileMenu());

mobileMenu?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    closeMobileMenu({ restoreFocus: false });
  }
});

mobileServiceDetails.forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open) {
      return;
    }

    mobileServiceDetails.forEach((otherDetails) => {
      if (otherDetails !== details) {
        otherDetails.open = false;
      }
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (mobileMenu && !mobileMenu.hidden) {
      event.preventDefault();
      closeMobileMenu();
      return;
    }

    if (openPopoverId) {
      event.preventDefault();
      closePopover({ restoreFocus: true });
    }
  }

  if (
    event.key !== "Tab" ||
    !mobileMenu ||
    mobileMenu.hidden
  ) {
    return;
  }

  const focusableElements = getFocusableElements(mobileMenu);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstFocusable) {
    event.preventDefault();
    lastFocusable.focus();
  } else if (!event.shiftKey && document.activeElement === lastFocusable) {
    event.preventDefault();
    firstFocusable.focus();
  }
});

const mobileSticky = document.querySelector("[data-mobile-sticky]");
const contactSection = document.querySelector(".contact-section");
const footer = document.querySelector(".site-footer");
const pageHero = document.querySelector(
  ".service-hero, .hero, .about-hero, .blog-hero, .article-hero, .contacts-hero",
);
const inlinePrimaryActions = Array.from(
  document.querySelectorAll("main .button--primary"),
);
const mobileBreakpoint = window.matchMedia("(max-width: 767px)");
let lastScrollPosition = window.scrollY;
let mobileStickyPausedByScroll = false;
let mobileStickyResumeTimer = null;

function elementTouchesViewport(element) {
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function updatePageState() {
  header?.toggleAttribute("data-scrolled", window.scrollY > 8);

  if (!mobileSticky) {
    return;
  }

  const heroBottom = pageHero?.getBoundingClientRect().bottom ?? 0;
  const headerHeight = header?.offsetHeight ?? 0;
  const heroHasPassed = pageHero
    ? heroBottom <= headerHeight
    : window.scrollY > 400;
  const inlineActionIsVisible = inlinePrimaryActions.some(elementTouchesViewport);

  const shouldShow =
    mobileBreakpoint.matches &&
    heroHasPassed &&
    !mobileStickyPausedByScroll &&
    !inlineActionIsVisible &&
    !elementTouchesViewport(contactSection) &&
    !elementTouchesViewport(footer) &&
    document.body.classList.contains("menu-open") === false;

  mobileSticky.dataset.visible = shouldShow ? "true" : "false";
}

let pageStateFrame = null;

function requestPageStateUpdate() {
  if (pageStateFrame !== null) {
    return;
  }

  pageStateFrame = window.requestAnimationFrame(() => {
    updatePageState();
    pageStateFrame = null;
  });
}

function handlePageScroll() {
  const currentScrollPosition = window.scrollY;
  const scrollDelta = currentScrollPosition - lastScrollPosition;

  if (mobileBreakpoint.matches && Math.abs(scrollDelta) > 3) {
    mobileStickyPausedByScroll = scrollDelta > 0;

    if (mobileStickyResumeTimer !== null) {
      window.clearTimeout(mobileStickyResumeTimer);
    }

    if (scrollDelta > 0) {
      mobileStickyResumeTimer = window.setTimeout(() => {
        mobileStickyPausedByScroll = false;
        mobileStickyResumeTimer = null;
        requestPageStateUpdate();
      }, 700);
    }
  }

  lastScrollPosition = currentScrollPosition;
  requestPageStateUpdate();
}

window.addEventListener("scroll", handlePageScroll, { passive: true });
window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 1024px)").matches) {
    closeMobileMenu({ restoreFocus: false });
  }

  requestPageStateUpdate();
});

mobileBreakpoint.addEventListener?.("change", requestPageStateUpdate);
updatePageState();

const teamSlider = document.querySelector("[data-team-slider]");
const teamTrack = teamSlider?.querySelector("[data-team-track]");
const teamPrevious = teamSlider?.querySelector("[data-team-prev]");
const teamNext = teamSlider?.querySelector("[data-team-next]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateTeamSliderControls() {
  if (!teamTrack || !teamPrevious || !teamNext) {
    return;
  }

  const maxScroll = teamTrack.scrollWidth - teamTrack.clientWidth;
  teamPrevious.disabled = teamTrack.scrollLeft <= 2;
  teamNext.disabled = teamTrack.scrollLeft >= maxScroll - 2;
}

function scrollTeamSlider(direction) {
  if (!teamTrack) {
    return;
  }

  const firstCard = teamTrack.querySelector("li");
  const gap = Number.parseFloat(getComputedStyle(teamTrack).columnGap) || 0;
  const step = (firstCard?.getBoundingClientRect().width || teamTrack.clientWidth) + gap;

  teamTrack.scrollBy({
    left: direction * step,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}

teamPrevious?.addEventListener("click", () => scrollTeamSlider(-1));
teamNext?.addEventListener("click", () => scrollTeamSlider(1));
teamTrack?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  event.preventDefault();
  scrollTeamSlider(event.key === "ArrowLeft" ? -1 : 1);
});
teamTrack?.addEventListener("scroll", updateTeamSliderControls, { passive: true });
window.addEventListener("resize", updateTeamSliderControls);
updateTeamSliderControls();

const credentialsMarquee = document.querySelector("[data-credentials-marquee]");
const credentialsToggle = credentialsMarquee?.querySelector(
  "[data-credentials-toggle]",
);
const credentialsPauseIcon = credentialsToggle?.querySelector(
  "[data-pause-icon]",
);
const credentialsPlayIcon = credentialsToggle?.querySelector("[data-play-icon]");

function updateCredentialsMotionControl() {
  if (!credentialsMarquee || !credentialsToggle) {
    return;
  }

  const isPaused = credentialsMarquee.dataset.paused === "true";
  credentialsToggle.setAttribute("aria-pressed", String(isPaused));
  credentialsToggle.setAttribute(
    "aria-label",
    isPaused
      ? "Продолжить движение сертификатов"
      : "Остановить движение сертификатов",
  );

  if (credentialsPauseIcon) {
    credentialsPauseIcon.hidden = isPaused;
  }

  if (credentialsPlayIcon) {
    credentialsPlayIcon.hidden = !isPaused;
  }
}

credentialsToggle?.addEventListener("click", () => {
  const isPaused = credentialsMarquee?.dataset.paused === "true";
  credentialsMarquee.dataset.paused = String(!isPaused);
  updateCredentialsMotionControl();
});

updateCredentialsMotionControl();

const reviewsSlider = document.querySelector("[data-reviews-slider]");
const reviewsTrack = reviewsSlider?.querySelector("[data-reviews-track]");
const reviewsPrevious = document.querySelector("[data-reviews-prev]");
const reviewsNext = document.querySelector("[data-reviews-next]");

function updateReviewsSliderControls() {
  if (!reviewsTrack || !reviewsPrevious || !reviewsNext) {
    return;
  }

  const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
  reviewsPrevious.disabled = reviewsTrack.scrollLeft <= 2;
  reviewsNext.disabled = reviewsTrack.scrollLeft >= maxScroll - 2;
}

function scrollReviewsSlider(direction) {
  if (!reviewsTrack) {
    return;
  }

  const firstCard = reviewsTrack.querySelector("li");
  const gap = Number.parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;
  const step =
    (firstCard?.getBoundingClientRect().width || reviewsTrack.clientWidth) + gap;

  reviewsTrack.scrollBy({
    left: direction * step,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}

reviewsPrevious?.addEventListener("click", () => scrollReviewsSlider(-1));
reviewsNext?.addEventListener("click", () => scrollReviewsSlider(1));
reviewsTrack?.addEventListener("scroll", updateReviewsSliderControls, {
  passive: true,
});
reviewsTrack?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    scrollReviewsSlider(event.key === "ArrowLeft" ? -1 : 1);
  }
});
window.addEventListener("resize", updateReviewsSliderControls);
updateReviewsSliderControls();

const aboutTimeline = document.querySelector("[data-about-timeline]");
const aboutTimelineItems = aboutTimeline
  ? [...aboutTimeline.querySelectorAll(":scope > li")]
  : [];
let aboutTimelineFrame = 0;

function updateAboutTimeline() {
  aboutTimelineFrame = 0;

  if (!aboutTimeline) {
    return;
  }

  const bounds = aboutTimeline.getBoundingClientRect();
  const startLine = window.innerHeight * 0.72;
  const endLine = window.innerHeight * 0.32;
  const travel = Math.max(bounds.height + startLine - endLine, 1);
  const progress = Math.min(Math.max((startLine - bounds.top) / travel, 0), 1);

  aboutTimeline.style.setProperty("--timeline-progress", progress.toFixed(3));

  aboutTimelineItems.forEach((item) => {
    const isReached = item.getBoundingClientRect().top <= window.innerHeight * 0.64;
    item.classList.toggle("is-reached", isReached);
  });
}

function requestAboutTimelineUpdate() {
  if (!aboutTimelineFrame) {
    aboutTimelineFrame = window.requestAnimationFrame(updateAboutTimeline);
  }
}

function configureAboutTimelineMotion() {
  if (!aboutTimeline) {
    return;
  }

  window.removeEventListener("scroll", requestAboutTimelineUpdate);
  window.removeEventListener("resize", requestAboutTimelineUpdate);

  if (reduceMotion.matches) {
    aboutTimeline.style.setProperty("--timeline-progress", "1");
    aboutTimelineItems.forEach((item) => item.classList.add("is-reached"));
    return;
  }

  window.addEventListener("scroll", requestAboutTimelineUpdate, { passive: true });
  window.addEventListener("resize", requestAboutTimelineUpdate);
  requestAboutTimelineUpdate();
}

reduceMotion.addEventListener?.("change", configureAboutTimelineMotion);
configureAboutTimelineMotion();

const aboutPeopleStrip = document.querySelector("[data-about-people-strip]");
const aboutPeopleToggle = aboutPeopleStrip?.querySelector(
  "[data-about-people-toggle]",
);
const aboutPeoplePauseIcon = aboutPeopleToggle?.querySelector(
  "[data-about-people-pause-icon]",
);
const aboutPeoplePlayIcon = aboutPeopleToggle?.querySelector(
  "[data-about-people-play-icon]",
);

function updateAboutPeopleMotionControl() {
  if (!aboutPeopleStrip || !aboutPeopleToggle) {
    return;
  }

  const isPaused = aboutPeopleStrip.dataset.paused === "true";
  aboutPeopleToggle.setAttribute("aria-pressed", String(isPaused));
  aboutPeopleToggle.setAttribute(
    "aria-label",
    isPaused
      ? "Продолжить движение фотографий команды"
      : "Остановить движение фотографий команды",
  );

  if (aboutPeoplePauseIcon) {
    aboutPeoplePauseIcon.hidden = isPaused;
  }

  if (aboutPeoplePlayIcon) {
    aboutPeoplePlayIcon.hidden = !isPaused;
  }
}

aboutPeopleToggle?.addEventListener("click", () => {
  const isPaused = aboutPeopleStrip?.dataset.paused === "true";
  aboutPeopleStrip.dataset.paused = String(!isPaused);
  updateAboutPeopleMotionControl();
});

updateAboutPeopleMotionControl();

const blogGrid = document.querySelector("[data-blog-grid]");
const blogCards = blogGrid
  ? [...blogGrid.querySelectorAll("[data-blog-card]")]
  : [];
const blogFilters = [
  ...document.querySelectorAll("[data-blog-filter]"),
];
const blogStatus = document.querySelector("[data-blog-status]");
const blogMaterialsTitle = document.querySelector("#materials-title");
const blogCount = document.querySelector("[data-blog-count]");
const blogPagination = document.querySelector("[data-blog-pagination]");
const blogPageList = document.querySelector("[data-blog-page-list]");
const blogPagePrevious = document.querySelector("[data-blog-page-prev]");
const blogPageNext = document.querySelector("[data-blog-page-next]");
const BLOG_PAGE_SIZE = 6;
let activeBlogFilter = "all";
let activeBlogPage = 1;

function getMaterialsLabel(count) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "материалов";
  }

  if (last === 1) {
    return "материал";
  }

  if (last >= 2 && last <= 4) {
    return "материала";
  }

  return "материалов";
}

function getBlogCatalogUrl({
  filter = activeBlogFilter,
  page = activeBlogPage,
  keepCurrentHash = false,
} = {}) {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete("author");
  nextUrl.searchParams.delete("category");
  nextUrl.searchParams.delete("page");

  if (filter !== "all") {
    nextUrl.searchParams.set("category", filter);
  }

  if (page > 1) {
    nextUrl.searchParams.set("page", String(page));
  }

  nextUrl.hash = keepCurrentHash ? window.location.hash : "materials";
  return nextUrl;
}

function updateBlogDirectionLink(link, targetPage, isDisabled) {
  if (!link) {
    return;
  }

  link.dataset.blogPage = String(targetPage);

  if (isDisabled) {
    link.setAttribute("aria-disabled", "true");
    link.removeAttribute("href");
    link.setAttribute("tabindex", "-1");
    return;
  }

  link.removeAttribute("aria-disabled");
  link.href = getBlogCatalogUrl({ page: targetPage });
  link.removeAttribute("tabindex");
}

function renderBlogPagination(pageCount) {
  if (!blogPagination || !blogPageList) {
    return;
  }

  blogPagination.hidden = pageCount <= 1;
  blogPageList.replaceChildren();

  if (pageCount <= 1) {
    updateBlogDirectionLink(blogPagePrevious, 1, true);
    updateBlogDirectionLink(blogPageNext, 1, true);
    return;
  }

  for (let page = 1; page <= pageCount; page += 1) {
    const pageLink = document.createElement("a");
    pageLink.href = getBlogCatalogUrl({ page });
    pageLink.dataset.blogPage = String(page);
    pageLink.textContent = String(page);
    pageLink.setAttribute("aria-label", `Страница ${page}`);

    if (page === activeBlogPage) {
      pageLink.setAttribute("aria-current", "page");
    }

    blogPageList.append(pageLink);
  }

  updateBlogDirectionLink(
    blogPagePrevious,
    Math.max(activeBlogPage - 1, 1),
    activeBlogPage === 1,
  );
  updateBlogDirectionLink(
    blogPageNext,
    Math.min(activeBlogPage + 1, pageCount),
    activeBlogPage === pageCount,
  );
}

function updateBlogCatalog({ announce = false } = {}) {
  if (!blogGrid) {
    return;
  }

  const matchingCards = blogCards.filter(
    (card) =>
      activeBlogFilter === "all" ||
      card.dataset.blogCategory === activeBlogFilter,
  );
  const pageCount = Math.max(
    Math.ceil(matchingCards.length / BLOG_PAGE_SIZE),
    1,
  );
  activeBlogPage = Math.min(Math.max(activeBlogPage, 1), pageCount);

  const firstCardIndex = (activeBlogPage - 1) * BLOG_PAGE_SIZE;
  const pageCards = matchingCards.slice(
    firstCardIndex,
    firstCardIndex + BLOG_PAGE_SIZE,
  );

  blogCards.forEach((card) => {
    card.hidden = !pageCards.includes(card);
  });

  blogFilters.forEach((filter) => {
    const isActive = filter.dataset.blogFilter === activeBlogFilter;
    filter.setAttribute("aria-pressed", String(isActive));
  });

  if (blogMaterialsTitle) {
    blogMaterialsTitle.textContent = "Материалы";
  }

  if (blogCount) {
    blogCount.textContent = `${matchingCards.length} ${getMaterialsLabel(matchingCards.length)}`;
  }

  renderBlogPagination(pageCount);

  if (announce && blogStatus) {
    blogStatus.textContent = `Страница ${activeBlogPage} из ${pageCount}. Показано ${pageCards.length} из ${matchingCards.length} материалов.`;
  }
}

blogFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    activeBlogFilter = filter.dataset.blogFilter;
    activeBlogPage = 1;

    const nextUrl = getBlogCatalogUrl();
    window.history.pushState({}, "", nextUrl);
    updateBlogCatalog({ announce: true });
  });
});

blogPagination?.addEventListener("click", (event) => {
  const pageLink = event.target.closest("[data-blog-page]");

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
  activeBlogPage = Number.parseInt(pageLink.dataset.blogPage, 10);
  window.history.pushState({}, "", pageLink.href);
  updateBlogCatalog({ announce: true });
  blogPagination
    ?.querySelector('[data-blog-page][aria-current="page"]')
    ?.focus({ preventScroll: true });
  document.querySelector("#materials")?.scrollIntoView({
    behavior: reduceMotion.matches ? "auto" : "smooth",
    block: "start",
  });
});

function readBlogCatalogLocation() {
  const blogQuery = new URLSearchParams(window.location.search);
  const requestedCategory = blogQuery.get("category");
  const availableCategories = new Set(
    blogFilters.map((filter) => filter.dataset.blogFilter),
  );

  activeBlogFilter =
    requestedCategory && availableCategories.has(requestedCategory)
      ? requestedCategory
      : "all";

  const requestedPage = blogQuery.get("page");
  const parsedPage = Number.parseInt(requestedPage ?? "1", 10);
  const hasValidPage =
    requestedPage === null ||
    (/^\d+$/.test(requestedPage) && parsedPage >= 1);
  const matchingCount = blogCards.filter(
    (card) =>
      activeBlogFilter === "all" ||
      card.dataset.blogCategory === activeBlogFilter,
  ).length;
  const pageCount = Math.max(Math.ceil(matchingCount / BLOG_PAGE_SIZE), 1);

  activeBlogPage = hasValidPage
    ? Math.min(parsedPage, pageCount)
    : 1;

  const normalizedUrl = getBlogCatalogUrl({ keepCurrentHash: true });
  if (normalizedUrl.href !== window.location.href) {
    window.history.replaceState({}, "", normalizedUrl);
  }
}

if (blogGrid) {
  readBlogCatalogLocation();
  updateBlogCatalog();

  window.addEventListener("popstate", () => {
    readBlogCatalogLocation();
    updateBlogCatalog({ announce: true });
  });
}

const articleToc = document.querySelector("[data-article-toc]");
const articleTocLinks = [
  ...document.querySelectorAll("[data-article-toc-link]"),
];
const articleChapters = [
  ...document.querySelectorAll("[data-article-chapter]"),
];
const articleDesktop = window.matchMedia("(min-width: 900px)");

function syncArticleTocLayout() {
  if (articleToc) {
    articleToc.open = articleDesktop.matches;
  }
}

articleDesktop.addEventListener?.("change", () => {
  syncArticleTocLayout();
});

articleTocLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (!articleDesktop.matches && articleToc) {
      articleToc.open = false;
    }
  });
});

let articleNavigationFrame = null;

function updateArticleNavigation() {
  articleNavigationFrame = null;

  if (articleChapters.length === 0) {
    return;
  }

  const marker =
    (header?.offsetHeight ?? 72) +
    Math.min(window.innerHeight * 0.28, 220);
  let activeChapter = articleChapters[0];

  articleChapters.forEach((chapter) => {
    if (chapter.getBoundingClientRect().top <= marker) {
      activeChapter = chapter;
    }
  });

  articleTocLinks.forEach((link) => {
    const isCurrent =
      new URL(link.href).hash === `#${activeChapter.id}`;
    link.toggleAttribute("aria-current", isCurrent);

    if (isCurrent) {
      link.setAttribute("aria-current", "location");
    }
  });
}

function requestArticleNavigationUpdate() {
  if (articleNavigationFrame === null) {
    articleNavigationFrame = window.requestAnimationFrame(
      updateArticleNavigation,
    );
  }
}

if (articleToc) {
  syncArticleTocLayout();
  updateArticleNavigation();
  window.addEventListener("scroll", requestArticleNavigationUpdate, {
    passive: true,
  });
  window.addEventListener("resize", requestArticleNavigationUpdate);
}

const contactMapLinks = [
  ...document.querySelectorAll("[data-contact-map-link]"),
];
const contactMapPanels = [
  ...document.querySelectorAll("[data-contact-map-panel]"),
];
const contactMapsRoot = document.querySelector("[data-contact-maps]");

function getContactMapCity() {
  const cityFromHash = window.location.hash.replace(/^#map-/, "");
  const availableCities = new Set(
    contactMapPanels.map((panel) => panel.dataset.contactMapPanel),
  );

  return availableCities.has(cityFromHash) ? cityFromHash : "surgut";
}

function showContactMap(city) {
  contactMapPanels.forEach((panel) => {
    panel.hidden = panel.dataset.contactMapPanel !== city;
  });

  contactMapLinks.forEach((link) => {
    const isCurrent = link.dataset.contactMapLink === city;
    link.toggleAttribute("aria-current", isCurrent);

    if (isCurrent) {
      link.setAttribute("aria-current", "location");
    }
  });
}

if (contactMapsRoot && contactMapLinks.length > 0 && contactMapPanels.length > 0) {
  contactMapsRoot.dataset.enhanced = "true";
  showContactMap(getContactMapCity());

  contactMapLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const city = link.dataset.contactMapLink;
      const nextHash = `#map-${city}`;

      if (window.location.hash === nextHash) {
        window.history.replaceState({}, "", nextHash);
      } else {
        window.history.pushState({}, "", nextHash);
      }

      showContactMap(city);
    });
  });

  window.addEventListener("popstate", () => {
    showContactMap(getContactMapCity());
  });
}
