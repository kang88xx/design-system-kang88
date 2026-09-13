# Lusion 공개 소스 커버리지 감사 v2

감사일: 2026-09-06. 범위는 수집된 Lusion 본체의 22개 페이지, 공통 UI, 공개 CSS/JS 및 로컬 미디어다. 각 클라이언트 외부 웹사이트 전체를 재구축하는 범위는 아니다. 이 문서의 **대상** 열은 구현 담당자에게 전달한 컴포넌트·모션 데모 매핑이다. 매핑 자체를 구현 또는 픽셀 일치 검증 완료로 해석하지 않는다.

## 근거와 판정 방식

- **H — HTML 확인:** `sources/pages/*.html`의 실제 태그, ID, class, 콘텐츠와 data 속성.
- **C — CSS 확인:** `sources/site.css`의 실제 선택자와 선언. 압축 단일 행이므로 줄 번호 대신 선택자를 사용한다.
- **J — JS 확인:** `sources/site.js`의 공개 번들 클래스 및 상수. 클래스 이름으로 재검색할 수 있다. 구현 의도·수치는 확인 가능하지만 실행 화면 관찰과는 구분한다.
- **V — 화면 확인:** 이 감사에서 직접 본 `screenshots/menu-open.png`, `screenshots/about-ready.png`. 정지 화면은 모양만 입증하며 속도·중간 프레임은 입증하지 않는다.
- **재구성:** 공개 코드·영상에 근거해 독립적으로 구현한 데모. 제작자의 비공개 원본 프로젝트·모션 프롬프트·Houdini/Blender 씬 파일을 복원했다는 뜻이 아니다.

기존 `index.html`에는 토큰, 기본 그리드/라운딩/버튼, 19개 프로젝트와 미디어 원장, 세 가지 모션 설명이 있었다. 전체 UI 아이콘 전용 목록, 조합된 메뉴·입력·메타데이터 박스, 팀/수상/전문영역 인포그래픽, 직접 조작하는 모션 실험은 보강 대상이었다. `components.html`과 `motion-lab.html`은 v2 병렬 구현 대상이다.

## 22개 페이지 전수 확인

프로젝트 상세 갤러리 항목은 `.project-details-item`의 `data-type` 기준이다. 아래 수치는 HTML 등장 횟수이며 고유 파일 수가 아니다. 19개 프로젝트는 같은 상세 페이지 셸을 공유하고 이미지·영상·설명 패널의 조합을 바꾼다.

| 소스 파일 (`sources/pages/`) | 이미지 | 영상 | 텍스트 | 주요 고유 범위 |
| --- | ---: | ---: | ---: | --- |
| `home.html` | — | — | — | Hero, reel, featured 12개, goal tunnel |
| `about.html` | — | — | — | About hero, team, clients, awards, capabilities |
| `projects.html` | — | — | — | 프로젝트 19개 목록과 숫자 헤더 |
| `projects__atlas_motion.html` | 6 | 1 | 0 | 공통 상세 셸 |
| `projects__choo_choo_world.html` | 17 | 2 | 0 | 공통 상세 셸 |
| `projects__ddd_2024.html` | 3 | 1 | 0 | 공통 상세 셸 |
| `projects__devin_ai.html` | 2 | 3 | 0 | 공통 상세 셸 |
| `projects__everswap.html` | 9 | 1 | 0 | 공통 상세 셸 |
| `projects__infinite_passerella.html` | 8 | 2 | 0 | 공통 상세 셸 |
| `projects__lusion_labs.html` | 16 | 1 | 0 | 공통 상세 셸 |
| `projects__maxmara_bearings_gifts.html` | 15 | 2 | 0 | 공통 상세 셸 |
| `projects__my_little_story_book.html` | 15 | 1 | 0 | 공통 상세 셸 |
| `projects__of_the_oak.html` | 5 | 1 | 1 | 독립 설명 패널 포함 |
| `projects__oryzo_ai.html` | 4 | 3 | 0 | 공통 상세 셸 |
| `projects__porsche_dream_machine.html` | 15 | 2 | 0 | 공통 상세 셸 |
| `projects__soda_experience.html` | 7 | 1 | 0 | 공통 상세 셸 |
| `projects__spaace.html` | 6 | 1 | 0 | 공통 상세 셸 |
| `projects__spatial_fusion.html` | 16 | 1 | 0 | 공통 상세 셸 |
| `projects__synthetic_human.html` | 6 | 1 | 0 | 공통 상세 셸 |
| `projects__the_turn_of_the_screw.html` | 13 | 1 | 0 | 공통 상세 셸 |
| `projects__worldcoin.html` | 4 | 1 | 1 | GPU 데이터 인코딩 설명 패널 포함 |
| `projects__zero_tech.html` | 14 | 0 | 0 | HTML 갤러리는 이미지 항목만 사용 |
| **상세 갤러리 합계** | **181** | **26** | **2** | **209개 등장 항목** |

