# Motion research

수집 범위: 홈 · 리틱인더스트리(about) · 포트폴리오 · 작업 의뢰(contact) 4개 페이지, 데스크톱 1440×900과 모바일 390×844(Wix 캔버스 320). 저장된 HTML의 인라인 CSS(`@keyframes`, `animation:` 선언, `--motion-*` 변수)와 렌더링 후 계산 스타일(`animationName/Duration/Delay/TimingFunction`)을 함께 읽었다. 이는 문서화된 유한 범위이며 Wix 런타임 내부의 모든 상태를 열거했다는 주장이 아니다.

## Evidence boundaries

- `evidence/source/static-extraction.json` → `pages.*.keyframes`, `animations`, `transitions`, `motionVars`, `motionEnter`: 선언 인벤토리. 선언이 있다고 해서 별개의 시각 효과가 검증된 것은 아니다.
- `evidence/source/computed-styles.json` → `*.anim`: `data-motion-enter="done"` 요소의 계산된 애니메이션 값. Wix는 진입 애니메이션을 `paused`로 선언하고 뷰포트 진입 시 `running`으로 바꾼다.
- `evidence/source/component-measurements.json`: 갤러리 컨테이너 transition, 셰브론 SVG transform 등 컴포넌트 단위 값.
- 스크롤 효과(`BackgroundParallax`, `BackgroundReveal`, `BackgroundParallaxZoom`)는 Wix 번들에 문자열로 존재하지만 어떤 섹션에도 `data-bg-effect-name`이 설정되지 않았다. **활성화되지 않음**으로 기록한다.

## Observed entrances (count = 선언 수, 4페이지 합산)

| 이름 | 수 | duration | delay | easing | 파라미터 | 위치 |
|---|---|---|---|---|---|---|
| motion-floatIn | 27 | 1200 (600) | 1 | cubic-bezier(.445,.05,.55,.95) | translate 60px up/left/right, 100vh 변형 | about 11, contact 13, home 1 |
| motion-fadeIn | 13 | 1200 / 900 / 700 / 650 | 1 / 700 | sine in-out 또는 (.25,.46,.45,.94) | — | 포트폴리오 4, about 5, contact 1 + fold 동반 |
| motion-foldIn | 8 | 1200 / 700 / 650 | 1 / 700 / 1400 | cubic-bezier(.175,.885,.32,1.275) | perspective 800, rotateX -90 origin(0%,-50%); rotateY 90 origin(-50%,0%) | 홈 히어로 3, about 3, contact 2 |
| motion-blurIn | 2 | 2000 / 1900 | 1 / 3000 | linear (+fadeIn 1400/1330 sine-in) | blur 6px / 25px | 홈 힌트, contact 히어로 |
| motion-glideIn | 5 | 1200 | 1 / 500 | cubic-bezier(.645,.045,.355,1) | translate ±60px, 100vw 변형 | about 2, contact 3 |
| motion-revealIn | 2 | 1200 | 1 | cubic-bezier(.645,.045,.355,1) | clip-path 위→아래 | about 세로선 |

키프레임 본문은 `app/src/system/motion.css`에 동일 의미로 재작성했다(변수명 `--motion-*` → `--rt-motion-*`).

## Observed transitions

| 대상 | 값 | 출처 |
|---|---|---|
| 내비 텍스트 | `color .4s ease 0s` (`--trans`) | 메뉴 컴포넌트 변수 |
| 갤러리 컨테이너 | `transform 0.8s cubic-bezier(0.13, 0.78, 0.53, 0.92)` | Pro Gallery item-container 계산값 |
| 갤러리 미디어 | `transform .4s cubic-bezier(0.3,0.13,0.12,1), filter .5s ease, opacity .5s ease` | 인라인 CSS |
| 갤러리 오버레이 | `opacity .4s ease` / `opacity .2s ease` | 인라인 CSS |
| 갤러리 로딩 | `@keyframes changing_background` rgba(241,241,241,.2→.8→.2) | 인라인 CSS |
| 슬라이더 | `transform var(--transition-duration) cubic-bezier(.87,0,.13,1)` / `opacity … cubic-bezier(.37,0,.63,1)` | 인라인 CSS |
| 제출 버튼 | `background-color .5s` | 인라인 CSS |
| 보조 버튼 | `all .2s ease-in` | 인라인 CSS |
| 페이지 전환 | out-in `.35s cubic-bezier(.22,1,.36,1)` → `.35s cubic-bezier(.64,0,.78,0) .35s`; slide `.6s cubic-bezier(.83,0,.17,1)` | Wix 전역 keyframes |
| 스피너 | `Spinner…__rotate 2s linear infinite`, `__dash 1.5s ease-in-out infinite` | contact 제출 스피너 |

## Hover states (captured)

- 내비: 글자 `#000` → `#f3f3f3`(`evidence/source/screenshots/hover-home-nav.png`).
- CTA 필: `#eea302` → `#f3f3f3`, 라벨 검정 유지 (`hover-home-button.png`).
- 보조 버튼(about): `#282626` → `#f3f3f3` + `1px solid #000` (`hover-about-button.png`).
- 제출(contact): `#000` → `rgba(243,243,243,.29)`, 테두리 `#f3f3f3` → `#eea302` (`hover-contact-button.png`).

## Background media

7개 `video`(autoplay/muted/loop, `object-fit: cover`): 홈 6(1920×800, 2000×1000 ×2, 1920×1080 ×3), contact 1(1920×1080, `position: fixed`). about 히어로는 GIF. 원본 720p mp4는 `app/public/media/`에 있고 1080p/480p/360p는 원본 서버에만 있다.

## Regeneration

```bash
node scripts/capture-source.mjs       # HTML · 스크린샷 · 계산 스타일
node scripts/extract-static.mjs       # 선언 인벤토리
node scripts/measure-components.mjs   # 컴포넌트 치수 · 갤러리 transition
node scripts/download-assets.mjs      # 이미지 · 영상 · 폰트
```

로컬 재생은 `app/index.html#motion`(각 프리셋 replay, Reduce motion 토글)과 재구성 페이지(스크롤 진입 시 재생)에서 확인한다. 스튜디오 재생은 관찰값 기반 도식 재생이며 원본 장면의 픽셀 재현이 아니다.
