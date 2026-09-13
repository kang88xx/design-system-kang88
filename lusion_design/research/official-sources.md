# Lusion 공개 공식 출처 조사

조사일: 2026-09-06 (KST)  
범위: `lusion.co` 및 Lusion Ltd가 공개한 실험·GitHub 자료. 실제 사이트의 네트워크 캡처, 원본 파일 다운로드, 비공개 코드/제작물 접근은 포함하지 않는다.

## 결론: 디자인 시스템에 반영할 수 있는 공개 사실

| 영역 | 공개적으로 관측·명시된 사실 | 시스템 적용 시 해석 |
| --- | --- | --- |
| 스튜디오 표현 | Lusion은 디자인·모션·3D·개발을 결합한 “3D visual storytelling and interactive web experiences”를 표방하고, 프로젝트를 `web`, `design`, `development`, `3d`, `animation` 등의 태그로 제시한다. | 브랜드/케이스 스터디의 기본 단위는 정적 페이지가 아니라 **서사 장면 + 인터랙션 + 3D/모션 미디어**다. |
| 실시간 3D | 공식 프로젝트와 Labs는 WebGL을 명시한다. `Spatial Fusion`은 WebGL/WebXR을, `Hair Simulation`은 WebGL 및 그래픽 기능 요구사항을 명시한다. | 실시간 장면은 WebGL 지원 여부와 저사양·모바일 대체 화면을 시스템의 필수 상태로 둔다. |
| 스크롤-장면 결합 | 공식 공개 데모는 여러 DOM 요소와 하나의 WebGL 캔버스를 동기화하는 방법을 문서화한다. | 화면 구성 요소의 위치를 3D 장면과 동기화하는 `scene anchor` 규칙으로 구현할 수 있다. 다만 이는 홈페이지의 원본 구현을 증명하지 않는다. |
| 성능 선택 | Max Mara 사례는 기기 간 일관성과 최적화를 위해 **비실시간 조명**을 선택했다고 설명한다. | 모든 시각효과를 실시간 렌더링하지 않는다. 장면별로 프리렌더 영상/이미지, 베이크드 조명 3D, 실시간 WebGL을 구분하는 미디어 티어가 필요하다. |
| 자산 출처 | Hair Simulation은 댄서 모델·애니메이션을 Mixamo에서, 다른 모델을 Sketchfab 제작자에게서 가져왔다고 표시한다. | 외부 3D 자산은 출처·라이선스·크레딧 필드를 가진 자산 레지스트리로 관리해야 한다. |

## 공식 증거

### 1. 사이트의 서비스 언어와 콘텐츠 분류

