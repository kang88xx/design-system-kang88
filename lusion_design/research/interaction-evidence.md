# 인터랙션·모션 근거 원장 (v5)

2026-09-10 · 대상 `sources/site.css`, `sources/site.js` (lusion.co 공개 배포 번들). 등급: **추출** = 배포 코드의 실제 값, **관측** = 캡처/네트워크 사실, **제안** = 키트를 위한 신규 결정. 제안값을 원본 수치로 인용하지 않는다.

## 1. 이징 함수

| 이름 (키트 토큰) | 값 | 등급 | 원본 사용 횟수 / 위치 |
| --- | --- | --- | --- |
| `--ds-ease` / `--ds-ease-standard` | `cubic-bezier(.4,0,.1,1)` | 추출 | CSS 32회. 메뉴 링크 텍스트 스왑, 메뉴 점 회전, 메뉴 패널 open/close, 헤더 talk 버튼 |
| `--ds-ease-smooth` | `cubic-bezier(.35,0,0,1)` | 추출 | CSS 32회. CTA 점 확산·텍스트 이동, 푸터 밑줄, 아이콘 스왑. JS `ease.lusion(e){return cubicBezier(e,.35,0,0,1)}` 53회 |
| `--ds-ease-enter` | `cubic-bezier(.4,0,0,1)` | 추출 | CSS 2회. CTA 화살표 진입 |
| `--ds-ease-out` | `cubic-bezier(.16,1,.3,1)` | 추출 | CSS 2회. 상세 본문 링크 밑줄 `.3s` |
| `--ds-ease-loop` | `cubic-bezier(.1,0,.1,1)` | 추출 | CSS 3회. `arrow-animation`, `text-animation` 3s 무한 루프 |
| `--ds-ease-expo` | `cubic-bezier(.19,1,.22,1)` | 제안 | JS `expoOut(e){return 1-Math.pow(2,-10*e)}` 22회를 CSS로 근사 |
| JS `ease.expoInOut` | `e<.5 ? .5*2^(20e-10) : ...` | 추출 | 18회, 장면·카메라 전환 |
| JS `ease.cubicInOut` | 표준 cubic | 추출 | 17회 |
| JS `ease.backOut` | 표준 back | 추출 | 커서 활성 비율 스케일 `ease.backOut(domCursorActiveRatio)` |

## 2. 지속 시간·지연

| 항목 | 값 | 등급 | 근거 |
| --- | --- | --- | --- |
| CSS 지속 시간 집합 | `.1s .2s .25s .3s .4s .5s .6s 3s` | 추출 | 전체 `transition`/`animation` 선언 |
| 헤더 색 전환 | `.25s` | 추출 | `#header{transition:color .25s}` |
| talk 버튼 점 축소 | `.1s` | 추출 | `#header-right-talk-btn-dots` |
| talk 버튼 텍스트/화살표 | `.3s` | 추출 | `#header-right-talk-btn-text`, `-arrow` |
| 메뉴 점 회전 | `.4s` | 추출 | `#header-right-menu-btn-dots` 180deg→270deg + `translateY(-.1em)` |
| 메뉴 패널 항목 | `.5s` + `--open-delay` / `--close-delay` | 추출 | `#header-menu.--opened …` |
| 메뉴 항목 stagger | 열기 `index/50 s` = 20ms, 닫기 `(n-index)/50 s` 역순 | 추출 | `site.js` `e.style.setProperty("--open-delay",t/50+"s")` |
| 메뉴 배경 그라데이션 | `.4s .4s opacity` | 추출 | `#header-background` |
| CTA 배경 | `.5s` 지연 `.3s`(홈) / `.1s`(상세) | 추출 | `#home-reel-cta:hover`, `#project-details-launch-cta:hover` |
| CTA 점·텍스트 | 색 `.5s`, 이동 `.4s` | 추출 | `#home-reel-cta-dot`, `-text` |
| 링크 밑줄 | `.3s` (상세) / `.6s` (푸터) | 추출 | `#project-details-desc a:after`, `#footer-bottom-labs:before` |
| 아이콘 스왑 | `.4s` | 추출 | `#footer-bottom-up svg` |
| 루프 힌트 | `3s infinite`, 텍스트 `.2s` 지연, 화살표 `.3s` 지연 | 추출 | `#end-bottom-text`, arrow-animation |
| 프리로더 | `DELAY 1.5`, `MIN_PRELOAD_DURATION 1`, `HIDE_DURATION .5` | 추출 | `class Preloader` |
| 프레임 dt 상한 | `1/20 s` | 추출 | `loop()` `e=Math.min(e,1/20)` |
| 단어 reveal stagger | 40ms | 제안 | 원본 JS 트윈 간격은 번들에서 개별 확인하지 않음 |

## 3. 변위·형태

