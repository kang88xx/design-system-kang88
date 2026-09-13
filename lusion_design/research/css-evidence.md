# Lusion CSS/JS Token Evidence

대상 소스는 `sources/site.css`와 `sources/site.js`입니다. 두 파일은 공개 사이트에서 브라우저로 전달된 번들입니다. 원본 디자인 툴, 비공개 소스 코드, 제작 프롬프트는 이 번들 안에 포함되어 있지 않으므로 아래 내용은 `extracted`(실제 공개 번들 값)와 `recommended`(디자인 시스템화를 위한 별칭 제안)로 분리했습니다.

## 추출 범위

- `tokens/lusion.css`: 재사용 가능한 CSS 변수, 폰트 선언, 타입/그리드 유틸리티.
- `tokens/lusion.tokens.json`: 동일 값을 구조화한 JSON 토큰.
- 이 문서: 압축 CSS/JS에서 확인한 선택자와 값 근거.

## :root 원본 변수

Source pointer: `sources/site.css`, selector `:root`

```css
:root{--color-error: #e90000;--color-off-white: #f0f1fa;--color-white: #fff;--color-dark-white: #e4e6ef;--color-off-white-semi: rgba(240, 241, 250, .7);--color-black: #000000;--color-green: #c1ff00;--color-blue: #1a2ffb;--color-red: #ff4c41;--color-grey-blue: #2b2e3a;--color-dark-blue: #071bdf;--color-purple: #8832f7;--color-project-details-logo-color: #f0f;--grid-space: calc((100% - 11 * var(--grid-gap)) / 12);--grid-gap: 2vw;--global-border-radius: 20px;--base-padding-x: max(5vw, 40px);--base-padding-y: clamp(30px, 4vw, 50px);--header-color: #0016ec;--header-text-color: #000000;--project-details-bg: #000;--project-details-highlight: #000;--project-details-btn-bg: #000;--project-details-btn-text: #000;--project-details-icon-bg: #000;--project-details-icon-color: #000;--project-details-text: #000;--project-details-btn-bg-hover: #000;--project-details-btn-text-hover: #fff;--header-size: clamp(1rem, 1vw, 2rem);--cross-size: clamp(.875rem, 1vw, 2rem)}
```

Source pointer: `sources/site.css`, responsive root overrides

```css
@media (max-width: 812px){:root{--grid-gap: 4vw;--global-border-radius: 15px}}
@media (min-aspect-ratio: 21/9){:root{--base-padding-x: max(6vw, 60px)}}
@media (max-width: 380px){:root{--header-size: clamp(.75rem, 1vw, 2rem)}}
@media (max-width: 812px){:root{--global-border-radius: 10px}}
@media (max-width: 812px){:root{--base-padding-x: 25px;--base-padding-y: 25px}}
@media (max-width: 400px){:root{--base-padding-x: 15px;--base-padding-y: 15px}}
```

`max-width: 812px`에서 `--global-border-radius`가 `15px`로 한 번, 뒤에서 `10px`로 다시 선언됩니다. 실제 cascade 최종값은 같은 조건에서 뒤에 있는 `10px`입니다.

## 폰트

Source pointer: `sources/site.css`, selectors `@font-face`, `html,body,h1,h2,h3,h4,button,input`

```css
@font-face{font-family:Aeonik;src:url(/assets/fonts/Aeonik-Regular.woff2) format("woff2"),url(/assets/fonts/Aeonik-Regular.woff) format("woff");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:Aeonik;src:url(/assets/fonts/Aeonik-Medium.woff2) format("woff2"),url(/assets/fonts/Aeonik-Medium.woff) format("woff");font-weight:500;font-style:normal;font-display:block}
@font-face{font-family:Aeonik;src:url(/assets/fonts/Aeonik-RegularItalic.woff2) format("woff2"),url(/assets/fonts/Aeonik-RegularItalic.woff) format("woff");font-weight:400;font-style:italic;font-display:block}
@font-face{font-family:IBMPlexMono;src:url(/assets/fonts/IBMPlexMono-Regular.woff2) format("woff2"),url(/assets/fonts/IBMPlexMono-Regular.woff) format("woff");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:IBMPlexMono;src:url(/assets/fonts/IBMPlexMono-Medium.woff2) format("woff2"),url(/assets/fonts/IBMPlexMono-Medium.woff) format("woff");font-weight:500;font-style:normal;font-display:block}
@font-face{font-family:LusionMono;src:url(/assets/fonts/LusionMono.woff2) format("woff2"),url(/assets/fonts/LusionMono.woff) format("woff");font-weight:400;font-style:normal;font-display:block}
html,body,h1,h2,h3,h4,button,input{font-family:Aeonik;font-weight:400;font-style:normal}
```

