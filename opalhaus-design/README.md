# Opalhaus 디자인 시스템 · Edition 02

[디자인 스튜디오](index.html) · [프로젝트 적용 가이드](system.html) · [레이아웃 레시피](layout-recipes.html) · [전체 명세](DESIGN.md) · [설치 키트 API](design-system/README.md)

`family_design`과 같은 Studio 형식으로 정리한 **규칙·소스·모션·설치 키트**입니다. 앞선 파일 모음에서 실제 CSS 추출, 컴포넌트 매핑, 조작 가능한 데모와 독립 재사용 코드로 확장했습니다.

## 글자 노출·서비스 목록 추가

[히어로 글자 등장 / 서비스 그룹 등장 / 이미지 호버 / What we do 롤링](index.html#text-services) · [원본 규칙](text-services.md) · [소스 ZIP](text-services-kit.zip).

## 추가 요청한 버튼과 프로모션 위젯

[View All Blogs · 슬라이드 배너 · 가격 버튼 직접 조작](index.html#requested-components) · [원본 규칙/클릭 명세](requested-components.md) · [이 세 컴포넌트 소스 ZIP](requested-components-kit.zip). 기존 CTA 단순 회전은 두 화살표가 교차하는 원본 구조로 교체했습니다.

## 지금 사용할 파일

- **`opalhaus-project-kit.zip`**: `.ods` 컴포넌트·43개 시맨틱 토큰·JS·타입 선언·Vanilla/React/Vue 예제를 담은 작은 설치 키트.
- **`opalhaus-design-system-1.0.0.tgz`**: 로컬 npm 설치 패키지.
- **`opalhaus-design-system.zip`**: Studio·원본 에셋·추출물·도구를 포함한 전체 보관본.

```sh
npm install ./opalhaus-design-system-1.0.0.tgz
```

```js
import '@opalhaus-design/system/styles.css';
import { initOpalhaus } from '@opalhaus-design/system';
const ui = initOpalhaus(document.querySelector('.ods'));
// 화면 제거 시 ui.destroy()
```

## 추출·구현 내용

| 영역 | 제공 내용 |
|---|---|
| 소스 탐색 | 전체 파일 검색·분류·페이지 이동·미리보기·본문 복사·다운로드 |
| 원본 규칙 | 작성자 CSS 규칙 7,186개, 컴포넌트별 selector/속성 검색·복사 |
| 디자인 토큰 | 원본색 8개, 반응형 타입 프리셋 21개, 간격·grid·radius·shadow |
| 컴포넌트 명세 | 주요 15개 영역과 실제 viewport별 스타일·상태·출처 |
| 모션 | 14개 직접 조작하는 프리뷰, source spring/variant 값과 재구성 차이 |
| 프로젝트 키트 | 43개 근거 포함 토큰, scoped CSS, 접근성 상호작용, 예제, 타입 선언 |
| 레이아웃 | 5개 반응형 조합 예제 |
| 공개 원본 | 25페이지, 리소스 591개, 약 277.5MB |
| 미디어 | 이미지 394파일, 폰트 110파일, 영상 5개, 인라인 SVG 파생 12개 |

폰트·이미지 수에는 weight/언어 subset/해상도 변형이 포함됩니다. 모션은 공개 Framer 배포 설정을 근거로 독립 구현했으며, 원래 편집 컴포넌트를 복구했다는 의미는 아닙니다.

## 열람

```sh
python3 -m http.server 8765
```

`http://localhost:8765`에서 열 수 있습니다. `index.html`을 직접 열어도 내장된 소스 인덱스와 모션 프리뷰가 작동합니다. 코드 본문 미리보기와 ES-module 기반 설치 키트 예제는 로컬 HTTP 서버를 사용하세요.

## 어떤 토큰을 적용할까요?

- 루트 **`tokens.css/json`**: 원본 확인용. UUID와 original preset의 의미를 보존합니다.
- **`design-system/tokens.css/json`**: 적용용. `.ods` 내부의 의미별 토큰을 프로젝트에 맞춰 재정의합니다.
- **`design/fonts.css`**: 확보한 로컬 원본 폰트 연결. 설치 키트에는 자동 포함하지 않습니다.

원본값과 이식용 간격·상태·모션 근사는 데이터에 구분되어 있습니다. 한글 폰트와 실제 콘텐츠의 줄바꿈은 대상 프로젝트에서 결정합니다.

## 재생성

```sh
python3 scripts/collect.py
python3 scripts/extract-design.py
python3 scripts/extract-icons.py
python3 scripts/build-source-rules.py
python3 scripts/build-motion-data.py
python3 scripts/build-promo-data.py
python3 scripts/build-reveal-data.py
python3 scripts/build-services-data.py
python3 scripts/build-design-guide.py
python3 scripts/build-project-kit.py
python3 scripts/build-requested-kit.py
python3 scripts/build-text-services-kit.py
python3 scripts/build-source-library.py
```

`collect.py`는 공개 페이지와 배포 모듈에서 참조하는 리소스를 재수집합니다. 첫 수집 원본 해시는 `assets/manifest.json`, 최종 열람 인덱스는 `source-library.json`에서 확인합니다. 원본 수집과 새로 작성한 재사용 코드를 서로 다른 출처로 표시합니다.

## 검증

```sh
python3 scripts/verify-project-kit.py
node scripts/verify-project-kit-browser.cjs
node scripts/verify-catalog.cjs
node scripts/verify-requested-components.cjs
node scripts/verify-text-services.cjs
python3 scripts/build-source-library.py
python3 scripts/verify-source-integrity.py
python3 scripts/build-package.py
```

카탈로그 검증은 전체 소스 필터·페이지 이동·코드 검사와 1440/1024/390px 레이아웃을 확인합니다. 키트 검증은 독립 환경에서 외부 의존성, 모바일 메뉴, 키보드, FAQ, ticker, 초기화/정리, reduced motion을 확인합니다. 환경에 따라 `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `BASE_URL`을 지정할 수 있습니다. 검증 결과는 `evidence/`와 각 검증 스크립트 출력으로 확인합니다.

## 범위

원본 공개 사이트: https://opalhaus.framer.website/

공개 배포 소스와 내부 링크에서 확인 가능한 자료를 확보했습니다. Framer 편집 원본·비공개 CMS·모든 상태의 픽셀 일치는 포함하지 않습니다. 원본 에셋의 이용 조건은 공개 다운로드 여부와 별개이며, 독립 설치 키트는 기본 스타일은 원본 미디어를 자동 로드하지 않습니다. 요청한 별도 프로모션 예제에는 배너 이미지 4장과 필요한 폰트가 포함됩니다. 현재 저장소에 실제 적용 대상 사이트가 없어 디자인 시스템까지 완성한 상태입니다.
