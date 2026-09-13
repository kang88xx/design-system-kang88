# 모션·인터랙션 적용 가이드

제품 통합·어댑터·생명주기 계약: [`USAGE.md`](USAGE.md). 프로젝트용 다운로드: [`adver-system-1.0.0.zip`](releases/adver-system-1.0.0.zip).

실행 페이지: [`motion.html`](motion.html). 원본과 대조한 기록: [`references/motion-audit.md`](references/motion-audit.md).

## 무엇을 구현했나

| 예제 | 실행 파일 | 코드 영역 | 근거와 추가한 동작 |
| --- | --- | --- | --- |
| 히어로 포커스 펄스 | [hero.html](samples/hero.html) | motion-kit | 중앙 검은 원 확장·축소 관찰. 반복 주기와 선 그리기는 제안 |
| 6가지 기하 아이콘 | [benefits.html](samples/benefits.html) | motion-kit | 6개 기하 도형 관찰. hover·focus·touch 피드백은 제안 |
| 크레딧 궤도 | [orbit.html](samples/orbit.html) | motion-kit | 점선/실선 궤도 관찰. 위성 이동과 그리기 타이밍은 제안 |
| 계단형 지표 | [metrics.html](samples/metrics.html) | motion-kit | 계단형 레이아웃 관찰. 카운트업·시차 등장은 제안 |
| 스크롤 순차 등장 | [reveal.html](samples/reveal.html) | motion-kit | 긴 페이지 스크롤 관찰. fade-up 효과 자체는 제안 |
| 광고 프리뷰 6종 | [formats.html](samples/formats.html) | motion-kit | 형식 그리드 관찰. wipe·progress·slide·lift·상품 변경·숫자 루프는 제안 |
| 버튼 상태 | [buttons.html](samples/buttons.html) | interaction-kit | pill CTA 관찰. hover·pressed·focus·loading·완료 상태 보완 |
| 캠페인 4단계 | [tabs.html](samples/tabs.html) | interaction-kit | 선택 변화와 패널 관찰. 이동 밑줄·키보드 탐색·패널 전환 구현 |
| 인용 캐러셀 | [carousel.html](samples/carousel.html) | interaction-kit | 어두운 인용 카드 관찰. 캐러셀·스와이프·자동 재생은 제안 |
| 전문가 문의 | [form.html](samples/form.html) | interaction-kit | 좌측 선 그래픽 + 우측 입력 관찰. 검증·지연·실패·성공은 로컬 시뮬레이션 |
| FAQ | [faq.html](samples/faq.html) | interaction-kit | 펼친 답변 관찰. 높이 전환·상태 속성·빠른 반전 처리 구현 |
| 테마 선택 | [theme.html](samples/theme.html) | interaction-kit | 전역 다크 전환 관찰. system/light/dark·저장·범위 지정은 구현 정책 |
| 내비게이션 | [navigation.html](samples/navigation.html) | interaction-kit | 고정 좌측 탐색 관찰. 모바일 메뉴·Escape·활성 표시·스크롤 연결 구현 |

**범위:** 영상에 보이는 시각 패턴을 커버하는 레퍼런스 라이브러리다. 영상에서 보이지 않은 모든 서비스 동작이나 X 원본 코드의 동일성을 주장하지 않는다. 실제 문의 전송·인증·광고 생성 API는 포함하지 않는다.

## 가장 빠른 사용법

각 예제의 독립 HTML을 열면 CSS·JavaScript가 모두 내장되어 있어 네트워크나 서버 없이도 실행된다. 전체 ZIP은 [`samples/motion-library.zip`](samples/motion-library.zip)에 있다.

프로젝트에 넣을 때는 `tokens.scoped.css`와 필요한 kit CSS/JS를 연결하고 `components/*.html`을 복사한다. 독립 샘플은 데모이며 form/buttons의 제품용 마크업에는 production 모드가 지정되어 있다.

```html
<link rel="stylesheet" href="design-system/tokens.scoped.css">
<link rel="stylesheet" href="design-system/motion-kit.css">
<div class="adver-system" id="my-effect">
  <!-- components/hero.html에서 복사한 HTML -->
</div>
<script src="design-system/motion-kit.js"></script>
<script>
  const element = document.getElementById('my-effect');
  const cleanup = ReferenceMotion.mount(element);
  ReferenceMotion.setSpeed(1);
  // 다시 보기: ReferenceMotion.replay(element);
  // 화면 제거: cleanup();
</script>
```