로컬 수집된 폰트 파일은 `sources/assets/lusion.co/assets/fonts/`에 있습니다. 확인된 파일은 Aeonik Regular/Medium/Italic, IBMPlexMono Regular/Medium, LusionMono의 woff/woff2 쌍입니다.

## 타입 토큰

Source pointer: `sources/site.css`, utility selectors

```css
.text-xs{font-size:.75em}
.text-base{font-size:clamp(1rem,1.5vw,2rem)}
@media (max-width: 812px){.text-base{font-size:.875em}}
.text-lg{font-size:1.75em}
@media (max-width: 812px){.text-lg{font-size:1.5em}}
.text-4xl{font-size:clamp(7em,8vw,20em)}
@media (max-width: 812px){.text-4xl{font-size:13vw}}
```

Source pointer: `sources/site.css`, representative display/content selectors

```css
#home-hero-title{position:relative;grid-column:4 / span 5;height:fit-content;line-height:1.1;font-size:2.5vw;will-change:transform;margin:0}
#home-reel-title{position:relative;font-size:10vw;left:-.03em;letter-spacing:-.02em;grid-column:1 / span 12;margin-top:1em;margin-bottom:.5em;line-height:1;will-change:transform}
#project-details-title,#project-details-preview-title{font-size:4.5em;line-height:.95;margin:0}
#footer-section{display:flex;flex-direction:column;min-height:calc(var(--vh, 1vh) * 100);color:var(--color-black);font-size:clamp(.875rem,1vw,2rem)}
```

## 레이아웃/반응형

Source pointer: `sources/site.css`, selectors `.section`, `.project-list`

```css
.section{position:relative;width:100%;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--grid-gap);padding:var(--base-padding-y) var(--base-padding-x)}
@media (max-width: 812px){.section{grid-template-columns:repeat(6,minmax(0,1fr))}}
.project-list{position:relative;grid-column:1 / span 12;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--grid-gap);margin-top:calc(var(--vh, vh) * 8)}
@media (max-width: 812px){.project-list{grid-template-columns:repeat(6,minmax(0,1fr));grid-column:1 / span 6;margin-top:0}}
```

## 형태와 컴포넌트 스케일

Source pointer: `sources/site.css`, representative selectors

```css
#header-right-talk-btn,#header-right-menu-btn{font-size:.875em;border-radius:6.25em;padding:0 1.125em 0 1.625em;font-weight:500;text-transform:uppercase;border:none;transform:scale(0);transition:color .4s,background-color .4s;height:3.2em;cursor:pointer}
#header-menu-links{display:flex;flex-direction:column;text-transform:uppercase;background:var(--color-white);border-radius:.625em;padding:1em .3125em}
#header-menu-newsletter-input-field{pointer-events:none;position:relative;width:100%;height:3.5em;border:0;background-color:var(--color-off-white);border-radius:1.125rem;outline:none;padding:1.25em;font-size:1em}
.project-item-image{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;border-radius:15px}
#video-overlay-cursor{background:var(--color-white);width:6.25em;height:6.25em;border-radius:100%;position:absolute;top:0;left:0;transform:scale(0);display:flex;justify-content:center;align-items:center;pointer-events:none}
```

## CSS 모션 근거

Source pointer: `sources/site.css`, representative selectors

