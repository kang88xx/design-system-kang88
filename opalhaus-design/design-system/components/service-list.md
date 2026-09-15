# Service list and hero service links

Load `service-list.css` and `service-list.js`, then:

```js
const items = [
  { number:'01', label:'Brand Strategy', heroLabel:'Brand Strategy', href:'/services/brand-strategy', image:'/images/brand.png' },
  { number:'02', label:'Visual Identity', heroLabel:'Visual Identity', href:'/services/visual-identity', image:'/images/visual.jpg' },
  { number:'03', label:'Content System', heroLabel:'Content Systems', href:'/services/content-systems', image:'/images/content.jpg' },
  { number:'04', label:'Website Design', heroLabel:'Website Design', href:'/services/website-design', image:'/images/website.jpg' }
];
const section = OpalServices.mount(document.querySelector('#services'), { items, demo:false, reveal:true });
const hero = OpalServices.mount(document.querySelector('#hero-links'), { items, part:'hero', demo:false });
```

No external dependencies or requests. The HTML example includes local original images in `service-media/`. Keep that directory beside the example. Load your local Inter Tight font (400 for hero, 600 for rows) for exact typography; the project font bundle contains these weights.

Source geometry: 471×248 image, radius12, 248px vertical steps, 60px column gap. Image is selected on hover and remains selected on leave. Row spring stiffness400/damping65/mass1 drives opacity .44→1, arrow rotation−45°, orange color, and underline width0→100%. Hero text and number both roll upward36px inside26px masks, gap10px. Image/hero duration .4/bounce .2 springs use CSS easing approximation; physical row and entrance springs are sampled from their source parameters.

Homepage switches to mobile service variant below1200px: image hidden, number/name stacked, 49px circle,20px vertical padding, text opacity1. The catalog narrows columns to fit its sidebar; standalone CSS preserves the original spacing.

`demo:true` intercepts links and emits `opal:service-activate` with `{href,index}`. Real hrefs are native same-tab links. Keyboard focus mirrors hover. Source contains no additional press scaling.

`select(index)` sets the preview image. `replay()` plays the source list entrance (y150→0, opacity0→1, delay.2, stiffness400/damping100/mass1); `reveal:true` triggers it once at50% intersection on desktop. `destroy()` cleans up observers/listeners/animations.

OS reduced motion, `html[data-reduced-motion="true"]`, and `opal:motion-change` are supported. Full original excerpts are in `services-data.json`.


독립 예제에는 Inter Tight Latin font subset을 `service-media/`에 함께 포함했습니다. 원본 경로: `assets/fonts/603db177c947-NGSwv5HMAFg6IuGlBNMjxLsH8ag.woff2`. 실제 프로젝트에서는 기존 폰트 설정을 사용하거나 선택적으로 연결하세요.
