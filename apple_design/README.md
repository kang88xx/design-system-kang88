# Apple Web Design System

Apple 미국 홈페이지의 공개 코드와 관찰 가능한 동작을 기반으로 만든 로컬 디자인 시스템입니다. 스크린샷 납품물이 아닌 실행 가능한 HTML/CSS/JavaScript와 재사용 React 컴포넌트를 제공합니다.

## 실제 프로젝트에 사용

[설치·사용 화면](http://localhost:4173/#start)에서 8개 React 컴포넌트를 확인하고 [설치 패키지](app/public/source-design-system-0.1.0.tgz)를 내려받습니다. React 19 프로젝트에서:

```bash
npm install ./source-design-system-0.1.0.tgz
```

```jsx
import { Button, TextField, Dialog } from '@local/source-design-system';
import '@local/source-design-system/styles.css';
```

TypeScript 선언, 라이트/다크 토큰, native form/ref 지원을 제공합니다. 패키지는 로컬 작성 코드만 포함하며 수집한 Apple 자산은 포함하지 않습니다. 상세 API와 사용 예는 [프로젝트 통합 가이드](docs/project-integration.md)에 있습니다.

## 실행 화면

- 디자인 시스템: http://localhost:4173/
- 홈페이지: http://localhost:4173/homepage.html
- 소스 라이브러리: http://localhost:4173/#sources
- 수집 모션 라이브러리: http://localhost:4173/#motion
- 전체 모션 코드·키프레임 다운로드: http://localhost:4173/motion-code-kit.tar.gz
- 타이밍 실험 예제: http://localhost:4173/#motion-presets
- 13개 페이지 수집 범위: http://localhost:4173/#pages
- 실제 SVG 코드: http://localhost:4173/#icons
- CSS 도형: http://localhost:4173/#shapes
- 원본 모션 규칙: http://localhost:4173/#observed-motion
- 동작 전후 상태: http://localhost:4173/#interaction-states
- 전체 소스: http://localhost:4173/#research-sources
- 대체 구현: http://localhost:4173/#reconstructions
- 파일·누락 보고서: http://localhost:4173/research/completeness.json
- JPG/PNG 없는 코드 묶음: http://localhost:4173/research-source-kit.tar.gz

홈페이지와 13개 공개 페이지의 저장된 소스를 보존하고, 모션 조사는 총 17개 페이지의 데스크톱·모바일 화면으로 확장했습니다. 파일 전체 인덱스, SHA-256 해시, 누락 검사와 대체 경로는 [완전성 보고서](app/public/research/completeness.json)에 기록됩니다. “모든 Apple 사이트·비공개 저장소”를 수집한 결과로 주장하지 않습니다.

- **전체 소스**: HTML/CSS/JS/모듈, 인라인 코드·SVG, JSON, 관찰 자료, 로컬 React 구현과 수집·검증 스크립트를 검색·복사·다운로드합니다.
- **제한 없는 정적 추출**: 저장된 raw/rendered 문서와 추가 실행 시점 DOM의 제목·컨트롤·인라인 블록, 확보한 CSS의 모션 규칙과 변수 선언을 모두 인덱싱합니다. 최신 수치는 완전성 보고서에 기록됩니다. 변수는 선택자·조건을 보존한 선언 수이며, 고유한 의미 토큰 수가 아닙니다.
- **추가 확보**: 원본 HTML/CSS/JS 참조를 따라 코드·SVG·폰트 리소스 104건을 추가 확보했습니다. 원본 서버가 404를 반환한 참조 168건은 사용 가능한 동일 계열 아이콘·폰트 스타일 또는 로컬 SVG 대체와 연결했습니다.
- **대체 예제**: `#reconstructions`에서 메뉴, 검색, 컬러·제품 탭, AirPods 상세, 연속성 기능, 모달, 장바구니·계정 데모를 조작합니다. 기존 실패 동작 14건은 실패 기록을 유지하고 예제로 연결합니다.
- **다운로드**: 코드 묶음에는 홈페이지 코드와 로컬 구현·수집 도구·폰트도 포함됩니다. JPG/PNG·영상은 코드 묶음에서 제외하고 기존 `app/public` 자산은 유지합니다.

기존 동작 전후 캡처 75건(성공 61건, 실패 14건)을 유지합니다. 새 모션 조사의 전체 기록과 관찰·실패·건너뜀 수는 `research/runtime-motion.json`에 별도로 기록합니다. 저장된 DOM 전체를 목록화했다고 모든 런타임 상태를 검증한 것은 아닙니다. 내부 저장소, 인증·거래 서버, 원본 소스맵은 공개적으로 확보되지 않았습니다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `app/src/system/tokens.css` | 의미 기반 CSS 디자인 토큰 |
| `app/src/system/tokens.json` | JSON 토큰 |
| `app/src/system/components.jsx` | 버튼, 세그먼트, 토글, 아코디언, 제품 타일, 캐러셀 |
| `app/src/system/components.css` | 컴포넌트 상태와 반응형 스타일 |
| `app/src/App.jsx` | 디자인 시스템 탐색, 미리보기, 소스·토큰 복사 |
| `app/public/homepage.html` | 로컬 홈페이지 |
| `app/public/extraction.json` | 공개 리소스 원본 URL, 로컬 경로, 관찰값 |
| `app/public/local-api.js` | 공개 메뉴 데이터의 로컬 응답 연결 |
| `app/public/reference-adapter.js` | 외부 링크 및 로컬 미리보기 조정 |
| `DESIGN.md` | 디자인 계약 |
| `docs/interaction-inventory.md` | 원본 관찰과 재구현 구분 |
| `evidence/` | 원본·로컬 캡처 및 검증 자료. 앱 UI를 대신하는 이미지가 아님 |

## 범위

홈페이지의 메뉴, 검색 입력, 장바구니 표시, 제품 섹션, 엔터테인먼트 갤러리, 모바일 푸터 및 반응형 구조를 다룹니다. 구매·계정·제품 상세는 Apple 원본 링크로 연결하며, 실제 거래나 계정 서버를 복제하지 않습니다. 검색 추천과 메뉴는 공개 응답의 로컬 캡처를 사용합니다.

Apple 내부 React/TypeScript 저장소와 서버 코드는 공개되지 않아 포함되지 않습니다. 공개 배포 번들은 `public`에 보존하고, 재사용 컴포넌트는 별도로 작성했습니다. 원본의 저작권 표기를 유지했습니다. 제품 사진·영상은 페이지 실행에 필요한 자산이며 독립 이미지 모음으로 납품하지 않습니다.

734px/1068px 반응형 기준과 메뉴의 240ms/320ms/300ms 전환을 기록했습니다. 컴포넌트 라이브러리의 토글·세그먼트 등은 로컬 도구에 필요한 추가 컴포넌트이며 원본 홈페이지에서 모두 추출한 것으로 주장하지 않습니다.

## 개발·검증

```bash
cd app
npm install --no-bin-links
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
npm run tokens:check
npm run build:library
npm test
npm run build
npm run test:sites
```

현재 WSL `/mnt/j`는 심볼릭 링크·copyFile·파일 감시 제약이 있어 `--no-bin-links`, 폴링 감시, read/write 기반 빌드 복사를 사용합니다.

캡처·브라우저 검증 스크립트는 `scripts/`에 있으며 현재 환경의 Playwright 설치를 사용합니다. 다른 환경에서는 각 스크립트의 Playwright import를 해당 설치 위치로 변경해야 합니다.

```bash
node scripts/verify.mjs
node scripts/verify-research.mjs
node scripts/verify-completeness.mjs
node app/scripts/verify-library-browser.mjs
node --test app/tests/*.test.mjs
```

코드 파일은 수정·재사용 가능한 소스이고, `evidence` 캡처는 검증 근거입니다. 사용하지 않는 일부 원본 폰트 변형은 다운로드가 불가능하여 런타임 선언에서 제외했고, 목록은 manifest에 기록했습니다.

## 재수집·재검증

`node scripts/complete-sources.mjs`는 저장된 HTML의 인라인 코드, 정적으로 해석 가능한 CSS·JS 참조를 추출하고 실제 로컬 파일을 해시로 검사해 목록과 소스 묶음을 다시 만듭니다. `--refresh`는 미확보 참조를 원본 서버에 다시 요청합니다. 명시적으로 `--reuse-unavailable-cache`를 쓴 경우에만 이전 미확보 기록을 재사용하고, 보고서에 재요청하지 않았음을 표시합니다. 원본 캡처 동작 결과는 변경하지 않습니다. `scripts/finalize-research.mjs`로 관찰 자료를 재생성했다면 그 뒤에 이 명령을 실행하세요.

검증용 Chromium 경로는 `scripts/browser-runtime.mjs`에서 현재 설치된 브라우저를 찾으며 `CHROME_PATH`로 지정할 수 있습니다. Playwright 라이브러리는 현재 환경의 설치를 사용합니다. 별도의 lint/typecheck 설정이 없는 JSX 프로젝트이므로 파서 검사, Vite 빌드, Node 계약 테스트와 실제 브라우저 테스트로 검증합니다.

## 전체 탭 모션 조사

홈페이지와 상단 메뉴의 다른 페이지를 데스크톱·모바일로 조사한 모션 라이브러리를 `#motion`에서 탐색합니다. 페이지·기기·트리거별로 실행 기록을 찾고 키프레임을 재생하거나 전체 JSON/CSS/JS를 내려받습니다. CSS 선언·스크롤 속성·JavaScript API 참조·SVG·영상 소스는 실제 관찰된 모션과 구별합니다. 전체 모션 코드 묶음은 반복 관찰 스냅샷을 제외한 모든 보존 트랙과 원본 소스를 포함합니다. 실제 프로젝트 적용은 [사용 가이드](docs/motion-usage.md), 페이지별 처리·건너뜀·실패 내역은 [조사 및 검증 방법](docs/motion-research.md)을 확인하세요.
