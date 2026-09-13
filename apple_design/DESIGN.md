# Design

## Source of truth
Status: Active  
Date: 2026-09-07  
Product surfaces: `app/` React/Vite 디자인 시스템 스튜디오, 로컬 보관 Apple 홈페이지 재구성.  
Evidence reviewed: `evidence/source/desktop.json`, `page.html`, `mobile.html`, `search.html`, `desktop.png`, `desktop-menu.png`, `desktop-search.png`, `mobile.png`, `desktop-full.png`, `mobile-full.png`, `app/package.json`. 내부 Apple 소스 접근은 없음. 관찰값은 공개 HTML/CSS 링크/스크립트/스크린샷 캡처에 한정한다.

## Brand
성격: 정밀하고 조용하며 제품 중심. 큰 여백, 강한 제품 이미지, 짧은 문장, 명확한 CTA로 프리미엄 신뢰를 만든다.  
Trust signals: Apple 로고, SF Pro/SF Pro Icons, 실제 제품/서비스 이미지, 일관된 글로벌 내비게이션, 접근 가능한 ARIA 상태.  
Avoid: 내부 소스처럼 보이는 명명, 과장된 장식, 임의 색상 팔레트, 카드 남용, 스크린샷 납품물 중심 설명.

## Product goals
Goals: 공개 Apple 홈페이지의 코드 기반 디자인 시스템을 추출해 React 컴포넌트와 상태를 재구성할 수 있게 한다. 내비게이션, 검색, 장바구니, 모바일 메뉴, 푸터, 히어로/프로모션, 갤러리 모션까지 계약화한다.  
Non-goals: Apple 내부 토큰/컴포넌트/API 복제 주장, 실서비스 구매/검색 연동, 단순 스크린샷 비교 산출물.  
Success signals: 로컬 앱에서 관찰된 구조와 상호작용 상태를 탐색할 수 있고, 734px/1068px 경계와 reduced motion 대응이 문서와 일치한다.

## Personas and jobs
Primary personas: 구현자, 디자이너, QA.  
User jobs: 공개 캡처 근거를 빠르게 확인하고, Apple풍 레이아웃/모션을 React로 재구성하며, 관찰값과 로컬 재해석을 혼동하지 않는다.  
Contexts of use: 데스크톱 1440px, 모바일 390px 캡처 기준 검토, 로컬 Vite 앱에서 디자인 시스템 상태 확인.

## Information architecture
Top: 지역 선택 배너, 글로벌 내비게이션.  
Main: `hero` 섹션, `promo` 섹션, `endless-entertainment-gallery`.  
Overlays: 메가 메뉴, 검색 패널, 장바구니 패널, 모바일 전체 메뉴.  
Footer: `ac-gf-sosumi`, 5열 디렉터리, 모바일 아코디언, 법적/지역 링크.  
Source browsing: `#research-sources`는 홈페이지·13개 공개 페이지·로컬 구현의 통합 파일 목록이다. 종류, 페이지, 출처별 필터와 페이지 나누기를 제공하고 전체 코드를 복사·다운로드한다. `#sources`는 기존 홈페이지 전용 목록이다. `#reconstructions`는 수집 실패·비공개 기능을 보완하는 로컬 데모이다. 원본, 로컬 도구, 대체 구현, 원본 미확보 상태를 구별한다.
Studio route model: 원본 홈페이지 뷰, 컴포넌트 인벤토리, 인터랙션 상태, 토큰/반응형 참조를 한 화면에서 교차 확인한다.

## Design principles
Evidence first: 관찰된 공개 DOM/CSS 값과 로컬 재구성 결정을 분리한다.  
Product before chrome: 제품 이미지와 메시지가 첫 뷰포트를 지배하고 UI 장식은 절제한다.  
Stateful fidelity: hover/open/focus/paused/current 같은 상태를 정적 모양보다 우선 기록한다.  
Responsive parity: 734px 이하와 1068px 이하 동작을 별도 계약으로 둔다.

