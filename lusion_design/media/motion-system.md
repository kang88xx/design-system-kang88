# 모션 시스템: 공개 구현과 재현 계약

이 문서는 원본 코드에서 **확인한 구조**와 재현을 위한 **새 구현 제안**을 구분한다. 정확한 원본 모션 시간/이징은 [CSS·JS 근거](../research/css-evidence.md), 추출 값은 [토큰 JSON](../tokens/lusion.tokens.json)을 우선한다. 본문에서 제안한 duration, 품질 목표를 Lusion의 원본 수치로 인용하지 않는다.

## 1. 장면별 구현 맵

| 효과 | 확인한 구현 근거 | 수집 자산 | 재현할 때의 계약 |
| --- | --- | --- | --- |
| 히어로 3D 십자 오브젝트 | `HomeHeroSection`이 `homeBalloons` 등록, 클릭 시 `changeHomeHeroColorSignal.dispatch()` | `assets/models/home/cross.buf`, `assets/textures/home/matcap.exr` | 오브젝트 렌더링·물리·입력은 장면 계층, 제목/CTA는 DOM |
| 커서 페인트/왜곡 | `ScreenPaint`, 이전/현재 paint render target와 uniform, FBO 생성 | 번들 내부 셰이더 | 포인터 좌표와 속도를 저해상도 필드에 누적, 감쇠 후 시각 레이어에 전달 |
| 작품 카드 깊이 | `home.webp`와 `home_depth.webp`를 로드, `SecondOrderDynamics`로 focus/zoom 처리 | 각 프로젝트의 RGB/깊이 쌍 | 화면 내 포인터를 정규화해 UV/초점 이동, 가장자리는 클램프; 터치/감소 모션은 정적 |
| 스튜디오 릴 | `VideoTexture`, `playsinline`, `loop=true`, 가로/세로 파일 분기 | `assets/textures/reel/desktop.mp4`, `mobile.mp4` | 짧은 미리보기 루프와 전체 영상 플레이어는 별개 콘텐츠; mute 상태와 사용자 재생을 구분 |
| 터널/우주비행사 | 인스턴스 애니메이션 from/to/blend, in/out/loop 버퍼와 재질 텍스처 | `assets/models/tunnels/*.buf`, `assets/textures/tunnels/*` | 스크롤 진행률을 카메라/장면 구간에 매핑하고 장면 진입·루프·이탈을 구분 |
| About 풍경 | sphere/rock/terrain/person/camera spline 로드, 레이어 텍스처 | `assets/models/about/*`, `assets/textures/about/*` | 배경·인물·그림자·안개·카메라 경로를 각각 제작하고 합성 |
| 페이지/로더 전환 | `#transition-overlay` canvas, `#preloader` 퍼센트 자리, JS 전환 로직 | HTML/CSS/JS | 준비 완료 전에 필수 탐색이 사라지지 않는 fallback 구성 권장 |
| 상세 갤러리 | HTML `data-filename`, `data-type`, `data-width`, `data-height`, `data-fullscreen` | 각 프로젝트의 image*.webp/video*.mp4 | 파일 이름이 아닌 메타데이터로 비율과 전체 폭 여부를 결정 |

경로 앞에는 원본 런타임이 지정한 `https://lusion.dev`가 붙는다. 파일은 로컬 `sources/assets/lusion.dev/` 아래 동일 구조로 저장된다. `.buf`는 사이트가 읽는 배포 데이터이며 공개 편집용 3D 씬 포맷으로 확인되지 않았다.

## 2. 레이어 구성 — 재현 제안

```text
입력: pointer / wheel / touch / keyboard
    ↓ 정규화 (좌표, 속도, progress)
상태: activeScene / progress / focus / motionPreference / assetStatus
    ├─ DOM: 제목, 버튼, 메뉴, 본문, 접근성 정보
    ├─ WebGL: 오브젝트, depth image, ScreenPaint, 후처리
    └─ Media: muted loop, poster, full player
    ↓
캡처 및 검수: 비율 / 깊이 경계 / 프레임 안정성 / 축소 모션 / fallback
```

