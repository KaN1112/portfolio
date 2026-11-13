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

function initActiveNavigation() {
  const links = $$("#nav a[href^='#']");
  const sections = links
    .map((link) => ({ link, section: $(link.getAttribute("href")) }))
    .filter(({ section }) => section);
  if (sections.length === 0) return;

  let frame = 0;
  const render = () => {
    frame = 0;
    const marker = scrollY + ($("header")?.offsetHeight || 0) + 48;
    let active = sections[0];

    sections.forEach((entry) => {
      if (entry.section.offsetTop <= marker) active = entry;
    });

    sections.forEach(({ link }) => {
      if (link === active.link) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(render);
  };

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  render();
}

function initServerSlider() {
  const section = $(".server-showcase");
  const slider = $(".server-grid");
  const controls = $$("[data-server-slide]");
  const desktop = matchMedia("(min-width: 901px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!section || !slider) return;

  let frame = 0;
  const render = () => {
    frame = 0;
    if (!desktop.matches || reducedMotion.matches) return;

    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    slider.scrollLeft = progress * (slider.scrollWidth - slider.clientWidth);
  };

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(render);
  };

  controls.forEach((button) => {
    button.addEventListener("click", () => {
      const card = $("article", slider);
      const gap = Number.parseFloat(getComputedStyle(slider).columnGap) || 0;
      const distance =
        (card?.getBoundingClientRect().width || slider.clientWidth) + gap;
      const direction = button.dataset.serverSlide === "previous" ? -1 : 1;

      if (desktop.matches && !reducedMotion.matches) {
        const maxScroll = Math.max(1, slider.scrollWidth - slider.clientWidth);
        const travel = Math.max(1, section.offsetHeight - innerHeight);
        const targetProgress = Math.min(
          1,
          Math.max(0, (slider.scrollLeft + direction * distance) / maxScroll),
        );
        scrollTo({
          top: section.offsetTop + targetProgress * travel,
          behavior: "smooth",
        });
        return;
      }

      slider.scrollBy({ left: direction * distance, behavior: "smooth" });
    });
  });

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  desktop.addEventListener("change", requestRender);
  reducedMotion.addEventListener("change", requestRender);
  render();
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

function initThumbnailWheels() {
  const wheels = $$(".thumbnail-category").map((section) => ({
    section,
    stage: $(".thumbnail-wheel-stage", section),
    items: $$(".gallery-item", section),
  }));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 901px)");
  if (wheels.length === 0) return;

  let frame = 0;
  const reset = () => {
    wheels.forEach(({ section, items }) => {
      section.style.removeProperty("height");
      items.forEach((item) => {
        item.style.removeProperty("--thumb-x");
        item.style.removeProperty("--thumb-y");
        item.style.removeProperty("--thumb-scale");
        item.style.removeProperty("--thumb-opacity");
        item.classList.remove("is-active");
      });
    });
  };

  const render = () => {
    frame = 0;
    if (!desktop.matches || reducedMotion.matches) {
      reset();
      return;
    }

    wheels.forEach(({ section, stage, items }) => {
      section.style.height = `${Math.max(360, items.length * 52)}vh`;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const position = progress * (items.length - 1);
      const activeIndex = Math.round(position);
      const radiusX = Math.min(stage.clientWidth * 0.44, 560);
      const radiusY = Math.min(stage.clientHeight * 0.36, 280);

      items.forEach((item, index) => {
        const offset = index - position;
        const angle = offset * 0.7;
        const distance = Math.abs(offset);
        const x = Math.sin(angle) * radiusX;
        const y = (1 - Math.cos(angle)) * radiusY;
        const scale = Math.max(0.46, 1 - distance * 0.18);
        const opacity = Math.max(0.06, 1 - distance * 0.4);

        item.style.setProperty("--thumb-x", `${x.toFixed(2)}px`);
        item.style.setProperty("--thumb-y", `${y.toFixed(2)}px`);
        item.style.setProperty("--thumb-scale", scale.toFixed(3));
        item.style.setProperty("--thumb-opacity", opacity.toFixed(3));
        item.classList.toggle("is-active", index === activeIndex);
      });
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
initActiveNavigation();
initServerSlider();
initWorkFilters();
initLightbox();
initRotaryGallery();
initThumbnailWheels();
