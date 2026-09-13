# 공개 소스 수집 범위

2026-09-07 KST에 [toss.im](https://toss.im/)의 한국어 공개 홈을 데스크톱 1440×1000, 모바일 390×844로 끝까지 스크롤하며 수집했습니다. JSON의 시간은 UTC로 기록되어 2026-09-06으로 보일 수 있습니다. 공식 TDS나 비공개 저장소 복원본이 아닙니다.

| 수집 대상 | 결과 | 보관 위치 |
|---|---:|---|
| 공개 요청 주소 | 551 | `data/toss-source-capture.json` |
| 공개 HTML·CSS·JS | 86개 (CSS 31개) | `data/source/` |
| 상태·키프레임·폰트·그라데이션 CSS 규칙 | 675 | `stylesheetRules` |
| 실행 중 애니메이션 샘플 | 892 | `captures[].motionSamples` |
| CSS 사용자 변수 | 414 | `data/toss-css-tokens.json`, `dist/toss-observed-tokens.css` |
| 소스 라이브러리 | 1,558 | `data/toss-source-library.json` |
| 발견한 미디어 자산 | 503 | `data/toss-asset-manifest.json` |
| 로컬 미디어 사본 | 477 / 28.59 MiB | `assets/source/`, SHA-256 검증 |
| 원본 링크로 보존 | 영상 15 · 폰트 10 | asset manifest |
| 접근 거부 | 샘플 이미지 1개 / HTTP 403 | asset manifest의 `failed` |
| 프레임 자산 | 374 | 원본 모션 플레이어, asset manifest |
| 독립 재현 예제 | 6 | `data/motion-recipes.json` |

탐색 가능한 항목은 아이콘 78, 버튼 39, 도형·여백 209, 색상 194, 그라데이션 95, 이미지·영상 100, 모션 205, 타이포·폰트 141, 필터·그림자·상태 선언 497개입니다. 카테고리별 수는 인스턴스 수가 아닌 중복을 묶은 탐색 항목 수입니다. 프레임 한 장을 카드 하나로 세지 않고 묶어서 제공합니다.

데스크톱에서는 intro, transfer, assets, finance, investment, shopping, ads, payment, business, daily, global과 내부 앵커를 확인했습니다. 모바일은 원본 DOM에 같은 앵커가 모두 존재하지 않으므로 전체 페이지 순회와 미디어·스타일 수집을 기준으로 합니다. 일부 section 표기는 위치 기반 추정이며 selector/URL이 우선 근거입니다.

## 가져다 쓰기

- `원본 관찰`: 공개 DOM·계산 스타일·CSS·미디어에서 직접 수집한 값. 미리보기용 컨테이너는 별도 구성합니다.
- `유사 재현`: 원본 화면의 동작을 참고해 독립적으로 구현한 예제. 실제 내부 구현과 동일하다고 주장하지 않습니다.
- `원본 선언 자료`: 원본 selector, DOM 또는 CSS 변수가 필요한 코드. 누락된 동적 변수는 주석과 `reuse.unresolved`에 표시합니다. 그대로 붙여 넣는 완성 컴포넌트로 간주하지 않습니다.
- 로컬 자산을 쓰는 복사 코드는 프로젝트 루트의 `assets/source/`를 기준으로 합니다. 키트의 `dist/snippets/` 파일은 해당 위치에 맞는 상대경로를 사용합니다.
- 폰트와 영상은 원본 서버에 의존합니다. 원격 연결 없이도 로컬 이미지·프레임·SVG·지구본·재현 예제를 확인할 수 있습니다.
- 로컬 미디어는 개인 스터디용 출처 자료입니다. 원본 자산의 권리는 출처에 있으며 이 키트가 별도의 사용·배포 권리를 부여하지 않습니다.

## 수집 한계

공개 홈과 배포된 번들에서 관찰한 범위입니다. 비공개 API, 로그인 화면, 원본 TypeScript/React 저장소, 모든 가능한 상태 조합과 시점은 포함하지 않습니다. 동적으로 조합되는 경로는 실제 요청되거나 완전한 공개 URL이 확인된 경우만 보존합니다. 전체 런타임 샘플은 raw capture에 남기고, 라이브러리에는 중복 제거한 대표 32개 프로그램과 CSS 모션 선언을 제공합니다. 영상은 기본 자동 재생을 하지 않습니다.

## 재수집

```bash
node scripts/capture-source.mjs
node scripts/enrich-source.mjs
node scripts/collect-assets.mjs
node scripts/build-live-catalog.mjs data/source/legacy-1440.json data/source/catalog-1440.json
node scripts/build-live-catalog.mjs data/source/legacy-390.json data/source/catalog-390.json
node scripts/build-source-library.mjs
node scripts/build-figma-tokens.mjs
node scripts/build-package.mjs
```

브라우저 캡처·QA는 기존 Playwright/Chromium을 탐색합니다. 별도 위치라면 `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`를 지정합니다. 배포되는 사이트 자체에는 런타임 패키지 의존성이 없습니다.

## 참고 출처

- [토스 공개 홈](https://toss.im/): 현재 화면·리소스·동작 관찰
- [현재 공개 스타일시트](https://static.toss.im/frontend/new.toss.im/toss-im-new/_next/static/css/1d35c7dd06268106.css): 색상과 상태·모션 선언 (해시 경로는 배포마다 변경될 수 있음)
- [Apps in Toss 그래픽 가이드](https://developers-apps-in-toss.toss.im/design/resources.html): 별도 파트너 환경의 그래픽 사용 가이드와 권리 안내. 공개 홈의 원본 코드 명세로 취급하지 않음
- [Apps in Toss 디자인 도구](https://developers-apps-in-toss.toss.im/design/prepare/design.html): TDS UI Kit 및 폰트 안내
