# Family motion evidence

이 문서는 `references/family-recording.mp4`에서 관찰한 모션/인터랙션과 `references/live-styles.css` / DOM 샘플에서 확인한 CSS 모션 증거를 함께 정리한다. 영상은 46.85초, 60fps, 1080x676이며, 스크롤 녹화이기 때문에 스크롤 움직임과 컴포넌트 자체 애니메이션을 분리해서 기록했다.

## Evidence files

- 전체 영상: `references/family-recording.mp4`
- 2초 간격 전체 프레임: `references/contact-sheet.png`, `references/frames/frame-001.png` - `frame-023.png`
- 정밀 추출:
  - `references/motion-hero/` 0.0-4.0s, 5fps, 20 frames
  - `references/motion-nav/` 0.8-3.0s, 10fps, 22 frames
  - `references/motion-nft/` 13.2-17.7s, 5fps, 23 frames
  - `references/motion-details/` 32.0-38.0s, 4fps, 24 frames
  - `references/motion-faq/` 43.0-45.8s, 10fps, 28 frames
- 정밀 시트:
  - `references/motion-hero-sheet.png`
  - `references/motion-nav-sheet.png`
  - `references/motion-nft-sheet.png`
  - `references/motion-details-sheet.png`
  - `references/motion-faq-sheet.png`
- 보조 DOM 증거:
  - `references/live-report.md`
  - `references/live-interactions.json`
  - `references/live-desktop.json`
  - `references/live-mobile.json`
  - `references/live-styles.css`

## Motion principles

Family의 모션은 "빠른 조작 피드백 + 느린 testimonial rail + 앱 데모 내부의 상태 변화"로 나뉜다. 페이지 섹션은 과한 스크롤 리빌을 쓰지 않고, 대부분 정적인 레이아웃이 스크롤로 드러난다. 대신 손그림 장식과 폰/카드 데모가 제품의 친근함과 조작감을 만든다.

모션 톤은 부드러운 금융 앱보다 더 장난스럽지만, 트랜잭션/보안 정보 영역에서는 과도하게 튀지 않는다. 버튼, 내비, FAQ는 짧고 즉각적이며, 제품 데모 영상은 카드가 밀리고, 상태가 바뀌고, 체크/배지/진행바가 등장하는 식으로 설명성을 담당한다.

## Observed timeline

| Time | Area | Observed motion |
| --- | --- | --- |
| 0.0-1.0s | Hero load | 로고/내비와 H1이 낮은 opacity에서 올라오고, H1 단어가 순차적으로 드러난다. 손그림 도형은 화면 바깥/주변에서 중심 주변으로 흩어져 들어온다. 추출 프레임 기준 약 0.6-1.0초 안에 안정 상태가 된다. |
| 1.0-2.0s | Hero / first scroll | 첫 섹션 하단의 "Explore and experience..." 제목이 스크롤로 드러난다. 별도 섹션 fade-up보다는 화면 녹화의 스크롤 이동 영향이 크다. |
| 2.1-2.2s | Desktop nav dropdown | `Developers` hover 후 링크 배경이 밝은 warm neutral로 바뀌고 화살표가 up 상태가 된다. 드롭다운 패널은 약 0.1초 내에 opacity 0 -> 1, scale 0.96 -> 1로 열린다. |
| 2.2-2.9s | Desktop nav dropdown | 패널은 8px radius, 0 3px 16px rgba(0,0,0,.1) shadow로 유지된다. 항목 hover는 row background와 text color 변화를 사용한다. |
| 4.0-7.5s | Explore grid | 5개 feature card가 스크롤로 지나간다: `Easy` tall card와 `Secure`, `Fast`, `Powerful`, `Fun`. 카드 자체 리빌 모션은 보이지 않고, 내부 데모 상태가 바뀐다. `Powerful` 카드의 urgency pill은 `Urgent ~15 Secs`에서 `Normal ~60 Secs`로 상태가 바뀐다. |
| 8.0-12.0s | Send / Receive / Swap | 3개 폰 목업 MP4가 나란히 보인다. 화면 녹화상 세 폰 내부 데모가 계속 재생되며, 외부 page card hover/entrance는 관찰되지 않는다. |
| 13.2-17.7s | NFT demo | NFT 폰 내부에서 미디어 진행바가 이동하고, 원형 white control/favorite affordance가 나타난다. 약 0.4초 안에 원형 컨트롤이 완전하게 보이며, star icon 상태가 강조된다. |
| 18.0-24.0s | Watch / Activity / Security | 섹션이 좌우 split 구성으로 이어진다. 폰 내부 list/activity 상태가 바뀌고 보안 일러스트가 정적으로 노출된다. 스크롤 리빌은 강하지 않다. |
| 26.0-30.0s | Onboarding / Mission Control / Drag and Drop | 3개 폰 데모가 보이며 onboarding card, wallet grid, drag/drop 완료 상태가 각각 재생된다. 중앙/우측 데모는 앱 내부 UI의 상태 변화가 핵심이다. |
| 32.0-38.0s | Details that matter | 작은 카드 데모가 순환한다. transaction status card, 보호 배지 pair, asset list card, wallet grouping card가 차례로 나타난다. 카드 전환은 내부 데모 영상/asset sequence로 보이며 page layout 자체는 고정된다. |
| 40.0-42.0s | Friends of Family | testimonial card rail이 보인다. CSS에서 `.Qwkbu` / `Testimonials__RowContainer-sc-1rcs3hw-1`가 `hdKGda 120s linear infinite`를 사용한다. 영상에서는 카드 hover 스케일이나 shadow 변화가 뚜렷하지 않고, pointer/link 상태만 확인된다. |
| 43.6-44.0s | FAQ accordion | 첫 FAQ 항목 클릭 후 답변 영역이 열린다. 먼저 항목 아래 공간이 생기고, 답변 텍스트가 낮은 opacity에서 정상 대비로 올라온다. `+`는 red `-` 상태로 바뀐다. 추출 프레임 기준 약 0.3초. |
| 44.0-46.8s | Footer CTA | `Explore Family` CTA와 히어로와 같은 손그림 도형 배경이 다시 등장한다. footer 도형도 장기 루프/장식 계열로 보는 것이 안전하다. |

