# View All Blogs — Opalhaus Primary CTA

독립 HTML/CSS/JS 컴포넌트입니다. `blog-cta.html`을 직접 열어 hover, focus, click 상태를 확인하세요. 외부 프레임워크나 네트워크 의존성이 없습니다.

## 적용

1. `blog-cta.css`를 불러옵니다.
2. `blog-cta.html`의 `<a class="opal-blog-cta">…</a>`를 복사합니다.
3. `href="/blog"`와 두 개의 텍스트 라벨을 변경합니다. 두 번째 라벨은 `aria-hidden="true"`를 유지합니다.
4. **실제 적용 시 `data-preview`를 제거합니다.** 기본 링크는 같은 탭에서 이동합니다. Cmd/Ctrl 클릭, 새 탭 열기, Enter는 브라우저 기본 동작입니다.
5. JavaScript는 선택입니다. 필요한 경우 `blog-cta.js`를 로드하면 `opal:cta-activate` 이벤트가 발생합니다. 이 취소 가능한 이벤트의 `preventDefault()`로 클릭을 가로챌 수 있습니다.

```js
document.addEventListener('opal:cta-activate', event => {
  console.log(event.detail.href); // /blog
  // event.preventDefault(); // 클라이언트 라우터가 이동을 맡을 때만 사용
});
```

예제 HTML의 `data-preview`는 실제 이동 대신 목적지를 출력하는 카탈로그 전용 기능입니다. production용 링크는 JavaScript 없이도 작동합니다.

## 추출 값과 상태

| 항목 | 원본 값 |
|---|---|
| 컨테이너 | 높이 46px, padding 4px 56px 4px 20px, radius 50px |
| 배경 | 기본 #ff5d17 → hover #0a0a0a |
| 원형 | 38×38px, top/right/bottom 4px, radius 35px, #ffffff |
| 텍스트 마스크 | 높이 20px, 두 라벨 간 gap 5px, Primary에서는 고정 |
| 화살표 마스크 | 22×22px, rotate(-45deg), overflow hidden |
| 두 아이콘 | 20×20px, gap 10px, bold |
| 시작 → hover | incoming x -28→0, outgoing x 2→30 |
| 아이콘 교체 | incoming CaretRight → ArrowRight |
| spring | type spring, bounce .2, delay 0, duration .4s |
| press | 별도의 whileTap / scale 값 없음 |
| click | native anchor href + optional Click callback |

원본은 `justify-content:flex-end` → `flex-start`를 Framer layout projection으로 보간합니다. 여기서는 동일한 위치를 `translateX`로 보간합니다. -45° 회전은 **마스크 전체에 항상 고정**되어 있습니다. 원형 전체를 돌리지 않습니다.

Primary 텍스트 롤링을 추가하지 않았습니다. 원본에서 텍스트 `justify-content:flex-end` hover가 선언된 것은 `Plain white` / `Plain colored` 변형뿐입니다. 스크린샷의 Primary CTA는 해당되지 않습니다.

## 출처와 정확도

- 원본 모듈: `../../source/js/1b74ddc35131-HE93u556K.BmCsTx7i.mjs`
- 컴포넌트/variant: `HE93u556K`, `K5tSEeCbX` / `.framer-GL2RT.framer-v-1tenthq`
- spring: `U={bounce:.2,delay:0,duration:.4,type:…}`
- 원형: `.framer-1ds6xvl`
- 화살표 마스크: `.framer-wizsgb`
- 아이콘: `.framer-1l0f3hq-container`, `.framer-1o4pyvh-container`
- 텍스트: `.framer-ulnch2`, `.framer-irhf2l`, `.framer-1030fbo`
- 추적 가능한 정확한 Unicode offset와 excerpt: `../../motion-data.json`의 `primary-cta`

형상과 상태 값은 원본 추출입니다. `.4s cubic-bezier(.2,.8,.2,1)`은 Framer의 duration/bounce spring에 대한 CSS 근사입니다. SVG는 원본이 지정한 Phosphor bold 아이콘의 선 형태를 재구성했으며 원본 아이콘 파일의 바이너리 복사본은 아닙니다. `focus-visible`은 키보드 접근성을 위해 hover와 동일하게 매핑한 추가 동작입니다.

`prefers-reduced-motion: reduce` 또는 `<html data-reduced-motion="true">`에서는 전환 없이 상태가 즉시 바뀝니다.

## 네이티브 마운트 API

```html
<link rel="stylesheet" href="design-system/components/blog-cta.css">
<div id="requested-blog-cta"></div>
<script src="design-system/components/blog-cta.js"></script>
<script>OpalBlogCTA.mount('#requested-blog-cta', {href:'/blog', label:'View All Blogs', preview:true});</script>
```

`preview:false` (기본값)는 실제 링크 이동입니다. `preview:true`는 목적지 출력만 합니다. 폰트는 Inter Tight 600, 16px, line-height 1.2입니다. 흰색은 live token 해석 결과 #ffffff입니다.

독립 HTML은 Inter Tight 600 Latin WOFF2를 data URL로 내장하여 패키지 밖의 폰트 파일을 요청하지 않습니다. 원본: `assets/fonts/603db177c947-NGSwv5HMAFg6IuGlBNMjxLsH8ag.woff2`. 사이트에 CSS/JS만 이식할 때는 사용하는 사이트에서 Inter Tight 600을 로드하세요.

### 원본 Unicode offset 인덱스

| 앵커 | offset |
|---|---|
| `U={bounce:.2` | 14264 |
| `onTap:J` | 16199 |
| `style:{rotate:-45}` | 26569 |
| `.framer-GL2RT.framer-1tenthq {` | 28459 |
| `.framer-GL2RT .framer-ulnch2 {` | 28829 |
| `.framer-GL2RT .framer-1ds6xvl {` | 29246 |
| `.framer-GL2RT .framer-wizsgb {` | 29601 |
| `.framer-GL2RT.framer-v-1tenthq.hover .framer-wizsgb` | 31581 |
| `.framer-styles-preset-1s07g8p:not` | 10133 |
