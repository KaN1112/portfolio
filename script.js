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
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!section || !slider) return;
  const cards = $$("article", slider);

  let frame = 0;
  let currentPosition = 0;
  let targetPosition = 0;

  const resetCards = () => {
    cards.forEach((card) => {
      card.style.removeProperty("--server-card-x");
      card.style.removeProperty("--server-card-z");
      card.style.removeProperty("--server-card-rotate");
      card.style.removeProperty("--server-card-scale");
      card.style.removeProperty("--server-card-opacity");
      card.style.removeProperty("--server-card-depth");
      card.classList.remove("is-active");
    });
  };

  const renderCards = () => {
    const radiusX = Math.min(slider.clientWidth * 0.43, 500);
    const radiusZ = Math.min(slider.clientWidth * 0.34, 390);
    const activeIndex = Math.round(currentPosition);

    cards.forEach((card, index) => {
      const offset = index - currentPosition;
      const angle = offset * 0.72;
      const distance = Math.abs(offset);
      const x = Math.sin(angle) * radiusX;
      const z = (Math.cos(angle) - 1) * radiusZ;
      const rotate = Math.sin(angle) * -24;
      const scale = Math.max(0.72, 1 - distance * 0.08);
      const opacity = Math.max(0.18, 1 - distance * 0.3);

      card.style.setProperty("--server-card-x", `${x.toFixed(2)}px`);
      card.style.setProperty("--server-card-z", `${z.toFixed(2)}px`);
      card.style.setProperty("--server-card-rotate", `${rotate.toFixed(2)}deg`);
      card.style.setProperty("--server-card-scale", scale.toFixed(3));
      card.style.setProperty("--server-card-opacity", opacity.toFixed(3));
      card.style.setProperty(
        "--server-card-depth",
        String(100 - Math.round(distance * 10)),
      );
      card.classList.toggle("is-active", index === activeIndex);
    });
  };

  const updateTarget = () => {
    if (reducedMotion.matches) {
      resetCards();
      return;
    }
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    targetPosition = progress * (cards.length - 1);
  };

  const animate = () => {
    frame = 0;
    if (reducedMotion.matches) return;

    const distance = targetPosition - currentPosition;
    currentPosition += distance * 0.1;
    renderCards();

    if (Math.abs(distance) > 0.002) frame = requestAnimationFrame(animate);
  };

  const requestRender = () => {
    updateTarget();
    if (!frame && !reducedMotion.matches) {
      frame = requestAnimationFrame(animate);
    }
  };

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  reducedMotion.addEventListener("change", requestRender);
  updateTarget();
  currentPosition = targetPosition;
  if (!reducedMotion.matches) renderCards();
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
  if (!section || !stage || items.length === 0) return;

  let frame = 0;
  let currentPosition = null;
  const reset = () => {
    items.forEach((item) => {
      item.style.removeProperty("--wheel-x");
      item.style.removeProperty("--wheel-y");
      item.style.removeProperty("--wheel-z");
      item.style.removeProperty("--wheel-scale");
      item.style.removeProperty("--wheel-opacity");
      item.style.removeProperty("--wheel-rotate-y");
      item.style.removeProperty("--wheel-rotate-z");
      item.style.removeProperty("--wheel-blur");
      item.style.removeProperty("z-index");
      item.classList.remove("is-active");
    });
    currentPosition = null;
  };

  const render = () => {
    frame = 0;
    if (reducedMotion.matches) {
      reset();
      return;
    }

    section.style.height = `${Math.max(
      innerWidth <= 900 ? 300 : 420,
      items.length * (innerWidth <= 900 ? 38 : 52),
    )}vh`;

    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    const targetPosition = progress * (items.length - 1);
    if (currentPosition === null) currentPosition = targetPosition;
    currentPosition += (targetPosition - currentPosition) * 0.14;
    if (Math.abs(targetPosition - currentPosition) < 0.001) {
      currentPosition = targetPosition;
    }
    const position = currentPosition;
    const activeIndex = Math.round(position);
    const radiusX = Math.min(
      stage.clientWidth * (innerWidth <= 900 ? 0.4 : 0.44),
      540,
    );
    const radiusY = Math.min(
      stage.clientHeight * (innerWidth <= 900 ? 0.22 : 0.38),
      300,
    );

    items.forEach((item, index) => {
      const offset = index - position;
      const compact = innerWidth <= 900;
      const angle = offset * (compact ? 0.76 : 0.68);
      const distance = Math.abs(offset);
      const x = Math.sin(angle) * radiusX;
      const y = (1 - Math.cos(angle)) * radiusY;
      const z = -Math.min(distance * (compact ? 70 : 150), 520);
      const scale = Math.max(compact ? 0.56 : 0.5, 1 - distance * 0.17);
      const opacity = Math.max(0.06, 1 - distance * 0.34);
      const rotateY = Math.max(
        -54,
        Math.min(54, offset * (compact ? -8 : -17)),
      );
      const rotateZ = Math.max(
        -8,
        Math.min(8, offset * (compact ? 1.5 : 3.2)),
      );
      const blur = compact ? 0 : Math.min(distance * 1.15, 3.5);

      item.style.setProperty("--wheel-x", `${x.toFixed(2)}px`);
      item.style.setProperty("--wheel-y", `${y.toFixed(2)}px`);
      item.style.setProperty("--wheel-z", `${z.toFixed(2)}px`);
      item.style.setProperty("--wheel-scale", scale.toFixed(3));
      item.style.setProperty("--wheel-opacity", opacity.toFixed(3));
      item.style.setProperty("--wheel-rotate-y", `${rotateY.toFixed(2)}deg`);
      item.style.setProperty("--wheel-rotate-z", `${rotateZ.toFixed(2)}deg`);
      item.style.setProperty("--wheel-blur", `${blur.toFixed(2)}px`);
      item.style.zIndex = String(Math.max(1, 100 - Math.round(distance * 10)));
      item.classList.toggle("is-active", index === activeIndex);
    });

    if (currentPosition !== targetPosition) {
      frame = requestAnimationFrame(render);
    }
  };

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(render);
  };

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  reducedMotion.addEventListener("change", requestRender);
  render();
}

