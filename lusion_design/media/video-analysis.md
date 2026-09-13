# 영상 프레임 기반 재분석

28개 공개 MP4에서 시간 검증을 거친 84개 프레임을 추출하고 7개 콘택트시트를 직접 검토했다. 실제로 보이는 장면과 예상 구현을 분리한다. 프레임 3장으로 정확한 easing, FPS, 전체 컷 구성, 제작 툴을 확정하지 않는다.

[영상 분석 열람기](../video-analysis.html) · [관측 데이터](../research/video-analysis.json)

## 1. projects/oryzo_ai/main.mp4

- 원본: [projects/oryzo_ai/main.mp4](https://lusion.dev/assets/projects/oryzo_ai/main.mp4)
- 메타데이터: 1250×720, 27.311초.
- **관측:** 코르크 제품 확대, 대형 sustainability 제목, 그립 구조를 설명하는 화면으로 바뀐다.
- **분석 기반 제작 방식:** 제품 메시·카메라·주요 문구를 단일 scroll progress에 연결하고 소재/단면 장면을 분리한다.
- 시스템 연결: depth / masked type. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.37s](../media/video-frames/projects--oryzo_ai--main-1.jpg) · [10.92s](../media/video-frames/projects--oryzo_ai--main-2.jpg) · [21.85s](../media/video-frames/projects--oryzo_ai--main-3.jpg)

## 2. projects/oryzo_ai/launch.mp4

- 원본: [projects/oryzo_ai/launch.mp4](https://lusion.dev/assets/projects/oryzo_ai/launch.mp4)
- 메타데이터: 1280×720, 31.292초.
- **관측:** 검은 공간의 소재 조각, 동심형 분해 구조, 책상 위 컵 장면이 이어진다.
- **분석 기반 제작 방식:** 구조물 배열을 인스턴싱하고 exploded-view 축을 애니메이션한다. 접사 재질은 프리렌더 제작이 적합하다.
- 시스템 연결: 3D cluster. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.57s](../media/video-frames/projects--oryzo_ai--launch-1.jpg) · [12.52s](../media/video-frames/projects--oryzo_ai--launch-2.jpg) · [25.05s](../media/video-frames/projects--oryzo_ai--launch-3.jpg)

## 3. projects/oryzo_ai/bts.mp4

- 원본: [projects/oryzo_ai/bts.mp4](https://lusion.dev/assets/projects/oryzo_ai/bts.mp4)
- 메타데이터: 1280×720, 31.967초.
- **관측:** 제품과 조작 핸들, 펼친 텍스처/형상, 책상 최종 화면이 보인다.
- **분석 기반 제작 방식:** UV/재질 검수 → 오브젝트 변형 → 최종 장면의 제작 단계로 정리한다. 툴 UI 존재만으로 전체 파이프라인을 확정하지 않는다.
- 시스템 연결: material pipeline. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.60s](../media/video-frames/projects--oryzo_ai--bts-1.jpg) · [12.80s](../media/video-frames/projects--oryzo_ai--bts-2.jpg) · [25.59s](../media/video-frames/projects--oryzo_ai--bts-3.jpg)

## 4. projects/atlas_motion/main.mp4

- 원본: [projects/atlas_motion/main.mp4](https://lusion.dev/assets/projects/atlas_motion/main.mp4)
- 메타데이터: 1234×720, 5.400초.
- **관측:** 어두운 그리드 로더에서 조형적인 피사체와 구름 배경의 큰 제목으로 전환한다.
- **분석 기반 제작 방식:** 로더/미디어/제목 3계층에 마스크 전환을 두고 의미 있는 문구를 DOM으로 유지한다.
- 시스템 연결: loader / text. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.28s](../media/video-frames/projects--atlas_motion--main-1.jpg) · [2.17s](../media/video-frames/projects--atlas_motion--main-2.jpg) · [4.34s](../media/video-frames/projects--atlas_motion--main-3.jpg)

## 5. projects/devin_ai/video0.mp4

