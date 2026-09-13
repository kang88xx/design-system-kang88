# Studio Shell 규격 (Apple 포맷)

모든 디자인 시스템 뷰어는 `apple_design`의 스튜디오 셸과 같은 **뼈대**를 쓴다. 브랜드 색·서체·콘텐츠는 각 시스템 것을 그대로 쓴다.
셸 파일: `shell.css`(구조·치수), `shell.js`(모바일 내비·브레드크럼·토스트), `skeleton.html`(DOM 순서), `inventory.py`·`console-check.sh`(검증).

## 1. 레이아웃
- 좌측 고정 사이드바 232px(1200px 이하 210, 900 이하 190, 640 이하 오프캔버스 250) + 우측 `.as-main-shell`.
- 상단바 65px sticky: `☰`(모바일) · 브레드크럼 `Design system / {현재 페이지}` · 우측 도구(검색 → 토글 → `Export tokens ↧`).
- 본문 `.as-workspace` max 1400px, padding 43px 48px 0. 섹션 간격 35px. 푸터 `.as-studio-footer`.

## 2. 사이드바
1. `.as-brand`(높이 104): 브랜드 마크 22×30 · `<strong>브랜드명</strong>` · `<span>Design system</span>` · 우측 배지(`WEB`/`DOCS`/`PROPOSAL`).
2. `.as-sidebar-label` **WORKSPACE** + `<nav>`: 항목마다 `.as-nav-index` 두 자리 번호(01부터, 그룹이 나뉘어도 이어서) + 기존 라벨. 카운트는 `.as-nav-count`, 라이브 표시는 `.as-live-dot`. 현재 항목은 `aria-current="page"`(또는 기존 JS가 쓰는 `.is-active`).
3. `.as-sidebar-bottom`: 상태점 · 수집 상태 한 줄 + `<small>날짜 · 방식</small>` · 원본 사이트 `↗`.

## 3. 개요 페이지 상단
`.as-eyebrow`(상태점 + `{KIND} DESIGN SYSTEM` + `.as-version` YYYY.MM) → `<h1>` 56px → `.as-intro` 19px → `.as-title-actions`(`.as-button` 1차 + `.as-text-command` 2차 ↗) → `.as-stats-strip`(상하 실선, 4열 그리드).

## 4. 개요 외 페이지 상단
첫 요소는 `.as-section-heading`(eyebrow `LIBRARY / {번호}` + h2 36px + 설명). 하위 탭이 있으면 `.as-view-tabs`.

## 5. 섹션
모든 섹션 머리는 `.as-section-heading`(좌: eyebrow/h2 22px/p, 우: `.as-text-command` 액션).

## 6. 브랜드 매핑
각 뷰어의 진입 CSS에서 `:root { --as-font-display:…; --as-font-text:…; --as-accent:…; --as-ink:…; --as-line:…; --as-surface:…; --as-sidebar-bg:…; --as-nav-active-bg:…; --as-nav-active-ink:…; }` 로 자기 토큰을 매핑한다. 셸 치수·간격·크기는 바꾸지 않는다.

## 7. 보존 원칙 (위반 금지)
- 기존 텍스트·링크·이미지·다운로드·데이터·id·data-* 속성·이벤트 대상 요소를 **하나도 잃지 않는다.** 위치와 감싸는 요소만 바꾼다.
- 기존 JS가 참조하는 선택자(id, class, data-*)는 유지한다. 셸 클래스는 **추가**로 붙인다.
- 검색·다크 모드·필터 같은 기존 기능은 제거하지 않고 상단바 도구 영역으로 옮긴다.
- 데이터 파일, 자산, 다운로드 산출물, 단일 HTML 아티팩트/템플릿/키트 예제는 건드리지 않는다.
- 변환 전후 `inventory.py diff` 누락 0, `console-check.sh` 오류 0, 데스크톱 1440·모바일 390 스크린샷 확인이 완료 조건이다.