```css
#header{position:fixed;left:0;z-index:52;width:100%;color:var(--color-black);padding:var(--base-padding-y) var(--base-padding-x);font-size:clamp(1rem,1vw,1.5rem);transition:color .25s;pointer-events:none}
#header-background{position:absolute;top:0;right:0;height:calc(var(--vh, 1vh) * 100);width:50vw;background:linear-gradient(270deg,#0b0b1280,#0b0b1200);opacity:0;transition:.4s .4s opacity;pointer-events:none}
#header-menu.--opened #header-menu-links,#header-menu.--opened #header-menu-newsletter,#header-menu.--opened #header-menu-talk,#header-menu.--opened #header-menu-labs{transition:transform .5s var(--open-delay) cubic-bezier(.4,0,.1,1),opacity .5s var(--open-delay) cubic-bezier(.4,0,.1,1);transform:translateZ(0);opacity:1}
#header-menu-links{transition:transform .5s var(--close-delay) cubic-bezier(.4,0,.1,1),opacity .5s var(--close-delay) cubic-bezier(.4,0,.1,1);transform:translate3d(0,5.5em,0) rotate(3.5deg);opacity:0}
#header-right-talk-btn-arrow{position:relative;top:calc(50% - .5em);left:1.2em;transform:translate3d(-2.5em,0,0);position:absolute;width:1em;height:1em;transition:transform cubic-bezier(.4,0,.1,1) .3s}
#header-right-menu-btn-dots{position:relative;transition:transform .4s cubic-bezier(.4,0,.1,1);transform:translateZ(0) rotate(180deg);width:1.15em;height:1.15em}
.header-menu-link-background{position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;background:var(--header-color);border-radius:6.25em;transition:.3s opacity,.4s transform cubic-bezier(.4,0,.1,1);transform:scale(.85)}
#footer-bottom-up svg{width:1.5em;height:1.5em;transition:.4s transform cubic-bezier(.35,0,0,1)}
#footer-bottom-labs:before{content:"";position:absolute;bottom:0;width:100%;height:.125em;background:var(--color-black);transition:.6s transform cubic-bezier(.35,0,0,1);transform-origin:left;transform:scale3d(0,1,1)}
#end-bottom-text{white-space:nowrap;line-height:1.5;font-size:.75em;color:var(--color-black);animation:3s .2s infinite cubic-bezier(.1,0,.1,1) text-animation}
```

## JS 모션/렌더링 근거

Source pointer: `sources/site.js`, class `Settings`

```js
MOBILE_WIDTH=812;DPR=Math.min(1.5,browser$1.devicePixelRatio)||1;USE_PIXEL_LIMIT=!0;MAX_PIXEL_COUNT=2560*1440;SKIP_ANIMATION=!1;WEBGL_OFF=!1;
```

Source pointer: `sources/site.js`, class `Preloader`

```js
class Preloader{percentTarget=0;percent=0;percentToStart=0;DELAY=1.5;MIN_PRELOAD_DURATION=1;PERCENT_BETWEEN_INIT_AND_START=.3;MIN_DURATION_BETWEEN_INIT_AND_START=.25;HIDE_DURATION=.5;
```

Source pointer: `sources/site.js`, render loop

```js
function loop(){window.requestAnimationFrame(loop);let o=performance.now(),e=(o-dateTime)/1e3;dateTime=o,e=Math.min(e,1/20),_needsResize&&_onResize(),properties.hasStarted&&(properties.startTime+=e),Tween.autoUpdate(e),update(e),_needsResize=!1}
```

Source pointer: `sources/site.js`, observed easing names

```text
ease.backInOut, ease.backOut, ease.cubcInOut, ease.cubicIn, ease.cubicInOut, ease.cubicOut, ease.elasticOut, ease.expoIn, ease.expoInOut, ease.expoOut, ease.lusion, ease.quadInOut, ease.quadOut, ease.quartIn, ease.quintInOut, ease.sineIn, ease.sineInOut, ease.sineOut
```

## 추천 토큰화 판단

- 색상은 원본 CSS 변수명을 유지하고, 실사용 시스템에서는 `canvas`, `ink`, `surfaceSoft`, `brandElectric`, `accentLime` 같은 semantic alias를 얹는 방식을 추천합니다.
- 레이아웃은 12컬럼 데스크톱, 6컬럼 모바일, `812px` 모바일 전환점이 반복적으로 확인됩니다.
- 버튼/메뉴 형태는 `6.25em` 또는 `100px` pill, 카드/메뉴 패널은 `.625em`, 글로벌 미디어 라운딩은 `20px`에서 모바일 `10px`로 수렴합니다.
- 모션은 CSS UI 전환의 `cubic-bezier(.4,0,.1,1)`와 라인/CTA 계열의 `cubic-bezier(.35,0,0,1)`가 핵심입니다. JS/WebGL 모션의 실제 곡선 함수 구현은 번들 내부에 있지만 제작자가 사용한 원본 모션 프롬프트나 타임라인 설계 문서는 공개 번들에서 확인되지 않습니다.
