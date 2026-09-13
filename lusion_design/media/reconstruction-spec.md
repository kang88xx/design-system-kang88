# Motion / Experience Lab — 실행 가능한 재구성 명세

**작성: 2026-09-06 · 범위: 독립 HTML/CSS/JS 데모 8개 + 점 구름·포털 변형.**

[실험실 실행](../motion-lab.html) · [JavaScript 전체](../motion-lab.js) · [CSS 전체](../motion-lab.css) · [공개 원본 번들](../sources/site.js) · [상위 설계 계약](../DESIGN.md)

이 문서는 새로 구현한 코드의 설명이다. 공개 번들을 그대로 실행하거나 비공개 원본 씬·엔진·생성 프롬프트를 복구했다고 주장하지 않는다. **추출**은 공개 배포 코드의 문자열·구조, **관측**은 캡처/영상에 보이는 사실, **재구성**은 그 원리에서 만든 신규 코드다. 아래의 데모 시간·개수·진폭은 별도 표시가 없는 한 모두 신규 제안값이다.

## 실행·가져가기

루트에서 `python3 -m http.server 4187` 후 `http://localhost:4187/motion-lab.html`을 연다. 별도 npm 설치나 외부 스크립트가 필요 없다. 4187은 이번 검증 서버이며 다른 작업의 서버 포트를 변경하지 않는다. 파일로 직접 열 때 브라우저가 로컬 이미지를 WebGL 텍스처로 올리는 것을 막을 수 있으므로 깊이 데모는 RGB 포스터로 대체된다.

필요 파일은 `motion-lab.html`, `motion-lab.css`, `motion-lab.js`, 공통 `tokens/lusion.css`와 그 상대 폰트 경로, 깊이 데모의 RGB/depth 두 이미지다. 새 제품으로 가져갈 때는 프로젝트 이미지와 브랜드 문구를 자체 자산으로 바꾼다. CSS는 `--lab-*` 별칭으로 공통 토큰을 읽는다. 원본의 `.buf`·EXR·오디오·영상·계측·폼 코드는 실행하지 않는다.

## 공통 런타임 계약

| 입력·상태 | 실제 구현 | 관측 가능한 결과 |
| --- | --- | --- |
| 전체 일시정지 | 단일 `requestAnimationFrame` 루프의 dt를 0으로 만들고 후속 프레임 예약 중지 | 3D, 입자, DOM 단어, SVG 궤도, 전환 타임라인 정지. 컨트롤·탐색은 사용 가능 |
| 동작 줄이기 | 시스템 `prefers-reduced-motion` 초기값/변경을 구독하고 체크박스로 수정 | 카메라·시차·자동 회전 중지, 스프링 리셋, 타이포/카운트업은 완료 상태, 전환은 즉시 장면 교체 |
| 화면 이탈 | `IntersectionObserver`로 각 `.demo` 활성 여부 관리 | 화면 밖 장면의 렌더 및 타임라인 누적 중지. 재진입 후 이어서 재생 |
| 탭 숨김 | `visibilitychange`에서 rAF 취소와 이전 시각 리셋 | 백그라운드 렌더 중지. 복귀 시 큰 dt 점프 방지 |
| 리사이즈 | `ResizeObserver` + 실제 canvas CSS 크기에서 backing store 계산 | 크기·종횡비·깊이 이미지 cover UV 갱신 |
| 품질 | DPR 최대 1.5; dt 최대 .05초 | 과도한 픽셀 수·복귀 시 물리 폭주 제한. 실기기 60fps 보장 주장은 하지 않음 |
| 속도·진폭 | 공유 `speed=.25…2`, `amplitude=0…1.5` | 속도는 타임라인 dt, 진폭은 회전/변위/입자 이동량에 적용. 데이터 비율 등 의미 정보는 보존 |
| 키보드·터치 | 네이티브 버튼/슬라이더, canvas 방향키·Enter·Space, 포인터 이벤트 | hover 없이 버튼/탭으로 실행 가능. 캔버스 `touch-action:pan-y`로 페이지 스크롤 유지 |
| GPU/텍스처 오류 | 3D는 Canvas 2D 투영, depth는 HTML 이미지 | 빈 장면 방지, 현재 엔진/대체 상태를 DOM 라벨로 표시 |

포인터 효과 자체가 정보의 유일한 전달 수단이 되지 않게 제목·설명·출처·컨트롤은 DOM으로 남겼다. 무한 반복은 사용자가 전체 일시정지할 수 있다. 동작 감소에서 수동 슬라이더는 즉시 선택한 고정 프레임을 보여주며 자동 이동하지 않는다. pause 상태에서 재생 버튼을 누르면 해당 타임라인의 시작점만 설정되고 전체 다시 재생 때 진행한다. 네트워크 전송이나 소리 재생은 없다.

