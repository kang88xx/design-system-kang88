# Document system

`templates/reatic-document.html` 한 파일이 문서용 디자인 시스템이다. 홈페이지의 조판 규칙을 A4 제안서·보고서·견적서·메모에 옮겼고, 스타일 가이드와 템플릿과 인쇄 스타일을 한 파일에 담았다. 외부 의존성은 Google Fonts(Noto Sans KR, Work Sans)뿐이며 오프라인에서는 시스템 고딕으로 폴백한다.

## 홈페이지 → 문서 변환 규칙

| 홈페이지 | 문서 |
|---|---|
| 흰 바탕 / 검정 스트립 교대 | 흰 종이 / 검정 표지·구분 페이지(`.doc-cover`, `.doc-strip`) |
| 검정 위 `#f3f3f3` 텍스트 | 동일 |
| 회색 본문 + 검정 볼드 강조 | `.doc-muted b`, `.doc-lead b` |
| 앰버 CTA 1회 | 핵심 숫자·결론 콜아웃·서명선 중 한 곳(`.doc-accent`, `.doc-callout--accent`, `.doc-sign .accent`) |
| 1.4 행간, Noto Sans KR Bold 헤드라인 | 제목 1.4, 본문 1.7 |
| 스케일 260/100/70/60/49/42/38/31/26/21/16/15/13/12/10 | 표지 44 · 장 28 · 절 20 · 소제목 15 · 리드 16 · 본문 11.5pt · 표 10pt · 각주 8.5pt · 핵심 숫자 56 |
| Work Sans 아이브로우·푸터 대문자 | `.doc-eyebrow`, `.doc-header`, `.doc-footer` |
| 40px 라운드 카드, 필 버튼, 2px 사각 제출 | `.doc-card`(r12), `.doc-button`(필), `.doc-button--dark`(2px 사각) |
| 1px `#8a8a8a` 구분선, 2px `#f3f3f3` 입력선 | 1px `#e3e3e3` 괘선, 장 제목 위 2px 검정선, 표 헤더 아래 2px 검정선 |
| 거대한 섹션 여백 | 장 사이 64px, 절 사이 48px, 한 페이지 한 메시지 |

## 패턴 목록

타이포: `.doc-h1/h2/h3`, `.doc-eyebrow`, `.doc-lead`, `.doc-body`, `.doc-muted`, `.doc-fine`, `.doc-note`, `.doc-number`, `.doc-accent`.
구조: `.doc-cover`(표지, page-break), `.doc-header`, `.doc-footer`, `.doc-strip`(구분 페이지), `.page-break`, `.avoid-break`.
데이터: `.doc-table`(숫자 열 `.num`, 합계 `.total`), `.doc-kpis` + `.doc-number`, `.doc-grid` + `.doc-card`(`--dark`), `.doc-timeline`(`.now`), `.doc-steps`(자동 번호).
강조: `.doc-callout`(`--accent`, `--danger`), `.doc-tag`(`--fill`, `--accent`), `.doc-button`(`--dark`), `.doc-sign`.
목록: `.doc-list`, `.doc-list--check`.

## 인쇄

`@page { size: A4; margin: 0 }` + `.doc` 패딩 22/20/24mm. 툴바·가이드는 `@media print`에서 숨김. 제목 뒤 페이지 나눔 방지, 표·카드·콜아웃·단계는 `break-inside: avoid`. `scripts/verify.mjs`가 print 미디어를 에뮬레이션해 `evidence/local/document-template.pdf`를 생성한다.

## 쓰는 법

1. 파일을 복사해 `<article class="doc">` 내용을 바꾼다. 표지 메타(문서·수신·발신·버전)를 채운다.
2. 필요한 패턴만 남긴다. "4. 패턴 카탈로그" 절은 지워도 된다.
3. 앰버를 한 곳만 남긴다. 나머지 `.doc-accent`는 지운다.
4. 브라우저에서 Ctrl/Cmd+P → A4 → 배경 그래픽 켜기 → PDF 저장.

Word/Google Docs로 옮길 때는 같은 값(Noto Sans KR, 제목 28/20/15pt 굵게, 본문 11.5pt 행간 1.7, 회색 `#8a8a8a`, 앰버 `#eea302`, 괘선 `#e3e3e3`)을 스타일로 등록하면 된다.
