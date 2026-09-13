/* Local source reader. Collected third-party HTML/JS is displayed as text, never executed. */
(() => {
  'use strict';
  const {entries, files, tokens, coverage, collection} = window.SourceCatalog;
  const $ = selector => document.querySelector(selector);
  const labels = {page:'페이지·섹션',sample:'모션·인터랙션',token:'디자인 토큰',file:'구현 파일',original:'수집 원본',guide:'문서·기록'};
  const statuses = {reconstructed:'관찰 기반 재구성',substitute:'대체·제안',collected:'수집 원본',local:'프로젝트 문서'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bytes = value => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`;
  let selected, view = 'preview', selectedFile, copyVersion = 0, wrap = true;
  const mediaQuery = matchMedia('(prefers-color-scheme: dark)');
  let savedTheme;
  try { savedTheme = localStorage.getItem('reference-lab-theme'); } catch {}
  function theme(dark) {
    document.body.dataset.theme = dark ? 'dark' : 'light';
    $('#source-theme').innerHTML = `<span class="as-sr-only">${dark ? '라이트 테마' : '다크 테마'} </span><span aria-hidden="true">◐</span>`;
    $('#source-theme').title = dark ? '라이트 테마' : '다크 테마';
    $('#source-theme').setAttribute('aria-pressed', String(dark));
  }
  theme(savedTheme ? savedTheme === 'dark' : mediaQuery.matches);
  $('#source-theme').addEventListener('click', () => {
    savedTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    theme(savedTheme === 'dark');
    try { localStorage.setItem('reference-lab-theme', savedTheme); } catch {}
  });
  mediaQuery.addEventListener('change', e => {if (!savedTheme) theme(e.matches);});
  $('#source-stats').innerHTML = [['sample','실행 예제'],['page','페이지·섹션'],['original','원본 자료'],['file','구현 파일']].map(([kind, label]) => `<span><b>${entries.filter(e => e.category === kind).length}</b>${label}</span>`).join('');
  function renderList() {
    const query = $('#source-search').value.trim().toLocaleLowerCase();
    const category = $('#source-category').value;
    const matches = entries.filter(e => (category === 'all' || e.category === category) && `${e.title} ${e.summary} ${e.id} ${e.files.join(' ')}`.toLocaleLowerCase().includes(query));
    $('#source-result-count').textContent = `${matches.length} / ${entries.length}개 소스`;
    $('#clear-source-search').hidden = !query;
    $('#source-empty').hidden = matches.length > 0;
    $('#source-list').replaceChildren();
    matches.forEach(entry => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.entry = entry.id;
      button.setAttribute('aria-current', String(entry === selected));
      button.innerHTML = `<span>${escape(entry.title)}</span><small>${escape(labels[entry.category])} · ${escape(statuses[entry.status])}</small>`;
      button.addEventListener('click', () => {select(entry); if (matchMedia('(max-width:720px)').matches) $('#source-title').scrollIntoView({block:'start'});});
      $('#source-list').append(button);
    });
  }
  $('#source-search').addEventListener('input', renderList);
  $('#source-category').addEventListener('change', renderList);
  $('#clear-source-search').addEventListener('click', () => {$('#source-search').value='';renderList();$('#source-search').focus();});
  $('#source-reset').addEventListener('click', () => {$('#source-search').value='';$('#source-category').value='all';renderList();$('#source-search').focus();});
  function setURL() {
    const hash = `#${new URLSearchParams({item:selected.id, view})}`;
    try { history.replaceState(null, '', hash); } catch { /* file:// history can be unavailable */ }
  }
  function select(entry, update = true) {
    selected = entry;
    selectedFile = entry.html ? '@section' : entry.files[0];
    $('#source-title').textContent = entry.title;
    $('#source-summary').textContent = entry.summary;
    $('#source-labels').innerHTML = `<span>${escape(labels[entry.category])}</span><span>${escape(statuses[entry.status])}</span>`;
    $('#source-open').hidden = !entry.preview;
    if (entry.preview) $('#source-open').href = entry.preview;
    view = entry.preview || entry.category === 'token' || /^(image|video)\//.test(entry.mime || '') ? 'preview' : 'code';
    renderList();
    showView(view, false, update);
  }
  function showView(next, focus = false, update = true) {
    view = next;
    copyVersion++;
    $('#source-feedback').textContent = '';
    document.querySelectorAll('[data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    $('#source-panel').setAttribute('aria-labelledby', `source-tab-${view}`);
    $('#source-panel').replaceChildren();
    if (view === 'code') renderCode();
    else if (view === 'evidence') renderEvidence();
    else renderPreview();
    if (update) setURL();
  }
  const tabs = [...document.querySelectorAll('[data-view]')];
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
    tab.addEventListener('keydown', e => {
      const next = {ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[e.key];
      if (next !== undefined) {e.preventDefault();showView(tabs[next].dataset.view,true);}
    });
  });
  function renderPreview() {
    if (selected.preview) {
      $('#source-panel').innerHTML = '<div class="preview-toolbar" role="group" aria-label="미리보기 너비"><button data-width="desktop" aria-pressed="true">넓게 보기</button><button data-width="mobile" aria-pressed="false">모바일 375px</button><span>미리보기 안에서 직접 조작할 수 있습니다.</span></div><div class="preview-shell" data-width="desktop"></div><p class="preview-note">좁은 화면에서는 사용 가능한 너비에 맞춰집니다. 전체 화면은 ‘새 창’으로 확인하세요.</p>';
      const frame = document.createElement('iframe');
      frame.title = `${selected.title} 실행 미리보기`;
      // Only our authored previews are allowed here; archived third-party files never enter this branch.
      frame.src = selected.preview;
      $('.preview-shell').append(frame);
      document.querySelectorAll('.preview-toolbar button').forEach(button => button.addEventListener('click', () => {
        $('.preview-shell').dataset.width = button.dataset.width;
        document.querySelectorAll('.preview-toolbar button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      }));
    } else if (selected.category === 'token') {
      $('#source-panel').innerHTML = `<div class="token-grid">${Object.entries(tokens.color || {}).map(([name, token]) => `<article class="token-tile"><i class="token-swatch" style="background:${escape(token.value)}"></i><b>${escape(name)}</b><code>${escape(token.value)}</code></article>`).join('')}</div><p class="preview-note">원본에서 관찰한 색상과 프로젝트 권장 토큰입니다. 전체 서체·간격·다크 토큰은 ‘소스 코드’에서 확인하세요.</p>`;
    } else {
      const path = selected.files[0];
      if (/^image\//.test(selected.mime || '') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(path)) {
        const img = document.createElement('img');img.className='source-media';img.src=path;img.alt=selected.title;$('#source-panel').append(img);
      } else if (/^video\//.test(selected.mime || '') || /\.mp4$/i.test(path)) {
        const video = document.createElement('video');video.className='source-media';video.src=path;video.controls=true;video.preload='metadata';video.setAttribute('aria-label', selected.title);$('#source-panel').append(video);
      } else {
        $('#source-panel').innerHTML = `<div class="source-file-info"><p class="eyebrow">${escape(statuses[selected.status])}</p><h3>${escape(selected.title)}</h3><p>이 자료는 파일로 확인할 수 있습니다. HTML·JavaScript 원본은 실행하지 않고 소스 코드로 표시합니다.</p><button id="view-file-code">소스 코드 보기</button></div>`;
        $('#view-file-code').addEventListener('click', () => showView('code'));
      }
    }
  }
  let originalsRequest;
  function loadOriginals() {
    if (window.SourceOriginals) return Promise.resolve();
    if (!originalsRequest) originalsRequest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'design-system/source-originals.js';
      script.onload = () => {if (window.SourceOriginals) resolve(); else {originalsRequest=null;reject(new Error('archive unavailable'));}};
      script.onerror = () => {script.remove();originalsRequest=null;reject(new Error('archive unavailable'));};
      document.head.append(script);
    });
    return originalsRequest;
  }
  function currentSource() {return selectedFile === '@section' ? selected.html : files[selectedFile]?.content;}
  function renderCode() {
    const options = (selected.html ? '<option value="@section">이 섹션의 HTML 마크업</option>' : '') + selected.files.map(path => `<option value="${escape(path)}">${escape(path)}</option>`).join('');
    $('#source-panel').innerHTML = `<div class="code-toolbar"><label class="visually-hidden" for="source-file">소스 파일</label><select id="source-file">${options}</select><button id="source-wrap" aria-pressed="${wrap}">자동 줄바꿈</button><button id="source-copy">전체 코드 복사</button><a id="source-download" download>파일 받기 ↓</a></div><div class="code-meta" id="source-code-meta"></div><pre class="source-code${wrap?' wrapped':''}" tabindex="0" aria-label="파일 소스"><code id="source-code-text"></code></pre>`;
    $('#source-file').value = selectedFile;
    $('#source-file').addEventListener('change', e => {selectedFile=e.target.value;updateCode();});
    $('#source-wrap').addEventListener('click', () => {wrap=!wrap;$('.source-code').classList.toggle('wrapped',wrap);$('#source-wrap').setAttribute('aria-pressed',String(wrap));});
    $('#source-copy').addEventListener('click', copyCode);
    updateCode();
  }
  async function updateCode() {
    const request = ++copyVersion;
    $('#source-feedback').textContent='';
    const file = files[selectedFile];
    if (file?.deferred && file.content == null) {
      $('#source-code-text').textContent = '수집 원본의 전체 코드를 불러오는 중입니다…';
      $('#source-copy').disabled = true;
      $('#source-wrap').disabled = true;
      $('#source-code-meta').textContent = `${bytes(file.bytes)} · 원본 텍스트`;
      $('#source-download').hidden = false;
      $('#source-download').href = file.path;
      $('#source-download').download = file.path.split('/').pop();
      try {
        await loadOriginals();
        file.content = window.SourceOriginals[file.path];
        if (typeof file.content !== 'string') throw new Error('source missing');
      } catch {
        if (request === copyVersion) {
          $('#source-code-text').textContent = '소스 데이터를 불러오지 못했습니다. 파일 받기로 전체 원본을 저장하거나 페이지를 새로고침하세요.';
          $('#source-feedback').textContent = '전체 원본 파일 다운로드는 계속 사용할 수 있습니다.';
        }
        return;
      }
      if (request !== copyVersion) return;
    }
    const content = currentSource();
    $('#source-code-text').textContent = content ?? '바이너리 자료입니다. 파일 받기로 원본을 저장하세요.';
    $('#source-copy').disabled = content == null;
    $('#source-wrap').disabled = content == null;
    $('#source-download').hidden = selectedFile === '@section';
    if (file) {$('#source-download').href=file.path;$('#source-download').download=file.path.split('/').pop();}
    const lines = content == null ? 0 : content.split('\n').length;
    $('#source-code-meta').innerHTML = `<span>${content == null ? 'BINARY' : `${lines.toLocaleString()}줄 · 생략 없는 전체 소스`}${file ? ' · '+bytes(file.bytes):''}</span><span>${file ? 'SHA-256 '+file.sha256.slice(0,16)+'…':'전체 페이지에 사용된 섹션 마크업'}</span>`;
  }
  async function copyCode() {
    const content = currentSource();
    if (content == null) return;
    const version = ++copyVersion;
    let copied = false;
    try {await navigator.clipboard.writeText(content);copied=true;} catch {
      const field = document.createElement('textarea');field.value=content;field.setAttribute('aria-label','복사할 전체 소스');field.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';document.body.append(field);field.select();
      try {copied=document.execCommand('copy');} catch {}
      field.remove();if(version===copyVersion)$('#source-copy')?.focus();
    }
    if (version === copyVersion) $('#source-feedback').textContent = copied ? '생략 없는 전체 소스를 복사했습니다.' : '자동 복사를 사용할 수 없습니다. 코드 영역을 선택해 복사하거나 파일을 다운로드하세요.';
  }
  function renderEvidence() {
    const list = selected.files.map(path => `<li><a href="${escape(path)}" download>${escape(path)}</a>${files[path] ? ` <span>· ${bytes(files[path].bytes)}</span>`:''}</li>`).join('');
    const sample = selected.category === 'sample';
    const kit = selected.files.some(p=>p.includes('motion-kit')) ? 'ReferenceMotion' : 'ReferenceInteractions';
    const integration = sample ? `독립 HTML은 바로 실행됩니다. 프로젝트용 components/ 마크업은 .adver-system 안에 넣고 tokens.scoped.css와 해당 kit의 CSS·JS를 연결한 뒤 마크업이 DOM에 들어온 뒤 ${kit}.mount(container)를 호출하세요. 반환된 cleanup은 화면 제거 시 호출합니다.` : selected.preview ? '상대 경로를 유지해 실행하세요. landing/page-kit과 카탈로그 CSS는 페이지 전체용입니다. 기존 앱에 부분 삽입할 때는 use.html의 프로젝트용 런타임을 사용하세요.' : selected.status === 'collected' ? '연구용 수집 자료입니다. 원본 HTML과 JavaScript를 실행 환경에 연결하지 않습니다. 프로젝트 적용에는 대응하는 로컬 재구성 컴포넌트를 사용하세요.' : '소스 파일의 경로와 참조 관계를 유지하세요. 토큰은 CSS 파일로 연결하며, JSON은 디자인 도구나 빌드 도구에서 읽는 값입니다.';
    $('#source-panel').innerHTML = `<div class="source-evidence"><h3>출처와 구현 범위</h3><p>${escape(selected.evidence)}</p>${selected.sourceTime ? `<p>영상 시점: ${escape(selected.sourceTime)}</p>`:''}${(selected.origins || []).length ? '<h3>공개 원본 URL</h3><ul>'+selected.origins.map(url=>`<li><a href="${escape(url)}" target="_blank" rel="noreferrer">${escape(url)}</a></li>`).join('')+'</ul>':''}<h3>적용 방법</h3><p>${escape(integration)}</p><h3>함께 사용하는 파일</h3><ul>${list}</ul><h3>확인할 수 없는 부분</h3><p>녹화 시점의 비공개 소스, 인증 데이터와 폼 서버는 공개 자료로 확정할 수 없습니다. 도형·화면·인터랙션은 재구성했고, 폼은 외부 전송 없는 로컬 상태 예제입니다. 정확한 원본 timing과 easing은 보장하지 않습니다.</p><a href="references/source-audit/report.md">전체 수집 보고서 ↗</a> · <a href="MOTION.md">사용 API 안내 ↗</a></div>`;
  }
  const sections = coverage.section_coverage || [];
  $('#coverage-summary').textContent = `영상의 주요 구성 ${sections.length}개 그룹을 대조했습니다. 수집 원본은 공개 페이지 응답과 연결 자산 범위이며, 상세 파일 해시는 수집 명세에서 확인할 수 있습니다.`;
  $('#source-coverage-list').innerHTML = sections.map(item => `<article class="coverage-item"><h3>${escape(item.section)}</h3><div><p>${escape(item.replacement)}</p><p>확인 한계: ${escape(item.gap)}</p>${(item.project_surface || []).map(path => `<a href="${escape(path)}">${escape(path)} ↗</a>`).join(' · ')}</div></article>`).join('');
  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const entry = entries.find(e => e.id === params.get('item')) || entries.find(e => e.id === 'hero') || entries[0];
    select(entry, false);
    if (['preview','code','evidence'].includes(params.get('view'))) showView(params.get('view'),false,false);
  }
  addEventListener('hashchange', () => {if(location.hash.startsWith('#item=')) readHash();});
  readHash();
})();