이 구성도는 원본 모듈 의존 관계를 모두 복원한 것이 아니라 확인한 요소를 구현 단위로 정리한 것이다. [공식 WebGL Scroll Sync 데모](https://github.com/lusionltd/WebGL-Scroll-Sync)는 단일 캔버스와 DOM 동기화의 별도 참고 자료다.

## 3. 공통 상태 명세 — 재현 제안

| 상태 | DOM | WebGL / 영상 | 종료 조건 |
| --- | --- | --- | --- |
| loading | 제목·링크·로더·포스터 | 필수 자산만 준비 | 필수 자산 ready 또는 오류 |
| ready | 모든 기본 UI 사용 가능 | 화면에 있는 장면만 갱신 | 화면 이탈/오류/사용자 중지 |
| interacting | hover와 focus 동등한 피드백 | pointer나 scroll에 반응 | 입력 끝, 안정 상태로 감쇠 |
| paused | UI 사용 가능, 정지 표시 | requestAnimationFrame/영상 중지 | 명시적 재생/가시성 복구 |
| reduced | 의미 정보 그대로 유지 | 카메라·시차 없이 포스터/고정 장면 | 사용자 모션 설정 변경 |
| fallback | 정적 이미지와 일반 링크 | GPU/영상 실패해도 빈 화면 금지 | 재시도 또는 정적 상태 지속 |

신규 권장 성능 목표: 데스크톱 60fps, 저사양 모바일 30fps를 목표로 프로파일링한다. 이번 캡처 환경에서는 이 목표를 실측 검증하지 않았다. 무조건 프레임 목표를 주장하지 말고 실제 기기·장면·해상도를 기록한다.

## 4. 제안된 모션 규칙

v5부터 DOM 인터랙션의 추출 수치와 키트 구현은 [인터랙션·모션 근거 원장](../research/interaction-evidence.md)과 `kit/`가 기준이다. 아래 항목은 그 이전의 요약이다.

- 버튼 hover: 180–240ms의 짧은 transform/색상 피드백. 이는 새 권장 범위다.
- 메뉴: open/close 상태를 명시하고 빠르게 연속 클릭해도 같은 최종 상태가 되도록 중복 애니메이션을 취소한다.
- 타이포 등장: 단어 마스킹은 스크린리더에 분할된 단어를 중복 노출하지 않는다. 모바일·reduced motion에서는 즉시 표시한다.
- depth card: 포인터 이동량에 맞춰 작은 진폭으로 반응. 가려진 영역은 생성 이미지에 존재하지 않으므로 과도한 시차를 금지한다.
- scroll-driven camera: progress를 단일 source로 두고 특정 단계에서만 다음 장면을 준비한다. 페이지 탐색은 링크로도 가능해야 한다.
- loop video: 첫 프레임 포스터를 제공하고 `preload="none"` 또는 `metadata`를 선택한다. 자동 무음 루프도 정지할 수 있게 한다.
- 소리: 클릭/hover `.ogg` 파일이 원본 네트워크에 있지만, 재현 시 항상 사용자 선택과 mute 상태를 우선한다.

## 5. 제작 방식 선택표

| 필요한 결과 | 권장 방식 | 필수 산출물 | 선택 이유 |
| --- | --- | --- | --- |
| 작품 썸네일이 살짝 깊게 반응 | 이미지 + 깊이 맵 셰이더 | RGB, 동일 크기 depth, 안전한 UV 영역 | 전체 3D보다 가벼운 화면 반응 |
| 재질·오브젝트가 포인터/클릭에 반응 | WebGL 실시간 3D | 메시, 재질/텍스처, 조명 또는 matcap, fallback | 실제 입력 반영 |
| 긴 고품질 서사/유체/복잡한 생성 장면 | 프리렌더 영상 | 데스크톱/모바일 영상, 포스터, 자막 필요 여부 | 영상으로 품질을 고정 |
| 정밀한 제품 변형·카메라 경로 | DCC 기반 3D+렌더 | 편집 가능한 씬, 렌더 패스, 타임라인 | AI 출력의 형태/시간 일관성 한계를 제어 |
| 콘셉트 탐색/무드보드 | 생성 이미지·짧은 영상 | 프롬프트, 결과, seed/model 있으면 기록 | 탐색을 빠르게 반복 |

Blender/Cinema 4D/Houdini 등을 후속 제작 도구로 선택할 수 있지만, 이 문서는 해당 도구가 원본 홈페이지 제작에 쓰였다고 확인하지 않았다. 실제 원본 생성형 프롬프트는 공개 확인되지 않았다.

## 6. 검수 체크리스트

1. 같은 viewport에서 포스터·영상·3D의 화면 비율이 일치한다.
2. depth map과 원본 이미지가 픽셀 단위로 정렬되며 가장자리의 늘어짐/찢어짐이 없다.
3. 화면 밖 장면과 숨겨진 탭은 갱신·디코딩을 멈춘다.
4. 모바일에서 hover 없이 프로젝트 탐색, 메뉴 닫기, 영상 정지가 가능하다.
5. WebGL 실패·네트워크 오류·축소 모션에서 빈 화면이나 탐색 잠금이 없다.
6. 영상에는 의도하지 않은 텍스트/로고/형태 변형이 없고 루프 이음새가 부자연스럽지 않다.
7. 실제 기기 fps·메모리·로드 크기를 측정한 뒤 품질 단계를 조절한다.
