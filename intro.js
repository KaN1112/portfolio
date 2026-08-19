/**
 * Initial site intro
 * Shown once per browser tab so it does not replay between portfolio pages.
 */
function initSiteIntro() {
  let alreadyShown = false;

  try {
    alreadyShown = sessionStorage.getItem("kan-intro-shown") === "true";
  } catch {
    // Continue without storage when the browser blocks sessionStorage.
  }

  if (alreadyShown) {
    document.documentElement.classList.remove("intro-pending");
    document.documentElement.style.background = "";
    return;
  }

  const intro = document.createElement("div");
  intro.className = "site-intro";
  intro.setAttribute("role", "status");
  intro.setAttribute("aria-label", "KaN's Portfolio");
  intro.innerHTML = `
    <div class="site-intro__grid" aria-hidden="true"></div>
    <div class="site-intro__beam" aria-hidden="true"></div>
    <div class="site-intro__frame" aria-hidden="true">
      <span>INITIALIZING CREATIVE SPACE / 00</span>
      <span>35.6762° N / 139.6503° E</span>
    </div>
    <div class="site-intro__sequence">
      <p class="site-intro__index" aria-hidden="true">K / 001</p>
      <div class="site-intro__title" data-text="KaN's Portfolio">
        <span>KaN's</span><span>Portfolio</span>
      </div>
      <p class="site-intro__caption">Web Create / Bot Create / Thumbnail Create</p>
    </div>
    <div class="site-intro__progress" aria-hidden="true"><span></span></div>
  `;

  document.body.prepend(intro);
  document.body.classList.add("intro-active");

  window.setTimeout(() => intro.classList.add("is-leaving"), 2300);
  window.setTimeout(() => {
    try {
      sessionStorage.setItem("kan-intro-shown", "true");
    } catch {
      // Continue when storage is unavailable.
    }
    intro.remove();
    document.body.classList.remove("intro-active");
    document.documentElement.classList.remove("intro-pending");
    document.documentElement.style.background = "";
  }, 3200);
}

initSiteIntro();
