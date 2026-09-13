/* Catalogue orchestration only. Copyable components live in the two kits. */
(() => {
  'use strict';
  const { samples, files, standalone } = window.ReferenceLabData;
  const grid = document.querySelector('#sample-grid');
  const codeDialog = document.querySelector('#code-dialog');
  const referenceDialog = document.querySelector('#reference-dialog');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const apiFor = sample => sample.kind === 'motion' ? window.ReferenceMotion : window.ReferenceInteractions;
  let paused = false;
  let activeFilter = 'all';
  let selectedSample = null;
  let selectedLanguage = 'html';
  let copyGeneration = 0;
  const cleanups = [];
  const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceSeconds = sample => {
    const match = String(sample.sourceTime).match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : Number.parseFloat(sample.sourceTime) || 0;
  };
  function syncMotionStatus() {
    document.querySelector('#motion-status').textContent = reduced.matches
      ? '기기의 모션 감소 설정이 켜져 있습니다. 움직임을 줄이고 모든 기능과 최종 상태를 유지합니다.'
      : paused ? '시각 모션을 일시정지했습니다. 버튼·폼·탭은 계속 사용할 수 있습니다.'
      : '모션은 화면에 보일 때 재생됩니다. 일시정지해도 버튼과 폼은 사용할 수 있습니다.';
  }
  function applyTheme(dark, persist = false) {
    document.body.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('#lab-theme').setAttribute('aria-pressed', String(dark));
    document.querySelector('#lab-theme').innerHTML = `<span class="as-sr-only">${dark ? '라이트' : '다크'} 테마 </span><span aria-hidden="true">◐</span>`;
    document.querySelector('#lab-theme').title = `${dark ? '라이트' : '다크'} 테마`;
    if (persist) { try { localStorage.setItem('reference-lab-theme', dark ? 'dark' : 'light'); } catch {} }
  }
  let storedTheme;
  try { storedTheme = localStorage.getItem('reference-lab-theme'); } catch {}
  applyTheme(storedTheme ? storedTheme === 'dark' : darkQuery.matches);
  document.querySelector('#lab-theme').addEventListener('click', () => {
    storedTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(storedTheme === 'dark', true);
  });
  darkQuery.addEventListener('change', e => { if (!storedTheme) applyTheme(e.matches); });
  for (const [i, sample] of samples.entries()) {
    const card = document.createElement('article');
    card.className = 'lab-card';
    card.id = `sample-${sample.id}`;
    card.dataset.kind = sample.kind;
    card.dataset.wide = ['hero', 'formats', 'tabs', 'form', 'navigation'].includes(sample.id);
    const badge = sample.status === 'video-observed' ? '관찰 패턴 · 모션 재구성' : '적용을 위한 제안';
    card.innerHTML = `<div class="lab-card-top"><span class="lab-card-number">${String(i+1).padStart(2,'0')} / ${sample.kind === 'motion' ? 'MOTION' : 'INTERACTION'}</span><span class="lab-badge">${badge}</span></div><div class="lab-stage" aria-label="${escapeHTML(sample.title)} 실행 예제">${sample.html}</div><div class="lab-card-bottom"><h3>${escapeHTML(sample.title)}</h3><p>${escapeHTML(sample.summary)}</p><div class="lab-card-actions"><button data-action="replay" aria-label="${escapeHTML(sample.title)} 다시 재생">다시 재생 ↻</button><button data-action="code" aria-label="${escapeHTML(sample.title)} 코드 보기">코드 보기 &lt;/&gt;</button><button data-action="reference" aria-label="${escapeHTML(sample.title)} 영상 근거">영상 근거 ↗</button><a href="samples/${sample.id}.html" target="_blank" rel="noopener" aria-label="${escapeHTML(sample.title)} 독립 예제 새 창">독립 예제 ↗</a></div><div class="lab-card-action-status" role="status"></div></div>`;
    card.querySelector('[data-action=replay]').addEventListener('click', () => {
      apiFor(sample).replay(card.querySelector('.lab-stage'));
      card.querySelector('.lab-card-action-status').textContent = reduced.matches ? '모션 감소 설정에 따라 최종 상태로 표시합니다.' : paused ? '초기화했습니다. 전체 일시정지를 해제하면 움직입니다.' : '예제를 다시 시작했습니다.';
    });
    card.querySelector('[data-action=code]').addEventListener('click', () => openCode(sample));
    card.querySelector('[data-action=reference]').addEventListener('click', () => openReference(sample));
    grid.append(card);
    const row = document.createElement('tr');
    row.innerHTML = `<td>${escapeHTML(sample.sourceTime)}</td><td>${escapeHTML(sample.title)}</td><td>${escapeHTML(sample.evidence)}</td><td><a href="#sample-${sample.id}" data-show="${sample.id}">실행 ↗</a></td>`;
    row.querySelector('a').addEventListener('click', () => {
      activeFilter = 'all';
      document.querySelector('#sample-search').value = '';
      filterSamples();
    });
    document.querySelector('#coverage-rows').append(row);
  }
  document.querySelector('#sample-count').textContent = samples.length;
  cleanups.push(ReferenceMotion.mount(grid), ReferenceInteractions.mount(grid));
  function filterSamples() {
    const search = document.querySelector('#sample-search').value.trim().toLocaleLowerCase();
    let visible = 0;
    samples.forEach(sample => {
      const match = (activeFilter === 'all' || activeFilter === sample.kind) && `${sample.title} ${sample.summary} ${sample.id}`.toLocaleLowerCase().includes(search);
      document.querySelector(`#sample-${sample.id}`).hidden = !match;
      if (match) visible++;
    });
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
    document.querySelector('#no-results').hidden = visible > 0;
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterSamples();
  }));
  document.querySelector('#sample-search').addEventListener('input', filterSamples);
  document.querySelector('#pause-all').addEventListener('click', e => {
    paused = !paused;
    ReferenceMotion.setPaused(paused);
    ReferenceInteractions.setPaused(paused);
    const button = e.currentTarget;
    button.setAttribute('aria-pressed', String(paused));
    button.innerHTML = paused ? '<span aria-hidden="true">▷</span> 모두 재생' : '<span aria-hidden="true">Ⅱ</span> 모두 일시정지';
    syncMotionStatus();
  });
  document.querySelector('#speed').addEventListener('change', e => {
    const speed = Number(e.target.value);
    ReferenceMotion.setSpeed(speed);
    ReferenceInteractions.setSpeed(speed);
  });
  reduced.addEventListener('change', syncMotionStatus);
  syncMotionStatus();
  function snippet(sample, language) {
    const kit = sample.kind === 'motion' ? 'motion-kit' : 'interaction-kit';
    const api = sample.kind === 'motion' ? 'ReferenceMotion' : 'ReferenceInteractions';
    if (language === 'css') return `/* 토큰 + 해당 라이브러리의 실제 전체 CSS */\n${files['tokens.scoped.css']}\n${files[`${kit}.css`]}`;
    if (language === 'js') return `${files[`${kit}.js`]}\n\n// 샘플 HTML이 DOM에 들어간 뒤 실행하세요.\nconst root = document.getElementById('my-${sample.id}');\nconst cleanup = ${api}.mount(root);\n// 화면 제거 시 cleanup();\n`;
    return `<!-- 경로와 컨테이너 ID를 프로젝트에 맞게 바꾸세요. 동일 예제마다 고유 ID를 사용하세요. -->\n<link rel="stylesheet" href="design-system/tokens.scoped.css">\n<link rel="stylesheet" href="design-system/${kit}.css">\n\n<div class="adver-system" id="my-${sample.id}">\n${sample.html}\n</div>\n\n<script src="design-system/${kit}.js"><\/script>\n<script>\n  const root = document.getElementById('my-${sample.id}');\nconst cleanup = ${api}.mount(root);\n  // SPA 화면을 제거할 때 cleanup();\n<\/script>`;
  }
  function showLanguage(language, focus = false) {
    selectedLanguage = language;
    copyGeneration++;
    const tabs = [...document.querySelectorAll('[data-code]')];
    tabs.forEach(tab => {
      const active = tab.dataset.code === language;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    document.querySelector('#code-panel').setAttribute('aria-labelledby', `code-${language}`);
    document.querySelector('#code-content').textContent = snippet(selectedSample, language);
    document.querySelector('#code-panel').scrollTop = 0;
    document.querySelector('#copy-status').textContent = language === 'html' ? '경로형 사용 예제입니다. 독립 HTML에는 모든 코드가 포함됩니다.' : '샘플에서 실제 실행 중인 라이브러리 전체 소스입니다.';
  }
  function openCode(sample) {
    selectedSample = sample;
    document.querySelector('#code-title').textContent = sample.title;
    document.querySelector('#code-description').textContent = sample.evidence;
    document.querySelector('#explore-code').href = `sources.html#item=${encodeURIComponent(sample.id)}&view=code`;
    const link = document.querySelector('#download-code');
    link.href = `samples/${sample.id}.html`;
    link.download = `${sample.id}.html`;
    showLanguage('html');
    codeDialog.showModal();
  }
  document.querySelector('#close-code').addEventListener('click', () => codeDialog.close());
  codeDialog.addEventListener('close', () => { copyGeneration++; });
  const languageTabs = [...document.querySelectorAll('[data-code]')];
  languageTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showLanguage(tab.dataset.code));
    tab.addEventListener('keydown', e => {
      const next = {ArrowRight:(i+1)%3,ArrowLeft:(i+2)%3,Home:0,End:2}[e.key];
      if (next !== undefined) { e.preventDefault(); showLanguage(languageTabs[next].dataset.code, true); }
    });
  });
  document.querySelector('#copy-code').addEventListener('click', async () => {
    const code = snippet(selectedSample, selectedLanguage);
    const request = ++copyGeneration;
    let copied = false;
    try { await navigator.clipboard.writeText(code); copied = true; } catch {
      const field = document.createElement('textarea');
      field.value = code;
      field.setAttribute('aria-label', '복사할 코드');
      field.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
      codeDialog.append(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
      document.querySelector('#copy-code').focus();
    }
    if (request === copyGeneration) document.querySelector('#copy-status').textContent = copied ? `${selectedLanguage.toUpperCase()} 코드를 복사했습니다.` : '자동 복사가 제한되었습니다. 코드 영역에서 직접 선택해 복사하세요.';
  });
  function openReference(sample) {
    const video = document.querySelector('#lab-video');
    const seconds = sourceSeconds(sample);
    document.querySelector('#reference-title').textContent = `${sample.title} · ${sample.sourceTime}`;
    document.querySelector('#reference-note').textContent = sample.evidence;
    referenceDialog.showModal();
    video.pause();
    video.preload = 'metadata';
    video.currentTime = seconds;
  }
  document.querySelector('#close-reference').addEventListener('click', () => referenceDialog.close());
  referenceDialog.addEventListener('close', () => document.querySelector('#lab-video').pause());
  // Expose the actual standalone source for consumers without a download-capable server.
  window.ReferenceLab = { snippet, standalone: id => standalone[id] };
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    cleanups.forEach(cleanup => { if (typeof cleanup === 'function') cleanup(); });
  }, {once:true});
})();