- 원본: [projects/devin_ai/video0.mp4](https://lusion.dev/assets/projects/devin_ai/video0.mp4)
- 메타데이터: 1280×720, 12.679초.
- **관측:** 어두운 청색 웹 화면, Build with Devin 문구와 기울어진 코드 카드들이 보인다.
- **분석 기반 제작 방식:** 원근 카드·초점·본문 위치를 진행률에 맞추고 UI 텍스트는 HTML 레이어로 유지한다.
- 시스템 연결: depth / box. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.63s](../media/video-frames/projects--devin_ai--video0-1.jpg) · [5.07s](../media/video-frames/projects--devin_ai--video0-2.jpg) · [10.14s](../media/video-frames/projects--devin_ai--video0-3.jpg)

## 6. projects/devin_ai/video2.mp4

- 원본: [projects/devin_ai/video2.mp4](https://lusion.dev/assets/projects/devin_ai/video2.mp4)
- 메타데이터: 1920×1920, 17.633초.
- **관측:** 청록 로더에서 중앙 제품 UI와 주변 카드의 쇼케이스로 전환한다.
- **분석 기반 제작 방식:** 중앙 무대와 주변 카드 배치를 scale/translate로 제어하는 프리렌더 또는 DOM 시퀀스를 사용한다.
- 시스템 연결: page wipe. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.88s](../media/video-frames/projects--devin_ai--video2-1.jpg) · [7.08s](../media/video-frames/projects--devin_ai--video2-2.jpg) · [14.13s](../media/video-frames/projects--devin_ai--video2-3.jpg)

## 7. projects/devin_ai/video3.mp4

- 원본: [projects/devin_ai/video3.mp4](https://lusion.dev/assets/projects/devin_ai/video3.mp4)
- 메타데이터: 1280×720, 6.406초.
- **관측:** 동일한 2개 UI 패널에서 청록 알림·메시지와 상태가 바뀐다.
- **분석 기반 제작 방식:** 순차 상태 머신으로 입력/처리/완료를 표현하고 새 메시지는 aria-live로 알린다.
- 시스템 연결: component states. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.34s](../media/video-frames/projects--devin_ai--video3-1.jpg) · [2.56s](../media/video-frames/projects--devin_ai--video3-2.jpg) · [5.16s](../media/video-frames/projects--devin_ai--video3-3.jpg)

## 8. projects/of_the_oak/video0.mp4

- 원본: [projects/of_the_oak/video0.mp4](https://lusion.dev/assets/projects/of_the_oak/video0.mp4)
- 메타데이터: 1280×720, 11.750초.
- **관측:** 이끼 낀 숲 장면에서 가지/뿌리 구조와 표본 설명 패널로 바뀐다.
- **분석 기반 제작 방식:** 트리 구조에 핫스폿을 배치하고 카메라 초점/정보 패널을 선택 상태로 연결한다.
- 시스템 연결: infographic. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.60s](../media/video-frames/projects--of_the_oak--video0-1.jpg) · [4.71s](../media/video-frames/projects--of_the_oak--video0-2.jpg) · [9.42s](../media/video-frames/projects--of_the_oak--video0-3.jpg)

## 9. projects/everswap/main.mp4

- 원본: [projects/everswap/main.mp4](https://lusion.dev/assets/projects/everswap/main.mp4)
- 메타데이터: 1280×720, 33.550초.
- **관측:** 로고 진입, 산 지형과 빛의 띠, 보랏빛 숲 장면이 이어진다.
- **분석 기반 제작 방식:** 지형 카메라 경로와 ribbon curve를 구성하고 구간별 팔레트를 보간한다.
- 시스템 연결: tunnel / trail. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.68s](../media/video-frames/projects--everswap--main-1.jpg) · [13.43s](../media/video-frames/projects--everswap--main-2.jpg) · [26.85s](../media/video-frames/projects--everswap--main-3.jpg)

## 10. projects/porsche_dream_machine/video1.mp4

- 원본: [projects/porsche_dream_machine/video1.mp4](https://lusion.dev/assets/projects/porsche_dream_machine/video1.mp4)
- 메타데이터: 1280×720, 19.370초.
- **관측:** 건물 전광판, 바깥에서 본 스크린 영상, 분홍 배경의 꽃/조각 군집이 보인다.
- **분석 기반 제작 방식:** 현장 촬영과 원본 CG를 구분한다. CG 장면은 인스턴스/곡선/조각 분포를 렌더하고 촬영본과 편집한다.
- 시스템 연결: particle impact. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.99s](../media/video-frames/projects--porsche_dream_machine--video1-1.jpg) · [7.77s](../media/video-frames/projects--porsche_dream_machine--video1-2.jpg) · [15.50s](../media/video-frames/projects--porsche_dream_machine--video1-3.jpg)

