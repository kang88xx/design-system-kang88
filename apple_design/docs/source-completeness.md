# Source completeness

Scope: homepage and 13 saved public pages. This is a snapshot and dependency audit, not an exhaustive crawl of apple.com or recovery of private authoring files.

`research/completeness.json` records actual file counts, missing paths, unavailable referenced URLs, parser errors, substitutions and coverage. `research/source-index.json` contains every indexed source path, content size and SHA-256 hash. The manifest, completeness report and index themselves are excluded from their own hash list to avoid self-reference.

`research/dom-inventory.json` inventories all headings, controls, inline SVGs and code blocks in the 27 saved HTML documents without prior sampling caps. Static inventory does not assert visibility, keyboard behavior or successful interactions. Raw SVG source is viewed as inert text; the existing SVG gallery uses separately sanitized assets.

All captured CSS, including inline style blocks, is parsed. Full motion rules preserve their selector, source and containing at-rules. `css-variables.json` preserves every custom-property declaration and conditional context. `css-shapes.json` adds the full source-level geometry inventory alongside observed computed geometry.

HTML references, CSS imports/code assets, static and literal dynamic imports, and literal new URL references are followed recursively. Explicit external source map references are followed; no undisclosed map locations are guessed. Variable-computed imports and parse failures are reported when encountered. Inline authoring-language templates are stored without executing them.

Original HTTP 404 references remain unavailable records. `resource-substitutions.json` maps every one to an existing captured equivalent or an explicitly local replacement. Old font weights/formats use the working captured font stylesheet and system-font fallback; text metrics can differ. Older public footer icons replace unavailable versioned references. A local red swatch replaces an unavailable support color asset.

`substitutions.json` maps all 14 failed original state IDs to functional local patterns and includes four private-authoring/server areas. The original 61 successful and 14 failed observations remain unchanged. Demos approximate patterns; they do not reproduce Apple accounts, checkout, backend or proprietary source.

The source kit includes public text sources, fonts, application source, capture/verification scripts and documentation. Raster/video assets remain in the workspace and are deliberately excluded from the code kit. Source URLs and original copyright notices are preserved.
