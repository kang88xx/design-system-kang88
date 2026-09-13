import { mount, createSpring } from "../system.js";

const root = document.querySelector(".ds-root");
let app;
const progress = document.querySelector("#project-progress");
const spring = createSpring({ frequency: 1.9, damping: .86, response: .9 });
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let lastTime;
let raf;
function tick(time) {
  const dt = Math.min(Math.max((time - lastTime) / 1000, 0), .064);
  lastTime = time;
  progress.value = spring.update(dt, 74);
  if (Math.abs(progress.value - 74) > .02) raf = requestAnimationFrame(tick);
  else progress.value = 74;
}
function animate() {
  cancelAnimationFrame(raf);
  if (preference.matches) { progress.value = 74; return; }
  spring.reset(Number(progress.value));
  lastTime = performance.now();
  raf = requestAnimationFrame(tick);
}
function start() { app = mount(root); animate(); }
preference.addEventListener('change', animate);
document.querySelector("#theme-select").addEventListener("change", event => app.setTheme(event.target.value));
document.querySelector("#settings-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  clearError();
  app.notify("입력값을 확인했습니다. 데모에서는 서버에 저장하지 않습니다.");
});
const budget = document.querySelector("#project-budget");
function clearError() {
  budget.removeAttribute('aria-invalid');
  delete document.querySelector('#budget-error').dataset.visible;
}
budget.addEventListener('input', clearError);
document.querySelector("#simulate-error").addEventListener("click", () => {
  budget.setAttribute("aria-invalid", "true");
  document.querySelector("#budget-error").dataset.visible = "true";
  budget.focus();
});
window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); app.destroy(); });
window.addEventListener('pageshow', event => { if (event.persisted) start(); });
start();
