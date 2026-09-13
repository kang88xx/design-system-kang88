# Cross-page source research

## Scope

The public US Apple site was inspected in Google Chrome for Testing 148.
Coverage includes Mac, iPhone, iPad, Watch, AirPods, Apple Vision Pro, TV & Home,
services, Store, accessories, MacBook Air, iPhone 17 Pro, and Apple Support.
This browser session does not attach to the user's existing Chrome tabs or use
their account. No private repositories, unpublished source maps, account data,
or authenticated-only screens were accessed.

## Artifacts

- `app/public/research/manifest.json`: page coverage, provenance and failures.
- `app/public/research/files/`: browser-delivered CSS and JavaScript bundles.
- `app/public/research/icons/`: sanitized SVG geometry with source references.
- `app/public/research/pages/`: captured HTML, metadata and screenshot evidence.
- `app/public/interaction-lab/`: targeted controls, before/after computed states,
  animation timing/keyframes, and sampled scroll states.
- `app/public/research/observed-tokens.*`: observed computed values with locally
  assigned names. These are not recovered Apple semantic token names.
- `app/public/research-source-kit.tar.gz`: code-only archive, excluding JPG, PNG,
  raster evidence, video, dependencies and build output.

## Interpretation

Captured bundles are minified production source, not original internal component
files. Keyframes are parsed structurally with PostCSS. CSS transitions are listed
separately from keyframe animations. Isolated motion previews use a generic target;
where no duration was captured, preview timing is identified as a local fallback.
Measured shapes preserve the captured declarations in metadata; safe previews
exclude external references and scripts. Local reusable React components are a
reconstruction and are kept separate from captured Apple bundles.

An `ok` page means navigation and bounded capture succeeded, not that every
interaction or resource succeeded. `blocked` actions are not counted as verified
interactions. Screenshots provide evidence but are not a substitute for source.
Only directly referenced source maps are fetched; zero discovered maps does not
prove that no source maps exist elsewhere.

## Reproduction

Run capture scripts from the repository root. They use the installed Playwright
package and Chrome executable paths recorded in the scripts.

```sh
node scripts/expand-capture.mjs
node scripts/capture-interactions.mjs
node scripts/capture-interactions.mjs --retry
node scripts/recover-research-resources.mjs
node scripts/verify-svg-assets.mjs
node scripts/finalize-research.mjs
node scripts/verify-research.mjs
```

After introducing new public assets, restart the Vite development server before
browser verification. Baseline global navigation switches at 833/834 pixels;
product-layout ranges are independently based on 734/1068 pixels.

## Final capture coverage

13 pages, 164 standalone SVG assets plus one preserved symbol-definition library, 298 nonempty geometry records, 800 sampled
motion rules including 124 complete keyframes, and 77 observed token values.
All downloaded CSS bundles remain available beyond the 800-rule gallery cap.
75 action attempts produced 61 captured records and 14 blocked records.
Six initial resource-body failures were recovered by direct HTTP retry and are
preserved in `recoveredFailures`. No directly referenced source maps were found.
Full targeted animation records remain in per-action JSON; the navigation
manifest contains compact summaries to avoid loading duplicate state payloads.
