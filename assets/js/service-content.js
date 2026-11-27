/* Process steps start as native disclosures and become tabs on wider screens. */
(() => {
  const content = document.querySelector(".service-content");
  if (!content) return;

  const wide = window.matchMedia("(min-width: 960px)");
  content.querySelectorAll("[data-service-board]").forEach(board => {
    const stages = [...board.querySelectorAll("details")];
    if (!stages.length) return;
    const nav = document.createElement("div");
    nav.className = "sc-stage-index";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-orientation", "vertical");
    const heading = board.closest("section").querySelector("h2");
    nav.setAttribute("aria-labelledby", heading.id);

    const buttons = stages.map((stage, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.id = stage.id + "-tab";
      button.setAttribute("aria-controls", stage.id + "-panel");
      const summary = stage.querySelector("summary");
      for (const child of summary.childNodes) button.append(child.cloneNode(true));
      button.addEventListener("click", () => select(index));
      button.addEventListener("keydown", event => {
        const next = {
          ArrowDown: (index + 1) % stages.length,
          ArrowUp: (index + stages.length - 1) % stages.length,
          Home: 0, End: stages.length - 1
        }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select(next);
        buttons[next].focus();
      });
      nav.append(button);
      return button;
    });

    function select(index) {
      stages.forEach((stage, i) => {
        const active = i === index;
        buttons[i].setAttribute("aria-selected", String(active));
        buttons[i].tabIndex = active ? 0 : -1;
        stage.open = active;
        stage.parentElement.hidden = !active;
      });
    }

    function layout() {
      const activeIndex = Math.max(0, stages.findIndex(stage => stage.open));
      if (wide.matches) {
        board.before(nav);
        board.classList.add("sc-stage-board--wide");
        stages.forEach((stage, i) => {
          const panel = stage.querySelector(".sc-web-process-panel");
          panel.id = stage.id + "-panel";
          panel.setAttribute("role", "tabpanel");
          panel.setAttribute("aria-labelledby", buttons[i].id);
          panel.tabIndex = 0;
        });
        select(activeIndex);
      } else {
        nav.remove();
        board.classList.remove("sc-stage-board--wide");
        stages.forEach(stage => {
          stage.parentElement.hidden = false;
          const panel = stage.querySelector(".sc-web-process-panel");
          panel.removeAttribute("role");
          panel.removeAttribute("aria-labelledby");
          panel.removeAttribute("tabindex");
        });
      }
    }

    layout();
    wide.addEventListener("change", layout);
  });
})();
