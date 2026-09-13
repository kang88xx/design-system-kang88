# 변경 이력

## 1.1.0 — 2026-09-10

- 모션 토큰 계층 추가: 이징 6종(`standard`, `smooth`, `enter`, `out`, `loop`, `expo`), 지속 시간 7단계, stagger 2종, 변위 토큰(`--ds-rise`, `--ds-rise-tilt`, `--ds-panel-rise`, `--ds-panel-tilt`, `--ds-burst`, `--ds-swap-distance`, `--ds-cross-size`, `--ds-cursor-size`). 기본 지속 시간 별칭이 100/300/400ms로 바뀌었습니다.
- 인터랙션 컴포넌트 추가: `.ds-cta`(점 확산), `.ds-talk`, `.ds-dots`, `.ds-menu-link`, `.ds-swap`, `.ds-icon-swap`, `.ds-link`, `.ds-loop`, `.ds-cross`, `.ds-bar`, `.ds-cursor`, `.ds-flip`, `.ds-zoom`, `.ds-mask`, `.ds-panel`, `.ds-backdrop`.
- 런타임 추가: `createDynamics`(2차 동역학 f/z/r), `dynamicsPresets`, `ease`, `cubicBezier`, `damp`. `data-ds-split`, `data-ds-stagger`, `data-ds-panel`, `data-ds-tilt`, `data-ds-cursor`, `data-ds-scroll-progress` 초기화와 `openPanel`/`closePanel`/`togglePanel`/`replay`/`addTask`/`motion` API.
- `data-ds-reveal` 변형(`rise`, `fade`, `scale`, `mask`, `line`), `data-ds-reveal-manual`, `data-ds-reveal-repeat`. 빠른 스크롤·앵커 이동으로 지나친 요소도 표시됩니다.
- 마그네틱이 CSS transition 대신 동역학(snap 프리셋)으로 감쇠합니다.
- 메인 화면 예제 `examples/home.html`과 레시피 8종 추가(총 18종).

## 1.0.0 — 2026-09-07

- 아카이브와 독립적으로 배포할 수 있는 `.ds-root` 범위의 CSS와 ES module 제공.
- 의미 기반 토큰, 라이트·다크·시스템 테마, 10개 마크업 레시피와 실제 화면 예제 제공.
- 탭 키보드 조작, 다이얼로그 포커스 복귀, 텍스트 알림과 인스턴스 정리 API 제공.
- 운영체제 동작 줄이기, reveal·magnetic 장식 모션과 숫자 spring 제공.
- TypeScript 선언, 로컬 npm 패키지, 압축 파일과 사용 가이드 제공.
