const pricing = Object.freeze({
  webSingle: 30000,
  webMulti: 45000,
  pageAdd: 5000,
  contact: 5000,
  manageLight: 3000,
  manageStandard: 6000,
  botBase: 15000,
  botCommand: 2000,
  botManage: 5000,
  database: 8000,
  dashboard: 10000,
  api: 5000,
  deploy: 3000,
  botMonthly: 3000,
  thumbnail: 3000,
  logo: 8000,
  header: 5000,
  icon: 4000,
  poster: 6000,
  banner: 4000
});

const serviceNames = { web: "Web制作", bot: "Discord Bot制作", design: "デザイン制作" };
const designNames = { thumbnail: "サムネイル", logo: "ロゴ", header: "ヘッダー", icon: "アイコン", poster: "ポスター", banner: "バナー", other: "その他（別途見積り）" };
const form = document.querySelector("#requestForm");
const nav = document.querySelector("#nav");
const menuButton = document.querySelector(".menu");

function selected(name) {
  return form.querySelector(`[name="${name}"]:checked`)?.value;
}

function checked(name) {
  return Boolean(form.querySelector(`[name="${name}"]`)?.checked);
}

function numberValue(id, fallback = 0) {
  const input = document.querySelector(`#${id}`);
  const min = Number(input.min || 0);
  const max = Number(input.max || Number.MAX_SAFE_INTEGER);
  const value = Math.min(max, Math.max(min, Number(input.value) || fallback));
  input.value = String(value);
  return value;
}

function yen(value, monthly = false) {
  return `${value.toLocaleString("ja-JP")}円${monthly ? "/月" : ""}`;
}

function calculateEstimate() {
  const service = selected("service_type") || "web";
  const options = [];
  const additions = [];
  let initial = 0;
  let monthly = 0;
  let requiresQuote = false;

  if (service === "web") {
    const plan = selected("web_plan") || "single";
    if (plan === "single") {
      initial = pricing.webSingle;
      options.push("1ページ完結");
    } else {
      const pages = numberValue("pageCount", 4);
      const extraPages = Math.max(0, pages - 4);
      initial = pricing.webMulti + extraPages * pricing.pageAdd;
      options.push(`複数ページ（${pages}ページ）`);
      if (extraPages) additions.push(`追加ページ × ${extraPages}：${yen(extraPages * pricing.pageAdd)}`);
    }
    if (selected("web_contact") === "formspree") {
      initial += pricing.contact;
      options.push("Formspreeお問い合わせフォーム");
      additions.push(`Formspree：${yen(pricing.contact)}`);
    } else options.push("お問い合わせフォームなし");

    const manage = selected("web_manage") || "none";
    if (manage === "light") { monthly = pricing.manageLight; options.push("ライト管理"); }
    else if (manage === "standard") { monthly = pricing.manageStandard; options.push("スタンダード管理"); }
    else options.push("納品後管理なし");
  }

  if (service === "bot") {
    initial = pricing.botBase;
    options.push("基本制作");
    const commands = numberValue("botCommands");
    if (commands) {
      const commandPrice = commands * pricing.botCommand;
      initial += commandPrice;
      options.push(`スラッシュコマンド ${commands}個`);
      additions.push(`コマンド追加 × ${commands}：${yen(commandPrice)}`);
    }
    const botOptions = [
      ["bot_manage", "管理機能", pricing.botManage],
      ["bot_database", "データベース", pricing.database],
      ["bot_dashboard", "Web管理画面", pricing.dashboard],
      ["bot_api", "外部API連携", pricing.api],
      ["bot_deploy", "Bot公開設定（Render）", pricing.deploy]
    ];
    botOptions.forEach(([name, label, price]) => {
      if (!checked(name)) return;
      initial += price;
      const detail = name === "bot_api" && document.querySelector("#apiName").value.trim() ? `（${document.querySelector("#apiName").value.trim()}）` : "";
      options.push(`${label}${detail}`);
      additions.push(`${label}：${yen(price)}${name === "bot_api" ? "〜" : ""}`);
    });
    if (selected("bot_maintenance") === "monthly") { monthly = pricing.botMonthly; options.push("月額保守"); }
    else options.push("保守なし");
  }

  if (service === "design") {
    const type = selected("design_type") || "thumbnail";
    if (type === "other") {
      initial = 0;
      requiresQuote = true;
      const other = document.querySelector("#designOther").value.trim();
      options.push(other ? `その他：${other}` : "その他デザイン");
    } else {
      initial = pricing[type];
      options.push(designNames[type]);
    }
  }

  return { service, serviceName: serviceNames[service], options, additions, initial, monthly, total: initial, requiresQuote };
}

