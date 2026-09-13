# Lusion 심벌과 재사용 컴포넌트

2026-09-06 · 공개 배포 HTML/CSS/JS를 근거로 한 독립 열람기. [갤러리](../components.html) · [JSON 인벤토리](icon-manifest.json) · [반복 추출기](../scripts/extract-symbols.py)

## 수집 범위와 정확한 개수

- `sources/pages/*.html` 22개 전부에서 인라인 SVG **597회**를 수집했다.
- 기하 정보, viewBox, SVG 내부 fill/stroke/style를 정규화한 고유 인라인 SVG는 **31종**이다: UI 20, Lusion 브랜드 4, 장식/타이포 7.
- 원문 바이트가 다른 SVG는 **33종**이다. `assets/icons/raw/`에 수집 당시 원문 그대로 보관했다. 모든 발생 위치는 페이지 URL, 로컬 페이지, 정확한 CSS 선택자, 문자 시작/끝 오프셋, 행, 원문 SHA-256, 원문 경로로 연결된다.
- 이미 수집된 외부 SVG **18종**도 갤러리에 포함했다: 클라이언트 로고 15, 화살표 2, Safari 고정 탭 브랜드 심벌 1. 외부 SVG는 인라인 31종에 합산하지 않는다.
- CSS/캔버스에서 변환한 신규 SVG 재현 **9종**은 별도 분류다. 갤러리 표시 총계는 **58종**이다.
- 인라인 밖 18종은 파일 기준 목록이다. 인라인과 외부 파일 간 중복 제거를 주장하지 않는다. 클라이언트 로고를 일반 UI 아이콘으로 취급하지 않는다.

`python3 scripts/extract-symbols.py`를 저장소 루트에서 실행하면 독립 SVG, JSON, file://에서 작동하는 `research/icon-data.js`를 재생성한다. Python 표준 라이브러리만 사용한다. 재현 SVG와 설명은 `assets/icons/replicas/catalog.json` 및 같은 폴더 SVG 파일을 입력으로 사용한다.

### 보존과 정규화

원본 viewBox, 경로, fill, stroke, transform, inline style를 유지한다. 중복 키는 XML 속성 순서와 기하 문자열의 공백/쉼표를 정규화하고, 배치 목적 root width/height 및 ID/class를 무시한다. 내부 ID 참조는 같은 순서의 안정적 이름으로 정규화한다. 독립 파일은 원본의 첫 번째 크기 선언을 보존한다. 같은 도형이라도 viewBox나 명시적 색상이 다르면 별개로 유지한다. 다른 path 명령이 시각적으로 동일한지 추론하여 합치지 않는다.

이는 외부 CSS가 적용된 최종 화면의 완전한 시각 동일성 판단이 아니다. 같은 SVG가 화살표 회전, hover 클론, 어두운 배경, 상속 색상 등 다른 맥락에서 쓰이는 모든 위치를 함께 보존한다. 루트 위치 선택자 때문에 원본 런타임의 숨김/변환 규칙이 독립 아이콘에 섞이지 않도록 재사용 파일의 루트 id/class는 제거한다.

독립 복사본에서는 script, foreignObject, 삽입 객체, 애니메이션 요소, on* 속성, 외부 href/src, 외부 URL/표현식이 있는 style을 제거한다. 원문은 별도 근거 파일이며 샘플 DOM에 주입하지 않는다. 갤러리의 **원본 복사**는 보존 원문, **SVG 다운로드/코드**는 독립 복사본이다. 클립보드 접근이 불가능한 file:// 환경에서는 선택된 코드 창으로 복사를 대체한다.

## 비-SVG 표식 감사

