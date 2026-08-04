const menuButton = document.querySelector(".menu");
const nav = document.querySelector("#nav");
menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  document.body.classList.toggle("menu-open", open);
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "メニューを開く");
  document.body.classList.remove("menu-open");
}));

document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || !nav.classList.contains("open")) return;
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "メニューを開く");
  document.body.classList.remove("menu-open");
  menuButton.focus();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760 && nav.classList.contains("open")) {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("menu-open");
  }
});

document.querySelectorAll(".filters button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach(b => {
      b.classList.toggle("active", b === button);
      b.setAttribute("aria-pressed", String(b === button));
    });
    const filter = button.dataset.filter;
    document.querySelectorAll(".work").forEach(work => {
      work.classList.toggle("hidden", filter !== "all" && work.dataset.type !== filter);
    });
  });
});

const dialog = document.querySelector("#lightbox");
document.querySelectorAll("[data-lightbox]").forEach(button => {
  button.addEventListener("click", () => {
    dialog.querySelector("h2").textContent = button.dataset.lightbox;
    const preview = dialog.querySelector(".preview");
    preview.style.backgroundImage = button.dataset.image
      ? `url("${button.dataset.image}")`
      : "";
    dialog.showModal();
  });
});
dialog.querySelector("button").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

const revealTargets = document.querySelectorAll(
  ".about > *, .section-head > *, .work, .process > .label, .process > h2, .process li, .commission > *, footer > *"
);
revealTargets.forEach(target => target.classList.add("reveal"));

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
  revealTargets.forEach(target => observer.observe(target));
} else {
  revealTargets.forEach(target => target.classList.add("is-visible"));
}