function updateEstimate() {
  const data = calculateEstimate();
  document.querySelector("#estimateService").textContent = data.serviceName;
  document.querySelector("#estimateLines").innerHTML = [...data.options, ...data.additions.map(item => `追加：${item}`)]
    .map((item, index) => `<div class="estimate-line"><span>${index + 1}</span><span>${item}</span></div>`).join("");
  document.querySelector("#initialPrice").textContent = data.requiresQuote ? "別途見積り" : yen(data.initial);
  document.querySelector("#monthlyPrice").textContent = yen(data.monthly, true);
  document.querySelector("#totalPrice").textContent = data.requiresQuote ? "別途見積り" : yen(data.total);
  document.querySelector("#hiddenService").value = data.serviceName;
  document.querySelector("#hiddenOptions").value = data.options.join(" / ");
  document.querySelector("#hiddenEstimate").value = data.requiresQuote ? "別途見積り" : yen(data.initial);
  document.querySelector("#hiddenMonthly").value = yen(data.monthly, true);
  // Future Stripe integration point: this versioned JSON can be posted to a server
  // that creates a Stripe Invoice and returns a hosted payment link.
  document.querySelector("#hiddenJson").value = JSON.stringify({ version: 1, currency: "JPY", ...data });
}

function updateConditionalFields() {
  const service = selected("service_type") || "web";
  const multi = selected("web_plan") === "multi";
  const api = checked("bot_api");
  const otherDesign = selected("design_type") === "other";
  document.querySelector("#pageCountField").hidden = !multi;
  document.querySelector("#apiNameField").hidden = !api;
  document.querySelector("#designOtherField").hidden = !otherDesign;
  document.querySelector("#pageCount").disabled = service !== "web" || !multi;
  document.querySelector("#apiName").disabled = service !== "bot" || !api;
  document.querySelector("#designOther").disabled = service !== "design" || !otherDesign;
  document.querySelector("#designOther").required = service === "design" && otherDesign;
}

function switchService() {
  const active = selected("service_type") || "web";
  document.querySelectorAll(".service-panel").forEach(panel => {
    const show = panel.dataset.panel === active;
    panel.hidden = !show;
    panel.classList.toggle("active", show);
    panel.querySelectorAll("input, textarea, select").forEach(control => { control.disabled = !show; });
  });
  updateConditionalFields();
  updateEstimate();
}

form.addEventListener("input", event => {
  if (event.target.matches('[name="service_type"]')) switchService();
  else { updateConditionalFields(); updateEstimate(); }
});
form.addEventListener("change", () => { updateConditionalFields(); updateEstimate(); });

document.querySelectorAll("[data-step]").forEach(button => button.addEventListener("click", () => {
  const input = document.querySelector(`#${button.dataset.target}`);
  input.value = String(Number(input.value || 0) + Number(button.dataset.step));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}));

form.addEventListener("submit", event => {
  updateEstimate();
  if (!form.checkValidity()) {
    event.preventDefault();
    form.reportValidity();
  }
});

menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  document.body.classList.toggle("menu-open", open);
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open"); menuButton.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open");
}));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    nav.classList.remove("open"); menuButton.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); menuButton.focus();
  }
});

const revealTargets = document.querySelectorAll(".service-select > *, .service-panel > *, .customer-section > *, .estimate");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealTargets.forEach(el => el.classList.add("reveal"));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
  }), { threshold: 0.08, rootMargin: "0px 0px -30px" });
  revealTargets.forEach(el => observer.observe(el));
}

switchService();
