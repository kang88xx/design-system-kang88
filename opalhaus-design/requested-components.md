# 요청 컴포넌트 소스 · CTA / Promotion widget

[직접 조작하기](index.html#requested-components) · [소스 ZIP](requested-components-kit.zip)

사용자가 첨부한 두 화면의 컴포넌트에 대한 추가 추출입니다. 공개 배포 소스와 현재 원본 브라우저 상태를 함께 확인했습니다. CSS/JS는 배포 Framer runtime 없이 사용할 수 있게 구현했습니다.

## 1. View All Blogs

| 항목 | 원본 |
|---|---|
| 크기 | 높이 46px, 실측 너비 약 177.03px |
| 글자 | Inter Tight 600, 16px / 1.2 |
| 배경 | 기본 #FF5D17 → hover #0A0A0A |
| 외형 | radius 50px; 오른쪽 38×38 흰 원, top/right 4px |
| 화살표 | 22×22 mask를 -45° 고정 회전; 내부 20×20 아이콘 2개, gap10 |
| 이동 | flex-end → flex-start, 아이콘 트랙 30px 교차 |
| 문구 | Primary variant는 두 라벨 중 첫 라벨 고정. 다른 link variant의 롤링과 구분 |
| transition | spring, duration .4, bounce .2; 독립 CSS에서는 근사 timing |
| 클릭 | 같은 탭의 `/blog`로 native link 이동; 별도 pressed scale 없음 |

기존 primary-cta 모션 데모의 단일 화살표 회전은 교체했습니다. 원본과 같은 이중 화살표 구조로 동작합니다. 키보드 focus는 hover와 동등한 시각 피드백을 제공합니다.

파일: `design-system/components/blog-cta.html/css/js`, 사용법 `design-system/components/README.md`.

```html
<link rel="stylesheet" href="blog-cta.css">
<div id="blog-cta"></div>
<script src="blog-cta.js"></script>
<script>
  OpalBlogCTA.mount('#blog-cta', { href: '/blog', label: 'View All Blogs' });
</script>
```

## 2. 상단 이미지 슬라이드 배너

| 항목 | 원본 |
|---|---|
| 크기 | 140×60px; 내부 이미지 132×52px |
| 이미지 | 4개의 원본 PNG; object-fit:cover |
| 방향 / 간격 | 위쪽 / 3초 |
| transition | spring stiffness200, damping40, mass1 |
| hover | autoplay 유지; 별도의 확대·정지 없음 |
| 제어 | 원본은 drag·점·화살표 비활성 |
| 클릭 | https://pentaclay.com/ 새 탭 |

원본 raster 이미지에 제목·로고가 이미 포함되어 있습니다. 같은 내용을 HTML로 덧그리지 않습니다. 데모의 재생/다음 제어는 동작을 확인하기 위한 부가 컨트롤이며 원본 배너에 있던 UI가 아닙니다.

## 3. Buy for $59 가격 버튼

| 항목 | 원본 |
|---|---|
| 크기 | 140×36px / radius10 |
| 폰트 | Inter 600 / 14px / 자간 -0.05em |
| 기본 | #0A0A0A 배경, Buy for $59, 17px 흰 원, 11px 번개 |
| hover | 붉은 #DD453D 확장; 원 크기 279px, right -113px; 번개16px/white |
| 문구 전환 | 기본 문구가 아래 top39로, Grab Now가 위 top-16에서 진입 |
| transition | spring duration .4, bounce .25; CSS 독립 구현은 근사 |
| 클릭 | 원본 템플릿 checkout URL 새 탭; 별도 pressed scale 없음 |

원본 링크: https://pentaclay-framer.blink.store/opalhaus-design-agency-marketing-template

독립 위젯: `design-system/components/promo-widget.html/css/js`, 사용법 `promo-widget.md`. 슬라이드 배열·링크·배율·고정 위치를 설정할 수 있습니다. 기본 소스 크기 140px이며 카탈로그는 첨부 화면처럼 2배로 보여줍니다.

## 검증과 원본 출처

- CTA 기본/hover/pressed DOM 실측과 스크린샷: `evidence/requested-components/cta-*`.
- 가격 버튼 기본/hover/pressed: `evidence/requested-components/price-*`.
- 배너: 800ms 간격의 상태16개, 일반 상태와 hover 중 재생 관찰, `promo-runtime.json`.
- 클릭: CTA 원본 `/blog` 이동 완료. 배너와 가격 버튼은 새 탭의 목적지 요청을 로컬 응답으로 가로채 확인했습니다. 외부 구매·결제 동작은 수행하지 않았습니다.
- 모션 수치: `motion-data.json`의 `primary-cta`, `promo-data.json`에 source file / offset / excerpt 연결.

데모에서 클릭하면 외부 이동 대신 목적지를 표시합니다. 적용용 컴포넌트는 preview/demo를 끄면 실제 native link 동작을 사용합니다. OS와 전역 reduced-motion 설정은 자동 움직임을 멈춥니다. 원본 런타임 spring을 픽셀/프레임 단위로 완전히 동일하게 복제했다는 의미는 아닙니다.