function initThumbnailWheels() {
  const wheels = $$(".thumbnail-category").map((section) => ({
    section,
    stage: $(".thumbnail-wheel-stage", section),
    items: $$(".gallery-item", section),
  }));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
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
    if (reducedMotion.matches) {
      reset();
      return;
    }

    wheels.forEach(({ section, stage, items }) => {
      section.style.height = `${Math.max(
        innerWidth <= 900 ? 300 : 360,
        items.length * (innerWidth <= 900 ? 38 : 52),
      )}vh`;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const position = progress * (items.length - 1);
      const activeIndex = Math.round(position);
      const radiusX = Math.min(
        stage.clientWidth * (innerWidth <= 900 ? 0.4 : 0.44),
        560,
      );
      const radiusY = Math.min(
        stage.clientHeight * (innerWidth <= 900 ? 0.22 : 0.36),
        280,
      );

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
  render();
}

function initRevealAnimations() {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const selectors = [
    ".single-heading",
    ".about-detail > div",
    ".process",
    ".home-profile__intro",
    ".home-skills",
    ".thumbnail-category-heading",
    ".motion-heading",
    ".motion-grid > article",
    ".server-heading",
    ".request-guide-intro",
    ".request-steps > li",
    ".request-services",
    ".request-pricing",
    ".request-external",
    "footer > div",
    "footer nav",
  ];
  const items = $$(selectors.join(", ")).filter(
    (item) =>
      !item.matches(".color-text-ready") &&
      !item.querySelector(".color-text-ready"),
  );
  if (items.length === 0 || reducedMotion.matches) return;

  document.documentElement.classList.add("reveal-enabled");
  items.forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${(index % 3) * 60}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -16% 0px", threshold: 0.06 },
  );

  items.forEach((item) => observer.observe(item));
}

function initScrollColorText() {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const selectors = [
    ".single-heading h2",
    ".single-heading > p:last-child",
    ".about-detail h3",
    ".about-detail p",
    ".home-profile__copy > p",
    ".thumbnail-category-heading h3",
    ".motion-heading h3",
    ".motion-heading p",
    ".server-heading h3",
    ".server-heading p",
    ".request-guide-intro h3",
    ".request-guide-intro p",
    ".process h3",
  ];
  const segmenter =
    "Segmenter" in Intl
      ? new Intl.Segmenter("ja", { granularity: "grapheme" })
      : null;
  const targets = [];
  let lineObserver;

  const splitTextNode = (node, chars) => {
    const text = node.nodeValue;
    if (!text.trim() && /[\r\n]/.test(text)) {
      node.remove();
      return;
    }
    const graphemes = segmenter
      ? [...segmenter.segment(text)].map(({ segment }) => segment)
      : Array.from(text);
    const fragment = document.createDocumentFragment();

    graphemes.forEach((grapheme) => {
      const span = document.createElement("span");
      span.className = grapheme.trim() ? "color-char" : "color-space";
      span.setAttribute("aria-hidden", "true");
      span.textContent = grapheme;
      fragment.append(span);
      if (grapheme.trim()) chars.push(span);
    });
    node.replaceWith(fragment);
  };

  const wrapVisualLines = (entry) => {
    const groups = [];
    const parents = new Set(
      $$(".color-char, .color-space", entry.target).map(
        (character) => character.parentElement,
      ),
    );

    parents.forEach((parent) => {
      let current = [];
      let currentTop;
      [...parent.children].forEach((child) => {
        if (!child.matches(".color-char, .color-space")) {
          if (current.length) groups.push(current);
          current = [];
          currentTop = undefined;
          return;
        }
        const top = Math.round(child.getBoundingClientRect().top);
        if (current.length && Math.abs(top - currentTop) > 2) {
          groups.push(current);
          current = [];
        }
        if (current.length === 0) currentTop = top;
        current.push(child);
      });
      if (current.length) groups.push(current);
    });

    groups.forEach((group, index) => {
      if (!group.some((node) => node.textContent.trim())) return;
      const clip = document.createElement("span");
      const line = document.createElement("span");
      clip.className = "color-line-clip";
      line.className = "color-line";
      line.style.setProperty("--line-delay", `${Math.min(index * 70, 280)}ms`);
      group[0].before(clip);
      clip.append(line);
      group.forEach((node) => line.append(node));
    });
  };

  const buildEntry = (entry) => {
    entry.target.innerHTML = entry.source;
    const nodes = [];
    const walker = document.createTreeWalker(
      entry.target,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) nodes.push(walker.currentNode);
    entry.chars = [];
    nodes.forEach((node) => splitTextNode(node, entry.chars));
    entry.progress = -1;
    entry.target.classList.add("color-text-ready");
    entry.target.setAttribute("aria-label", entry.accessibleText);
    wrapVisualLines(entry);
  };

  $$(selectors.join(", ")).forEach((target) => {
    if (
      target.closest("a, button") ||
      target.classList.contains("color-text-ready")
    )
      return;
    const accessibleText = target.textContent.replace(/\s+/g, " ").trim();
    const entry = {
      target,
      source: target.innerHTML,
      accessibleText,
      chars: [],
      progress: -1,
    };
    buildEntry(entry);
    if (entry.chars.length === 0) return;
    targets.push(entry);
  });

  if (targets.length === 0) return;

  lineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("line-text-visible");
        lineObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -14% 0px", threshold: 0.04 },
  );
  targets.forEach((entry) => lineObserver.observe(entry.target));

  let frame = 0;
  const paint = () => {
    frame = 0;
    targets.forEach((entry) => {
      const rect = entry.target.getBoundingClientRect();
      const progress = reducedMotion.matches
        ? 1
        : Math.min(
            1,
            Math.max(
              0,
              (innerHeight * 0.86 - rect.top) /
                (innerHeight * 0.5 + rect.height),
            ),
          );
      if (Math.abs(progress - entry.progress) < 0.001) return;
      entry.progress = progress;
      const reach = progress * (entry.chars.length + 2);
      entry.chars.forEach((char, index) => {
        const mix = Math.min(1, Math.max(0, reach - index));
        const channel = Math.round(184 + (23 - 184) * mix);
        char.style.color = `rgb(${channel}, ${channel}, ${channel})`;
      });
    });
  };

  const requestPaint = () => {
    if (frame) return;
    frame = requestAnimationFrame(paint);
  };

  let resizeTimer;
  const rebuildLines = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      targets.forEach(buildEntry);
      requestPaint();
    }, 120);
  };

  addEventListener("scroll", requestPaint, { passive: true });
  addEventListener("resize", rebuildLines);
  addEventListener("pageshow", requestPaint);
  reducedMotion.addEventListener("change", requestPaint);
  document.fonts?.ready.then(rebuildLines);
  paint();
}

initMenu();
initActiveNavigation();
initServerSlider();
initWorkFilters();
initLightbox();
initRotaryGallery();
initThumbnailWheels();
initScrollColorText();
initRevealAnimations();
