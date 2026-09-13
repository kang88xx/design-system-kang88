# Interaction Inventory

이 문서는 `https://www.apple.com/` 공개 캡처에서 관찰된 DOM/CSS/스크린샷 근거와 로컬 React 재구성 결정을 분리한다. Apple 내부 소스, 비공개 토큰, 비공개 컴포넌트 접근은 가정하지 않는다.

## Evidence Scope

- 관찰한 파일: `evidence/source/desktop.json`, `page.html`, `mobile.html`, `search.html`, `desktop.png`, `desktop-menu.png`, `desktop-search.png`, `mobile.png`, `desktop-full.png`, `mobile-full.png`.
- 메타데이터: title `Apple`, URL `https://www.apple.com/`, stylesheet 10개, script 15개, media 259개.
- 공개 stylesheet 링크: `globalheader.css`, `ac-globalfooter.built.css`, `ac-localnav.built.css`, `SF Pro/SF Pro Icons`, `main.built.css`, `home.built.css`, `home-gallery.built.css`, `inline-media.built.css`, `home_1qb7owdk.built.css`, `localeswitcher.built.css`.
- 공개 script 링크: `globalheader.umd.js`, analytics/data relay, globalfooter, localeswitcher, `bts2026.built.js`, `endless-entertainment-gallery.built.js`, `inline-media.built.js`, `main.built.js`, `home.built.js`, pricing scripts.
- 스크린샷 크기: desktop viewport `1440 x 1000`, desktop full `1440 x 6004`, mobile viewport `390 x 844`, mobile full `390 x 7281`.

## Observed Global Structure

- `html` class: `js no-touch progressive-image enhanced no-reduced-motion desktop no-retina no-tablet no-windows no-android no-safari chrome no-firefox no-edge no-iphone no-ipad ac-ls-visible ac-ls-fixed`.
- `body` class: `ac-nav-overlap globalnav-scrim globalheader-light`.
- 주요 섹션: `section section-hero` with `data-analytics-region="hero"`, `section section-promo` with `promo`, `section-endless-entertainment-gallery`, `ac-gf-sosumi`, `ac-gf-footer`.
- 로컬 재구성: 내부 class를 그대로 API로 삼지 말고, 같은 정보 구조와 상태를 `LocaleSwitcher`, `GlobalNav`, `HeroSection`, `PromoGrid`, `MediaGallery`, `FooterDirectory` 컴포넌트로 모델링한다.

## Locale Switcher

Observed public values:
- `aside#ac-localeswitcher`, `aria-label="Choose country or region"`, `lang="ko-KR"`.
- 드롭다운 트리거 `#ac-ls-dropdown-select`, `role="button"`, `aria-haspopup="true"`, `aria-controls="ac-ls-dropdown-options-list"`, `tabindex="0"`.
- 옵션 목록 `role="menu"`, 항목 `role="menuitem"`, 선택 항목 `data-ac-ls-selected="true"`.
- CTA `#ac-ls-continue`, close button `#ac-ls-close`, close `aria-label="국가 또는 지역 선택 도구 닫기"`.

Local reconstruction:
- 선택, 계속, 닫기 상태를 로컬 state로 처리한다.
- 국가 목록은 캡처된 대한민국/다른 국가 또는 지역만 기본 데이터로 둔다.
- 닫기 후 레이아웃이 위로 당겨지는 상태를 제공하되 외부 쿠키 저장은 요구하지 않는다.

## Global Nav And Mega Menu

Observed public values:
- `nav#globalnav`, `aria-label="Global"`, `data-analytics-region="global nav"`, `style="--r-globalnav-text-zoom-scale: 1"`.
- nav items: Apple, Store, Mac, iPad, iPhone, Watch, Vision, AirPods, TV & Home, Entertainment, Accessories, Support, Search, Bag.
- 각 메뉴 항목은 `data-globalnav-item-name`, `data-topnav-flyout-trigger-regular`, `data-topnav-flyout-trigger-compact`, `aria-expanded="false"`, `aria-controls="globalnav-submenu-link-..."` 패턴을 사용한다.
- flyout inline variables observed: `--r-globalnav-flyout-height` values include `168px`, `310px`, `376px`, `388px`, `406px`, `476px`, `490px`, `528px`, `552px`, `566px`; `--r-globalnav-flyout-rate` values include `240ms`, `242ms`, `254ms`, `261ms`, and mobile/menu capture `422ms`.
- submenu grouping regions include `explore shop`, `quick links - store`, `shop special stores`, `explore mac`, `shop mac`, `more from mac`, product-specific explore/shop/more groups, `get help`, `helpful topics`.

