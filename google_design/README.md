# Google Product Design System Catalog

Gmail, Google Calendar, Drive, Meet, Google Finance의 실제 제품 셸을 동일한 스키마로 관찰해 정리한 로컬 디자인 시스템입니다. 개인 메일·일정·파일·계정·관심 종목 텍스트는 저장하지 않고, 화면 구조·computed style·컴포넌트 상태·공식 오픈소스 자산 출처만 수집합니다.

이 프로젝트는 Google 공식 디자인 시스템이나 Google 브랜드 자산 배포판이 아닙니다. Google 제품 로고·제품 아이콘·화면 캡처·일러스트는 로컬 참고 전용이며, 배포 가능한 아이콘·이모지·폰트는 Apache-2.0 또는 OFL-1.1이 확인된 공식 upstream만 사용합니다.

## 결과물

- `DESIGN.md`: 시각·컴포넌트·모션의 단일 결정 문서
- `viewer/index.html`: 검색, 서비스 필터, 라이트/다크 테마가 있는 정적 카탈로그
- `viewer/index.html` Interaction contracts: hover, focus, press, selection, expand-collapse, dialog, snackbar, drag-drop의 설명과 작동 sample을 카드별로 직접 조작
- `viewer-private/index.html`: 사용자 제공 Meet 원본 이미지와 bbox crop을 보여주는 로컬 전용 레퍼런스 viewer. `.gitignore` 대상
- `data/raw/*.json`: 개인 텍스트를 포함하지 않는 서비스별 관찰 데이터
- `data/curated/*.json`: 토큰, 서비스, 컴포넌트, 인터랙션, 자산 manifest
- `data/curated/tokens.css`: 구현용 CSS custom properties
- `data/curated/product-reference-assets.json`: Meet 제품 마크·내비게이션·보안·액션·일러스트의 bbox, 색, 대체 아이콘
- `data/curated/container-references.json`: selected capsule, security banner, tonal CTA box 규격
- `data/curated/gradient-references.json`: 제품 마크의 raster-sampled gradient와 official Meet cup SVG gradient stop
- `data/curated/product-source-registry.json`: Gmail, Calendar, Drive, Meet, Finance, Keep, Contacts, Tasks, Maps 공식 source·policy 상태
- `data/curated/interaction-samples.json`: 14개 실행 가능한 interaction sample 계약
- `docs/`: foundations, components, interactions, source, license, privacy 문서
- `references-private/`: redacted 화면 증거. `.gitignore` 대상이며 재배포 금지

## 확장된 소스 라이브러리 (2026-09-07)

- 공식 upstream의 Material Symbols Rounded SVG 81개를 `assets/material-symbols/rounded/`에 보관합니다. 각 파일의 고정 commit URL, SHA-256, 원본 크기와 Apache-2.0 라이선스는 `data/sources/open-source-manifest.json`에서 확인합니다.
- 파운데이션: 기존 캡처의 색상·테두리 색상·그림자·간격·서체를 제품별로 검색하고 복사할 수 있습니다. 도형 12개, 컨테이너 8개, 고도 및 상태 레이어를 비교합니다.
- 인터랙션: 기존 8종에 설정 전환·다중 선택·키보드 탭·메뉴·입력 검증·진행 표시를 더한 14종입니다. Motion Lab에서 8개 recipe의 시간·이징을 조절하고 CSS를 복사합니다.
- 아이콘·일러스트: 로컬 SVG 선택·복사·다운로드, 독립 gradient recipe 6개를 제공합니다.
- 전체 소스 ZIP: `viewer/downloads/google-design-source-kit.zip`에 공식 SVG, 토큰, recipe CSS, 인터랙션 구현 파일, 출처 JSON, 라이선스와 오프라인 예제를 묶습니다.
- 개요와 출처: 토큰 CSS, 전체 catalog JSON, 디자인 library JSON, 관찰값 JSON, 원본 manifest를 내려받습니다.

`data/curated/design-library.json`은 확장 라이브러리의 생성 결과이며, 원본 recipe는 `scripts/design-library.mjs`에 있습니다. `viewer/workbench.*`와 `viewer/interaction-workbench.*`는 빌드 때 HTML에 포함됩니다. 모든 입력 파일의 hash는 `viewer/finalized.json`에 기록합니다.

관찰값은 2026-09-01 기존 제품 캡처에서 가져왔습니다. 이번 업데이트는 새로운 인증 제품 관찰을 주장하지 않습니다. 공식 token은 `documented`, 직접 구성한 gradient·컨테이너·상태 recipe는 `reconstructed`로 표시합니다. 전체 제품의 모든 숨겨진 화면과 자산을 수집한 것은 아닙니다.

## 실행

```bash
npm run check
npm run validate
node scripts/export-observed-reference-assets.mjs
python3 -m http.server 8094 --bind 127.0.0.1
```

그 다음 `http://127.0.0.1:8094/viewer/`를 엽니다. 빌드는 Node.js 표준 라이브러리만 사용하며 추가 패키지를 설치하지 않습니다.

원본 Meet 자산 레퍼런스는 `http://127.0.0.1:8094/viewer-private/`에서 확인합니다. 이 페이지와 원본 이미지는 로컬 참고 전용이며 배포하지 않습니다.

`npm run collect:platform-assets`는 Gmail·Calendar·Drive·Meet·Finance의 raw 관찰 데이터에 기록된 공식 image URL을 다시 내려받아 private library와 viewer를 갱신합니다. 현재 기준 37개 exact-source 이미지, 9개 카테고리, PNG 34개, SVG 3개를 관리합니다.

공식 오픈 소스만 갱신하려면 `npm run collect:open-assets`를 실행합니다. 네트워크가 필요한 수집과 달리 일반 `npm run check`는 보관된 source snapshot을 사용합니다.

## 수집 범위

| 서비스 | 기준 화면 | 주요 패턴 |
| --- | --- | --- |
| Gmail | 받은편지함 | 검색, drawer, tabs, dense rows, hover actions, banner, snackbar |
| Calendar | 주간 보기 + 첫 방문 안내 | date grid, today/current-time, FAB, dialog, side rail |
| Drive | 홈 | navigation, search, filter chips, recommendation/empty state |
| Meet | 홈 | join field, tonal CTA, safety banner, empty schedule |
| Finance | 시장 요약 | data cards, positive/negative color, chart density, research side panel |

## 갱신 흐름

```text
authenticated product shell
  -> scripts/redact-google-ui.js
  -> scripts/collect-google-ui.js
  -> data/raw/{service}.json
  -> scripts/build-catalog.mjs
  -> data/curated/*
  -> scripts/build-viewer.mjs
  -> viewer/index.html
  -> scripts/validate-capture.mjs
```

새 캡처를 만들 때는 화면 저장 전에 반드시 `scripts/redact-google-ui.js`를 실행합니다. raw 데이터에는 `textContentCollected: false`와 `personalContentExcluded: true`가 있어야 합니다.

## 라이선스 경계

- 재배포 가능: Material Web, Material Color Utilities, Material Symbols, Roboto, Noto Emoji의 명시된 Apache-2.0/OFL-1.1 자산
- bundle license 확인 후 재배포: 공식 Google Fonts에서 받은 Google Sans/Google Sans Flex
- 참고 전용: Google 제품 UI, 로고, 제품 아이콘, 화면 캡처, 제품 일러스트·인포그래픽

세부 근거는 `docs/SOURCES.md`와 `docs/LICENSE_AND_ATTRIBUTION.md`를 참고하세요.
