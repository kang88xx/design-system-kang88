import { mount } from './kit/system.js';
import { snippets } from './kit/snippets.js';

const $ = selector => document.querySelector(selector);
const preview = $('#kit-preview');
let active = snippets.find(item => item.id === new URLSearchParams(location.search).get('component')) || snippets[0];
let controller;
let codeMode = 'html';
let noticeTimer;

function colorText(hex) {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  return (luminance + .05) / .05 > 1.05 / (luminance + .05) ? '#000000' : '#ffffff';
}
function themeCSS() {
  const color = $('#kit-color').value;
  return `.ds-root[data-ds-theme] {\n  --ds-color-primary: ${color};\n  --ds-color-on-primary: ${colorText(color)};\n  /* 폰트와 간격 토큰도 여기에서 덮어쓸 수 있습니다. */\n}`;
}
function sourceCode() {
  if (codeMode === 'css') return themeCSS();
  if (codeMode === 'js') return `import { mount } from './kit/system.js';\n\nconst root = document.querySelector('.ds-root');\nconst system = mount(root, { motion: ${$('#kit-motion').checked} });\nsystem.setTheme('${$('#kit-theme').value}');\n\n// 프로젝트 코드에서 요청 성공 후 필요에 따라 호출합니다.\n// system.notify('저장했습니다.');\n\n// 화면을 제거하거나 다시 초기화하기 전에 호출하세요.\n// system.destroy();`;
  return `<link rel="stylesheet" href="./kit/tokens.css">\n<link rel="stylesheet" href="./kit/components.css">\n\n<section class="ds-root" data-ds-theme="${$('#kit-theme').value}">\n${active.html.split('\n').map(line => '  ' + line).join('\n')}\n</section>`;
}
function renderCode() { $('#recipe-code').textContent = sourceCode(); }
function renderList() {
  const query = $('#recipe-search').value.trim().toLowerCase();
  const filtered = snippets.filter(item => `${item.label} ${item.category} ${item.description}`.toLowerCase().includes(query));
  $('#recipe-list').replaceChildren(...filtered.map(item => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.recipe = item.id;
    button.setAttribute('aria-pressed', String(item.id === active.id));
    const label = document.createElement('b'); label.textContent = item.label;
    const category = document.createElement('span'); category.textContent = item.category;
    button.append(label, category);
    button.addEventListener('click', () => {
      active = item; renderRecipe();
      const url = new URL(location.href); url.searchParams.set('component', item.id); history.replaceState(null, '', url);
      if (matchMedia('(max-width:760px)').matches) {
        $('#recipe-title').tabIndex = -1; $('#recipe-title').focus({ preventScroll: true });
        $('.pk-detail').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
      } else $('#recipe-list').querySelector(`[data-recipe="${item.id}"]`)?.focus({ preventScroll: true });
    });
    return button;
  }));
  $('#recipe-empty').hidden = !!filtered.length;
}
function applyTheme() {
  controller?.setTheme($('#kit-theme').value);
  preview.style.setProperty('--ds-color-primary', $('#kit-color').value);
  preview.style.setProperty('--ds-color-on-primary', colorText($('#kit-color').value));
  renderCode();
}
function renderRecipe() {
  controller?.destroy();
  // These recipes are authored locally and shared with the downloadable package.
  preview.innerHTML = active.html;
  controller = mount(preview, { motion: $('#kit-motion').checked });
  $('#recipe-title').textContent = active.label;
  $('#recipe-category').textContent = active.category + ' / COMPONENT RECIPE';
  $('#recipe-runtime').textContent = active.runtime ? 'CSS + JAVASCRIPT' : 'HTML + CSS';
  $('#recipe-description').textContent = active.description;
  $('#recipe-guidance').textContent = active.guidance;
  renderList(); applyTheme();
}
$('#recipe-search').addEventListener('input', renderList);
$('#kit-theme').addEventListener('change', applyTheme);
$('#kit-color').addEventListener('input', applyTheme);
$('#kit-motion').addEventListener('change', renderRecipe);
$('#recipe-reset').addEventListener('click', renderRecipe);
document.querySelectorAll('[data-code]').forEach(button => button.addEventListener('click', () => {
  codeMode = button.dataset.code;
  document.querySelectorAll('[data-code]').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
  renderCode();
}));
$('#copy-recipe').addEventListener('click', async () => {
  let copied = false;
  try { await navigator.clipboard.writeText(sourceCode()); copied = true; } catch {
    const focused = document.activeElement;
    const field = document.createElement('textarea'); field.value = sourceCode(); field.style.cssText = 'position:fixed;left:-9999px';
    document.body.append(field); field.select(); copied = document.execCommand('copy'); field.remove(); focused?.focus();
  }
  clearTimeout(noticeTimer); $('#pk-status').textContent = copied ? '프로젝트용 코드를 복사했습니다.' : '복사할 수 없습니다. 코드 영역에서 직접 선택해 주세요.';
  $('#pk-status').dataset.visible = 'true'; noticeTimer = setTimeout(() => { $('#pk-status').dataset.visible = 'false'; }, 3500);
});
window.addEventListener('pagehide', () => { controller?.destroy(); clearTimeout(noticeTimer); });
window.addEventListener('pageshow', event => { if (event.persisted) renderRecipe(); });
renderRecipe();
