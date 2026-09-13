# Stripe design sources (stripe.com)

[stripe.com](https://stripe.com/) 마케팅 사이트의 디자인 소스를 수집한 로컬 카탈로그입니다. 디자인 시스템을 만들기 위한 원재료로, **토큰 · 타이포 · 박스(카드/서피스) 소스 · 일러스트 · 인터랙션 · 모션 · 이펙트**를 우선으로 모았습니다. 아이콘은 2026-07-15 수집분(`/Volumes/T9/02_Source/Icon_Stripe`, 193개)을 그대로 재사용했습니다.

수집일: 2026-09-10. 수치는 [docs/SOURCE_COVERAGE.md](docs/SOURCE_COVERAGE.md)에서 생성됩니다.

## 열기

```bash
cd ~/Desktop/stripe-design
python3 -m http.server 8094 --bind 127.0.0.1
# http://localhost:8094/viewer/
```

`viewer/index.html`을 직접 열어도 되지만(file://), 폰트·이미지 로딩은 로컬 서버가 안정적입니다. 탭: 개요 · 색상 · 타이포 · 간격/레이아웃 · **박스 소스** · **이펙트** · **모션** · **일러스트** · **인터랙션** · 컴포넌트(라이브 렌더) · 아이콘/로고 · 출처. 박스·모션·인터랙션 탭에서는 정지 이미지 대신 실제 녹화한 루프 영상이 자동 재생됩니다.

## stripe.com에는 두 시스템이 공존한다

| | HDS (새 시스템) | 레거시 MktRoot |
| --- | --- | --- |
| 페이지 | 홈, Billing, Radar, About, Jobs, Contact sales, Sessions 등 | Payments, Connect, Pricing, Terminal, Issuing, Use cases… 대부분 |
| CSS | `b.stripecdn.com/mkt-ssr-statics` (Next.js, `@layer base/app`) | `b.stripecdn.com/mkt-statics-srv/assets/v1-*.css` (컴포넌트별 파일) |
| 토큰 | `--hds-color-*`, `--hds-font-*`, `--hds-space-*`, `--hds-shadow-*` (light/dark, accent, 640/940 반응형) | `.MktRoot` + `html` 변수, `.theme--Light/Dark/SemiDark/White/Transparent`, `.accent--*`, `.flavor--*` (그라데이션) |
| 대표 색 | 텍스트 `#061b31`, 보조 `#50617a`, 브랜드 `#533afd`, 배경 `#f8fafd`/`#e5edf5` | 텍스트 `#0a2540`, 본문 `#425466`, 보조 `#727f96`, 브랜드 `#635bff`, 배경 `#f6f9fc` |
| 버튼 | `.hds-button` 48px, radius 4px, 300ms `cubic-bezier(.25,1,.5,1)` | `.CtaButton` 33px pill(16.5px), `--hoverTransition: 150ms cubic-bezier(.215,.61,.355,1)` |
| 섹션 | 96px 상하 간격, 12컬럼/16px gap | `skewY(-6deg)` 앵글 섹션, 1080px 레이아웃, 4컬럼 |

## 재사용 파일

| 파일 | 내용 |
| --- | --- |
| `data/curated/tokens.css` / `tokens.json` | HDS 토큰 전체 (`:root` light, `.hds-mode--dark`, `.hds-accent--*`, 반응형) + `@font-face` |
| `data/curated/hds-components.css` | HDS 컴포넌트 CSS 원문 (button, link, tag, textinput, checkbox, switch, select, dialog, tooltip, accordion, stat, resource-card, navigation-menu …) `@layer hds` |
| `data/curated/legacy-tokens.css` / `legacy-tokens.json` | 레거시 루트 토큰, 테마 9종, accent 11종, gradient flavor 10종 |
| `data/curated/legacy-components.css` | 레거시 컴포넌트 원문 (Button, CtaButton, Copy*, Section, Card, Badge, Accordion, Tabs, Table, SiteHeader…) + keyframes |
| `data/curated/recipes.css` | **박스·이펙트 독립 레시피** (`.box-*`, `.fx-gradient-text`, `.fx-glass`, `.fx-blob-*`, `.fx-gradient-border`, `.fx-skew-section`, 그림자 스케일) |
| `data/curated/boxes.json` | 박스 소스: 스크린샷 · computed style · HTML · CDP 매칭 CSS(::before/::after, keyframes) · 자식 레이아웃 · 호버 변화량 |
| `data/curated/effects.json` | 이펙트: gradient-text, conic/radial/linear gradient, backdrop-filter, mask, clip-path, blend, transform, pseudo-layer, filter |
| `data/curated/motion.json` | `@keyframes` 전체(HDS 40 · 레거시 33 · 기타), 실행 중 관측 CSS 애니메이션, WAAPI 키프레임/타이밍, transition 통계, 이징 규칙, 프레임 시퀀스 |
| `data/curated/illustrations.json` | 일러스트 매니페스트 (원본 URL ↔ 다운로드 파일, 기법, 스크린샷) |
| `data/curated/interactions.json` | 버튼/입력/내비 상태, 탭·아코디언·캐러셀 전후, 박스 호버, **루프 클립 목록** |
| `captures/clips/` | **실제 인터랙션·모션 루프 영상** (mp4 15fps, 요소 크롭, 커서 합성, 클립당 20~70KB): 박스 hover, 탭/아코디언/캐러셀/세그먼트 클릭, 메가메뉴, 버튼·링크 hover, CSS/WAAPI 애니메이션, 히어로 캔버스, DOM 그래픽 |
| `assets/stripe/illustrations/` | 다운로드한 이미지·GIF·비디오·Lottie + `inline/` SVG |
| `assets/stripe/icons/`, `assets/stripe/svg/`, `assets/stripe/fonts/`, `assets/stripe/css/` | 아이콘 193, 로고 SVG, 폰트(뷰어용), 원본 CSS 606개 |
| `captures/` | pages · components · boxes · effects · motion · illustrations · interactions · viewer 스크린샷 |

프로젝트에 가져올 때: HDS 계열은 `tokens.css → hds-components.css → recipes.css` 순서로, 레거시 계열은 `legacy-tokens.css → legacy-components.css` 순서로 로드합니다. 라이선스 범위는 [docs/LICENSE_AND_ATTRIBUTION.md](docs/LICENSE_AND_ATTRIBUTION.md).

## 재생성

기존 Playwright(`/Users/henry/office/node_modules/playwright`, Chromium 1234)를 재사용하며 아무것도 설치하지 않습니다. 필요하면 `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE`을 지정합니다.

```bash
node scripts/collect-stripe.mjs --pages=70        # 페이지 크롤: computed style, 스크린샷, CSS 저장
node scripts/capture-components.mjs               # 버튼/입력/내비/푸터 상태 캡처
node scripts/collect-effects.mjs                  # 심층: 박스(CDP 매칭 CSS), 이펙트, 모션, 일러스트 다운로드, 인터랙션
node scripts/record-motion.mjs                    # 루프 클립 녹화 (Playwright video + Homebrew ffmpeg → captures/clips/*.mp4)
for s in hds legacy sail other; do CSS_SOURCE=$s node scripts/extract-css-tokens.mjs; done
node scripts/build-tokens.mjs && node scripts/build-legacy-tokens.mjs
node scripts/build-observations.mjs && node scripts/build-effects.mjs
node scripts/build-viewer.mjs && node scripts/build-docs.mjs
node scripts/test-viewer.mjs                      # 뷰어 탭 전부 열어 콘솔 오류·폰트 확인
node scripts/validate.mjs                         # 파일 존재·토큰 해석·CSS 파싱·라이브 사이트 대조
```

## 문서

- [DESIGN.md](DESIGN.md) — 디자인 기준(브랜드, 원칙, 시각 언어, 두 시스템 요약)
- [docs/FOUNDATIONS.md](docs/FOUNDATIONS.md) — 색·타이포·간격·그림자·레이아웃 토큰 표
- [docs/BOXES_EFFECTS_MOTION.md](docs/BOXES_EFFECTS_MOTION.md) — 박스 소스, 이펙트, 모션, 일러스트, 인터랙션 정리
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — HDS/레거시 컴포넌트 규칙 요약
- [docs/SOURCE_COVERAGE.md](docs/SOURCE_COVERAGE.md) — 수집 범위와 수치(생성)
- [docs/LICENSE_AND_ATTRIBUTION.md](docs/LICENSE_AND_ATTRIBUTION.md) — 저작권·폰트 주의
