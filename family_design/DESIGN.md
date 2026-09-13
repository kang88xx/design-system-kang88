# Design

## Source of truth

**Status: Active — V4 프로젝트 적용 키트 1.0.0 + 전체 소스 탐색·대체 구현.** 2026-09-07. 대상은 Family의 공개 마케팅 웹사이트이며, 네이티브 iOS 앱 전체 디자인 시스템을 역공학한 결과는 아니다.

요청한 [Recent / Family](https://recent.design/i/p1lu7hn-family)의 46.85초 영상을 확보하고, 연결된 [family.co](https://family.co/)의 현재 데스크톱·모바일 화면과 CSS/DOM을 함께 분석했다. 기존 작업 디렉터리에는 앱이나 디자인 문서가 없었다.

**이 문서가 디자인 명세의 기준이며, `tokens.json` / `tokens.css`는 기계가 읽는 추출값, `index.html`은 열람·상태 확인용 문서이다.** 열람 페이지 자체의 여백·사이드바·레이아웃은 문서용 구성이고 원본 Family 화면의 복제가 아니다.

### V4 프로젝트 적용 계약

`design-system/tokens.json`은 프로젝트용 토큰의 기준이고 `design-system/tokens.css`는 생성 파일이다. 루트의 원본 추출 토큰은 그대로 보존한다. `system.html`은 실제 적용 가이드이며 `design-system/examples/starter.html`은 다른 저장소로 복사해도 동작하는 실행 예제다. 원본 관찰 규칙과 아래 프로젝트 키트의 보완 규칙은 서로 다른 범위다.

- 설치 단위: `family-project-kit.zip` 또는 로컬 npm 아카이브 `family-design-system-1.0.0.tgz`. 패키지명 `@family-design/system`, ESM + TypeScript 선언, 외부 런타임 의존성 없음.
- 스타일 범위: `.fds`와 `fds-*` 클래스. 호스트의 전역 요소 스타일을 덮지 않는다. `.fds`의 `data-fds-theme="light|dark"`로 테마를 선택한다.
- 공개 시맨틱 변수: `--fds-bg`, `--fds-surface`, `--fds-text`, `--fds-text-muted`, `--fds-border`, `--fds-focus`, `--fds-primary`, `--fds-on-primary` 및 secondary/danger/status 변수. 컴포넌트가 이 변수를 직접 사용한다.
- 따뜻한 중립색, 큰 둥근 버튼과 카드, 넉넉한 여백을 유지한다. 읽기·입력 경계·상태·포커스 대비는 적용용 시맨틱 색으로 보완한다. 다크 테마는 새로 설계한 대체안이며 원본에서 추출한 앱 테마가 아니다.
- 버튼·폼·카드·안내·로딩·배치 CSS와 탭·네이티브 details 아코디언·네이티브 dialog·링크 disclosure를 제공한다. 키트 아코디언은 가벼운 기본 동작을 제공하며 기존 카탈로그의 원본 spring FAQ는 별도 보존한다.
- `initFamilySystem(root)`가 동작을 등록하고 `destroy()`가 소유한 이벤트·상태를 정리한다. 탭 그룹과 중첩 root를 구분하며, dialog 열기 버튼과 대상은 같은 초기화 영역에 둔다.
- 탭은 수동 활성화(화살표 포커스, Enter/Space 선택), 대화상자는 Escape·포커스 복귀, disclosure는 외부 클릭·포커스 이탈 닫기를 제공한다. 폼 제출·검증·저장은 소비 프로젝트가 소유한다.
- 키트에 원본 브랜드 폰트·로고·이미지·영상·공개 번들을 넣지 않는다. 시스템 폰트와 작성한 코드만으로 렌더링한다. 원본·파생·대체 파일의 출처는 전체 카탈로그에 남긴다.
- 적용 가이드는 데스크톱 2열, 모바일 단일열로 재배치한다. 320/390/768/1440px와 라이트/다크를 실제 브라우저로 검사한다. 모션 감소 설정에서 반복 장식을 정지한다.
- 검증 근거: `references/v4-review/`의 runtime/UI/collector/package/isolated-kit 결과와 화면 캡처. 독립 npm 설치·엄격한 TypeScript 소비자·복사한 키트의 HTTP 실행을 검사한다. React/Vue 예제는 연결 패턴이며 특정 제품 프로젝트 통합을 검증했다는 뜻이 아니다.

생성 순서는 토큰 → 적용 가이드 → 카탈로그 → 소형 ZIP/npm 키트 → 최종 소스 재색인 → 무결성 검사 → 전체 ZIP이다. 패키지·소스 변경 후 재색인을 생략하지 않는다. 토큰 생성기는 키트 안의 `tools/build-tokens.py`를 사용하며 `--check`로 생성 상태와 대비·별칭을 검증한다.

### 근거 등급

| 표기 | 의미 | 신뢰 범위 |
| --- | --- | --- |
| CSS | 현재 사이트 스타일 선언을 직접 추출 | 선언값은 정확. 해당 값이 과거 영상에도 같았다는 뜻은 아님 |
| LIVE | 현재 렌더링된 DOM/computed style/스크린샷 | 기록한 뷰포트·상태에 한정 |
| VIDEO | 제공된 페이지의 녹화에서 관찰 | 압축·스크롤·60fps 및 프레임 샘플링 오차 포함 |
| BUNDLE | 현재 Family가 공개 전달한 해시된 JavaScript 번들 | 해당 번들의 숫자·trigger·state machine은 정확. 2023 Recent 녹화와 완전히 같은 릴리스라는 뜻은 아님 |
| 제안 | 재사용을 위해 만든 이름, 보완 상태, 구현 규칙 | 원본 구현이라고 주장하지 않음 |

### 소스 인덱스

- [Recent 페이지 캡처](references/recent-page.png), [API 응답](references/recent-api.jsonl): 원본 사이트와 영상 연결 확인.
- [녹화 MP4](references/family-recording.mp4), [메타데이터](references/video-metadata.json): 1080×676, 60fps, 2,811 frames, 46.85s, 오디오 트랙 없음.
- [전체 콘택트 시트](references/contact-sheet.png): `fps=1/2`로 샘플한 순서별 화면. 프레임 번호를 정확한 초 단위 타임스탬프로 취급하지 않는다.
- [현재 desktop](references/live-desktop.png): 1440×1000 viewport, 전체 페이지 높이 11,367px. [현재 mobile](references/live-mobile.png): 390×844 viewport.
- [원본 CSS](references/live-styles.css), [HTML](references/live-source.html), [desktop DOM](references/live-desktop.json), [mobile DOM](references/live-mobile.json).
- [스타일 발췌](references/live-style-excerpts.md), [실제 사이트 관찰](references/live-report.md), [모션 관찰과 정밀 프레임](references/motion-report.md).
- [에셋 출처 목록](references/assets-manifest.json): 문서 미리보기에 사용한 폰트와 장식 이미지의 원본 URL.
- **V2 source-backed motion:** [공개 번들 복구 보고서](references/v2-research/motion-source-report.md), [페이지 chunk](references/v2-research/bundles/7087-0908057adee7ff82.js), [accordion chunk](references/v2-research/bundles/index-9c94e1d3d027443f.js), [CTA chunk](references/v2-research/bundles/861-4bee4940f7ae3785.js). `motion-source-tokens.json`은 이 수치를 UI 구현에서 재사용할 때의 machine-readable 보조 토큰이다.

### 버전 차이

| 구간 | Recent 영상 | 현재 사이트 |
| --- | --- | --- |
| Hero | Your crypto. Family style. | Your favorite crypto wallet. |
| CTA | 이메일 + Join Waitlist | Download on iOS / Get Started / Log In |
| Developers | ConnectKit / API 계열 과거 항목 | ConnectKit / Family account |
| 소식 | ConnectKit 1.4.0 / 1.3.0 | 더 최근 게시물 |
| 형태 | 따뜻한 라이트 UI, 장식 도형, 폰 데모 | 같은 시각 언어가 유지되지만 카피·일부 구조 변경 |

영상 화면을 우선 참조하되 정확한 수치는 **현재 CSS 또는 BUNDLE에서 추출한 값**으로 표시한다. 과거 픽셀 HEX·과거 폰트 크기를 현재 값으로 소급 확정하지 않는다.

### V1 → V2 모션 근거 전환

V1 문서의 Hero/footer 반복 주기 미확정, Hero 단순 fade-up, FAQ 약 300ms 같은 VIDEO 추정은 삭제하지 않고 역사적 관찰로 남긴다. **동일 항목을 구현할 때에는 아래 V2 BUNDLE 수치가 우선한다.** 단, Recent 영상은 2023 캡처이고 번들은 2026-09-06에 얻은 현재 공개 build이므로 V2가 “과거 녹화의 byte-for-byte 구현”을 증명하지는 않는다.

| 항목 | V1 기록 | V2 적용 기준 |
| --- | --- | --- |
| Hero ornament | 0.6–1.0s scatter/fade, loop 미확정 | draggable ornament group, 40px scatter, `.2s` child delay + `.05s` stagger, 4/800/80 spring, 2–3s mirror drift (BUNDLE) |
| Footer CTA | Hero와 유사한 장식/반복으로 관찰 | 별도 CTA illustration: `useInView({once:true,amount:.25})`, `.025s` stagger, 4/800/80 spring (BUNDLE) |
| FAQ | 약 300ms 높이/opacity, JS easing 미확정 | exclusive accordion + 세 개의 확인된 spring (BUNDLE) |
| Explore / Details | 영상에서 내부 상태만 관찰 | 각 2s/1.75s state machine과 tween/spring 수치 (BUNDLE) |

## Brand

**관찰:** 넓은 화이트 공간, 약간 따뜻한 회색, 부드러운 산세리프, 손으로 오린 듯한 도형, 포화도가 높은 색, 큰 스마트폰 데모가 반복된다. 금융·지갑 기능을 친근하고 손쉬운 경험으로 설명한다.

- 성격: 친근함, 명료함, 장난스러움, 디테일에 대한 자신감.
- 시각적 신뢰 장치: 실제 기능을 보여주는 제품 데모, 짧은 기능 설명, 보안 섹션, FAQ, 사용자 후기.
- 피할 것: 화면 전체를 채우는 네온/그라디언트, 과도한 유리 효과, 모든 카드의 부유 모션, 장문의 영업 문구.
- 로고는 작고 일정하게 유지한다. 생동감은 별도 장식과 제품 데모에 맡긴다.

## Product goals

V3 열람 도구의 우선 목표는 수집된 모든 공개 디자인 자료를 검색하고, 원본/추출/파생/대체 코드의 차이를 확인한 뒤 다운로드하는 것이다. 현재 랜딩 페이지와 과거 제공 영상에서 관찰한 구조를 기준으로 한다. 공개되지 않은 앱 저장소나 연결된 모든 서비스의 코드를 확보했다는 의미는 아니다.

**추론한 목적:** 지갑 기능을 이해시키고 가입/다운로드로 연결하는 공개 랜딩 페이지.

- 주요 목표: 기능 탐색 → 편의성·보안 이해 → FAQ 확인 → CTA.
- 디자인 시스템 산출물 목표: 색상과 타이포그래피를 코드로 재사용하고, 정적 스타일과 인터랙션·영상 동작을 구분하여 전달한다.
- 비목표: 지갑 백엔드, 인증·거래 실행, iOS 앱 모든 화면 재현, 원본 사이트 변경.
- 완료 기준: 출처와 버전 차이가 명시되고, 핵심 섹션/컴포넌트/모션이 기록되며, CSS·JSON·열람 페이지가 일관된 값을 사용한다.

## Personas and jobs

아래는 카피와 화면 구성에 근거한 추론이며 사용자 연구 결과는 아니다.

| 사용자 | 할 일 | 지원하는 화면 |
| --- | --- | --- |
| 신규 지갑 사용자 | 보내기·받기·교환 기능이 쉬운지 판단 | Hero, Easy 카드, 3개 폰 데모 |
| NFT 보유자 | 미디어/컬렉션 표시 방식 확인 | NFT split feature |
| 여러 지갑을 관리하는 사용자 | 감시·활동·그룹화 이해 | Watch, Activity, Mission Control, Details |
| 개발자 | 연동 도구와 문서 접근 | Developers dropdown |

## Information architecture

### V3 소스 열람 흐름

Overview → 전체 Source browser → 파일 종류/출처 필터 및 검색 → 미리보기/상세 → 원본 또는 로컬 파일 다운로드. 모션, 원본 영상, 14영역 대조표와 토큰은 기존 순서대로 이어진다. 소스 목록은 `source-library.json`과 직접 열기용 `source-library-data.js`에서 동일하게 생성한다. 전체 파일은 페이지를 나눠 보여주며 결과 수와 현재 범위를 표시한다.

`app-reconstructions.html`은 9개 앱 흐름을 원본 영상과 로컬 대체 UI로 나란히 비교한다. 원본 영상 카드의 직접 조작 링크도 해당 흐름으로 연결한다. `reconstruction-map.json`은 22개 모션·9개 앱 흐름·5개 레이아웃의 근거와 실행 파일을 연결한다.

영상에서 확인한 순서:

1. Sticky navigation: Family / Developers / Resources / Twitter.
2. Hero: 중앙 2줄 제목 → 2줄 설명 → 대기자 등록 폼 → 보조 링크. 좌우에 잘린 도형 무리.
3. Explore: 5개 Bento 카드. 왼쪽 Easy는 세로로 길고, 오른쪽 Secure / Fast / Powerful / Fun 4개.
4. Send, Receive, Swap: 3열 폰 데모와 기능 캡션.
5. 설명 그리드: Send & Receive, Decentralized Swaps, Full NFT Support, WalletConnect Enabled, self-custody, privacy.
6. 교차 배치 Feature: NFT → Watch → Activity → Security.
7. Onboarding / Mission Control / Drag and Drop: 3개 폰 데모.
8. The latest from Family: 2열 게시물 카드.
9. Details that matter: 좌측 제목, 우측 작은 기능 카드 세로열.
10. Friends of Family: 후기 카드 레일.
11. FAQ: 좌측 제목, 우측 펼침 목록.
12. Explore Family CTA와 장식, footer navigation.

현재 사이트 내 목적지는 `/docs/connectkit`, `/docs/family-account`, `/blog`, `/changelog`, `/support`, `/faqs`, `/download`, 외부 app.family.co 등이 있다. 목적지 페이지 전체는 이번 분석 범위에 포함하지 않았다.

## Design principles

1. **배경은 차분하게, 제품은 선명하게.** 컨테이너 대비는 낮추고 앱 화면/그래픽에 색을 집중한다.
2. **기능 하나에 메시지 하나.** 짧은 제목 + 1~3줄 설명 + 해당 기능의 데모.
3. **색을 역할별로 쓴다.** 그래픽 팔레트, 웹 텍스트, 앱 기능색은 관련되지만 동일한 의미로 합치지 않는다.
4. **큰 리듬, 작은 피드백.** 섹션 간 여백은 넓고, 컨트롤 피드백은 100~220ms 중심.
5. **구현 계층을 구분한다.** MP4 내부 조작을 실제 웹 UI 이벤트로 문서화하지 않는다.
6. **근거보다 정밀하게 말하지 않는다.** VIDEO 전용 관찰은 추정 범위로 기록하되, 공개 BUNDLE에서 복구한 Hero·FAQ 수치는 V2 근거로 명시한다.

## Visual language

### Color

`tokens.css`에는 **원본 이름의 색상 변수 49개**를 추출했다. 이 중 39개에는 원본 P3 선언도 함께 있다. HEX/RGBA는 원본 fallback이고, P3의 숫자를 sRGB HEX로 단순 변환하지 않는다. 시스템에서 붙인 역할 설명은 해석이다.

| 역할 | 원본 변수 | sRGB fallback | 근거 |
| --- | --- | --- | --- |
| 제목 | `--heading` | `#343433` | CSS |
| 본문 토큰 | `--body` | `#494440` | CSS |
| 기본 HTML/body 실제 색 | 토큰 밖 선언 | `#474645` | CSS/LIVE, `--body`와 구별 |
| 보조 텍스트 | `--body-muted` | `#848281` | CSS |
| 페이지 | `--white` | `#FFFFFF` | CSS |
| 낮은 대비 표면 | `--beige` | `#FBFAF9` | CSS |
| 구획/배경 | `--gray-light` | `#F2F0ED` | CSS |
| 버튼 light / 그래픽 pale | `--graphic-yellow-pale` | `#F6F4EF` | CSS |
| Primary CTA | 토큰 밖 선언 | `#171717` / text `#FFFFFF` | CSS |
| 웹 블루 | `--blue` | `#3784F4` | CSS |
| 웹 그린 | `--green` | `#44C67F` | CSS |
| 오렌지 | `--orange` | `#FF5310` | CSS |
| 골드 / 옐로 | `--gold` / `--yellow` | `#CA9230` / `#FFBE4C` | CSS |
| 레드 / 퍼플 | `--red` / `--purple` | `#EF4444` / `#9553F9` | CSS |
| 앱 블루 / 그린 | `--app-blue` / `--app-green` | `#018DFF` / `#34C759` | CSS |
| 앱 핑크 / 그레이 | `--app-pink` / `--app-gray` | `#F966AC` / `#747484` | CSS |
| 폼 valid / invalid | `--color-valid` / `--color-invalid` | `#00C454` / `#FF4E4E` | CSS 선언 확인, 실제 폼 상태 검증 아님 |

그래픽 전용 범위: `graphic-green`, `graphic-blue`, `graphic-blue-alt`, `graphic-blue-pale`, `graphic-blue-pale-alt`, `graphic-purple`, `graphic-yellow`, `graphic-gold`, `graphic-gold-alt`, `graphic-yellow-pale`, `graphic-black`, `graphic-gray`, `graphic-stone`, `graphic-orange`, `graphic-outline`. 전체 값은 열람 페이지와 JSON에 보존했다.

**색 사용 규칙(제안):** 대비가 낮은 밝은 그린/골드/오렌지는 아이콘과 배경에 우선 사용한다. 상태 의미는 아이콘/텍스트와 함께 전달한다. `twitter-blue`도 실제 선언은 차콜이므로 이름만 보고 파란색으로 수정하지 않는다.

### Typography

| 역할 | Family | Weight | 크기 / 행간 | 자간 | 출처 |
| --- | --- | --- | --- | --- | --- |
| Hero `.geYPoR` | Family | 500 | 68px / 1.1 (74.8px) | -0.02em | CSS/LIVE |
| Hero ≤580px | Family | 500 | 44px / 48px | -1.35px | CSS |
| Section `.fuTHBv` | Family | 500 | 44px / 48px | -1.35px | CSS |
| Section ≤420px | Family | 500 | 32px / 35px | -0.69px | CSS |
| 大 body | Inter | 400/500 | 19px / 27px | -0.3px | CSS |
| Body / lead | Inter | 400/500 | 17px / 26px | -0.22px | CSS |
| Body small | Inter | 400/500 | 15px / 22px | -0.13px | CSS |
| Caption | Inter | 400/600 | 14px / 20px | -0.09px | CSS |
| Small caption | Inter | 400/500 | 13px / 18px | -0.13px | CSS |
| Micro | Inter | 400 | 12px / 19px | -0.01px | CSS |
| Component title | Inter | 500 | 23px / 25px | -0.44px | CSS |
| 앱 데모 텍스트 일부 | LFE Sans | 여러 스타일 | 개별 요소별 확인 필요 | 일괄 고정하지 않음 | LIVE |

Family의 400/500/600 font-face 선언이 존재한다. LFE Sans는 Regular/Medium/SemiBold/Bold 파일을 참조하지만 원본 CSS의 weight 선언은 각각 400/400/600/700이다. 파일명의 Medium을 근거로 500 선언을 추정하지 않는다. 문서에는 Family Medium, LFE Sans Regular, Inter Latin을 로컬 참조로 저장했다. 한국어 Family 폰트 디자인은 확보되지 않았으며 한국어 산세리프 대체는 **문서용 제안**이다.

### Spacing, grid, shape, elevation

- 콘텐츠 wrapper `.hKlZHw`: `max-width:67rem` (기본 16px 기준 1072px), 좌우 `1.5rem` (24px). 실측 콘텐츠 1024px. 일반 `.container`의 1040px 계열 값과 혼합하지 않는다.
- Header 실측: 94px 컨텐츠 높이, sticky wrapper 약 95px. 모바일 약 70px. 위치는 유지되며 스크롤 hide/reveal은 관찰되지 않았다.
- 주요 split grid: 두 열, gap `5.75rem` (92px). 섹션마다 다른 90~136px 전후 상하 padding을 사용한다.
- Bento: 데스크톱 3열×2행, gap 34px, Easy가 두 행 점유.
- 3개 폰 grid: 3열, gap 32px, 상단 간격 51px. 모바일 1열, gap 24px, 상단 32px.
- 게시물 grid: 2열, gap 28px; section padding 116px / 108px. 모바일 1열, gap 24px, 48px / 64px.
- spacing은 8px 배수만의 엄격한 스케일이 아니다. 34/51/92/97px 등 실제 값을 임의로 반올림하지 않는다.
- 관찰 radius: 6, 8, 10, 12, 32, 40, 72px 및 원형 50%. 제안된 일반 카드 radius를 모든 원본 카드에 소급 적용하지 않는다.
- dropdown shadow: `0 3px 16px rgba(0,0,0,.1)`; 기타 soft shadow `0 0 24px rgba(0,0,0,.15)` 관찰. 주요 배경 카드는 대체로 그림자보다 옅은 배경 차이를 이용한다.

### Motion

**V2 우선 규칙:** 아래 `BUNDLE` 행은 V1의 동명 VIDEO 추정보다 우선한다. `motion-source-tokens.json`에 trigger, 수치, 공개 URL, native 재구성 한계가 함께 있다.

| 패턴 | Trigger | 변화 | 시간 / easing | 근거 및 제한 |
| --- | --- | --- | --- | --- |
| Hero copy | initial load | word마다 `rotateX:-45`, `y:100%`, opacity 0 → 정상 | `.937s`, `[.19,1,.22,1]`; line delay .3/.6s, word stagger .05s | **BUNDLE V2** |
| Hero ornament entrance | initial load | desktop child `y:40, scale:0, opacity:0` → 정상; mobile y:60 | parent delay .2s, stagger .05s; desktop spring 4/800/80, mobile 4/800/60 | **BUNDLE V2** |
| Hero ornament ambient | mounted | ±2°/−2…5px desktop drift; mobile ±6°/±5px | desktop 2–3s, mobile 1–3s; random delay 0–1s; mirror infinite | **BUNDLE V2**; randomized so one deterministic thumbnail is a native reconstruction |
| Hero ornament drag | pointer drag desktop | constrained drag → origin snap-back | elastic .1, bounce stiffness600/damping20 | **BUNDLE V2**. Do not imply this applies to mobile compact art |
| Footer CTA illustration | viewport 25% visible, once | SVG path/group entrance | parent .025s stagger; spring 4/800/80 | **BUNDLE V2**. This supersedes V1 “footer loop unknown” as the CTA implementation target |
| Nav hover | pointer hover | background / color | 200ms ease | CSS |
| Dropdown | nav hover | opacity 0→1, scale .96→1 | 100ms ease, origin 50% 0 | CSS + VIDEO 약 2.1~2.2s |
| Button | hover | background-color | 100ms ease | CSS |
| Editorial image | hover | scale 1→1.02 | 180ms ease | CSS `.kordEf` |
| foreground transform | 개별 상태/상호작용 | transform | 220ms 또는 1s, cubic-bezier(.19,1,.22,1) | CSS. 모든 카드에 동일 hover를 적용한다는 뜻 아님 |
| Send icon | animation class | 회전 0→−360° | 1s ease-in-out | CSS keyframe |
| Receive icon | animation class | Y 0→100%, −100%로 재배치→0 | 0.5s ease-in-out | CSS keyframe |
| Swap icon | animation class | 회전 0→360° | 1s ease-in-out | CSS keyframe |
| Skeleton | 로딩용 CSS | background-position 100%→−100% | 1200ms linear infinite | CSS 선언. 실제 모든 로딩 상태 검증 아님 |
| Testimonial rail | 지속 재생 | translateX(0→−50%) | 120s linear infinite | CSS `.Qwkbu`, `Testimonials__RowContainer` |
| Explore Easy | autonomous 2s interval | Send/Swap/Receive/Purchase row active state | spring 4/800/80; active scale `[1,.99,1,1,1,1]` | **BUNDLE V2**, not hover-triggered |
| Explore Secure/Fast | autonomous 2s interval | security ring / status panel states | spring 4/800/80; Secure ring pulse 1s easeInOut | **BUNDLE V2** |
| Explore Powerful | autonomous 2s interval | urgency level and counter `15→60→30→15` | counter `.8s easeOut`; content spring 4/2000/80 | **BUNDLE V2** |
| Explore Fun | autonomous 2s interval | 9-item emoji rail and local emoji motion | rail 1000ms `cubic-bezier(.19,1,.22,1)`; local .75s `[.63,.01,.54,1.03]` | **BUNDLE V2** |
| Details cards | autonomous 2s / 1.75s state interval | deck, protection pill, reordering, grouping | per-card source values in V2 token JSON | **BUNDLE V2** |
| NFT 원형 affordance | 내부 데모 재생 | 원형 컨트롤 등장 | 약 0.3~0.5s | VIDEO. pre-rendered MP4 내부라 page interaction으로 재구성하지 않음 |
| FAQ | click, one item open | height, answer opacity, plus-to-minus | height spring .2/280/18; glyph/opacity springs .5/220/20 and .5/200/18 | **BUNDLE V2**; V1 약300ms 관찰은 보조 evidence |

FAQ의 `whileTap`은 opacity `.5`, duration `.1s`다. active item을 다시 누르면 닫고, 다른 항목을 열면 기존 항목은 닫는다. FAQ를 CSS `max-height` transition 하나로 바꾸지 않는다.

페이지 스크롤 속도를 컴포넌트 애니메이션 duration으로 사용하지 않는다. 대부분의 섹션은 정적인 배치가 스크롤로 드러나며 모든 섹션의 fade-up을 관찰한 것은 아니다.

**재사용 제안:** 즉각 피드백 100ms, nav 200ms, 작은 transform 220ms를 유지한다. V2에서 확인된 Hero/CTA/Bento/Details/FAQ 수치는 임의의 “250–300ms accordion”이나 “80–120ms hero stagger” 제안으로 대체하지 않는다. `prefers-reduced-motion`일 때는 loop/drift/rail을 정지하고 final state를 보여준다. 이는 접근성용 **제안**이다.

### Imagery / iconography

- 크레용/종이 오리기 같은 불규칙 외곽. 꽃·하트·화살표·체크·방패·기어·별·열쇠구멍 형태. 단색 면과 따뜻한 팔레트가 중심.
- Hero에서는 좌우 장식이 viewport 밖으로 잘리지만 중앙 제목과 CTA를 가리지 않는다.
- 보안은 큰 자물쇠와 구름 계열 그림, 다른 기능은 iPhone 실루엣/실제 앱 데모로 설명한다.
- 작은 원형 아이콘은 기능색을 배경으로 사용한다. SNS/외부링크, 체크, plus/minus는 단순한 UI 아이콘 계층.
- `references/assets/emoji-*.png`는 현재 사이트에서 받은 원본 참조 에셋이다. 각 원본 URL과 크기는 manifest에 기록했다. 렌더링된 도형과 모든 이미지가 동일한 에셋이라고 단정하지 않는다.

## Components

### V3 소스 탐색·대체 앱

- 전체 소스 탐색기는 검색, 유형/출처 필터, 결과 목록, 페이지 탐색, 파일 상세 dialog, 미리보기, 원본 URL, 다운로드와 복사를 제공한다. 색상·라운딩은 기존 카탈로그의 차분한 회색/따뜻한 배경을 재사용한다.
- 이미지/SVG는 이미지 요소로, 동영상은 사용자가 시작하는 controls로, 코드·HTML은 텍스트로 표시한다. 수집한 HTML/JS를 문서 안에서 실행하지 않는다.
- 원본 없음은 숨기거나 성공 처리하지 않는다. 실패 상태와 로컬 대안이 함께 보인다.
- 대체 앱은 영상의 다크 폰 화면 및 온보딩의 라이트 구조를 참고한다. 보내기/교환 확인, 주소 복사, 즐겨찾기, 감시 자산, 거래 필터, 온보딩 세 경로, 그룹화, 드래그 정렬을 직접 조작한다. 숫자·잔액·주소는 예제이며 현재 페이지 메모리만 사용한다.

| 컴포넌트 | 구조/변형 | 상태와 동작 | 토큰 소유 |
| --- | --- | --- | --- |
| StickyHeader | logo + nav + 현재 CTA, mobile menu | 기본/hover/dropdown. 모바일 열림은 미검증 | typography/nav, white, radius6 |
| NavDropdown | 제목+설명 두 행, white floating panel | hover 확대/fade; 키보드·터치 parity는 제안 | radius8, shadow panel, 100ms |
| Hero | 2줄 제목+설명+CTA+양옆 장식 | word reveal, scatter/drift, desktop drag snap-back은 **BUNDLE V2**; 현재 CTA/과거 waitlist 두 변형 | display, body, graphic-* |
| Button | dark/light, 48px/compact32px, radius32 | hover 배경100ms. disabled/loading/press는 보완 제안 | #171717, #F6F4EF, Inter500 |
| WaitlistField | 외곽 pill 안 email + action | 영상 기본만 확인. validation/success/error는 제안 | 원본 폼의 과거 정확 CSS 미확정 |
| FeatureBento | 5카드, tall Easy | hover가 아닌 autonomous internal demo. 각 card 2s cadence와 Powerful numeric tween은 **BUNDLE V2** | beige, graphic/app color |
| PhoneDemo | 3-up 또는 split feature | mute, control-less; 일부 loop | media + neutral surface |
| SplitFeature | label+heading+copy+checklist / image 교차 | 스크롤로 노출. NFT/Watch/Activity/Security | heading, section accent |
| MiniFeature | 작은 media + 짧은 텍스트 | Monitor/Protect/Organise/Grouping 각자 source state machine; generic fade 교체 금지 | 낮은 대비 panel, semantic accent |
| ArticleCard | 16:9 근처 thumbnail+meta+title+summary | CSS 일부 이미지 hover scale1.02 | body/caption, radius, hover180 |
| TestimonialRail | avatar+name+handle+quote | 120s 반복, mobile 숨김 | neutral cards, 10px radius |
| FAQAccordion | 좌측 section title+우측 question list | exclusive open state, click/tap/three springs는 **BUNDLE V2** | orange, caption, source springs |
| FooterCTA | 제목+설명+CTA / 장식 배경 | independent `useInView` once@25% SVG entrance; Hero의 generic loop로 치환하지 않음 | hero 계열 palette, CTA spring |

Dropdown은 CSS 기본 width316px, max-width `calc(100vw - 18px)`, padding4px, top `calc(100% + 5px)`다. 특정 computed 샘플에서는 303×130px이 기록됐다. 이 둘을 단일 고정 실측치로 합치지 않는다.

### 제품 데모 미디어 목록

현재 DOM에서 얻은 정확한 원본 URL이다. `autoplay=false`는 HTML 속성/프로퍼티 관찰이며 JavaScript가 `.play()`를 호출하지 않는다는 뜻은 아니다.

| 파일 (`https://family.co/videos/` 기준) | loop | 기능 |
| --- | --- | --- |
| `send.mp4` | false | 보내기 |
| `receive.mp4` | false | 받기 |
| `swap.mp4` | false | 교환 |
| `nft.mp4` | true | NFT 미디어 |
| `watch.mp4` | true | 지갑 감시 |
| `activity.mp4` | true | 활동 목록 |
| `onboarding.mp4` | false | 온보딩 |
| `missioncontrol.mp4` | false | 지갑 관리 |
| `dragdropdone.mp4` | false | 드래그 앤 드롭 |

9개 모두 muted / controls=false로 관찰됐다. 이 MP4 내부의 모든 앱 컨트롤, 제스처, easing, 상태 머신은 영상에서 완전히 복구할 수 없다. 이번 결과에는 녹화에서 보인 상태 및 원본 미디어 연결을 보존한다.

## V2 catalog architecture

V2 열람 페이지는 색상 표본만 나열하는 문서가 아니라, **원본 근거·동작하는 thumbnail·설명·원본 media**를 같은 화면에서 비교하는 디자인 시스템 카탈로그여야 한다. 아래 anchor는 구현 페이지의 필수 정보 구조다. 최종 브라우저 검증 기준 **22개**의 동작 썸네일을 제공한다.

<a id="motion-library"></a>
### Motion library (`#motion-library`)

- 최소 20개 이상의 독립 interactive thumbnail을 배치한다. 각 thumbnail은 이름, trigger, source-backed 수치, 반복/정지 방식, “BUNDLE 원본 수치” 또는 “native reconstruction” 표기를 함께 보여준다.
- 필수 주제: Hero word reveal, desktop/mobile scatter, ambient drift, drag snap-back, CTA in-view entrance, nav/dropdown/button/image feedback, Easy/Secure/Fast/Powerful/Fun, Monitor/Protect/Organise/Grouping, FAQ glyph/height/content, testimonial rail, reduced-motion final state.
- thumbnail은 원본 React/Framer 실행 파일을 복사한 증거가 아니다. 정적 HTML/CSS/JS로 재구성할 경우 `native reconstruction`으로 표기하고, visual behavior가 변할 수 있음을 설명한다.
- 사용자는 repeat/pause/replay와 reduced-motion을 확인할 수 있어야 한다. autoplay loop는 원본 demo를 설명하는 데 필요한 범위에서만 사용한다.

<a id="app-demos"></a>
### App demos (`#app-demos`)

아래 9개 **원본 로컬 MP4**를 poster/metadata와 함께 제공한다: `send`, `receive`, `swap`, `nft`, `watch`, `activity`, `onboarding`, `missioncontrol`, `dragdropdone`. 목록/타임라인은 source video의 역할, loop 여부, 영상 재생 구간을 구분한다. 사용자가 선택한 demo는 dialog/lightbox에서 재생하며, 원본 앱 동작을 HTML interactive state로 오인시키지 않는다.

<a id="scene-atlas"></a>
### Scene atlas (`#scene-atlas`)

소스 전체 흐름의 14개 장면을 preview anchor와 연결한다. 이는 Recent 녹화와 현재 live build 사이의 버전 차이를 숨기지 않는 탐색 지도다.

| # | Source section | Preview destination | 주요 근거 |
| ---: | --- | --- | --- |
| 1 | Sticky navigation | `#components` | LIVE/CSS |
| 2 | Hero / intro ornaments | `#motion-library` | BUNDLE V2 + VIDEO |
| 3 | Explore five-card bento | `#motion-library` | BUNDLE V2 |
| 4 | Send / Receive / Swap phones | `#app-demos` | original MP4 |
| 5 | NFT feature | `#app-demos` | original MP4 + VIDEO |
| 6 | Watch feature | `#app-demos` | original MP4 |
| 7 | Activity / security feature | `#app-demos` | Activity 원본 MP4와 Security 정적 preview |
| 8 | Onboarding | `#app-demos` | original MP4 |
| 9 | Mission Control | `#app-demos` | original MP4 |
| 10 | Drag and Drop | `#app-demos` | original MP4 |
| 11 | Details that matter | `#motion-library` | BUNDLE V2 |
| 12 | Friends of Family rail | `#motion-library` | CSS/BUNDLE |
| 13 | FAQ | `#motion-library` | BUNDLE V2 |
| 14 | Explore Family footer CTA | `#motion-library` | BUNDLE V2 |

<a id="asset-library"></a>
### Asset library (`#asset-library`)

`references/v2-source/assets/inline-svg-000.svg`부터 `inline-svg-093.svg`까지는 live DOM에서 분리한 원본 inline SVG이고, `references/v2-source/assets/asset-candidates.json`과 `dom-inventory.json`은 provenance를 보존한다. Asset library는 실제 SVG를 lazy thumbnail으로 보이고 원본 파일 경로와 타입을 표시한다. 각 SVG의 의미는 source map이 없으므로 filename만으로 Hero/footer/feature 역할을 단정하지 않는다. 폰트와 MP4는 별도 asset group으로 유지한다.

## Accessibility

V3: 검색·필터마다 레이블, 결과/복사 상태의 live region, dialog Escape 및 포커스 복귀, 명확한 focus-visible을 검증한다. 드래그 정렬은 위/아래 키보드·터치 버튼도 제공한다. 원본 영상 자동재생 없이 사용자가 시작하며 화면을 떠나면 일시정지한다. 이는 점검한 동작의 근거이며 전면 WCAG 인증 주장이 아니다.

아래는 **구현 보완 목표**이며 원본의 적합성 인증이 아니다.

- WCAG 2.2 AA를 구현 목표로 한다. 일반 텍스트 대비 4.5:1, 큰 텍스트 3:1 기준으로 실제 조합을 검증한다.
- fallback 대비 계산에서 heading/white 약 12:1, body/white 약 9:1인 반면 body-muted/white는 약 3.8:1로 작은 본문에는 부족하다. 정확한 계산은 [validation.json](references/validation.json) 참조. P3 대비 전체는 별도 검증 필요.
- 밝은 accent를 본문 글자로 사용하기 전 대비를 확인한다. 원본 색을 보존하는 것과 접근 가능한 semantic text 색을 설계하는 것은 구별한다.
- 명시적인 label, focus ring, 버튼 semantics, disclosure expanded state, Escape, touch click을 제공한다.
- compact 버튼은 원본32px을 기록하되 제품 적용 시 44px 터치 영역을 추가하는 것을 제안한다.
- `prefers-reduced-motion`에서 반복 rail/장식/불필요한 transition을 중지한다. 영상은 poster와 사용자가 누르는 재생을 제공한다.
- 로딩/error/success는 색만으로 전달하지 않는다. 동적 안내는 live region을 사용한다.
- 데모 페이지의 FAQ는 button/disclosure semantics, `aria-expanded`, focus/Escape 동작을 갖추고 V2 spring token을 적용한다. native `details`는 smooth choreography를 지원할 수 없는 fallback일 때만 사용한다.

## Responsive behavior

V3: 소스 브라우저는 모바일에서 검색·선택 컨트롤을 감싸고 카드/상세가 화면 폭을 넘지 않게 한다. 앱 원본/재구성 비교는 700px 이하에서 원본 → 직접 조작 순으로 쌓는다. 1440px, 768px, 390px에서 실제 브라우저로 확인한다.

| 조건 | 원본에서 확인한 변화 | 근거 |
| --- | --- | --- |
| Desktop 1440 | 1024px content, navigation 노출, 68px hero | LIVE |
| ≤920px 등 | 일부 nav/세부 컴포넌트별 조건 | CSS, 전역 분기 아님 |
| Bento 880px 주변 | 3열/2열 선언이 만나는 경계 | CSS. 정확히880px에는 cascade 확인 필요 |
| ≤768px | split과 3폰 그리드가 세로로 전환, panel transform 제거 | CSS |
| ≤768px | testimonial section 숨김 | CSS `.ihCukM` |
| ≤580px | hero44/48, Bento 단일열 | CSS |
| ≤420px | section heading32/35, 줄바꿈 span inline | CSS |
| Mobile390 | 342px content + 좌우24px, Get Started + menu | LIVE |

CSS에는 390/410/420/580/720/768/880/920px의 컴포넌트별 조건이 있다. 새 제품 적용 시 이를 곧바로 보편적인 breakpoint token으로 통합하지 않는다. 모바일 메뉴 열림/닫힘, tablet 경계 전부와 landscape는 추가 검증 대상이다.

## Interaction states

| 상태 | 실제 근거 | 재사용 구현 지침 |
| --- | --- | --- |
| Default | 영상·현재 화면 | 원본 레이아웃과 역할 유지 |
| Hover | nav, button, 일부 이미지 CSS | 짧은 배경/색/transform 피드백 |
| Expanded | 영상 FAQ, nav CSS | accessible disclosure, 포커스 유지 |
| Focus | 일부 nav focus-visible CSS | 모든 컨트롤에 명확한 ring 보완 |
| Loading | skeleton keyframes 선언 | 실제 요청과 연결; shimmer 대신 정적 placeholder 허용 |
| Disabled | 전체 원본 확인 안 됨 | native disabled, 동작 차단, 설명 가능한 상태 |
| Empty | 확인 안 됨 | 내용 없음+다음 행동, 임의 원본 카피 생성 금지 |
| Error | 폼 error색 선언만 확인 | field message+수정 경로, 입력 보존 |
| Success | 앱 데모 check/status 관찰 | 실제 완료와 데모 완료를 구별 |
| Offline / slow | 원본503 발생만 기록 | poster fallback, 재시도, 로딩 무한 지속 방지 |

로컬 waitlist 데모는 전송 없이 email validity와 완료 표시만 제공한다. 실제 제품 등록과 연결되지 않는다.

## Content voice

- 간결한 영어 제목, 1~2개 구문, 문장 마침표 사용: “Details that matter.” / “Send, Receive, Swap. All in one place.”
- 기술 용어는 기능 맥락에서 사용하며 소개 문장은 쉬운 어휘를 쓴다.
- 설명은 제목을 되풀이하기보다 사용자가 얻는 결과를 보여준다.
- 새 한국어 카피는 따뜻하고 직접적으로 번역한다. 원본 카피로 표시하지 않는다.
- 원본 보안/금융 문구는 시각적 레퍼런스이며 독립 검증된 제품 사실로 확대하지 않는다.

## Implementation constraints

V3 생성 순서: 소스 수집 → 재구성 대응표 생성 → 카탈로그 생성 → 최종 파일 해시 재색인 → 검증 → 패키징. 수집기는 네트워크 다운로드를 반복하지 않는 재색인 모드를 제공한다. UI 코드 변경 후 해시 재색인을 생략하지 않는다. 검증 자료는 `references/v3-review/`에 보존하며 패키지 무결성 검사까지 수행한다.

### 산출물

- `index.html`, `catalog.css`, `catalog.js`: 빌드 의존성 없는 열람 페이지. 색상49개 복사, 영상 구간 이동, 타이포 미리보기, 버튼/dropdown/form/FAQ 및 모션 데모.
- `tokens.json`, `tokens.css`: 원본 color 이름/fallback/P3 및 출처가 있는 정규화 typography/layout/motion 값. `motion-source-tokens.json`은 별도 V2 source-backed motion schema로, spring/cadence/trigger/public URL을 보존한다. 두 JSON 모두 특정 Figma/DTCG importer 호환을 주장하지 않는다.
- `scripts/extract-tokens.py`: 저장한 원본 CSS에서 추출. `scripts/build-catalog.py`: 토큰에서 swatch 포함 HTML 생성.
- `references/`: 원본 CSS/HTML/DOM/영상/스크린샷/정밀 프레임/분석 증거.
- `scripts/verify-catalog.cjs`: 뷰포트·동작·토큰·링크·reduced-motion 검증.

### 사용

```sh
python3 scripts/serve.py
# http://127.0.0.1:40565
```

또는 `index.html`을 직접 열 수 있다. clipboard API 제한 시 복사 fallback을 시도하고 값 자체를 알려준다. 링크된 `.md`는 브라우저에 따라 텍스트로 열린다.

토큰 재생성:

```sh
python3 scripts/extract-tokens.py
python3 scripts/build-catalog.py
```

검증은 이미 설치된 Playwright를 사용하며 npm 의존성을 추가하지 않았다. 캡처 스크립트의 Playwright 경로는 현재 환경 전용이므로 다른 환경에서는 `PLAYWRIGHT_MODULE`을 지정한다. 원본의 Next.js/React 구성과 별개로 이 문서는 정적 HTML이다.

### 한계

- 공개 원본 캡처 중 일부 asset503 및 React hydration 오류가 있었다. 특정 동작의 부재를 제품의 의도라고 단정하지 않는다.
- 녹화는 데스크톱 과거 버전이다. 모바일·error·empty·성공 흐름 전체를 담고 있지 않다.
- 개인화, 인증 후 화면, iOS 앱 네이티브 구현은 미확인.
- 폰트/에셋 파일은 출처를 기록한 로컬 참조용이다. 재배포·상용 사용 라이선스는 확인하지 않았다.
- Hero, footer CTA, Bento, Details, FAQ의 다수 spring/cadence는 현재 공개 bundle에서 복구했다. 그러나 해시 build와 2023 Recent 녹화가 동일 릴리스인지, embedded iOS MP4 내부 제스처/easing, 모든 SVG의 의미/semantics는 확인하지 못했다.

## Open questions

미확인 영역이며, 현재 추출 문서 완성을 막는 질문은 아니다.

- [ ] 과거 영상 버전의 소스 CSS/원본 빌드가 남아 있는가? Owner: 원본 사이트 운영자. 영향: 역사적 픽셀 정확성.
- [ ] Family / LFE Sans 및 일러스트의 사용·재배포 허용 범위는? Owner: 브랜드/라이선스 담당. 영향: 다른 제품의 실제 적용.
- [x] 현재 공개 build의 Hero/Footer CTA 장식 모션 파라미터와 trigger를 확보했다. [V2 source report](references/v2-research/motion-source-report.md) 참조. 다만 과거 Recent 영상과 동일 build인지 미확인. Owner: 원본 구현 담당. 영향: 역사적 pixel/motion parity.
- [ ] 모바일 메뉴, 키보드 순서, 폼 오류/완료 동작은? Owner: 후속 검증 담당. 영향: 전체 interaction parity.
- [ ] 한국어를 포함한 다국어 타이포와 dark theme가 필요한가? Owner: 적용 제품 담당. 영향: 확장 토큰 설계. 현재 원본의 dark theme는 확인하지 않았다.


### V2 검증 및 전달

- 22개 인터랙션 썸네일: 원본 수치 / 재구성 라벨, 직접 조작, 재생·초기화·확대, 검색·분류, 코드 다운로드.
- 9개 원본 앱 영상: 포스터·스토리보드, 재생·배속·1/30초 관찰 seek·다운로드.
- 14개 영상 영역 대조표와 5개 반응형 HTML 레시피 (`layout-recipes.html`).
- `family-design-system.zip`: 실행 파일, 토큰, 원본 매체·SVG, 공개 소스 근거와 검증 스크립트를 담은 휴대 가능한 패키지.
- `references/v2-review/motion-validation.json`: 17개 동작 검증 그룹 통과. Hero 드래그, NFT, exclusive FAQ, reorder, 검색과 확대 조작 포함.
- `references/v2-review/validation.json`: 9개 미디어·소스 링크·색 복사·14영역 대응·390/768/1440px 검증.

원본 spring 수치와 동일한 React/Framer runtime을 이식한 것은 아니다. FAQ와 drag return은 native spring keyframes로, 일부 장식·상태 루프는 CSS/JS의 근사 렌더러로 구현했다. 라이브러리의 접근성 제어·재생 버튼·다운로드 UI는 이 프로젝트의 기능이다.

## Studio shell

열람 페이지(`index.html`, `system.html`, `app-reconstructions.html`, `layout-recipes.html`)의 뼈대는 공통 Apple 스튜디오 셸 규격(`../All/shell/SPEC.md`)을 따른다. 구조·치수는 `studio-shell.css`와 `studio-shell.js`(`All/shell/shell.css`·`shell.js`의 사본, 모든 클래스는 `as-` 접두어)가 담당하고, 브랜드 값은 `studio-brand.css`에서 Family 토큰을 `--as-*` 변수에 매핑해 전달한다. `system.html`은 `.fds` 토큰을 `--as-*`에 연결해 다크 테마까지 따라간다.

DOM 순서는 좌측 고정 사이드바(브랜드 마크 · WORKSPACE 메뉴 · 수집 상태) → 상단바(브레드크럼 · 도구 · Export tokens) → `.as-workspace` 본문 → `.as-studio-footer`다. 기존 메뉴의 순서·라벨·href·카운트는 그대로 두고 `.as-nav-index` 번호와 `.as-nav-count`만 덧붙였으며, 전역 토글(`#motion-toggle`, `#theme-toggle`)은 `.as-topbar-tools`로 옮겼다.

`index.html`의 셸은 `scripts/studio_shell.py`가 생성한다. 카탈로그를 다시 만들 때는 `python3 scripts/build-catalog.py`(내부에서 `studio_shell.enhance` 적용)와 `python3 scripts/build-system-guide.py`를 사용한다. 셸 치수·간격·타입 크기는 `studio-shell.css`에서 바꾸지 않고, 충돌하는 옛 규칙만 `studio-brand.css`에서 무력화한다.
