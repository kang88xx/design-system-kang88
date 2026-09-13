# Design

## Source of truth
Status: Active  
Date: 2026-09-13  
Product surfaces: `app/` 정적 디자인 시스템 스튜디오(빌드 없음), `app/public/reconstruction/` 로컬 재구성 4페이지, `app/library/` React 19 패키지, `templates/reatic-document.html` 문서 디자인 시스템.  
Evidence reviewed: `evidence/source/home.html`, `about.html`, `contact.html`, `portfolio.html`, `mobile.html`, `computed-styles.json`, `component-measurements.json`, `static-extraction.json`, `screenshots/*` (전체·첫 화면·섹션 46·호버 8). 리틱인더스트리 Wix 편집기·폼 백엔드 접근은 없음. 관찰값은 공개 HTML/인라인 CSS/스크린샷/계산 스타일에 한정한다.

## Brand
성격: 흑백 대비와 거대한 여백, 굵은 고딕 한 문장, 자동재생 3D 렌더 영상. "무에서 유를 창조하는 모션그래픽 프로덕션"이라는 한 문장이 워드마크를 대신한다.  
Trust signals: 외곽선 삼각형 로고, 클라이언트 32사 흰 단색 로고 그리드, "마감 일정 미준수 0회" 같은 구체적 숫자, 실제 작업물 영상.  
Avoid: 두 번째 포인트 컬러, 순백 텍스트를 검정 위에 남발, 카드 남용, 장식 아이콘, 스크린샷을 산출물로 내미는 설명.

## Product goals
Goals: 공개 홈페이지의 색·서체·레이아웃·컴포넌트·모션을 코드 토큰과 React 컴포넌트로 계약화하고, 같은 언어를 A4 문서에도 적용할 수 있게 한다.  
Non-goals: Wix 내부 토큰·컴포넌트 복제 주장, 폼 제출·이메일 자동화 재현, 원본 영상 픽셀 동일 재현.  
Success signals: 스튜디오에서 모든 토큰·상태·모션을 조작할 수 있고, 재구성 4페이지가 1440/390에서 넘침 없이 렌더링되며, 문서 템플릿이 A4 PDF로 인쇄된다. `scripts/verify.mjs` 73개 검사 통과.

## Personas and jobs
Primary personas: 구현자(웹/React), 디자이너, 문서 작성자, QA.  
User jobs: 관찰 근거를 빠르게 확인하고, 리틱인더스트리풍 레이아웃과 모션을 프로젝트에 붙이며, 제안서·보고서를 같은 시각 언어로 쓰고, 관찰값과 로컬 재해석을 혼동하지 않는다.  
Contexts of use: 데스크톱 1440px, 모바일 390px(원본 캔버스 320) 검토, 로컬 정적 서버에서 스튜디오 확인, 브라우저 인쇄로 PDF 생성.

## Information architecture
Site: `header`(로고 64 + 내비 3항목) → 페이지 섹션 → `footer` 48px. 홈 13섹션(히어로 영상 → 3줄 카피 → 1521px 여백 → 강점 → 카드 슬라이더 → 리드+인라인 영상 → 풀블리드 영상 → 영상미 → 2단 → 풀블리드 → 2단 → CTA), about 3블록(GIF 히어로 → 흰 텍스트 → 검정 텍스트), portfolio(검정 히어로 → 도입 → 2열 갤러리 → 클라이언트 8×4 → CTA), contact(고정 영상 배경 위 7개 질문 블록 + 우측 앵커 도트).  
Studio routes: `#overview`, `#identity`, `#colors`, `#typography`, `#layout`, `#components`, `#motion`, `#document`, `#sources`. 원본 관찰(캡처)과 로컬 구현(컴포넌트 샘플)을 같은 화면에서 교차 확인한다.

## Design principles
Evidence first: 관찰된 DOM/CSS/계산값과 로컬 재구성 결정을 문서·코드 주석에서 분리한다.  
One message per viewport: 섹션 여백 300–1500px, 한 화면에 한 문장.  
Gray then black: 본문은 `#8a8a8a`, 핵심 구절만 `#000` 볼드.  
One amber: 페이지(문서)당 앰버 한 곳.  
Stateful fidelity: hover/current/focus/invalid/loading/disabled를 정적 모양보다 우선 기록한다.

