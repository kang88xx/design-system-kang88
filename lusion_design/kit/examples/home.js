import { mount, ease, createDynamics, dynamicsPresets, damp } from "../system.js";

const root = document.querySelector("#home");
const loader = document.querySelector("#loader");
const percent = document.querySelector("#loader-percent");
const preference = matchMedia("(prefers-reduced-motion: reduce)");
let app;

/* Loader: ease.expoOut over 1.2s (public preloader keeps a 1s minimum), then hide in .5s smooth. */
function runLoader() {
  const skip = preference.matches || !app.motion || sessionStorage.getItem("home-loaded") === "1";
  if (skip) {
    loader.dataset.state = "skipped";
    percent.textContent = "100";
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const duration = 1.2;
    let elapsed = 0;
    let shown = 0;
    const remove = app.addTask(dt => {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      const target = Math.round(ease.expoOut(t) * 100);
      shown = Math.round(damp(shown, target, 18, dt));
      percent.textContent = String(Math.max(shown, target === 100 && t >= 1 ? 100 : shown));
      if (t >= 1) {
        percent.textContent = "100";
        loader.dataset.state = "done";
        try { sessionStorage.setItem("home-loaded", "1"); } catch {}
        setTimeout(resolve, 520);
        return false;
      }
      return true;
    });
    window.addEventListener("pagehide", remove, { once: true });
  });
}

/* Manual reveals run only after the loader so the hero stages in order. */
function revealHero() {
  const items = root.querySelectorAll("[data-ds-reveal-manual]");
  items.forEach(item => app.replay(item));
}

/* Hero object: click cycles tone (mirrors changeHomeHeroColorSignal), with a dynamics-driven bounce. */
function setupObject() {
  const object = document.querySelector("#hero-object");
  const tones = ["blue", "ink", "cream"];
  const pulse = createDynamics(dynamicsPresets.snap);
  let target = 1;
  let remove = null;
  object.addEventListener("click", () => {
    const next = tones[(tones.indexOf(root.dataset.tone) + 1) % tones.length];
    root.dataset.tone = next;
    app.notify(`오브젝트 색: ${next}`, { duration: 1400 });
    if (!app.motion) return;
    pulse.reset(0.86);
    target = 1;
    if (!remove) remove = app.addTask(dt => {
      const value = pulse.update(dt, target);
      object.style.setProperty("transform", `scale(${value.toFixed(4)})`);
      if (pulse.settled(target, 0.002)) {
        object.style.removeProperty("transform");
        remove = null;
        return false;
      }
      return true;
    });
  });
}

/* Sound toggle is visual only. */
function setupSound() {
  const button = document.querySelector(".home-sound");
  button.addEventListener("click", () => {
    const on = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(on));
    button.setAttribute("aria-label", on ? "사운드 끄기" : "사운드 켜기");
  });
}

/* Newsletter: local validation only. */
function setupNewsletter() {
  const form = document.querySelector("#newsletter");
  const status = document.querySelector("#newsletter-status");
  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = form.elements.email;
    if (!input.checkValidity()) {
      input.setAttribute("aria-invalid", "true");
      status.dataset.tone = "error";
      status.textContent = "이메일 형식을 확인해 주세요.";
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    status.dataset.tone = "ok";
    status.textContent = "확인했습니다. 데모이므로 서버로 보내지 않습니다.";
    app.notify("구독 요청을 확인했습니다 (로컬 데모).");
  });
  form.elements.email.addEventListener("input", () => {
    form.elements.email.removeAttribute("aria-invalid");
    delete status.dataset.tone;
    status.textContent = "데모입니다. 서버로 전송하지 않습니다.";
  });
}

function setupToTop() {
  document.querySelector("#to-top").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: preference.matches ? "auto" : "smooth" });
    document.querySelector(".home-brand").focus({ preventScroll: true });
  });
}

async function start() {
  app = mount(root, { motion: true });
  setupObject();
  setupSound();
  setupNewsletter();
  setupToTop();
  await runLoader();
  revealHero();
}

window.addEventListener("pagehide", () => app && app.destroy());
window.addEventListener("pageshow", event => { if (event.persisted) start(); });
start();
