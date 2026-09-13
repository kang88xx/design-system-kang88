// Independent implementation recipes; source measurements stay in observations.
const materialCommit = 'c05b4b23485c803f68ff31cde52506cea5cc555a';
const tokenUrl = name => `https://github.com/material-components/material-web/blob/${materialCommit}/tokens/versions/v0_192/_md-sys-${name}.scss`;
export const designLibrary = {
  version: '2.0.0', reviewedAt: '2026-09-07',
  evidenceLabels: { observed: '제품 관찰값', documented: '공식 토큰', reconstructed: '유사 구현' },
  sources: [
    ...['motion','shape','state','elevation','color'].map(id => ({ id: `material-${id}`, name: `Material Web · ${id}`, url: tokenUrl(id), license: 'Apache-2.0', revision: materialCommit, checkedAt: '2026-09-07' })),
    { id:'material-symbols-guide', name:'Material Symbols guide', url:'https://developers.google.com/fonts/docs/material_symbols', license:'Reference guidance', checkedAt:'2026-09-07' },
  ],
  motion: {
    evidence: 'documented', sourceId:'material-motion',
    durations: Object.fromEntries(['short1','short2','short3','short4','medium1','medium2','medium3','medium4','long1','long2','long3','long4','extraLong1','extraLong2','extraLong3','extraLong4'].map((key,i)=>[key,[50,100,150,200,250,300,350,400,450,500,550,600,700,800,900,1000][i]])),
    easings: {standard:'cubic-bezier(0.2,0,0,1)', standardAccelerate:'cubic-bezier(0.3,0,1,1)', standardDecelerate:'cubic-bezier(0,0,0,1)', emphasized:'cubic-bezier(0.2,0,0,1)', emphasizedAccelerate:'cubic-bezier(0.3,0,0.8,0.15)', emphasizedDecelerate:'cubic-bezier(0.05,0.7,0.1,1)', linear:'linear'},
    note:'공식 전체 duration scale을 보관합니다. 이 카탈로그의 실제 움직임은 500ms 이하이며 reduced motion에서는 이동·회전을 생략합니다. 제품 화면의 실측 시간이 아닙니다.',
    recipes: [
      ['state-layer','상태 레이어',100,'standard','opacity','hover·focus·press'],
      ['selection','선택 이동',200,'standard','transform','navigation·segmented control'],
      ['menu-enter','메뉴 펼치기',200,'emphasizedDecelerate','opacity, transform','menu·popover'],
      ['dialog-enter','다이얼로그 진입',300,'emphasizedDecelerate','opacity, transform','modal·sheet'],
      ['exit','표면 닫기',150,'emphasizedAccelerate','opacity, transform','dismiss·exit'],
      ['expand','상세 펼치기',250,'standard','grid-template-rows, opacity','disclosure'],
      ['snackbar-enter','피드백 표시',200,'standardDecelerate','opacity, transform','snackbar'],
      ['icon-state','아이콘 상태',150,'standard','font-variation-settings','선택·해제'],
    ].map(([id,name,duration,easing,properties,usage])=>({id,name,duration,easing,properties,usage,evidence:'reconstructed',sourceId:'material-motion',reducedMotion:'instant state change'})),
  },
  states: {evidence:'documented',sourceId:'material-state',opacity:{hover:.08,focus:.12,pressed:.12,dragged:.16},disabledContent:.38,disabledContainer:.12},
  shapes: [
    ['square','사각형','0','none','기본 frame','documented'],
    ['small','작은 모서리','4px','none','배지·작은 표면','documented'],
    ['chip','칩','8px','none','filter·assist chip','documented'],
    ['medium','중간 모서리','12px','none','compact card','documented'],
    ['card','카드','16px','none','content surface','documented'],
    ['dialog','다이얼로그','28px','none','중앙 modal','documented'],
    ['pill','캡슐','9999px','none','검색·선택·버튼','documented'],
    ['circle','원형','50%','none','icon action·status','reconstructed'],
    ['sheet','상단 둥근 표면','28px 28px 0 0','none','bottom sheet','documented'],
    ['leaf','비대칭 모서리','28px 4px 28px 4px','none','독립 empty-state 도형','reconstructed'],
    ['diamond','마름모','0','polygon(50% 0,100% 50%,50% 100%,0 50%)','정보 강조 도형','reconstructed'],
    ['hexagon','육각형','0','polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)','독립 diagram 도형','reconstructed'],
  ].map(([id,name,radius,clipPath,usage,evidence])=>({id,name,radius,clipPath,usage,evidence,sourceId:'material-shape',css:`border-radius: ${radius};${clipPath==='none'?'':`\nclip-path: ${clipPath};`}`})),
  containers: [
    ['search','검색 표면','search','56px','9999px','surface-container','on-surface','16px','검색·유틸리티'],
    ['selected-nav','선택 내비게이션','inbox','48px','9999px','primary-container','on-primary-container','12px 24px','Gmail·Drive 공통 문법'],
    ['tonal-action','강조 액션','video_call','56px','28px','tertiary-container','on-tertiary-container','16px 24px','Meet tonal action 문법'],
    ['content-card','콘텐츠 카드','folder','120px','16px','surface','on-surface','24px','Drive card 문법'],
    ['info-banner','안내 배너','shield_lock','96px','28px','primary-container','on-primary-container','24px','정보·안전 안내'],
    ['side-sheet','보조 패널','tune','160px','16px','surface-low','on-surface','24px','상세·필터 surface'],
    ['data-tile','데이터 타일','show_chart','112px','12px','surface','on-surface','16px','Finance 정보 위계'],
    ['empty-canvas','빈 상태','event_busy','160px','28px','secondary-container','on-secondary-container','24px','일정 없음·검색 없음'],
  ].map(([id,name,icon,height,radius,background,foreground,padding,usage])=>({id,name,icon,height,radius,background,foreground,padding,usage,evidence:'reconstructed',sourceId:'material-shape',css:`min-height: ${height};\nborder-radius: ${radius};\npadding: ${padding};\nbackground: var(--gds-color-${background.replace('surface-low','surface-container-low')});\ncolor: var(--gds-color-${foreground});`})),
  gradients: [
    ['tonal-blue','Tonal blue','linear-gradient(135deg, #d3e3fd 0%, #c2e7ff 100%)','독립 안내 표면'],
    ['calm-green','Calm green','linear-gradient(135deg, #c4eed0 0%, #c2e7ff 100%)','성공·빈 상태'],
    ['warm-paper','Warm paper','linear-gradient(120deg, #fff8e1 0%, #f9dedc 100%)','중립 diagram 배경'],
    ['soft-orbit','Soft orbit','radial-gradient(ellipse at 25% 25%, #d3e3fd 0%, #f2f6fc 65%, #ffffff 100%)','안내용 원형 깊이'],
    ['tonal-spectrum','Tonal spectrum','conic-gradient(from 45deg, #d3e3fd, #c2e7ff, #c4eed0, #d3e3fd)','독립 색상 설명 도형'],
    ['dark-depth','Dark depth','linear-gradient(145deg, #131314 0%, #282a2c 55%, #303134 100%)','다크 surface 비교'],
  ].map(([id,name,css,usage])=>({id,name,css,usage,evidence:'reconstructed',note:'기존 semantic palette로 만든 독립 CSS recipe. 원본 제품 gradient로 확인되지 않았습니다.'})),
};

export const additionalInteractions = [
  ['switch','설정 전환','click / Space','150ms','checked state and visible confirmation','switch-control'],
  ['checkbox','다중 선택','click / Space','100ms','independent checked states and selected count','checkbox-group'],
  ['keyboard-tabs','키보드 탭','ArrowLeft / ArrowRight / Home / End','200ms','roving focus and linked tabpanel','keyboard-tabs'],
  ['menu','액션 메뉴','click / ArrowDown / Escape','200ms','menu focus, dismissal and focus return','action-menu'],
  ['text-field','입력 검증','input / submit','100ms','helper text, error and valid state','validated-field'],
  ['progress','진행 상태','click','500ms','determinate progress and completion announcement','determinate-progress'],
].map(([id,title,trigger,duration,result,sampleId])=>({id,title,trigger,duration,result,evidence:'유사 구현 · Material Web 상태 계약 참고',evidenceType:'reconstructed',sourceUrl:'https://github.com/material-components/material-web',sample:{id:sampleId,contractId:id,title,behavior:result,states:['rest','active','complete']}}));