`research/collection-summary.json`의 수집 스냅샷은 394 assets, 28 MP4, 238 WebP, 18 SVG, 16 OGG, 55 octet-stream을 기록한다. 인라인 SVG를 별도 추출하면서 생기는 v2 파일 수와 혼합하면 안 된다. SVG 파일 원장만으로는 HTML 내 인라인 아이콘을 포함하지 못한다.

## 공통 셸·아이콘·박스 커버리지

| 패턴 | 원본 선택자 / JS 근거 | 확인된 형태·행동 | 근거 | 대상 / 확인해야 할 잔여 범위 |
| --- | --- | --- | --- | --- |
| 로고와 공통 SVG | `#header-logo svg`, `.header-menu-link-svg`, `#header-center-project-back-btn-svg`, `#header-center-project-back-btn-svg2` | Lusion 워드마크, 방향 화살표, 복제된 전환 화살표 | H/C/V | `components.html`: 인라인 SVG 추출 갤러리. 동일 기하라도 viewBox·인라인 스타일 차이는 보존 |
| 메뉴·대화 pill | `#header-right-menu-btn`, `#header-right-talk-btn` | 높이 3.2em, radius 6.25em, uppercase. 메뉴 문구 Menu/Close 두 상태 | H/C/V | Components: 키보드·클릭 가능한 상태. Motion: 점 회전·텍스트 이동 |
| CSS 점 아이콘 | `.header-right-menu-btn-dot`, `.header-right-talk-btn-dot`, `.header-menu-link.--active:before` | 두 점 메뉴, 한 점 talk, 현재 경로 활성점. SVG 파일이 아님 | H/C/V | Components: SVG와 별도 CSS 마크로 표시 |
| 소리 상태 | `#header-right-sound-btn canvas`; `Header` | 실제 원본은 Canvas 2D 파형. 원형 바탕, hover 회전/크기, 오디오 상태에 따른 진폭 | H/C/J/V | Components 또는 Motion: 파형 재구성. CSS equalizer가 원본이라는 라벨 금지 |
| 펼침 메뉴 4패널 | `#header-menu-links`, `#header-menu-newsletter`, `#header-menu-talk`, `#header-menu-labs`; `Header` | white link/newsletter/contact 패널과 black labs 패널. contact 패널은 반응형 분기 | H/C/J/V | Components: 메뉴 패널 조합. Motion: 순차 진입/퇴장, hover link pill |
| 메뉴 내부 hover | `.header-menu-link-background`, `.header-menu-link-text-clone`, `#header-menu-labs-text-clone`, `#header-menu-labs-arrow2` | 배경 scale .85→1, 글자 roll, 대각선 화살표 교체 | H/C/J | Components: 링크 hover. Motion: 복제 문자열/화살표 전환 |
| 뉴스레터 입력 박스 | `#header-menu-newsletter-input-field`, `#footer-newsletter-input-field`, `NewletterForm` | rounded field, 제출 화살표, 별도 feedback message | H/C/J/V | Components: label, focus, validation, local feedback. 원본 서비스로 실제 제출은 필요 없음 |
| 확대 dot CTA | `#home-reel-cta-dot`, `#home-featured-cta-dot`, `#project-details-launch-cta-dot`, `#project-details-launch-cta-mobile-dot` | 작은 점이 확대되어 pill 내부를 덮음. 원본 scale 각각 20/32/26 | H/C | Components/Motion: hover·focus 상태, 프로젝트 색상 variant |
| 교차 마크 5종 | `.home-hero-scroll-container-cross`, `.home-reel-video-container-cross`, `.about-cross`, `.end-section-content-cross`, `.scroll-nav-cross` | `::before/::after` 2개 막대. 배치·색·막대 굵기 차이 | H/C/V | Components: CSS family specimen. 전부 하나의 SVG라고 단순화하지 않기 |
| 카드·미디어 박스 | `.project-item-image`, `.section`, `.project-list`, `.about-capability-card-front/back` | 12→6 grid, source image radius 15px, global radius 20→10px, capability .8em | H/C | Components: 용도별 radius 차이를 유지. global radius 하나로 덮지 않기 |
| 프로젝트 메타 박스 | `#project-details-meta`, `#project-details-side-list-services`, `#project-details-side-list-links` | 제목·설명·services·links, per-project 색상 변수, launch CTA | H/C/J | Components: editorial metadata와 링크 목록. 19개 데이터 원장 연결 |
| 혼합 상세 갤러리 | `.project-details-item`, `.project-details-item-text`; `ProjectDetailsSection` | 이미지·영상·텍스트 3종. 데스크톱 가로 이동, 좁은 화면 세로 | H/C/J | Components: 3종 패널 specimen. `VERTICAL_BREAK_PIONT=1000`은 global 812px과 다름 |
| 영상 컨트롤 박스 | `#video-overlay__controls`, `#video-overlay__play-btn`, `#video-overlay__mute-btn`, `#video-overlay__progress-active/bg` | PLAY/MUTE 텍스트, 얇은 progress track, 모바일 close | H/C/J | Components/Motion: 실제 로컬 영상으로 play/pause, mute, seek 검증 |
| 영상 원형 커서 | `#video-overlay-cursor`, `#video-overlay-cursor-svg`; `VideoOverlay` | white circle 6.25em, 포인터 추종, 속도에 따른 scale, 컨트롤 위에서 축소 | H/C/J | Motion: 원형 커서 demo; touch에는 표준 버튼 제공 |
| Footer 조합 | `#footer-contact-address`, `#footer-contact-socials`, `#footer-business-link`, `#footer-bottom-up` | 주소·사회 링크·이메일·newsletter·back-to-top. 밑줄 scale 전환 | H/C/J | Components: 주소/연락 블록, CTA, 상단 복귀 동작 |
| 다음 페이지 UI | `#scroll-nav-section`, `#scroll-nav-next-bar-inner`, `.scroll-nav-cross`; `ScrollNavSection` | 끝에서 계속 스크롤하면 progress 채움 후 다음 경로 이동 | H/C/J | Motion: 안전한 로컬 상태 전환. 일반 스크롤 진행률과 구분 |
| 다음 프로젝트 UI | `#project-details-preview`, `#project-details-preview-footer-bar-inner`; `ProjectDetailsSection` | 다음 프로젝트 제목·미디어 preview와 채움 막대, 가로/세로 preview 이동 | H/C/J | Components/Motion: next-project preview. 단순 링크 카드만으로 전 동작 커버 주장 불가 |

