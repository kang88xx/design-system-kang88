# Independent Review

Date: 2026-09-07
Scope: focused read-only QA of the ARK document design system in `/mnt/j/02_Source/Design System`, limited to source provenance, browser/A4 validation artifacts, icon/prompt logic, and current PPTX package invariants. This review did not confirm rendering in Microsoft PowerPoint, Keynote, or LibreOffice.

## Verdict

PASS for the focused invariants reviewed here. The previously open PPTX schema issues are resolved in the current generated `templates/ark-proposal.pptx`, and the browser/A4 verification artifacts report passing results. Final archive freshness remains a root release step after this document edit and should be accepted only through the final archive rebuild plus `tests/validate_system.py --archives`.

## Evidence Checked

- `/tmp/catalog-premium-venv/bin/python tests/validate_pptx.py` passed: `ok templates/ark-proposal.pptx slides=10`.
- Focused PPTX invariant inspection of `templates/ark-proposal.pptx` found `a_b_child=0`, `negative_extents=0`, `p:sldSz type="screen16x9"`, `master_clrMap=True`, and theme style list counts of `fillStyleLst=10`, `lnStyleLst=12`, `effectStyleLst=3`, `bgFillStyleLst=10`.
- `tests/validate_pptx.py` validates relationship targets, slide count, allowed slide-size type, slide master color map, slide master theme/layout relationships, major/minor font `latin`/`ea`/`cs`, minimum theme style-list lengths, duplicate shape IDs, negative extents, invalid child `<a:b/>`, invalid bold attributes, and missing complex-script run fonts.
- `scripts/build_templates.py` now emits bold as an `a:rPr` attribute, includes `<a:cs typeface="Arial"/>`, writes `p:sldSz type="screen16x9"`, includes the master `p:clrMap`, adds slide layout color-map override, and expands theme font/style structures.
- `.omx/artifacts/verification/browser-results.json` exists and reports `passed=163`, `browserErrors=[]`, `viewports=[1440,1024,768,390,320]`, and `transport="file:// load + loopback HTTP interactions/downloads"`.
- `.omx/artifacts/verification/a4-results.json` exists and reports `pages=4`, `browserErrors=[]`, `portableHTML=true`, and `saveReload=true`.
- Source data remains coherent at the checked level: `data/source-manifest.json` and `data/source-data.js` agree on 52 pages, 79 images, 16 font subsets, 1,867 top-level drawing records, and 29 curated graphics; a local reference walk found no missing manifest/system paths.
- Icon extension data remains coherent: 16 subjects have mono and gradient SVG variants; prompt output uses sampled gradient stops `#5C66D4 -> #2733A1 -> #051565`; SVG checks found 48x48, script-free, raster-free assets with extension metadata.

## Resolved Findings

### PPTX schema invariants

Earlier review found schema-level risks in the generated PPTX: child `<a:b/>` under `<a:rPr>`, negative line extents, suspect `p:sldSz type="wide"`, missing master color map, and incomplete theme font/style structures. These are resolved in the current file according to `tests/validate_pptx.py` and the focused package inspection above.

The current evidence proves package-level and schema-oriented invariants only. It does not prove that Microsoft PowerPoint, Keynote, or LibreOffice will render the deck without repair prompts.

### Browser interaction regressions

Earlier browser smoke failures around clipboard toast timing and slash shortcut focus are resolved according to `.omx/artifacts/verification/browser-results.json`, which reports 163 passing browser assertions and no browser errors.

### A4 template behavior

The A4 result artifact reports four printable pages, no browser errors, portable HTML export, and save/reload behavior.

## Pending Release Gate

Archive freshness is intentionally left to the root release step after this document edit. Do not treat the pre-edit archive state as current acceptance evidence. After final rebuild, run:

```bash
python3 tests/validate_system.py --archives
/tmp/catalog-premium-venv/bin/python tests/validate_pptx.py
/tmp/catalog-premium-venv/bin/python tests/browser_smoke.py
```

Acceptance for release packages requires the rebuilt archives to match their `data/downloads.json` metadata and include the current workspace files.

## Residual Risk

No Office application rendering was available in this review environment. If possible, open the rebuilt `templates/ark-proposal.pptx` in Microsoft PowerPoint or LibreOffice and confirm all 10 slides open without repair prompts and remain editable.
