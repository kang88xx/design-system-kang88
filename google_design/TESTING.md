# Testing

## Philosophy

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence. Without them, vibe coding is just yolo coding. With tests, it is a superpower.

This project uses a dependency-free Node.js validator plus browser QA. The validator covers data schemas, duplicate/provenance accounting, privacy boundaries, hashes, generated-file synchronization, source registries, interaction contracts, and private reference integrity.

## Commands

```bash
npm run check
npm run validate
npm run collect:platform-assets
```

- `npm run check`: rebuild every generated artifact, index private QA evidence, then validate everything.
- `npm run validate`: validate the existing files without downloading or rebuilding.
- `npm run collect:platform-assets`: refresh allowlisted Google image references and rebuild the catalogs.

## Test layers

### Data and provenance

- `data/raw/*.json` contains no user text or user-content hosts.
- Platform assets are unique by source URL and SHA-256.
- Repeated raw observations remain provenance counts, not duplicate files.
- Excluded/noise URLs carry explicit reasons.

### Generated artifacts

- Curated split files deep-equal their matching catalog payloads.
- `viewer/finalized.json` hashes the catalog, template, and generated viewer.
- Private QA screenshot duplicates are indexed as canonical files plus aliases.

### Browser regression

Test both `1440×1000` and `390×844`:

- All six public sections have no horizontal overflow.
- Theme persistence updates both theme and toggle icon.
- Hash navigation and browser back/forward keep URL and active section synchronized.
- Fourteen interaction contract samples update ARIA, visible output, dialog focus, feedback, and drag/drop fallback states.
- Private search/filter and user-crop comparison groups work without broken images.

### Privacy and licensing

- Public HTML never embeds `references-private/` images.
- Public HTML contains no private image path or private viewer route.
- Google product marks remain reference-only; Material Symbols are the open implementation lane.

## Conventions

- Add regression assertions to `scripts/validate-capture.mjs` for every fixed bug.
- Keep browser evidence under `.gstack/qa-reports/` during a QA run.
- Do not delete QA screenshots automatically. `scripts/index-private-qa-artifacts.mjs` records byte-identical aliases instead.


## Source expansion regression

`npm run check` also runs `scripts/test-collector.mjs`, a Node VM fixture that checks redaction gating, motion/gradient/shape aggregates, pseudo-element content exclusion and capped collections. The validator verifies all local SVG/source bytes against the pinned official manifest and checks that no unmanifested images enter distributable folders.

`scripts/test-source-kit.mjs`는 ZIP을 실제로 압축 해제해 모든 entry의 크기·SHA-256·원본 일치와 비공개 경로 제외를 검증합니다.

The finalized viewer hashes include its template, catalog, generated token CSS and both workbench modules. All literal inline scripts must parse successfully; matching hashes alone do not establish runnable JavaScript.

For browser QA, use an existing Playwright installation (no project dependency added):

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROMIUM_EXECUTABLE=/absolute/path/to/chrome node scripts/test-browser.mjs
```

Start the local HTTP server on port 8094 first. The script checks both reference viewport sizes, all six sections, source filtering, SVG/download controls, keyboard interactions and reduced-motion behavior. Browser evidence is kept in `references-private/catalog/`, and the machine-readable report in `.gstack/qa-reports/`.