| 항목 | 값 | 등급 | 근거 |
| --- | --- | --- | --- |
| 단어 등장 초기 상태 | `translate3d(0,1.5em,0) rotate(15deg)`, `top:-.1em`, 부모 overflow hidden | 추출 | `#home-hero-title .word` |
| 메뉴 패널 항목 초기 상태 | `translate3d(0,5.5em,0) rotate(3.5deg)`, `opacity:0` | 추출 | `#header-menu-links` 등 |
| 메뉴 링크 텍스트 스왑 | 원본 `-100%`, 클론 `+100%→0` | 추출 | `.header-menu-link-text`, `-clone` |
| 메뉴 링크 배경 | `scale(.85)→1`, `opacity 0→.1`, pill 6.25em | 추출 | `.header-menu-link-background` |
| 메뉴 링크 화살표 | `scale(0)→1`, `.2s` 지연 `.2s` | 추출 | `.header-menu-link-svg` |
| 메뉴 링크 점 | `.5em` 원, `scale(0)→1` `.3s` | 추출 | `.header-menu-link:before` |
| CTA 점 확산 | 홈 릴 `translate3d(3em,0,0) scale(20)`, featured `4em / scale(32)`, 상세 `5em / scale(26)` | 추출 | 각 `-cta-dot` hover |
| CTA 텍스트 이동 | `-1.5em` (홈), `-20%` (상세) | 추출 | `-cta-text` |
| CTA 화살표 | `translate3d(3em,0,0)→0`, 상세는 `scale(0)→1` | 추출 | `-cta-arrow` |
| talk 버튼 | 점 `scale(.9)→0`, 텍스트 `+1.5em`, 화살표 `-2.5em→0` | 추출 | `#header-right-talk-btn` |
| 헤더 버튼 진입 | `transform:scale(0)` 초기값, JS가 1로 | 추출 | `#header-right-talk-btn,#header-right-menu-btn` |
| 아이콘 스왑 | 첫 svg `-3em`, 둘째 `+3em→0` | 추출 | `#footer-bottom-up` |
| 루프 힌트 | 0%→33% `translate3d(0,1em,0)` 후 유지 (텍스트 1.5em) | 추출 | `@keyframes arrow-animation`, `text-animation` |
| 링크 밑줄 | `scaleX(0)→1`, `transform-origin:left`, 두께 1px / `.125em` | 추출 | 상세 링크, 푸터 |
| 진행 바 | `transform-origin:0 0`, `scaleX(진행률)`, 최소 막대 비율 `2/10` | 추출 | `#scroll-nav-next-bar-inner`, `ScrollManager.MIN_BAR_SCALE_Y` |
| 스크롤 인디케이터 | 활성 비율 `±2/s`, 마지막 입력 후 `.5s` 지나면 숨김, 스크롤 강도 `damp λ=10` | 추출 | `ScrollManager.update` |
| 커서 원 | `6.25em` 원, `scale(0)` 초기, 속도 기반 배율 `min(2.5, vel/5+1) * backOut(ratio)` | 추출 | `#video-overlay-cursor`, 팀 섹션 커서 |
| 그리드 십자 | 길이 `--cross-size: clamp(.875rem,1vw,2rem)`, 두께 `0.125×` | 추출 | `.home-hero-scroll-container-cross` |
| 카드 flip | `rotateY(180deg)`, `backface-visibility:hidden`, radius `.8em` | 추출 | `.about-capability-card-*` |

## 4. JS 동역학

| 항목 | 값 | 등급 | 근거 |
| --- | --- | --- | --- |
| `SecondOrderDynamics(x0, f, z, r)` 기본값 | `f=1.5, z=.8, r=2` | 추출 | 클래스 생성자, `addEasedInput` 포인터 기본값 |
| 커서 추가 회전 | `(0, 1, .8, 1.2)` | 추출 | `domCursorExtraRotationMotion` |
| 깊이 카드 초점 | `(Vector3, 1, .6, 2)` | 추출 | `focusPosMotion` |
| 깊이 카드 줌 | `(1, 2.2, .7, 3)` | 추출 | `zoomMotion` |
| 카드 테두리 | `(0, 2.5, .5, 2)` | 추출 | `borderMotion` |
| 오브젝트 위치/회전 | `(1,.65,1.3)` / `(1,.85,1.1)` | 추출 | `positionDynamic`, `rotationDynamic` |
| 계수 | `k1=z/(πf)`, `k2=1/(2πf)²`, `k3=rz/(2πf)` | 추출 | `setFZR` |
| `damp(a,b,λ,dt)` | `lerp(a,b,1-exp(-λ·dt))` | 추출 | 유틸 함수 |
| 텍스트 분할 | SplitType `words` / `words, chars` / `lines`; 812px 미만은 분할 해제 | 추출 | `_splitText()` |

## 5. 키트에 반영한 결정 (제안)

- CSS 토큰 6개 이징, 7단계 지속 시간, stagger 2종, 변위 5종을 `--ds-*`로 노출한다.
- 런타임은 `createDynamics`(f/z/r), `damp`, `ease`(bezier + expo/cubic/back)를 제공하고, `data-ds-*` 속성으로 split·stagger·panel·cursor·tilt·scroll-progress를 초기화한다.
- 모든 모션은 `prefers-reduced-motion`과 `mount(root,{motion:false})`에서 정적 상태로 떨어지고 `destroy()`가 DOM을 원복한다.
- 원본 WebGL 장면(3D 십자, ScreenPaint, 깊이 맵)은 키트 범위 밖이며 메인 화면 예제는 CSS 도형으로 대체한다.
