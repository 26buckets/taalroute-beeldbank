const brand = document.querySelector(".brand-switcher");
const trigger = document.querySelector("#taalroute-app-trigger");
const menu = document.querySelector("#taalroute-app-menu");

function closeApps(restoreFocus = false) {
  menu.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  if (restoreFocus) trigger.focus({ preventScroll: true });
}

trigger.addEventListener("click", () => {
  const opening = menu.hidden;
  menu.hidden = !opening;
  trigger.setAttribute("aria-expanded", String(opening));
});

trigger.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    menu.querySelector("a").focus();
  }
});

brand.addEventListener("focusout", (event) => {
  if (!brand.contains(event.relatedTarget)) closeApps();
});

document.addEventListener("click", (event) => {
  if (!brand.contains(event.target)) closeApps();
});

menu.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeApps(true);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menu.hidden) {
    event.preventDefault();
    closeApps(true);
  }
});

window.addEventListener("pageshow", () => closeApps());