| 종류 | 공개 코드 근거 | 원본 값 / 재현 경계 |
| --- | --- | --- |
| 메뉴 두 점 | `#header-right-menu-btn-dots .header-right-menu-btn-dot` | 틀 1.15em, 점 .3125em, hover 회전 270deg. 원본 `right:.1`은 단위 없는 무효 선언이므로 재현 SVG의 대칭 위치는 제안 |
| CTA 점 / 활성 원 | `#home-reel-cta-dot`, `#home-featured-cta-dot`, `.header-menu-link:before`, `#project-details-launch-cta-dot` | .5em 원, 100px/100% 반경. CTA별 translate/scale 수치는 다름; 이 샘플의 큰 원 채우기 배율은 샘플 버튼 폭에 맞춘 제안 |
| 헤더 문의 작은 점 | `.header-right-talk-btn-dot` | .3125em 흰 점. 갤러리의 .5em CTA 점과 크기가 다른 변형임 |
| 그리드 십자 | `.home-hero-scroll-container-cross`, `.home-reel-video-container-cross`, `.about-cross`, `.end-section-content-cross` 의 before/after | 길이 `--cross-size`, 두께 `0.125 × --cross-size`; 위치/색은 섹션별 변형 |
| 스크롤 내비 십자 | `.scroll-nav-cross:before/:after` | 너비 2px / 높이 1em, 두 의사 요소 회전; 별도 비율 변형 |
| 팀 점 행렬 | `#about-who-team-dots`, `.about-who-team-dot`, About 팀 JS 생성 | 11열 × 3행, .125em 정사각형, 6.25em × .875em 틀 |
| 나침반 눈금 | `.about-who-team-top-compass-long/-small`, bottom 변형 | 폭 .125em, 긴 높이 .75em, 짧은 높이 .375em / opacity .5. SVG의 눈금 수·간격은 제안 |
| 팀 / 상세 진행 트랙 | `#about-who-team-indicator/-inner`, `#project-details-preview-footer-bar-inner`, `#scroll-nav-next-bar-inner` | scaleX로 진행. 상세 트랙 높이 3px; 팀 트랙 .125em. 갤러리는 임의 40% 상태 |
| 서비스 점선 | `.about-capability-list-item:not(:last-child):before` | 원본은 마침표 30개, letter-spacing .125em, blue / opacity .2. SVG 원형 치환은 제안 |
| 오래된 발표 취소선 | `.award-category-talks .about-award-item-wrapper.--old .about-award-item-wrapper-text:before` | 높이 .0625em, top .7em. 아이콘이 아닌 텍스트 상태 장식으로 기록 |
| 링크 밑줄 | `#project-details-desc a:after`, `#project-details-side-list a:after`, footer 링크 의사 요소 | hover scaleX 선. 메타데이터 샘플에 재현 |
| 사운드 표시 | `#header-right-sound-btn canvas`, `Header.updateSoundWave` in `sources/site.js` | CSS 막대 아이콘이 아님. 32분할 sin 파형, 폭 .4×size, 진폭 .28×size×volume, 선 .05×size. SVG는 time=0의 정적 변환; 음소거는 진폭 0 |
| 로더 숫자 / 픽셀 전환 | preloader 숫자 DOM 및 transition canvas `LOADING_RECTS` | 인라인 아이콘 아님. 로더/전환 계열은 모션 실험실 범위 |
| 원·궤도 장식 | WebGL/영상과 About 팀/서비스 장면 | 수집 CSS에서 독립 CSS orbit 아이콘으로 확인하지 못했으므로 신규 궤도 SVG를 원본 추출물로 추가하지 않음 |

`.dg.*` 디버그 컨트롤의 +/-와 clearfix처럼 시각 아이콘이 아닌 의사 요소는 제품 아이콘으로 포함하지 않는다. 외부 `arrow-right.svg` / `arrow-down.svg`는 CSS background-image로 연결되는 실제 파일이며 재현 표식이 아니다.

## 실행 가능한 박스 13종

공통: 원본 토큰은 `tokens/lusion.css`에서 가져온다. 갤러리 구조, 한국어 안내, 접근 가능한 이름/포커스, 명시적 피드백, 로컬 검증은 신규 제안이다. 공개 원본 번들·계측·폼 코드를 실행하지 않는다.

