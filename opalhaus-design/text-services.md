# 글자 노출 효과와 서비스 목록

[직접 재생·조작](index.html#text-services) · [이 영역 소스 ZIP](text-services-kit.zip)

이번 세 이미지의 효과를 각각 원본 소스와 실제 화면에서 확인했습니다. 두 제목을 같은 텍스트 효과로 처리하지 않습니다.

## 1. 히어로 글자 노출

대상: **Opalhaus® / Visual Collective**.

- character 단위 등장. 초기 blur10px, opacity0.001, y10px → blur0 / opacity1 / y0.
- 시작 지연0.1초, 문자 간0.05초, 원본 transition spring duration0.4 / bounce0.
- Inter Tight600. 데스크톱150px, 태블릿106px, 모바일70px, 줄높이1.1, 자간−0.04em.
- 문자 span은 시각적 모션용이며, 보조기술에는 분절되지 않은 전체 문장을 제공합니다.
- 실제 이미지와 검정 그라디언트를 사용합니다. 제목의 두 줄과 줄 단위 실행 관계를 메타데이터에 남겼습니다.

원본 위치: 홈페이지 배포 모듈 `56d9…mjs`의 `Rt` / `.framer-n2b5a6`. 정확한 출처 문자열은 `reveal-data.json`에 기록했습니다.

## 2. 서비스 제목 노출

대상: **SERVICE / Timeless design to solutions**.

이 영역은 글자별 blur 효과가 아닙니다. 라벨과 제목을 담은 그룹이 **y150px / opacity0 → y0 / opacity1**로 올라옵니다.

- spring stiffness400, damping100, mass1.
- 원본 viewport threshold0.5, 1회 등장.
- 모바일 variant에서는 원본 appear 효과가 비활성화됩니다. 재사용 코드도 해당 차이를 구분합니다.
- 재생 버튼은 원본 페이지에는 없는 비교용 도구입니다.

원본: `.framer-vqwa91` wrapper / `.framer-cceyx3` heading. 단순히 제목에 임의의 글자별 stagger를 추가하지 않습니다.

## 3. 어두운 서비스 목록과 오른쪽 이미지

네 항목: Brand Strategy / Visual Identity / Content System / Website Design.

- 기본 글자 opacity0.44 → hover1.
- 원형 배경 white → #FF5D17, 화살표 −45° 회전과 흰 아이콘.
- 하단 강조선0 →100%.
- 오른쪽 이미지는 해당 항목으로 위쪽 슬라이드 전환. 마지막 호버한 이미지가 유지됩니다.
- 원본 이미지 이동 단위248px, parent spring duration0.4 / bounce0.2.
- 행 자체 spring stiffness400 / damping65 / mass1.
- 원본의 태블릿·모바일 구간에서는 오른쪽 미디어가 숨겨지고 모바일 행 구성이 사용됩니다.
- 키보드 포커스에서도 같은 항목 피드백을 사용할 수 있게 보완했습니다.

## 4. What we do 목록

작은 서비스 목록은 별도의 텍스트 롤링 컴포넌트입니다. 이름과 오른쪽 번호가 함께 위로 넘어갑니다.

- 행 폭250px, 높이46px 실측.
- 텍스트 마스크26px, 두 텍스트의 간격10px → 이동36px.
- transition spring duration0.4 / bounce0.2를 이식용 코드에서 근사합니다.
- 이름·번호의 복제 텍스트는 화면 읽기에서 중복하지 않습니다.
- 각각 `/services/brand-strategy`, `/services/visual-identity`, `/services/content-systems`, `/services/website-design`으로 이동합니다. 카탈로그에서는 클릭 목적지만 표시합니다.

## 재사용 파일

- `design-system/components/text-reveal.{html,css,js,md}`: 글자/그룹 등장.
- `design-system/components/service-list.{html,css,js,md}`: 서비스 목록·이미지 전환과 What we do 링크.
- `reveal-library.js/css`, `services-library.js/css`: 카탈로그의 조작·코드 보기 UI.
- `reveal-data.json`, `services-data.json`: 원본 수치·파일·offset·차이점.
- `evidence/text-services/`: 사용자 참조, 실제 사이트 등장/hover 캡처, 상태별 DOM.

원본 Framer runtime을 임베드한 것이 아니라 독립적으로 실행되는 코드입니다. CSS spring 근사나 데모 크기 조절은 메타데이터에서 구분합니다. OS의 reduced-motion과 카탈로그 상단 모션 감소 토글은 텍스트를 숨겨두지 않고 최종 상태로 표시합니다.
