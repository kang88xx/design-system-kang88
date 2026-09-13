# ARK Prefab 시각 분석 및 아이콘 확장 규칙

상태: PDF 근거 기반 확장 가이드. 작성일: 2026-09-07.

이 문서는 ARK Prefab 제안서/문서 디자인 시스템에서 아이콘과 도형을 새 주제로 확장할 때 지켜야 할 규칙을 정리한다. 핵심 수정점은 원본 아웃라인 아이콘이 단색 남색이 아니라, 좌상단이 밝고 우하단이 어두운 blue/violet-to-navy 대각 그라디언트라는 점이다. 기존 `assets/icons/*.svg`는 인쇄와 단색 UI용 mono 대안으로 유지하고, 원본 톤에 가까운 기본 확장 자산은 `assets/icons/gradient/*.svg`로 분리한다.

## 검토한 근거

- `source/graphics-contact-sheet.png`: 추출 그래픽 전체 컨택시트. page 15/26 원본 아웃라인 아이콘의 대각 그라디언트를 확인한 핵심 근거.
- `source/graphics/p26-icon-accommodations.png`: house 아이콘 crop. 새 house/gold-bars 확장 기준.
- `source/graphics/p15-icon-fast.png`, `p15-icon-flexible.png`, `p15-icon-economy.png`, `p15-icon-safety.png`: 장점 아이콘 crop.
- `source/graphics/p26-icon-dining.png`, `p26-icon-workspaces.png`, `p26-icon-medical.png`, `p26-icon-recreation.png`, `p26-icon-storage.png`: 시장 솔루션 아이콘 crop.
- `source/graphics/p29-icon-*.png`: 품질/안전 filled 계열 확인.
- `source/previews/page-005.jpg`: 건축 와이어프레임 계열 확인.
- `source/previews/page-009.jpg`: 마스코트 일러스트 계열 확인.
- `source/previews/page-015.jpg`, `page-026.jpg`, `page-029.jpg`: 페이지 내 배치, 크기, 문맥 확인.
- `source/graphics/*.svg`: 추출 SVG는 원본 gradient definition을 재사용 가능한 `<linearGradient>`로 제공하지 않고, 일부 색/형태가 flattened vector 형태로 보인다.

## 색상과 그라디언트

아래 값은 원본 crop PNG와 컨택시트에서 샘플링한 근사값이다. PDF 내부의 재사용 가능한 gradient metadata를 그대로 추출한 값이라고 말하면 안 된다.

| 용도 | 값 | 근거 | 사용 규칙 |
| --- | --- | --- | --- |
| 원본 매칭 아이콘 gradient light | `#5C66D4` | page 26 dining/accommodations crop의 밝은 쪽 샘플 | SVG gradient 0% |
| 원본 매칭 아이콘 gradient mid | `#2733A1` | page 26 house/dining 및 page 15 아이콘 중간값 | SVG gradient 52% |
| 원본 매칭 아이콘 gradient dark | `#051565` | page 15/26 아이콘 어두운 쪽 샘플 | SVG gradient 100% |
| mono 아이콘 대안 | `#091955` | root source summary의 icon navy | 인쇄, 단색 UI, CSS `currentColor` 상황 |
| deep navy | `#061A58` | page 5 및 대형 헤드라인 | 배경/제목 |
| cobalt | `#011187` | section divider pages 4/7/10 | 섹션 배경 |
| steel | `#516086` | PDF rule/stroke | 보조 라인 |
| paper | `#F4F4F8` | page 15/26/29 배경 | 문서 배경 |
| amber | `#EEC12B` to `#EFC540` | page 9 마스코트/라벨 | 제한적 강조, 아이콘 기본색 아님 |

원본 매칭 SVG gradient:

```svg
<linearGradient x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
  <stop offset="0%" stop-color="#5C66D4"/>
  <stop offset="52%" stop-color="#2733A1"/>
  <stop offset="100%" stop-color="#051565"/>
</linearGradient>
```

