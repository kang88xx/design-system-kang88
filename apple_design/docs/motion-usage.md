# Use the collected motion code

Download `motion-code-kit.tar.gz` from the main Motion library. It contains:

- `app/public/research/motion-replay.json`: all retained replay tracks, grouped by source page and interaction.
- `app/public/research/motion-catalog.json`: CSS, JavaScript, declarative DOM, SVG and media source evidence.
- `app/public/research/runtime-sources/`: captured public response code.
- Capture/replay provenance notes.

The large original observation snapshots remain accessible through each record's `evidenceFile` and the complete research source archive. The lightweight code kit preserves every retained replay keyframe; it omits repeated observation snapshots rather than truncating animation tracks.

Choose a record and map its target selectors to elements in your own layout. For example, in a browser application:

```js
// `record` is the selected record from motion-replay.json.
// Supply your own element mapping; source selectors describe the captured site.
const targetBySourceSelector = new Map([
  [record.tracks[0].target, document.querySelector('.my-preview')],
]);
const animations = [];
for (const track of record.tracks) {
  const element = targetBySourceSelector.get(track.target);
  if (!element) continue;
  const animation = element.animate(track.keyframes, {
    ...track.timing,
    iterations: 1,
    fill: 'both',
  });
  animation.pause();
  animations.push(animation);
}
// User-triggered playback; keep automatic playback off for reduced motion.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  animations.forEach(animation => animation.play());
}
```

Native Web Animations timing is observed timing. `computed-samples` tracks interpolate captured sample offsets; their original easing/duration was not recovered. Scroll records retain a pixel range and use an explicitly normalized preview duration. Use the original values as evidence, then adapt distance, timing and target layout to the product.

The studio preview is a schematic demonstration of retained properties. Image/video/canvas scenes, CSS variable context and the original DOM are separate source dependencies. A motion rule or API call site is not counted as a verified visual effect solely because it exists in source.
