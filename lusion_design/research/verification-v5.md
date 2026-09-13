# v5 인터랙션·모션 계층 검증

검증일: 2026-09-10 KST. 이번 변경은 lusion.co 공개 CSS/JS의 모션 수치를 추출해 키트 토큰·컴포넌트·런타임으로 옮기고, 이미지·영상 없이 인터랙션만으로 구성한 메인 화면 예제를 추가한 것이다.

## 작업물

- [인터랙션·모션 근거 원장](interaction-evidence.md): 이징 9종, 지속 시간·지연 15항목, 변위 20항목, 동역학 프리셋 7종을 추출/제안 등급으로 기록.
- [키트 1.1.0](../kit/README.md): 모션 토큰 22개 추가(총 71개 CSS 변수), 인터랙션 컴포넌트 16종, `createDynamics`·`ease`·`damp` 런타임, `data-ds-*` 초기화 6종, 레시피 18종(신규 8종).
- [모션 메인 화면](../kit/examples/home.html): 로더 → 헤더 scale 등장 → 단어 등장 제목 → 틸트 오브젝트 → 루프 힌트 → 글자 등장 릴 제목 → 점 확산 CTA → 커서 라벨 → 카드 스태거 → 밑줄·스왑·아이콘 스왑 → 메뉴 패널 → 스크롤 진행 바.
- [ZIP 1.1.0](../downloads/project-design-system-1.1.0.zip), [로컬 npm tarball](../downloads/local-project-design-system-1.1.0.tgz), [패키지 명세](../downloads/project-kit-info.json).

## 검증 근거

브라우저·런타임·패키지 검사 **279개가 통과**했다: 메인 화면 31개, 키트 화면 206개, 런타임 30개, 패키지 소비자 12개. JavaScript 구문 검사 7개 파일 통과, `tokens.json`과 `tokens.css`의 71개 변수 일치.

- [메인 화면 검사](home-motion-v5.json): 로더 100 도달 후 숨김, 단어 분할과 `aria-label`, 로더 뒤 수동 등장, 헤더 stagger 인덱스, 외부 요청 0, 패널 `inert`·`aria-expanded`·포커스 이동, 열기 지연 0/20/40/60ms와 역순 닫기, Escape·배경 클릭 닫기와 포커스 복귀, CTA 점 확산(scale > 10)·라벨 이동·배경 전환, 커서 라벨 활성/축소, 틸트 회전 기록 후 정착 시 inline 값 제거, 오브젝트 클릭 톤 순환, 스크롤 진행 1.0과 idle, 지나친 카드 등장, 뉴스레터 로컬 오류, 320/390/812/1440px 가로 넘침 없음, 감소 모션에서 로더 생략·전부 즉시 표시·커서 숨김·루프 정지, `destroy()` 후 분할 마크업·`aria-label`·`inert` 원복.
- [키트 화면 검사](kit-browser-v4.json): 18개 레시피의 라이트·다크 테마와 4개 폭, 다이얼로그·탭·알림, 복사 코드 정합성.
- [런타임 회귀 검사](kit-runtime-v4.json): 기존 30개 검사 그대로 통과. 마그네틱이 동역학 기반으로 바뀐 뒤에도 pointermove 직후 변수 기록과 감소 모션 초기화가 유지된다.
- [패키지 소비자 검사](kit-package-v4.json): 1.1.0 ZIP을 임시 폴더에서 실행, 바이트 대조, 외부 요청 없음, npm 오프라인 설치, TypeScript 소비자 타입 검사(신규 `createDynamics`, `ease`, `openPanel` 등 포함).

캡처: [히어로](../screenshots/home-motion-hero-v5.png), [메뉴 열림](../screenshots/home-motion-menu-v5.png), [전체](../screenshots/home-motion-full-v5.png), [모바일 390px](../screenshots/home-motion-mobile-v5.png), [감소 모션](../screenshots/home-motion-reduced-v5.png).

## 검수에서 수정한 문제

1. 빠른 스크롤·앵커 이동으로 지나친 `data-ds-reveal` 요소가 숨겨진 채 남았다. IntersectionObserver는 교차 변화만 알리므로, 뷰포트 위로 크게 확장한 두 번째 관찰자로 지나친 요소를 표시하게 했다.
2. `data-ds-reveal="mask"`를 큰 요소에 직접 쓰면 `scrollIntoView`·앵커가 변환 전 위치로 계산됐다. 예제는 `.ds-mask` 래퍼를 쓰고, README에 래퍼 규칙을 적었다.
3. 뉴스레터 폼은 네이티브 검증이 submit을 막아 사용자 정의 오류 문구가 나오지 않았다. `novalidate`와 `checkValidity()` 조합으로 바꿨다.
4. 커서 늘림(rotate·scaleX)을 라벨이 아닌 배경 의사 요소에 적용해 글자가 기울지 않게 했다.
5. 메뉴 패널의 Labs 링크가 히어로 위에 떠 있어 대비가 낮았다. 패널 박스 안으로 옮겼다.

## 남은 한계

- 원본의 WebGL 십자 오브젝트, ScreenPaint, 깊이 맵 카드, 사운드 파형 canvas는 키트 범위 밖이다. 메인 화면은 CSS 도형과 동역학으로 리듬만 재현한다.
- `--ds-stagger-word` 40ms와 `--ds-ease-expo` 근사값은 제안이며 원본 수치가 아니다.
- 검증 환경은 Chromium headless다. Safari·Firefox의 `inert`, `color-mix`, `aspect-ratio` 동작과 실기기 프레임 성능은 별도 확인이 필요하다.
- 폰트는 시스템 스택이다. Aeonik을 쓰는 프로젝트는 `--ds-font-sans`를 덮어쓰고 단어 마스크 높이(`.ds-split__word` padding)를 다시 확인한다.
