from pathlib import Path
import json
R=Path(__file__).resolve().parent.parent
T=json.loads((R/'tokens.json').read_text());C=json.loads((R/'component-specs.json').read_text())['components'];M=json.loads((R/'assets/manifest.json').read_text())
md='''# Design

## Source of truth

**Status: Active · Edition 02 · 2026-09-14.** 대상은 [Opalhaus 공개 사이트](https://opalhaus.framer.website/)의 디자인 언어와 이 저장소의 재사용 디자인 시스템입니다. 문서/열람 포맷은 사용자가 지정한 `/Volumes/T9/02_Source/family_design`의 Studio shell, source browser, motion playground, project kit 구조를 기준으로 합니다. Family의 제품 디자인 값은 가져오지 않습니다.

이전 결과의 자료 링크 중심 카탈로그를 실제 규칙 탐색, 조작 가능한 예제, 설치 키트로 확장했습니다. 기존 HTML/이미지/영상/폰트 원본은 보존합니다.

### 근거 등급

| 표기 | 의미 | 사용 원칙 |
|---|---|---|
| source-css / source-js | 공개 배포 소스에서 직접 추출 | 원본 파일·selector 또는 문자 offset으로 추적 |
| measured-browser | 렌더된 DOM computed style | viewport·캡처 파일·elementIndex 포함 |
| normalized-inline-svg | 원본 인라인 벡터를 독립 파일로 정리 | URL decode와 CSS 변수 fallback 치환을 기록 |
| reconstruction | 원본 동작을 독립 코드로 재구성 | 편집 원본으로 표시하지 않음 |
| recommendation | 대상 프로젝트의 사용성·접근성 보완 | 원본 사이트에 있던 값으로 주장하지 않음 |

### 산출물과 책임

| 파일 | 용도 |
|---|---|
| `tokens.json` / `tokens.css` | 원본 색상·타입 프리셋·실측 레이아웃과 의미별 CSS 변수 |
| `component-specs.json` | 주요 15개 컴포넌트의 selector·상태·원본 규칙 |
| `design/extracted-rules.json` | 25페이지에서 추출한 작성자 CSS 규칙 7,186개 |
| `motion-data.json` / `motion-source-tokens.json` | 모션 의도·파라미터·근거·재구성 범위 |
| `source-coverage.json` | 페이지와 주요 영역의 추출 근거 지도 |
| `source-library.json` / `source-library-data.js` | 전체 원본/파생/구현 파일의 열람 인덱스 |
| `assets/manifest.json` | 변경하지 않은 공개 원본의 URL·SHA-256·크기 |
| `design-system/` | 실제 프로젝트로 복사하는 독립 CSS/JS 키트 |
| `evidence/` | 원본 화면과 새 카탈로그 검증 결과 |

## Brand

**크고 단정한 타이포그래피, 넓은 공간, 제한된 오렌지, 이미지 중심 포트폴리오.** 브랜드 개성은 과한 그림자나 복잡한 장식보다 큰 글자와 움직이는 디테일에서 나옵니다. 라운드 카드와 pill CTA를 쓰되 모든 컴포넌트에 같은 radius를 강제하지 않습니다.

신뢰 신호는 프로젝트 이미지, 명확한 서비스 범위, 수치, 후기, 연락 CTA입니다. 실제 콘텐츠가 없는 수치나 후기를 새 프로젝트에 사실처럼 복사하지 않습니다. 촘촘한 대시보드나 과도한 그라디언트로 바꾸면 원래 인상이 약해집니다.

## Product goals

목표는 디자이너와 개발자가 사이트를 다시 뜯어보지 않고 색상·서체·간격·컴포넌트·모션을 자신의 사이트에 연결하는 것입니다. 성공 기준은 소스에서 원하는 항목 검색, 값과 근거 확인, 예제 조작, 코드 복사, 독립 키트 실행까지 이어지는 흐름입니다.

Framer 편집 파일이나 비공개 CMS를 복원하는 작업은 범위 밖입니다. 공개 자료에서 찾지 못한 원본 값을 임의로 만들어 정확한 추출로 표시하지 않습니다. 설치 키트는 기존 프로젝트 프레임워크를 교체하지 않습니다.

## Personas and jobs

- **디자이너:** 원본 이미지와 유형별 규칙을 비교하고 사용할 비율·글자 위계를 고릅니다.
- **프런트엔드 개발자:** 필요한 스타일과 인터랙션만 복사하고 기존 상태/라우팅과 연결합니다.
- **프로젝트 운영자:** 시스템을 수정했을 때 원본 근거와 재구성 범위를 다시 확인합니다.

주 사용 환경은 데스크톱 문서 열람이며, 휴대폰에서 탐색·모션 실행·미디어 재생도 가능해야 합니다.

## Information architecture

### Studio 탐색

`index.html`: Overview → Source browser → Motion playground → Media → Scene atlas → Colors → Typography → Layout → Components → Evidence → Handoff.

`system.html`: 프로젝트 설치 → 토큰 재정의 → 컴포넌트 마크업 → 상호작용 초기화 → 프레임워크 연결 → 패키지 다운로드.

`layout-recipes.html`: 원본의 화면 구조를 재사용하는 반응형 조합 예제. 원본 캡처와 예제 코드를 구분합니다.

### 원본 공개 페이지

'''
for f in M['files']:
 if f['kind']=='page':md+=f"- [{f['url'].replace(M['site'],'/')}]({f['path']})\n"
