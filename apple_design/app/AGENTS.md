# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Source library product contract

The user prioritizes complete source collection within the documented captured-page scope, error checks, and usable source browsing. Preserve public originals and their provenance; supply explicit, functional local substitutes for private or unobserved structure. Never count substitutes as recovered Apple source. Show all indexed source files through scalable filters/pagination and copy/download the full content.

## Reusable package contract

The user wants a design system usable in real projects. Keep the locally authored React package installable, typed, accessible, and independent of studio styles or captured Apple assets. Canonical tokens live in JSON and generate CSS. Preserve the integration guide, native form/ref behavior, scoped themes, standalone consumer verification, and explicit original-versus-substitute provenance.

## Motion capture contract

The user requires motions and interactions across homepage navigation tabs and their pages. The main motion route must show the collected library, with page/device/trigger filters and useful playback; small reconstructed timing presets are a separate playground. Inventory every discovered eligible control and record observed/no-change/blocked/skipped outcomes. CSS declarations and JavaScript call sites are source evidence, not counts of distinct verified motions. Preserve original values, source URLs, scroll timelines, and runtime keyframes; label schematic replay and unobserved substitutes explicitly.
