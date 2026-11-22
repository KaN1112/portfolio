const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [
  ...context.querySelectorAll(selector),
];

const MOTION_STORAGE_KEY = "kan-portfolio-motion";
const motionListeners = new Set();
let motionEnabled = true;

const FORTNITE_MAPS = [
  {
    title: "KaN's Battlefield",
    code: "3536-3917-0646",
    genre: "1v1 / Freebuild / Practice",
    players: "16人",
    description:
      "フリービルドや1v1の建築バトルを楽しめる練習マップ。最新シーズンの武器にも対応しています。",
    url: "https://www.fortnite.com/@kan_1112/3536-3917-0646",
    image: "assets/kans-battlefield.webp",
    alt: "KaN's Battlefieldのマップ画像",
  },
  {
    title: "無限ゾーンウォーズ",
    code: "7848-3163-6738",
    genre: "Zone Wars / Practice",
    players: "30人",
    description:
      "資材・弾薬・消耗品が無限のゾーンウォーズ。ストーム酔いもあり、実戦を意識した終盤戦の練習ができます。",
    url: "https://www.fortnite.com/@kan_1112/7848-3163-6738",
    image: "assets/mugen-zonewars.webp",
    alt: "無限ゾーンウォーズのマップ画像",
  },
];

try {
  motionEnabled = localStorage.getItem(MOTION_STORAGE_KEY) !== "off";
} catch {
  motionEnabled = true;
}

document.documentElement.dataset.motion = motionEnabled ? "on" : "off";

function isMotionEnabled() {
  return motionEnabled;
}

function setMotionEnabled(enabled) {
  motionEnabled = enabled;
  document.documentElement.dataset.motion = enabled ? "on" : "off";
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, enabled ? "on" : "off");
  } catch {}
  motionListeners.forEach((listener) => listener(enabled));
}

function onMotionPreferenceChange(listener) {
  motionListeners.add(listener);
}

function initMotionToggle() {
  const button = $(".motion-toggle");
  if (!button) return;

  const update = () => {
    const enabled = isMotionEnabled();
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute(
      "aria-label",
      enabled ? "アニメーションをオフにする" : "アニメーションをオンにする",
    );
    const status = $(".motion-toggle__status", button);
    if (status) status.textContent = enabled ? "ON" : "OFF";
  };

  button.addEventListener("click", () => {
    setMotionEnabled(!isMotionEnabled());
    update();
  });
  onMotionPreferenceChange(update);
  update();
}

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

function renderFortniteMap(map) {
  return `
    <article class="fortnite-map">
      <a class="fortnite-map__image" href="${map.url}" target="_blank" rel="noopener">
        <img src="${map.image}" alt="${map.alt}" loading="lazy" decoding="async" width="1920" height="1080" />
      </a>
      <div class="fortnite-map__body">
        <div class="fortnite-map__heading">
          <div>
            <h3>${map.title}</h3>
          </div>
          <p class="fortnite-map__players">最大人数 ${map.players}</p>
        </div>
        <p class="fortnite-map__genre">${map.genre}</p>
        <p class="fortnite-map__description">${map.description}</p>
        <div class="fortnite-map__actions">
          <div class="fortnite-map__code">
            <span>島コード</span>
            <code>${map.code}</code>
            <button type="button" data-copy-code="${map.code}">コピー</button>
            <small aria-live="polite"></small>
          </div>
          <a class="fortnite-map__link" href="${map.url}" target="_blank" rel="noopener">VIEW MAP ↗</a>
        </div>
      </div>
    </article>`;
}

async function copyFortniteCode(code) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(code);
    return;
  }

  const field = document.createElement("textarea");
  field.value = code;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copy failed");
}