md+='''
## Design principles

1. **근거에서 시작합니다.** 원본 selector·측정 화면·JS 파라미터를 확보한 뒤 의미 이름을 붙입니다.
2. **토큰과 원본은 연결합니다.** 임의 클래스명으로만 설명하지 않고 UUID 토큰과 preset ID를 보존합니다.
3. **직접 조작할 수 있게 합니다.** hover, 반복 재생, 펼침, 닫힘, 모션 감소를 실제로 실행합니다.
4. **필요한 것만 옮깁니다.** 전체 Framer runtime 대신 `.ods` 범위의 컴포넌트를 사용합니다.
5. **원본 보존과 사용성 보완을 구분합니다.** 접근성·로컬 폼 완료 메시지 등 추가 동작은 재구성입니다.

## Visual language

### Color

'''
md+='| 의미 | 원본 값 | 원본 CSS 변수 |\n|---|---|---|\n'
for k,v in T['color'].items():md+=f"| {k} | `{v['value']}` | `{v['sourceVariable']}` |\n"
md+='''
오렌지 `#FF5D17`은 CTA·작은 점·강조에 사용합니다. `orange` 토큰(`#FFA500`)은 별도의 원본 값이며 동일색으로 취급하지 않습니다. `#0A0A0A`/white/`#F8F7F5`가 기본 면을 구성합니다. source-css 바깥의 텍스트 보조색도 computed 증거에 남아 있습니다. 일반 HTML link의 UA 기본 파랑은 브랜드색으로 추출하지 않습니다.

### Typography

브랜드 서체는 **Inter Tight**입니다. 원본 파일 110개는 weight/언어 subset/보조 위젯을 포함하며 110종의 서체를 의미하지 않습니다. 원본의 weight와 fallback 선언은 `design/fonts.css`에 있습니다. Inter Tight로 한글 글리프까지 제공된다고 가정하지 않습니다. 한글 콘텐츠용 fallback은 프로젝트에서 선택하고 줄바꿈을 재검증합니다.

| 용도 | 데스크톱 ≥1200 | 태블릿 810–1199.98 | 모바일 ≤809.98 | 굵기 / 자간 |
|---|---|---|---|---|
| Hero H1 | 150 / 165px | 106 / 116.6px | 70 / 77px | 600 / -0.04em |
| Section heading | 62 / 74.4px | 50 / 60px | 40 / 48px | 600 / -0.02em |
| Footer display | 120 / 144px | 96 / 115.2px | 70 / 84px | 실측 preset / -0.04em |

원본 프리셋 21개는 `tokens.typography.presets`에 전부 들어 있습니다. 제목 세 단계만으로 본문·메타·버튼·작은 라벨을 대체하지 않습니다. 프리셋 클래스는 `tokens.css`의 `.opal-type-<preset ID>`로 선택해서 사용할 수 있습니다.

### Spacing, grid, shape, elevation

컴포넌트별로 직접 측정한 대표값입니다. 컴포넌트의 내부 wrapper와 바깥 배경의 radius가 다를 수 있으므로 측정 대상 이름을 함께 봅니다.

| 컴포넌트 | 데스크톱 padding | gap | radius | 위치 / overflow |
|---|---|---|---|---|
'''
for k,c in T.get('componentLayout',{}).items():
 vals=[v for v in c.get('measurements',[]) if v['capture']=='home-desktop']
 if not vals:continue
 v=vals[0]['value'];md+=f"| {k} | `{v['padding']}` | `{v['gap']}` | `{v['borderRadius']}` | {v['position']} / {v['overflow']} |\n"