## 11. projects/porsche_dream_machine/video0.mp4

- 원본: [projects/porsche_dream_machine/video0.mp4](https://lusion.dev/assets/projects/porsche_dream_machine/video0.mp4)
- 메타데이터: 1280×720, 21.760초.
- **관측:** 인터뷰 인물, 행사 공간, 관람객이 있는 현장 촬영이다.
- **분석 기반 제작 방식:** 인터뷰/관람 컷 편집에 적합하다. 이 파일에서 독립적인 웹 모션 엔진을 추정하지 않는다.
- 시스템 연결: editorial video. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.10s](../media/video-frames/projects--porsche_dream_machine--video0-1.jpg) · [8.72s](../media/video-frames/projects--porsche_dream_machine--video0-2.jpg) · [17.42s](../media/video-frames/projects--porsche_dream_machine--video0-3.jpg)

## 12. projects/synthetic_human/video0.mp4

- 원본: [projects/synthetic_human/video0.mp4](https://lusion.dev/assets/projects/synthetic_human/video0.mp4)
- 메타데이터: 1280×720, 13.997초.
- **관측:** 얼굴 중심의 빛과 방사형 형상, 반투명 인물 군집, 프로젝트 카드 화면이 보인다.
- **분석 기반 제작 방식:** 인물 실루엣과 반투명 재질, 빛의 발산을 분리한다. 인물과 고품질 굴절은 프리렌더 대안을 둔다.
- 시스템 연결: portal / particles. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.70s](../media/video-frames/projects--synthetic_human--video0-1.jpg) · [5.60s](../media/video-frames/projects--synthetic_human--video0-2.jpg) · [11.22s](../media/video-frames/projects--synthetic_human--video0-3.jpg)

## 13. projects/spatial_fusion/video0.mp4

- 원본: [projects/spatial_fusion/video0.mp4](https://lusion.dev/assets/projects/spatial_fusion/video0.mp4)
- 메타데이터: 1280×721, 10.000초.
- **관측:** 로딩 화면에서 보라색 우주와 큰 입체 글자/곡선이 있는 화면으로 바뀐다.
- **분석 기반 제작 방식:** 환경·입체 타이틀·파티클을 별도 레이어로 만들고 정적 CTA는 DOM 위에 둔다.
- 시스템 연결: tunnel / title. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.51s](../media/video-frames/projects--spatial_fusion--video0-1.jpg) · [4.00s](../media/video-frames/projects--spatial_fusion--video0-2.jpg) · [8.01s](../media/video-frames/projects--spatial_fusion--video0-3.jpg)

## 14. projects/spaace/video0.mp4

- 원본: [projects/spaace/video0.mp4](https://lusion.dev/assets/projects/spaace/video0.mp4)
- 메타데이터: 1146×714, 10.000초.
- **관측:** 주황 링 형태 로고, 단일 원형 오브젝트, 분홍/보라 연결선 구체가 보인다.
- **분석 기반 제작 방식:** 점 위치에서 거리 임계값으로 선을 연결하고 글로우를 적용한다. 로고 변형은 별도 형태 보간 작업이다.
- 시스템 연결: impact / infographic. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.50s](../media/video-frames/projects--spaace--video0-1.jpg) · [4.01s](../media/video-frames/projects--spaace--video0-2.jpg) · [8.00s](../media/video-frames/projects--spaace--video0-3.jpg)

## 15. projects/ddd_2024/video0.mp4

- 원본: [projects/ddd_2024/video0.mp4](https://lusion.dev/assets/projects/ddd_2024/video0.mp4)
- 메타데이터: 1152×720, 8.500초.
- **관측:** 암부 속 D 형상, 밝은 안개 공간의 D, 완성된 이벤트 화면이 이어진다.
- **분석 기반 제작 방식:** 카메라/안개/노출과 타이틀 reveal을 결합한다. 조명 변화와 UI 등장은 독립 제어한다.
- 시스템 연결: loader / text. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.44s](../media/video-frames/projects--ddd_2024--video0-1.jpg) · [3.41s](../media/video-frames/projects--ddd_2024--video0-2.jpg) · [6.82s](../media/video-frames/projects--ddd_2024--video0-3.jpg)

