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
    const hero = $(".hero h1");
    if (hero && !state.reduced && !state.mobile) {
      hero.style.setProperty("--ry", `${state.mouse.x * 2.2}deg`);
      hero.style.setProperty("--rx", `${-state.mouse.y * 1.4}deg`);
    }
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
initProjectTilt();
initWorkFilters();
initLightbox();
initScrollAnimations();
initPageTransitions();
