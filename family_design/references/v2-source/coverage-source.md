# Family source coverage (v2)

Captured from `https://family.co/` on 2026-09-06. These files are reference material for the design-system preview; source attribution is retained here and in the video manifest.

## Interaction video source

All nine requested product demonstrations resolve as first-party MP4s at `https://family.co/videos/{name}.mp4`. Each has a local copy and a JPEG poster frame in `references/v2-source/videos/`.

| interaction | source | duration | local preview |
|---|---|---:|---|
| Send | `/videos/send.mp4` | 5.13s | `videos/send-poster.jpg` |
| Receive | `/videos/receive.mp4` | 3.60s | `videos/receive-poster.jpg` |
| Swap | `/videos/swap.mp4` | 5.33s | `videos/swap-poster.jpg` |
| NFT / collectibles | `/videos/nft.mp4` | 6.03s | `videos/nft-poster.jpg` |
| Watch wallet | `/videos/watch.mp4` | 2.73s | `videos/watch-poster.jpg` |
| Activity | `/videos/activity.mp4` | 5.52s | `videos/activity-poster.jpg` |
| Onboarding | `/videos/onboarding.mp4` | 3.40s | `videos/onboarding-poster.jpg` |
| Mission Control | `/videos/missioncontrol.mp4` | 3.82s | `videos/missioncontrol-poster.jpg` |
| Drag and drop | `/videos/dragdropdone.mp4` | 5.93s | `videos/dragdropdone-poster.jpg` |

Durations and byte sizes are machine-readable in `videos/manifest.json`. The videos are the strongest available evidence for the interaction previews; they should be shown as thumbnail cards with playback controls and a short behavior caption.

## First-party visual assets

Downloaded from `family.co` into `assets/`: `phone.png`, `family-accounts.png`, `why-family-accounts.png`, `launch-01.png` through `launch-06.png`, `previews-01.png` through `previews-03.png`, and the four promo stills (`promo-activity.png`, `promo-collectibles.png`, `promo-watch.png`, `promo-wallet.jpg`). These cover the phone hero, account/security explanation, launch bento cards, and product-detail mini cards.

The live DOM contains 94 inline SVGs. Non-trivial inline geometry is preserved as standalone source files `assets/inline-svg-000.svg` through `inline-svg-093.svg`; the largest motion/illustration candidates are:

- `inline-svg-007.svg` — 2376×548 animated hero/banner geometry.
- `inline-svg-042.svg` — 435×388 hand drawn / decorative illustration.
- `inline-svg-046.svg`, `inline-svg-047.svg`, `inline-svg-048.svg` — 393×64 repeated card/footer geometry variants.
- `inline-svg-052.svg` — 347×62 rounded status/control geometry.
- `inline-svg-054.svg` — 417×204 animated illustration geometry.
- `inline-svg-088.svg` — 495×179 decorative shape/illustration geometry.

`assets/dom-inventory.json` records the original DOM image URLs, SVG viewBoxes, loaded script URLs, and page text for cross-checking. `assets/asset-candidates.json` records the image candidates identified by semantic URL/alt/class matching.

## Motion evidence available in captured source

The captured live CSS in `references/live-styles.css` includes the original image hover transform (`220ms cubic-bezier(0.19,1,0.22,1)`), image loading shimmer (`1200ms linear`), dashed-rule drift (`120s linear`), and the send / receive / swap SVG keyframes. The nine MP4s add direct evidence for product-level choreography where CSS is not exposed in the marketing page.

## Coverage boundary

The live marketing page exposes first-party video and inline SVG sources, but does not expose the private app's React source or its internal component names. Any app-only states not represented by the nine MP4s should be labeled as inferred behavior in the design-system UI. The source inventory and posters make those inferences reviewable without implying they are original implementation code.