function initFortniteMaps() {
  const grid = $("#fortnite-map-grid");
  if (!grid) return;

  grid.innerHTML = FORTNITE_MAPS.map(renderFortniteMap).join("");
  $$('[data-copy-code]', grid).forEach((button) => {
    let feedbackTimer;
    button.addEventListener("click", async () => {
      const feedback = button.nextElementSibling;
      clearTimeout(feedbackTimer);
      try {
        await copyFortniteCode(button.dataset.copyCode);
        feedback.textContent = "コピーしました";
      } catch {
        feedback.textContent = "コピーできませんでした";
      }
      feedbackTimer = setTimeout(() => {
        feedback.textContent = "";
      }, 1800);
    });
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
  if (!section || !slider) return;
  const cards = $$("article", slider);

  let frame = 0;
  let currentPosition = 0;
  let targetPosition = 0;

  const resetCards = () => {
    cards.forEach((card) => {
      card.style.removeProperty("--server-card-x");
      card.style.removeProperty("--server-card-y");
      card.style.removeProperty("--server-card-z");
      card.style.removeProperty("--server-card-rotate");
      card.style.removeProperty("--server-card-scale");
      card.style.removeProperty("--server-card-opacity");
      card.style.removeProperty("--server-card-blur");
      card.style.removeProperty("--server-card-depth");
      card.classList.remove("is-active");
    });
  };

  const renderCards = () => {
    const compact = innerWidth <= 900;
    const cardSpacing = Math.min(
      slider.clientWidth * (compact ? 0.3 : 0.245),
      compact ? 210 : 330,
    );
    const activeIndex = Math.round(currentPosition);

    cards.forEach((card, index) => {
      const offset = index - currentPosition;
      const distance = Math.abs(offset);
      const x = offset * cardSpacing;
      const y = Math.min(distance * (compact ? 5 : 8), 24);
      const z = -Math.min(distance * (compact ? 80 : 170), 560);
      const rotate = Math.max(
        -42,
        Math.min(42, offset * (compact ? -13 : -21)),
      );
      const scale = Math.max(compact ? 0.7 : 0.66, 1 - distance * 0.15);
      const opacity = Math.max(0.08, 1 - distance * 0.27);
      const blur = compact
        ? 0
        : Math.max(0, Math.min((distance - 1) * 0.7, 2));

      card.style.setProperty("--server-card-x", `${x.toFixed(2)}px`);
      card.style.setProperty("--server-card-y", `${y.toFixed(2)}px`);
      card.style.setProperty("--server-card-z", `${z.toFixed(2)}px`);
      card.style.setProperty("--server-card-rotate", `${rotate.toFixed(2)}deg`);
      card.style.setProperty("--server-card-scale", scale.toFixed(3));
      card.style.setProperty("--server-card-opacity", opacity.toFixed(3));
      card.style.setProperty("--server-card-blur", `${blur.toFixed(2)}px`);
      card.style.setProperty(
        "--server-card-depth",
        String(100 - Math.round(distance * 10)),
      );
      card.classList.toggle("is-active", index === activeIndex);
    });
  };

  const updateTarget = () => {
    if (!isMotionEnabled()) {
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
    if (!isMotionEnabled()) return;

    const distance = targetPosition - currentPosition;
    currentPosition += distance * 0.13;
    renderCards();

    if (Math.abs(distance) > 0.002) frame = requestAnimationFrame(animate);
  };

  const requestRender = () => {
    updateTarget();
    if (!frame && isMotionEnabled()) {
      frame = requestAnimationFrame(animate);
    }
  };

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  onMotionPreferenceChange((enabled) => {
    if (!enabled && frame) cancelAnimationFrame(frame);
    frame = 0;
    requestRender();
  });
  updateTarget();
  currentPosition = targetPosition;
  if (isMotionEnabled()) renderCards();
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
  if (!section || !stage || items.length === 0) return;

  let frame = 0;
  let currentPosition = null;
  const reset = () => {
    section.style.removeProperty("height");
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
    if (!isMotionEnabled()) {
      reset();
      return;
    }

    section.style.height = `${Math.max(
      innerWidth <= 900 ? 220 : 240,
      items.length * (innerWidth <= 900 ? 30 : 34),
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
  onMotionPreferenceChange((enabled) => {
    if (!enabled && frame) cancelAnimationFrame(frame);
    frame = 0;
    requestRender();
  });
  render();
}

function initThumbnailWheels() {
  const wheels = $$(".thumbnail-category").map((section) => ({
    section,
    stage: $(".thumbnail-wheel-stage", section),
    items: $$(".gallery-item", section),
    currentPosition: null,
  }));
  if (wheels.length === 0) return;

  let frame = 0;
  const reset = () => {
    wheels.forEach((wheel) => {
      const { section, items } = wheel;
      section.style.removeProperty("height");
      items.forEach((item) => {
        item.style.removeProperty("--thumb-x");
        item.style.removeProperty("--thumb-y");
        item.style.removeProperty("--thumb-z");
        item.style.removeProperty("--thumb-scale");
        item.style.removeProperty("--thumb-opacity");
        item.style.removeProperty("--thumb-rotate-y");
        item.style.removeProperty("--thumb-rotate-z");
        item.style.removeProperty("--thumb-blur");
        item.style.removeProperty("z-index");
        item.classList.remove("is-active");
      });
      wheel.currentPosition = null;
    });
  };

  const render = () => {
    frame = 0;
    if (!isMotionEnabled()) {
      reset();
      return;
    }

    let isAnimating = false;
    wheels.forEach((wheel) => {
      const { section, stage, items } = wheel;
      section.style.height = `${Math.max(
        innerWidth <= 900 ? 210 : 220,
        items.length * (innerWidth <= 900 ? 28 : 32),
      )}vh`;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const targetPosition = progress * (items.length - 1);
      if (wheel.currentPosition === null) {
        wheel.currentPosition = targetPosition;
      }
      wheel.currentPosition +=
        (targetPosition - wheel.currentPosition) * 0.13;
      if (Math.abs(targetPosition - wheel.currentPosition) < 0.001) {
        wheel.currentPosition = targetPosition;
      } else {
        isAnimating = true;
      }
      const position = wheel.currentPosition;
      const activeIndex = Math.round(position);
      const compact = innerWidth <= 900;
      const cardSpacing = Math.min(
        stage.clientWidth * (compact ? 0.3 : 0.245),
        compact ? 210 : 330,
      );

      items.forEach((item, index) => {
        const offset = index - position;
        const distance = Math.abs(offset);
        const x = offset * cardSpacing;
        const y = Math.min(distance * (compact ? 5 : 8), 24);
        const z = -Math.min(distance * (compact ? 80 : 170), 560);
        const scale = Math.max(compact ? 0.7 : 0.66, 1 - distance * 0.15);
        const opacity = Math.max(0.08, 1 - distance * 0.27);
        const rotateY = Math.max(
          -42,
          Math.min(42, offset * (compact ? -13 : -21)),
        );
        const rotateZ = 0;
        const blur = compact ? 0 : Math.max(0, Math.min((distance - 1) * 0.7, 2));

        item.style.setProperty("--thumb-x", `${x.toFixed(2)}px`);
        item.style.setProperty("--thumb-y", `${y.toFixed(2)}px`);
        item.style.setProperty("--thumb-z", `${z.toFixed(2)}px`);
        item.style.setProperty("--thumb-scale", scale.toFixed(3));
        item.style.setProperty("--thumb-opacity", opacity.toFixed(3));
        item.style.setProperty("--thumb-rotate-y", `${rotateY.toFixed(2)}deg`);
        item.style.setProperty("--thumb-rotate-z", `${rotateZ.toFixed(2)}deg`);
        item.style.setProperty("--thumb-blur", `${blur.toFixed(2)}px`);
        item.style.zIndex = String(
          Math.max(1, 100 - Math.round(distance * 10)),
        );
        item.classList.toggle("is-active", index === activeIndex);
      });
    });

    if (isAnimating) frame = requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(render);
  };

  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  addEventListener("pageshow", requestRender);
  onMotionPreferenceChange((enabled) => {
    if (!enabled && frame) cancelAnimationFrame(frame);
    frame = 0;
    requestRender();
  });
  render();
}

function initRevealAnimations() {
  if (!("IntersectionObserver" in window)) return;
  const selectors = [
    ".single-heading",
    ".about-detail > div",
    ".process",
    ".home-profile__intro",
    ".home-skills",
    ".thumbnail-category-heading",
    ".fortnite-map",
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
  if (items.length === 0) return;

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
  if (!("IntersectionObserver" in window)) return;
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
      const progress = !isMotionEnabled()
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
  onMotionPreferenceChange(requestPaint);
  document.fonts?.ready.then(rebuildLines);
  paint();
}

initMotionToggle();
initMenu();
initActiveNavigation();
initFortniteMaps();
initServerSlider();
initWorkFilters();
initLightbox();
initRotaryGallery();
initThumbnailWheels();
initScrollColorText();
initRevealAnimations();
