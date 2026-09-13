# Family 디자인 시스템 · Edition 04

[프로젝트 적용 가이드](system.html) · [설치·컴포넌트 문서](design-system/README.md) · [전체 소스 탐색](index.html#source-library) · [앱 흐름 대체 구현](app-reconstructions.html) · [전체 명세](DESIGN.md)

실제 프로젝트에는 **[family-project-kit.zip](family-project-kit.zip)**의 `design-system/` 폴더를 복사하거나 **[family-design-system-1.0.0.tgz](family-design-system-1.0.0.tgz)**를 로컬 npm 패키지로 설치합니다. 런타임 의존성 없이 CSS 토큰·컴포넌트·JavaScript·TypeScript 선언·실행 예제를 제공합니다.

```sh
npm install ./family-design-system-1.0.0.tgz
```

- `.fds` 범위의 스타일, 라이트/다크 테마, 프로젝트별 시맨틱 토큰 재정의.
- 버튼·입력·카드·상태 안내·탭·아코디언·대화상자·드롭다운·로딩과 반응형 배치.
- 키보드 이동, 포커스 복귀, 초기화/정리 API와 React/Vue 연결 예제.
- 폴더 안에서 실행되는 토큰 생성기. 원본 브랜드 폰트·이미지·영상·사이트 번들은 설치 키트에 포함하지 않습니다.

Family 공개 랜딩 페이지와 기존 Recent 녹화에서 디자인 자료를 수집하고, 공개되지 않은 앱 구조는 출처를 표시한 조작 가능한 예제로 보완했습니다.

- 전체 파일을 검색·필터·미리보기·다운로드하는 소스 탐색기. 원본, 추출/파생 자료와 대체 구현을 구분합니다.
- 원본 SVG 94개, Hero 도형 그룹 69개, 색상 49개, 폰트·영상·이미지·공개 번들·추출 토큰.
- 직접 조작하는 모션 22종과 원본 앱 영상 9개, 영상 14영역 대조표 및 반응형 레이아웃 5종.
- 9개 앱 흐름의 대체 코드: Send, Receive, Swap, Collectibles, Watch, Activity, Onboarding, Mission Control, Drag & drop. 원본 영상과 나란히 비교하며 로컬 입력·선택·확인·완료·정렬을 조작합니다.

```sh
python3 scripts/serve.py
```

프로젝트 적용 가이드는 `http://127.0.0.1:40565/system.html`, 전체 소스 카탈로그는 `http://127.0.0.1:40565`에서 엽니다. `index.html`을 직접 열어도 목록·미리보기·다운로드·대체 앱이 동작합니다. 코드 본문 미리보기와 영상 탐색은 제공된 byte-range 서버 사용을 권장합니다. 패키지 설치나 빌드는 열람에 필요하지 않습니다.

## 수집 범위와 해석

`source-library.json`은 파일 URL/상태/크기/SHA-256과 수집 범위를 기록합니다. 브라우저용 `source-library-data.js`는 같은 데이터를 담습니다. 공개 랜딩 HTML, 연결된 CSS/JS, 해당 소스에서 참조하는 디자인 리소스와 기존 추출물이 대상입니다. 연결된 모든 문서·외부 서비스·로그인 화면을 전체 수집했다는 의미가 아닙니다.

`reconstruction-map.json`은 확인되지 않은 구조를 대체 코드·원본 영상·관찰 근거와 연결합니다. 비공개 앱 원본 저장소, 소스맵이 제공되지 않은 원래 컴포넌트 코드, 과거 녹화 시점 빌드에는 확인 한계가 있습니다. MP4는 원본 매체이며 로컬 예제의 DOM·상태 처리·데이터는 재구성입니다. 실제 거래·계정 생성·주소 조회 서버와 연결되지 않습니다.

## 재생성

```sh
node scripts/collect-source-library.cjs
python3 scripts/normalize-svg.py
python3 scripts/build-reconstruction-map.py
python3 scripts/build-catalog.py
node scripts/collect-source-library.cjs --reindex-only
```

`--reindex-only`는 다운로드 없이 최종 로컬 파일의 해시를 갱신합니다. UI/문서/모션 코드를 수정한 뒤 실행합니다. 기존 토큰/영상 파생 자료를 재추출하려면 `scripts/extract-tokens.py`, `scripts/prepare-library-assets.py`, `scripts/extract-shapes.cjs`를 사용합니다.

## 프로젝트 키트 재생성·검증

```sh
python3 scripts/build-system-tokens.py --check
python3 scripts/build-system-guide.py
python3 scripts/build-catalog.py
node scripts/verify-system-runtime.cjs
node scripts/verify-system-ui.cjs
node scripts/verify-source-collector.cjs
python3 scripts/build-project-kit.py
python3 scripts/verify-project-kit.py
node scripts/verify-isolated-kit.cjs
node scripts/collect-source-library.cjs --reindex-only
```

키트 빌드에는 Node.js/npm, 생성·패키징 스크립트에는 Python 3.10 이상을 사용합니다. `verify-project-kit.py`의 TypeScript 소비자 검증은 npm 캐시에 준비된 TypeScript 도구를 `npm exec --offline --package=typescript`로 실행합니다. TypeScript와 Playwright는 검증용 도구이며 키트의 런타임 의존성이 아닙니다. 최신 프로젝트 적용 검사 결과는 `references/v4-review/`에 있습니다.

## 카탈로그 검증 및 전체 패키징

```sh
node scripts/verify-catalog-v2.cjs
node scripts/verify-motion-v3.cjs
node scripts/verify-app-reconstructions.cjs
node scripts/verify-source-browser.cjs
python3 scripts/verify-source-integrity.py
python3 scripts/build-package.py
python3 scripts/verify-source-integrity.py --archive
```

브라우저 검증은 기존 환경의 Playwright를 사용합니다. 다른 환경에서는 `PLAYWRIGHT_MODULE`을 설치 경로로 지정합니다. `references/v3-review/`에 오류 점검·무결성 검사·화면 기록을 보존합니다. 검증 자료는 검사 시점의 결과입니다.

`family-design-system.zip`에는 열람 페이지, 원본/파생 자료, 대체 코드, 수집·생성·검증 스크립트가 포함됩니다.
