# Cross-page motion and project-ready design system

Completed: 2026-09-07 (Asia/Seoul)
Workspace: /mnt/j/02_Source/apple-design

## Use

- Motion library: http://localhost:4173/#motion
- Production preview: http://localhost:4174/#motion
- Motion code kit: http://localhost:4173/motion-code-kit.tar.gz
- All sources: http://localhost:4173/#research-sources
- Complete source kit: http://localhost:4173/research-source-kit.tar.gz
- Motion reuse guide: docs/motion-usage.md
- React package guide: http://localhost:4173/#start and docs/project-integration.md

## Delivered

17 pages across desktop and mobile (34 viewport captures), including all 11 global navigation destinations. 1,716 observed runtime records; 1,710 records retain 62,233 exact tracks, and 1,677 records have supported changing values for schematic preview. These are capture records, not a count of unique animation designs. The source catalog contains 11,733 entries: CSS, JavaScript API sites, declarative DOM hooks, SVG animations and media references.

The main motion route replaces the three-preset-only view with page/device/trigger/type/status filters, pagination, lazy full evidence loading, play/pause/seek/speed controls, all-track pagination, exact JSON/source copy, and bulk downloads. The old presets remain at #motion-presets. Mobile controls, coverage disclosure, source provenance, target labels and thumbnail detection were checked from real screenshots.

All 25,334 indexed source/font files are present. All original unavailable references (168) retain explicit alternatives, and the original 14 failed interaction-state captures retain substitutions. The new runtime capture separately retains 316 blocked attempts and 14,805 intentional skips with reasons. Private code and video/canvas pixel timelines are not labeled recovered.

The unchanged React 19 package still provides 8 components, TypeScript declarations and scoped generated tokens. Package SHA-256: 21ae4a6c9535b4c0e217221f8cad11d84b0e3d6aa75a5575928efd26f62710e9

## Verification

45 Node tests, 4 Sites tests, 48 baseline browser checks, 205 research checks, fixture and actual motion UI checks passed. Runtime evidence/source references, every retained kit track, all indexed sizes/hashes, and 2,728 distinct supported preview track payloads were checked. Full production build and the final Vite config refinement passed. Actual production-preview browser downloads preserve compressed archive bytes and match local SHA-256 hashes.

Vite preview originally marked .tar.gz artifacts as HTTP gzip encoding; the shared download middleware now serves them as application/gzip without transfer encoding, and the UI verifier guards against regressions. WSL public/dist polling is excluded to avoid starving requests across tens of thousands of evidence files. The protected Sites packaging files remain unchanged; the existing read/write fallback handled the mount's EPERM behavior.

Evidence index: evidence/motion-release.json. After the full source verification, two local source mirrors (preview middleware and its verifier) were updated and explicitly checked against their origins, deployed copies and archive entries; see evidence/motion-final-source-verification.json. Dedicated lint configuration is absent; parser/build, Node and Chromium checks were used.

Motion kit SHA-256: 04c0e4a82ec66213d665c6d1ad6ac1606494e88de1b38fc9a0de17fb16c67107
Complete source kit SHA-256: c5da9b4c675eb767ac91ac845d2750ce8e392f284e1de07a92e45d88d66111ec
