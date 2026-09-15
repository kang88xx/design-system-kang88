# Design

## Source of truth

**Status: Active — Edition 01 프로젝트 적용 키트 1.0.0 + 소스 카탈로그.** 2026-09-14. 대상은 Framer 템플릿 갤러리에 공개된 [three circles](https://three-circles-wbs.framer.website/) 원페이지 크리에이티브 스튜디오 사이트(제작 Webestica)이며, 실제 스튜디오의 브랜드 가이드나 Framer 프로젝트 파일을 역공학한 결과는 아니다.

요청한 링크의 서빙 HTML(827 KB)과 1440·900·390px의 렌더링 DOM/computed style/스크린샷을 함께 분석했다. 기존 작업 디렉터리는 비어 있었다. 참조한 산출물 포맷은 `family_design` Edition 04다.

- 스타일 근거는 `references/live-source.html`의 Framer 토큰·인라인 변수 선언과 `references/live-*.json`의 computed 값이다. hover·sticky·appear 동작은 `live-components.json`, `live-details.json`에 프로브 결과로 남겼다.
- 키트는 `.tcs` 범위의 CSS와 네이티브 JavaScript로 재구성했다. Framer 런타임 코드·React 컴포넌트·원본 에셋을 복사하지 않았다.
- 생성 순서는 캡처 → 토큰 추출 → 키트 토큰 생성 → 적용 가이드 → 카탈로그 → ZIP/npm → 브라우저 검증이다.

### 근거 등급

| 표기 | 의미 | 신뢰 범위 |
| --- | --- | --- |
| CSS | 서빙 HTML의 Framer 토큰·인라인 스타일 변수 선언 | 선언값은 정확 |
| LIVE | 렌더링된 DOM/computed style/스크린샷 | 기록한 뷰포트·상태에 한정 |
| PROBE | Playwright로 hover·스크롤·리로드 후 측정한 변화 | 측정한 요소에 한정. Framer 변형이 headless에서 발화하지 않은 항목은 "미확정"으로 표시 |
| BUNDLE | 페이지에 포함된 `__framer__appearAnimationsContent`, `__framer__breakpoints` 데이터 | 수치 정확 |
| 제안 | 재사용을 위해 만든 이름, 보완 상태, 구현 규칙 | 원본 구현이라고 주장하지 않음 |

### 소스 인덱스

- [서빙 HTML](references/live-source.html), [실측 보고서](references/live-report.md), [스타일 발췌](references/live-style-excerpts.md).
- [desktop 전체](references/live-desktop.png) 1440×8,734, [tablet](references/live-tablet.png) 900×7,884, [mobile](references/live-mobile.png) 390×9,382. 첫 화면은 `*-first-view.png`, 스크롤 후는 `live-desktop-scrolled.png`.
- 섹션 캡처: `section-hero.png`, `section-project-section.png`, `section-about-section.png`, `section-service-section.png`, `section-award-section.png`, `section-results.png`, `section-testimonial-section.png`, `section-blog-section.png`, `section-contact-section.png`, `section-footer.png`.
- computed 데이터: [desktop](references/live-desktop.json), [tablet](references/live-tablet.json), [mobile](references/live-mobile.json), [컴포넌트·hover](references/live-components.json), [박스 목록](references/live-boxes.json), [세부 프로브](references/live-details.json), [1차 인터랙션](references/live-interactions.json).
- [에셋 매니페스트](references/assets-manifest.json): 77개 파일의 원본 URL·역할·크기·SHA-256. 폰트 5종의 출처.
- 2차 효과 감사: [live-effects.json](references/live-effects.json), [live-effects-2.json](references/live-effects-2.json), [live-nav-cards.json](references/live-nav-cards.json), `nav-scroll-*.png`, `hover-*.png`, `mobile-menu-*.png`.
- 추출 토큰: [tokens.json](tokens.json), [tokens.css](tokens.css). 키트 토큰: [design-system/tokens.json](design-system/tokens.json).

## Brand

**관찰:** 크림색 종이 같은 배경, 점선으로 그린 카드, 한 가지 주황과 한 가지 노랑, 전부 소문자인 큼직한 그로테스크 제목, 글자 사이에 끼어든 원형 사진. 스튜디오 포트폴리오를 "친근하지만 정돈된 작업 노트"처럼 보여준다.

- 성격: 대담함(150px 소문자 제목), 따뜻함(크림·바닐라·버터), 수공예감(점선·회전한 썸네일·클립), 명료함(한 섹션에 한 메시지).
- 시각적 신뢰 장치: 연도가 붙은 프로젝트 목록, 수상 목록, 클라이언트 로고 티커, 숫자 카드, 후기 카드와 평점.
- 피할 것: 그림자·그라디언트 유리 효과, 대문자 제목, 둥근 pill 버튼, 채도 높은 다색 팔레트. 원본은 그림자를 전혀 쓰지 않고 점선과 배경 차이로만 층을 만든다.
- 로고는 세 개의 원(초록 꽃·노란 원·하늘색 꽃)이며 작게 유지한다. 생동감은 hero의 원형 사진과 hover 반응에 맡긴다.

## Product goals

**추론한 목적:** 스튜디오의 작업·서비스·성과를 한 페이지에서 보여주고 통화 예약(cal.com)이나 문의 폼으로 연결하는 포트폴리오 랜딩.

- 주요 목표: 프로젝트 탐색 → 스튜디오 이해(about·services) → 신뢰 확인(awards·results·testimonials) → CTA(book a call / send a message).
- 디자인 시스템 산출물 목표: 색상·타이포·점선 언어를 코드로 재사용하고, Framer 런타임이 담당하던 hover·appear·sticky 동작을 CSS/네이티브 JS로 옮긴다.
- 비목표: 프로젝트 상세·블로그 상세 페이지, 예약·폼 백엔드, Framer 프로젝트 재현, 원본 사이트 변경.
- 완료 기준: 출처와 근거 등급이 명시되고, 핵심 섹션/컴포넌트/모션이 기록되며, CSS·JSON·열람 페이지가 일관된 값을 사용하고, 브라우저 검증이 통과한다.

## Personas and jobs

아래는 카피와 화면 구성에 근거한 추론이며 사용자 연구 결과는 아니다.

| 사용자 | 할 일 | 지원하는 화면 |
| --- | --- | --- |
| 브랜딩을 의뢰하려는 창업자·소규모 브랜드 | 작업 품질과 결과를 빠르게 판단 | Hero, featured project, project list, results |
| 서비스 범위를 확인하는 마케터 | 제공 서비스와 세부 항목 파악 | Services grid, nav card 설명 |
| 신뢰를 확인하는 의뢰인 | 수상·클라이언트·후기 확인 | Awards, ticker, testimonials, rating |
| 연락하려는 방문자 | 통화 예약 또는 메시지 전송 | Sidebar CTA, contact form, footer |

## Information architecture

단일 페이지. 사이드바 nav 카드 4장이 `#project-section`, `#about-section`, `#service-section`, `#contact-section` 앵커로 이동한다.

1. Sticky sidebar: 로고 마크 → projects / about / services / contact 카드 → "reserve a time…" + book a 30-min call → ©2025 + 소셜 4종.
2. Hero: 상태 칩(available for the project) / est.2015 → ∞ 칩, 3행 제목(bold m●ves / inspire / gr○wth), 오른쪽 정렬 설명문, get started now.
3. Projects: featured 카드(the bold coach) → 5행 리스트(art by liora … create with lani) → other ▣ projects + view all projects.
4. About: 성명문(award-winning 강조) → 편지 카드(our journey & vision / a note from the founder / blockquote / 서명).
5. Services: 5 서비스 카드 + ready to grow your brand 다크 카드.
6. Awards: no. of awards 5+ / 2015 – 2025 → 6행 수상 목록 → 클라이언트 로고 티커.
7. Results: 사진 카드 + 100+ / 15+ / 95% stat 카드.
8. Testimonials: sticky 제목 + 4 카드 → 4.5/5 평점 카드.
9. Blog: our blog / view all blogs → 3 카드.
10. Contact: drop us a note 문장형 폼 + 봉투 일러스트.
11. Footer: it's time to level up your brand / book a call / 연락처 / join our creative circle 입력 / 소셜 / designed by webestica, powered by framer.

외부 목적지는 cal.com, instagram, x, youtube, linkedin이며 `./project/*` 상세 6개와 `./blog/*`는 이번 분석 범위에 포함하지 않았다.

## Design principles

1. **종이 위에 점선으로 그린다.** 그림자 대신 `1px dashed #B7B0A5`와 배경 단계(cream → vanilla → white → butter)로 층을 만든다.
2. **한 가지 주황, 한 가지 노랑.** flame은 사이드바·강조 단어·eyebrow·별에만, butter는 nav 카드·CTA·featured 라벨에만 쓴다. 다른 색은 사진과 로고 마크가 담당한다.
3. **모든 글자는 소문자, 자간은 0.** 제목은 Bricolage Grotesque 700/500, 본문은 Be Vietnam Pro 400/600. 숫자와 코드만 예외다.
4. **6px 아니면 2px.** 카드·버튼·이미지·패널은 6px, 칩·라벨은 2px, 원은 50%. 그 사이 값은 없다.
5. **큰 리듬, 느린 피드백.** 섹션 사이는 140–160px, 상호작용은 300–450ms `cubic-bezier(.44,0,.56,1)`로 부드럽게. hover는 색이 아니라 형태(원형 노출, 썸네일 확장, 회전 정렬)로 반응한다.
6. **근거보다 정밀하게 말하지 않는다.** Framer 변형의 시간 값처럼 측정하지 못한 수치는 "제안"으로 표기한다.

## Visual language

### Color

`tokens.css`에는 **원본 Framer 토큰 ID 16개**를 선언값 그대로 보존하고, 읽기 쉬운 별칭(`--tc-*`)을 함께 제공한다. 별칭과 역할 설명은 해석이다.

| 역할 | 별칭 | 원본 토큰(앞 8자) | 값 | 근거 |
| --- | --- | --- | --- | --- |
| 제목·본문·다크 표면 | `ink` | `0450188b` | `#1C1B18` | CSS/LIVE (텍스트 96노드) |
| 보조 텍스트·편지 본문·placeholder | `taupe` | `1c55fc30` | `#675E50` | CSS/LIVE (53노드) |
| 점선 테두리·footer 메타 | `stone` | `d10d7d5c` | `#B7B0A5` | CSS (테두리 140개) |
| 페이지 배경·다크 표면 위 텍스트 | `cream` | `24930864` | `#FFFDEA` | CSS/LIVE |
| 낮은 대비 표면(칩·후기 카드·티커·stat) | `vanilla` | `c4544943` | `#FFF5D4` | CSS/LIVE (배경 28노드) |
| 강조 표면(nav 카드·CTA·featured 라벨) | `butter` | `2f572e33` | `#FFE479` | CSS/LIVE |
| blockquote 배경 | `sand` | `5a2343b2` | `#FBEFC7` | CSS/LIVE |
| 봉투 일러스트 | `peach` | `a7f33d28` | `#FFDDAA` | CSS/LIVE |
| 브랜드 오렌지(사이드바·강조어·eyebrow·별) | `flame` | `a9e7605e` | `#F06231` | CSS/LIVE |
| 흰 카드·번호 배지 | `white` | `6c9b9e36` | `#FFFFFF` | CSS/LIVE |
| footer 입력 배경 | `white-10` | `8170220a` | `#FFFFFF1A` | CSS |
| 모바일 nav 스크림 | `ink-70` | `be18f120` | `#1C1B18B3` | CSS/LIVE |
| 선언만 확인 | `sky` / `lime` / `black` / `transparent` | `ec2e7588` / `e2b67d50` / `5aa2b161` / `d3ba510f` | `#C5E7FF` / `#BCF09C` / `#000` / `#FFF0` | CSS. 렌더링 표면에서 미관찰 |
| 가용 상태 점 | `status-green` | 토큰 없음 | `#67B935` | LIVE computed |

**색 사용 규칙(제안):** flame은 cream 위에서 3.1:1이므로 24px 이상 제목·아이콘·표면에만 쓰고 본문 크기 텍스트로 쓰지 않는다. stone 텍스트는 다크 표면(footer)에서만 쓴다. 키트의 시맨틱 색상(`--tcs-*`)은 이 규칙에 맞춰 조정했고 `tools/build-tokens.py --check`가 26쌍의 대비를 검증한다.

### Typography

| 역할 | Family | Weight | 1440 크기/행간 | 900 | 390 | 출처 |
| --- | --- | --- | --- | --- | --- | --- |
| Hero h1 | Bricolage Grotesque | 700 | 150px / 120px (0.8em) | 90 / 72 | 74 / 59.2 | LIVE |
| Section title h2 | Bricolage Grotesque | 700 | 50 / 55 (1.1em) | 42 / 46.2 | 32 / 35.2 | LIVE |
| Statement h2 | Bricolage Grotesque | 700 | 44 / 48.4 | 38 / 41.8 | 26 / 28.6 | LIVE |
| Card title h3 | Bricolage Grotesque | 500 | 26 / 28.6 | 26 | 22 / 24.2 | LIVE |
| Item title h4·서비스명 | Bricolage Grotesque | 500 | 22 / 26.4 (1.2em) | 22 | 20 / 24 | LIVE |
| Eyebrow h4 | Bricolage Grotesque | 400, flame | 20 / 24 | 20 | 18 / 21.6 | LIVE |
| List title | Bricolage Grotesque | 600 | 18 / 21.6 | 18 | 16 / 19.2 | LIVE |
| Stat number | Bricolage Grotesque | 500 / 700 | 34 / 37.4 · 50 / 55 | — | — | LIVE, transform none |
| Nav label | Be Vietnam Pro | 600 | 18 / 21.6 | — | — | LIVE |
| Body | Be Vietnam Pro | 400 (편지 500) | 16 / 19.2 (1.2em) | 16 | 16 | LIVE |
| Small | Be Vietnam Pro | 400 / 600 | 14 / 16.8 | 14 | 13 / 15.6 | LIVE |
| Micro (번호 배지) | Be Vietnam Pro | 600 | 10 / 11 | — | — | LIVE |
| Button | Be Vietnam Pro | 400 | 16 / 19.2 | — | — | LIVE |

모든 텍스트 스타일이 `letter-spacing: 0em`, 거의 모든 스타일이 `text-transform: lowercase`다(CSS). 숫자·번호 배지는 `none`. Bricolage Grotesque는 400/500/600/700이 로드됐고 800은 선언만 있다. Be Vietnam Pro는 400/500/600이 로드됐고 700/900과 이탤릭은 선언만 있다. Inter는 Framer 기본값으로 선언만 있으며 Geist 700은 Framer 배지, Anonymous Pro는 footer 입력의 코드 폰트다. 한국어 서체 대체는 **문서용 제안**이다.

### Spacing, grid, shape, elevation

- 데스크톱(≥1200px): 사이드바 400px(`sticky; top:0`, 20px 패딩, 360×960 패널) + 콘텐츠 980px(x=420) + 오른쪽 여백 40px = 1440. 태블릿(810–1199px): 콘텐츠 580px 단일 컬럼. 모바일(≤809px): 콘텐츠 370px, 좌우 10px, 72px 주황 상단 바. 브레이크포인트는 BUNDLE 값이다.
- 섹션 패딩(1440): hero `160px 0 140px`, projects/about `20px 0 140px`, services `20px 0 160px`, awards/results/testimonials `0 0 160px`, blog `0 0 140px`, contact `20px 0 0`. 태블릿 80–100px, 모바일 100px.
- 그리드: services·blog 3열 313px gap 20, stat 3열 197px gap 20, project 행 70px(`14px 0`), award 행 50px, about 카드 860×718, contact 카드 740(패딩 60), footer 980×425(`60px 60px 30px`).
- 패딩 값은 20px(카드·사이드바·nav), 60px(큰 카드·footer), 8px 16px(nav 카드), 16px 48px(버튼), 2px 6px(칩)이 반복된다. 8배수 스케일이 아니라 실제 값을 그대로 쓴다.
- radius: 6px(125개), 2px(45개), 50%(14개), 100px/10000px(pill 소수). 키트의 sm·md·lg·xl은 모두 6px로 고정해 원본 규칙을 지킨다.
- elevation: 컴포넌트 그림자 없음(LIVE). `1px dashed #B7B0A5`가 84개 상자와 27개 행 구분선을 그린다. 한 곳에서 `1px dashed #1C1B18`.

### Motion

| 패턴 | Trigger | 변화 | 시간 / easing | 근거 및 제한 |
| --- | --- | --- | --- | --- |
| Hero appear | initial load, `Content Left` | opacity .001→1, y 30→0 | spring stiffness 80 / damping 30 / mass 1, delay .05s (약 1.2s에 95%) | **BUNDLE** + PROBE 프레임 샘플 |
| 텍스트 링크·블로그 제목 | hover | color ink→flame | 300ms `cubic-bezier(.44,0,.56,1)` | CSS + PROBE |
| 표면 | hover/focus | background, box-shadow | 450ms 동일 easing | CSS |
| 입력 포커스 | focus | 밑줄 stone→taupe | 450ms 동일 easing | CSS |
| Reveal 버튼 | hover | `Hover BG` 원 scale 0→8(50→400px), 라벨 vanilla→ink | Framer 변형, 시간 미노출 | PROBE. 키트는 450ms로 재구성(제안) |
| Featured 카드 | hover | 이미지 scale 1→1.05(980×628 클립), 캡션 taupe→ink | 미노출 → 450ms(제안) | PROBE |
| Progressive blur | 정적 | featured 이미지 하단 220px에 8겹 `backdrop-filter: blur` 0.78→100px(2배씩), 각 겹 12.5% 밴드 마스크 | — | LIVE |
| Project 행 | hover | 썸네일 wrap 1→90px, 제목 열 464→365px, 메타 taupe→ink | 미노출 | PROBE |
| Project 이미지 스택 | hover on CTA | 양옆 카드 ±12° 129×168 → 0° 100×150 | 미노출 | PROBE |
| Nav 카드 확장 | **scroll: 해당 섹션이 보일 때** (hover 아님) | 42px → 150(projects·about) / 181(services) / 169(contact)px, 숨은 `Bottom` 블록 노출, `data-highlight=true` | 미노출 → 450ms(제안) | PROBE 6개 스크롤 위치. 1차 문서의 "hover 확장"은 오류 |
| Nav 카드 이미지 fan | hover (projects 카드) | 썸네일 4장(48–55px, radius 15%) 재배열: 바깥 쌍 ±30°→0°, 안쪽 쌍 0°→±30°, translateX ±30→0 | 약 650ms spring | PROBE 14 샘플 |
| Client 티커 | 지속 | 로고 14개, gap 60, 트랙 2,376px, 높이 38 | **40px/s**, hover 시 4px/s(×0.1), 드래그 `ew-resize` | PROBE transform 샘플. 한 바퀴 ≈ 59s |
| Status 펄스 | 지속 | 24px·30px 초록 링 opacity .5→0 | 2050ms `linear()` spring, infinite | LIVE Web Animations |
| Footer 링크 | hover | cream→flame; 소셜 아이콘 opacity 1→.7 | 300ms | CSS + PROBE |
| Testimonial 제목 | scroll | `position: sticky` 500px 제목 위로 카드 스크롤 | — | PROBE |
| 모바일 nav | tap | ink 70% 스크림 0→1 약 450ms; 32px 메뉴 버튼의 20×2 줄 2개가 ±45° X로; 370×324 패널에 172×28 폰 카드 2열 | 스크림 450ms 측정 | PROBE |

스크롤 연동 transform·패럴랙스·커스텀 커서·인라인 SVG는 없다(PROBE). appear는 hero 한 곳뿐이다.

**재사용 제안:** 색 300ms, 형태 450ms, easing은 한 가지만 쓴다. appear는 CSS `translateY(30px)` 1.2s ease-out으로 근사한다(spring 아님). nav 카드 확장은 스크롤스파이(`aria-current`)로 구동하고 hover에 묶지 않는다. `prefers-reduced-motion`에서는 티커·펄스·appear·reveal/fan/scale을 정지하고 최종 상태를 보여준다.

### Imagery / iconography

- 사진: 채도 높은 일러스트풍 인물·풍경(AVIF). hero의 원형 사진 1장(200×200 → 90px 원), 프로젝트 1400×650(6장), 서비스 썸네일 120×120(12장)이 회전(±6–16°)한 스택으로 겹친다. projects nav 카드의 fan은 928×1232 PNG 4장이다.
- 로고 마크: 초록 꽃 · 노란 원 · 하늘색 꽃 세 개의 SVG(`references/assets/logo-*.svg`). 다크 카드 안에서도 같은 색.
- 아이콘: 체크·화살표(9×14, 13×9, 21×11)·소셜 4종(24px)·별점 SVG. 단색 ink, 다크 표면에서 cream.
- 장식: 봉투 SVG 2장(peach), 클립 PNG(33×81), 회전한 vanilla 사각형(about 배경).
- 클라이언트 로고 14종(SVG, 높이 18px 표시), 아바타 7장, 블로그 3장, results 배경 1장. 페이지가 참조하는 이미지 77개 전부를 `assets-manifest.json`에 역할·URL·SHA-256과 함께 보관했다.
- 인포그래픽: nav 카드 안의 since/2015 박스, 체크 목록, discover › design › deliver 경로, 로고+you pill 조합; 본문의 5+ 수상 카운트와 2015 – 2025 연도 칩, 100+/15+/95% stat 카드, 4.5/5 별점 카드.

## Components

| 컴포넌트 | 구조/변형 | 상태와 동작 | 토큰 소유 |
| --- | --- | --- | --- |
| Sidebar | 400px sticky, flame 패널, 로고 마크, nav 카드 4, CTA 블록, 저작권 카드 | 스크롤 고정. 모바일에서 상단 바 + 스크림 패널 | flame, butter, cream, radius 6, 20px |
| NavCard | 320×42 butter, 라벨 18/600 + 26px 흰 번호 배지 | 보이는 섹션의 카드만 확장(150/150/181/169px); projects 카드 hover 시 이미지 fan | butter, micro |
| NavCard 확장 내용 | projects: “showcase of innovation” 16 + “est.15 - 2025” 14 taupe + 4장 fan + “8+ design assets” · about: 흰 박스 92×80(since 18/600 flame, 2015 26/500) + 꽃 체크 3행 · services: 흰 박스 288×54 문장 + “path to success:” + discover › design › deliver(12px 아이콘, 6×12 chevron) · contact: flame pill(로고 50×13) + “+” + ink pill “you” + “let’s talk” 14/600 + 설명 | 인포그래픽 | white, flame, ink, stone |
| NavCard phone | 172×28 butter `4px 12px` radius 2, 라벨 16/600, 20px 배지, 2열 | 모바일 패널 370×324 padding 10 | butter |
| MenuButton | 32×32 cream radius 6, 20×2 taupe 줄 2개(radius 6) | 열림: 16px X(±45°) | cream, taupe |
| StatusDot | 24px 초록 점 + 30px 링 | 2050ms 펄스 | status-green |
| ProgressiveBlur | featured 하단 1100×220, 8겹 backdrop blur + 12.5% 밴드 마스크 | 정적 | — |
| StatusChip | 초록 점 + 14px 텍스트 | 장식 | status-green, vanilla |
| Hero | 3행 150px 제목 + 원형 이미지/배지/겹친 원, 오른쪽 설명, accent 버튼 | appear spring | hero type, butter |
| Button reveal | ink 배경, vanilla 텍스트, `16px 48px`, 51px, radius 6 | hover 원형 노출 + 텍스트 ink | ink, vanilla, butter |
| Button accent | butter 배경, ink 텍스트, 같은 패딩 | hover 미관찰 | butter |
| Button small | butter `15px 30px` 49px (let's talk) | — | butter |
| Chip | vanilla 2px `2px 6px` 14px; accent는 butter; pill은 flame/ink 100px `4px 12px` | — | vanilla, butter, flame |
| Card | 1px dashed stone, radius 6, padding 20; cream/vanilla/white | — | stone |
| DarkCard / Footer | ink 배경 radius 6, padding 20 / `60 60 30` | 내부 butter 버튼, 반투명 입력, 링크 hover flame, 소셜 opacity .7 | ink, butter, white-10, flame |
| FeaturedCard | 980×628 이미지 + butter 라벨 + 하단 캡션 + progressive blur | hover 이미지 1.05, 캡션 taupe→ink | butter, ink |
| ListRow | 70px, 제목 18/600 · 메타 14 taupe · 연도, 점선 하단 | hover 썸네일 1→90px, 메타 taupe→ink | stone, taupe |
| ImageStack | 3장 겹침, 양옆 ±12° | hover 정렬 | radius 6 |
| ServiceCard | 313×300 점선, 썸네일 스택 70px, 제목 22/500, 칩 목록 | 링크 hover 미관찰 | stone, vanilla |
| Blockquote | sand 배경 점선 radius 6 padding 20, 16/600 | — | sand |
| StatCard | 197×176 padding 20, 숫자 34/500, 설명 14 taupe | — | white/vanilla |
| Ticker | vanilla 6px `10px 0` 38px, 로고 18px, gap 60 | 40px/s, hover 4px/s, 드래그 | vanilla |
| TestimonialCard | 420px vanilla 점선, 이름 22/500, 직함 14, 100px 이미지, 본문 16 | sticky 제목 위로 스크롤 | vanilla, stone |
| RatingCard | 4.5/5 50/700, flame 별, 설명 | — | flame |
| BlogCard | 313×318 점선 padding 20, 제목 22/500, 점선 구분, 칩+날짜, 이미지 6px | hover 제목 flame 300ms | stone, vanilla |
| SentenceForm | white 카드 padding 60, 문장 사이 밑줄 입력, textarea 100px, submit `24px 74px` | 포커스 밑줄 taupe 450ms; 검증 상태는 제안 | stone, taupe |
| FooterInput | white-10 배경, 1px taupe, radius 6, 모노 placeholder stone | — | white-10, taupe |

## Catalog architecture

`index.html`은 색상 표본만 나열하지 않고 **원본 캡처·동작하는 재구성·설명·에셋**을 같은 화면에서 비교한다.

- `#scene-atlas`: 12개 영역의 원본 캡처와 대응 구현 링크(`source-coverage.json`).
- `#motion`: 14개 조작 가능한 재구성. 각 카드는 trigger, 근거 등급, 원본 수치/제안 여부를 표시하고 상단 "모션 줄이기"로 최종 상태를 확인한다.
- `#colors`: 18개 표본(토큰 16 + computed 2). 클릭하면 hex를 복사한다.
- `#type`, `#layout`, `#components`, `#assets`, `#evidence`, `#handoff`.
- `system.html`은 키트 `examples/starter.html`의 본문을 스튜디오 셸로 감싼 적용 가이드다(`scripts/build-system-guide.py`). `layout-recipes.html`은 5개 레이아웃을 실제 반응형 CSS로 제공한다.

## Handoff and verification

- 키트: `design-system/` (styles.css 23 KB, index.js, index.d.ts, tokens.json/css, README, examples, tools). `three-circles-project-kit.zip`, `three-circles-system-1.0.0.tgz`.
- 검증: `scripts/verify-catalog.cjs`가 index/system/layout-recipes/starter를 1440/768/390px에서 열어 콘솔 오류, 가로 오버플로, 탭 키보드, 대화상자 Escape, 다크 테마, 폼 검증, 모션 감소, 모바일 nav를 검사하고 `references/review/`에 캡처와 JSON을 남긴다.
- 한계: nav 카드 확장·fan·featured hover의 정확한 easing은 Framer 런타임 값이라 미노출(측정한 소요 시간만 기록). 프로젝트/블로그 상세 페이지 미수집. 원본 폰트·이미지는 키트에 포함하지 않으며 카탈로그는 Google Fonts에서 로드한다.