<a id="01-kinetic"></a>
## 01. Kinetic field / 실시간 입체 모듈 + 점 구름

**추출 근거:** `sources/site.js`에서 `class HomeBalloonsBody`, `GRAVITY_FACTOR`, `cross.buf`, `matcap.exr`, `changeHomeHeroColorSignal`, `applyImpulse()`를 검색한다. `HomeHeroSection.init`의 클릭 신호가 색 변경 및 body impulse로 연결된다. `class AboutHeroParticlesSimulation`에는 이전/현재 위치 render target과 시뮬레이션 텍스처 크기가 존재한다. 정점 색상·재질·원본 body 충돌 알고리즘을 이 데모의 값으로 인용하지 않는다. **관측:** [홈 캡처](../screenshots/home-ready.png), [Labs 영상 샘플](../screenshots/video-sheets/sheet-5.jpg)의 점 구름·분산 표현.

**구현 진입점:** `crossGeometry`, `kineticRenderer`, `renderCloud`, `burst`, `register('kinetic', …)`.

- geometry: 둥근 직육면체 3개를 x/y/z 축으로 교차한다. 각 면을 8×8로 나누고 내부 상자에 clamping한 좌표와 rounded bevel normal로 정점을 만든다. 면 노멀은 실제 조명 계산에 쓰인다.
- renderer: Native WebGL vertex shader에서 x/y/z 회전·오브젝트 위치·원근 투영을 계산한다. fragment shader의 diffuse/specular/rim이 크림·흑·청 표면을 만든다. 11개의 모듈은 depth buffer로 가려짐이 결정된다. 정적 이미지나 CSS transform만 돌리는 장면이 아니다.
- 입력: 포인터/방향키 → 회전. 클릭/Enter/별도 버튼 → 팔레트 변경과 방사형 속도 impulse. 각 모듈은 원래 자리로 복귀하는 감쇠 스프링을 갖는다.
- 점 구름 변형: 2,400개의 Fibonacci sphere 좌표와 rounded-cross 메시 샘플을 보간한다. 카메라 투영·깊이 정렬을 한 점을 Canvas 2D에 그린다. 클릭하면 점마다 다른 방향으로 퍼진 뒤 감쇠한다. 인물/로고 mesh를 사용하지 않고 구체↔십자로 원리를 보여준다.
- 대체: WebGL이 없으면 3개 상자의 면을 CPU에서 실제 3D 회전·원근 투영 후 painter 정렬로 그린다. 이 모드의 bevel은 생략된다. 점 구름 모드는 GPU가 없어도 동작한다.

**원본과 차이:** rigid-body 충돌·중력·원본 cross 모델·matcap/EXR·subsurface/multipass·GPU particle simulation을 재현하지 않았다. 충돌처럼 보이는 과장된 움직임을 물리적으로 정확하다고 설명하지 않는다. 여기의 스프링, 조명 수치, 입자 수와 보간 속도는 신규 구현이다.

<a id="02-depth"></a>
## 02. RGB + depth / 실제 깊이 텍스처 시차

**추출 근거:** `home_depth.webp` 주변의 `u_texture`, `u_depthTexture`, `u_shiftXY`, `SecondOrderDynamics`, `PARALLAX_SAMPLES=12`, `BLUR_SAMPLES=6`.

**사용 자산:** [RGB](../sources/assets/lusion.dev/assets/projects/porsche_dream_machine/home.webp) / [depth](../sources/assets/lusion.dev/assets/projects/porsche_dream_machine/home_depth.webp). 수집 원본 프로젝트의 공개 이미지임을 화면에 표시한다.

**구현 진입점:** `imageLoad`, `depthRender`, `depthFallback`, `register('depth', …)`.

두 텍스처를 각 texture unit에 올리고 이미지/캔버스 비율로 cover UV를 계산한다. `uPointer`를 약한 스프링 형태로 smoothing하고, 매 fragment에서 depth를 12번 읽으며 `uv + pointer × .026 × (depth-.5)`를 반복 갱신한다. 가장자리에는 .94 안전 crop과 clamp가 적용된다. 이는 실제 깊이 값에 따른 UV 이동이며 이미지 전체 CSS 이동과 다르다.

입력은 포인터/방향키/시점 초기화/깊이 맵 토글이다. 토글은 시차 결과와 grayscale 입력을 비교하게 한다. reduced motion은 시점을 0으로 고정한다. texture 업로드·파일 로드·GPU context가 실패하면 위에 있던 캔버스를 숨기고 처음부터 존재한 RGB `<img>`를 유지한다. GPU가 필요한 깊이 맵 토글은 disabled 처리한다.

**원본과 차이:** 원본 ray-parallax/DOF 필터를 그대로 포팅한 코드가 아니며 `BLUR_SAMPLES`에 대응하는 blur, border deformation, 원본 second-order dynamics는 생략됐다. 12회 반복은 원본 수치에 맞춘 데모 구조이고 내부 수식까지 동일하다는 뜻이 아니다. 한 장에 없는 가려진 영역을 새로 생성하지 않는다.