## 모션·임팩트·인포그래픽 커버리지

| 패턴 | 원본 선택자 / 클래스 | 소스에서 확인한 동작·수치 | 근거 | 대상 / 남는 차이 |
| --- | --- | --- | --- | --- |
| 숫자 로더 | `#preloader-percent-digits`, `.preloader-percent-digit-num`; `Preloader` | 세 자리 rolling digits; `MIN_PRELOAD_DURATION=1`, 최종 init/start 분담 .3, 지수 보간 `1-exp(-7*dt)` | H/C/J | Motion: replay 가능한 000→100 + mask demo. 실제 asset loading percentage와 시뮬레이션을 구분 |
| 픽셀 로딩·화면 전환 | `#transition-overlay`; `TransitionOverlay`, `LOADING_RECTS` | Canvas 2D 검정 배경, 5칸 길이 bar→기하 확대/회전; `pixelWidth=min(42,viewportWidth/30)` | H/J | Motion: frame/rotation 전환. 임의 opacity fade만으로 대응했다고 표시하지 않기 |
| Hero 물리·클릭 임팩트 | `#home-hero-visual-container`; `HomeHeroSection`, `HomeBalloons`, `HomeBalloonsPhysics`, `HomeBalloonsBody` | cross geometry 군집, 마우스 상호작용. click→색상 index 순환 + 모든 body `applyImpulse()` | H/J/V | Motion: 포인터 힘/충격 demo + 원본 캡처. 2D 재구성은 원본 3D 물리 복제와 구분 |
| 유체형 포인터 흔적 | `ScreenPaint`, `ScreenPaintDistortion` | ping-pong render targets, blur, push 25, maxRadius 100, velocity dissipation .985 | J | Motion: 잔상/왜곡 실험; CSS blur만 썼다면 GPU 유체 solver 구현이라고 부르지 않기 |
| 스프링 추종 | `SecondOrderDynamics` | spring frequency/damping/response. 프로젝트 focus `(1,.6,2)`, zoom `(2.2,.7,3)`, border `(2.5,.5,2)` | J | Motion: target/follower와 조절 가능 damping. 원본 curve 값 출처 표시 |
| 홈 텍스트·cross 진입 | `#home-hero-scroll`, `.home-hero-scroll-container-cross`; `HomeHeroSection` | scroll 안내와 cross별 진입; 첫 wheel 이벤트를 별도 추적 | H/C/J/V | Motion: staged title/cross reveal |
| Reel thumbnail→stage | `#home-reel-thumb`, `#home-reel-container-inner`; `HomeReelSection` | UfxMesh로 thumb rect→큰 reel rect, video texture, radial center, screenPaint 연결 | H/J | Motion: thumbnail 확장/둥근 rect 보간 + 원본 영상. 3D surface shader는 재구성 한계 표기 |
| Featured depth card | `.project-item-main`; `ProjectItem`, `ProjectItemList` | `home.webp`+`home_depth.webp`; parallax samples 12, blur samples 6, focus/zoom/border spring | H/J | Motion: depth/parallax card. depth map을 실제 읽었는지, 단순 tilt인지 구분 |
| 홈 tunnel travel | `#home-goal`, `#home-goal-image-in/out`; `GoalTunnels`, `GoalBlackTunnel`, `GoalWhiteTunnel`, `GoalTunnelAstronauts` | 스크롤 연결 카메라·입출구·astronaut animation buf, earth texture | H/J | Motion: tunnel section cue 또는 stage 재구성 + 원본 캡처. 실제 astronaut rig는 별도 |
| 유리 파편 임팩트 | `GoalTunnelGlass`, `GoalTunnelEfx`; `glass_broken.ogg` | 독립 geometry/shader 기반 유리/후처리 계층 | J | Motion: impact/shatter specimen. 영상 기반 재구성은 정확한 원본 fracture solver 추정 불가 |
| About cinematic hero | `#about-who`, `#about-crosses`; `AboutHero`, `AboutHeroParticlesSimulation`, `AboutHeroLightField`, `AboutHeroFaces`, `AboutHeroLetters` | camera spline, particles, rocks, ground, fog, halo, face/letter stages | H/J/V | 원본 캡처·scene breakdown + 재구성 demo. `about-ready.png`는 단일 particle frame만 입증 |
| About 가로 장면 진행 | `.about-who-subsection`; `AboutWhoSection`, `WhoSubsectionWeAre`, `WhoSubsectionDetails`, `WhoSubsectionTeam` | we-are/details/team 순차 단계, desktop 가로 오프셋, 모바일 분기 | H/J | Motion: stage 진행률과 텍스트 전환. 단일 about screenshot으로 전 단계 관찰 주장 불가 |
| 팀 계기판 | `#about-who-team-number`, `#about-who-team-progress`, `#about-who-team-indicator-inner`, `#about-who-team-top-compass`, `#about-who-team-bottom-compass` | `[[001]]` 번호, white progress, 긴/짧은 눈금. `WhoSubsectionTeam`이 JS로 눈금 생성 | H/C/J | Motion: 7명 선택, 타이머, 방향 UI. Components: 계기판 모양 |
| 팀 dot matrix·문자 | `#about-who-team-dots`, `.about-who-team-dot`, `#about-who-team-letter-container`; `TextAnimationHelper` | 11열×3행 dot; 이름/직함 matrix text, 첫 글자 texture rendering | H/C/J | Motion: 33 dots + text replacement. source font texture와 DOM 재구성 구분 |
| 팀 cursor·auto cycle | `#about-who-face-cursor`, `#about-who-face-cursor-arrow`; `WhoSubsectionTeam` | 5s auto progress; prev/next tween `1.25+distance*.25s`, cubicInOut; 화살표 180°+velocity tilt; 모바일 swipe .5s gate | H/C/J | Motion: prev/next·swipe·timer. 실제 face morph는 별도 GPU layer |
| Client logo carousel | `#about-clients-carousel`, `.about-clients-carousel-line`; `AboutClientSection` | 3줄, 각 line 복제 3개; 속도 100/135/100 px/s, scroll direction·delta 가산 | H/C/J | Motion: 연속 무봉제 carousel. Assets: 15개 고유 SVG 로고 |
| 수상 숫자/행 인포그래픽 | `.about-award-header-*`, `.about-award-item`, `.about-award-line`; `AboutAwardSection` | Awards 58 / Articles 03 / Talks 5. 숫자/문자 stagger, 라인 scaleX, 아이콘 회전/scale | H/C/J | Motion: reveal + 원본 지표, Components: provider/metadata rows. 원본 accordion toggle 근거 없음 |
| 대형 수상 glyph | `#about-award-title`; `AboutAwardSection`, `SVGParser` | SVG ShapeGeometry + edge instances; `award_gradient.png`, screenPaint, capability 진입 시 invert | H/J | SVG 추출 + Motion visual specimen. 정적 SVG와 원본 WebGL 질감 구분 |
| 전문영역 앞뒤 카드 | `.about-capability-card-front/back`, `.about-capability-subheader-card`; `AboutCapabilitySection` | 4 cards, aspect 314/438. stack→spread, Y 180→0°, fan Z `(index−1.5)*9°`, 10px cos float | H/C/J | Motion: scroll flip/fan. 원본 `cards/back.png` 재사용 가능; mobile도 scroll rotateY |
| Contact ending | `#end-section-title-link`, `.end-section-content-cross`, `#end-section-title-*-decoration`; `EndSection`, `FlipAnimation`, `FlipSim` | 문자 임의 roll: interval 2s/duration 1s, cross 180° 회전, hover decoration lines, 배경 flip simulation | H/C/J | Motion: typography roll + section ending. 배경 simulation은 별도 재구성 범위 |
| Overscroll next-page | `#scroll-nav-next-bar-inner`; `ScrollNavSection` | 끝 5px 범위, 하향 입력 시 +2/s, 대기 .3s, 역방향 −5/s, 일반 감쇠 −.2/s | H/J | Motion: 의도된 추가 스크롤로 progress를 채우는 demo. 실제 외부 이동 불필요 |