## Component motion inventory

### Hero intro

- Trigger: initial page load.
- Observed: H1 and brand/navigation fade in. H1 appears in staged word/line reveal; decorations populate around the composition from sparse to full.
- Estimated duration: 0.6-1.0s from first visible text to stable composition in `motion-hero/`.
- Recommended system pattern: `hero-intro` = staggered opacity + slight transform/mask reveal, 80-120ms item stagger, total under 1000ms.
- Limitation: exact easing is not inferable from the recording alone.

### Hero decorative motion

- Trigger: ambient page presence.
- Observed: the hero/footer decorative shapes appear during intro and while scrolling, but the short recording does not show enough same-scroll-position time to measure a loop period accurately.
- CSS correction: `hdKGda 120s linear infinite` is not the hero/footer decoration loop. In `references/live-styles.css`, `.Qwkbu` maps to `data-styled.g492[id="Testimonials__RowContainer-sc-1rcs3hw-1"]`, so that 120s animation belongs to the testimonial rail.
- Recommended system pattern: `hero-decor-enter` = intro scatter/fade under 1000ms; any ongoing hero/footer decorative loop should be treated as period unknown unless directly captured from the relevant CSS selector.
- Reduced motion: disable or freeze decorative loop.

### Header and sticky behavior

- Observed: the header remains visible at the top throughout the page recording.
- DOM evidence: top wrapper has `position: sticky`; sampled `header`/`nav` nodes do not show hide/reveal transform mutation during the scroll probe.
- Recommended system pattern: sticky topbar should not animate on scroll unless explicitly needed; keep position stable to preserve orientation.

### Desktop navigation dropdown

- Trigger: hover on `Developers` and likely same pattern for `Resources`.
- DOM evidence:
  - Nav link transition: `background 0.2s, color 0.2s`
  - Dropdown transition: `opacity 0.1s, transform 0.1s`
  - Closed state transform: scale around `0.96`
  - Panel: 303x130px for Developers, 8px radius, `0 3px 16px rgba(0,0,0,.1)`
- Observed timing: hover begins around 2.1s, dropdown visible by 2.2s in `motion-nav/`.
- Recommended system pattern:
  - `nav-hover`: 200ms ease-out color/background.
  - `dropdown-enter`: 100ms opacity + scale 0.96 -> 1.
  - `dropdown-exit`: 80-100ms opacity + scale down.
  - Arrow icon rotates or swaps to up state in sync with dropdown.

### Buttons and links

- DOM evidence:
  - Primary/secondary rounded CTA buttons use `background-color 0.1s`.
  - Header links and menu items use `0.2s ease-out`.
- Observed: no large movement on button states in the recording; the effect is primarily color/background.
- Recommended system pattern:
  - `button-feedback`: 100ms color/background, optional 1px visual compression only if implemented consistently.
  - `link-row-hover`: 200ms ease-out background, text color, and icon color.

### Feature cards and product demos

- Observed: page feature cards do not visibly animate in as sections enter. The perceived motion comes from embedded MP4 demos and small UI state loops.
- DOM evidence from `live-report.md`: many cards/icons use `transform 0.22s cubic-bezier(.19,1,.22,1)` or `transform 1s cubic-bezier(.19,1,.22,1)`.
- Recommended system pattern:
  - `card-lift`: 220ms `cubic-bezier(.19,1,.22,1)` for subtle hover transform.
  - `demo-state`: 700-1200ms internal sequence for explaining a state change, not for critical controls.
  - `demo-loop`: keep loop quiet; avoid repeating high-amplitude motion in data-heavy sections.

### Phone demo modules

