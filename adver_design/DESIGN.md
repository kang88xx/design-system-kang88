# Design

## Source of truth

- **상태:** Active — 1.0.0 재사용 런타임 + 레퍼런스 라이브러리; 원본 미확인 값은 제안
- **기준일:** 2026-09-07
- **대상 표면:** 디자인 시스템 카탈로그와 모션·인터랙션 라이브러리, 독립 실행 HTML, 공통 토큰, 프로젝트 적용 안내(`use.html`)와 소비 스타터(`starter/index.html`). 전체 광고 랜딩 재구성(`landing.html`)과 소스 탐색기(`sources.html`)를 포함한다.
- **검토한 근거:**
  - [공식 X Business 광고 페이지](https://business.x.com/en/advertising)의 1440px/375px 라이브 DOM 계산값: [`references/live-source.json`](references/live-source.json)
  - 제공된 녹화본의 길이·해상도: [`references/video-metadata.json`](references/video-metadata.json)
  - 제공된 녹화본 0초 프레임: [`references/frames/t00.jpg`](references/frames/t00.jpg)
  - 제공된 녹화본의 접촉 시트: [`references/contact-sheet.jpg`](references/contact-sheet.jpg)
- **근거 구분:** 라이브 값은 `live-source.json`에 검증된 관찰값으로 기록한다. 이 문서와 `design-system/`의 접근성·반응형 규칙은 프로젝트 적용을 위한 **권장값**이다. 접촉 시트는 화면 구성과 전역 다크 모드의 존재를 확인하지만, 프레임별 정확한 수치·전환 타이밍의 근거는 아니다.

## Brand

- **성격:** 차분하고 직접적이며 편집적인 정보 밀도. 흑백과 얇은 선으로 신뢰를 만들고, 큰 제목으로 핵심 메시지를 먼저 전달한다.
- **신뢰 신호:** 넉넉한 여백, 명확한 계층, 절제된 표면색, 설명 가능한 수치와 CTA.
- **피할 것:** 불필요한 그라데이션, 장식용 그림자, 다수의 강조색, 과도한 모션, 레퍼런스에 없는 브랜드 자산이나 카피의 단정적 재현.

## Product goals

- **목표:** 디자이너·개발자가 구성 요소를 검색하고 실행 화면, 전체 코드, 의존 파일, 원본 근거를 한 흐름에서 확인해 가져갈 수 있게 한다. 전체 페이지는 적용 맥락을 보여준다.
- **비목표:** 비공개 저장소·서버 코드까지 추출했다고 주장하거나, 녹화본에 없는 인터랙션을 원본 사실처럼 표현하는 일. 공개 코드·폰트는 원본 연구 아카이브에 저장하며 실행 UI에는 로컬 재구성과 시스템 폰트를 사용한다.
- **성공 신호:** 제목·설명·주 CTA를 스크롤 없이 찾을 수 있고, 키보드와 터치로 모든 행동을 실행할 수 있으며, 토큰만 바꿔도 라이트/다크 전역 테마와 타이포그래피의 일관성이 유지된다.

## Personas and jobs

- **주 사용자:** 레퍼런스를 실제 프로젝트에 적용하는 디자이너와 프론트엔드 개발자.
- **사용자 과업:** 필요한 요소 검색 → 미리보기 조작 → 파일별 전체 코드 확인/복사 → 의존 파일과 출처 확인 → 다운로드와 프로젝트 적용.
- **이용 맥락:** 데스크톱에서 비교·검토하고, 모바일에서는 짧게 읽고 CTA를 누른다. 실제 사용자 조사 데이터는 아직 없다.

## Information architecture

- **데스크톱:** 고정 또는 지속 노출되는 좌측 탐색 → 본문 헤드라인 → 기하학적 히어로 → 설명과 CTA → 6개 혜택 그리드 → 광고 크레딧/orbit 아트 → 계단형 지표 카드 → 4단계 캠페인 탭 → 광고 형식 카드 그리드 → 2열 문의 폼 → FAQ 아코디언 → 푸터 순서로 구성한다.
- **모바일:** 헤더와 메뉴 트리거 → 본문 헤드라인 → 히어로 → 설명과 CTA → 2열 또는 1열 카드의 순서로 재배치한다.
- **콘텐츠 계층:** 페이지 제목 1개(H1), 섹션 제목(H2), 카드 제목(H3), 짧은 설명, 행동 버튼 순서다.
- **관찰 근거:** 0초 프레임에는 좌측 탐색, 큰 두 줄 헤드라인, 연한 회색 기하학 캔버스, 설명과 두 CTA가 보인다. 접촉 시트는 위에 열거한 혜택·크레딧·지표·탭·형식·문의·FAQ·푸터 화면을 확인한다. 정확한 원본 duration/easing은 미확정이다. 실행 가능한 재구성 사양은 `MOTION.md`와 두 kit의 CSS/JS에 명시한다.

## Design principles

1. **메시지를 먼저 보인다.** 큰 제목, 짧은 설명, 한 개의 주 CTA를 한 흐름으로 둔다.
2. **색보다 구조로 구분한다.** 표면색 차이와 1px 구분선, 간격으로 그룹을 구분한다.
3. **한 번에 한 행동을 강조한다.** 검은 pill은 주 행동에만 쓴다.
4. **관찰과 적용을 분리한다.** 라이브 원본 값은 기록하고, 접근성·호환성 요구는 별도 권장 토큰으로 적용한다.

## Visual language

- **색상:** 검증된 라이브 중립색은 `#fff`, `#f2f2f2`, `#ebebeb`, `#000`, `#0009`, `#0000001a`다. 프로젝트 토큰은 [`design-system/tokens.json`](design-system/tokens.json)과 [`design-system/tokens.css`](design-system/tokens.css)를 사용한다.
- **타이포그래피:** 라이브 페이지는 `xVF`와 `xVFDisplay`를 사용하지만 프로젝트에는 배포 가능한 권한이 확인되지 않았다. `--font-body`와 `--font-display`는 명시적인 시스템 폰트 fallback만 사용한다. 관찰된 제목은 48/52, 섹션 제목은 32/36, 작은 레이블은 13/20이다.
- **간격:** 권장 4px 기반 스케일을 사용한다. 라이브에서 확인한 주요 값은 16px 가로 거터, 24/48px 카드 내부 간격, 48px 행 간격, 56px 본문 섹션 간격, 80px 데스크톱 카드 섹션 세로 패딩이다.
- **형태와 깊이:** 표면은 평면으로 유지하고 그림자를 기본값으로 두지 않는다. 주 CTA만 `--radius-pill`을 쓴다. 카드에는 `1px solid var(--color-border)` 상단 구분선을 사용한다.
- **테마:** 접촉 시트에서 푸터에 도달한 뒤 페이지 전체가 다크 모드로 바뀌고, 이어서 위쪽 콘텐츠를 다시 스크롤하는 모습이 확인된다. 이는 섹션마다 교차하는 다크 배경이 아니라 **전역 테마 변경**으로 취급한다. 다크 토큰의 정확한 색상값과 전환 트리거는 아직 확정하지 않는다.
- **모션:** 영상에 탭과 전역 테마 변경은 보이지만, 정확한 duration/easing은 확인되지 않았다. 기본 상태 전환은 150–200ms를 출발점으로 하고, 선 그리기·펄스·궤도 등 연출은 각 kit의 제안 시간을 사용한다. `prefers-reduced-motion`과 일시정지를 존중한다.
- **이미지·아이콘:** 0초 프레임의 히어로는 얇은 선과 원형 기하 요소가 있는 연회색 캔버스다. SVG/코드 기반 도형을 우선하며, 원본 영상·프레임은 출처가 명시된 연구 자료로 보관하며 제품 자산으로 자동 전용하지 않는다.

## Components

| 구성요소 | 변형/상태 | 토큰 소유권 |
| --- | --- | --- |
| Page shell | 데스크톱 좌측 탐색, 모바일 상단 헤더 | `--content-max`, `--space-*`, 색상 토큰 |
| Hero | 제목, 기하 도형 캔버스, 설명, CTA 묶음 | display/body 글꼴, 표면·간격 토큰 |
| Primary button | 기본, hover, focus-visible, disabled | `--color-action`, `--color-action-hover`, `--radius-pill`, `--touch-target-min` |
| Secondary button | 기본, hover, focus-visible, disabled | `--color-surface`, `--color-surface-hover`, `--color-text`, `--radius-pill` |
| Editorial card | 2열/8열, 상단 구분선, 제목·설명 | `--color-border`, `--space-4`, `--space-6`, `--space-12` |
| Sidebar/navigation | 현재 항목, hover, focus-visible, 축소 메뉴 | `--color-muted`, `--color-text`, `--focus-ring-width` |
| Benefit grid | 6개 항목, 아이콘/도형, 제목·설명 | grid gap, `--color-border`, `--font-size-label` |
| Credit orbit art | 크레딧 CTA, 궤도형 기하 도형 | `--color-surface`, `--color-border`, `--radius-pill` |
| Metric cards | 계단형 카드, 수치, 보조 설명 | `--color-surface`, `--color-border`, heading/body 토큰 |
| Campaign tabs | 4단계 탭, 선택/비선택, 연결된 예시 패널 | `--color-text`, `--color-muted`, `--color-border`, focus 토큰 |
| Format card grid | 광고 형식 카드, 이미지/예시, 제목·설명 | surface, border, spacing 토큰 |
| Contact form | 좌측 전문가 소개, 우측 입력·제출 | input, action, focus, touch 토큰 |
| FAQ accordion | 질문, 펼침/접힘, 답변 | border, focus, reduced-motion 규칙 |
| Global theme switch | light/dark, 저장된 선택 또는 시스템 기본값 | 의미 기반 `--color-*` 토큰; 다크 값은 미확정 |
| Footer | 링크 열, 테마 변경 진입점 후보 | text/muted/border, focus 토큰 |

라이브 관찰값: 원본 주 버튼은 데스크톱 24px, 모바일 36px 높이다. 프로젝트 컴포넌트의 최소 클릭/탭 영역은 이보다 큰 44px으로 한다.

## Accessibility

- **목표:** WCAG 2.2 AA를 기본 기준으로 한다.
- **키보드와 포커스:** 모든 링크·버튼·메뉴는 Tab으로 도달하고, `:focus-visible`에서 2px 외곽선과 2px 여백을 보여 준다. 메뉴 트리거는 `button`과 올바른 확장 상태를 사용한다.
- **대비:** 기본 본문에는 `--color-text`를 사용한다. `--color-muted`는 큰 텍스트 또는 보조 정보에만 쓰고, 작은 텍스트의 AA 대비는 실제 배경에서 검사한다.
- **터치:** 권장 최소 터치 영역은 44×44px이다. 시각적 pill 크기가 작아도 외부 hit area 또는 padding으로 이를 충족한다. 관찰된 원본 데스크톱 24px/모바일 36px 버튼은 프로젝트의 최소값으로 채택하지 않는다.
- **의미와 감각:** 제목 레벨을 건너뛰지 않고, 기하 히어로는 장식이면 `aria-hidden="true"`로 둔다. 모션은 `prefers-reduced-motion: reduce`에서 중지 또는 단순화한다.

## Responsive behavior

- **권장 구간:** 0–767px 모바일, 768–1023px 태블릿, 1024px 이상 데스크톱. 이는 프로젝트 권장 기준이며 라이브 페이지의 내부 breakpoint를 측정한 값은 아니다.
- **폭과 거터:** 콘텐츠는 `--content-max: 1120px`을 넘지 않으며, 모바일 좌우 거터는 16px이다. 라이브 데스크톱은 패딩을 포함한 1152px 컨테이너를 사용했다.
- **레이아웃:** 데스크톱에서 좌측 탐색과 넓은 히어로를 사용하고, 모바일에서는 탐색을 접고 본문을 한 열로 둔다. 카드 그리드는 관찰된 375px에서 2열/16px gap이며, 매우 좁은 폭에서는 1열로 전환한다.
- **입력 방식:** hover는 보조 피드백만 제공하고, focus/active와 44px 터치 영역은 모든 화면에서 제공한다.

## Interaction states

- **Loading:** 레이아웃 크기를 유지하는 중립색 skeleton 또는 텍스트 상태를 사용한다. 의미 없는 도형의 반복 애니메이션은 피한다.
- **Empty:** 원인과 다음 행동을 짧게 설명하고, 한 개의 회복 행동을 제공한다.
- **Error:** 오류를 행동 가까이에 텍스트로 표시하고 재시도 수단을 제공한다. 색상만으로 오류를 전달하지 않는다.
- **Success:** 완료 메시지와 다음 단계 링크를 제공하며, 자동으로 화면을 이동하지 않는다.
- **Disabled:** disabled 상태는 명시적 이유가 필요할 때만 사용하며, keyboard focus 정책을 컴포넌트별로 문서화한다.
- **느린 네트워크/오프라인:** 이미 읽은 콘텐츠는 유지하고, 새 요청의 지연·실패 상태와 재시도 버튼을 제공한다.
- **탭/아코디언:** 선택 탭과 펼쳐진 질문은 텍스트·상태 속성·시각 표지를 함께 바꾸며, `aria-selected`/`aria-expanded`와 키보드 조작을 제공한다.
- **전역 테마:** 라이트/다크 변경은 문서 루트에서 수행한다. 접촉 시트로 존재는 확인됐으나, 푸터의 어떤 제어가 트리거인지는 추정하지 않는다.

## Content voice

- 짧고 구체적인 동사로 시작한다. 예: “시작하기”, “상담 요청”, “형식 보기”.
- 제목은 결과나 가치를 말하고, 설명은 근거 또는 다음 행동을 보탠다.
- CTA 하나를 주 행동으로 지정하고, 나머지는 중립적인 보조 행동으로 둔다.
- 레퍼런스의 영문 카피와 X 상표 문구를 제품 카피로 그대로 재사용하지 않는다.

## Implementation constraints

- 프레임워크는 아직 정해지지 않았다. 토큰은 순수 JSON과 CSS custom properties로 제공해 어떤 프레임워크에서도 쓸 수 있게 한다.
- 외부 글꼴이나 패키지를 추가하지 않는다. 원본 `xVF`/`xVFDisplay`는 라이브 관찰값으로만 기록한다.
- 색·타입·간격은 컴포넌트 하드코딩 대신 `design-system/tokens.css` 변수를 사용한다.
- 전역 테마는 `data-theme` 또는 동등한 루트 속성으로 적용한다. 다크 토큰은 `tokens.json`의 `dark` 그룹과 `tokens.css`의 `[data-theme="dark"]`에 구현 제안으로 제공한다. 원본 실측값으로 취급하지 않는다.
- 이미지 기반 기하 히어로가 필요하면 SVG 또는 CSS로 렌더링하고, 성능을 위해 큰 비디오 자동 재생에 의존하지 않는다.
- 구현 후에는 375px 및 1440px 화면, 키보드 탭 순서, focus-visible, reduced motion, 버튼 44px hit area를 확인한다.

## Open questions

- [ ] **Owner: 제품 담당자. Impact: 높음.** 이 디자인 시스템을 적용할 실제 제품명·주 사용자·전환 목표는 무엇인가?
- [ ] **Owner: 디자인/개발. Impact: 중간.** 정확한 원본 duration/easing과 미관찰 상태를 추가 확인할 것인가? 현재는 영상 기반 재구성과 적용 제안으로 구현되어 있다.
- [ ] **Owner: 브랜드 담당자. Impact: 중간.** 사용할 로고, 이미지, 허가된 글꼴과 브랜드 카피는 무엇인가?
- [ ] **Owner: 접근성 담당자. Impact: 중간.** 지원 브라우저와 보조기기 범위, 다국어 요구 사항은 무엇인가?

## Reference library and showcase

- [`index.html`](index.html): 한국어 디자인 시스템 예시. 제품 복제본이 아니라 레퍼런스 및 토큰 검토용 카탈로그다.
- [`references/manifest.json`](references/manifest.json): 출처, SHA-256, 영상 메타데이터와 정확한 0–48초 프레임 목록.
- [`references/observations.md`](references/observations.md): 시간별 관찰과 신뢰도.
- 카탈로그 전용 편집 제목은 최대 98px, 반응형 분기는 700/1100px이다. 위의 48px 제품 제목 및 권장 제품 breakpoint와 용도가 다르다.
- 카탈로그는 모바일에 가로 내비게이션을 쓰며, 테마는 현재 페이지에서만 유지한다. 제품의 축소 메뉴나 테마 영구 저장은 예시에 구현하지 않는다.
- `tokens.json`은 `value`/`description` 형태의 프로젝트 중립 JSON이며 특정 DTCG 스키마 호환을 주장하지 않는다.

## Motion and interaction implementation

실행: [`motion.html`](motion.html) · 샘플 가이드: [`MOTION.md`](MOTION.md) · 적용 계약: [`USAGE.md`](USAGE.md) · 근거: [`references/motion-audit.md`](references/motion-audit.md).

- 6개 시각 효과와 7개 인터랙션은 실제 SVG/CSS/JS로 실행한다. 영상이나 GIF를 예제 대신 재생하는 방식이 아니다.
- 원본에서 관찰된 패턴과 제안 모션은 각 예제 및 coverage 표에 구분한다. 중앙 펄스는 관찰, count-up·fade-up·hover·캐러셀 자동 재생은 제안이다.
- `ReferenceMotion`/`ReferenceInteractions`의 mount/replay/pause/speed API와 cleanup 계약을 제공한다. `USAGE.md`가 통합·어댑터·소유권/해제 계약의 기준이고 `MOTION.md`는 샘플 동작을 설명한다.
- 독립 HTML은 모든 코드가 내장된다. 빌드 스크립트로 코드 보기·샘플·ZIP을 동일 소스에서 생성한다.
- Motion Lab은 넓은 상단 탐색과 sticky 재생 바를 쓴다. 기존 Foundations 카탈로그의 좌측 탐색과 구분되는 작업 도구 레이아웃이다.
- 폼 전송 결과와 광고 데이터는 로컬 예시다. 제품 연결 시 별도의 데이터/API 구현이 필요하다.


## Source explorer and complete-page contract

- **진입점:** 제품 적용은 `use.html` → 런타임 ZIP/스타터, 소스 검토는 `sources.html`. `index.html`(디자인 규칙), `motion.html`(13개 실행 예제), `landing.html`(전체 랜딩 재구성)을 상단에서 연결한다.
- **정보 구조:** 검색·분류·목록 → 미리보기 / 소스 코드 / 출처·적용 방법. 데스크톱은 좌측 목록과 우측 상세, 720px 이하에서는 목록 위·상세 아래로 배치한다.
- **표시 규칙:** 수집 원본 / 관찰 기반 재구성 / 대체·제안 / 프로젝트 문서를 구분한다. 각 실제 파일은 생략 없는 전체 텍스트, 바이트 수, SHA-256, 다운로드를 제공한다. 섹션 마크업과 독립 HTML은 구분한다.
- **탐색 UX:** 파일명·효과 검색, 분류 초기화, 검색 결과 수, 공유 가능한 item/view URL, 키보드 탭 이동, 가로 스크롤 없는 모바일 레이아웃, 코드 자동 줄바꿈, 복사 실패 대안을 제공한다.
- **미리보기:** 로컬 구현만 iframe으로 실행한다. 수집한 외부 HTML·JS는 텍스트로 표시한다. 바이너리는 원본 파일 다운로드를 제공한다.
- **의존성:** 외부 패키지 추가 없이 기존 tokens를 공통으로 사용한다. 두 runtime kit는 독립 모션 샘플, page-kit은 전체 페이지, sources는 탐색 UI를 담당한다.
- **수집 범위:** `references/source-audit/manifest.json`, `references/source-coverage.json`이 공개 원본 수집 및 대체 현황을 기록한다. 제공 녹화본과 현재 공개 사이트는 시점이 다르므로 동일 소스라고 단정하지 않는다.
- **배포:** `scripts/build-release.py`로 토큰 → 샘플 → 런타임 ZIP → 소스 아카이브를 순서대로 재생성한다. 전체 ZIP에는 구현·샘플·수집 원본·문서·검증 스크립트를 포함하고, 변경 중인 테스트 출력과 런타임 상태는 제외한다.
- **검증:** 기존 13개 기능 검사에 추가해 소스/디스크 일치, 복사·다운로드, 검색·상태, 파일 실행, 전체 페이지 반응형·테마·폼·탭·FAQ를 검증한다.


## Consumer runtime 1.0.0

- **적용 경계:** `releases/adver-system-1.0.0.zip`은 작성한 13개 컴포넌트와 scoped 토큰, 스타터, API 문서만 포함한다. 원본 연구 자료와 독립 페이지용 `page-kit.*`는 제외한다.
- **토큰 기준:** `tokens.json`을 수정하고 `scripts/build-release.py`로 `tokens.css` 및 `tokens.scoped.css`를 생성한다. 기존 앱에는 `.adver-system`과 scoped CSS를 사용한다. 전역 CSS는 전체 페이지/데모용이다.
- **테마:** 소비 영역의 light/dark/system 및 중첩된 명시적 테마를 지원한다. 브랜드 예제는 action/on-action 쌍을 함께 변경한다. 호스트 앱의 토큰을 덮어쓰지 않는다.
- **컴포넌트 상태:** 제품용 form/buttons는 production 모드이고 실제 onSubmit/onAction을 연결한다. 콜백 누락은 구성 오류로 표시하고, 중복 요청·abort·늦은 응답을 처리한다. 데모 성공을 실제 서버 성공으로 취급하지 않는다.
- **호스트 계약:** 각 컨테이너 mount/cleanup, 중첩 소유권, 내부 ID 재연결을 제공한다. 문서 전체 재생 제어와 예약 클래스/변수는 `USAGE.md`에 명시한다. Shadow DOM 수준의 격리나 임의 DOM 삭제 자동 해제는 제공하지 않는다.
- **배포 검증:** ZIP을 별도 임시 폴더에 풀어 외부 요청 없는 실행, 13종·복제 인스턴스, 콜백 연결, 테마, 375/768/1440px, 호스트 스타일 보존 및 파일 해시를 검사한다. 검증 결과와 독립 코드/아키텍처 리뷰는 `references/verification/release/`에 둔다. Chromium이 검증 대상이며 전체 WCAG 인증 또는 Safari/Firefox 검증으로 표현하지 않는다.


## Studio shell

- **규격:** 뷰어 셸(사이드바·상단바·워크스페이스·푸터)은 공통 Apple 스튜디오 셸 규격 [`../All/shell/SPEC.md`](../All/shell/SPEC.md)를 따른다. 뼈대는 `studio-shell.css`와 `studio-shell.js`가 담당하며 두 파일은 공통 셸의 복사본이므로 이 폴더에서 수정하지 않는다.
- **적용 범위:** `index.html`(개요), `sources.html`, `use.html`, `motion.html`이 같은 사이드바(WORKSPACE 01~07 / PROJECT 08~09, Motion Lab은 THIS PAGE 10~11 추가)와 같은 상단바를 쓴다. `landing.html`과 `starter/`는 독립 템플릿이므로 셸 대상이 아니다.
- **브랜드 매핑:** `studio-brand.css`가 `tokens.css`의 `--color-*`를 셸 변수 `--as-*`에 연결한다. 매핑은 `body`에 선언하므로 `body[data-theme="dark"]`에서 셸도 함께 어두워진다. 모노스페이스 라벨 서체는 `--as-font-mono`다.
- **도구 위치:** 다크 테마 토글(`#theme` / `#source-theme` / `#lab-theme`), 소스 검색(`#source-search`), 샘플 검색(`#sample-search`)은 상단바 `.as-topbar-tools`로 옮겼고 id·이벤트·동작은 그대로다. `Export tokens`는 `design-system/tokens.json`을 내려받는다.
- **재생성:** 페이지 HTML을 바꾸면 소스 탐색기 카탈로그가 어긋나므로 `python3 scripts/build-library.py`(또는 `scripts/build-release.py`)로 `source-catalog.js`·`source-originals.js`·전체 소스 ZIP을 다시 만든다.
