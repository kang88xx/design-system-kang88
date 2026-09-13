# Source coverage

Generated 2026-09-10 by `node scripts/build-docs.mjs`. Numbers come from `data/curated/*.json` and the capture folders.

## Crawl

| Item | Count |
| --- | --- |
| Pages crawled (1440×900, computed-style inventory + screenshots) | 70 |
| Pages on the new **HDS** system (`--hds-*`, `.hds-*`) | 12 |
| Pages on the **legacy MktRoot** system (`.MktRoot`, `.theme--*`, `.flavor--*`) | 58 |
| Stylesheets saved to `assets/stripe/css` | 606 (HDS bundle 24, legacy `v1-*.css` 574, rest = docs Sail / Sessions / Checkout) |
| Deep-pass pages (boxes, effects, motion, illustrations, interactions) | 30 |
| Page screenshots (`captures/pages`) | 146 |

## Tokens

| Item | Count |
| --- | --- |
| HDS custom properties resolved on `:root` | 699 |
| HDS dark-mode overrides (`.hds-mode--dark`) | 365 |
| HDS responsive overrides (640px / 940px) | 39 / 40 |
| HDS accent modes | lemon, default, magenta, ruby, orange |
| HDS typography families | heading, heading-hero, input-label, input-text, quote, quoteAttribution, text |
| Legacy root tokens (`html` + `.MktRoot`) | 61 |
| Legacy themes / accents / gradient flavors | 9 / 11 / 10 |

## Boxes · effects · motion · illustrations · interactions

| Item | Count |
| --- | --- |
| Unique box sources (HTML + matched CSS via CDP) | 355 in 122 families, 22 with hover deltas |
| Box screenshots (rest + hover) | 493 |
| Effect samples | 370 across 11 kinds (pseudo-layer 57, backdrop-filter 8, transform 80, clip-path 80, mask 62, filter 9, radial-gradient 22, conic-gradient 3, linear-gradient 34, blend-mode 3, gradient-text 12) |
| Effect screenshots | 961 |
| `@keyframes` in stylesheets (HDS / legacy / other) | 40 / 33 / 27 |
| CSS animations observed running | 7 |
| Web Animations API entries (unique type+name+keyframes+target) | 300 |
| Transition properties observed | 19 |
| Frame sequences (6 frames @160ms) | 89 (540 PNGs) |
| Illustrations in page (img/svg/video/canvas/DOM graphic) | 598 (601 screenshots, 106 inline SVG files) |
| Illustration source files downloaded | 391 (png 222, jpg 65, svg 86, webp 3, jpeg 7, mp4 3, avif 5) |
| Looping clips (`captures/clips`, mp4 15fps, element-cropped, cursor overlay) | 218 clips, 6.8 MB |
| Interaction before/after captures | 52 (108 PNGs) + 22 hover boxes + 24 component-state captures |
| Duotone product icons (reused from 2026-07 collection) | 193 |
| Logo SVGs extracted | 575 |

## Systems observed on stripe.com (2026-09-10)

- **HDS** (`b.stripecdn.com/mkt-ssr-statics`, Next.js bundle): /about, /billing/subscriptions, /billing/usage-based-billing, /billing, /contact/sales, /crypto-onramp, /, /jobs, /money-management/availability, /radar, /security, /sessions
- **Legacy MktRoot** (`b.stripecdn.com/mkt-statics-srv/assets/v1-*.css`): /agentic-commerce, /ai, /apps, /atlas, /authorization-boost, /blog, /capital/platforms, /capital, /checkout, /climate, /connect, /customers, /data-pipeline, /enterprise, /financial-connections, /global, /identity, /industries/fintech, /industries/gaming, /industries/healthcare, /industries/nonprofits, /industries/retail, /industries/travel, /invoicing, /issuing, /managed-payments, /newsroom, /partners, /payments/checkout, /payments/elements, /payments/features, /payments/link, /payments/payment-links, /payments/payment-methods, /payments, /payouts, /pricing, /resources, /revenue-recognition, /sigma, /sitemap, /startups, /tax, /terminal, /treasury/platforms, /treasury, /use-cases/agentic-commerce, /use-cases/ai, /use-cases/creator-economy, /use-cases/crypto, /use-cases/ecommerce, /use-cases/embedded-finance, /use-cases/finance-automation, /use-cases/global-businesses, /use-cases/in-app-payments, /use-cases/marketplaces, /use-cases/platforms, /use-cases/saas
- Other systems touched but not catalogued in depth: docs.stripe.com **Sail** (`--sail-color-*`, 374 variables in `data/raw/css-custom-properties-sail.json`), stripesessions.com, js.stripe.com Checkout.

## Not collected

- Authenticated Dashboard UI, Stripe Apps UI, Figma files, private brand assets.
- WebGL shader source of the hero wave / legacy Gradient canvas (only frame captures and the CSS colour inputs).
- Full HTML of every page (only header/footer/box/effect snippets).