## 현재 공개 숫자와 콘텐츠

수상 정보는 수집된 `sources/pages/about.html`의 현재 콘텐츠다. 실제 웹페이지가 이후 변경되면 이 스냅샷도 갱신해야 한다.

| 수상 기관 | 세부 수치 | 합계 |
| --- | --- | ---: |
| Awwwards | Site of the Year 1, Developer Site of the Year 1, Site of the Month 1, Site of the Day 10, Honorable Mention 16 | 29 |
| FWA | Site of the Year 1, Site of the Month 2, Site of the Day 17 | 20 |
| CSSDA | Site of the Year 1, Agency Site of the Year 1 | 2 |
| Webby Awards | Winner 2, Nominee 2 | 4 |
| Lovie Awards | Winner 1 | 1 |
| Drum Awards | Design 1 | 1 |
| CommArts | Best-in-show Interactive 1 | 1 |
| **합계** | 헤더 표시 **58**과 일치 | **58** |

- Articles **03**: Porsche Newsroom — Driven By Dream; Wallpaper — Driven by Dreams; Opera North — The Turn of the Screw.
- Talks **5**: Digital Design Days (Oct 2024 Milan), Awwwards Conf (Oct 2023 Amsterdam), KIKK Festival (Oct 2023 Namur), Awwwards Conf (Oct 2022 Amsterdam), Grow Paris (Nov 2018 Paris). `.--old` 항목에는 CSS 취소선이 있다.
- Team **7**: Edan Kwan, Ffion Morgan, Pierre Nottin, Yannic Laurenz, Paul Catoera, Andrii Ovsiannikov, Sunny. 근거: `sources/assets/lusion.dev/assets/team/team.json`. 첫 HTML 화면의 001은 총원 수가 아니다.
- Clients **15 고유 로고**: Coca-Cola, Max Mara, Calvin Klein, Porsche, Wallpaper, Hyundai, Google, Apple, Webby Awards, Stanford, Sony, Awwwards, NVIDIA, AKQA, Nexus Studios. HTML 반복 및 런타임 복제는 브랜드 수에 중복 포함하지 않는다.
- Capabilities **4**: Strategy, Creative, Tech, Production. 상단 미니 카드의 글자와 실제 본 카드의 `s/c/t/P` 표기를 구분한다. 각 본 카드는 5개 역량 항목을 포함한다.
- Projects **19**, Home featured **12**. `#projects-main-title-project-number`에 실제 숫자 19가 있다.

