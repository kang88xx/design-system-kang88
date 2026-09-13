# Live evidence: family.co

Captured 2026-09-06 with Playwright 1.58.2, `domcontentloaded` plus 2.5 s settling. The provided `recent.design` page was not used here; this report is a live inspection of `https://family.co/`, which returned HTTP 200 and resolved to the same URL at both viewports.

## Evidence files

- `live-desktop.png` — 1440×1000 viewport, full page screenshot (page height 11,367 px).
- `live-mobile.png` — 390×844 viewport, full page screenshot.
- `live-desktop.json`, `live-mobile.json` — computed-style samples, frequency tables, links, media metadata, console/page errors.
- `live-interactions.json` — hover and scroll probe output.

## Exact observations

The page uses a white/light canvas with body text `rgb(71,70,69)` and a global font stack beginning `Inter`; 23 sampled nodes use `Family` as the primary family and 55 use `LFE Sans`. Common text sizes are 15–16 px, with 17, 19, 20, 23, 32, 44, and desktop 68 px display sizes. Header content is 1024 px wide at desktop, 94 px high, centered inside a 1072 px wrapper. The mobile capture preserves the same type family and 44 px headline scale but collapses desktop layout.

Observed neutrals include white, `#F6F4EF`, `#FBFAF9`, `#171717`, `#121212`, and text gray `#474645`. The stylesheet's direct sRGB fallbacks include `--app-green: #34C759`, `--app-gray: #747484`, `--app-blue: #018DFF`, `--app-pink: #F966AC`, and `--purple: #9553F9`. A later wide-gamut block overrides several values with `color(display-p3 ...)`; those raw P3 channels are reported in the JSON and are intentionally not converted to sRGB hex. Additional rendered accent values include red, orange, amber, slate blue, and gold; these are frequency-backed computed values, not inferred semantic tokens.

Common radii are 6, 8, 10, 12, 32, 40, and 72 px; circular elements use 50%. The dropdown panel is 303×130 px with an 8 px radius. Observed shadows include `0 3px 16px rgba(0,0,0,.1)`, `0 0 24px rgba(0,0,0,.15)`, and a subtle 1 px inset border/shadow in the warm neutral. Header/nav links commonly use a 6 px radius.

Interaction evidence: nav links expose `background 0.2s, color 0.2s`; dropdown content uses `opacity 0.1s, transform 0.1s`; many cards/icons use `transform 0.22s cubic-bezier(.19,1,.22,1)` or `transform 1s cubic-bezier(.19,1,.22,1)`. Other recurring motion is opacity 0.1–0.2 s, fill 0.1/0.4 s, and box-shadow 0.1 s. The page declares a 120 s linear infinite animation (`hdKGda`) on desktop; no active CSS animation was present in the mobile sample. Scroll probe reached the 11,367 px page bottom; no header position/transform mutation was detected in the sampled `header`/`nav` nodes.

The page embeds nine muted, control-less MP4 demos: `send.mp4`, `receive.mp4`, `swap.mp4`, `nft.mp4`, `watch.mp4`, `activity.mp4`, `onboarding.mp4`, `missioncontrol.mp4`, and `dragdropdone.mp4`. The first three and the last three are non-looping; NFT, Watch, and Activity loop. They are exact media URLs exposed by the DOM.

The exact stylesheet also gives a centered `.container` max width of `calc(1008px + 2rem)` with 1rem side padding; common section grids use 2 columns and 5.75rem gaps, while card grids use 3 columns and 2rem gaps. At 768px most two-column sections become vertical with 1rem gaps; 880px and 580px provide additional grid transitions. Hero typography is Family 68px/1.1 desktop → 44px/48px mobile, while the secondary Family heading is 44px/48px → 32px/35px under 420px. Exact selector mappings, breakpoints, and keyframes are in [`live-style-excerpts.md`](live-style-excerpts.md), sourced from [`live-styles.css`](live-styles.css).

## Inference boundaries and limitations

The screenshots and JSON are direct evidence. Suggested token names, semantic roles, and component grouping should be inferred by the consuming design-system work. Several assets returned 503 and the page emitted React error #425 during capture; this can make some below-fold content or motion incomplete. Hover probing was performed against the first nav link and scroll was sampled once, so motion timings are computed-style evidence rather than a frame-by-frame choreography capture.
