# Workspace Instructions

## Design System

Always read `DESIGN.md` before making visual or UI decisions.
All font choices, colors, spacing, layout, motion, component states, asset licensing, and privacy boundaries are defined there.
Do not deviate without explicit user approval.
In QA mode, flag code that does not match `DESIGN.md`.

## Capture Safety

Run `scripts/redact-google-ui.js` before saving any authenticated Google product screenshot.
Never store email senders, subjects, bodies, calendar event titles, Drive filenames or thumbnails, account names, or personalized Finance data.
Keep screenshots under `references-private/`; never embed them in `viewer/index.html` or distributable assets.

## Source Policy

Use only official Apache-2.0 or OFL-1.1 upstream assets in distributable code.
Google product logos, product icons, UI screenshots, illustrations, Doodles, and brand treatments are reference-only unless the user supplies explicit written permission.

## Testing

Run `npm run check` after every source, data, viewer, interaction, or documentation change.
The validator lives in `scripts/validate-capture.mjs`; full conventions are documented in `TESTING.md`.
When fixing a bug, add a regression assertion to the validator and re-run the affected browser flow at desktop and mobile widths.
Never accept a generated viewer whose catalog/template/viewer hashes do not match `viewer/finalized.json`.
