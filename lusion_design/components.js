(() => {
  'use strict';
  const data = window.LUSION_ICONS;
  if (!data) return;
  const icons = [...data.icons, ...(data.external_icons || []), ...(data.replicas || [])];
  const byId = new Map(icons.map(icon => [icon.id, icon]));
  const $ = selector => document.querySelector(selector);
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const categories = { ui: ['UI 아이콘', '이동, 재생, 닫기, 정보 — 기능을 설명하는 도형'], brand: ['브랜드와 로고', 'Lusion 워드마크, Labs 심벌, 클라이언트 로고 — 일반 UI 아이콘과 구분'], decorative: ['장식과 타이포', '섹션 심벌, 큰 레터링, 반복 프레임 장식'], replica: ['CSS · 캔버스 재현', '공개 코드의 모양을 SVG로 변환한 제안 — 원본 SVG 추출 수에 포함하지 않음'] };
  const evidence = { extracted: '인라인 추출', 'external-extracted': '외부 SVG 추출', 'inferred-replica': '재현 제안' };
  let toastTimer;
  function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2500); }
  function codeDialog(text, title, note) { $('#code-title').textContent = title; $('#code-note').textContent = note; $('#code-text').value = text; $('#code-dialog').showModal(); $('#code-text').focus(); $('#code-text').select(); }
  async function copy(text, title = '소스') {
    try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text); toast(`${title} 복사 완료`); }
    catch { codeDialog(text, title, '자동 복사를 사용할 수 없어 소스를 선택했습니다. Ctrl+C / ⌘C로 복사하세요.'); }
  }
  function insertSymbol(node) { const icon = byId.get(node.dataset.symbol); if (!icon) return; node.innerHTML = icon.svg; node.querySelector('svg')?.setAttribute('aria-hidden', 'true'); }
  document.querySelectorAll('[data-symbol]').forEach(insertSymbol);
  function needsDark(icon) { return /(?:fill|stroke)=["'](?:#fff(?:fff)?|white)["']/i.test(icon.svg) && !/(?:fill|stroke)=["'](?:#000(?:000)?|black)["']/i.test(icon.svg); }
  function iconCard(icon) {
    const card = el('article', 'icon-card'); card.dataset.category = icon.category;
    const background = $('#preview-theme').value;
    const preview = el('div', 'icon-preview' + ((background === 'dark' || (background === 'auto' && needsDark(icon))) ? ' dark' : ''));
    const img = el('img'); img.src = icon.path; img.alt = icon.name; img.loading = 'lazy';
    preview.append(img, el('span', '', icon.shape)); card.append(preview);
    const content = el('div', 'icon-content'); content.append(el('h4', '', icon.name));
    content.append(el('p', 'icon-meta', `${evidence[icon.evidence]} · ${icon.viewBox || 'viewBox 미지정'}`));
    const actions = el('div', 'icon-actions');
    const copyRaw = el('button', '', icon.evidence === 'inferred-replica' ? 'SVG 복사' : '원본 복사'); copyRaw.type = 'button'; copyRaw.setAttribute('aria-label', `${icon.name} ${copyRaw.textContent}`); copyRaw.addEventListener('click', () => copy(icon.raw_svg || icon.svg, icon.name));
    const download = el('a', '', 'SVG ↓'); download.href = icon.path; download.download = `${icon.name.replace(/[^\p{L}\p{N} -]/gu, '')}.svg`; download.setAttribute('aria-label', `${icon.name} 독립 SVG 다운로드`);
    const view = el('button', '', '코드'); view.type = 'button'; view.setAttribute('aria-label', `${icon.name} 코드 보기`); view.addEventListener('click', () => codeDialog(icon.svg, icon.name, '독립 SVG: viewBox와 fill/stroke를 보존했습니다. 외부 스타일이 필요한 배치는 발생 위치의 원본 CSS를 참고하세요.'));
    actions.append(copyRaw, download, view); content.append(actions);
    const details = el('details', 'icon-source');
    const occurrences = icon.occurrences || [];
    details.append(el('summary', '', occurrences.length ? `출처 ${occurrences.length}곳` : '재현 근거'));
    if (icon.note) details.append(el('p', '', icon.note));
    if (icon.selector) details.append(el('p', '', icon.selector));
    if (icon.source) { const link = el('a', '', icon.source); link.href = icon.source; details.append(link); }
    if (occurrences.length) {
      // Defer hundreds of provenance links until a source drawer is opened.
      details.addEventListener('toggle', () => {
        if (!details.open || details.dataset.loaded) return;
        details.dataset.loaded = 'true';
        const list = el('ul');
        occurrences.forEach(occ => { const li = el('li'); const link = el('a', '', `${occ.page.replace('sources/pages/', '')} · ${occ.line ? `L${occ.line}` : 'CSS'}`); link.href = occ.page; li.append(link, el('p', '', occ.selector)); if (occ.raw_path) { const raw = el('a', '', '정확한 원본 SVG'); raw.href = occ.raw_path; raw.download = ''; li.append(raw); } list.append(li); });
        details.append(list);
      });
    }
    content.append(details); card.append(content); return card;
  }
  function renderLibrary() {
    const query = $('#symbol-search').value.trim().toLocaleLowerCase();
    const category = $('#category-filter').value;
    const filtered = icons.filter(icon => (category === 'all' || category === icon.category) && (!query || [icon.name, icon.id, icon.shape, icon.category, icon.selector, ...(icon.occurrences || []).map(o => o.selector)].join(' ').toLocaleLowerCase().includes(query)));
    const fragment = document.createDocumentFragment();
    Object.entries(categories).forEach(([key, [title, subtitle]]) => {
      const matches = filtered.filter(icon => icon.category === key); if (!matches.length) return;
      const section = el('section', 'icon-group'); const heading = el('div', 'group-heading'); heading.append(el('h3', '', `${title} / ${String(matches.length).padStart(2, '0')}`), el('p', '', subtitle));
      const grid = el('div', 'icon-grid'); matches.forEach(icon => grid.append(iconCard(icon))); section.append(heading, grid); fragment.append(section);
    });
    $('#icon-library').replaceChildren(fragment); $('#result-count').textContent = `${filtered.length} / ${icons.length}개 표시`; $('#empty-state').hidden = filtered.length > 0;
  }
  $('#collection-summary').textContent = `${data.page_count}개 페이지 · 인라인 ${data.inline_svg_occurrences}회 → ${data.unique_inline_svg_count}종\n외부 SVG ${data.external_svg_count}종 · CSS/캔버스 재현 ${data.replicas.length}종`;
  $('#symbol-search').addEventListener('input', renderLibrary); $('#category-filter').addEventListener('change', renderLibrary); $('#preview-theme').addEventListener('change', renderLibrary);
  document.addEventListener('keydown', event => { if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('#symbol-search').focus(); } });
  renderLibrary();
  // Native modal dialogs provide focus containment, Escape handling and inert background.
  const openers = new Map();
  function openDialog(id, opener) { openers.set(id, opener); document.getElementById(id).showModal(); }
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); });
    dialog.addEventListener('close', () => openers.get(dialog.id)?.focus());
  });
  $('#open-menu').addEventListener('click', () => { $('#open-menu').setAttribute('aria-expanded', 'true'); openDialog('menu-dialog', $('#open-menu')); });
  ['cancel', 'close'].forEach(event => $('#menu-dialog').addEventListener(event, () => $('#open-menu').setAttribute('aria-expanded', 'false')));
  document.querySelectorAll('[data-menu-link]').forEach(link => link.addEventListener('click', () => $('#menu-dialog').close()));
  $('#pill-demo').addEventListener('click', () => { $('#pill-status').textContent = 'Pressed → 완료. 문의 전송은 하지 않습니다.'; toast('CTA 클릭 상태 확인'); });
  $('#sound-demo').addEventListener('click', () => { const button = $('#sound-demo'); const active = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(active)); button.querySelector('.sound-symbol').dataset.symbol = active ? 'canvas-sound-wave' : 'canvas-sound-muted'; insertSymbol(button.querySelector('.sound-symbol')); button.lastElementChild.textContent = active ? '사운드 켜짐' : '사운드 꺼짐'; $('#pill-status').textContent = `사운드 ${active ? '켜짐' : '꺼짐'} 표시 — 이 샘플은 소리를 재생하지 않습니다.`; });
  $('#newsletter-form').addEventListener('submit', event => {
    event.preventDefault(); const input = $('#newsletter-email'); const status = $('#newsletter-status');
    if (!input.validity.valid) { input.setAttribute('aria-invalid', 'true'); status.className = 'form-status error'; status.textContent = input.validity.valueMissing ? '이메일 주소를 입력해 주세요.' : '올바른 이메일 형식을 입력해 주세요. 예: you@example.com'; input.focus(); return; }
    input.removeAttribute('aria-invalid'); status.className = 'form-status success'; status.textContent = '확인 완료! 외부 전송과 구독 등록은 하지 않았습니다.';
  });
  $('#newsletter-email').addEventListener('input', () => { $('#newsletter-email').removeAttribute('aria-invalid'); $('#newsletter-status').className = 'form-status'; $('#newsletter-status').textContent = '로컬 데모 — 외부 전송 없이 형식만 확인합니다.'; });
  const themeSelect = $('#project-theme'); data.project_themes.forEach(project => { const option = el('option', '', project.title); option.value = project.slug; themeSelect.append(option); }); themeSelect.value = 'porsche_dream_machine';
  function setTheme() {
    const project = data.project_themes.find(item => item.slug === themeSelect.value); if (!project) return;
    const theme = project.theme; const stage = $('#theme-stage');
    const aliases = { bg: 'data-color-bg', text: 'data-color-text', highlight: 'data-color-highlight', 'btn-bg': 'data-color-btn-bg', 'btn-text': 'data-color-btn-text', 'btn-bg-hover': 'data-color-btn-bg-hover', 'btn-text-hover': 'data-color-btn-text-hover' };
    Object.entries(aliases).forEach(([key, value]) => stage.style.setProperty(`--theme-${key}`, theme[value]));
    $('#theme-title').textContent = project.title; $('#theme-status').textContent = '';
    const swatches = document.createDocumentFragment();
    [['BG', 'data-color-bg'], ['TEXT', 'data-color-text'], ['ACCENT', 'data-color-highlight']].forEach(([label, key]) => { const button = el('button', 'swatch'); button.type = 'button'; button.setAttribute('aria-label', `${label} ${theme[key]} 복사`); const circle = el('i'); circle.style.background = theme[key]; button.append(circle, el('span', '', `${label} ${theme[key]}`)); button.addEventListener('click', () => copy(theme[key], label)); swatches.append(button); });
    $('#theme-swatches').replaceChildren(swatches);
  }
  themeSelect.addEventListener('change', setTheme); setTheme(); $('#theme-cta').addEventListener('click', () => $('#theme-status').textContent = '프로젝트 버튼 pressed 상태');
  for (let i = 0; i < 12; i++) $('#frame-grid').append(el('span'));
  $('#grid-toggle').addEventListener('click', () => { const visible = $('#grid-toggle').getAttribute('aria-pressed') !== 'true'; $('#grid-toggle').setAttribute('aria-pressed', String(visible)); $('#frame-grid').hidden = !visible; $('#grid-toggle').textContent = visible ? '그리드 숨기기' : '그리드 보이기'; });
  $('#open-reel').addEventListener('click', () => { openDialog('reel-dialog', $('#open-reel')); $('#reel-video').play().catch(() => $('#video-status').textContent = '영상의 재생 버튼을 눌러 시작하세요.'); });
  ['cancel', 'close'].forEach(event => $('#reel-dialog').addEventListener(event, () => $('#reel-video').pause())); $('#reel-video').addEventListener('error', () => $('#video-status').textContent = '영상을 불러오지 못했습니다. 로컬 미디어 경로를 확인해 주세요.');
  document.querySelectorAll('[data-clay]').forEach(button => button.addEventListener('click', () => { const active = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(active)); $('#clay-status').textContent = `${button.dataset.clay} ${active ? '선택됨 — 눌림 상태' : '해제됨 — 기본 상태'}`; }));
  let teamIndex = 0;
  function renderTeam() {
    const member = data.team[teamIndex]; $('#team-number').textContent = `[[ ${String(teamIndex + 1).padStart(3, '0')} ]]`;
    $('#team-name').textContent = member.name; $('#team-role').textContent = member.role.replace(/<br\s*\/?\s*>/gi, '\n'); $('#team-count').textContent = `${teamIndex + 1} / ${data.team.length}`;
    $('#team-progress').setAttribute('aria-valuenow', String(teamIndex + 1)); $('#team-progress').setAttribute('aria-valuetext', member.name); $('#team-progress span').style.transform = `scaleX(${(teamIndex + 1) / data.team.length})`;
  }
  document.querySelectorAll('.team-compass').forEach(strip => { for (let i = 0; i < 61; i++) strip.append(el('i')); });
  $('#team-prev').addEventListener('click', () => { teamIndex = (teamIndex - 1 + data.team.length) % data.team.length; renderTeam(); });
  $('#team-next').addEventListener('click', () => { teamIndex = (teamIndex + 1) % data.team.length; renderTeam(); }); renderTeam();
  const clients = data.external_icons.filter(icon => icon.raw_path.includes('/logo/')); let clientPage = 0; let clientTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function renderClients() {
    const fragment = document.createDocumentFragment(); clients.slice(clientPage * 5, clientPage * 5 + 5).forEach(icon => { const img = el('img'); img.src = icon.path; img.alt = icon.name; fragment.append(img); });
    $('#client-carousel').replaceChildren(fragment); $('#client-count').textContent = `${clientPage + 1} / ${Math.ceil(clients.length / 5)}`;
  }
  function stopClients() { clearInterval(clientTimer); clientTimer = undefined; $('#client-play').setAttribute('aria-pressed', 'false'); $('#client-play').textContent = '자동 넘김'; $('#client-carousel').setAttribute('aria-live', 'polite'); }
  $('#client-prev').addEventListener('click', () => { clientPage = (clientPage + 2) % 3; renderClients(); });
  $('#client-next').addEventListener('click', () => { clientPage = (clientPage + 1) % 3; renderClients(); });
  $('#client-play').addEventListener('click', () => { if (clientTimer) { stopClients(); return; } if (reducedMotion.matches) { toast('모션 감소 설정 중에는 이전/다음으로 탐색하세요.'); return; } $('#client-play').setAttribute('aria-pressed', 'true'); $('#client-play').textContent = '일시 정지'; $('#client-carousel').setAttribute('aria-live', 'off'); clientTimer = setInterval(() => { clientPage = (clientPage + 1) % 3; renderClients(); }, 3000); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stopClients(); }); document.addEventListener('visibilitychange', () => { if (document.hidden) stopClients(); }); renderClients();
  const capabilities = [
    ['Strategy', 's', ['Digital Experience Strategy', 'Technology Strategy', 'Creative Direction', 'Discovery', 'Research']],
    ['Creative', 'c', ['Art Direction', 'UX/UI Design', 'Motion Design', 'Interactive Design', 'Illustration']],
    ['Tech', 't', ['WebGL Development', 'Front End Development', 'Unity/Unreal', 'Interactive Installations', 'AR and VR Experiences']],
    ['Production', 'P', ['Procedural Modeling', '3D Asset Creation', '3D Optimization', 'Animation', '3D Pipeline Development']]
  ];
  capabilities.forEach(([name, letter, items]) => {
    const button = el('button', 'cap-card'); button.type = 'button'; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', `${name} 앞면: ${items.join(', ')}. 클릭하면 뒷면`);
    const inner = el('span', 'cap-card-inner'); const front = el('span', 'cap-face cap-front'); const back = el('span', 'cap-face cap-back'); back.setAttribute('aria-hidden', 'true');
    function header() { const node = el('span', 'cap-header'); node.append(el('span', '', name), el('b', '', letter)); return node; }
    const list = el('span', 'cap-items'); items.forEach(item => list.append(el('span', '', item))); front.append(header(), list, header()); inner.append(front, back); button.append(inner);
    button.addEventListener('click', () => { const flipped = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(flipped)); button.setAttribute('aria-label', flipped ? `${name} 뒷면. 클릭하면 앞면` : `${name} 앞면: ${items.join(', ')}. 클릭하면 뒷면`); front.setAttribute('aria-hidden', String(flipped)); back.setAttribute('aria-hidden', String(!flipped)); $('#capability-status').textContent = `${name} — ${flipped ? '뒷면' : '앞면'}`; }); $('#capability-cards').append(button);
  });
})();