방향은 SVG 좌표 기준 `x1=8 y1=8`에서 `x2=40 y2=40`으로 진행한다. CSS로 설명할 때는 대략 `135deg` 계열의 좌상단 light → 우하단 dark 대각 그라디언트라고 표기한다. 단, 실제 PDF gradient metadata가 아니라 crop 기반 근사이므로 “sampled approximate”로 기록한다.

## 시각 패밀리 구분

### 1. Original gradient outline utility icons

page 15와 page 26에서 확인되는 기본 확장 패밀리다. 단순한 pictogram, 두꺼운 rounded stroke, open counter, 중앙 정렬, 제한된 디테일을 갖고 있으며 stroke 자체가 blue/violet-to-navy 대각 그라디언트를 가진다. 제안서 카테고리, 장점, 솔루션 카드, 마켓 필터, 작은 섹션 앵커에 사용한다.

규칙:

- Canvas: 48 x 48 viewBox.
- Stroke: 모든 주요 선과 내부 선은 3 units로 통일한다.
- Caps/joins: round.
- Fill: none.
- Color: 기본은 gradientPath 자산의 source-match gradient. 인쇄나 단색 UI에서는 mono path 자산의 `currentColor` / `#091955` 대안을 사용한다.
- Geometry: 45/90도 roofline, box, circle, shield, horizontal baseline 중심.
- Safe zone: 대체로 x=7..41, y=6..42 안에 배치한다.
- Detail budget: 3~7개 시각 요소. 주제 식별에 필요 없는 장식은 제거한다.

### 2. Print mono outline icons

`assets/icons/*.svg`에 있는 단색 아이콘은 원본 기본 톤이 아니라 인쇄/단색 UI 대안이다. 같은 geometry를 유지하되 `currentColor`를 사용해 제안서 제작자가 navy, black, white 등 문맥 색을 적용할 수 있게 한다.

규칙:

- 원본 화면 매칭이 목표이면 mono를 기본값으로 쓰지 않는다.
- 흑백 인쇄, laser cut, single-color PPT theme, accessibility high-contrast 모드에서 사용한다.
- mono 파일도 `origin: extension`으로 표시한다.

### 3. Filled quality icons

page 29의 precision, compliance, accountability는 더 무겁고 filled한 품질/안전 계열이다. 원본에도 gradient/blue tonal fill이 보이지만, outline utility grid와 섞으면 위계가 깨진다. 인증, 검사, 책임, 품질 보증처럼 강조가 필요한 proof point에만 사용한다.

규칙:

- silhouette가 compact하고 무게감 있어야 한다.
- outline utility 아이콘보다 강조도가 높다.
- 같은 카드 grid 안에서 outline 아이콘과 무작위 혼용하지 않는다.

### 4. Mascot illustration

page 9의 노란 캐릭터, navy helmet, 검정 윤곽선은 사람/부서 설명용 일러스트다. 제안서 전문성을 해치지 않도록 제한적으로 사용한다.

규칙:

- 영업/기술/품질/총무 같은 부서 설명, onboarding, 내부 안내에 적합하다.
- category icon이나 버튼 아이콘으로 변환하지 않는다.
- 금괴, 의료, 물류 같은 신규 주제를 모두 캐릭터화하지 않는다.

### 5. Architectural wireframe

page 5의 dark navy 배경과 얇은 white/steel line 건축물은 기술/공간 설명 계열이다. 모듈러 건물, 조립 구조, 생산 공정 hero visual에 적합하다.

규칙:

- deep navy ground 위에 hairline white/steel line을 쓴다.
- 반복 평행선과 직교/아이소메트릭 구조를 유지한다.
- outline utility icon과 같은 48px pictogram으로 축소하지 않는다.

### 6. Soft volumetric chart

page 14 계열의 부드러운 볼륨/동심원 chart는 데이터 시각화 패밀리다. 시장 규모, 비율, 성장률 표현에만 사용한다.

규칙:

- navy 배경 위 translucent indigo/white layer.
- 수치와 출처 캡션이 필수다.
- 사물 아이콘이나 장식 도형으로 남용하지 않는다.

