# X Advertising — 소스 탐색기와 디자인 시스템

**프로젝트 적용: [use.html](use.html)** · [스타터](starter/index.html) · [소스 탐색기](sources.html) · [전체 페이지](landing.html) · [디자인 규칙](index.html) · [모션 실험실](motion.html)

```sh
python3 scripts/serve.py
```

브라우저에서 `http://127.0.0.1:8766/sources.html`을 여세요. 소스 탐색기와 `samples/*.html`은 파일로 직접 열어도 동작합니다. 용량이 큰 원본 코드 묶음은 원본을 선택할 때만 불러옵니다. 영상 탐색 등 전체 기능에는 로컬 서버를 권장합니다.

## 프로젝트용 릴리스

[adver-system-1.0.0.zip](releases/adver-system-1.0.0.zip)을 풀고 `starter/index.html`을 여세요. 의존 패키지 없이 실행되는 13개 컴포넌트, 영역별 토큰 CSS, 복사용 마크업, 실제 작업 콜백 예제가 포함됩니다. [USAGE.md](USAGE.md)가 통합·테마·폼/버튼 어댑터·초기화/해제 API 계약의 기준입니다.

기존 앱에는 `tokens.scoped.css`와 `.adver-system` 영역을 사용하세요. `landing.html`/`page-kit.*`는 페이지 전체 스타일을 포함한 독립 템플릿입니다. 런타임 ZIP에는 연구용 원본·폰트·소스 탐색기를 포함하지 않습니다. 스타터의 폼/버튼은 로컬 콜백 예제이며 실제 서버는 소비 프로젝트에서 연결합니다.

## 작업물

- `sources.html`: 이름·파일·효과 검색, 분류, 실행 미리보기, 파일별 전체 소스 복사/다운로드, 의존 파일 및 수집 근거. URL에 선택 항목과 탭을 보존합니다.
- `landing.html`: 영상의 히어로부터 혜택·크레딧·지표/인용·캠페인·광고 형식·지도/문의·FAQ·푸터까지 재구성한 전체 페이지.
- `motion.html`: 13개 모션·인터랙션 예제, 재생/정지·속도, HTML/CSS/JS 복사, 영상 시점 비교.
- `samples/complete-source.zip`: 프로젝트 소스, 독립 HTML, kit ZIP, 수집 원본, 적용 문서, 검증 스크립트 묶음. 개별 파일 해시는 `samples/complete-source-manifest.json`에 있습니다.
- `samples/motion-library.zip`: 두 kit·전역 토큰·13개 독립 예제의 데모 묶음. 제품 통합에는 위 런타임 ZIP을 사용합니다.
- [DESIGN.md](DESIGN.md): 시각/반응형/접근성/소스 UI 규칙. [MOTION.md](MOTION.md): 샘플별 API와 적용법.
- [수집 보고서](references/source-audit/report.md), [원본 명세](references/source-audit/manifest.json), [구성별 대응표](references/source-coverage.json): 확인된 공개 소스와 대체 구현 범위.

## 원본과 대체 구현

공개 광고 페이지가 직접 참조한 CSS 3개, JavaScript 30개, 이미지/SVG 11개, CSS 참조 폰트 2개와 공식 HTML/Markdown·Recent HTML을 연구 자료로 저장했습니다. 추가 하위 의존 코드, 이미지 변형, Recent 페이지 자산은 `references/source-audit/graph-manifest.json`에 URL별로 기록합니다. 기존 원본 영상·프레임도 포함합니다. 원본의 비공개 저장소, 인증 데이터, 서버 구현까지 추출한 것은 아닙니다.

실행 UI는 로컬 재구성 코드와 SVG, 시스템 폰트를 사용합니다. 공개 자료로 확정할 수 없는 그림·캠페인 화면·서버 응답은 대체 구현 또는 로컬 상태 예제로 제공합니다. 정확한 원본 easing/timing·미관찰 상태는 제안입니다. 문의 폼은 외부 전송이 없습니다. 수집 원본의 사용 권한과 런타임 적용은 별개이며, 원본 폰트는 배포 라이선스가 확인되지 않았습니다.

## 수정 후 재생성

```sh
python3 scripts/build-release.py
```

`design-system/tokens.json`에서 전역/영역별 CSS를 생성합니다. 원천 파일은 이 JSON과 `design-system/*-kit.*`, `*-samples.json`, `page-sections.json`, 각 페이지와 탐색 UI입니다. `lab-sources.js`, `source-catalog.js`, `source-originals.js`, `components/*`, `components.js/json`, 독립 HTML, ZIP은 생성물입니다. 생성 카탈로그를 직접 수정하지 마세요. 전체 ZIP을 풀어 실행한 경우 위 명령으로 다운로드 ZIP도 다시 만들 수 있습니다. 전체 ZIP 자체, 백업, 런타임 상태, 변경 중인 테스트 결과는 전체 ZIP에 재귀 포함하지 않습니다.

## 검증

기존 Playwright 설치 경로를 `PLAYWRIGHT_MODULE`로 지정합니다. 프로젝트 의존성은 추가하지 않았습니다.

```sh
node references/source-audit/verify.cjs
python3 scripts/verify-runtime-builder.py
node scripts/verify-motion-runtime.cjs
node scripts/verify-interaction-runtime.cjs
node scripts/verify-package.cjs
node scripts/verify.cjs
node scripts/verify-motion.cjs
node scripts/verify-sources.cjs
node scripts/verify-landing.cjs
python3 scripts/verify-library.py
```

브라우저 검증 전에 로컬 서버를 실행하세요. 결과·화면은 `references/verification/`에 기록합니다. `release/package-result.json`은 저장소 밖에 ZIP을 풀어 파일 실행, 여러 인스턴스, 콜백, 테마/모바일, 호스트 스타일 보존, 해시를 확인한 결과입니다. Chromium을 대상으로 하며 전체 WCAG 인증 또는 Safari/Firefox 검증을 의미하지 않습니다.

프레임 재추출: `bash scripts/extract-frames.sh` (`FFMPEG_BIN` 지원).
