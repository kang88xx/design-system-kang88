# Reuse Library

This package is generated from the local Montage capture so application work can reuse documented source examples, portable surface CSS, and motion recipes without searching the raw crawl by hand.

## JSON contract

`data/curated/reuse-library.json` has this stable top-level shape:

```ts
type ReuseLibrary = {
  generatedAt: string;
  source: {
    primary: string;
    docs: string;
    localEvidence: string[];
    upstream?: {
      repository: string;
      commit: string;
      release: string;
    };
    generatedBy: string;
  };
  counts: Record<string, number>;
  examples: Array<{
    id: string;
    name: string;
    category: string;
    surface: string;
    sourceUrl: string;
    code: string;
    evidence: "documented";
  }>;
  surfaces: Array<{
    id: string;
    name: string;
    css: string;
    sourceUrl: string;
    evidence: "documented" | "observed" | "approximation";
    description: string;
  }>;
  motion: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    easing: string;
    css: string;
    sourceUrl: string;
    evidence: "observed" | "documented" | "approximation";
  }>;
};
```

## Provenance

- Component and utility examples come from `data/curated/components.json` and `data/curated/utilities.json`. The builder keeps only substantial multi-line snippets and removes individual prop-name fragments.
- Gradient recipes mirror the pinned `packages/wds/src/utils/color.ts` output: `mask-image`, `-webkit-mask-image`, and `background-color` with documented size offsets.
- Box, frame, radius, and elevation recipes use semantic tokens from `data/curated/tokens.css` and documented component or foundation URLs.
- Home hero and shape enter timing comes from `data/raw/live-home-evidence.json`: opacity `0 -> 1`, `translate3d(0, 20px, 0) -> none`, `600ms` or `1000ms`, and `cubic-bezier(0.4, 0.14, 0.3, 1)`.
- WithInteraction press/overlay feedback, Skeleton pulse, Toast/Snackbar stack animation, and both Loading recipes are backed by the pinned public source research in `docs/SOURCE_RESEARCH.md`.
- Continuous marquee is marked as `approximation` because public captured source did not expose exact official loop timing for the reusable generic CSS version.
- Toast/Snackbar recipes expose `--wds-toast-animation-height` and `--wds-toast-animation-margin-top` defaults; override them with measured runtime values when animating dynamic content height.

## CSS usage

Load `data/curated/tokens.css` first, then `data/curated/recipes.css`.

```html
<link rel="stylesheet" href="data/curated/tokens.css">
<link rel="stylesheet" href="data/curated/recipes.css">
```

Use `.wds-reuse` on a wrapping element when you want the default recipe variables. The recipe classes are portable CSS and import nothing by themselves.

```html
<section class="wds-reuse wds-surface-card wds-motion-home-hero-enter">
  Reused Montage-style surface
</section>
```

## Regeneration

```bash
node scripts/build-reuse-library.mjs
```

The command writes:

- `data/curated/reuse-library.json`
- `data/curated/motion.json`
- `data/curated/recipes.css`
- `docs/REUSE_LIBRARY.md`
