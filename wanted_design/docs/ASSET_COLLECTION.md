# Montage asset collection

Collected from [Montage](https://montage.wanted.co.kr/) on 2026-09-01.

## Coverage

- 262 official sitemap URLs, plus 2 linked platform index pages
- 339 reusable 24×24 SVG icons
- 21 home marquee gradient shapes, in live slide order
- 3 Behind the System placements and 3 Start Your Montage Lottie sources
- 468 color tokens: 332 atomic and 136 semantic
- 77 unique button-family reference images
- 620 remaining documentation and home visuals
- 697 downloaded PNG files, 66,715,801 bytes total, with no download failures
- 692 Montage-hosted files and 5 images explicitly referenced from external Wanted/partner hosts

The button collection covers Action area, Button, Chip, Icon button, Text button, and Filter button across the available design, web, iOS, and Android pages. The infographic collection intentionally keeps every remaining image instead of guessing which documentation diagrams are disposable.

## Use the collection

- `assets/montage/icons/`: individual SVG files using `currentColor`
- `assets/montage/images/`: downloaded images, grouped by source host and original path
- `data/curated/colors.json`: light and dark values for atomic and semantic tokens
- `data/curated/shapes.json`: marquee shapes, featured placements, resource animation metadata, and hashes
- `data/curated/buttons.json`: button-family images and their source pages
- `data/curated/infographics.json`: all non-button visual references
- `data/curated/asset-manifest.json`: source URL, local path, media type, dimensions, byte size, SHA-256, and status for every image
- `data/raw/montage.json`: page text, tables, code, links, image references, button markup, figure relationships, icon SVG source, and theme tokens
- `assets/montage/shapes/`: original resource animation JSON and captured SVG previews

## Refresh and verify

1. Run the browser collector into `data/raw/montage.json`.
2. Run `node scripts/build-catalog.mjs`.
3. Run `node scripts/export-montage-assets.mjs --download`.
4. Run `node scripts/build-viewer.mjs`.
5. Run `node scripts/validate-capture.mjs`.

The exporter is safe to rerun. Existing files are hashed instead of downloaded again. New remote files are written without overwriting an existing path.

## License and brand boundary

Montage documentation describes the system as MIT-licensed and requires the copyright and license notices to remain with copied or distributed material. Wanted logos and other brand assets have separate rules and must not be used to impersonate Wanted. See [LICENSE_AND_ATTRIBUTION.md](LICENSE_AND_ATTRIBUTION.md).
