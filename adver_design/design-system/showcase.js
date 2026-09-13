const theme = document.querySelector('#theme');
theme.addEventListener('click', () => {
  const dark = document.body.dataset.theme !== 'dark';
  document.body.dataset.theme = dark ? 'dark' : 'light';
  theme.setAttribute('aria-pressed', String(dark));
  theme.innerHTML = `<span class="as-sr-only">${dark ? '라이트' : '다크'} 테마 보기 </span><span aria-hidden="true">◐</span>`;
  theme.title = `${dark ? '라이트' : '다크'} 테마 보기`;
});
const steps = [
  ['도달하려는 목표를 정하세요.', '하나의 명확한 목표가 다음 결정을 단순하게 만듭니다.'],
  ['메시지를 전할 사람을 선택하세요.', '관심사와 맥락을 기준으로 대상을 좁힙니다.'],
  ['핵심을 담은 소재를 만드세요.', '짧은 메시지와 명확한 행동으로 구성합니다.'],
  ['실행하고, 결과에서 배우세요.', '성과를 확인하고 다음 캠페인을 개선합니다.']
];
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(i, focus = false) {
  tabs.forEach((tab, n) => { tab.setAttribute('aria-selected', String(n === i)); tab.tabIndex = n === i ? 0 : -1; });
  document.querySelector('#step-panel').setAttribute('aria-labelledby', tabs[i].id);
  document.querySelector('.step-number').textContent = `0${i + 1}`;
  document.querySelector('#step-title').textContent = steps[i][0];
  document.querySelector('#step-copy').textContent = steps[i][1];
  if (focus) tabs[i].focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(i));
  tab.addEventListener('keydown', e => {
    const next = {ArrowRight:(i+1)%4,ArrowLeft:(i+3)%4,Home:0,End:3}[e.key];
    if (next !== undefined) { e.preventDefault(); selectTab(next, true); }
  });
});
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#demo-status').textContent = `${button.dataset.demo} 선택됨 — 예시 상태이며 이동하지 않습니다.`;
}));
document.querySelector('#sample-form').addEventListener('submit', e => {
  e.preventDefault();
  document.querySelector('#form-status').textContent = '올바른 이메일 형식입니다. 외부 전송 없이 확인을 마쳤습니다.';
});
const scenes = ['히어로 · 기하학','히어로 · 스크롤','혜택 · 크레딧','성과 · 캠페인 단계','단계별 화면','광고 형식','형식 카드','형식 · 문의 폼','문의 · FAQ','FAQ · 푸터','다크 형식 · 문의','다크 캠페인 단계','다크 혜택'];
const video = document.querySelector('#reference-video');
scenes.forEach((label, i) => {
  const t = i * 4, stamp = String(t).padStart(2, '0');
  const button = document.createElement('button');
  button.innerHTML = `<img src="references/frames/t${stamp}.jpg" alt="${t}초 레퍼런스 장면: ${label}" loading="lazy"><span>00:${stamp} / ${label} ↗</span>`;
  button.addEventListener('click', () => {
    video.currentTime = t;
    video.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    video.focus();
  });
  document.querySelector('#frames').append(button);
});