| ID / 컴포넌트 | 원본 근거 | 치수와 형태 | 실제 샘플 상태 |
| --- | --- | --- | --- |
| 01 PillButton | `#header-right-talk-btn`, `#header-right-menu-btn`, `#home-reel-cta-dot` | 높이 3.2em, radius 6.25em, font .875em 원본. 샘플 최소 44px는 제안 | idle / hover / focus-visible / :active / disabled. 클릭 피드백. 사운드 표시 토글은 음성 재생 없이 시각 상태만 변경 |
| 02 MenuPanel | `#header-menu`, `#header-menu-links` | 원본 폭 19.38em, gap .625em, 링크 패널 radius .625em. 샘플 modal 폭 380px는 제안 | closed/open, 네이티브 dialog focus containment, Escape, 배경 클릭, 닫기 후 트리거 포커스 복원 |
| 03 NewsletterPanel | `#header-menu-newsletter`, `#header-menu-newsletter-input-field` | 패널 padding 1.875em / radius .625em, 입력 높이 3.5em / radius 1.125rem | idle / empty invalid / typeMismatch / local success / edit reset. 실제 fetch, 구독, 저장 없음 |
| 04 ProjectCard | `.project-item-main`, `.project-item-image`, `.project-item-line-2` | media padding-top 65%, 이미지 radius 15px | hover/focus CSS 이미지 확대와 진입 화살표. 클릭은 샘플 테마로 이동. 원본의 WebGL 깊이 맵 효과는 이 CSS 확대와 구분 |
| 05 EditorialMetadata | `#project-details-meta`, `#project-details-left`, `#project-details-side-list` | 원본 열린 좌우 메타데이터 구조. 샘플의 박스·padding·카피는 제안 | 링크 hover/focus 밑줄; 서비스 목록과 제목은 정적 DOM |
| 06 ProjectTheme | 19개 `projects__*.html`의 `#project-details[data-color-*]` | 배경·본문·강조·버튼 default/hover 7가지 실제 값 적용 | 19개 테마 select 변경, 버튼 hover/pressed, 3개 컬러 값 복사. 갤러리의 축약 판넬 레이아웃은 제안 |
| 07 SceneFrame | `--global-border-radius`, `.section`, `.home-reel-video-container-cross` | 기본 20px, 모바일 10px; 12열/6열; 십자 선 12.5% | 그리드 표시/숨김. 네 모서리 십자 조합은 원본 개별 요소의 재조합 제안 |
| 08 AwardRows | `#about-award`, `.about-award-header-number`, `.about-award-line` | 원본 58: Awwwards 29 + FWA 20 + Webby 4 + CSSDA 2 + Lovie/Drum/CommArts 각1. 선 .0625em / opacity .2 | 정적 메타데이터 행 + 모션 실험실 링크. 행 축약은 제안 |
| 09 ReelOverlay | `#home-reel-video`, `#video-overlay`, `#video-overlay__mobile-close-btn` | video radius 12px; 닫기 버튼 원형 원본. 샘플 dialog 크기는 제안 | click→modal→user-initiated local play; controls/keyboard; close/Escape→pause→focus restore; failure 메시지 |
| 10 ClayIconButtons | `projects/choo_choo_world/video2.mp4`, 영상 시트5 첫 행 | 둥글게 부푼 노랑/파랑/하늘색 면, 반사광과 접지 그림자는 영상 관측. SVG 도형·66px 크기·CSS 그림자는 제안 | 각 버튼 aria-pressed 토글, hover, focus, 눌린 그림자. 원본 추출 SVG로 집계하지 않음 |
| 11 TeamInstrument | `#about-who-team-number`, compass/dots/indicator + 공개 `team.json` | 11 × 3 점, .125em square; 7명 실제 이름·역할; 긴 .75em / 짧은 .375em 눈금 | prev/next 순환, 001–007 표시, 진행률/이름 live update. 원본 얼굴 .buf 렌더링은 제외 |
| 12 ClientCarousel | `#about-clients-carousel`, 실제 `/assets/images/logo/*.svg` 15종 | 원본 3행 목록을 5개씩 3묶음으로 샘플 구성 | prev/next, 사용자 시작 auto/pause, reduced-motion 자동 시작 제한, 탭 비활성 시 정지 |
| 13 CapabilityCards | `.about-capability-card-front/-back`와 4개 공개 서비스 목록 | 원본 비율 314/438, border .8em, rotateY 앞뒷면, 실제 `cards/back.png` | 4개 버튼 각각 click/Enter/Space로 flip, aria-pressed, reduced-motion 즉시 면 전환 |