- 출처: [Lusion 홈페이지](https://lusion.co/)
- **관측:** 홈페이지는 “3D visual storytelling and interactive web experiences”를 만들며, 디자인·모션·3D·개발을 결합한다고 설명한다. Featured Work에는 `concept`, `web`, `design`, `development`, `3d`, `animation`, `mograph`, `video`, `AR` 등의 분류가 표시된다.
- **적용 가능한 규칙:** 각 작업 카드는 최소한 `매체 유형`, `상호작용 여부`, `3D 여부`, `모션/영상 여부`, `기술 방식`, `크레딧` 메타데이터를 가져야 한다.
- **추정 금지:** 이 페이지는 컴포넌트 토큰, 폰트, 색상 값, 에셋 제작 툴, 홈페이지의 라이브러리·셰이더를 공개하지 않는다. 따라서 이를 원본 디자인 토큰이나 기술 스택으로 확정할 수 없다.

### 2. DOM과 WebGL 한 캔버스의 스크롤 동기화

- 출처: [Lusion Ltd / WebGL-Scroll-Sync 공식 README](https://github.com/lusionltd/WebGL-Scroll-Sync)
- **관측:** Lusion은 공개 데모에서 다수의 DOM 요소에 WebGL 시각물을 연결하는 단일 캔버스 방식을 설명한다. `requestAnimationFrame`과 네이티브 스크롤의 비동기로 발생하는 드리프트 문제, viewport에 고정한 full-screen 캔버스 방식, 그리고 캔버스를 `absolute`로 페이지와 함께 스크롤시키고 매 프레임 오프셋하는 대안을 명시한다. 캔버스 클리핑은 상·하 여백 렌더링 또는 full-screen framebuffer와 edge blending/fading으로 완화할 수 있다고 설명한다.
- **적용 가능한 규칙:** `DOM 기준점 → 화면 좌표 → 장면 오브젝트`의 좌표 변환을 장면 시스템의 계약으로 둔다. 한 화면에 컨텍스트를 다수 생성하지 않고, 필요할 때 단일 장면 캔버스와 DOM 오버레이를 사용한다.
- **공개 라이선스:** 해당 **데모 저장소**는 MIT로 명시된다. 이는 데모 코드의 라이선스이며, `lusion.co` 본 사이트 코드·브랜드·미디어의 사용 허가가 아니다.
- **추정 금지:** README는 본 사이트가 이 데모와 동일한 코드 또는 canvas 배치 방식을 쓴다고 말하지 않는다. 홈페이지의 소스 대체물로 취급하지 않는다.

### 3. Labs의 WebGL 실험과 호환성 대체 상태

- 출처: [Surface Floater — Lusion Labs](https://surface-floater.lusion.co/)
- **관측:** Lusion은 이를 creative coding workflow를 보이기 위한 WebGL artwork라고 명시한다. 호환되지 않는 기기에는 Vimeo 렌더링을 보도록 안내한다.
- **적용 가능한 규칙:** 실시간 장면은 `WebGL 사용 가능`, `호환 불가`, `정적 포스터/외부 영상 대체`의 세 상태를 정의한다. 실패 상태도 브랜드된 로딩·안내 UI로 설계한다.
- **추정 금지:** 이 출처는 사용한 3D 툴, 렌더러, 시뮬레이션 알고리즘, 영상 제작 프롬프트를 공개하지 않는다.

### 4. Hair Simulation의 3D/모션 자산 크레딧과 기능 요구

- 출처: [Hair Simulation — Lusion Labs](https://hair-simulation.lusion.co/)
- **관측:** 페이지는 WebGL 실험임을 밝히고, 댄서 모델·애니메이션의 출처를 Mixamo로, 다른 모델을 Sketchfab의 명시된 제작자로 표기한다. 모바일 비대상, 적절한 그래픽 카드 필요, WebGL 및 `OES_texture_float`, vertex shader texture sampling, `WEBGL_draw_buffers` 요구 메시지를 노출한다.
- **적용 가능한 규칙:** 3D/모션 에셋 기록에 `asset source`, `author`, `license/permission`, `animation source`, `device capability`, `fallback` 필드를 둔다. GPU 기능 검사는 장면 진입 전이나 초기 로딩 단계에 수행한다.
- **추정 금지:** 페이지는 해당 자산의 재사용 권리나 Lusion 홈페이지의 공통 파이프라인을 제공하지 않는다. 외부 자산은 각각의 원 출처 라이선스를 별도로 확인해야 한다.

### 5. 성능을 위한 비실시간 조명 선택

- 출처: [Max Mara: Bearing Gifts — Lusion 프로젝트 설명](https://lusion.co/projects/maxmara_bearings_gifts/)
- **관측:** Lusion은 기기 전반의 일관된 경험과 성능 최적화를 위해 non-real-time lighting을 사용했으며, 3D 모델링 벤더와 협업해 자산을 통합했다고 설명한다. 서비스 항목은 WebGL로 표시된다.
- **적용 가능한 규칙:** 미디어 파이프라인의 기본 선택지는 (1) 프리렌더 영상, (2) 베이크드/비실시간 조명 3D, (3) 실시간 상호작용 WebGL로 나눈다. 기획 단계에서 장면마다 품질·일정·예산·기기 목표를 함께 결정한다.
- **추정 금지:** 베이크 방법, 포맷, 텍스처 해상도, 렌더링 엔진, 모델 공급업체 계약은 공개되지 않았다.

## 이미지·영상·모션 프롬프트에 관한 판정

공개된 위 공식 자료에는 생성형 이미지/영상 모델명, 프롬프트 원문, 시드, LoRA/스타일 참조, 편집 타임라인, 3D 씬 파일, 원본 영상, 오디오 소스, 에셋 라이선스 계약이 없다. 따라서 **Lusion의 실제 프롬프트 또는 비공개 제작 방식을 수집·재현했다고 주장할 수 없다.**

디자인 시스템에는 원본 프롬프트 대신 재사용 가능한 브리프 필드를 둔다. 예: `narrative intent`, `art direction`, `camera/motion intent`, `interaction trigger`, `render tier`, `asset provenance`, `license`, `fallback`, `accessibility motion setting`. 이 필드는 위 공개 사실을 바탕으로 한 **새 설계 제안**이며 Lusion의 내부 템플릿이라는 증거는 없다.

## 사용 경계

- 공개 README의 MIT 범위는 `WebGL-Scroll-Sync` 데모 코드다. Lusion 사이트의 상표, 카피, 이미지, 영상, 3D 모델, 음원, 프로젝트 산출물에는 자동으로 적용되지 않는다.
- 본 문서는 공개 설명을 바탕으로 한 기술·운영 원칙만 제공한다. 브랜드 식별 자산이나 원본 프로젝트 미디어의 복제·재배포 근거가 아니다.
