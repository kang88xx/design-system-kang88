# Wanted Montage reusable design system

[Wanted Montage](https://montage.wanted.co.kr/)의 공개 화면·문서·자산·구현 코드를 수집한 로컬 디자인 시스템입니다. 기존 2026-09-01 수집본을 보존하고 **2026-09-07에 공개 문서 전체를 재검증**했습니다.

## 열기

```bash
python3 -m http.server 8093 --bind 127.0.0.1
```

`http://localhost:8093/viewer/`에서 카탈로그를 엽니다. 정적 문서 키트는 `viewer/montage-design-kit.html`입니다.

## 수집 및 개선 범위

- 공개 문서 **264페이지** / 사이트맵 **262경로**, 실패·추가 누락 없음
- **53개 컴포넌트**, **52개 유틸리티**, 플랫폼별 원문 코드 예제 **580개**
- 테마별 CSS 변수 **472개**, atomic/semantic 색상 및 RGB 짝 **468개**, 타이포그래피 **19개**
- 기존 공개 문서 SVG **339개** + 고정 버전 공개 패키지 SVG **20개** = **359개**
- 문서 이미지 **697개**: 버튼 관련 **77개** + 기타 참고 이미지 **620개**
- 홈 도형 **21개**, Behind 배치 **3개**, 원본 Lottie JSON/SVG 미리보기 **3세트**
- 박스·그림자·그라데이션 CSS 레시피 **18개**, 모션 레시피 **10개**
- 공식 `montage-web` **v3.12.0**, commit `bfced87f96dfb21c8ea80074c551b64b9ed1530b`: 전체 원본 아카이브와 패키지 소스 **965개 파일**

카탈로그에서 검색, 라이트/다크 비교, SVG·CSS·코드 복사, 파일 다운로드, 이미지 페이지 탐색, 버튼·선택·폼·모달 등의 동작을 확인할 수 있습니다. `documented`(공개 문서/소스), `observed`(브라우저 측정), `approximation`(유사 구현)을 구분합니다. 원본 Lottie JSON 다운로드와 미리보기의 보완 모션은 서로 다릅니다.

## 프로젝트에 가져오기

1. `exports/montage-reuse.zip`을 풀거나 `data/curated/tokens.css`와 `recipes.css`를 복사합니다. CSS는 토큰 다음 레시피 순서로 로드합니다.
2. `data/curated/reuse-library.json`의 코드 예제·surface·motion 항목을 선택합니다. React/iOS/Android 원문 예제는 각 플랫폼의 Montage 라이브러리가 필요합니다.
3. SVG는 `assets/montage/icons/`, 추가 SVG는 `assets/montage/icons-upstream/`에서 가져옵니다. `currentColor`와 다색 아이콘의 원래 색을 유지합니다.
4. 공개 React 구현 전체가 필요하면 `assets/montage/source/montage-web-bfced87.tar.gz` 또는 `assets/montage/source/upstream/packages/`를 확인합니다.
5. 저작권·MIT 라이선스 원문 `assets/montage/source/LICENSE-Montage.md`를 함께 유지합니다. 브랜드/참고 자산 범위는 [라이선스 메모](docs/LICENSE_AND_ATTRIBUTION.md)에 정리했습니다.

참고 이미지까지 별도 ZIP으로 묶으려면 `python3 scripts/build-export.py --include-reference-assets`를 실행합니다. 기본 ZIP에는 CSS·데이터·SVG·Lottie 자료·문서가 들어가며, 697개 참고 이미지와 전체 소스 아카이브는 별도입니다.

## 재생성

저장소 루트에서 실행합니다. 앱 의존성을 추가하지 않는 Node/Python 빌더입니다.

```bash
python3 scripts/collect-upstream.py --download
node scripts/build-upstream-icons.mjs
node scripts/build-reuse-library.mjs
node scripts/build-viewer.mjs
python3 scripts/build-kit.py
python3 scripts/build-export.py
node scripts/validate-capture.mjs
node scripts/validate-reuse.mjs
node scripts/test-viewer.mjs
```

브라우저 검사는 로컬 서버와 **기존 Playwright/Chromium 설치**를 사용합니다. 필요한 경우 `PLAYWRIGHT_MODULE`(설치된 index.mjs 절대 경로)과 `CHROMIUM_EXECUTABLE`을 지정합니다. npm 캐시의 기존 설치도 자동으로 찾으며 설치를 실행하지 않습니다.

공개 사이트 재검증은 `node scripts/collect-source-evidence.mjs --crawl`로 실행합니다. 원본 캡처를 덮어쓰지 않고 `data/raw/montage-live.json`과 화면/스타일 근거를 남깁니다. 이후 `python3 scripts/collect-upstream.py`로 비교 결과를 갱신합니다. 정규화 캡처를 새로 만드는 기존 `build-catalog.mjs` / `export-montage-assets.mjs` / `build-home-shapes.mjs`도 유지됩니다.

## 데이터와 근거

- [디자인 기준](DESIGN.md), [재사용 레시피](docs/REUSE_LIBRARY.md), [출처 조사](docs/SOURCE_RESEARCH.md)
- `data/curated/source-manifest.json`: 고정 버전, 다운로드 주소, 원본 파일별 SHA-256, 사이트 검증 결과
- `data/raw/site-observations.json`: 현재 홈/버튼/AnimationPresence/WithInteraction/Gradient 렌더링 CSS·코드·모션
- `captures/refresh/`: 출처·기존 카탈로그·개선 카탈로그의 검증 화면
- [원본 자산 목록](docs/ASSET_COLLECTION.md), [컴포넌트](docs/COMPONENTS.md), [토큰](docs/SEMANTIC_TOKENS.md)

비공개 Figma 편집 레이어와 인증이 필요한 내부 소스는 포함하지 않습니다. 화면과 공개 코드로 확인할 수 없는 세부 동작은 유사 구현으로 표시했습니다. 폰트는 공식 CDN을 사용하므로 오프라인 첫 방문에는 시스템 폰트가 표시될 수 있습니다.
