document.querySelectorAll("[data-nav-toggle]").forEach((toggle) => {
  const menuId = toggle.getAttribute("aria-controls");
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open primary menu");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    menu.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open primary menu" : "Close primary menu");
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
});
