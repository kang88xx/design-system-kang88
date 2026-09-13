# Lusion Reference Design System

Lusion의 공개 웹 리소스·화면·제작 설명을 수집한 **한국어 디자인 시스템 패키지**입니다. Lusion 공식 내부 디자인 시스템이나 비공개 원본 프로젝트가 아닙니다.

## 바로 보기

작업 폴더에서 아래 로컬 서버를 실행한 뒤 **[프로젝트 적용 화면](project-kit.html)** 또는 **[전체 개요](index.html)**를 엽니다. 프로젝트 키트의 ES module과 소스 미리보기는 HTTP가 필요합니다.

```bash
python3 -m http.server 4187 --bind 127.0.0.1
```

그다음 `http://127.0.0.1:4187`을 엽니다. 이 포트가 이미 열려 있으면 기존 서버를 사용하거나 비어 있는 포트를 지정합니다.

## v5: 인터랙션·모션 계층

lusion.co의 공개 CSS/JS에서 이징·지속 시간·stagger·변위·2차 동역학 값을 추출해 키트 토큰과 컴포넌트로 옮겼습니다. 근거는 [인터랙션·모션 근거 원장](research/interaction-evidence.md), 계약은 [DESIGN.md의 Motion & interaction](DESIGN.md#motion--interaction)에 있습니다.

- [모션 메인 화면 예제](kit/examples/home.html): 로더, 단어 등장, 메뉴 패널, 점 확산 CTA, 텍스트 스왑, 커서 라벨, 틸트 오브젝트, 스크롤 진행 바를 이미지·영상 없이 한 화면에 구성.
- 키트 1.1.0: `createDynamics`·`ease`·`damp` 런타임, `data-ds-split`·`data-ds-panel`·`data-ds-tilt`·`data-ds-cursor`·`data-ds-scroll-progress` 초기화, 인터랙션 레시피 8종. 변경 목록은 [kit/CHANGELOG.md](kit/CHANGELOG.md).
- 검증: [home-motion-v5.json](research/home-motion-v5.json), [verification-v5.md](research/verification-v5.md).

## v4: 실제 프로젝트용 독립 키트

[프로젝트 적용 화면](project-kit.html)에서 18개 컴포넌트를 선택하고 테마·브랜드 색·모션을 조정해 실제 마크업을 복사할 수 있습니다.

- [프로젝트 키트 ZIP](downloads/project-design-system-1.1.0.zip): 외부 런타임 의존성 없이 사용하는 토큰·컴포넌트 CSS, ES module, 타입 선언과 예제.
- [로컬 npm 패키지](downloads/local-project-design-system-1.1.0.tgz): 기존 빌드 프로젝트에 설치하는 동일 코드.
- [워크스페이스 예제](kit/examples/index.html), [사용 가이드와 API](kit/README.md), [v4 검증](research/verification-v4.md).

폼 전송·서버 저장은 프로젝트의 데이터 계층에 연결합니다. 수집한 원본 미디어와 비공개 엔진 재구성은 아래 레퍼런스 아카이브에서 별도로 확인할 수 있습니다.

## v3: 전체 소스 탐색과 재구성

[소스 탐색기](source-explorer.html)에서 파일명·경로·동작 이름으로 검색한 뒤 미리보기, 코드 읽기, 복사, 다운로드를 사용할 수 있습니다. `ScreenPaint`, `BufItem`, `SecondOrderDynamics` 같은 클래스 이름으로 공개 구현을 찾을 수 있습니다.

- **공개 원본:** 연결된 페이지 22개와 에셋 394개. HTML·CSS·JS·미디어·폰트·배포용 바이너리를 원본 파일로 보존합니다.
- **읽기 쉬운 코드:** [전체 JavaScript 정렬본](sources/readable/site.formatted.js), [CSS 정렬본](sources/readable/site.formatted.css), 클래스 235개·함수 776개의 이름별 발췌본. 이는 동일 번들의 분석용 파생 파일이며 추가로 내려받은 원본 에셋 수가 아닙니다. 각 발췌본은 상위 범위와 다른 코드에 의존할 수 있습니다.
- **셰이더:** 공개 번들 및 재구성 코드의 셰이더 문자열을 개별 파일로 분리하고 원본 위치와 추출 방식을 기록했습니다. 목록은 [셰이더 추출 기록](research/source-fragments-v3.json)에 있습니다.
- **3D 데이터:** `.buf` 55개의 헤더·속성·좌표를 분석했습니다. 메시 34개는 OBJ로, 좌표를 가진 55개 모두는 점 데이터 JSON으로 추출했습니다. [디코딩 기록](research/buf-analysis-v3.json)에서 메시·애니메이션 좌표·점 데이터를 구분하고 [모델 뷰어](reconstruction.html#models)에서 실제 추출 모델을 확인할 수 있습니다.
- **재구성:** [재구성 스튜디오](reconstruction.html)에 포인터 흔적, 얼굴·우주복형 입자 변형, 유리 파편, 스프링 추종, 로더·전환 예제를 추가했습니다. 원본 근거·대체 코드·남는 차이는 [구현 설명](media/reconstruction-v3.md)에 있습니다.
- **감사:** [소스 수집 감사](research/source-audit-v3.md), [원본 코드 발췌 검증](research/readable-code-v3.json), [v3 최종 검증](research/verification-v3.md).

**[전체 소스·열람기 ZIP 다운로드](downloads/lusion-source-system-v4.zip)** — 압축을 풀고 `index.html`을 열거나, 압축 해제 폴더에서 위 로컬 서버를 실행합니다. ZIP 내부에서 HTML만 직접 열면 상대 경로의 미디어가 표시되지 않을 수 있습니다.

화면에 표시되는 ‘전체 항목’은 원본 파일과 파생 코드·독립 재구성을 합한 탐색 목록입니다. 추출한 원본과 재구성을 구분해 읽으세요. 공개 참조와 네트워크 관측 범위 밖의 비공개 저장소, 원본 DCC 씬, 모든 외부 프로젝트 사이트까지 확보했다는 뜻은 아닙니다.

## v2: 직접 조작하는 디자인 시스템

Astra 구현 작업을 통합했습니다. 공개 소스로 확인한 값과 영상에서 관찰해 새로 재구성한 부분을 각 예제에 표시합니다.

- [아이콘·박스](components.html): 인라인 SVG 597회 사용을 31종으로 정리하고 외부 SVG 18종·재구성 심벌 9종을 더한 58항목. 메뉴, 폼, 프로젝트 카드, 팀 계기판, 로고 캐러셀, 전문영역 카드 등 13개 컴포넌트.
- [모션 실험실](motion-lab.html): WebGL 3D, 깊이 맵 시차, 충격 입자, 터널, 타이포, 데이터 인포그래픽, 화면 전환, 자석 CTA의 8개 장면과 점 구름·포털 변형. 속도·진폭·일시정지·모션 감소 지원.
- [영상 분석](video-analysis.html): 공개 MP4 28개의 시간 검증 프레임 84장, 장면별 관찰·추정 제작법·직접 탐색 재생.
- [추가 시퀀스](index.html#sequences): 릴 확대, 엔딩 문자 변환, 다음 장면 진행률의 조작 가능한 예제 3개.
- [재구성 구현 명세](media/reconstruction-spec.md), [영상 제작 분석](media/video-analysis.md), [전체 누락 감사와 적용 매핑](research/coverage-v2.md), [최종 검증](research/verification-v2.md).

WebGL과 영상의 정확한 시간 탐색을 이용하려면 위 로컬 HTTP 서버로 여는 것을 권장합니다. 원본 얼굴·우주비행사·유리 굴절·물리 엔진 전체의 동일 복원을 뜻하지 않습니다. 각 재구성의 생략 범위는 구현 명세에 기록했습니다.

## 문서와 파일

| 목적 | 파일 |
| --- | --- |
| 전체 디자인 계약 | [DESIGN.md](DESIGN.md) |
| 색상·폰트·그리드·반응형 토큰 | [tokens/lusion.css](tokens/lusion.css), [tokens/lusion.tokens.json](tokens/lusion.tokens.json) |
| 원본 선택자/모션 수치 근거 | [research/css-evidence.md](research/css-evidence.md), [research/interaction-evidence.md](research/interaction-evidence.md) |
| 모션 구현 원리와 상태 명세 | [media/motion-system.md](media/motion-system.md) |
| 새 이미지·영상 프롬프트 7종과 제작 절차 | [media/production-guide.md](media/production-guide.md) |
| 페이지 목록 | [research/pages.md](research/pages.md) |
| 프로젝트별 테마·미디어·외부 링크 | [research/projects.json](research/projects.json) |
| 파일별 URL·로컬 경로·크기·해시·상태 | [research/asset-manifest.json](research/asset-manifest.json) |
| 사람이 읽는 에셋 목록 | [research/assets.md](research/assets.md) |
| 이미지 크기·영상/오디오 재생 시간 | [research/media-metadata.json](research/media-metadata.json) |
| 공식 출처 및 증거의 한계 | [research/official-sources.md](research/official-sources.md) |
| 수집 규모 | [research/collection-summary.json](research/collection-summary.json) |
| 검증 결과와 제한 | [research/verification.md](research/verification.md) |

## 수집 범위와 읽는 법

수집일은 2026-09-06 KST입니다. 홈페이지에서 연결되는 동일 도메인의 페이지를 순회하고, HTML·CSS·JavaScript의 공개 참조와 브라우저 네트워크를 결합했습니다. 프로젝트 19개를 포함한 페이지 22개를 확보했습니다. 자산 CDN `lusion.dev`는 배포 JS에서 확인하고 수집 범위에 포함했습니다.

프로젝트 갤러리의 확장자 없는 `data-filename`은 원본 런타임의 image `.webp` / video `.mp4` 규칙으로 해석했습니다. `<base href="/">`도 반영합니다. 실제 개수와 크기는 요약 JSON이 기준입니다. 응답 상태가 200이어도 HTML fallback을 반환하는 리소스는 성공 에셋으로 세지 않습니다.

- **추출:** 실제 배포 코드의 값 또는 공개 파일.
- **관측:** 스크린샷과 실행 중 네트워크에서 확인한 동작·자산.
- **제안:** 새 구현을 위한 상태·성능 목표·제작 프롬프트.
- **미확인:** 실제 생성형 모델·프롬프트, DCC 프로젝트·원본 렌더 패스, 비공개 서버 소스, 계약 및 사용 권한.

수집은 연결된 공개 페이지 및 발견한 자산 기준입니다. 인증·우회·숨은 경로 탐색을 하지 않았고, 외부 Labs 전체·클라이언트 웹사이트·Vimeo 스트림을 미러링하지 않았습니다. 외부 영상 URL은 프로젝트 레지스트리에 남깁니다. 공개 릴 미리보기 MP4와 전체 외부 영상은 서로 다른 콘텐츠입니다.

배포 JS/CSS/HTML은 분석용 원문입니다. 이 패키지의 열람기는 원본 JS를 실행하거나 폼을 전송하지 않습니다. `.buf`는 배포 데이터이고 편집 가능한 `.blend/.c4d` 파일이 아닙니다. 공개 파일의 다운로드 가능 여부는 다른 서비스에서의 사용 권한을 뜻하지 않습니다.

## 다시 수집·검증하기

Python 표준 라이브러리만으로 공개 리소스를 수집하고 카탈로그 데이터를 생성할 수 있습니다. 기존 파일은 캐시로 사용하므로 동일 스냅샷을 계속 정리할 때 적합합니다. 새로운 날짜의 스냅샷은 별도 폴더에 만들어 비교합니다.

```bash
python3 scripts/collect.py
python3 scripts/build-catalog.py
python3 scripts/verify.py
```

`collect.py`는 최대 100개 연결 페이지, 3회 의존성 확장, 파일당 60MiB, 패스 단위 1GiB 중단 기준을 둡니다. 이번 수집에서는 이 제한 때문에 제외된 파일은 없었습니다. 사이트맵처럼 HTML fallback을 반환한 경로는 manifest에 별도 기록됩니다.

선택적인 브라우저 재캡처/미디어 검사는 Playwright와 Chromium이 필요합니다. 열람기에 필요한 의존성은 아닙니다. `scripts/browser-runtime.cjs`는 설치된 Playwright 또는 npm 캐시와 Chromium 캐시를 찾으며, `PLAYWRIGHT_MODULE` 및 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`로 경로를 지정할 수 있습니다.

```bash
node scripts/capture.cjs
node scripts/capture-interactions.cjs
# 로컬 서버 4187을 먼저 실행한 뒤:
node scripts/inspect-media.cjs
node scripts/verify-catalog.cjs
node scripts/verify-expansion.cjs
node scripts/verify-motion-v2.cjs
```

브라우저 캡처 스크립트는 저장소 루트에서 실행합니다. 원본은 가상 스크롤·WebGL·전환 애니메이션을 사용하므로 `fullPage` 호출 하나로 전체 장면이 기록되지 않습니다. 캡처 파일의 실제 상태는 검증 문서를 확인합니다.

### v3 소스 정리와 검사

```bash
# 기존 설치된 Prettier를 사용하는 선택적 추출 도구
node scripts/extract-readable.cjs
node scripts/decode-buf.cjs
python3 scripts/build-source-index.py
python3 scripts/test-source-index.py
python3 scripts/verify-workspace.py
# 로컬 HTTP 서버가 켜진 상태
node scripts/verify-source-explorer.cjs
node scripts/verify-source-live.cjs
node scripts/verify-reconstruction.cjs
node scripts/verify-workspace.cjs
# 최종 파일을 ZIP으로 묶고 CRC 검증
python3 scripts/build-package.py
```

소스 인덱스는 새 소스 파일 생성 후 다시 만듭니다. 열람기는 별도 패키지 설치 없이 작동하며, 재추출·브라우저 검사에만 로컬 선택 도구가 필요합니다. `extract-readable.cjs`는 기존 설치 또는 npm 캐시의 Prettier를 찾고, `LUSION_PRETTIER_MODULE`로 설치 디렉터리를 지정할 수도 있습니다.

### v4 독립 키트 재검증

```bash
python3 scripts/build-project-kit.py
node scripts/test-kit-runtime.mjs
# 로컬 HTTP 서버 4187이 켜진 상태
node scripts/verify-kit.cjs
node scripts/verify-kit-package.cjs
node scripts/verify-source-keyboard.cjs
# v5 모션 메인 화면 (자체 서버 사용)
node scripts/verify-home-v5.cjs
```

패키지 검사는 임시 폴더에서 ZIP 실행과 npm 오프라인 설치를 확인합니다. 이 개발 검증에는 Node/npm, Python, Playwright/Chromium 및 npm 캐시의 TypeScript가 필요합니다. 배포 키트 사용에는 이 검증 도구가 필요하지 않습니다.
