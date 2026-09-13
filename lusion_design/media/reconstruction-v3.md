# Reconstruction Studio v3

작성: 2026-09-06. 범위: `reconstruction.html`, `reconstruction.css`, `reconstruction.js`, `scripts/decode-buf.cjs`, `scripts/verify-reconstruction.cjs`, `sources/decoded`, `research/buf-analysis-v3.json`.

이 문서는 공개 수집물에서 확인되지 않는 Lusion 원본 구조를 단정하지 않고, 확인 가능한 클래스·에셋·수치를 바탕으로 만든 대체 구현의 근거와 한계를 기록한다. 이 화면은 원본 사내 저장소, DCC 씬, shader graph, fracture solver, rig, 생성 프롬프트를 복원한 결과가 아니다.

## 소스 완전성 판정

- 수집된 공개 페이지와 자산 커버리지는 `research/coverage-v2.md`에 22개 페이지, 상세 갤러리 209개 등장 항목, collection summary 기준 394 assets로 정리되어 있다.
- `sources/site.js`는 Three.js `REVISION="158"`과 `BufItem`, `ScreenPaint`, `Preloader`, `GoalTunnel*`, `AboutHero*` 계열이 포함된 공개 배포 번들이다.
- `sources/assets/lusion.dev/assets/models/**/*.buf`와 텍스처는 공개 전송된 자산이지만, 사내 원본 파일이나 제작 프로젝트를 포함하지 않는다.
- 따라서 “공개 전송 소스는 수집물 기준으로 대조 가능”하지만 “비공개 원본까지 빠짐없음”은 증명할 수 없다. 비공개/구조 미확인 영역은 아래 대체 구현으로 채웠다.

## 확인한 `.buf` 구조와 전수 추출

직접 파싱한 55개 `.buf` 파일은 앞 4바이트 little-endian 정수로 JSON 헤더 길이를 담고, 바로 뒤에 UTF-8 JSON 헤더, 이후 binary payload가 붙는다. 헤더에는 `vertexCount`, `indexCount`, `attributes[]`가 있고 attribute에는 `id`, `componentSize`, `storageType`, `needsPack` 등이 있다.

`scripts/decode-buf.cjs`는 공개 `BufItem` 구현의 unpack 공식을 따라 `position`과 `indices`를 해석한다. 전수 결과는 `research/buf-analysis-v3.json`, 추출 좌표/OBJ는 `sources/decoded/`에 있다. 결과는 Mesh 34개, Points/animation 계열 21개다. 실패 파일은 없다.

| 파일 | 확인 결과 |
| --- | --- |
| `models/about/person.buf` | header 944B, vertex 2666, index 11952, `uv`, `boneWeights`, `indices`, `position`, `boneIndices`, `normal` |
| `models/about/person_idle.buf` | header 388B, vertex 4590, index 0, `orient`, `position` |
| `models/playground/tunnel.buf` | header 320B, vertex 64, index 192, `position`, `indices` |
| `models/home/cross.buf` | header 1116B, vertex 4940, index 29628, `daoN`, `normal`, `SN`, `ao`, `daoP`, `indices`, `position`, `thickness` |

`needsPack`가 true인 attribute는 `packedComponents[].from/delta`와 storage bit 폭으로 되돌렸다. 다만 `orient`, bone, shader-specific attribute, scene playback 의미는 위치 좌표만으로 확정할 수 없다. animation 계열은 좌표 JSON으로 보존하고 “semantic playback not reconstructed”로 표시한다.

## 01 Fluid-like pointer trail

근거: `sources/site.js`의 `ScreenPaint`, `_prevPaintRenderTarget`, `_currPaintRenderTarget`, `pushStrength`, `velocityDissipation`, `weight1Dissipation`, `ScreenPaintDistortion`.

새 구현: `reconstruction.js`의 `pushFluid`와 `fluid` demo. 포인터 속도를 반경과 입자 수로 바꾸고, Canvas 2D radial gradient를 `lighter` 합성으로 누적한다.

차이: ping-pong FBO, curl noise, render target blur, RGB distortion shader는 없다. 화면에는 “substitute”로 표시하고 원본 solver라고 부르지 않는다.

## 02 Face + astronaut particle morph

근거: `sources/assets/lusion.dev/assets/textures/tunnels/astronaut/face.png`가 100×345 grayscale PNG로 수집되었고, astronaut base/normal/arm 텍스처명과 `AboutHeroParticlesSimulation`, `AboutHeroFaces`, `GoalTunnelAstronauts` 클래스명이 공개 번들에 존재한다.

