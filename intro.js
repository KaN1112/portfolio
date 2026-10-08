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
  intro.setAttribute("aria-hidden", "true");
  intro.innerHTML = `
    <div class="site-intro__sequence">
      <div class="site-intro__mark">K</div>
      <div class="site-intro__title">KaN's Portfolio</div>
      <p class="site-intro__caption">eスポーツを中心としたWeb制作・開発</p>
    </div>
  `;

  document.body.prepend(intro);
  document.body.classList.add("intro-active");

  window.setTimeout(() => intro.classList.add("is-leaving"), 720);
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
  }, 1050);
}

initSiteIntro();
