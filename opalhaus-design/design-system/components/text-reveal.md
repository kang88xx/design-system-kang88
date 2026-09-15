# Opalhaus — 원본 텍스트 등장 효과

## 서로 다른 두 효과

**히어로** `Opalhaus® / Visual Collective`는 문자별 blur / opacity / y 효과입니다. **서비스** `Timeless design / to solutions`는 라벨을 포함한 부모 그룹 전체가 올라오는 spring 효과입니다. 서비스 제목에 문자 분할이나 블러를 추가하지 않았습니다.

| 항목 | Hero | Service |
|---|---|---|
| 원본 selector | `.framer-n2b5a6` | `.framer-vqwa91` (제목 `.framer-cceyx3`) |
| 처음 상태 | blur 10px / opacity .001 / y 10px | opacity 0 / y 150px |
| 트리거 | onMount | viewport 50% / once |
| 지연 | start .1s + character .05s | 0 |
| spring | duration .4s / bounce 0 | damping 100 / stiffness 400 / mass 1 |
| 폰트 | Inter Tight 600 | Inter Tight 600 |
| Desktop / Tablet / Phone | 150 / 106 / 70px | 62 / 50 / 40px |
| 자간 / 행간 | -.04em / 1.1 | -.02em / 1.2 |
| 모바일 예외 | 동일 문자 효과 | `<810px` 등장 효과 해제 |

서비스 `SERVICE` 라벨 글씨는 흰색이고 앞의 8px 원은 주황(#ff5d17)입니다. Inter Tight 500, 14px/1.4, 자간 .02em, 원과 글자 간격 8px입니다. 별도 문자 모션은 없습니다. 그룹은 라벨 + 두 줄 제목입니다. 히어로 `BRAND ARCHITECTS` 라벨도 같은 스타일이며 opacity .001→1, delay .3s, spring damping66/stiffness400/mass1로 제목과 독립적으로 나타납니다.

## 복사하여 적용

```html
<link rel="stylesheet" href="text-reveal.css">
<div id="hero-title"></div>
<div id="service-title"></div>
<script src="text-reveal.js"></script>
<script>
  const hero = OpalTextReveal.mount('#hero-title', {
    lines: ['Opalhaus®', 'Visual Collective '],
    mode: 'characters',
    headingTag: 'h1'
  });
  const service = OpalTextReveal.mount('#service-title', {
    lines: ['Timeless design', 'to solutions'],
    label: 'SERVICE',
    mode: 'group'
  });
  // hero.replay(); service.replay();
  // hero.destroy(); service.destroy();
</script>
```

Inter Tight 600 폰트를 적용 대상 사이트에서 로드하세요. `text-reveal.html` 독립 예제에는 Latin WOFF2를 data URL로 내장했습니다. 외부 폰트·이미지 요청이 없습니다. 이미지가 필요한 경우 부모 배경으로 추가하세요. 원본 히어로 배경 이미지 경로는 `../../reveal-data.json`에 있습니다.

## API

`OpalTextReveal.mount(elementOrSelector, options)`는 `{host, play, replay, destroy}`를 반환합니다. 같은 host에 다시 mount하면 기존 observer와 animation을 정리합니다. `OpalTextReveal.destroy()`는 이 컴포넌트의 모든 instance를 정리합니다.

옵션: `mode: 'characters'|'group'`, `lines: string[]`, `label`, `headingTag`, `trigger: 'onMount'|'viewport'|'manual'`, `threshold`, `once`, `startDelay`, `stagger`, `duration`, `y`, `opacity`, `blur`, `damping`, `stiffness`, `mass`, `disabledBelow`. 기본값은 위 원본 값입니다. 수정한 값은 사용자가 정한 동작이며 원본 추출값으로 주장하지 않습니다.

수동 replay는 진행 중인 애니메이션을 취소하고 처음부터 다시 시작합니다. 원본 화면 폭에 따라 서비스 효과가 꺼진 경우 replay도 정적 상태를 유지합니다.

`prefers-reduced-motion: reduce`, `html[data-reduced-motion="true"]`, `opal:motion-change`를 처리합니다. 감소 모드 전환 시 진행 중인 WAAPI 애니메이션을 취소하고 최종 텍스트를 표시합니다. 문자 span은 `aria-hidden` 시각 영역 안에 있으며 heading 하나의 `aria-label`로 완성된 문구를 전달합니다.

## 출처와 재구성 경계

원본 `source/js/56d9e2b185ec-OPWD7ZWkt3yivZbi40Zl69wwUoA2leUVbFXe0jpmNpE.kuRLFEra.mjs`의 effect `Rt`, enter `W`, transition `G`, 두 컴포넌트 호출부를 사용했습니다. `reveal-data.json`에는 각 원본 selector, Unicode character offset, anchor, excerpt가 있습니다. `scripts/build-reveal-data.py`가 출처 anchor 존재를 검증하고 오프라인 gallery 데이터를 갱신합니다.

Hero의 `.05`를 문자별 간격으로 해석하며, 공백도 index에 포함하고 두 텍스트 블록에서 index를 연속시킵니다. 이는 원본 effect 데이터에 기반한 네이티브 분할 방식이며, Framer 내부 블록별 index 처리와 동일하다는 주장은 하지 않습니다. duration .4 / bounce 0은 .4초로 정규화한 임계감쇠 응답으로 재현합니다. Framer duration-spring solver 자체는 포함하지 않았습니다.

Service는 100/400/1 spring 방정식을 120Hz로 샘플링합니다. 종료 오차 .001은 네이티브 renderer의 결정입니다. Gallery는 onMount 효과를 놓치지 않도록 viewport에서 시작하며, desktop 원본 타이포그래피를 카드 폭에 맞게 비례 축소합니다. 독립 컴포넌트 CSS는 원본 responsive 글자 크기를 유지합니다.

원본 히어로 이미지 `.framer-1j22bwa`에는 `filter:grayscale()`가 적용되어 있습니다. Gallery는 배경 전용 pseudo-element에 `grayscale(1)`을 적용하여 주황 라벨 원과 텍스트에는 영향을 주지 않습니다. 독립 HTML에서 선택 이미지를 넣을 때 `.example-hero { --opal-reveal-image: url(your-image.jpg); }`를 설정하면 같은 처리가 적용됩니다.


독립 예제의 `reveal-media/`에는 원본 히어로 PNG가 포함됩니다. 배경만 grayscale(1)로 처리하며 주황 라벨과 흰 글자는 그대로 유지됩니다.