## Visual language
Color: 바탕 `#ffffff` / `#000000` 교대, 검정 위 텍스트 `#f3f3f3`(순백은 헤드라인 한 줄), 보조 `#8a8a8a`, 힌트 `#e3e3e3`, 표면 `#f3f3f3`, 앰버 `#eea302`(CTA·핵심 숫자), 내비 선택 `#ff4040`(모바일 `#926402`), 보조 버튼 `#282626`, 흐린 도입 `#414141`. Wix 테마 램프(앰버·빨강·청록·보라 5단계)는 선언만 있고 앰버 외 미사용.  
Typography: Latin 디스플레이 Work Sans SemiBold(font_0/2/3/4/5, 한글 폴백), 한글 Noto Sans KR Bold/Black/DemiLight(사이트 업로드), UI Avenir LT 35 Light(font_7/8/9), 테마 본문 DIN Next Light(font_1/10). 스케일 260/100/70/60/49/42/38/31/26/21/16/15/13/12/10, 행간 1.4(예외 1.2/1.7/0.8), 자간 0(버튼 .75px). 모바일 34/32/31/22.  
Spacing: 헤더 76, 로고 64@(16,6), 내비 141×3, 텍스트 컬럼 980(히어로 카피 x=117), 섹션 안쪽 여백 115/96·189/228·312/246, 갤러리 60px 여백·20px 간격, 클라이언트 150px 셀, 앵커 도트 11px·32px 간격, 푸터 48, 모바일 20px.  
Shape/elevation: 필 50px(CTA 288×55), 카드 40px, 제출 2px, 테두리 1px(#8a8a8a) / 2px(#f3f3f3). 그림자 없음(헤더 `0 1px 4px rgba(0,0,0,.6)` 선언, 토글 off). 헤더 배경은 흰 라디얼 그라디언트 메쉬.  
Motion: 진입 6종(floatIn 27 · fadeIn 13 · foldIn 8 · glideIn 5 · blurIn 2 · revealIn 2), 지배값 1200ms · cubic-bezier(.445,.05,.55,.95) · 60px, 히어로 폴드 스태거 0/700/1400ms, 블러 6/25px(3초 지연). 호버: 내비 color .4s → #f3f3f3, CTA → #f3f3f3, 제출 .5s. 갤러리 컨테이너 .8s (.13,.78,.53,.92), 미디어 .4s (.3,.13,.12,1). 페이지 전환 out-in .35s / slide .6s. 배경 영상 7개 autoplay muted loop, contact는 fixed. 스크롤 패럴랙스 비활성. reduced motion 대응은 로컬 추가.  
Imagery/iconography: 삼각형 로고(SVG 재구성), 셰브론·화살표 2종 벡터, 3D 렌더 영상 7편, 포트폴리오 타일 16:9 25장, 클라이언트 흰 단색 로고. 일러스트·아이콘 세트 없음.

## Components
Core: Logo, Header, NavMenu, Button(cta/secondary/submit), TextField(underline/box), Select, Checkbox, Range(CSS), Card, GalleryTile, Gallery, ClientsGrid(CSS), AnchorDots, ScrollHint, CtaStrip, Footer, EnterMotion.  
Variants/states: nav hover/current/focus, button hover/focus/disabled/loading, field focus/invalid/disabled, tile hover/focus/loading, anchor current, 다크 스코프 `[data-rt-theme="dark"]`, 밝은 바탕 필드 재정의(`.q--light`).  
Token ownership: `app/src/system/tokens.json`이 단일 원본이며 `--rt-*` 접두사로 생성된다. Wix 변수명(`color_N`, `font_N`, `--motion-*`)은 `docs/interaction-inventory.md`와 `static-extraction.json`에 근거값으로만 둔다.

## Accessibility
Target standard: WCAG 2.2 AA를 목표로 한다(원본은 AA 미충족 지점이 있음: 내비 호버 `#f3f3f3` on white, 12px DemiLight 주석).  
Keyboard/focus: 원본에 포커스 스타일이 없어 앰버 2px `outline`을 모든 인터랙티브 요소에 추가했다. 링크 렌더 버튼은 `aria-disabled`, 로딩은 `aria-busy`.  
Contrast: `#8a8a8a` on white 3.4:1(대형 텍스트 전용), `#f3f3f3` on black 18:1, 앰버 위 검정 9.7:1. 회색 본문은 31px 이상에서만 쓰고 소형 텍스트는 `#414141` 이상을 권장한다.  
Semantics: `nav[aria-label]`, `aria-current="page"`, label/hint/error id 연결, `role="alert"`/`role="status"`, 앵커 도트 `aria-label`.  
Reduced motion: 모든 진입 프리셋·페이지 전환 즉시 완료, 배경 영상 숨김, 스튜디오 Reduce motion 토글.

## Responsive behavior
Breakpoints: 로컬 계약 750px(단일 컬럼·앵커 숨김·내비 22px·모바일 선택색), 1000px(타이포 clamp 축소·클라이언트 4열). 원본은 Wix 데스크톱(980 그리드)/모바일(320) 두 캔버스만 갖고 PC 전용 안내를 띄운다.  
Desktop 1440: 풀블리드 영상, 980 텍스트 컬럼, 1320 갤러리, 8열 로고.  
Mobile 390/320: 20px 여백, 히어로 34/32px, 갤러리 1열 321×178, 로고 2열, 도트 숨김, PC 전용 안내는 재현하지 않음.  
Touch/hover: 호버 페이드는 데스크톱 전용, 터치는 즉시 상태 전환.

## Interaction states
Loading: 제출 버튼 스피너(`data-loading`), 갤러리 타일 셔머(`data-loading`).  
Empty: `Gallery`는 items 없으면 렌더링하지 않음. 클라이언트 그리드는 25/32 확보분만 표시.  
Error: contact 재구성에서 필수값 누락 시 원본 문구("누락된 입력란이 있거나 오류가 발생했습니다 :(")를 `role="status"`로 표시. 외부 API 없음.  
Success: 로컬 접수 상태 문구, CTA/내비 즉시 색 변화.  
Disabled: 버튼 opacity .45 + `pointer-events: none` + native disabled.  
Offline/slow network: 영상·이미지는 로컬 보관 자산, Google Fonts 실패 시 시스템 고딕 폴백.

## Content voice
짧고 단정한 한국어 평서문, 반말 없음, 이모티콘 ":)"은 원본 힌트 문구에서만. 원문 카피는 재구성 페이지에 한해 그대로 쓰고, 문서 템플릿은 예시 문장으로만 인용한다. 수집 범위·미확보·대체는 숨기지 않고 짧게 적는다.

## Implementation constraints
Framework: 스튜디오·재구성은 빌드 없는 정적 HTML/CSS/JS. 패키지는 React 19 peer, ESM, `index.d.ts` 동봉. JSX 검사는 `apple_design/app/node_modules/esbuild`를 재사용(`ESBUILD` 환경변수로 대체 가능).  
Scope: 수집 스크립트, 토큰 생성기, 컴포넌트, 재구성 4페이지, 문서 템플릿, 검증 스크립트.  
Assets: 원본 이미지 74 · 영상 7(720p) · 폰트 55는 `app/public/source`·`media`에 보관하고 패키지에는 포함하지 않는다. Wix 유료 폰트는 재배포하지 않는다.  
Performance: 영상은 `object-fit: cover` + reduced motion 시 숨김, 이미지 `loading="lazy"`, 고정 aspect-ratio.  
Tests/screenshots: `node --test app/tests`, `node scripts/verify.mjs`(1440/768/390/320 넘침, 토큰 복사·내보내기, 테마, 모션 재생·감소, 호버·포커스·상태, 재구성 4페이지 이미지·영상·진입, contact 검증, 문서 템플릿 인쇄·PDF).

## Open questions
- [ ] Owner: implementer. Impact: 슬라이더 자동 전환 간격·방향은 정지 상태만 관측되어 미확정. 현재 재구성은 정적 2장.
- [ ] Owner: designer. Impact: 내비 호버 `#f3f3f3`는 원본 그대로이나 접근성상 대체(예: `#8a8a8a`) 여부 결정 필요.
- [ ] Owner: product. Impact: 원문 카피·클라이언트 로고 사용 범위와 저작권 표시 정책.

## Document system surface
`templates/reatic-document.html`은 표지·머리말·꼬리말·장/절·리드·회색 본문·핵심 숫자·표·카드·콜아웃·단계·타임라인·라벨·버튼·서명선·코드 패턴과 A4 인쇄 스타일을 한 파일에 담는다. 규칙은 `docs/document-system.md`. 스튜디오 `#document`에서 iframe으로 미리 본다.

## Studio shell
스튜디오(`app/index.html`)의 뼈대는 공통 규격 [`../All/shell/SPEC.md`](../All/shell/SPEC.md)(Apple 스튜디오 포맷)를 따른다. 구조·치수는 `app/studio-shell.css`, 모바일 드로어·브레드크럼·토스트는 `app/studio-shell.js`가 담당하며 두 파일은 공통 셸의 복사본이므로 이 저장소에서 수정하지 않는다.
레이아웃은 좌측 고정 사이드바 232px(브랜드 마크 = 외곽선 삼각형, `Reatic / Design system`, 배지 `WEB`, WORKSPACE nav 01~09 = 기존 9개 섹션) + 65px sticky 상단바(브레드크럼 · 테마 토글 · `Export tokens.css`) + `.as-workspace`(max 1400px)다. 섹션 머리는 `.as-section-heading`, 개요 상단은 `.as-overview-title` + `.as-stats-strip`로 통일한다.
브랜드 스킨은 `app/studio.css` 맨 위 `:root`에서 `--rt-*` / `--st-*` 토큰을 `--as-*`로 매핑해 입힌다. 값이 모두 토큰 참조이므로 `data-rt-theme="dark"`를 걸면 셸도 함께 다크로 전환된다(`--as-accent` = `--rt-color-accent` #eea302, `--as-nav-active-ink` = `--rt-color-nav-selected` #ff4040).
기존 id·이벤트 대상(`#export-tokens`, `#theme-light`, `#theme-dark`, `#token-count`, `#source-filter`, `[data-copy]`, `[data-replay]`)과 문구는 그대로 유지한다. `studio.js`의 내비 하이라이트만 `.st-top nav a` → `.as-sidebar nav a`로 옮겼고, `aria-current="page"`를 함께 세워 셸의 브레드크럼이 현재 섹션을 따라간다.
