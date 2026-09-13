# Components

원문 규칙은 `data/curated/hds-components.css`(HDS, `@layer hds`)와 `legacy-components.css`(`@layer stripe-legacy`)에 있다. 뷰어 컴포넌트 탭에서 라이브로 렌더된다.

## HDS

| 컴포넌트 | 핵심 규칙 |
| --- | --- |
| `.hds-button` | 16px/1 weight 400, `padding-block 15.5/16.5px`(모바일 13.5/14.5, compact 11.5/12.5), inline 24px, gap 8px, radius 4px, `border 1px`. primary `bg #533afd → hover #4032c8`, disabled `#a8c3de4d/#95a4ba`; secondary `bg #ffffffa6`, border `#b9b9f9` → hover 글자 `#2e2b8c`, border `#4032c8`; `--secondary-on-quiet`; `--transparent`. transition 300ms `cubic-bezier(.25,1,.5,1)` (reduced-motion 제외). focus `outline: var(--hds-focus-outline)` offset 1px |
| `.hds-ui-button` | 40×40(small 28), radius 4px(small 2px), `--quiet/--subdued` 배경, hover 아이콘 색 변화 |
| `.hds-link` | weight 400, `#533afd` → hover `#2e2b8c`; `--secondary` 상속색 + 밑줄 offset 2px; focus radius 1px |
| `.hds-tag` | `--md` 14px, radius 4px, padding 5px 8px, gap 6px; `--sm` 12px, radius 2px; 보더 `surface-border-quiet`, 글자 `text-soft` |
| `.hds-heading--xxl…xxs` / `.hds-text--xxl…xxs` | 토큰 스케일 그대로; `--subdued/--soft/--emphasized(400)/--inline` |
| `.hds-textinput` | 48px, 1px `input-border-default`, radius 4px, padding 15.5/16.5 × 15px, focus border `#665efd` + outline 3px `focus-outerSubdued` |
| `.hds-checkbox` | 16px, 1.25px `input-border-option`, radius 2px, checked `input-bg-accent` |
| `.hds-switch` | 36×20, radius 999999px, knob 17.5px, checked translate 16px, 150ms ease |
| `.hds-select`, `.hds-listbox`, `.hds-autocomplete`, `.hds-globalization-picker` | 팝오버 240px, tile min-height 48/40/44 |
| `.hds-dialog` | radius 16px, padding 56→72/80→112px, `data-status` initial(translateY 200px) → open 800ms `cubic-bezier(.22,1,.36,1)` → close 300ms; overlay alpha .9/.7; 모바일 바텀시트 |
| `.hds-tooltip` | max 290px, padding 12/16px, radius 8px, 방향별 그림자 `0 30px 60px -12px rgba(50,50,93,.25), 0 18px 36px -18px rgba(0,0,0,.3)` |
| `.hds-accordion` / `.hds-details` | 360ms `cubic-bezier(.65,.05,.36,1)`, `::details-content` 인터폴레이션 |
| `.hds-stat`, `.hds-stats-block` | padding-y 32→36px |
| `.hds-resource-card` | padding 16→24px, 300ms `cubic-bezier(.46,.03,.52,.96)`, 링크 offset 48px |
| `.hds-navigation-menu` | 76px 헤더, 트리거 14px, 뷰포트 푸터 80px, 240ms `cubic-bezier(.45,.05,.55,.95)`, `detect-scroll` 키프레임으로 스크롤 가능 여부 감지 |

## Legacy MktRoot

| 컴포넌트 | 핵심 규칙 |
| --- | --- |
| `.CtaButton` | `font: var(--ctaFont)` 425 15px/1.6, padding 3px 0 6px, radius 16.5px, `variant--Button` inline 16px(화살표 12px) `bg var(--buttonColor)` 글자 `var(--knockoutColor)`, hover `--buttonHoverColor`; `variant--Link` 색만; `variant--Google` 흰 배경 + `#e7ecf1` 보더; `.HoverArrow` |
| `.Button` | inline-flex, gap 6px, radius 16.5px, padding 3px 16px 6px, focus `--focusBoxShadow` |
| `.Badge` | 12px 425, padding 3px 8px, `::before` 9999px 배경(`--badgeBackground #e7eaef`), `color--Purple/Blue/Cyan/Teal/Pink/…`, `Badge--accented` 액센트 7% 배경, `variant--Squared` 4px |
| `.CopyTitle` / `.CopyBody` | 좌우 column padding, `--titleWeight`, 본문 변형(Hero/Section 18px·1.556·gap 20px, Detail/Stat 15px·1.6, Disclaimer 13px), `--anchored::before` 1px 액센트 바 |
| `.Section` | `--sectionPaddingMin 72 / Max 110…`, `Section__background { transform: skewY(var(--sectionAngle)) }`, `--angleTop/--angleBottom/--angleBoth`, `--hasBorderTop` |
| `.Card` | `--cardBorderRadius 8px`, `--border` 1px `--cardBorderColor`, `--shadowXSmall…Large`, `--accented::before` 8px 바, bleed 변수 |
| `.AccordionItem` | 1px 하단 보더, 헤딩 버튼 padding 17px, 아이콘 rotate 180→0, 라벨 hover opacity `--navHoverOpacity .6` |
| `.Tabs/.TabsList`, `.Table*`, `.List`, `.GridLayout`, `.SelectInput`, `.TooltipButton`, `.SegmentedControlButton` | 원문 참조 |
| `.SiteHeader` | sticky/isStuck 전환 250ms, `NavCtaGradient` 그라데이션 텍스트 CTA, 햄버거 rect 변형 |
