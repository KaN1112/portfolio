const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [
  ...context.querySelectorAll(selector),
];

function initMenu() {
  const button = $(".menu");
  const nav = $("#nav");
  if (!button || !nav) return;

  const close = () => {
    nav.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "メニューを開く");
  };

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute(
      "aria-label",
      open ? "メニューを閉じる" : "メニューを開く",
    );
  });
  $$("a", nav).forEach((link) => link.addEventListener("click", close));
  addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  addEventListener("resize", () => {
    if (innerWidth > 900) close();
  });
}

function initWorkFilters() {
  $$(".filters button").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      $$(".filters button").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      $$(".work").forEach((work) => {
        work.classList.toggle(
          "hidden",
          filter !== "all" && work.dataset.type !== filter,
        );
      });
    });
  });
}

function initLightbox() {
  const dialog = $("#lightbox");
  if (!dialog) return;

  $$("[data-lightbox]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      $("h2", dialog).textContent = trigger.dataset.lightbox;
      $(".preview", dialog).style.backgroundImage =
        `url("${trigger.dataset.image}")`;
      dialog.showModal();
    });
  });
  $$(".gallery-item img").forEach((image) => {
    image.addEventListener("click", () => {
      $("h2", dialog).textContent = image.alt;
      $(".preview", dialog).style.backgroundImage =
        `url("${image.currentSrc || image.src}")`;
      dialog.showModal();
    });
  });
  $("button", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function initRotaryGallery() {
  const section = $("#works");
  const stage = section ? $(".wheel-stage", section) : null;
  const items = section ? $$(".work", section) : [];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 901px)");
  if (!section || !stage || items.length === 0) return;

  let frame = 0;
  const reset = () => {
    items.forEach((item) => {
      item.style.removeProperty("--wheel-x");
      item.style.removeProperty("--wheel-y");
      item.style.removeProperty("--wheel-scale");
      item.style.removeProperty("--wheel-opacity");
      item.classList.remove("is-active");
    });
  };

  const render = () => {
    frame = 0;
    if (!desktop.matches || reducedMotion.matches) {
      reset();
      return;
    }

    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    const position = progress * (items.length - 1);
    const activeIndex = Math.round(position);
    const radiusX = Math.min(stage.clientWidth * 0.44, 540);
    const radiusY = Math.min(stage.clientHeight * 0.38, 300);

    items.forEach((item, index) => {
      const offset = index - position;
      const angle = offset * 0.72;
      const distance = Math.abs(offset);
      const x = Math.sin(angle) * radiusX;
      const y = (1 - Math.cos(angle)) * radiusY;
      const scale = Math.max(0.48, 1 - distance * 0.18);
      const opacity = Math.max(0.08, 1 - distance * 0.38);

      item.style.setProperty("--wheel-x", `${x.toFixed(2)}px`);
      item.style.setProperty("--wheel-y", `${y.toFixed(2)}px`);
      item.style.setProperty("--wheel-scale", scale.toFixed(3));
      item.style.setProperty("--wheel-opacity", opacity.toFixed(3));
      item.classList.toggle("is-active", index === activeIndex);
    });
  };

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(render);
  };

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  reducedMotion.addEventListener("change", requestRender);
  desktop.addEventListener("change", requestRender);
  render();
}

initMenu();
initWorkFilters();
initLightbox();
initRotaryGallery();
