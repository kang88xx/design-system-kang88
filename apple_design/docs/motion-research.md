# Cross-page motion collection

The primary studio route is `#motion`. `#motion-presets` retains the original three local timing examples and `#observed-motion` remains the CSS source explorer.

## Evidence boundaries

- `research/runtime-motion.json`: per-page/per-viewport capture coverage and an index of runtime attempts. `records[].file` points to the full evidence JSON.
- `research/motion-catalog.json`: CSS rules, declarative DOM animation hooks, JavaScript animation API call sites, native SVG animation markup, and video/canvas source declarations. `source-only` means a declaration was found, not that a distinct visual effect was verified.
- `research/runtime-sources/`: original public CSS/JavaScript response bodies, with origin URLs in the runtime manifest.
- `research/runtime-dom/`: locally observed DOM snapshots, separate from original response bodies.
- `research/runtime-motion/records/`: actual sampled states and retained intermediate animation tracks.

The capture scope covers the homepage, the existing 13 saved pages (including all 11 global navigation destinations), and the homepage Mac mini, iPad Air and iPad Pro product destinations. Desktop and mobile coverage are reported separately. This is a documented finite scope, not a claim to enumerate every URL or private state on Apple.com.

## Capture and replay

The collector inventories controls and records attempted, unchanged, blocked and intentionally skipped outcomes with reasons. It scans the scroll range and samples passive, focus, click and hover behavior. Source declaration inventory is uncapped. Public response sources remain available even when an interaction cannot be executed.

Web Animations tracks preserve original keyframes and timing. Computed-style tracks retain changes across intermediate samples; comparing only the first and last frame would miss short transitions and effects that return to their starting state. Computed tracks interpolate recorded samples and do not claim to recover the original easing. Scroll tracks retain their original pixel range and map it to a normalized preview duration explicitly labeled as a schematic replay.

Video URLs, canvas elements and native SVG animation markup are inventoried separately. Finding a video/canvas element is not proof of recovering its pixel stream, GPU timeline or private media service.

The studio uses inert geometric targets to replay retained properties. This is labeled **관찰값 기반 도식 재생**. It is not an exact recreation of the original product scene. Where available, before/after captures provide original visual context. Source JSON stays intact; the preview independently filters properties that can execute safely in the local studio.

## Regeneration

From the repository root:

```bash
node scripts/capture-runtime-motion.mjs
node scripts/capture-radio-motion.mjs
node scripts/merge-runtime-motion.mjs
node scripts/complete-sources.mjs --reuse-unavailable-cache --no-archive
node scripts/build-motion-catalog.mjs
node scripts/build-motion-kit.mjs
node scripts/complete-sources.mjs --reuse-unavailable-cache
node scripts/verify-runtime-motion.mjs
node scripts/verify-motion-ui.mjs
```

`--reuse-unavailable-cache` applies only to the original dependency audit. It does not replace the fresh browser runtime collection. `capture-runtime-motion.mjs --probe` is a diagnostic homepage-only capture; run the full collector for delivery.

The UI verifier's `--fixture` mode intercepts responses inside the test browser. It does not write synthetic records into the public capture library. The default verifier uses the actual collected artifacts.

## Verification artifacts

- `evidence/runtime-motion-capture.log`: live collector progress.
- `evidence/runtime-motion-verification.json`: scope, coverage, source and track retention checks.
- `evidence/motion-ui-verification.log`: runtime library browser checks.
- `evidence/completeness-verification.json`: final source sizes, hashes and archive verification.

No record is called a recovered private implementation. Transactional and authenticated states remain outside public runtime collection and retain explicit unavailable/skipped reasons.
