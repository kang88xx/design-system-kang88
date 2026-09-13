# ARK Prefab 아이콘/도형 확장 프롬프트 가이드

이 가이드는 ARK Prefab PDF의 기존 시각 문법을 유지하면서 새로운 제안서/문서용 아이콘과 도형을 만들기 위한 프롬프트 규칙이다. 기본값은 page 15/26에서 확인되는 original gradient outline family다. 단색 아이콘은 인쇄나 단색 UI를 위한 대안이다.

## 기본 프롬프트 템플릿: 원본 매칭 gradient outline

```text
[SUBJECT]를 표현하는 ARK Prefab 제안서용 단일 SVG 아이콘을 만들어라.
패밀리: PDF page 15/26의 original gradient outline utility icon.
Canvas: 48x48 SVG viewBox.
Stroke: 모든 주요 선과 내부 선은 3 units, stroke-linecap round, stroke-linejoin round.
Fill: none.
Gradient: 좌상단 light에서 우하단 dark로 흐르는 blue/violet-to-navy 대각 stroke gradient.
Gradient stops: 0% #5C66D4, 52% #2733A1, 100% #051565. 이 값은 source crop 샘플 기반 근사값이다.
SVG gradient vector: x1=8 y1=8 x2=40 y2=40, gradientUnits=userSpaceOnUse. CSS 설명 시 대략 135deg.
Geometry: 모듈러 건축 제안서에 맞는 단순한 roofline, box, circle, shield, baseline, 45/90도 구조.
Composition: 모든 stroke가 48 viewBox 안에서 잘리지 않게 하고, main mass를 24/24 중심 근처에 둔다.
Output: inline SVG만 출력한다. raster image, external font, filter, shadow, script는 쓰지 않는다.
Metadata: origin은 extension, sourcePages는 [15,26] 또는 실제 참조 페이지로 표시한다.
```

## 인쇄 mono 대안 프롬프트

```text
위 아이콘과 동일한 geometry를 유지하되, gradient stroke 대신 currentColor stroke를 사용한 print mono SVG를 만들어라.
Standalone fallback color는 #091955로 둔다.
나머지 규칙은 48x48 viewBox, 3-unit rounded stroke, fill none, no external asset을 그대로 유지한다.
이 mono 버전은 원본 매칭 기본값이 아니라 인쇄/단색 UI 대안이다.
```

## Negative prompt

```text
photorealistic, shiny, metallic, beveled, emoji-like, mascot-like, filled 3D, skeuomorphic, stock-library generic 스타일로 만들지 말 것.
blue/violet-to-navy source-match stroke gradient 외의 그라디언트는 쓰지 말 것.
gold bars 주제에서도 금색 metallic gradient, 광택, coin pile, dollar clip-art, sparkle, shadow, 3D extrusion을 쓰지 말 것.
tiny text, 과도한 hatch line, 복잡한 perspective, handwritten line, mixed stroke weight, sharp miter spike, 외부 브랜드/로고 복사는 금지한다.
```

## 패밀리 선택 규칙

Original gradient outline utility icons를 기본으로 쓴다. 제안서 카테고리, 솔루션 카드, 장점, 프로세스, 시장 필터, 작은 섹션 앵커에 적합하다.

Print mono outline icons는 흑백 인쇄, 단색 PPT theme, single-color UI, high-contrast 상황에만 쓴다. 화면에서 원본 PDF 톤을 맞추려면 gradientPath 자산을 우선한다.

Filled quality icons는 precision, compliance, accountability, certification, inspection처럼 proof point를 강조할 때만 사용한다. page 29 계열이며 outline grid의 일반 카테고리 아이콘처럼 쓰지 않는다.

Mascot illustration은 부서, 사람, onboarding, 내부 안내용이다. page 9의 yellow body, navy helmet, black expressive line을 유지해야 하며 버튼/필터 아이콘으로 쓰지 않는다.

Architectural wireframe은 건물 시스템, 제조, 조립, 공간 구조를 설명하는 큰 장면에 사용한다. dark navy ground, white/steel hairline, repeated parallel line을 유지한다.

Soft volumetric chart는 시장 규모, 비율, 성장률 같은 데이터 시각화에 사용한다. 사물 아이콘 생성용 스타일이 아니다.

## Outline family invariant geometry

- 48 x 48 viewBox.
- stroke-width는 3으로 통일한다.
- stroke-linecap과 stroke-linejoin은 round.
- fill은 none.
- main subject는 대략 28~34 units 폭/높이를 차지한다.
- baseline은 y=36, y=38, y=40 중 하나를 우선한다.
- stroke cap이 잘리지 않도록 edge에서 최소 4 units 여유를 둔다.
- 하나의 primary silhouette와 2~4개의 내부 clue로 주제를 식별한다.
- 24px에서도 읽히지 않는 세부 묘사는 제거한다.

