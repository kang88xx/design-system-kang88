import assert from "node:assert/strict";
import test from "node:test";
import {
  KIND_VALUES,
  STATUS_VALUES,
  countRuntime,
  filterRecords,
  hasChangingPreviewKeyframes,
  normalizeRuntime,
  previewStyleAtProgress,
  sanitizeKeyframe,
} from "../src/motion/motionData.mjs";

test("motion runtime normalization preserves raw records while sanitizing preview tracks", () => {
  const raw = {
    pages: [{ id: "home", title: "Home" }],
    records: [
      {
        id: "record-1",
        pageId: "home",
        label: "Menu flyout",
        status: "observed",
        trigger: "hover",
        kind: "animation",
        viewport: "desktop",
        selector: ".menu",
        properties: ["transform", "opacity"],
        tracks: [
          {
            target: ".menu",
            timing: {
              duration: 320,
              delay: 80,
              easing: "cubic-bezier(.4,0,.6,1)",
              fill: "both",
            },
            source: "computed-samples",
            timingProvenance: "Linear interpolation of measured sample timestamps; original easing unknown",
            scrollRange: { start: 0, end: 900, unit: "px" },
            keyframes: [
              { offset: -1, opacity: 0, transform: "translateY(-12px)", backgroundImage: "url(https://example.test/a.png)" },
              { offset: 2, opacity: 1, transform: "translateY(0)", onload: "alert(1)" },
            ],
          },
        ],
      },
    ],
  };

  const normalized = normalizeRuntime(raw);
  const record = normalized.records[0];
  assert.equal(record.rawRecord, raw.records[0]);
  assert.equal(record.tracks[0].timing.delay, 80);
  assert.equal(record.tracks[0].timing.fill, "both");
  assert.equal(record.tracks[0].source, "computed-samples");
  assert.equal(record.tracks[0].timingProvenance, "Linear interpolation of measured sample timestamps; original easing unknown");
  assert.deepEqual(record.tracks[0].scrollRange, { start: 0, end: 900, unit: "px" });
  assert.equal(record.tracks[0].keyframes[0].offset, 0);
  assert.equal(record.tracks[0].keyframes[1].offset, 1);
  assert.equal(record.tracks[0].keyframes[0].backgroundImage, undefined);
  assert.equal(record.tracks[0].keyframes[1].onload, undefined);
});

test("motion filters stay bounded to current result sets", () => {
  const runtime = normalizeRuntime({
    records: [
      { id: "a", status: "observed", pageId: "home", viewport: "desktop", trigger: "hover", kind: "animation", tracks: [{ keyframes: [{ opacity: 0 }, { opacity: 1 }] }] },
      { id: "b", status: "blocked", pageId: "store", viewport: "mobile", trigger: "click", kind: "state", tracks: [] },
    ],
  });

  assert.equal(countRuntime(runtime.records).playable, 1);
  assert.equal(countRuntime(runtime.records).blocked, 1);
  assert.deepEqual(
    filterRecords(runtime.records, {
      query: "store",
      page: "all",
      viewport: "mobile",
      trigger: "click",
      kind: "state",
      status: "blocked",
    }).map((record) => record.id),
    ["b"],
  );
});


test("playable filter selects runtime records with playable descriptors or changing tracks", () => {
  const runtime = normalizeRuntime({
    records: [
      { id: "observed-track", status: "observed", tracks: [{ keyframes: [{ opacity: 0 }, { opacity: 1 }] }] },
      { id: "descriptor", status: "observed", trackCount: 12, playableTrackCount: 4 },
      { id: "no-change", status: "no-change", tracks: [{ keyframes: [{ opacity: 1 }, { opacity: 1 }] }] },
      { id: "blocked", status: "blocked", tracks: [] },
      { id: "skipped", status: "skipped", playableTrackCount: 2 },
      { id: "source-only", status: "source-only", playableTrackCount: 2 },
    ],
  });

  assert.deepEqual(
    filterRecords(runtime.records, {
      query: "",
      page: "all",
      viewport: "all",
      trigger: "all",
      kind: "all",
      status: "playable",
    }).map((record) => record.id),
    ["observed-track", "descriptor"],
  );
  assert.ok(STATUS_VALUES.includes("playable"));
});

test("catalog kinds include SVG animation and media source declarations", () => {
  assert.ok(KIND_VALUES.includes("svg-animation"));
  assert.ok(KIND_VALUES.includes("media-source"));
});

test("keyframe sanitizer strips executable and remote CSS values", () => {
  assert.deepEqual(
    sanitizeKeyframe({
      offset: 0.5,
      transform: "translateX(12px)",
      filter: "blur(2px)",
      clipPath: "inset(0)",
      backgroundColor: "#fff",
      backgroundImage: "url(javascript:alert(1))",
      onclick: "alert(1)",
    }),
    {
      offset: 0.5,
      transform: "translateX(12px)",
      filter: "blur(2px)",
      clipPath: "inset(0)",
      backgroundColor: "#fff",
    },
  );
});


test("keyframe sanitizer uses computedOffset when Web Animations offset is null", () => {
  assert.deepEqual(
    sanitizeKeyframe({ offset: null, computedOffset: 1, opacity: 0.5 }),
    { offset: 1, opacity: "0.5" },
  );
  assert.deepEqual(
    sanitizeKeyframe({ offset: null, opacity: 1 }),
    { opacity: "1" },
  );
});

test("preview style follows all opacity segments without invented transform", () => {
  const track = {
    keyframes: [
      { offset: 0, opacity: 1 },
      { offset: 0.5, opacity: 0 },
      { offset: 1, opacity: 1 },
    ],
  };

  assert.equal(hasChangingPreviewKeyframes(track), true);
  assert.deepEqual(previewStyleAtProgress(track, 0.5), { opacity: 0 });
  assert.equal(previewStyleAtProgress(track, 0.5).transform, undefined);
});

test("runtime counts exclude tracks without supported changing preview properties", () => {
  const runtime = normalizeRuntime({
    records: [
      { id: "static", status: "observed", tracks: [{ keyframes: [{ opacity: 1 }, { opacity: 1 }] }] },
      { id: "unsupported", status: "observed", tracks: [{ keyframes: [{ color: "red" }, { color: "blue" }] }] },
      { id: "moving", status: "observed", tracks: [{ keyframes: [{ opacity: 0 }, { opacity: 1 }] }] },
      { id: "skipped", status: "skipped", tracks: [{ keyframes: [{ opacity: 0 }, { opacity: 1 }] }] },
      { id: "descriptor", status: "observed", trackCount: 12, playableTrackCount: 4, dedupeSignature: "descriptor-motion" },
    ],
  });

  assert.equal(runtime.records.at(-1).trackCount, 12);
  assert.equal(countRuntime(runtime.records).attempts, 4);
  assert.equal(countRuntime(runtime.records).playable, 2);
});
