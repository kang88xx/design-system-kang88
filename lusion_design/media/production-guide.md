# Lusion 관찰 기반 미디어 제작 가이드 — **원본 생성 프롬프트·내부 제작 방식 아님**

작성일: 2026-09-06 (KST)  
목적: 확보된 공개 렌더 캡처와 `sources/site.js`에서 확인한 런타임 자산 연결 방식을, 독자적인 작품을 제작하기 위한 미디어 브리프로 전환한다. 아래 영어 프롬프트는 이 문서에서 새로 작성한 예시이며 Lusion, 고객사, 협력사 또는 자산 제작자의 실제 프롬프트·시드·워크플로가 아니다. 로고, 고유 캐릭터, 프로젝트 카피, 원본 모델·영상·음원을 포함하지 않는다.

## 관측한 시각 언어

- `screenshots/home-ready.png`에는 어두운 무대 안에서 광택 있는 흑·백·청색의 둥근 십자형 모듈이 밀집되어 있고, `screenshots/home-scroll-5.png`에는 밝은 중성 바탕 위의 큰 산세리프 타이포그래피, 굵은 청색 곡선, 모서리가 둥근 보랏빛 3D 장면 카드가 보인다.
- `screenshots/_projects.png`은 밝은 바탕·큰 “PROJECTS” 제목·큰 모서리 반경의 미디어 타일이라는 편집 구조를 보인다.
- `screenshots/_projects_porsche_dream_machine.png`은 흐린 장밋빛 단색 배경, 좌측의 정보 계층, 우측의 큰 미디어 창을 보인다. 해당 프로젝트 HTML은 이를 CG short film으로 설명하고, 서비스에 Concept, 3D Design, Motion Design, Compositing을 명시한다.
- 이것은 **캡처에서 관찰한 레이아웃/인상**이다. 색상 토큰, 폰트, 세부 오브젝트 형상, 원본 미디어를 복제하라는 지시가 아니다.

## 코드에서 직접 확인한 구현 증거와 제작 연결

| 런타임 증거 | 확인된 사실 | 제작·구현에 연결할 원칙 |
| --- | --- | --- |
| `HomeHeroSection` 및 `HomeBalloons` | 홈 히어로 DOM 섹션과 3D stage가 존재하며, `HomeBalloons`에는 중력·마찰·반발·마우스 영향으로 갱신되는 body physics가 있다. 제공된 분석 앵커에는 `cross.buf`, matcap 환경 텍스처가 연결된다. | 히어로는 “배경 영상”보다 **물리 반응 가능한 3D 오브젝트 군**으로 설계한다. 독자 제작 시 원본 cross 모델 대신 자체 모듈을 만든다. |
| `ScreenPaint` | render target을 만들고 이전/현재 paint target을 복사·blur하며, `ScreenPaintDistortion`이 post effect로 연결된다. | 커서/터치 흔적은 별도 FBO(오프스크린 텍스처)에 누적한 뒤 굴절·RGB shift 같은 후처리의 입력으로 쓴다. |
| 프로젝트 카드 | 각 프로젝트는 `home.webp`와 `home_depth.webp`를 texture로 로드한다. | 정적 썸네일 + depth map으로 가벼운 시차/포커스 이동을 만든다. 깊이는 생성형 이미지의 사실성보다 레이어 분리와 마스크 품질이 핵심이다. |
| 홈 reel | `<video>`를 muted·loop·playsinline으로 만들고 `VideoTexture`로 감싼다. viewport 조건에 따라 `reel/mobile.mp4` 또는 `reel/desktop.mp4`를 전환한다. | 짧고 무음 자동재생 가능한 reel을 데스크톱/세로 화면별로 별도 편집·인코딩하고, WebGL이 꺼진 경우 일반 video/poster로 전달한다. |
| 터널 장면 | astronaut geometry와 in/out/loop animation `.buf`, 흑·백 터널 uniform, matcap 텍스처를 로드한다. | “진입 → 체류 루프 → 퇴장”의 애니메이션 클립을 분리하고, 반사 질감은 환경/매트캡으로 통제한다. 자체 제작 캐릭터와 라이선스가 확인된 리그만 사용한다. |
| About 장면 | `about/terrain.buf`, terrain shadow/light/height texture, person geometry·idle animation, person/light/shadow texture와 render target이 확인된다. | 지형, 인물, 그림자/광원 정보를 분리해 장면의 깊이를 만든다. 인물 실루엣은 작은 화면에서 읽히도록 과도한 세부보다 명암 분리를 우선한다. |