## Visual language
Color: 기본 배경은 흰색/근백색, 본문은 거의 검정, 보조 텍스트는 회색. CTA는 Apple blue 계열과 흰색 pill 버튼을 사용한다. 검색 오버레이는 밝은 패널과 하단 콘텐츠 블러/디밍을 재구성한다.  
Typography: `SF Pro`와 `SF Pro Icons` 공개 폰트 링크가 관찰됨. 원본 캡처의 폰트는 근거로 보존한다. 재사용 라이브러리는 system-ui 기본 폰트로 독립 실행한다. 히어로 헤드라인은 굵고 중앙 정렬, 내비게이션/푸터는 작고 조밀하다.  
Spacing: 44-48px 글로벌 내비게이션 높이, 넓은 섹션 여백, 프로모션 그리드 간 12px 안팎 간격을 기준으로 한다.  
Shape/elevation: CTA pill, 검색/지역 선택의 둥근 입력, 플랫한 섹션. 카드형 중첩은 사용하지 않는다.  
Motion: 공개 HTML에서 글로벌 내비게이션 플라이아웃 `--r-globalnav-flyout-rate` 240-422ms, 모바일 메뉴 아이콘 SVG 0.24s 애니메이션, 갤러리 timed dotnav가 관찰됨. 로컬은 같은 범위의 easing/지연감을 재구성하고 reduced motion에서 자동/대형 전환을 중지한다.  
Imagery/iconography: `desktop.json`에 259개 media 항목과 `small/medium/mediumtall/largetall/large` srcset 패턴이 관찰됨. 제품/서비스 이미지를 주 시각 요소로 쓰고 임의 SVG 일러스트는 피한다.

## Components
Core: LocaleSwitcher, GlobalNav, MegaMenu, SearchOverlay, BagPopover, MobileMenu, HeroSection, PromoGrid, MediaGallery, DotNav, FooterDirectory, FooterAccordion, CTAButton.  
Variants/states: closed/open, current, incoming, focused, timed-paused, disabled/loading, empty bag, search suggestions/default links, mobile accordion expanded/collapsed.  
Token ownership: 문서화된 토큰은 로컬 재구성 토큰이다. Apple 내부 토큰으로 명명하지 않는다. 관찰된 CSS 변수명은 `docs/interaction-inventory.md`에 근거값으로만 둔다.

## Accessibility
Target standard: WCAG 2.2 AA 수준을 목표로 한다.  
Keyboard/focus: nav/search/bag/footer 버튼은 `aria-expanded`, `aria-controls`, `aria-label`을 유지하고 Esc/Tab/Shift+Tab/Enter/Space 경로를 제공한다.  
Contrast: 흰 배경의 작은 텍스트와 이미지 위 흰 텍스트는 캡처 기준 대비를 확인한다.  
Semantics: 검색 패널은 `role="search"`, footer 목록은 list/listitem 구조, 숨김 `h1 Apple` 패턴을 유지한다.  
Reduced motion: `prefers-reduced-motion: reduce`에서는 자동 갤러리, 비디오 자동재생, 큰 blur/slide 전환을 정지하거나 즉시 상태 변경으로 대체한다.

## Responsive behavior
Breakpoints: 공개 HTML/CSS 참조에서 `(max-width: 734px)`, `(max-width: 1068px)`, `(max-width: 1440px)`, `(min-width: 0px)`가 관찰됨.  
내비게이션은 별도의 833px/834px 경계를 사용한다. 833px 이하에서는 로고/검색/가방/햄버거 중심의 compact 바와 세로 드릴다운을 사용한다. 제품 그리드/타이포의 small 경계는 734px이다. 푸터 디렉터리는 모바일에서 아코디언이다.  
1068px 이하: 이미지 srcset은 medium/mediumtall 계열로 전환하고 프로모션 밀도와 텍스트 스케일을 줄인다.  
Desktop: 1440px 캡처에서 지역 선택 배너와 12개 nav 항목, 중앙 히어로, 하단 프로모션/갤러리/5열 footer를 유지한다.  
Touch/hover: 데스크톱은 hover/focus 플라이아웃, 터치는 click/tap 토글을 기본으로 한다.