md+='''
전체 gap/padding/radius/grid/shadow/max-width 선언은 `tokens.layout`과 `design/extracted-rules.json`에 있습니다. 수치가 자주 등장한다는 이유만으로 전역 spacing scale의 공식 단계라고 단정하지 않습니다. 키트의 단순화된 spacing scale은 실제 재사용을 위한 별도 계층입니다.

### Motion

원본은 spring 기반 등장과 텍스트 롤링, ticker, 메뉴/FAQ의 상태 전환을 조합합니다. CSS transition duration만 추출하면 Framer spring 동작을 놓치므로 stiffness/damping/mass/delay와 초기 transform을 함께 보존합니다.

- `design/page-animations.json`: HTML에 포함된 페이지별 등장 설정의 원문 구조.
- `motion-source-tokens.json`: 배포 모듈에서 읽은 의미별 spring/ticker/variant 근거.
- `motion-data.json`: 조작 가능한 데모별 원본값, 상태, 적용 코드, 재구성 범위.
- `motion-library.js`: 원본 파라미터를 사용하거나 명시한 범위 내에서 재구성한 독립 데모.

원본 CSS의 easing과 Web Animations가 반환하는 샘플 easing은 같은 정보가 아닙니다. spring을 샘플링한 결과가 `linear`로 보인다고 원본이 단순 선형 모션이라고 해석하지 않습니다. ticker speed도 초 단위 duration과 다릅니다.

모션 라이브러리의 전역 감소 토글과 OS `prefers-reduced-motion`은 지속 움직임을 멈추거나 정적인 끝 상태를 보여줘야 합니다. 원본의 초기 delay를 매번 기다리는 것이 데모 사용성을 해칠 수 있어 재생 UI에서는 조절할 수 있으며, 그 차이는 표기합니다.

### Imagery / iconography

공개 원본: 이미지 394개, 영상 5개, 폰트 110개, 배포 JS 80개, 데이터 2개. 이미지 수에는 같은 이미지의 반응형 해상도 변형이 포함됩니다. 미리보기와 원본 다운로드를 연결합니다. 영상은 외부 Pexels 참조까지 포함하여 확보했습니다.

`assets/icons/`의 12개 standalone SVG는 HTML의 인라인 SVG를 독립적으로 렌더할 수 있게 정규화한 파생 자료입니다. 원래 파일 위치, 문자 offset, 치환 내역은 해당 manifest에 있습니다. 홍보 위젯의 아이콘과 실제 제품 브랜드 아이콘을 혼동하지 않습니다.

## Text reveals and service lists

히어로는 문자별 blur10/y10 등장, 서비스 제목은 그룹 y150 등장입니다. `text-services.md`, `reveal-data.json`과 `services-data.json`에 근거를 연결했습니다. 서비스 이미지 슬라이드와 What we do 이름/번호 롤링은 `design-system/components/service-list.*`로 재사용합니다. 카탈로그 `#text-services`에서 직접 실행합니다.

## Requested CTA and promotional widget

사용자 요청 이미지의 View All Blogs CTA, 4장 상단 배너, Buy for $59 버튼은 `requested-components.md`에 별도 정리했습니다. 카탈로그 `#requested-components`에서 실행하며, `design-system/components/`의 독립 소스와 `requested-components-kit.zip`으로 제공합니다. 기존 primary-cta 데모도 단일 회전에서 원본 이중 화살표 교차 구조로 갱신했습니다. 기본 모션14종과 추가 프로모션3개 프리뷰를 구분합니다.

## Components

원본 컴포넌트의 규칙은 아래와 같이 매핑했습니다. Studio의 Source browser 하단에서 컴포넌트와 CSS 속성을 선택하여 선언·미디어쿼리·원본 파일을 확인하고 복사할 수 있습니다.

| ID | 이름 | 원본 CSS 규칙 수 | 원본 페이지 |
|---|---|---:|---|
'''
for c in C:md+=f"| `{c['id']}` | {c['name']} | {len(c['rules'])} | `{c['sourceHtml']}` |\n"
md+='''
### 설치 키트 컴포넌트 계약

| 구성 | 클래스 / 속성 | 동작 |
|---|---|---|
| Primary CTA | `.ods-button`, `.ods-button__label` | pill, 롤링 텍스트, 화살표, focus/disabled |
| 작은 라벨 | `.ods-eyebrow` / `.ods-tag` | 오렌지 점과 라벨 |
| 섹션 제목 | `.ods-section-header` | 라벨/큰 제목 정렬 |
| 포트폴리오 카드 | `.ods-media-card` | 이미지 비율, hover, 메타 |
| 서비스 행 | `.ods-service-row` | 경계선, 번호, 링크 |
| FAQ | `.ods-faq` + details/summary | native 키보드 펼침; 여러 항목 열기 |
| 모바일 메뉴 | `.ods-nav` + data-ods-nav-* | expanded 상태, Escape, 포커스 |
| 입력 | `.ods-field` | label, 입력, 설명·오류 상태 |
| ticker | `.ods-ticker` | 반복 표시와 모션 감소 |
| 조합 | `.ods-container`, `.ods-stack`, `.ods-grid` | 컨테이너·간격·반응형 |
| 등장 | `[data-ods-reveal]` | init으로 점진적 향상 |

구체적인 마크업과 API는 `design-system/README.md`를 구현 기준으로 합니다. 이 문서는 제품 디자인 계약이며 API 상세와 중복된 상태 모델을 만들지 않습니다.

## Accessibility

접근성은 원본의 검증 완료 주장이 아니라 설치 키트와 Studio의 목표입니다. 본문 대비, 의미 있는 label/alt, 키보드 조작, 보이는 focus, 메뉴/대화상자 Escape, 닫힘 후 포커스 복귀를 적용합니다. 자동 움직임은 감소 설정을 존중합니다.

오렌지 위 작은 흰 텍스트는 대비가 충분한지 대상 프로젝트에서 점검해야 합니다. 원본색을 유지한 버전과 접근성에 맞춘 시맨틱 토큰 재정의를 구분합니다. 시연 입력은 외부 전송하지 않으며 오류/완료 상태를 화면에 설명합니다. 이미지로만 동작을 설명하지 않고 텍스트 코드와 상태 설명도 제공합니다.

## Responsive behavior

원본 layout breakpoint는 810px, 1200px입니다. 일부 원본 typography media는 809/1199 정수 경계를 쓰며 layout의 809.98/1199.98과 원문을 함께 보존합니다. 새 키트는 해당 화면군의 동작이 이어지도록 설계합니다.

- 데스크톱: 로고·소개·메뉴·CTA 헤더, 넓은 여백과 큰 제목, 복수 열 카드.
- 태블릿: 106px hero / 50px section, 폭과 내부 열 수 조정.
- 모바일: 펼쳐지는 메뉴, 70px hero / 40px section, 축소된 여백과 단일열.
- Studio는 문서 열람을 위한 별도 shell breakpoint를 사용해 사이드바를 접습니다. 이를 원본 Opalhaus의 breakpoint로 주장하지 않습니다.

768px 캡처 파일의 이름이 tablet이어도 원본 사이트 기준으로 모바일 레이아웃입니다. 실제 태블릿 규칙은 `home-tablet-1024`에서 확인합니다.

## Interaction states

| 영역 | 확인할 상태 | 범위 |
|---|---|---|
| 소스 검색 | 전체, 카테고리, 텍스트 검색, 결과 없음, 초기화 | 전체 manifest 접근 가능 |
| 소스 검사 | 이미지·폰트·영상·코드, 다운로드, Escape | 코드 미리보기는 길이 제한; 복사는 로드한 전체 본문 |
| 모션 | 시작, 재생, 정착, 반복, 감소 | 데모별 근거 등급 표시 |
| FAQ | 닫힘/열림, 여러 항목 열림 | 원본 관찰에 맞춘 구조 |
| 메뉴 | 닫힘/열림, Escape, 링크 선택 | 키보드/터치 지원 |
| 폼 | 기본, focus, invalid, disabled, 완료 피드백 | 추가 상태는 재구성; 서버 연결 없음 |
| 네트워크 | 미리보기 로드 실패, file URL | 원본 링크·다운로드로 복구 가능 |

## Content voice

짧고 명확하게 씁니다. 실제 원본값은 `원본`, 브라우저에서 읽은 값은 `실측`, 독립적으로 구현한 코드는 `재구성`으로 부릅니다. `전체`는 항상 수집 범위를 동반합니다. 공개 파일 수를 원래 디자인 컴포넌트 수나 고유 이미지 수로 바꾸어 말하지 않습니다.

## Implementation constraints

런타임 의존성 없이 HTML/CSS/JavaScript로 열람합니다. `design-system/`은 `.ods` 범위로 제한합니다. root `tokens.css`는 원본 확인용이며, 설치 키트의 `design-system/tokens.css`는 애플리케이션 테마 연결용입니다. 같은 이름의 파일이 서로 다른 책임을 갖는 점을 유지합니다.

React/Vue에서는 컴포넌트 mount 후 init하고 unmount에 destroy합니다. 서버 렌더링 시 브라우저 초기화를 실행하지 않습니다. 이미지와 폰트는 선택적으로 추가하며 원본 번들을 자동 주입하지 않습니다.

### 재생성 순서

```sh
python3 scripts/collect.py
python3 scripts/extract-design.py
python3 scripts/extract-icons.py
python3 scripts/build-source-rules.py
python3 scripts/build-motion-data.py
python3 scripts/build-project-kit.py
python3 scripts/build-design-guide.py
python3 scripts/build-source-library.py
python3 scripts/verify-source-integrity.py
node scripts/verify-catalog.cjs
python3 scripts/build-package.py
```

수집은 사이트 변경을 가져오므로 항상 최신 검증 결과를 함께 갱신합니다. 브라우저 테스트는 현재 환경에 설치된 Playwright/Chrome을 사용하며 다른 환경은 `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `BASE_URL`로 지정합니다. 빌드되지 않은 새 dependency를 추가할 필요는 없습니다.

## Open questions

- [ ] 대상 사이트의 프레임워크·기존 컴포넌트가 아직 제공되지 않았습니다. 소유자: 사용자. 영향: 실제 앱 통합은 별도 작업.
- [ ] 최종 한글 서체와 실제 콘텐츠 길이. 소유자: 적용 프로젝트. 영향: 타이포 크기와 줄바꿈 최종 조정.
- [ ] 모든 내부 페이지의 모든 hover/scroll 상태를 원본과 프레임 단위로 비교하지는 않았습니다. 소유자: 적용 시 QA. 영향: 완전한 편집 원본 복구나 전체 픽셀 일치로 표현하지 않음.

## Studio shell

참조 Family와 같은 왼쪽 탐색, 상단 도구, 섹션별 스펙, 소스 탐색, 움직이는 카드, 적용 안내 흐름을 사용합니다. 스킨은 Opalhaus의 Inter Tight와 오렌지/흑백으로 구성합니다. 원본 사이트의 큰 글자를 문서 전체에 강제하지 않고 specimen에서 보여줍니다. 1440/1024/390px에서 가로 overflow, 탐색, 소스 검사와 주요 상태를 확인한 결과는 `evidence/`에 저장합니다.
'''
(R/'DESIGN.md').write_text(md)
print('DESIGN.md',len(md.encode()),'bytes')