인터랙션은 같은 방식으로 `interaction-kit.css`, `interaction-kit.js`, `ReferenceInteractions.mount(element, { onSubmit, onAction })`를 사용한다. SPA/React/Vue에서는 DOM이 생성된 뒤 mount하고, unmount 시 반환된 함수를 호출한다. 구현은 DOM/WAAPI/CSS 기반이며 특정 프레임워크에 종속되지 않는다.

## 공통 API

| 함수 | 동작 |
| --- | --- |
| `mount(root = document, options)` | 해당 영역을 초기화하고 cleanup 반환. options는 interaction-kit의 작업 콜백에 사용 |
| `replay(root = document)` | 지정 범위의 효과와 상태를 초기화해 재실행 |
| `setPaused(true / false)` | 라이브러리의 시각 모션과 자동 반복을 정지/재개. 입력·탭의 기능은 유지 |
| `setSpeed(number)` | 0.25–4 범위의 재생 배율. 데모 UI는 0.5/1/1.5/2배 제공 |

동일 root를 다시 mount하면 새 하위 요소를 찾고 동일 cleanup을 반환한다. 중첩 root는 소유권을 공유하며 마지막 cleanup에서 해제한다. 컴포넌트 DOM을 제거하기 전에 cleanup을 호출한다.

`setPaused`와 `setSpeed`는 동일 문서에서 해당 라이브러리 전체에 적용된다. 서로 완전히 독립적인 재생 상태가 필요하면 독립 HTML/iframe으로 분리한다. 범위별 콘텐츠 변경은 `replay(root)`를 사용한다. 코드 보기의 CSS/JS 탭은 축약 의사코드가 아닌 해당 kit의 **실제 전체 소스**다.

## 모션 정책

- 정확한 원본 duration/easing은 미확정이다. 150/200ms 기본 토큰 외에 선 그리기, 패널 전환, 펄스, 궤도마다 명시된 제안 시간을 사용한다.
- 라이트/다크 값은 의미 기반 토큰을 사용한다. 라이트 주요값은 라이브 CSS 관찰, 다크 값은 영상 기반 제안이다.
- 연속 모션에는 일시정지 컨트롤을 둔다. 비활성 문서, 화면 밖의 반복 효과, `prefers-reduced-motion` 변화를 처리한다.
- 모션 감소 환경에서는 반복 이동을 멈추고 최종 수치·텍스트를 유지한다. FAQ/탭/폼은 동작한다.
- 카운트와 광고 데이터는 샘플값이며 실제 성과 데이터로 사용하지 않는다.
- 폼의 pending/success/failure 선택기는 개발 검증용이다. 제품용 마크업은 이 선택기를 제거한다. `mount(root, {onSubmit, onAction})`에 실제 함수를 연결하며, 누락 시 구성 오류를 표시한다. AbortSignal과 오래된 응답 무시는 kit가 처리한다.

## 소스와 생성물

수정할 파일:

- `design-system/motion-kit.css`, `motion-kit.js`, `motion-samples.json`
- `design-system/interaction-kit.css`, `interaction-kit.js`, `interaction-samples.json`
- `motion.html`, `design-system/lab.css`, `lab.js`: 코드 보기·검색·영상 비교 UI

생성물: `design-system/lab-sources.js`, `samples/*.html`, ZIP. 원본 파일을 수정한 뒤 아래 명령으로 다시 만든다.

```sh
python3 scripts/build-release.py
python3 scripts/serve.py
```

미리보기: `http://127.0.0.1:8766/motion.html`. kit 자체는 외부 파일 요청을 하지 않는다. Lab의 레퍼런스 영상 비교는 저장된 `references/recording.mp4`를 사용한다.

## 검증

기존 Playwright 설치가 있는 환경에서 다음 명령으로 실행한다. 프로젝트 의존성을 추가하지 않았다.

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-motion.cjs
```

[`references/verification/motion-result.json`](references/verification/motion-result.json)에 검증한 항목과 한계를 기록한다. 전체 WCAG 인증, Safari/Firefox 전수 검증, 원본과 픽셀 단위 동일성은 검증 범위가 아니다.