## Interaction states
Loading: 원본 HTML에는 검색/장바구니 API URL과 progress indicator 조각이 있으나 로컬은 skeleton/empty 상태로 재구성한다.  
Empty: 장바구니 flyout은 비어 있는 콘텐츠 영역과 item count badge `0+` 구조가 관찰됨.  
Error: 외부 API 의존을 만들지 말고 로컬 데이터 실패 시 비침투형 메시지를 사용한다. 소스 요청 오류, 검색 결과 없음, 미확보 파일은 각각 표시한다. 선택 변경 후 이전 파일 본문을 표시하지 않는다.  
Success: CTA 선택, 검색어 입력, footer accordion 확장, gallery current 변경은 즉시 시각 상태를 반영한다.  
Disabled: CTA/컨트롤 비활성 시 opacity만이 아니라 focus 불가와 `aria-disabled`를 맞춘다.  
Offline/slow network: 로컬 보관 자산이 우선이며 외부 링크 실패는 디자인 시스템 탐색을 막지 않는다.

## Content voice
짧고 제품 중심. Apple 원문을 그대로 많이 복제하지 말고 필요한 라벨만 사용한다. 한국어 계약 문서는 간결한 명령형/서술형을 쓴다. UI 설명문은 앱 안에 과하게 노출하지 않는다. 수집 범위·실패·대체 표시는 숨기지 않고 짧게 제공한다. 파일 개수는 실제 인덱스에서 계산하며 정적 DOM 수집과 동작 검증을 혼동하지 않는다.

## Implementation constraints
Framework: `app/package.json` 기준 React 19.2.0, Vite 6.4.2, `@vitejs/plugin-react` 5.0.4.  
Scope: 사용자 요청에 따라 수집 스크립트, 공개 소스 목록, 디자인 시스템 탐색 UI, 검증 코드와 명시적 로컬 대체 구현을 보완한다.  
Assets: 원본은 `evidence/source` 보관 HTML/스크린샷/metadata를 기준으로 하고, Apple 공개 CSS/JS 링크는 증거로만 참조한다. 내부 소스 접근을 가정하지 않는다.  
Performance: 홈 섹션은 큰 이미지/비디오가 많으므로 lazy loading, 정해진 aspect ratio, reduced motion 정지를 기본으로 한다.  
Tests/screenshots: 구현 후에는 desktop 1440px, mobile 390px, 734px 이하, 1068px 이하, reduced motion, search/menu/bag/footer/gallery 상태를 검증한다.

## Open questions
- [ ] Owner: implementer. Impact: 로컬 스튜디오가 실제 Apple 이미지를 계속 원격 참조할지, 보관된 asset subset만 쓸지 결정 필요.
- [ ] Owner: QA. Impact: 갤러리 자동 전환 시간과 easing은 공개 JS 실행 관찰 없이 정확값 확정 불가.
- [ ] Owner: product. Impact: Apple 원문 라벨 사용 범위와 저작권/브랜드 표시 정책 결정 필요.

## Project integration surface

`#start`에서 설치, import, 타입, 토큰 수정과 실제 설정 폼을 제공한다. `@local/source-design-system`은 React 19용 로컬 작성 패키지이며 Button, SegmentedControl, Toggle, Accordion, ProductTile, Carousel, TextField, Dialog 8개 컴포넌트를 제공한다. 원본 이미지·폰트·배포 번들은 이 패키지에 포함하지 않는다.

`tokens.json`이 단일 토큰 원본이고 생성 CSS와 일치 검사를 유지한다. 라이트/다크 의미 색상은 스코프별로 적용하며 컴포넌트 CSS는 호스트 문서를 reset하지 않는다. 기본 텍스트 대비, native form props/ref, disabled/loading, 키보드 이동, 모달 포커스 복귀, SSR import, strict TypeScript와 320–1440px 독립 소비 앱을 검증한다. 스튜디오 모바일 내비게이션은 닫힌 상태에서 inert 처리하고 열린 상태의 포커스를 유지하며 Escape로 복귀한다.

설치·API·검증 범위의 상세 계약은 `docs/project-integration.md`를 따른다.

## Cross-page motion library

`#motion` is the main collected motion library. `#motion-presets` is the separate three-preset timing playground; `#observed-motion` preserves the full CSS source explorer. The collected library groups by page, viewport, trigger and capture status and supports replay, pause/scrub, source inspection and full code copy. Observed Web Animations/computed changes are distinguished from original declarative scroll attributes, CSS rules and JavaScript API call sites. Schematic replay is explicitly labeled and never described as an exact original scene.

Capture coverage must expose every discovered eligible control outcome and scan the full scroll range per page and viewport. Counts distinguish attempts, state-only changes, observed animation tracks, unavailable targets and declarations. Continue to keep private/transactional state outside original-source recovery claims.