클레이 버튼은 [샘플 프레임](../screenshots/video-sheets/sheet-5.jpg)의 0.20/1.61/3.21초에서 관측된다. 재생 영상은 로컬 `sources/assets/lusion.dev/assets/projects/choo_choo_world/video2.mp4`를 사용한다.

## 가져다 쓰기

1. SVG는 각 심벌의 **SVG ↓**로 독립 파일을 받거나 **원본 복사**로 정확한 원문을 복사한다. 모든 발생 맥락은 **출처**를 펼쳐 확인한다.
2. 박스는 `components.html`의 해당 `#spec-*` 마크업과 `components.css`의 관련 클래스를 가져온다. 토큰 의존은 `tokens/lusion.css`, 로컬 인터랙션은 `components.js`에 있다. 패키지는 프레임워크와 새 의존성을 요구하지 않는다.
3. JS는 폼·dialog·그리드·테마·클레이 상태를 독립 이벤트로 연결한다. 이 파일 전체를 다른 앱에 사용할 때는 페이지 ID 계약을 유지하거나 필요한 이벤트만 옮긴다.
4. 브랜드 로고, Lusion 워드마크, 고객 상표와 일반적인 UI 도형의 용도를 구분한다. 본 문서는 자산 사용 권한을 확정하지 않는다.

## 검증 계약

- 추출 입력 페이지 수/해시, 인라인 발생 수, XML 파싱, 원문 해시/선택자 정합성을 확인한다.
- 갤러리는 HTTP와 `file://` 모두 작동하며 JSON fetch에 의존하지 않는다.
- 데스크톱·390px 모바일: 가로 overflow, SVG/이미지 로드, 검색/분류, 모달 포커스, Escape/복원, 폼 오류→성공, 19개 테마, grid toggle, clay toggle, video close/pause를 확인한다.
- `prefers-reduced-motion`에서는 전환과 이미지 확대를 끈다. 자동 애니메이션·자동 영상 시작이 없다.
- 원본의 모든 WebGL/폼 동작 검증이나 공식 내부 컴포넌트 라이브러리 확보를 뜻하지 않는다.

### 이번 구현의 실제 검증 결과

2026-09-06 Chromium / 1440×1000 및 390×844에서 확인했다.

- HTTP 및 file:// 갤러리 58개, 박스 13개 로드. JavaScript pageerror 0.
- SVG·프로젝트·클라이언트 이미지 64개 decode 성공, 실패 0. CSS 카드 뒷면은 별도의 로컬 PNG 경로를 사용한다.
- 인라인 발생 597개 모두 원본 DOM에서 선택자가 정확히 1개 요소를 가리킴. 모든 occurrence의 원문 슬라이스·raw 파일·SHA-256 일치, 불일치 0.
- 검색 `css-cross` 1건, 브랜드 분류 20건. 메뉴 Escape 후 closed / aria-expanded=false / 트리거 포커스 복원.
- 빈 이메일 invalid와 올바른 이메일 local success 확인. 테마 19개 전환, grid 숨김, clay pressed 확인.
- 팀 7회 순환 후 1/7 복귀. 로고 자동 넘김 1/3→2/3, 일시 정지, reduced-motion 시작 차단 확인. 서비스 카드 flip 확인.
- 영상 Escape 직후 paused=true. 모달 cancel/close 양쪽에서 정지 처리해 이벤트 시점에 따른 재생 누수를 방지한다.
- 모바일 document 너비 390px, 가로 넘침 없음. reduced-motion 전환 시간 0s.
