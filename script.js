const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const state = {
  mobile: matchMedia("(max-width:768px)").matches,
  reduced: matchMedia("(prefers-reduced-motion:reduce)").matches,
  low: (navigator.hardwareConcurrency || 8) <= 4,
  visible: true,
  mouse: { x: 0, y: 0 },
};

function initMenu() {
  const button = $(".menu"),
    nav = $("#nav");
  if (!button || !nav) return;
  const close = () => {
    nav.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("menu-open");
  };
  button.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.classList.toggle("menu-open", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", close));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      close();
      button.focus();
    }
  });
  addEventListener("resize", () => {
    if (innerWidth > 900) close();
  });
}

function initPerformanceMode() {
  document.documentElement.dataset.quality = state.mobile || state.low ? "low" : "high";
  document.addEventListener("visibilitychange", () => {
    state.visible = !document.hidden;
  });
}

function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
function initHeroScene() {
  const canvas = $("#hero-canvas");
  if (!canvas) return;
  if (!webglSupported() || !window.THREE) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !state.low && !state.mobile,
    powerPreference: state.low ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, state.low ? 1 : 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  const group = new THREE.Group();
  scene.add(group);
  const white = new THREE.LineBasicMaterial({ color: 0xf4f2ed, transparent: true, opacity: 0.28 });
  const orange = new THREE.LineBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0.92 });
  for (let i = 0; i < (state.low ? 5 : 9); i++) {
    const w = 1.4 + (i % 3) * 0.75,
      h = 0.75 + (i % 4) * 0.38;
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.08));
    const line = new THREE.LineSegments(geo, i % 3 === 0 ? orange : white);
    line.position.set(((i % 3) - 1) * 2.2, Math.floor(i / 3) * 1.55 - 1.4, -i * 0.22);
    line.rotation.z = (i % 2 ? 1 : -1) * 0.07;
    group.add(line);
  }
  const planeGeo = new THREE.PlaneGeometry(9, 9, 14, 14);
  const plane = new THREE.LineSegments(
    new THREE.WireframeGeometry(planeGeo),
    new THREE.LineBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0.055 }),
  );
  plane.rotation.x = -1.08;
  plane.position.set(1, -3.3, -2.5);
  scene.add(plane);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);
  let t = 0;
  const render = () => {
    if (state.visible) {
      t += state.reduced ? 0 : 0.003;
      group.rotation.y += (state.mouse.x * 0.13 - group.rotation.y) * 0.035;
      group.rotation.x += (-state.mouse.y * 0.08 - group.rotation.x) * 0.035;
      group.position.y = Math.sin(t) * 0.08;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(render);
  };
  render();
}

function initPointer() {
  addEventListener("pointermove", (e) => {
    state.mouse.x = (e.clientX / innerWidth) * 2 - 1;
    state.mouse.y = (e.clientY / innerHeight) * 2 - 1;
    const cursor = $(".cursor");
    if (cursor) {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }
  });
  const cursor = $(".cursor");
  if (cursor)
    $$("a,button,[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("active"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("active"));
    });
}

function initProjectTilt() {
  if (state.mobile || state.reduced) return;
  $$(".art,.gallery-item img").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--tilt-y", `${x * 5}deg`);
      el.style.setProperty("--tilt-x", `${-y * 4}deg`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--tilt-x", "0deg");
    });
  });
}

function initWorkFilters() {
  $$(".filters button").forEach((button) =>
    button.addEventListener("click", () => {
      $$(".filters button").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      const filter = button.dataset.filter;
      $$(".work").forEach((work) =>
        work.classList.toggle("hidden", filter !== "all" && work.dataset.type !== filter),
      );
    }),
  );
}

function initLightbox() {
  const dialog = $("#lightbox");
  if (!dialog) return;
  $$("[data-lightbox]").forEach((button) =>
    button.addEventListener("click", () => {
      $("h2", dialog).textContent = button.dataset.lightbox;
      $(".preview", dialog).style.backgroundImage = button.dataset.image
        ? `url("${button.dataset.image}")`
        : "";
      dialog.showModal();
    }),
  );
  $("button", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}

function initScrollAnimations() {
  if (initGsapAnimations()) return;
  const targets = $$(
    ".about > *,.section-head > *,.work,.process > .label,.process > h2,.process li,.commission > *,footer > *,.gallery-item",
  );
  targets.forEach((t) => t.classList.add("reveal"));
  if (!("IntersectionObserver" in window) || state.reduced) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08, rootMargin: "0px 0px -35px" },
  );
  targets.forEach((t) => observer.observe(t));
}

