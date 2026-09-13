# Use the motion presets

`app/src/system/motion.css`(패키지에서는 `@local/reatic-design-system/motion.css` 또는 `styles.css`)를 불러오면 `data-rt-enter` 프리셋을 쓸 수 있다. 프리셋은 관찰된 duration · easing · offset을 그대로 담고 있고 `paused` 상태로 시작한다.

## HTML / vanilla

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="motion.css">

<h2 data-rt-enter="fold">우리는</h2>
<h2 data-rt-enter="fold-2">무에서 유를</h2>
<h2 data-rt-enter="fold-3">창조해냅니다.</h2>
<p data-rt-enter="float-up">…</p>

<script>
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.2 });
  document.querySelectorAll('[data-rt-enter]').forEach((el) => io.observe(el));
</script>
```

## React

```jsx
import { EnterMotion, useEnterMotion } from '@local/reatic-design-system';

<EnterMotion preset="float-up" as="p">두 방법 모두 …</EnterMotion>

function Line() {
  const ref = useEnterMotion({ threshold: 0.3 });
  return <h1 ref={ref} data-rt-enter="fold">리틱인더스트리는</h1>;
}
```

## Presets

| preset | 관찰 원본 | 조정 변수 |
|---|---|---|
| `fade`, `fade-short`, `fade-late` | motion-fadeIn 1200 / 700 / 900+700ms | `--rt-motion-enter` |
| `float-up`, `float-up-short`, `float-left`, `float-right`, `float-viewport` | motion-floatIn 1200 / 600ms, 60px, 100vh | `--rt-motion-offset`, `--rt-top` |
| `fold`, `fold-2`, `fold-3`, `fold-short`, `fold-side` | motion-foldIn + fadeIn, stagger 0/700/1400, 650ms, rotateY 90 | `--rt-motion-fold`, `--rt-motion-fold-fade`, `--rt-motion-stagger-delay` |
| `blur`, `blur-hero` | motion-blurIn 6px 2000ms / 25px 1900ms + 3000ms delay | `--rt-motion-blur-amount`, `--rt-motion-blur-hero`, `--rt-motion-hero-delay` |
| `glide-left`, `glide-right`, `glide-viewport` | motion-glideIn 1200ms, 60px, delay 500 | `--rt-motion-glide`, `--rt-motion-glide-delay`, `--rt-left` |
| `reveal` | motion-revealIn 1200ms clip-path | `--rt-motion-glide` |

변수는 요소 인라인이나 상위 스코프에서 덮어쓴다. 예: `<h1 data-rt-enter="blur-hero" style="--rt-motion-hero-delay: 300ms">`.

## Hover / transition classes

컴포넌트 CSS가 호버를 포함한다: `.rt-nav__link`(color .4s), `.rt-button--cta`(배경 .2s), `.rt-button--secondary`(all .2s), `.rt-button--submit`(.5s), `.rt-tile`(컨테이너 .8s, 미디어 .4s/.5s, 오버레이 .4s). 페이지 전환은 `.rt-page-enter/leave`, `.rt-page-slide-enter/leave`를 라우터 훅에 붙인다.

## Reduced motion

`prefers-reduced-motion: reduce`에서 모든 프리셋과 페이지 전환은 즉시 최종 상태가 되고 배경 영상(`.rt-bg-video`)은 숨겨진다. `useReducedMotion()`은 React에서 같은 조건을 읽는다. 원본 사이트에는 이 대응이 없으므로 로컬 추가 사항이다.

## Do not

- 앰버 CTA 외 요소에 색 전환을 추가하지 않는다(원본 팔레트 규칙).
- 60px 이상 이동, 1200ms 이상 지속을 새로 만들지 않는다. 필요하면 `blur-hero`처럼 delay로 순서를 만든다.
- 스크롤 패럴랙스를 "원본 동작"으로 표기하지 않는다. 원본은 선언만 있고 비활성이다.