## 허용되는 주제 변형

- house → warehouse: roof를 넓히고 loading door와 side panel을 추가한다.
- house → gold bars: roof/body 구조를 세 개의 stacked modular bar로 바꾸고, 금색이 아니라 source-match blue gradient stroke로 표현한다.
- storage → logistics: package cube에 route arrow와 movement line을 추가한다.
- medical → emergency/safety: cross를 shield나 kit 구조로 바꾼다.
- workspace → control room: monitor pair와 desk/chair clue를 더한다.
- dining → hygiene: fork/knife에 water drop이나 단순 sparkle을 추가할 수 있으나 stroke 3 규칙은 유지한다.
- recreation → wellness: lounge base, ball, sun/leaf silhouette 중 하나만 추가한다.

## Worked example: house → gold bars

Input source: page 26 accommodations house icon.

Preserve:

- 48x48 canvas.
- page 15/26 계열의 3-unit rounded stroke.
- 좌상단 light → 우하단 dark blue/violet-to-navy source-match gradient.
- open counter와 단순한 modular geometry.
- 중심 mass와 edge breathing.

Change:

- roof triangle을 세 개의 stacked bar silhouette로 전환한다.
- door/window detail을 bar face를 암시하는 짧은 inset line으로 전환한다.
- value 의미가 필요하면 작은 상승 tick 정도만 허용한다.
- 금색 소재 표현은 금지한다.

Prompt:

```text
page 26 accommodations house icon의 문법을 바탕으로 gold bars를 표현하는 ARK Prefab outline utility SVG icon을 만들어라. 48x48 viewBox, 3-unit rounded stroke, fill none을 사용한다. Stroke에는 source-match blue/violet-to-navy diagonal gradient를 적용한다: x1=8 y1=8 x2=40 y2=40, stops 0% #5C66D4, 52% #2733A1, 100% #051565. 세 개의 stacked modular bar와 짧은 inset face marks만 사용하고, main mass를 중앙에 둔다. 결과는 luxury commodity illustration이 아니라 ARK proposal category icon처럼 보여야 한다. origin은 extension, sourcePages는 [15,26]으로 표시한다.
```

Negative prompt:

```text
photorealistic gold, metallic yellow gradient, bevel, shine, sparkle, coin pile, dollar clip-art, dense hatching, perspective camera angle, filled object, shadow, 3D extrusion 금지. 허용되는 gradient는 ARK blue/violet-to-navy stroke gradient뿐이다.
```

## SVG 출력 규칙

원본 매칭 gradient 파일:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-labelledby="title desc" style="color:var(--ark-icon-color,#091955)">
  <title id="title">Subject icon</title>
  <desc id="desc">Newly constructed ARK Prefab gradient outline extension; not an original extracted asset.</desc>
  <metadata>{"origin":"extension","sourcePages":[15,26],"family":"outline-utility","tone":"gradient"}</metadata>
  <defs>
    <linearGradient id="uniqueGradientId" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="var(--ark-icon-gradient-light,#5C66D4)"/>
      <stop offset="52%" stop-color="var(--ark-icon-gradient-mid,#2733A1)"/>
      <stop offset="100%" stop-color="var(--ark-icon-gradient-dark,#051565)"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#uniqueGradientId)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    ...
  </g>
</svg>
```

인쇄 mono 파일:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-labelledby="title desc" style="color:var(--ark-icon-color,#091955)">
  <title id="title">Subject icon</title>
  <desc id="desc">Newly constructed ARK Prefab outline extension; not an original extracted asset.</desc>
  <metadata>{"origin":"extension","sourcePages":[15,26],"family":"outline-utility","tone":"mono"}</metadata>
  <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    ...
  </g>
</svg>
```

## QA 체크리스트

- 화면 원본 매칭에는 `gradientPath`를 사용했는가?
- 인쇄/단색 대안에는 `path`의 mono SVG를 사용했는가?
- gradient 방향이 좌상단 light → 우하단 dark인가?
- 모든 주요/내부 stroke가 3 units인가?
- 24px에서도 주제가 식별되는가?
- mascot, filled quality, wireframe, soft volumetric chart 문법을 잘못 섞지 않았는가?
- `origin: extension` metadata와 source page reference가 있는가?
- external image, filter, font, script가 없는 valid SVG인가?
