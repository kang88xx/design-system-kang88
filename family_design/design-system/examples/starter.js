import { initFamilySystem } from '../index.js';

const root = document.body;
const ui = initFamilySystem(root);
const notice = document.querySelector('#example-notice');
let noticeTimer;
function announce(text) {
  clearTimeout(noticeTimer);
  notice.textContent = text;
  noticeTimer = setTimeout(() => { notice.textContent = ''; }, 3600);
}
document.querySelector('#theme-toggle').addEventListener('click', event => {
  const dark = root.dataset.fdsTheme !== 'dark';
  root.dataset.fdsTheme = dark ? 'dark' : 'light';
  event.currentTarget.setAttribute('aria-pressed', String(dark));
  event.currentTarget.textContent = dark ? '라이트 테마' : '다크 테마';
});
for (const button of document.querySelectorAll('[data-example-notice]')) {
  button.addEventListener('click', () => announce(button.dataset.exampleNotice));
}
let loadingTimer;
document.querySelector('#loading-example').addEventListener('click', event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = '적용 중…';
  loadingTimer = setTimeout(() => {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = '로딩 상태 보기';
    announce('로딩 → 완료 상태의 예제입니다.');
  }, 1200);
});
for (const button of document.querySelectorAll('[data-copy-example]')) {
  button.addEventListener('click', async () => {
    const code = button.parentElement.querySelector('pre code').textContent;
    try { await navigator.clipboard.writeText(code); announce('전체 예제 코드를 복사했습니다.'); }
    catch { announce('코드 블록의 텍스트를 선택해 복사할 수 있습니다.'); }
  });
}
const form = document.querySelector('#settings-form');
const fields = [form.elements.projectName, form.elements.email];
function validate(field) {
  const valid = field.validity.valid && (field.name !== 'projectName' || field.value.trim().length >= 2);
  if (valid) field.removeAttribute('aria-invalid');
  else field.setAttribute('aria-invalid', 'true');
  document.getElementById(field.getAttribute('aria-describedby')).hidden = valid;
  return valid;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const invalid = fields.filter(field => !validate(field));
  const result = document.querySelector('#settings-result');
  result.hidden = true;
  if (invalid.length) { invalid[0].focus(); return; }
  result.textContent = `${form.elements.projectName.value.trim()}의 설정을 미리보기에 적용했습니다.`;
  result.hidden = false;
});
for (const field of fields) field.addEventListener('input', () => {
  if (field.hasAttribute('aria-invalid')) validate(field);
  document.querySelector('#settings-result').hidden = true;
});
form.addEventListener('reset', () => {
  for (const field of fields) {
    field.removeAttribute('aria-invalid');
    document.getElementById(field.getAttribute('aria-describedby')).hidden = true;
  }
  document.querySelector('#settings-result').hidden = true;
});
// Example ownership: consumer listeners belong to this document. Component
// listeners belong to ui and are cleaned when this document is discarded.
window.addEventListener('pagehide', event => {
  if (!event.persisted) { ui.destroy(); clearTimeout(loadingTimer); clearTimeout(noticeTimer); }
});
