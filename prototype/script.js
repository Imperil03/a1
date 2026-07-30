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
const mobileBreakpoint = window.matchMedia("(max-width: 767px)");

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

  const shouldShow =
    mobileBreakpoint.matches &&
    window.scrollY > 400 &&
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

window.addEventListener("scroll", requestPageStateUpdate, { passive: true });
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
