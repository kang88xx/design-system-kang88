# Promotion widget

`promo-widget.css`와 `promo-widget.js`를 로드한 뒤 `OpalPromo.mount(element, options)`를 호출합니다. Framer나 외부 라이브러리가 필요하지 않습니다.

```js
const widget = OpalPromo.mount(document.querySelector('#promo'), {
  slides: [
    { src: '/images/banner-1.png', alt: 'All-Access Bundle' },
    { src: '/images/banner-2.png', alt: '60+ Templates' },
    { src: '/images/banner-3.png', alt: 'Promotion 3' },
    { src: '/images/banner-4.png', alt: 'Promotion 4' }
  ],
  href: '/checkout',
  bannerHref: '/templates',
  demo: false,
  part: 'combined', // 'banner' | 'buy' | 'combined'
  scale: 1,
  fixed: true
});
```

이미지는 `slides` 배열로 직접 지정합니다. 포함 HTML 예제의 상대 경로는 디자인 소스 전체 폴더 기준입니다. npm 키트만 설치한 경우 이미지 4장을 프로젝트로 복사하고 경로를 변경해야 합니다. 인터 폰트는 사이트의 로컬 Inter 600 또는 동봉 토큰 CSS로 로드합니다.

원본 크기: 배너 140×60, 버튼 140×36, 간격 5px. 원본 fixed 배치: right 20px / bottom 63px. `scale:2`는 카탈로그 확대 표시용입니다.

이미지 순서와 3초 간격, 위쪽 방향, stiffness 200 / damping 40 / mass 1은 공개 배포 소스에서 추출했습니다. CSS의 버튼 spring duration .4 / bounce .25는 cubic Bézier 근사이며, 배너 spring은 물리 파라미터 방정식을 60fps로 샘플링합니다. 배너 이미지는 텍스트와 로고를 포함한 원본 래스터입니다.

호버: `Buy for $59`가 아래로 빠지고 `Grab Now`가 위에서 내려오며, 배경과 17→279px 원이 #DD453D로 바뀌고 번개가 11→16px 흰색으로 바뀝니다. 배너 자체에는 소스에서 별도 시각적 hover/press 변형이 없습니다. 버튼에도 별도 눌림 축소가 없으므로 추가하지 않았습니다. 클릭은 `target="_blank"` 링크입니다. `demo:true`이면 이동 대신 `opal:promo-activate` 이벤트가 `{href,label}`을 알립니다.

원본의 입장 opacity / y spring(버튼: delay 1.8s, y40→0, stiffness235 damping30)은 `promo-data.json`에 추출되어 있습니다. 재사용 컴포넌트는 삽입 즉시 표시하여 호스트 사이트의 입장 타이밍에 맡깁니다.

`widget.next()`, `widget.pause(true|false)`, `widget.replay()`, `widget.destroy()` 제공. OS 모션 감소, `html[data-reduced-motion="true"]`, `opal:motion-change` 이벤트를 지원합니다. 키보드 focus-visible에 hover를 제공하는 것은 접근성 보완입니다. 가격 문자열은 원본 캡처값이며 현재 판매가를 조회하지 않습니다.


## 독립 예제 미디어

`media/`에 이 배너의 원본 PNG 4개와 Inter 600 Latin 폰트가 포함되어 있어 폴더만 복사해도 예제가 열립니다. `media/manifest.json`에 원본 경로가 있습니다. 실제 프로젝트에서는 자신의 이미지와 링크로 교체하세요.