## 생성된 확장 자산

모든 파일은 새로 구성한 extension 예시이며 원본 추출 아이콘이 아니다.

| 주제 | 원본 매칭 gradient | 인쇄 mono |
| --- | --- | --- |
| House | `assets/icons/gradient/house.svg` | `assets/icons/house.svg` |
| Gold Bars | `assets/icons/gradient/gold-bars.svg` | `assets/icons/gold-bars.svg` |
| Shield | `assets/icons/gradient/shield.svg` | `assets/icons/shield.svg` |
| Warehouse | `assets/icons/gradient/warehouse.svg` | `assets/icons/warehouse.svg` |
| Logistics | `assets/icons/gradient/logistics.svg` | `assets/icons/logistics.svg` |
| Medical | `assets/icons/gradient/medical.svg` | `assets/icons/medical.svg` |
| Clock Fast | `assets/icons/gradient/clock-fast.svg` | `assets/icons/clock-fast.svg` |
| Flexible Module | `assets/icons/gradient/flexible-module.svg` | `assets/icons/flexible-module.svg` |
| Economy Coins | `assets/icons/gradient/economy-coins.svg` | `assets/icons/economy-coins.svg` |
| Workspace | `assets/icons/gradient/workspace.svg` | `assets/icons/workspace.svg` |
| Dining | `assets/icons/gradient/dining.svg` | `assets/icons/dining.svg` |
| Recreation | `assets/icons/gradient/recreation.svg` | `assets/icons/recreation.svg` |
| Precision Tool | `assets/icons/gradient/precision-tool.svg` | `assets/icons/precision-tool.svg` |
| Compliance Check | `assets/icons/gradient/compliance-check.svg` | `assets/icons/compliance-check.svg` |
| Accountability User | `assets/icons/gradient/accountability-user.svg` | `assets/icons/accountability-user.svg` |
| Modular Cabin | `assets/icons/gradient/modular-cabin.svg` | `assets/icons/modular-cabin.svg` |

## House → Gold Bars 확장 원칙

page 26 house icon의 roof/body/baseline grammar를 금괴로 바꿀 때도 색과 소재를 literal하게 바꾸지 않는다. “금”이라는 의미는 stacked modular bars와 inset face marks로 표현한다.

유지할 것:

- 48 x 48 canvas.
- 3-unit rounded stroke.
- 좌상단 light → 우하단 dark blue/violet-to-navy gradient.
- open counter와 단순한 모듈러 geometry.
- 원본 house와 비슷한 중앙 mass, edge breathing.

바꿀 것:

- roof triangle은 세 개의 stacked bar silhouette로 바꾼다.
- door/window는 bar face를 암시하는 짧은 inset line으로 바꾼다.
- 금색, 광택, bevel, 3D extrusion은 금지한다.

## Optical QA rubric

출시 전 각 extension을 1~5점으로 평가한다.

- 원본 계열 일치: page 15/26 gradient outline family로 보이는가?
- gradient 방향: 좌상단 light, 우하단 dark가 유지되는가?
- stroke 일관성: 모든 주요 선과 내부 선이 3-unit로 보이는가?
- 중심 정렬: main mass가 24/24 근처에 놓이는가?
- edge safety: stroke cap이 48 viewBox 밖으로 잘리지 않는가?
- 24px 식별성: 작은 크기에서도 주제가 읽히는가?
- 패밀리 혼합 방지: mascot, filled quality, wireframe, soft chart 문법이 섞이지 않았는가?
- 출력 위생: valid SVG, unique gradient id, no external asset, no filter, no script.

## 한계

이번 gradient stop은 실제 crop에서 샘플링한 근사값이다. `source/graphics/*.svg` 파일에는 재사용 가능한 원본 `<linearGradient>` 정의가 없고, 원본 아이콘은 flattened vector/PNG crop으로 확인된다. 따라서 새 `assets/icons/gradient/*.svg`는 source-match extension이며, 정확한 원본 추출 아이콘이라고 표기하면 안 된다.