## 시급도별 누락 판정과 완료 조건

1. **P0 — 원본 UI 수집 누락:** 인라인 SVG와 CSS/Canvas 마크를 분리하여 목록화하고 메뉴·newsletter·CTA·metadata·영상 제어 박스를 직접 써 볼 수 있어야 한다. 파일 SVG 18개를 전체 아이콘 수로 표시하면 실패다.
2. **P0 — 모션 적용 누락:** 설명 글과 동영상만으로 끝내지 않고 loader, staggered menu, pointer/spring, impact, depth card, capability cards, carousel, team/awards 중 주요 패턴을 직접 조작할 수 있어야 한다. 각 demo에 원본 selector/class 및 extracted/reconstructed 구분이 필요하다.
3. **P1 — 숫자·계기판 누락:** 58/03/5, team 7, client 15, projects 19가 해당 원본 데이터와 일치해야 한다. infographic을 임의 수치로 채우지 않는다.
4. **P1 — 화면 관찰 빈틈:** 정지 screenshot으로 가려졌던 about team/awards/capability와 goal/ending의 원본 화면을 별도 기록해야 한다. 이 감사의 bundle 근거를 관찰 완료 근거로 대신하지 않는다.
5. **P1 — 영상 제작 추론 빈틈:** 영상별 초·중·후반 프레임, 관찰한 움직임, 공개 코드로 설명 가능한 부분, 제작 워크플로 추정을 구분한다. 단일 poster로 영상 전체의 choreography를 안다고 쓰지 않는다.
6. **P2 — 전체 실시간 엔진 동일성:** 클라이언트 별 고유 3D art, 원본 rigid-body/shader pipeline, astronaut rig, 얼굴 입자 morph, flip simulation의 픽셀 동일 재현은 별도 구현·비교가 필요하다. 수집·분석·독립 demo가 이를 완료했다는 의미는 아니다.