<a id="03-impact"></a>
## 03. Pointer energy / 궤적·파동·변위

**추출 근거:** `class ScreenPaint`의 `_prevPaintRenderTarget`, `_currPaintRenderTarget`, `pushStrength`, `velocityDissipation`, `weight1Dissipation`, `resize`의 저해상도 분기. 실제 원본은 render target/FBO 기반이며 후처리 distortion 입력과 연결된다.

**구현 진입점:** `addImpact`, 포인터 이벤트, `register('impact', …)`.

포인터의 직전·현재 정규화 좌표 거리로 입자 반경을 바꾼다. 최대 160개 입자의 위치·속도·age를 저장하고 radial gradient를 screen 합성한다. 클릭은 28개 방사형 입자와 원형 파동을 추가한다. 파동의 진행 거리에 맞춰 선 그리드의 좌표를 sine/Gaussian envelope로 변위한다. 입자 1.8초, 파동 2초 후 제거하며 지우기 버튼으로 즉시 비운다. 상단 DOM 수치가 실제 현재 particle/wave 개수를 보여준다.

**대체·차이:** Canvas 2D 구현이고 원본 ping-pong FBO, 유체 advection, RGB 굴절은 없다. 원본 `ScreenPaint`를 구현했다고 오해하지 않게 화면에 차이를 표시한다. reduced motion에서는 움직임 없는 선택 위치의 작은 링만 보여주고 흔적 이동/감쇠를 재생하지 않는다. 정지 중에는 새로운 임팩트를 생성하지 않는다.

<a id="04-tunnel"></a>
## 04. Spatial scroll / 터널 + 포털·파편

**추출 근거:** `tunnels/grid_structure_`, `grid_base_`, `greeble_` 로딩, astronaut의 인스턴스 animation from/to/blend와 진입·루프·이탈 구조. **관측:** [원본 영상 샘플 sheet 7](../screenshots/video-sheets/sheet-7.jpg)의 reel desktop 4.61초/모바일 4.62초에 분홍빛 굴절 포털과 부유 파편이 보인다. 샘플 시점 사이의 전환 전체를 복원했다고 주장하지 않는다.

**구현 진입점:** `scrollTunnel`, `syncTunnel`, `register('tunnel', …)`.

단일 `tunnelProgress=0…1`을 카메라 z 좌표로 바꾼다. 33개 반복 링을 z 축에 놓고 `screen=vanishingPoint + worldXY × focalLength / depth`로 투영한다. 구조 모드는 8각형 링과 연결 리브, 포털 모드는 48분할 링과 서로 다른 깊이의 삼각 파편 44개를 그린다. 곡선 소실점 이동, 거리별 투명도·선 두께로 깊이를 표현한다.

스크롤 연결 시 `viewportHeight − sectionTop`을 `viewportHeight + sectionHeight`로 나누어 진행률로 쓴다. range 입력은 스크롤 연결을 해제하고 정확한 수동 위치를 선택한다. 자동 탐색은 초당 .075 진행하며 100%에서 정지한다. ENTER / TRAVEL / EXIT는 각각 `.22`, `.78` 분기로 표시하는 신규 구간값이다. reduced motion/전체 정지에서는 자동 재생·스크롤 업데이트를 하지 않고 수동 range는 고정 프레임을 제공한다.

**원본과 차이:** 원본 터널 메시·반사 재질·우주비행사·클립 블렌딩·유리 굴절을 실행하지 않는다. 포털은 구조/색/파편의 모티프를 procedural lines로 표현한 경량 근사이며 원본 릴 품질과 동일하지 않다.

<a id="05-type"></a>
## 05. Editorial rhythm / 단어 마스크

**추출 근거:** `HomeHeroSection.resize`에서 `SplitType`의 `lines, words`, 줄별 `overflow="hidden"`. `_updateUi`에서 단어별 `r/20` 지연과 `translate3d`/`rotate` 조합.

**구현 진입점:** `words`, `typeTime`, `register('type', …)`.

6개의 단어를 줄별 overflow mask에 넣고 `1-(1-progress)^3` easing으로 translateY 120% → 0%, rotate 12° → 0°를 적용한다. 단어 지연 .09초, 단어 duration 1.1초는 신규 제안값이다. 재생 버튼은 로컬 타임라인만 초기화한다. 시각 분할 단어는 `aria-hidden`, 상위 하나의 문장에 접근 가능한 이름을 준다. reduced motion은 모든 단어를 즉시 표시한다.

**차이:** 원본 라이브러리/`ease.lusion` 수식을 사용하지 않고 카피와 시간도 새로 작성했다. 동일한 폰트·줄 길이를 전제로 한 픽셀 복제는 아니다.

