# Montage public-source research

## Scope and retrieval point

- Retrieved: 2026-09-07 (KST).
- Primary public documentation: [Montage](https://montage.wanted.co.kr/).
- Primary upstream source: [wanteddev/montage-web](https://github.com/wanteddev/montage-web), pinned to the latest public release commit at retrieval: [`bfced87f96dfb21c8ea80074c551b64b9ed1530b`](https://github.com/wanteddev/montage-web/tree/bfced87f96dfb21c8ea80074c551b64b9ed1530b) (`v3.12.0`, released 2026-08-11).
- The local public-site capture is a separate snapshot: `data/raw/montage.json` records 264 pages, 339 SVG vectors, and 697 image assets captured on 2026-09-01. Do not present it as a copy of the `v3.12.0` package.

## Practical collection boundaries

| Need | Public, reproducible collection path | Use / do not assume |
| --- | --- | --- |
| Captured documentation artwork and vector SVGs | Local `assets/montage/icons/`, `assets/montage/images/`, `assets/montage/shapes/`, and `data/curated/asset-manifest.json` | These are the 2026-09-01 public-site snapshot. Preserve the source URL and attribution data from the manifest. |
| Current React icon components | [`packages/wds-icon/src/index.ts`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-icon/src/index.ts) and the sibling `icon-*.tsx` files at the pinned commit | There are 359 `icon-*.tsx` source components at this commit, whereas the site capture has 339 SVG vectors. They are different delivery surfaces; do not deduplicate by filename or replace the captured SVG catalog automatically. |
| Color, semantic roles, shadows, spacing, breakpoint and z-index | [`packages/wds-theme/src/theme/`](https://github.com/wanteddev/montage-web/tree/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/theme) | The source is the reproducible code reference. The local `data/curated/tokens.css` is a browser-computed capture that is ready for the existing site, but needs its capture date retained. |
| Public Lottie loading asset | [`wds-lottie` loading source](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-lottie/src/loading/index.tsx#L23-L40) | This legacy component requests `https://static.wanted.co.kr/lottie/loading_brand_new.json`; do not assume that URL grants a separate asset licence or that it is stable. |
| Brand gradients / Wanted marks | [`wds-brand` gradient constants](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-brand/src/constants/gradient.ts#L1-L22) | The strings are public source, but they are brand-specific. Keep them out of a generic product token set unless use of Wanted branding is intended and separately approved. |

## Motion and interaction evidence

### What is documented

- [`AnimationPresence` docs](https://montage.wanted.co.kr/docs/utilities/web-utility-components/animation-presence) say that unmounting waits for all Web Animations API animations/transitions to finish. Their examples use `data-status="open"` / `"close"` and `fadeIn` / `fadeOut` at **0.4s ease**. This is an example value, not a published global duration/easing token.
- The current implementation calls `node.getAnimations(options)`, filters the targets, sets `fill: forwards`, and unmounts only after running animations finish or cancel: [`useAnimationPresence`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/animation-presence/hooks.ts#L33-L99). It exposes `present` and optional `GetAnimationsOptions` plus a target filter: [`types`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/animation-presence/types.ts#L4-L17).
- The docs list the built-in `forceMount` consumers as Accordion, Autocomplete, Alert, Menu, Popup, Popover, Snackbar, Toast, and Tooltip. This establishes a public interaction pattern for enter/exit content; it does **not** specify a motion scale for all components.
- The public design guidance for [Buttons](https://montage.wanted.co.kr/docs/components/actions/button/design) documents Solid/Outlined, Primary/Assistive, icon placement, loading, inactive-to-active conditional buttons, and toggle buttons. The pinned web source sets disabled controls to no pointer events and makes `loading` use `cursor: wait` while hiding ordinary child content: [`button/style.ts`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/button/style.ts#L9-L65). It defines `solid|outlined`, `primary|assistive`, `small|medium|large`, `disabled`, `disableInteraction`, and `loading`: [`button/types.ts`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/button/types.ts#L8-L36).

### Exact public motion values observed in upstream code

| Surface | Exact values at `bfced87` | Evidence |
| --- | --- | --- |
| Circular loading indicator | dash-array and dash-offset cycles: `5.3333s ease infinite`; rotation: `2.2s linear infinite`; `stroke-width: 3`, round cap | [`loading/style.ts` lines 30-94](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/loading/style.ts#L30-L94) |
| Wanted loading indicator | base `--time: 0.9`; color cycle `3.6s` with `0.45s` delay, linear/infinite; group start `0.45s cubic-bezier(0.5,0,0.5,1)`; rotation `1.8s linear infinite`; bounce `2.7s cubic-bezier(0.8,0,0.2,1) infinite`; triangle/square delays `0.9s`/`1.8s` | [`loading/style.ts` lines 96-188](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/loading/style.ts#L96-L188) |
| Presence examples | open and close `0.4s ease`; accordion expands from `height: 0`, `opacity: 0` to `var(--wds-accordion-height)`, `opacity: 1` | [`animation-presence.mdx` lines 8-80](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/docs/data/utilities/web-utility-components/animation-presence.mdx#L8-L80) |

No global duration, easing, spring, or reduced-motion token was found in the pinned `wds-theme` source. Treat the loader values as component-specific and the 0.4-second value as a documentation example, rather than copying either into a universal motion token.

## Colors, elevation, spacing, shapes, and gradients

### Semantic token model

- The public [Colors](https://montage.wanted.co.kr/docs/foundations/base-material/colors/semantic) guide defines role families: primary, label, fill, normal/solid lines, normal/elevated/transparent backgrounds, static, inverse, interaction, status, foreground/background accents, and dimmer material.
- The pinned source exposes light/dark semantic maps, atomic palettes, opacity, spacing, breakpoints, and `zIndex`; color/shadow strings are then converted to `--atomic-*` and `--semantic-*` custom properties: [`theme/index.ts`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/theme/index.ts#L13-L109).
- Exact spacing tokens are `0`, `0.5`, `1`, `2`, `4`, `6`, `8`, `10`, `12`, `14`, `16`, `20`, `24`, `32`, `40`, `48`, `56`, `64`, `72`, and `80` pixels: [`spacing`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/theme/spacing/index.ts#L1-L22). Breakpoints are `xs 0`, `sm 768`, `md 992`, `lg 1200`, `xl 1600` pixels: [`breakpoint`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/theme/breakpoint/index.ts#L1-L8). The public documentation separately describes its grid as 8px-based and recommends 4px multiples.

### Exact elevation values

The public [Elevation guide](https://montage.wanted.co.kr/docs/foundations/base-material/elevation/normal) assigns Normal XSmall through XLarge to progressively higher visual layers, and Spread to dialog-like surfaces. The source defines the following values identically for its light and dark semantic maps:

| Token | CSS value |
| --- | --- |
| `normal.xsmall` | `0px 1px 2px -1px #1717171A` |
| `normal.small` | `0px 2px 4px -2px #1717170F, 0px 4px 6px -1px #1717170F` |
| `normal.medium` | `0px 4px 6px -2px #17171712, 0px 10px 15px -3px #17171712` |
| `normal.large` | `0px 6px 10px -4px #17171714, 0px 16px 24px -6px #17171714` |
| `normal.xlarge` | `0px 10px 15px -5px #1717171A, 0px 24px 38px -10px #1717171F` |
| `spread.small` | `0px 0px 60px 0px #1717171A` |
| `spread.medium` | `0px 15px 75px 0px #17171729` |

The values above are the emitted eight-digit hex values: `neutral.10` is `#171717`, and `addHexOpacity` rounds the requested alpha to an appended byte. Source: [`semantic elevation`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/theme/semantic/index.ts#L116-L137), [`neutral palette`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/theme/atomic/neutral.ts#L1-L18), and [`opacity helper`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-theme/src/utils/index.ts#L8-L13).

### Shape and gradient limits

- No global border-radius or generic shape token is present in the pinned `wds-theme` tree. Buttons encode component-level radii of 8px, 10px, and 12px by size: [`button/style.ts` lines 67-158](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds/src/components/button/style.ts#L67-L158). This is evidence for those button variants only.
- The public [Gradient utility guide](https://montage.wanted.co.kr/docs/utilities/web-utilities/gradient) documents `solid`, `multiple`, and `mask` modes, directional use, and size arguments. Its examples are made with `gradient(theme.semantic.inverse.background, 'right', ...)` and describe solid as boundary smoothing, multiple as a two-colour gradient, and mask as a smooth edge mask. See the versioned source page: [`gradient.mdx`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/docs/data/utilities/web-utilities/gradient.mdx#L7-L94).
- At this pinned release, source-tree lookup did not locate a generic `gradient` implementation file; the versioned tree contains the documentation page and `wds-brand`'s logo-gradient constant. Treat this as a documentation/source mismatch and do not claim a specific emitted CSS formula for the generic helper. The five conic-gradient strings in `wds-brand` are public but should be treated as Wanted brand material, not system-neutral gradients.

## Icon coverage and version differences

- The public [Icons guide](https://montage.wanted.co.kr/docs/foundations/base-material/icons) says the icon set is simple and modern, supports keyword search, and categorises results as Solid, Color, and Nav. The React package has `sideEffects: false` and exposes its compiled root entry point: [`wds-icon/package.json`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/packages/wds-icon/package.json#L1-L28).
- `v3.12.0` is the latest public release as of retrieval and explicitly includes “icon figma sync and new code connect publish”: [release notes](https://github.com/wanteddev/montage-web/releases/tag/v3.12.0). This is material evidence that the code icon set changed after earlier snapshots.
- The 20-icon difference (359 current source components versus 339 captured SVG vectors) is observed coverage, not proof that any particular 20 icons are missing: the docs catalog and source package can intentionally have different exports, aliases, or non-vector components. A filename/name crosswalk must be generated only from the two public inventories before adding assets.

## Licence and brand boundary

- The repository is MIT, copyright `2026 Wanted Lab, Inc.`; copying code or substantial portions requires the copyright and permission notice: [`LICENSE.md`](https://github.com/wanteddev/montage-web/blob/bfced87f96dfb21c8ea80074c551b64b9ed1530b/LICENSE.md#L1-L21).
- The official [Terms of use](https://montage.wanted.co.kr/docs/getting-started/terms-of-use) also permit commercial use, modification, distribution, derivative works, and private use under MIT, but require copyright notice, full licence text, and original-author attribution.
- The terms separately reserve Wanted logos, wordmarks, and other brand assets for their own guidelines and prohibit use that impersonates or confuses users about Wanted. This boundary applies even where a related SVG, Lottie animation, or gradient is publicly reachable. The public terms do not establish a separate licence for third-party social/service marks included among icon names.

## Handoff

Use the existing local capture as the source for public-site visual assets and computed theme values. Use the pinned `v3.12.0` upstream links above for exact public implementation facts. Preserve the two inventories separately until a documented name-level crosswalk exists; reuse generic component/tokens under MIT with notices, and exclude Wanted brand identifiers/brand-gradient usage unless the product is actually representing Wanted.