- Observed modules:
  - `send.mp4`, `receive.mp4`, `swap.mp4`
  - `nft.mp4`, `watch.mp4`, `activity.mp4`
  - `onboarding.mp4`, `missioncontrol.mp4`, `dragdropdone.mp4`
- DOM evidence from `live-report.md`: 9 muted control-less MP4 demos. NFT, Watch, Activity loop; first three and last three are non-looping.
- Recommended system pattern:
  - Phone demos are media-driven, not recreated as CSS component animation unless exact product states are needed.
  - Use poster/first frame fallback.
  - Pause or replace with static frame under reduced motion.

### NFT media affordance

- Trigger: demo playback or internal simulated interaction.
- Observed: a circular white affordance appears near the lower-right of the media card; star/favorite state becomes visible; the media progress bar continues moving.
- Estimated duration: visible affordance expansion/fade is roughly 0.3-0.5s in `motion-nft/`.
- Recommended system pattern:
  - `media-control-enter`: 300-500ms opacity + scale, with soft shadow.
  - `status-highlight`: icon color fill change under 200ms.

### Details micro cards

- Trigger: section demo sequence.
- Observed: compact cards cycle through transaction progress, protection badges, wallet organization, and grouping examples.
- Estimated cadence: each demo state stays visible for roughly 1.5-2.0s in the recording, but scroll motion prevents exact loop measurement.
- Recommended system pattern:
  - `status-card-swap`: 220-300ms crossfade/translate for small cards.
  - `badge-pulse`: avoid constant pulsing; use a single settle motion after state change.

### Testimonial rail

- Trigger: ambient page presence in `Friends of Family`.
- CSS evidence from `references/live-styles.css`: `.Qwkbu` uses `animation: hdKGda 120s linear infinite`; `.Qwkbu` maps to `Testimonials__RowContainer-sc-1rcs3hw-1`; `hdKGda` translates X from `0%` to `-50%`.
- Observed: the recording shows the testimonial card rail around 40.0-42.0s. The rail's full 120s cycle cannot be visually measured from the short visible segment, but the CSS mapping is exact.
- Recommended system pattern: `testimonial-rail-loop` = 120s linear infinite horizontal translate for duplicated testimonial rows only.
- Reduced motion: stop horizontal rail movement and show a static multi-row grid/rail.

### FAQ accordion

- Trigger: click on first FAQ row.
- Observed: first answer opens around 43.8-44.0s. Answer text starts faint at `motion-faq/t0009.png` and is readable by `t0010.png`.
- Estimated duration: about 300ms including content fade and space expansion.
- Recommended system pattern:
  - `accordion-open`: 250-300ms height/grid expansion + opacity.
  - Icon change: `+` to `-` in red, synchronized with open state.
  - Keep row divider stable; only the answer area expands.

## Motion tokens to carry into the design system

| Token | Value | Use |
| --- | --- | --- |
| `--motion-instant` | 100ms | Button background, dropdown panel enter/exit, small color feedback. |
| `--motion-fast` | 200ms | Nav/link hover, row hover, icon color, secondary affordances. |
| `--motion-pop` | 220ms `cubic-bezier(.19,1,.22,1)` | Card lift, icon nudge, small foreground transform. |
| `--motion-accordion` | 250-300ms ease-out | FAQ/openable content reveal. |
| `--motion-demo-state` | 700-1200ms | Product demo state changes inside mocked phone/card UI. |
| `--motion-demo-hold` | 1500-2000ms | Demo state dwell before next explanatory state. |
| `--motion-hero-decor-enter` | 600-1000ms | Hero decorative scatter/fade intro; ongoing loop period unknown from current evidence. |
| `--motion-testimonial-rail-loop` | 120s linear infinite | Testimonial row horizontal translate, CSS selector `.Qwkbu` / `Testimonials__RowContainer-sc-1rcs3hw-1`. |

## Interaction rules

- Use motion to confirm control state, not to introduce navigation uncertainty.
- Keep nav and buttons under 200ms; they should feel immediate.
- Keep accordion and content expansion around 300ms so the answer feels deliberate but not slow.
- Keep decorative and rail loops ambient, slow, and removable for reduced motion.
- Keep financial/status micro animations one-shot or low amplitude; avoid looping urgency unless the state truly requires attention.
- Embedded product demos should be muted, control-less, and supported by static posters.

## What cannot be inferred safely

- Exact easing curves for hero intro, FAQ height expansion, and embedded MP4 content are not recoverable from the screen recording alone.
- The ongoing hero/footer decorative loop period is unknown from the current evidence. The exact `120s linear infinite` CSS evidence applies to the testimonial rail, not hero/footer decoration.
- User-triggered interactions inside the embedded phone demos cannot be separated from pre-rendered video playback.
- Hover/focus parity and keyboard behavior are not visible in the recording.
- Mobile menu opening motion is not present in the desktop recording; only `live-mobile.json` shows the hamburger has `transform 0.2s`.
- Card hover transform exists in computed-style evidence, but the recording does not show a clear card hover scale/lift event outside the nav dropdown.
