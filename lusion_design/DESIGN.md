# Design

## Source of truth

**Status: Active · v5 · 2026-09-10 · 대상: Lusion 공개 웹사이트를 근거로 한 참조 디자인 시스템. v5는 인터랙션·모션 계층을 추가했다.**

이 문서는 Lusion의 공식 내부 가이드가 아니라 공개 배포물과 브라우저 관측을 정리한 설계 계약이다. 원본 사이트를 통째로 실행시키는 복제 앱이 아닌, 디자인·개발·미디어 제작에 활용하는 자료 패키지다.

- 원본: [lusion.co](https://lusion.co/), [About](https://lusion.co/about), [Projects](https://lusion.co/projects).
- 공개 HTML: [sources/pages](sources/pages), CSS: [site.css](sources/site.css), JavaScript: [site.js](sources/site.js).
- 화면 근거: [screenshots](screenshots), [computed-desktop.json](research/computed-desktop.json), 네트워크: [network.json](research/network.json).
- 정확한 값: [CSS 근거](research/css-evidence.md), [인터랙션·모션 근거 원장](research/interaction-evidence.md), [CSS 토큰](tokens/lusion.css), [JSON 토큰](tokens/lusion.tokens.json).
- 공개 제작 설명: [공식 출처 조사](research/official-sources.md). 에셋별 URL·경로·크기·해시·실패: [manifest](research/asset-manifest.json).
- 미디어 제작: [이미지·영상·모션 제작 가이드](media/production-guide.md), [28개 영상 프레임 분석](media/video-analysis.md).

**증거 등급:** `추출`은 배포 코드의 실제 값, `관측`은 캡처 화면/네트워크 사실, `제안`은 재현 시스템을 위한 신규 결정, `미확인`은 공개 증거가 없는 정보다. 제안값을 원본 수치로 인용하지 않는다. 캡처는 소프트웨어 WebGL 환경이므로 장면 속도·성능을 원본 실기기 성능으로 해석하지 않는다.

## Brand

관측된 성격은 실험적, 조형적, 정교한 디지털 스튜디오다. 옅은 청회색 바탕과 검정 타이포그래피가 작품을 받치고, 선명한 파랑과 큰 3D 장면이 집중점을 만든다. 프로젝트 상세는 각 작품의 자체 팔레트로 전환한다.

신뢰는 작품명, 서비스 범위, 프로젝트 설명, 외부 공개 결과물, 공식 크레딧으로 만든다. 피해야 할 표현은 모든 구역에 장식 효과를 겹치는 구성, 의미 없는 네온, 작은 카드가 과도하게 반복되는 대시보드형 레이아웃이다. 이는 관측을 바탕으로 한 해석이다.

## Product goals

### v4 프로젝트 적용 기준

`kit/`는 이 계약의 재사용 구현 계층이다. 위에서 관측한 파랑·중성색·둥근 조작부·명확한 그리드를 의미 기반 `--ds-*` 토큰으로 연결한다. 소스 아카이브와 실행 데모는 참고 자료로 유지한다.

- 폴더를 다른 프로젝트로 복사해도 `sources/`, 수집 폰트, 원본 로고·영상, CDN에 의존하지 않고 동작한다.
- CSS는 `.ds-root` 범위에 적용하고 외부 문서의 `html`, `body`, 일반 버튼·입력 스타일을 바꾸지 않는다.
- 설치 단계와 런타임 의존성 없이 ES module로 가져오며, 테마·데이터·폼 전송은 적용 프로젝트가 소유한다.
- 탭·다이얼로그·알림·모션은 `mount(root)`로 초기화하고 `destroy()`로 정리한다. 두 개 이상의 루트와 반복 mount/unmount를 검증한다.
- 타입 선언, 의미 기반 토큰 JSON, 실제 마크업, 사용 명세와 독립 예제를 같은 버전으로 제공한다.


1. 원본에서 확인되는 시각 규칙과 미디어 구현 방식을 출처와 함께 찾을 수 있게 한다.
2. 디자이너는 그리드·타입·컴포넌트, 개발자는 토큰·상태·인터랙션, 제작자는 장면 브리프·프롬프트를 가져갈 수 있게 한다.
3. 실제 공개 파일과 신규 제안을 혼동하지 않게 한다.

완료 기준은 주요 연결 페이지 수집, 에셋 인벤토리, 대표 화면 캡처, 토큰과 컴포넌트 명세, 실행 가능한 제작 가이드, 로컬 열람 페이지다. 비공개 저장소·Blender/C4D 씬·편집 타임라인·원본 프롬프트 확보는 이 패키지로 증명할 수 없다.

## Personas and jobs

| 사용자 | 하려는 일 | 필요한 산출물 |
| --- | --- | --- |
| 디자이너 | 구조와 시각 문법을 새 브랜드에 적용 | 레이아웃, 타입 스케일, 컴포넌트 상태 |
| 프런트엔드 개발자 | DOM과 WebGL의 역할 및 토큰 연결 | CSS/JSON, 장면 계약, 성능과 접근성 대체 상태 |
| 3D/모션 제작자 | 장면을 실제 자산으로 제작 | 미디어 명세, 카메라·재질·광원, 출력 포맷 |
| 크리에이티브 디렉터 | 원본 방식과 생성형 대안을 비교 | 근거 등급, 공식 사례, 검수 기준 |

## Information architecture

### 프로젝트 적용 · v4

- `project-kit.html`: 컴포넌트 선택 → 상태/테마 조작 → 실제 사용할 마크업·초기화 코드 복사 → 작은 프로젝트 패키지 다운로드. v5에서 인터랙션 레시피 8종이 추가됐다.
- `kit/examples/home.html`: 인터랙션·모션 패턴을 한 화면에 모은 메인 화면 예제. 이미지·영상 없음.
- `kit/examples/index.html`: 패키지 안에서 독립 실행되는 프로젝트 화면 예제.
- `kit/README.md`: 파일 가져오기, 토큰 덮어쓰기, 런타임 API, framework mount/unmount, 업그레이드 기준.
- `kit/package.json`: 버전·ES module 진입점·CSS·타입 선언의 공개 경로. 공개 레지스트리에 배포하지 않고 로컬로 전달한다.


### 로컬 소스 열람 흐름 · v3

- `index.html`: 작업물 진입점. 첫 화면에서 소스 탐색과 재구성 예제로 이동한다.
- `source-explorer.html`: 검색 → 유형/출처 필터 → 파일 선택 → 미리보기·코드·다운로드. 원본 HTML/JS는 코드로 읽으며 자동 실행하지 않는다.
- `reconstruction.html`: 공개 원본으로 확보할 수 없는 효과를 근거와 함께 재구성한 실행 예제. 원본 근거, 구현 코드, 재현 범위가 같은 화면에 있다.
- `components.html`, `motion-lab.html`, `video-analysis.html`: 기존 컴포넌트·모션·영상 분석을 보존하고 소스 탐색으로 연결한다.
- `source-index.js`가 파일 목록의 기준이다. 공개 배포 파일, 번들에서 분리한 코드, 독립 재구성의 수치를 섞어 수집량을 부풀리지 않는다.
- 바이너리는 형식·크기·출처와 확인된 구조를 표시한다. 읽을 수 없는 파일에 가짜 원본 코드를 표시하지 않는다.

### 공개 원본의 구조

- `/`: 3D 히어로 → 스튜디오 소개/릴 → Featured Work → 추가 스토리/공간 연출 → 연락·뉴스레터 → 다음 페이지 전환.
- `/about`: 소개·실시간 장면·팀 및 스튜디오 정보.
- `/projects`: 큰 목록 제목, 프로젝트 수, 2열 프로젝트 카드.
- `/projects/{slug}`: 작품별 팔레트, 제목·설명·서비스·외부 링크, 이미지/영상 갤러리, 다음 프로젝트.
- 글로벌 메뉴: Home / About us / Projects / Contact / Labs. Contact는 홈의 연락 영역으로 연결되는 액션이고 Labs는 별도 사이트다.

전체 발견 경로는 [페이지 목록](research/pages.md), 카드/상세 미디어 메타데이터는 [프로젝트 레지스트리](research/projects.json)에 둔다. Labs와 외부 클라이언트 사이트는 링크만 기록하며 연결된 인터넷 전체를 크롤링하지 않는다.

## Design principles

- **정적 UI 위에 선택적으로 움직이는 장면:** 내비게이션과 본문은 DOM, 볼륨·조명·깊이는 WebGL/영상이 담당한다.
- **큰 작품, 적은 장식:** 한 화면의 주된 시각 초점은 장면 하나 또는 큰 제목 하나다.
- **장면과 텍스트의 대비:** 배경 미디어 위 작은 본문보다 별도의 여백에 읽기 영역을 둔다.
- **공통 구조와 작품별 테마:** 그리드/버튼/타이포는 공유하되 상세 배경·강조색은 프로젝트 데이터로 바꾼다.
- **제작 방식은 목적에 맞게:** 모든 콘텐츠에 실시간 3D를 쓰지 않는다. 깊이 맵, 프리렌더 영상, 실시간 장면을 구분한다.

## Visual language

### Color

다음은 실제 `:root` 추출값이며 이름 자체가 모든 화면의 사용 비중을 뜻하지는 않는다.

| 토큰 | 값 | 적용 해석 |
| --- | --- | --- |
| `--color-off-white` | `#f0f1fa` | 주요 밝은 면 |
| `--color-white` | `#fff` | 버튼/대비 면 |
| `--color-dark-white` | `#e4e6ef` | 약한 컨트롤 면 |
| `--color-black` | `#000000` | 본문·큰 제목 |
| `--color-blue` | `#1a2ffb` | 선명한 장면 강조 |
| `--color-grey-blue` | `#2b2e3a` | 어두운 CTA 면 |
| `--color-green` | `#c1ff00` | 보조 팔레트, 기본 강조로 과용하지 않음 |
| `--color-red` / `--color-error` | `#ff4c41` / `#e90000` | 빨강 계열 / 오류 토큰 |
| `--color-dark-blue` / `--color-purple` | `#071bdf` / `#8832f7` | 장면·테마 보조 |

추출 CSS에 있는 디버그 UI 색상이나 프로젝트별 로컬 색상을 전역 브랜드 팔레트로 승격하지 않는다. Porsche 상세의 `#EFD5D3` 배경과 `#621422` 강조색은 HTML `data-color-*` 근거가 있는 프로젝트 테마다.

### Typography

`Aeonik` 400/500 및 400 italic, `IBMPlexMono` 400/500, `LusionMono` 400가 `@font-face`에 선언된다. 기본 HTML·제목·버튼·입력은 Aeonik 400이다. 폰트 파일이 공개 전송된다는 사실과 새 서비스에서의 사용 권한은 별개이며, 한국어 글리프 커버리지는 확인하지 않았다. 한국어 문서와 샘플에는 시스템 sans-serif 대체를 허용한다.

실제 클래스: `.text-xs: .75em`, `.text-base: clamp(1rem,1.5vw,2rem)`, `.text-lg: 1.75em`, `.text-4xl: clamp(7em,8vw,20em)`. 812px 이하에서 각각 base `.875em`, lg `1.5em`, 4xl `13vw`가 적용된다. 컴포넌트별 별도 크기가 있으므로 이 4개만으로 모든 제목을 설명하지 않는다.

### Spacing / shape

데스크톱 `.section`은 12열, gap `2vw`, 좌우 `max(5vw,40px)`, 세로 `clamp(30px,4vw,50px)`. 1440px에서는 좌우 72px, gap 28.8px이다. 모서리는 20px, 모바일에서는 뒤에 선언된 규칙이 이겨 최종 10px이다. 버튼은 알약 모양, 작은 점·플러스·대각 화살표가 반복된다. 8px 기반 고정 spacing scale는 원본에서 추출된 규칙이 아니다.

### Motion / imagery

3D 히어로의 둥근 십자형 오브젝트, 크림/검정/파랑 재질, 소개 구간의 곡선, 이미지+깊이 맵을 사용하는 작품 카드, 프리렌더 릴 영상이 확인된다. 실제 엔진과 자산 연결은 [motion-system.md](media/motion-system.md), 새 제작 프롬프트는 [production-guide.md](media/production-guide.md)를 따른다.

## Motion & interaction

v5의 인터랙션 계약이다. 수치는 [인터랙션·모션 근거 원장](research/interaction-evidence.md)에서 추출/제안 등급으로 구분했고, 구현은 `kit/tokens.css`, `kit/components.css`, `kit/system.js`가 소유한다. 이미지·영상 없이도 성립하는 규칙만 다룬다.

### 원칙

- **transform·opacity만 움직인다.** 레이아웃 속성은 전환하지 않는다. 큰 변위(마스크 등장, 단어 등장)는 `overflow: hidden` 래퍼 안에서 일어난다.
- **두 개의 곡선.** UI 상태 전환은 `standard` `cubic-bezier(.4,0,.1,1)`, 확산·밑줄·스왑·진입은 `smooth` `cubic-bezier(.35,0,0,1)`(원본 JS의 `ease.lusion`). 나머지 곡선은 보조다.
- **포인터는 동역학으로 따라간다.** 마그네틱·틸트·커서는 CSS transition이 아니라 2차 동역학(주파수·감쇠비·응답)으로 감쇠한다. 프레임 dt 상한은 1/20s.
- **순서가 의미다.** 패널은 20ms 간격으로 열고 역순으로 닫는다. 단어·그룹은 40ms 간격이다.
- **장식은 언제나 꺼질 수 있다.** `prefers-reduced-motion`, `mount(root,{motion:false})`, 터치 입력에서는 즉시 정적 상태가 되고, `destroy()`는 DOM을 원복한다.

### 토큰

| 토큰 | 값 | 등급 | 용도 |
| --- | --- | --- | --- |
| `--ds-motion-instant` … `--ds-motion-line` | 100 / 200 / 300 / 400 / 500 / 600ms | 추출 | 점 축소 → 화살표 → 밑줄·라벨 → 스왑·회전 → 패널·CTA 배경 → 밑줄(푸터)·단어 등장 |
| `--ds-motion-loop` | 3000ms | 추출 | 화살표·텍스트 루프 힌트 |
| `--ds-stagger` / `--ds-stagger-word` | 20ms / 40ms | 추출 / 제안 | 패널 항목 / 단어·그룹 |
| `--ds-ease`, `--ds-ease-smooth`, `--ds-ease-enter`, `--ds-ease-out`, `--ds-ease-loop` | 원본 5개 곡선 | 추출 | 위 원칙 참고 |
| `--ds-ease-expo` | `cubic-bezier(.19,1,.22,1)` | 제안 | JS `expoOut`의 CSS 근사 |
| `--ds-rise` / `--ds-rise-tilt` | `1.5em` / `15deg` | 추출 | 단어 등장 초기 변위·기울기 |
| `--ds-panel-rise` / `--ds-panel-tilt` | `5.5em` / `3.5deg` | 추출 | 메뉴 패널 항목 초기 상태 |
| `--ds-burst` | 20 | 추출 | CTA 점 확산 배율(원본 20·26·32 중 기본) |
| 동역학 프리셋 `pointer`·`cursor`·`focus`·`zoom`·`snap`·`drift`·`rotate` | f/z/r 7종 | 추출 | `dynamicsPresets`, JSON `motion.dynamics` |

### 패턴

| 패턴 | 구현 | 상태 |
| --- | --- | --- |
| 등장 | `data-ds-reveal` `rise`·`fade`·`scale`·`mask`·`line`; `data-ds-split` `words`·`chars`; `data-ds-stagger` | ready → visible; 지나친 요소도 visible; `replay()`로 재실행 |
| 메뉴 패널 | `[data-ds-panel]` + 토글, `.ds-menu-link`(텍스트 스왑·점·배경 pill·화살표), `.ds-backdrop` | closed(inert) ↔ open; Escape·배경 클릭·닫기 버튼; 포커스 복귀 |
| CTA | `.ds-cta`(점 확산·라벨 이동·화살표 진입·배경 지연), `.ds-talk`, `.ds-dots` | idle / hover·focus-visible / `data-active` |
| 링크 | `.ds-swap`, `.ds-link`(`--slow`, `--static`), `.ds-icon-swap` | hover와 focus-visible 동일 반응 |
| 포인터 | `data-ds-magnetic`(snap), `data-ds-tilt`(drift, 레이어 깊이), `data-ds-cursor`(pointer, 속도 늘림) | active → 감쇠 후 inline 값 제거; 터치·감소 모션 비활성 |
| 진행·힌트 | `.ds-bar`(`--ds-progress`), `data-ds-scroll-progress`(damp λ=10, 0.5s 후 idle), `.ds-loop`, `.ds-cross` | scrolling ↔ idle |
| 로더 | 예제 `home.js`: `ease.expoOut` 1.2s 카운트 → `.5s` smooth 숨김; 세션 재방문·감소 모션에서 생략 | loading → done / skipped |

### 메인 화면 예제

[kit/examples/home.html](kit/examples/home.html)은 위 패턴을 한 화면에 배치한 참조 구현이다. 3D 장면과 영상 대신 CSS 도형(십자 오브젝트, 구, 블롭)과 그라데이션을 쓰며, 원본의 WebGL·깊이 맵·ScreenPaint를 복원하지 않는다. 검증 결과는 [home-motion-v5.json](research/home-motion-v5.json), [verification-v5.md](research/verification-v5.md).

## Components

v4 재사용 컴포넌트는 `kit/components.css`와 `kit/system.js`를 기준으로 한다. `.ds-button`, 입력/필드/오류, 카드, 배지, 탭, 네이티브 아코디언, 다이얼로그, 알림, 진행률, 그리드·스택을 제공한다. v5는 `.ds-cta`, `.ds-talk`, `.ds-menu-link`, `.ds-swap`, `.ds-link`, `.ds-icon-swap`, `.ds-dots`, `.ds-loop`, `.ds-cross`, `.ds-bar`, `.ds-cursor`, `.ds-flip`, `.ds-zoom`, `.ds-panel`을 더했다. 기본/포커스/비활성/진행중/오류 상태를 사용 예제와 함께 제공한다. 아카이브의 클래스명과 런타임을 그대로 가져오지 않는다.


v2에서 문서형 설명을 실제 동작 페이지로 확장했다. [컴포넌트 라이브러리](components.html)는 인라인 SVG·CSS 기호·박스/입력/메뉴/카드 상태를, [모션 실험실](motion-lab.html)은 WebGL/Canvas/DOM 재현을, [영상 분석](video-analysis.html)은 영상 28개·시간 검증 프레임 84개와 예상 제작 방식을 제공한다. 전체 수집과 재현의 커버리지는 [추가 감사](research/coverage-v2.md), [아이콘 원장](research/icon-manifest.json), [재현 명세](media/reconstruction-spec.md)로 확인한다.

사용자의 추가 지시에 따라 미공개 영역은 중단 사유가 아니라 **근거를 명시한 구현 추정**으로 다룬다. 원본에서 보이는 결과와 유사한 입력/시각 결과를 목표로 하며 원본의 물리·광학·셰이더가 그대로 복원됐다고 주장하지 않는다.

| 컴포넌트 | 구조와 변형 | 상태 / 재현 규칙 |
| --- | --- | --- |
| GlobalHeader | 워드마크, 사운드, Let's talk, Menu | 고정 위치; 밝은/어두운/작품별 테마; 모바일에서는 제한된 폭에 재배치 |
| PillButton | 라벨 + 점 또는 화살표; 밝은/어두운 면 | hover·focus-visible·pressed·disabled를 별도로 구현 제안 |
| MenuPanel | 큰 링크, 뉴스레터, Contact/Labs | open/closed; 재현 시 focus trap, Escape, 트리거로 포커스 복원 |
| SceneFrame | 둥근 사각형에 DOM과 3D 장면 정렬 | loading/ready/paused/fallback; 텍스트는 별도 DOM |
| EditorialSection | 큰 제목 + 비대칭 본문/미디어 | 모바일 한 열; 긴 한국어 제목의 줄바꿈 확인 |
| ProjectCard | 작품 이미지, 깊이 맵, 제목, 태그 | idle/hover/focus; touch에서는 정적 이미지로도 이동 가능 |
| ProjectDetail | 작품별 팔레트 + 설명 + 서비스 + 갤러리 | image/video/fullscreen 메타데이터; 정확한 비율 유지 |
| ReelPlayer | 포스터, 인라인 루프, 확대 플레이어 | muted preview → 사용자 재생; 오류/닫기/키보드 제어 |
| ContactFooter | 대형 CTA, 메일, 소셜, 이메일 폼 | invalid/submitting/success/failure 필요; 폼 제출은 이번 조사에서 실행하지 않음 |
| ScrollNext | 다음 페이지 라벨·진행 바·화살표 | 스크롤 연출과 일반 링크를 함께 제공하는 방식 권장 |

토큰은 `tokens/`가 소유하며 컴포넌트가 임의로 전역 값을 중복 정의하지 않는다. 실제 원본 컴포넌트 마크업은 수집 HTML, 신규 상태/접근성 규칙은 이 문서가 소유한다.

## Accessibility

v3 탐색 목록은 실제 버튼/링크, 명시적 검색 레이블, 선택 상태, 결과 수 안내를 사용한다. 복사 성공/실패를 알리고 포커스를 유지한다. 새 재구성 예제는 일시정지·초기화 및 키보드 조작을 제공하고 시스템 모션 감소 설정을 따른다.

재현물 목표는 WCAG 2.2 AA로 제안한다. 원본 준수 판정은 수행하지 않았다. 공개 CSS의 `*:focus{outline:0}`와 HTML의 줌 제한 viewport를 그대로 가져오지 않는다.

- 모든 버튼과 링크에 보이는 키보드 포커스, 접근 가능한 이름, 논리적인 탭 순서.
- 장면만으로 정보 전달하지 않으며 포스터·본문·링크가 계속 사용 가능해야 한다.
- `prefers-reduced-motion`에서는 카메라 이동·시차·글자 분할·자동 다음 페이지 전환을 끄고 정적 상태를 제공한다.
- 자동 영상은 음소거, 멈춤 제어 제공. 긴 영상을 사용자 액션 없이 소리와 함께 재생하지 않는다.
- 모바일 확대 허용. 컨트롤 터치 크기 44px 목표는 신규 권장값이다.
- 작품별 배경과 텍스트 조합의 대비는 별도 검증해야 한다.

## Responsive behavior

소스 탐색은 데스크톱에서 목록과 상세를 함께 보고, 모바일에서는 선택 후 상세로 이동하고 목록으로 돌아갈 수 있게 한다. 390px뿐 아니라 320px·812px·1000px에서도 문서의 가로 넘침을 검사한다. 파일 경로는 줄바꿈하고 코드는 독립 가로 스크롤을 제공한다. 조작부는 최소 44px 터치 영역을 확보한다.

| 조건 | 공개 코드에서 확인한 변경 |
| --- | --- |
| 기본 | 12열 / gap 2vw / radius 20px |
| ≤812px | 6열 / gap 4vw / radius 최종 10px / 좌우·세로 padding 25px |
| ≤400px | 좌우·세로 padding 15px |
| ≤380px | header size `clamp(.75rem,1vw,2rem)` |
| 화면비 ≥21:9 | 좌우 `max(6vw,60px)`; HTML/body 폰트 `.6em` |

원본에는 480/560/1000/1200/1600px 등의 개별 규칙도 있으므로 전체 CSS 근거 목록을 참고한다. JS `MOBILE_WIDTH=812`, `IS_SMALL_SCREEN`의 820 기준은 다른 판정이며 혼동하지 않는다. 캡처한 기준 viewport는 1440×1000, 390×844이다.

## Interaction states

v3 소스 탐색은 로딩 중, 검색 결과 없음, 읽기 실패, 큰 파일의 일부 표시, 선택 없음 상태를 제공한다. `file://`에서 브라우저가 코드 읽기를 차단하면 파일 다운로드와 로컬 HTTP 실행 안내를 보여준다. 다른 파일 선택 시 이전 요청 결과가 덮어쓰지 않게 한다. 미디어는 선택 후에만 로드하고 선택을 바꾸면 재생을 중단한다.

`boot → assets loading → ready`를 기본으로, 자산 오류나 GPU 미지원은 `fallback`으로 이동하도록 제안한다. 포스터부터 보여준 후 장면이 준비되면 교체한다. 퍼센트 로더는 공개 화면에서 관측됐다. 캡처 중 로딩·전환 화면도 남아 있으므로 파일명/검증 문서에 정상 정착 화면과 구분한다.

빈 프로젝트 목록, 오프라인, 느린 네트워크, 뉴스레터 오류, disabled 상태는 원본 동작 검증 범위 밖이다. 구현 시 레이아웃을 유지한 오류 문구·재시도·기본 탐색을 제공한다. 외부 사이트 폼은 전송하지 않았다.

## Content voice

짧고 자신감 있는 라벨, 큰 제목과 비교적 담백한 본문. 작품을 기술 태그와 실제 결과로 설명한다. 한국어 적용 시 추상적인 수식어보다 무엇을 만들고 어떤 동작을 하는지 적는다. 원본 카피는 수집 근거로 보존하되 신규 브랜드 문구는 별도로 작성한다.

## Implementation constraints

프로젝트 키트는 외부 의존성·수집 에셋 없이 작동한다. 기본 폰트는 OS 시스템 스택이며 적용 프로젝트가 `--ds-font-sans`를 덮어쓸 수 있다. JSON/CSS 토큰이 어긋나지 않게 검사한다. ES module은 import 시 DOM에 접근하지 않는다. 새 페이지로 화면 전환 시 `destroy()`를 호출해야 한다. 시작 예제는 로컬 HTTP로 실행한다. 패키지를 임시 폴더로 실제 풀어 파일 경로와 브라우저 동작을 검사한다.


v2 추가 공식 증거: `Of The Oak` 상세의 텍스트 갤러리에 Houdini→WebGL 및 instancing 설명이 있고, `Worldcoin`은 절차적 점 위치와 이미지 기반 데이터 디코딩을 설명한다. 이는 해당 프로젝트에서 확인된 방식이다. 첫 수집에서 누락됐던 설명 패널 2개를 `projects.json.text_panels`에 보존했다.

- 수집물에서 `_astro` 경로가 관측되고 JavaScript에는 Three.js `REVISION="158"`이 있다. 이는 배포물 근거이며 비공개 빌드 설정 전체를 확인한 것은 아니다.
- 원본은 `lusion.co`에서 `https://lusion.dev`를 자산 CDN으로 설정한다. CDN 의존성을 manifest에 함께 기록한다.
- `DPR=Math.min(1.5,devicePixelRatio)`, `MAX_PIXEL_COUNT=2560*1440`이 선언되지만 후자는 `USE_PIXEL_LIMIT` 분기의 실제 활성 여부와 구별한다.
- `.buf`는 배포용 사용자 정의 데이터다. `.blend/.c4d/.fbx` 원본으로 취급하거나 확장자만 `.glb`로 바꾸지 않는다.
- 배포 JS와 HTML에는 오디오·외부 플레이어·계측·폼 코드가 포함되므로 열람기는 원본 번들을 실행하지 않는다.
- 로컬 열람기는 의존성 없는 HTML/CSS/JS다. 설치 없이 파일로 열거나 `python3 -m http.server 4173`으로 확인한다.
- 파일 해시, 내부 링크, JSON 파싱, 로컬 페이지의 데스크톱/모바일 렌더링과 콘솔 오류로 패키지를 검증한다. 원본 사이트의 전체 기능 e2e 테스트 완료를 의미하지 않는다.

## Studio shell

열람기 8개 화면(`index.html`, `lusion.html`, `project-kit.html`, `source-explorer.html`, `components.html`, `motion-lab.html`, `reconstruction.html`, `video-analysis.html`)은 공통 스튜디오 셸 규격 [`../All/shell/SPEC.md`](../All/shell/SPEC.md)을 따른다. 뼈대는 `studio-shell.css`(레이아웃·치수)와 `studio-shell.js`(모바일 내비·브레드크럼·토스트)가 담당하며 두 파일은 규격 원본의 사본이므로 이 폴더에서 고치지 않는다.

- 좌측 232px 사이드바에 브랜드 마크와 `WORKSPACE` 내비(7개 화면, 01~07 번호, 현재 화면 `aria-current="page"`)를, 하단에 수집 상태와 원본 사이트 링크를 둔다. 기존 가로 탭 바(`.workspace-nav`)가 이 사이드바로 대체됐다.
- 상단바(65px)에는 브레드크럼 `Design system / {현재 화면}`, 각 화면의 검색 입력, `Export tokens ↧`([tokens/lusion.css](tokens/lusion.css)) 순으로 배치한다. 각 화면의 2단 서브탭은 본문 안 `.as-view-tabs`로 옮겼다.
- 브랜드 색·서체는 `studio-brand.css`에서 `--as-*` 변수로만 매핑한다(Aeonik/IBMPlexMono, `--color-blue` `#1a2ffb`, `--color-off-white` `#f0f1fa`). 셸의 치수·간격·타입 크기는 바꾸지 않는다.
- 기존 텍스트·링크·id·`data-*`·이벤트 대상 요소는 그대로 두고 감싸는 요소와 위치만 바꿨다. `../All/shell/inventory.py`의 전후 비교로 누락 0을 확인한다.

## Open questions

- [ ] 실제 사내 디자인 원본/3D 씬/영상 편집 타임라인/생성형 도구 사용 여부 — 소유자 Lusion; 원본 제작 프로세스의 완전 복구에 영향.
- [ ] 자산·브랜드·폰트의 다른 서비스 사용 범위 — 소유자 해당 권리자; 이 수집만으로 허가 여부 확정 불가.
- [ ] 적용할 신규 브랜드와 한국어 폰트 — 소유자 후속 구현 담당; 재현용 제안 토큰에 영향.
- [ ] 실제 모바일 GPU 성능, 전체 접근성, 모든 외부 영상 플레이어 상태 — 후속 QA; 현재 소프트웨어 WebGL 샘플을 넘어서는 검증 필요.
