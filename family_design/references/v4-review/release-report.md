# 프로젝트 적용 키트 1.0.0 최종 검수

2026-09-07 KST. Family의 공개 자료 카탈로그에 실제 소비 프로젝트에서 가져다 쓰는 독립 키트를 추가했습니다.

## 바로 사용하기

- [적용 가이드](../../system.html): 컴포넌트·상태·설정 화면 조합·코드 복사·라이트/다크 비교.
- [프로젝트 키트 ZIP](../../family-project-kit.zip): design-system 폴더를 복사하는 방식, 30,521 bytes.
- [npm 설치용 아카이브](../../family-design-system-1.0.0.tgz): npm install ./family-design-system-1.0.0.tgz, 27,722 bytes.
- [설치·API 문서](../../design-system/README.md), [전체 소스 탐색](../../index.html#source-library).

## 이번에 추가·보완한 내용

- 원본 49색 근거를 보존하면서 프로젝트용 시맨틱 토큰·라이트/다크·대비 검사·휴대 가능한 토큰 생성기를 추가했습니다.
- 버튼, 입력/선택/텍스트 영역, 체크박스/라디오, 카드, 배지/알림, 배치, 탭, 아코디언, 대화상자, 드롭다운, 스켈레톤/스피너를 제공합니다.
- .fds 범위와 --fds-* 변수로 다른 프로젝트 스타일과 분리하고 사용자 테마를 적용합니다.
- initFamilySystem(root)/destroy() 수명 주기, 중첩 영역·탭 분리, 고유 ID, dialog 소유권과 포커스 복귀를 검증했습니다.
- JavaScript ESM·TypeScript 선언·CSS 타입 내보내기, 독립 실행 예제, React/Vue 연결 패턴을 제공합니다.
- 실제 검수에서 CSS가 hidden 속성을 덮는 오류, 다크 테마의 하단 링크, CSS import 타입 선언 누락, Python 캐시의 패키지 혼입을 수정했습니다.
- 소스 수집 실패가 캐시의 성공 상태로 덮이는 문제를 수정했습니다. 실패 상태와 캐시 대체 경로를 함께 보존합니다.

## 검증 결과

| 검사 | 결과·근거 |
| --- | --- |
| 동작 API·키보드·중첩·정리 | 14개 통과, [runtime-validation.json](runtime-validation.json) |
| 조합 화면·대비·테마·CSS 범위 | 11개 검사 그룹 통과, [ui-validation.json](ui-validation.json) |
| 반응형 | 320 / 390 / 768 / 1440px, 라이트·다크의 모든 가이드 탭과 dialog 가로 넘침 없음 |
| 패키지 | 14개 파일, 독립 npm 설치·ESM/SSR import·엄격한 TypeScript 소비자 컴파일·ZIP/npm 파일 일치, [package-validation.json](package-validation.json) |
| 분리된 폴더에서 실행 | 임시 폴더에 ZIP 해제 후 해당 폴더만 HTTP 제공, 테마/탭/dialog/dropdown/폼 검사 통과, [isolated-kit-validation.json](isolated-kit-validation.json) |
| 수집기 회귀 | 정상 fetch·실패+캐시·재색인 상태 보존 검사 통과, [collector-validation.json](collector-validation.json) |
| 원본·파생 이미지 | 이미지/SVG 402개 브라우저 디코딩, 소스 탐색·검색·필터·본문 복사·다운로드 검사 통과, [소스 탐색 검증](../v3-review/source-browser-validation.json) |
| 기존 카탈로그 | 영상 재생/구간 이동/배속/닫기와 기존 카탈로그 검사 통과, [카탈로그 검증](../v2-review/validation.json) |
| 전체 파일·압축본 | 561개 파일 크기·SHA-256·미디어 형식·재구성 대응표·프로젝트 키트 소스 포함 여부 검사, [무결성](../v3-review/source-integrity.json), [압축본 무결성](../v3-review/archive-integrity.json) |

브라우저 동작 검사는 Chromium 145.0.7632.6에서 실행했습니다. JavaScript 구문과 Python 컴파일 검사도 통과했습니다. [모바일 화면](system-mobile-390.png), [라이트 화면](system-light-1440.png), [다크 화면](system-dark-1440.png)을 남겼습니다.

## 적용 범위

키트는 작성한 코드와 시스템 폰트로 동작하며 외부 런타임 의존성이나 원본 브랜드 매체가 필요하지 않습니다. 실제 인증·거래·API·폼 저장은 소비 프로젝트에서 연결합니다. React/Vue 예제는 DOM 수명 주기 연결 패턴이며 해당 프레임워크의 실제 제품 통합을 검증한 결과는 아닙니다.

전체 자료는 확인 가능한 공개 리소스와 기존 추출물을 대상으로 합니다. 비공개 앱 원본·확인되지 않은 구조를 추출했다고 표시하지 않으며, 원본 영상 근거와 대체 구현을 카탈로그에서 연결합니다. 이번 최종 단계의 소스 재색인은 로컬 파일 검사이며 원격 리소스를 다시 다운로드한 것은 아닙니다.
