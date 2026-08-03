(() => {
  const filterGroup = document.querySelector("[data-review-filters]");
  const reviewCards = [...document.querySelectorAll("[data-review-card]")];

  if (filterGroup && reviewCards.length) {
    const filterButtons = [...filterGroup.querySelectorAll("[data-review-filter]")];

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.reviewFilter;

        filterButtons.forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });

        reviewCards.forEach((card) => {
          card.hidden = filter !== "all" && card.dataset.reviewCard !== filter;
        });
      });
    });
  }

  const dialog = document.querySelector("[data-letter-dialog]");
  const letterLinks = [...document.querySelectorAll("[data-letter-open]")];

  if (!dialog || !letterLinks.length || typeof dialog.showModal !== "function") {
    return;
  }

  const dialogImage = dialog.querySelector("[data-letter-dialog-image]");
  const dialogTitle = dialog.querySelector("[data-letter-dialog-title]");
  const dialogCount = dialog.querySelector("[data-letter-dialog-count]");
  const previousButton = dialog.querySelector("[data-letter-prev]");
  const nextButton = dialog.querySelector("[data-letter-next]");
  let currentIndex = 0;
  let returnTarget = null;

  const showLetter = (index) => {
    currentIndex = (index + letterLinks.length) % letterLinks.length;
    const link = letterLinks[currentIndex];
    const title = link.dataset.letterTitle;

    dialogImage.src = link.href;
    dialogImage.alt = `Благодарственное письмо от ${title}`;
    dialogTitle.textContent = title;
    dialogCount.textContent = `${currentIndex + 1} из ${letterLinks.length}`;
  };

  letterLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      returnTarget = link;
      showLetter(index);
      dialog.showModal();
    });
  });

  previousButton.addEventListener("click", () => showLetter(currentIndex - 1));
  nextButton.addEventListener("click", () => showLetter(currentIndex + 1));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showLetter(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showLetter(currentIndex + 1);
    }
  });

  dialog.addEventListener("close", () => {
    returnTarget?.focus();
  });
})();