Local reconstruction:
- Desktop hover/focus opens a full-width flyout below the 44px nav; click/tap also toggles for keyboard parity.
- Use local data arrays for group headings and links. Do not imply Apple internal data schema access.
- Open state adds a page scrim/curtain behavior matching `globalnav-curtain`; close on Esc, outside click, route change, and selecting a link.
- Animate flyout height/opacity/child item stagger in the observed 240-422ms range. Exact per-menu timing may be approximated because only inline variables were captured.

## Search Overlay

Observed public values:
- Closed trigger: `li.globalnav-search`, `#globalnav-menubutton-link-search`, `role="button"`, `aria-label="Search apple.com"`, `aria-expanded="false"`, `aria-controls="globalnav-submenu-search"`.
- Open captured state: `html[data-globalnav-flyout-open="true"]`, `globalnav-item-flyout-open`, `aria-expanded="true"`.
- Search panel: `#globalnav-submenu-search`, `role="search"`, `aria-labelledby="globalnav-menubutton-link-search"`, inline `--r-globalnav-flyout-height: 388px; --r-globalnav-flyout-rate: 240ms`.
- Search data from public JSON: input placeholder `Search apple.com` regular, `Search` compact; submit aria `Submit search`; reset aria `Clear search`; default links title `Quick Links`; APIs `/search-services/suggestions/defaultlinks/` and `/search-services/suggestions/`.
- Screenshot state: large light overlay under nav, search headline, Quick Links list: Find a Store, Apple Vision Pro, AirPods, Apple Intelligence, Apple Trade In; page content below is blurred/dimmed.

Local reconstruction:
- Provide idle, focused empty, typed query, suggestions, and clear states with local fixtures.
- Default links should render arrow icons and keyboard-selectable rows.
- External suggestion APIs are not called unless explicitly added later; API URLs are evidence only.

## Bag Popover

Observed public values:
- `li#globalnav-bag`, `data-analytics-region="bag"`, trigger `#globalnav-menubutton-link-bag`, `aria-label="Shopping Bag"`, `aria-expanded="false"`, `aria-controls="globalnav-submenu-bag"`, `data-globalnav-item-name="bag"`.
- Flyout `#globalnav-submenu-bag`, inline desktop `--r-globalnav-flyout-height: 168px; --r-globalnav-flyout-rate: 240ms; --r-globalnav-scrollbar-width: 0px`.
- Public data includes store API `/[storefront]/shop/bag/status`, badge aria template `Shopping Bag with item count : {%BAGITEMCOUNT%}`, close aria `Close`.
- Captured content area is empty in HTML, with badge number/unit nodes visible in source.

Local reconstruction:
- Implement empty, loading, error, and item-count variants from local state.
- Keep bag icon as an accessible button and expose `aria-expanded`.
- Do not implement real cart status calls in the design-system studio.

## Mobile Nav

Observed public values:
- Mobile screenshot at 390px shows compact row: Apple logo, search icon, bag icon, menu button.
- Menu button `#globalnav-menutrigger-button`, `aria-controls="globalnav-list"`, `aria-label="Menu"`, `data-topnav-menu-label-open="Menu"`, `data-topnav-menu-label-close="Close"`.
- SVG bread lines: bottom points `2 12, 16 12`, top points `2 5, 16 5`; open/close animations `dur="0.24s"`, `keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1"`, open values converge at center then cross to `3.5 15, 15 3.5` and `3.5 3.5, 15 15`.
- Mobile HTML preserves the same submenu IDs and adds more `aria-controls` entries for footer accordion sections.

Local reconstruction:
- At `max-width: 833px`, collapse nav links into the compact bar and use a full-height menu panel. Product layout uses a separate 734px boundary.
- Menu opens by tapping hamburger, traps focus inside panel, supports Back/Menu back where submenu drilldown exists, and closes on Esc.
- Reuse the observed 0.24s line morph unless reduced motion is active.

## Footer

Observed public values:
- Footer directory root: `ac-gf-directory with-5-columns`.
- Repeated classes: `ac-gf-directory-column`, `ac-gf-directory-column-section`, `ac-gf-directory-column-section-title`, `ac-gf-directory-column-section-title-button`, `ac-gf-directory-column-section-title-icon`, `ac-gf-directory-column-section-list`, item/link classes.
- Mobile footer section buttons use `aria-expanded="false"` and `aria-controls` IDs: products, applewallet, accounts, entertainment, storeservices, business, education, healthcare, government, responsibility, about.
- Footer chevron SVG has `width="11" height="6"` and SMIL `animate` nodes for expand/collapse point changes.
- Footer legal/shop region includes Find an Apple Store, other retailer, phone, United States, Privacy Policy, Terms of Use, Sales and Refunds, Legal, Site Map.

