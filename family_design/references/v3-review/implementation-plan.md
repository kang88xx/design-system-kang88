# Source completion and catalog usability — 2026-09-06

## Authorized outcome
Audit and expand the Family landing design-system extraction, fix defects, expose all collected sources in usable UI, and provide explicit local reconstructions for unavailable private structures.

## Evidence and baseline
- Existing catalog verifier passed freshly on this run, including nine videos, 14 scene mappings, three viewports, resource links and reduced motion.
- Existing asset browser exposes only twelve selected shapes despite 94 extracted SVGs and 69 groups. Full inventory/search is missing.
- Public app code cannot be equated to landing MP4s; reconstructed component implementations must remain labeled.

## Implementation lanes
1. Public source collector: inventory all landing HTML/CSS/bundle-referenced design resources; URL/path/hash/status provenance; report failed fetches and boundaries.
2. Source browser: all assets, filters, search, previews, source inspector, downloads and file mode; existing visual language.
3. Motion audit: regressions first for actual defects, state/keyboard/reduced-motion validation and fidelity notes.
4. Integration: reproducible build, source mapping for private flows, static integrity and archive verification, design docs and fresh screenshots.

## Acceptance
Every in-scope discovered reference has either a local verified asset or explicit failed/unavailable entry and a practical alternative where applicable. No claim of recovered private original code. Browser tests cover resource integrity, manifest search/filter/paging, inspector/download, keyboard focus, mobile overflow, original nine films and all motion actions. Final archive contains implementation and source inventory and no cache/runtime files.