## 16. projects/choo_choo_world/video1.mp4

- 원본: [projects/choo_choo_world/video1.mp4](https://lusion.dev/assets/projects/choo_choo_world/video1.mp4)
- 메타데이터: 1280×720, 8.017초.
- **관측:** 흰 배경에서 색색의 둥근 글자가 조립되어 완성 로고가 된다.
- **분석 기반 제작 방식:** 글자별 offset/delay와 감쇠 운동을 적용하되 스크린리더용 텍스트는 한 번만 노출한다.
- 시스템 연결: masked type. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.42s](../media/video-frames/projects--choo_choo_world--video1-1.jpg) · [3.22s](../media/video-frames/projects--choo_choo_world--video1-2.jpg) · [6.41s](../media/video-frames/projects--choo_choo_world--video1-3.jpg)

## 17. projects/choo_choo_world/video2.mp4

- 원본: [projects/choo_choo_world/video2.mp4](https://lusion.dev/assets/projects/choo_choo_world/video2.mp4)
- 메타데이터: 1280×720, 4.000초.
- **관측:** 2열의 둥근 컬러 아이콘 버튼에서 play/pause 및 일부 기호 방향·상태가 바뀐다.
- **분석 기반 제작 방식:** 버튼 바닥/하이라이트/아이콘을 계층화하고 눌림은 translateY와 그림자 거리로 구현한다.
- 시스템 연결: clay buttons. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.20s](../media/video-frames/projects--choo_choo_world--video2-1.jpg) · [1.61s](../media/video-frames/projects--choo_choo_world--video2-2.jpg) · [3.21s](../media/video-frames/projects--choo_choo_world--video2-3.jpg)

## 18. projects/soda_experience/video0.mp4

- 원본: [projects/soda_experience/video0.mp4](https://lusion.dev/assets/projects/soda_experience/video0.mp4)
- 메타데이터: 1280×720, 10.017초.
- **관측:** 빨강 배경의 모바일 화면 3개가 실제 공간의 오브젝트와 도구 버튼을 보여준다.
- **분석 기반 제작 방식:** 캡처 시연과 AR 런타임을 구분한다. 재현 시스템에는 기기 프레임/툴바 패턴과 명시적 AR 진입 상태를 둔다.
- 시스템 연결: device frame. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.51s](../media/video-frames/projects--soda_experience--video0-1.jpg) · [4.02s](../media/video-frames/projects--soda_experience--video0-2.jpg) · [8.01s](../media/video-frames/projects--soda_experience--video0-3.jpg)

## 19. projects/worldcoin/video0.mp4

- 원본: [projects/worldcoin/video0.mp4](https://lusion.dev/assets/projects/worldcoin/video0.mp4)
- 메타데이터: 1280×720, 20.833초.
- **관측:** 밝은 웹 화면의 큰 지구가 서로 다른 표면 요소/마커를 보여준다.
- **분석 기반 제작 방식:** 구체 또는 투영 좌표에 데이터 마커를 연결하고 본문 라벨은 화면 공간에 배치한다.
- 시스템 연결: infographic. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.05s](../media/video-frames/projects--worldcoin--video0-1.jpg) · [8.33s](../media/video-frames/projects--worldcoin--video0-2.jpg) · [16.67s](../media/video-frames/projects--worldcoin--video0-3.jpg)

## 20. projects/lusion_labs/video0.mp4

- 원본: [projects/lusion_labs/video0.mp4](https://lusion.dev/assets/projects/lusion_labs/video0.mp4)
- 메타데이터: 1281×720, 20.017초.
- **관측:** 흰 공간의 조형적인 L이 점/입자 흐름으로 흩어지는 장면이다.
- **분석 기반 제작 방식:** 원래 표면 점 위치와 흐름 목표 위치를 보간하고 노이즈 이동/감쇠를 추가한다.
- 시스템 연결: particle impact. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.01s](../media/video-frames/projects--lusion_labs--video0-1.jpg) · [8.02s](../media/video-frames/projects--lusion_labs--video0-2.jpg) · [16.01s](../media/video-frames/projects--lusion_labs--video0-3.jpg)

## 21. projects/my_little_story_book/video0.mp4

