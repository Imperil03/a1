const bars = document.querySelectorAll(".bar");

bars.forEach((bar, index) => {
  bar.style.setProperty("--delay", index);
});

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-ready");
});