<a id="06-data"></a>
## 06. Information in motion / 예시 인포그래픽

**관측 근거:** 공개 화면의 큰 수치·모노 라벨·서비스 분류라는 편집 문법. **미확인:** 이 원형 서비스 비율 차트는 원본에서 관측된 차트가 아니다. 원본 사이트의 실적 수치를 이 데이터로 대체해서 설명하지 않는다.

**구현 진입점:** `dataTarget`, `dataTime`, `orbitTime`, `register('data', …)`.

Creative / Technology / Motion의 초기 `[45,35,20]`은 전부 시연용 비율이다. Creative 슬라이더가 나머지 두 비율을 재배분하며 합계를 100으로 유지한다. 1.8초 count-up의 현재 총합과 각 숫자를 맞추고 SVG circle의 `stroke-dasharray`/`stroke-dashoffset`을 같은 progress로 갱신한다. 독립된 작은 점은 원주를 순환한다. 재생 버튼으로 수치 진입을 다시 볼 수 있다. 화면에 **REFERENCE ONLY / 실제 사업 지표 아님**을 지속 표시한다.

**대체·차이:** reduced motion에서는 데이터 즉시 최종 표시, 궤도 정지. Canvas/GPU에 의존하지 않으므로 수치가 DOM으로 계속 읽힌다. 원본 분석과 신규 데이터 시각화 제안을 명확히 구분하기 위한 데모다.

<a id="07-wipe"></a>
## 07. Page transition / 로더에서 열린 십자로

**추출 근거:** `transition-overlay` 주변 `getContext("2d")`, load bar, rotate/scale, `globalCompositeOperation="xor"`, `contentShowRatio`, `contentHideRatio`.

**구현 진입점:** `switchWipe`, `wipeTime`, `register('wipe', …)`.

검정 레이어가 덮인 후 bar와 연출용 퍼센트를 표시하고, 회전하며 확대되는 십자 구멍을 `destination-out`으로 지운다. 가려진 동안 A/B 배경·카피를 전환한다. 전체 3.2초, .8초 내용 교체, 1.15초 이후 aperture 확장은 신규 타임라인이다. 다시 누르면 진행을 처음부터 시작하며 중복 타이머를 만들지 않는다.

**대체·차이:** 실제 네트워크 진행률·실제 라우팅이 아니며 `DEMO`와 연출용 진행률 문구를 제공한다. 원본의 XOR 형태와 동일한 합성 코드는 아니다. 전환 캔버스는 장면에만 제한되고 사이트 탐색을 막지 않는다. reduced motion은 즉시 다음 내용으로 교체한다.

<a id="08-magnet"></a>
## 08. Micro to macro / 마그네틱 CTA·점→플러스

**관측 근거:** 공개 CSS/화면에 반복되는 알약 버튼, 점·플러스·화살표. **미확인:** 해당 버튼의 마그네틱 스프링 구현이 원본에 동일하게 존재한다고 확인하지 않았다.

**구현 진입점:** `magnet`, `.magnet-area` 이벤트, `register('magnet', …)`.

주변 컨테이너 중심에 대한 포인터 거리를 작은 목표 이동량으로 삼는다. position/velocity 스프링이 그 목표를 따라간다. hover 또는 keyboard focus/pressed 상태는 2개의 작은 점을 길고 가는 가로·세로 막대로 보간해 플러스를 만든다. 클릭/Enter/tap은 `aria-pressed`와 DOM 상태 라벨을 바꾼다. 상태 변경 데모이며 요청·메일·가입 동작은 없다.

**대체·차이:** 터치는 자기장 이동 없이 탭 상태 변화를 제공한다. reduced motion에서는 이동 0, 형태 즉시 반영. 원본 microinteraction의 수치 복원보다 접근 가능한 신규 상태 구현에 목적을 둔다.

## 검증 범위

- `node --check motion-lab.js`로 문법 확인.
- 로컬 Chromium/Playwright, 1440×1000 및 390×844에서 렌더와 가로 overflow 확인.
- Native WebGL과 실제 깊이 텍스처 업로드 엔진 상태, 포인터/버튼/슬라이더, replay, count-up, pause, reduced motion, offscreen pause 확인.
- WebGL 강제 비활성화에서 CPU 3D projection 및 RGB 포스터 확인.
- 공개 원본 앱 전체 동작·원본 실제 장치 성능·Safari/iOS GPU·완전한 스크린리더/접근성 인증은 검증 범위가 아니다.

시각 검수는 로컬 데모의 읽기 가능성·조작 상태·깊이와 원본 모티프의 관계를 확인하는 것이다. 원본 장면과 픽셀 일치도를 주장하지 않는다. 수집된 영상은 이 페이지에서 자동 로드/재생하지 않는다.