최종 검증 시 `components.html`과 `motion-lab.html`의 실제 section/demo 이름으로 위 대상 매핑을 대조하고, viewport 812px 전후 및 project-detail 1000px 전후의 분기를 확인한다. 키보드 조작, pause/replay, reduced-motion, 로컬 미디어 경로, 콘솔 오류도 실제 브라우저에서 확인해야 한다.

## 감사에서 제외한 번들 잔여 항목

`.dg.*`는 배포 번들에 포함된 디버그 GUI 스타일이며 수집 22개 public page의 제품 UI가 아니다. `PlaygroundPage`와 `.playground-main-timeline-*` 역시 현재 페이지 집합에 존재하지 않아 별도 공개 화면으로 단정하지 않는다. CSS 또는 JS에 남아 있다는 사실만으로 숨은 페이지를 수집 완료했다고 표시하지 않는다.

이 감사는 소스 전수 확인 및 두 장의 원본 화면 관찰을 완료했다. 병렬 구현 파일의 작성·실행·화면 일치 검증은 각 담당자와 최종 통합 단계의 증거를 따른다.


## v2 최종 적용 매핑

위 표의 담당 제안은 감사 시점의 계획이다. 최종 구현 위치와 범위는 다음과 같다.

| 감사 대상 | 최종 적용 | 재현 범위 |
| --- | --- | --- |
| 인라인·외부 SVG, CSS 심벌 | [아이콘 라이브러리](../components.html#symbols) | 597회 인라인 사용 → 31종, 외부 18종, 새 심벌 9종. 원본·재구성 구분 |
| 메뉴·폼·CTA·메타데이터·그리드·프로젝트 테마·수상 행·릴·클레이 버튼 | [컴포넌트](../components.html) | 조작 가능한 상태, 로컬 폼 검증, 원본 수치 58/03/5 및 프로젝트 테마 19개 |
| 팀·클라이언트·전문영역 카드 | [팀](../components.html#spec-team), [캐러셀](../components.html#spec-clients), [카드](../components.html#spec-capability) | 7명 계기판, 15개 로고의 5개 단위 탐색, 4개 앞뒤 카드. 얼굴 3D·원본 연속 3행·스크롤 부채꼴 전체 재현은 아님 |
| 히어로 물체·입자·깊이·충격·공간·타입·인포그래픽·전환·자석 | [모션 실험실](../motion-lab.html) | 실제 WebGL/Canvas/SVG 동작. 비율 그래프는 명시된 예시 데이터, 원본 수상 숫자는 별도 컴포넌트 |
| 릴 확대·엔딩 문자·다음 페이지 진행률 | [시퀀스](../index.html#sequences) | 조작 가능한 독립 상태. 엔딩 배경 flip simulation 및 실제 페이지 강제 이동 생략 |
| 영상·제작 방법 | [28개 영상 분석](../video-analysis.html) | 84개 시간 검증 샘플 + 실제 영상 탐색. 원본 프롬프트 미확인, 신규 제작 프롬프트와 방법 제공 |
| 프로젝트 상세 설명 누락 | [프로젝트 데이터](projects.json) | 이미지 181 + 영상 26 + 텍스트 2 = 상세 갤러리 209개 항목 보존 |

원본 섹션 캡처와 구현 화면은 [검증 문서](verification-v2.md)에 연결했다. 모든 공개 장면의 동일 엔진·픽셀 일치를 완료했다고 판정하지 않는다.