Local reconstruction:
- Desktop footer is multi-column static directory.
- Mobile footer is accordion; one or many sections may be open, but `aria-expanded` and controlled list visibility must stay synchronized.
- Preserve small text density and legal hierarchy; avoid turning the footer into large cards.

## Hero, Promo, Media

Observed public values:
- Hero screenshot: full-width blue Apple Event visual, centered white text, pill CTA, nav overlap above. Text seen: `Surprise and shine.`, event subcopy, `Add to calendar`.
- Next visible promo: `College, sorted.` with education offer text.
- `desktop.json` media shows responsive asset families with `small`, `mediumtall`, `medium`, `largetall`, `large`, and `2x` variants. Example hero alt: Apple logo with glowing neon effect in blue and pink hues.
- There is a video source: `/105/media/us/home/2026/.../anim/hero/largetall.webm`.

Local reconstruction:
- Use product/brand imagery as first-viewport signal. Maintain stable aspect ratios before assets load.
- Video/animated hero must have poster/startframe fallback and pause under reduced motion.
- Hero CTA is pill-shaped, centered, and keyboard focusable.

## Galleries And Carousels

Observed public values:
- No literal `carousel` class found; carousel-like behavior is represented by `section-endless-entertainment-gallery`, `media-gallery`, and `dotnav`.
- Classes include `media-gallery-dotnav dotnav dotnav-scrim-solid dotnav-timed dotnav-timed-paused`, `media-gallery-dotnav-item dotnav-item current dotnav-focused`, `dotnav-incoming`, `media-gallery-dotnav-iconcontrol-pause`, `media-gallery-dotnav-iconcontrol-play`.
- Gallery item classes include `media-gallery-item theme-dark current current-item`, `media-gallery-wrapper-link`, `media-gallery-bg-wrapper`, `media-gallery-contents`, `media-gallery-bottom-content`, service logo classes for TV/music/arcade/fitness.
- `aria-controls` links dotnav items to `endless-entertainment-gallery-item-1` through `item-9`.
- Script evidence includes `endless-entertainment-gallery.built.js` and `inline-media.built.js`.

Local reconstruction:
- Model this as a carousel/gallery component even though the observed class name is gallery.
- Required states: current, incoming, focused, timed paused, play, pause, manual dot selection, previous/next if local UI exposes paddles.
- Do not auto-advance when reduced motion is active or when user pauses.
- Keep dotnav buttons accessible with labels and `aria-controls`.

## Responsive Contract

Observed public values:
- Breakpoints found in archived HTML/CSS references: `(max-width: 734px)`, `(max-width: 1068px)`, `(max-width: 1440px)`, `(max-width:734px)`, `(max-width:1068px)`, `(min-width:0px)`.
- Desktop capture: 1440px wide, full nav labels visible, footer 5 columns.
- Mobile capture: 390px wide, compact nav, vertical content, footer accordion controls present.

Local reconstruction:
- `<=734px`: compact nav, mobile menu, single-column hero/promo stack, footer accordion.
- `735px-1068px`: medium assets, adjusted text scale and promo density.
- `>1068px`: full nav labels, large/largetall imagery, multi-column promo/footer.
- Validate exact threshold behavior at 734px and 1068px, not only common device widths.

## Reduced Motion Contract

Observed public values:
- Captured `html` class includes `no-reduced-motion`.
- No inline `prefers-reduced-motion` rule was found in the archived HTML; reduced behavior is therefore a local accessibility requirement, not a fully observed CSS value.
- Motion-related observed values: globalnav flyout rates 240-422ms, hamburger SMIL `0.24s`, timed gallery classes, hero video source.

Local reconstruction:
- Respect `@media (prefers-reduced-motion: reduce)` and any app-level reduced-motion toggle.
- Disable gallery auto-advance, pause videos/animated backgrounds, remove item stagger, replace slide/blur transitions with instant opacity or no animation.
- Keep focus changes and content visibility immediate so keyboard users are not delayed by animation.

## Verification Checklist For Implementation

- Desktop 1440px: locale switcher, full nav, hero, search open, bag open, menu hover/focus, footer 5-column layout.
- Mobile 390px and `max-width: 734px`: compact nav, hamburger open/close line morph, search/bag access, footer accordion.
- Breakpoints: visual and DOM state checks at 734px and 1068px.
- Accessibility: `aria-expanded`, `aria-controls`, focus trap, Esc close, visible focus, search `role="search"`, dotnav labels.
- Motion: default animation timings in observed range; reduced motion disables auto and large transitions.
