# Reatic Design System

리틱인더스트리(reaticindustry.com) 공개 홈페이지 4개 페이지의 코드와 관찰 가능한 동작을 기반으로 만든 로컬 디자인 시스템입니다. 스크린샷 납품물이 아닌 실행 가능한 토큰·CSS·React 컴포넌트·로컬 재구성 페이지·문서 템플릿을 제공합니다.

## 실행

```bash
node scripts/serve.mjs 4180 .
```

- 디자인 시스템 스튜디오: http://127.0.0.1:4180/app/
- 홈 재구성: http://127.0.0.1:4180/app/public/reconstruction/home.html (about · portfolio · contact 동일 경로)
- 문서 디자인 시스템: http://127.0.0.1:4180/templates/reatic-document.html (파일을 직접 열어도 됨)
- React 패키지: http://127.0.0.1:4180/app/public/reatic-design-system-0.1.0.tgz
- 토큰 내보내기: 스튜디오 상단 **Export tokens.css**
- 수집 파일 인덱스: http://127.0.0.1:4180/evidence/source-index.json

`templates/reatic-document.html`과 `app/index.html`은 서버 없이 더블클릭으로도 열립니다(스튜디오의 소스 목록만 서버가 필요).

## 실제 프로젝트에 사용

```bash
npm install ./app/public/reatic-design-system-0.1.0.tgz
```

```jsx
import { Header, Button, TextField, CtaStrip, EnterMotion } from '@local/reatic-design-system';
import '@local/reatic-design-system/styles.css';
```

React 19 컴포넌트 14개, TypeScript 선언, 라이트/다크 토큰, 모션 프리셋 19종을 제공합니다. 패키지는 로컬 작성 코드만 포함하며 원본 이미지·영상·폰트는 포함하지 않습니다. 상세는 [프로젝트 통합 가이드](docs/project-integration.md), 모션은 [모션 사용 가이드](docs/motion-usage.md), 문서는 [문서 시스템](docs/document-system.md)을 보세요.

## 구조

| 경로 | 내용 |
| --- | --- |
| `app/src/system/tokens.json` | 단일 토큰 원본 (색 33 · 서체 5 · 타입 15단계 · 레이아웃 29 · 섹션 18 · 모션 26 …) |
| `app/src/system/tokens.css` | 생성된 CSS 커스텀 프로퍼티 (`node app/scripts/generate-tokens.mjs`) |
| `app/src/system/motion.css` | 관찰된 진입 애니메이션 6종 · 페이지 전환 · reduced motion |
| `app/src/system/components.css` | 컴포넌트 상태·반응형 |
| `app/src/system/components.jsx` · `index.d.ts` | React 19 컴포넌트와 타입 |
| `app/index.html` · `studio.css` · `studio.js` | 스튜디오(토큰 복사·내보내기, 테마, 모션 재생, 소스 목록) |
| `app/public/reconstruction/*.html` | 시스템만으로 다시 그린 홈·소개·포트폴리오·작업 의뢰 |
| `app/public/media` · `source/images` · `source/fonts` · `assets` | 원본 영상 7 · 이미지 74 · 폰트 55 · 로고/아이콘/클라이언트 |
| `app/library/` · `app/public/*.tgz` | 패키지 소스와 tarball (`node app/scripts/build-library.mjs`) |
| `templates/reatic-document.html` | 문서 디자인 시스템 (단일 파일, A4 인쇄) |
| `DESIGN.md` | 디자인 계약 |
| `docs/` | 관찰/재구성 구분, 모션 조사·사용, 통합, 완전성, 문서 시스템 |
| `evidence/source` | 원본 HTML 5 · 계산 스타일 · 측정 · 정적 추출 · 스크린샷 67 |
| `evidence/local` | 스튜디오·재구성·문서 캡처 30장, A4 PDF |
| `evidence/verification.json` · `completeness.json` · `source-index.json` | 검증 결과, 파일 수·누락, SHA-256 인덱스 |
| `scripts/` | 수집·추출·측정·다운로드·인덱스·서버·검증 |

## 범위

홈·소개·포트폴리오·작업 의뢰 4페이지의 헤더/내비, 히어로·풀블리드·2단 영상 섹션, 카드 슬라이더, 갤러리, 클라이언트 그리드, 7단계 의뢰 폼, 앵커 도트, CTA 스트립, 푸터와 진입 모션·호버를 다룹니다. 폼 제출·이메일 발송은 재현하지 않고 로컬 상태만 제공합니다. 포트폴리오 영상은 원본이 연결한 공개 YouTube 링크로 연결합니다.

Wix 런타임 번들과 편집기 데이터는 공개되지 않아 포함하지 않습니다. 저장된 HTML의 인라인 테마 CSS와 컴포넌트 마크업, 렌더링된 계산 스타일(1440·390)에서 값을 읽었습니다. 유료 폰트(Avenir, DIN Next, Helvetica W01, Proxima Nova)는 보관만 하고 패키지·템플릿에서는 Google Fonts 폴백을 씁니다.

## 개발·검증

```bash
node app/scripts/generate-tokens.mjs --check
node app/scripts/build-library.mjs
node --test app/tests/*.test.mjs
node scripts/build-source-index.mjs
node scripts/verify.mjs
```

`verify.mjs`는 정적 서버를 스스로 띄우고 스튜디오(1440/768/390/320 넘침, 토큰 복사·내보내기, 테마, 모션 재생·감소, 호버·포커스·상태), 재구성 4페이지(넘침·깨진 이미지·영상 준비·진입 실행·contact 검증), 문서 템플릿(렌더·인쇄 스타일·A4 PDF)을 검사해 `evidence/verification.json`과 `evidence/local/`에 기록합니다. Playwright는 현재 환경 설치를 `scripts/browser-runtime.mjs`가 찾으며 `PLAYWRIGHT_MODULE`/`CHROME_PATH`로 바꿀 수 있습니다. WSL `/mnt/j`는 심볼릭 링크 제약이 있어 npm install 없이 동작하도록 구성했습니다.

## 재수집

```bash
node scripts/capture-source.mjs
node scripts/extract-static.mjs
node scripts/measure-components.mjs
node scripts/download-assets.mjs
node scripts/build-source-index.mjs
```

원본이 바뀌면 `tokens.json`의 관측값과 `design-qa.md` 수치를 함께 갱신합니다. 자세한 범위와 한계는 [source-completeness](docs/source-completeness.md), 관찰과 재구성의 구분은 [interaction-inventory](docs/interaction-inventory.md)를 참고하세요.