### 확인된 수치와 제안 수치의 구분

- **확인됨:** 시각 검토에 사용한 네 캡처는 각각 `1440 × 1000 px`이다. reel 코드는 viewport 폭 `812` 이하를 세로 영상 조건으로 사용하며, UFX mesh의 분할값 `32 × 32`를 설정한다. About terrain 클래스에는 `SIZE=768`이 있다. 이 값들은 확보된 번들의 관측값일 뿐, 복제 프로젝트의 권장값이 아니다.
- **제안:** 아래 프롬프트와 파이프라인은 해상도, 프레임레이트, 비트레이트, GPU 예산의 특정 수치를 강제하지 않는다. 목표 장치, 에셋 품질, 실제 성능 측정 뒤에 별도로 정한다.

## 독자 제작용 프롬프트 7종

각 항목의 영어 문구는 이미지/영상 생성 도구 또는 3D 아티스트 브리프의 출발점이다. **실제 Lusion 프롬프트가 아니며, 결과물을 참조 사이트의 원본과 동일하게 만들도록 쓰지 않는다.**

### 1. Hero / kinetic modular field

**New English prompt — not an original Lusion prompt:**

> A field of invented rounded three-armed modules with a circular core, tumbling slowly in a dark gallery void; cobalt, graphite, and porcelain ceramic finishes; close layered composition with generous negative space for interface copy; premium product-render realism, no logos, no letters, no recognizable brand geometry, no copyrighted character.

- **카메라·재질·광원:** 가까운 광각 구도에서 전경 모듈 일부를 프레임 밖으로 자르고, porcelain은 넓은 softbox 반사, graphite는 날카로운 rim highlight, cobalt는 채도만 남기고 과한 glow를 피한다.
- **모션:** 반복 오브젝트마다 위상·회전·낙하 속도를 다르게 하고, 포인터 근처에서 밀려나되 화면 정보 영역을 가리지 않게 한다.
- **네거티브:** `text, logo, wordmark, branded product, copied asset, human face, chaotic neon, melted geometry, unreadable silhouette`.
- **파이프라인/대체화면:** 자체 모델 + 베이크드 preview를 준비한다. GPU/감소 모션에서는 poster 이미지와 일반 DOM 타이포그래피를 낸다.
- **검수:** 오브젝트를 정지했을 때도 앞·중간·뒤 깊이가 읽히고, CTA/본문 안전영역이 확보되어야 한다.

### 2. Pointer paint / FBO distortion plate

**New English prompt — not an original Lusion prompt:**

> An abstract liquid-ink interaction plate for a web canvas: transparent pearlescent pigment drifting over a near-black surface, subtle prismatic refraction, restrained motion, designed as an input texture for real-time distortion; no typography, no logo, no recognizable artwork.

- **카메라·재질·광원:** 평면 또는 얕은 매크로 시점, 반사보다 투과와 미세한 색 분리를 우선한다.
- **모션:** 입력 좌표·속도를 paint FBO에 기록하고 blur/dissipation 후 distortion shader가 읽는다. 이 방식은 코드에서 확인된 ScreenPaint의 render target 누적 구조와 연결된다.
- **네거티브:** `hard UI icon, logo, readable text, violent splash, thick smoke, full-screen opaque paint, seizure-inducing flash`.
- **파이프라인/대체화면:** 생성 이미지는 displacement/noise reference로만 사용하고, 상호작용 자체는 shader에서 만든다. WebGL 불가 시 포인터 효과 없이 같은 색상 표면을 표시한다.
- **검수:** 포인터를 멈추면 효과가 자연스럽게 사라지고, 텍스트의 대비·가독성·클릭 영역이 유지되어야 한다.