- 원본: [projects/my_little_story_book/video0.mp4](https://lusion.dev/assets/projects/my_little_story_book/video0.mp4)
- 메타데이터: 1280×720, 20.167초.
- **관측:** 물가·새·초목 장면 위 대화형 문구가 순차적으로 표시된다.
- **분석 기반 제작 방식:** 서사 상태, 카메라 위치, UI 대사를 함께 진행하되 문구/선택 버튼은 DOM으로 유지한다.
- 시스템 연결: state / scene. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[1.01s](../media/video-frames/projects--my_little_story_book--video0-1.jpg) · [8.07s](../media/video-frames/projects--my_little_story_book--video0-2.jpg) · [16.13s](../media/video-frames/projects--my_little_story_book--video0-3.jpg)

## 22. projects/infinite_passerella/video0.mp4

- 원본: [projects/infinite_passerella/video0.mp4](https://lusion.dev/assets/projects/infinite_passerella/video0.mp4)
- 메타데이터: 1282×720, 7.400초.
- **관측:** 검은 반사 공간과 빛 조각 사이에서 색과 의상이 다른 캐릭터가 걸어간다.
- **분석 기반 제작 방식:** 걷기 루프/카메라/배경 스크롤을 분리하고 의상 재질·실루엣을 장면별 변형으로 관리한다.
- 시스템 연결: tunnel. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.37s](../media/video-frames/projects--infinite_passerella--video0-1.jpg) · [2.96s](../media/video-frames/projects--infinite_passerella--video0-2.jpg) · [5.92s](../media/video-frames/projects--infinite_passerella--video0-3.jpg)

## 23. projects/infinite_passerella/video1.mp4

- 원본: [projects/infinite_passerella/video1.mp4](https://lusion.dev/assets/projects/infinite_passerella/video1.mp4)
- 메타데이터: 1308×656, 15.800초.
- **관측:** 그리드 바닥 위 회색 메시와 서로 다른 의상·털/구조가 나란히 보인다.
- **분석 기반 제작 방식:** 리그 움직임에 스킨/천/털 시뮬레이션을 결합하는 제작 검수 방식이 적합하다. 정확한 솔버/툴은 미확인이다.
- 시스템 연결: DCC pipeline. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.80s](../media/video-frames/projects--infinite_passerella--video1-1.jpg) · [6.33s](../media/video-frames/projects--infinite_passerella--video1-2.jpg) · [12.65s](../media/video-frames/projects--infinite_passerella--video1-3.jpg)

## 24. projects/the_turn_of_the_screw/video0.mp4

- 원본: [projects/the_turn_of_the_screw/video0.mp4](https://lusion.dev/assets/projects/the_turn_of_the_screw/video0.mp4)
- 메타데이터: 1419×720, 13.017초.
- **관측:** 어두운 건물 실루엣에서 노랑/주황 빛 인물과 분홍색 숲으로 바뀐다.
- **분석 기반 제작 방식:** 스크롤 구간마다 조명·안개·파티클 팔레트를 보간하고 카메라 경로로 장면을 연결한다.
- 시스템 연결: tunnel / theme. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.66s](../media/video-frames/projects--the_turn_of_the_screw--video0-1.jpg) · [5.22s](../media/video-frames/projects--the_turn_of_the_screw--video0-2.jpg) · [10.41s](../media/video-frames/projects--the_turn_of_the_screw--video0-3.jpg)

## 25. projects/maxmara_bearings_gifts/video0.mp4

- 원본: [projects/maxmara_bearings_gifts/video0.mp4](https://lusion.dev/assets/projects/maxmara_bearings_gifts/video0.mp4)
- 메타데이터: 1280×720, 11.517초.
- **관측:** 베이지/금색 건축 무대에 액자형 제품과 작은 안내 요소가 배치된다.
- **분석 기반 제작 방식:** 모듈형 무대·제품 면·카메라 궤도를 분리하고 베이크 조명 또는 프리렌더를 선택한다.
- 시스템 연결: scene / theme. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.58s](../media/video-frames/projects--maxmara_bearings_gifts--video0-1.jpg) · [4.61s](../media/video-frames/projects--maxmara_bearings_gifts--video0-2.jpg) · [9.21s](../media/video-frames/projects--maxmara_bearings_gifts--video0-3.jpg)

## 26. projects/maxmara_bearings_gifts/video1.mp4

- 원본: [projects/maxmara_bearings_gifts/video1.mp4](https://lusion.dev/assets/projects/maxmara_bearings_gifts/video1.mp4)
- 메타데이터: 1280×720, 11.017초.
- **관측:** 파랑 무대의 액자 콘텐츠가 바뀌고 빨강/분홍 팔레트의 무대로 전환한다.
- **분석 기반 제작 방식:** 제품 선택 상태에 색상 토큰/배경 조명/미디어를 연결하고 전환 중 입력을 잃지 않게 한다.
- 시스템 연결: box theme. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.55s](../media/video-frames/projects--maxmara_bearings_gifts--video1-1.jpg) · [4.42s](../media/video-frames/projects--maxmara_bearings_gifts--video1-2.jpg) · [8.81s](../media/video-frames/projects--maxmara_bearings_gifts--video1-3.jpg)

## 27. textures/reel/desktop.mp4

- 원본: [textures/reel/desktop.mp4](https://lusion.dev/assets/textures/reel/desktop.mp4)
- 메타데이터: 1920×960, 11.517초.
- **관측:** 유기적인 꽃/선 군집, 분홍 굴절 포털, 녹색 미니어처 기차 장면이 보인다.
- **분석 기반 제작 방식:** 각 장면을 별도 제작한 뒤 짧은 릴로 편집한다. 포털은 torus/굴절/조각/깊이; 미니어처는 경로 기반 이동이다.
- 시스템 연결: portal / tunnel. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.58s](../media/video-frames/textures--reel--desktop-1.jpg) · [4.61s](../media/video-frames/textures--reel--desktop-2.jpg) · [9.21s](../media/video-frames/textures--reel--desktop-3.jpg)

## 28. textures/reel/mobile.mp4

- 원본: [textures/reel/mobile.mp4](https://lusion.dev/assets/textures/reel/mobile.mp4)
- 메타데이터: 720×960, 11.517초.
- **관측:** 가로 릴과 같은 순서의 피사체가 세로 화면 안에 좁게 구성된다.
- **분석 기반 제작 방식:** 단순 비율 변환 대신 주요 피사체의 안전영역을 정해 세로용 카메라/크롭을 검수한다.
- 시스템 연결: responsive video. [모션 실험실](../motion-lab.html), [컴포넌트](../components.html).

[0.58s](../media/video-frames/textures--reel--mobile-1.jpg) · [4.62s](../media/video-frames/textures--reel--mobile-2.jpg) · [9.21s](../media/video-frames/textures--reel--mobile-3.jpg)

## 수집/분석 검수

브라우저에서 MP4를 Blob으로 로드해 정확한 시킹을 확보하고 requestVideoFrameCallback 후 캔버스에 기록했다. 목표 시각과 실제 currentTime이 0.25초 이내인지 검사한다. 초기 HTTP 시킹 검사는 원점 프레임을 반환해 폐기했으며 현재 파일들은 수정된 추출기로 모두 덮어썼다. UI 데모는 영상 속 AR/인물/개별 캠페인 전체를 복제한 것이 아니라 재사용 가능한 동작 패턴을 적용한다.

## 재검수에서 추가 확인한 공식 제작 설명

Of The Oak 상세의 `.project-details-item-text`는 **Houdini → WebGL** 파이프라인, 나무·가지·노드 구조의 사용자 정의 웹 포맷과 instancing을 명시한다. 해당 설명의 3.5MB는 그 프로젝트의 압축 데이터에 대한 주장이지 본 패키지 전체 크기가 아니다. [공식 페이지](https://lusion.co/projects/of_the_oak)

Worldcoin 상세의 같은 텍스트 패널은 점 위치의 절차적 생성·실시간 애니메이션, 국가/점 위치 데이터의 압축, 하나의 이미지 파일에서 런타임 디코딩하는 방식을 설명한다. 이번 구현의 원형 지표/노드 예제는 그 데이터 포맷 자체를 복원한 것은 아니다. [공식 페이지](https://lusion.co/projects/worldcoin)

두 패널은 첫 수집의 이미지/영상 레지스트리에서 별도 항목으로 빠져 있었고, 이제 `research/projects.json`의 `text_panels`에 원문을 보존했다. 특정 프로젝트의 공개 방식은 다른 프로젝트나 홈페이지 전체의 원본 제작 방식으로 확대 해석하지 않는다.