function initGsapAnimations() {
  if (!window.gsap || !window.ScrollTrigger || state.reduced) return false;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("has-gsap");

  const hero = $(".hero");
  if (hero) {
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".hero .eyebrow", { y: 14, autoAlpha: 0, duration: 0.55 })
      .from(
        ".hero h1",
        { yPercent: 18, clipPath: "inset(100% 0 0 0)", duration: 0.95 },
        "-=0.28",
      )
      .from(".hero aside", { y: 18, autoAlpha: 0, duration: 0.65 }, "-=0.42")
      .from(".hero .scroll", { y: 8, autoAlpha: 0, duration: 0.45 }, "-=0.3");
  }

  const subHero = $(".sub-hero,.request-guide-hero,.motion-heading,.server-heading");
  if (subHero) {
    const title = $("h1", subHero);
    const label = $(".label", subHero);
    const supporting = $("aside,p:not(.label)", subHero);
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (label) intro.from(label, { y: 12, autoAlpha: 0, duration: 0.45 });
    if (title) {
      intro.from(
        title,
        { yPercent: 24, clipPath: "inset(100% 0 0 0)", duration: 0.85 },
        label ? "-=0.2" : 0,
      );
    }
    if (supporting) intro.from(supporting, { y: 16, autoAlpha: 0, duration: 0.55 }, "-=0.35");
  }

  const pageItems = $$(
    ".gallery-item,.other-work-list > a,.motion-grid > article,.server-grid > article,.request-steps > li,.request-services li,.request-legacy > *,.about-detail > *,.process li,.home-profile__copy > p,.home-skills dl > div",
  );
  pageItems.forEach((item, index) => {
    gsap.from(item, {
      y: index % 3 === 1 ? 34 : 22,
      x: index % 2 === 0 ? -12 : 12,
      autoAlpha: 0,
      duration: 0.72,
      ease: "power2.out",
      scrollTrigger: { trigger: item, start: "top 88%", once: true },
    });
  });

  $$(".editorial-gallery img,.server-grid img").forEach((image) => {
    if (state.mobile) return;
    gsap.fromTo(
      image,
      { "--page-parallax": "-2%" },
      {
        "--page-parallax": "2%",
        ease: "none",
        scrollTrigger: { trigger: image, start: "top bottom", end: "bottom top", scrub: 0.8 },
      },
    );
  });

  $$(".request-guide-intro,.request-external,.motion-back,.server-back").forEach((item) => {
    gsap.from(item, {
      y: 24,
      autoAlpha: 0,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: item, start: "top 88%", once: true },
    });
  });

  $$(".section-head h1,.section-head h2,.home-profile h2,.commission h2,.process h2,.request-guide-intro h2,footer h2").forEach((heading, index) => {
    gsap.from(heading, {
      yPercent: index % 2 ? 24 : 30,
      clipPath: "inset(100% 0 0 0)",
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: heading, start: "top 86%", once: true },
    });
  });

  const worksHeading = $(".section-head h1,.section-head h2");
  if (worksHeading) {
    gsap.fromTo(
      worksHeading,
      { color: "rgba(242,240,233,.38)" },
      {
        color: "rgb(242,240,233)",
        ease: "none",
        scrollTrigger: {
          trigger: ".section-head",
          start: "top 78%",
          end: "bottom 48%",
          scrub: 0.7,
        },
      },
    );
  }

  $$(".work").forEach((work, index) => {
    const art = $(".art", work);
    const image = $(".art img", work);
    const meta = $(".meta", work);
    const fromLeft = index % 2 === 0;

    if (art) {
      gsap.from(art, {
        clipPath: fromLeft ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
        duration: 1.05,
        ease: "power3.inOut",
        scrollTrigger: { trigger: work, start: "top 84%", once: true },
      });
    }
    if (meta) {
      gsap.from(meta, {
        y: 24,
        autoAlpha: 0,
        duration: 0.65,
        delay: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: work, start: "top 78%", once: true },
      });
    }
    if (image && !state.mobile) {
      gsap.fromTo(
        image,
        { "--parallax-y": "-2.5%" },
        {
          "--parallax-y": "2.5%",
          ease: "none",
          scrollTrigger: { trigger: art, start: "top bottom", end: "bottom top", scrub: 0.8 },
        },
      );
    }
  });

  const requestRoute = $(".contact-routes");
  if (requestRoute) {
    gsap.from(requestRoute, {
      xPercent: 5,
      autoAlpha: 0,
      duration: 0.75,
      ease: "power2.out",
      scrollTrigger: { trigger: requestRoute, start: "top 88%", once: true },
    });
  }

  return true;
}

function initPageTransitions() {
  const panel = $(".page-transition");
  if (!panel) return;
  panel.classList.add("enter");
  setTimeout(() => panel.classList.remove("enter"), 1250);
  $$("a[href]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const url = new URL(a.href, location.href);
      if (
        a.target === "_blank" ||
        url.origin !== location.origin ||
        (url.hash && url.pathname === location.pathname)
      )
        return;
      e.preventDefault();
      panel.classList.add("leave");
      setTimeout(() => (location.href = a.href), 1050);
    }),
  );
  addEventListener("pageshow", () => panel.classList.remove("leave"));
}

initPerformanceMode();
initMenu();
initHeroScene();
initPointer();
initWorkFilters();
initLightbox();
initScrollAnimations();