### 3. Project card / depth-separated still

**New English prompt — not an original Lusion prompt:**

> An original editorial still life for an interactive project card: a small experimental object on a tactile workbench, layered foreground tools, middle subject, distant atmospheric backdrop, quiet warm daylight, cinematic but practical composition, intentionally clear depth separation, no logos, no readable packaging, no trademarked product.

- **카메라·재질·광원:** 카드 비율에서 피사체를 중앙 고정하지 말고, 전경·중경·배경이 가려지지 않게 분리한다. 재질은 종이·목재·무광 플라스틱처럼 서로 다르게 읽히게 하고, 부드러운 측광으로 깊이를 만든다.
- **모션:** `home.webp`/`home_depth.webp` 관측 패턴에 맞춰 color image와 별도 depth map을 생성·검수한 뒤 작은 시차와 focus shift만 적용한다.
- **네거티브:** `brand logo, legible brand name, duplicated objects, flat background, incorrect depth map edges, extreme fisheye, watermark`.
- **파이프라인/대체화면:** depth map은 자동 생성만 믿지 말고 피사체 윤곽·투명부·배경 경계를 수동 보정한다. WebGL 불가 시 color image 하나로 렌더한다.
- **검수:** 카드 호버에서 윤곽이 찢어지거나 배경이 전경보다 앞에 뜨지 않아야 하며, 썸네일만으로 프로젝트 성격이 구별되어야 한다.

### 4. Reel / responsive motion montage

**New English prompt — not an original Lusion prompt:**

> A concise original motion-design montage for an interactive studio reel: abstract material studies, sculptural close-ups, calm transitions, designed in both wide and vertical compositions; intentional pacing, clean frames for cropping, no logos, no client work, no borrowed footage, no readable text.

- **카메라·재질·광원:** 각 shot은 넓은 프레임과 세로 프레임에서 핵심 피사체가 남도록 별도 구도를 잡는다. 재질 변화가 컷의 리듬을 만들고, 광원은 shot 간에 색온도/방향을 급격히 흔들지 않는다.
- **모션:** 소스에서 확인한 desktop/mobile 동영상 전환과 VideoTexture 사용을 전제로, 두 편집본을 별도 제작한다. 무음 loop의 앞뒤 연결점은 자연스러워야 한다.
- **네거티브:** `brand reel, product logo, strobing, rapid unreadable montage, face likeness, watermark, embedded captions`.
- **파이프라인/대체화면:** MP4 + poster와 접근 가능한 재생 컨트롤을 제공한다. 데이터 절약/감소 모션 시 poster 또는 사용자가 시작하는 일반 video로 전환한다.
- **검수:** 세로·가로 모두에서 핵심 피사체가 crop되지 않고, loop seam·autoplay 실패·소리 자동재생이 없어야 한다.

### 5. Tunnel / original character journey

**New English prompt — not an original Lusion prompt:**

> An original faceless explorer in a minimal engineered tunnel made of repeating geometric panels, progressing from darkness toward a muted luminous threshold; matte white, charcoal, and one restrained accent color; cinematic spatial storytelling, no astronaut likeness, no franchise reference, no logos.

- **카메라·재질·광원:** 한 방향 소실점, 낮은 시선, 반복 구조의 리듬을 사용한다. matcap/environment texture는 금속·도료의 반사 방향을 일관되게 보이게 하는 용도이며, 원본 텍스처를 쓰지 않는다.
- **모션:** 별도 `enter`, `idle loop`, `exit` 클립을 제작한다. 이는 코드에서 관측한 astronaut in/out/loop 분리와 같은 **일반적 구조 제안**이다.
- **네거티브:** `NASA insignia, space franchise, recognizable astronaut suit, copied tunnel, brand logo, lens flare overload`.
- **파이프라인/대체화면:** 자체 리그/애니메이션 또는 사용 허가가 확인된 자산만 사용한다. 저사양에서는 동일한 서사의 프리렌더 video 또는 정적 key frame으로 교체한다.
- **검수:** 진입·루프·퇴장 전환에서 포즈가 튀지 않고, 캐릭터가 작아도 진행 방향과 스케일 변화가 읽혀야 한다.