새 구현: `reconstruction.js`의 `facePoint`, `astronautPoint`, `morph` demo. 실제 텍스처를 렌더하지 않고 얼굴형 타원과 우주복형 절차 실루엣 사이를 1,300개 점으로 보간한다.

차이: 원본 얼굴 mesh, astronaut rig, instance animation from/to/blend, shader material, halo/fog/lighting은 포함하지 않는다. 비공개 구조를 모르는 상태에서 보이는 동작 원리를 대체한 것이다.

## 03 Glass shatter polygons

근거: `research/coverage-v2.md`는 `GoalTunnelGlass`, `GoalTunnelEfx`, `glass_broken.ogg`를 유리 파편 임팩트 근거로 분류한다.

새 구현: `reconstruction.js`의 `buildShards`, `hitShatter`, `shatter` demo. 화면을 9×6 polygon fragment로 나누고 클릭 충격점에서 거리 기반 속도와 회전을 준다.

차이: fracture mesh, glass shader, audio, postprocessing, tunnel camera와의 연결은 없다. 충격감 specimen으로만 사용한다.

## 04 SecondOrderDynamics follower

근거: `research/coverage-v2.md`의 원본 수치 `focus (1,.6,2)`, `zoom (2.2,.7,3)`, `border (2.5,.5,2)`.

새 구현: `reconstruction.js`의 `SecondOrderDynamics` class. 공개 수치를 프리셋으로 선택하고 target/follower 위치를 DOM 요소와 SVG path로 보여준다.

차이: 원본 프로젝트 카드의 focus, zoom, border shader/mesh 값에 직접 연결하지 않는다. 수치와 동역학 감각을 확인하는 독립 데모다.

## 05 Loader + transition wipe

근거: `sources/site.js`의 `Preloader` rolling digits, `MIN_PRELOAD_DURATION=1`, `PERCENT_BETWEEN_INIT_AND_START=.3`, `1-exp(-7*dt)`, `transition-overlay`, load bar, rotate/scale, `globalCompositeOperation`.

새 구현: `reconstruction.js`의 `loader` demo. 000→100 숫자, 5칸 loading rect, 회전하는 십자 aperture를 `destination-out`으로 그린다.

차이: 실제 asset loading percent와 routing이 아니다. 로컬 장면 전환 타임라인만 재생한다.

## 06 Decoded BUF model viewer

근거: `sources/readable/classes/BufItem-1203837.js`에서 `Uint32Array` 헤더 길이, JSON 파싱, typed array payload, `needsPack`, `BufferGeometry`, `setIndex`, `setAttribute` 흐름을 확인했다.

새 구현: `sources/decoded/manifest.json`에서 선택 가능한 모델 목록을 읽고, 각 `.points.json`의 실제 decoded position 좌표를 Canvas point cloud로 투영한다. 기본 선택은 `cross.buf`이며 사용자는 다른 decoded model로 바꿀 수 있다.

차이: OBJ/JSON 좌표 추출은 실제 공개 payload에서 온 값이지만, 화면 viewer는 점 구름 미리보기다. 원본 material, shader, skinning, line rendering, rig animation, scene graph playback은 구현하지 않는다.

## UI/UX 결정

- 원본 토큰 `tokens/lusion.css`를 읽고 off-white, black, blue, green, Aeonik/IBMPlexMono를 재사용했다.
- 화면은 “디자인 시스템 소스 보는 UI” 관점에서 데모, 근거 링크, 차이 설명을 한 섹션 안에 묶었다.
- 모든 데모는 Play/Pause 또는 Reset 계열 컨트롤, 키보드 조작, `prefers-reduced-motion`/수동 동작 감소 체크박스를 가진다.
- `source-explorer.html`은 `reconstruction.html#models`로 연결해 decoded model viewer에 바로 접근한다.

## 검증

검증 스크립트: `node scripts/decode-buf.cjs`, `node scripts/verify-reconstruction.cjs`.

검증 항목: JS 문법, 파일 존재, 55개 `.buf` 전수 파싱, decoded manifest/OBJ/JSON 존재, HTTP 렌더링, 콘솔 오류, desktop/mobile screenshot, interactive controls, morph/loader/clear 결과, pause stability, reduced-motion toggle 및 media change, local href 존재, decoded model fetch, horizontal overflow.