### 6. About / terrain and person silhouette

**New English prompt — not an original Lusion prompt:**

> An original solitary figure standing on a softly sculpted abstract terrain, viewed as a graphic silhouette within a quiet horizon; tactile clay-like ground, gentle long shadows, limited neutral palette with one subtle color accent, contemplative and non-narrative, no face likeness, no logo, no recognizable location.

- **카메라·재질·광원:** 멀리서 지형 곡률과 인물 윤곽이 겹치지 않게 배치한다. terrain height/shadow/light의 분리된 레이어를 염두에 두되, 자체 지형/텍스처를 제작한다.
- **모션:** idle은 호흡·무게 이동처럼 작은 변화만 주고, 조명 변화는 장면의 시간감을 돕는 수준으로 제한한다.
- **네거티브:** `celebrity likeness, facial close-up, known landmark, brand mark, busy crowd, harsh HDR, dramatic storm`.
- **파이프라인/대체화면:** 지형 geometry, albedo/height/shadow 혹은 이에 상응하는 레이어를 분리해 보관한다. WebGL 불가 시 대비가 유지된 단일 still을 제공한다.
- **검수:** 인물·지형·그림자가 작은 화면에서도 각각 분리되어 보이고, 그림자가 지형과 물리적으로 어긋나지 않아야 한다.

### 7. Editorial case-study hero / dreamlike installation

**New English prompt — not an original Lusion prompt:**

> An original dreamlike installation of tiny invented botanical and mechanical fragments hovering above a soft blush floor, a restrained surreal composition for a case-study hero, high craft CGI, soft haze, ample clear area for editorial text, no cars, no luxury marque, no logo, no copied campaign art.

- **카메라·재질·광원:** `Porsche: Dream Machine` 캡처에서 관찰된 “정보 좌측 / 큰 미디어 우측 / 저채도 배경”이라는 편집 원칙만 독자적으로 적용한다. 피사체·팔레트·브랜드 식별물은 새로 만든다.
- **모션:** 부유물은 완만히 떠다니고, 카메라는 짧은 push-in 또는 옆 이동 중 하나만 사용한다. compositing에서 fog·shadow·focus를 통합한다.
- **네거티브:** `Porsche, car emblem, real vehicle, flower brand, text, logo, copyrighted campaign, cluttered frame`.
- **파이프라인/대체화면:** concept → 3D asset/design → motion → compositing의 공개 프로젝트 서비스 구분을 작업 보드에 반영하되, 실제 사례의 원본 장면/영상은 사용하지 않는다. poster는 영상의 대표 프레임과 다른 안전 구도를 둔다.
- **검수:** 제목·설명·CTA를 얹어도 미디어가 답답해지지 않고, poster와 motion 첫 프레임의 인상이 일치해야 한다.

## 공통 제작 계약

1. **자산 원장:** 모든 image/video/model/rig/texture/audio에 제작자, 원본, 라이선스/허가, 편집 이력, 사용 화면, 대체 화면을 기록한다.
2. **장면 계약:** DOM anchor, scene object, input trigger, motion state, render tier, fallback, reduced-motion 동작을 한 항목으로 관리한다.
3. **접근성:** 자동재생 영상은 무음으로 시작하고, 동작 감소 환경에서는 3D·VideoTexture·FBO 효과를 정지 이미지나 사용자 시작 재생으로 낮춘다.
4. **권리 경계:** 사이트 캡처와 번들 문자열은 분석 근거일 뿐, 원본 3D 모델·영상·이미지·음원·브랜드 요소의 사용 허가가 아니다.
