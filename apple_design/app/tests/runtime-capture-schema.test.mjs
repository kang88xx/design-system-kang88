import assert from "node:assert/strict";
import test from "node:test";

import {
  changedProperties,
  createEmptyManifest,
  makeRecordId,
  signatureForRecord,
  updateTotals,
  viewportPresets,
} from "../../scripts/runtime-motion-schema.mjs";

test("runtime motion schema exposes required viewports", () => {
  assert.deepEqual(viewportPresets.desktop, {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    isMobile: false,
  });
  assert.deepEqual(viewportPresets.mobile, {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
  });
});

test("runtime motion helpers report real property changes only", () => {
  assert.deepEqual(
    changedProperties(
      { transform: "none", opacity: "1", filter: "none" },
      { transform: "matrix(1, 0, 0, 1, 0, 20)", opacity: "1", filter: "none" },
    ),
    ["transform"],
  );
});

test("runtime manifest totals are derived from page coverage and records", () => {
  const manifest = createEmptyManifest({
    generatedAt: "2026-09-07T00:00:00.000Z",
    scope: { pages: ["home"], viewports: ["desktop"] },
    pages: [
      {
        id: "home",
        title: "Apple",
        url: "https://www.apple.com/",
        status: "ok",
        viewports: ["desktop"],
        coverage: [
          {
            viewport: "desktop",
            controlsDiscovered: 3,
            controlsTested: 2,
          },
        ],
      },
    ],
    resources: [{ file: "/research/runtime-sources/example.js", url: "https://example.test/a.js" }],
  });

  manifest.records.push({
    id: makeRecordId(["home", "desktop", "hover", ".card"]),
    pageId: "home",
    trigger: "hover",
    kind: "transition",
    status: "observed",
    viewport: "desktop",
    selector: ".card",
    properties: ["transform"],
  });
  manifest.records[0].dedupeSignature = signatureForRecord(manifest.records[0]);
  manifest.records.push({
    id: "blocked",
    pageId: "home",
    trigger: "click",
    kind: "state",
    status: "blocked",
    viewport: "desktop",
    selector: "button",
    properties: [],
  });

  updateTotals(manifest);

  assert.equal(manifest.totals.pages, 1);
  assert.equal(manifest.totals.viewports, 1);
  assert.equal(manifest.totals.controlsDiscovered, 3);
  assert.equal(manifest.totals.controlsTested, 2);
  assert.equal(manifest.totals.records, 2);
  assert.equal(manifest.totals.observed, 1);
  assert.equal(manifest.totals.blocked, 1);
  assert.equal(manifest.totals.resources, 1);
});

test("runtime signatures include keyframes and geometry to avoid false dedupe", () => {
  const base = {
    pageId: "home",
    viewport: "desktop",
    trigger: "hover",
    kind: "animation",
    selector: ".card",
    properties: ["transform"],
    before: { target: { rect: { x: 0, y: 0, width: 100, height: 100 } } },
    after: { target: { rect: { x: 0, y: 0, width: 100, height: 100 } } },
  };
  const translate = signatureForRecord({
    ...base,
    tracks: [{ target: ".card", timing: { duration: 300 }, keyframes: [{ offset: 1, transform: "translateY(8px)" }] }],
  });
  const scale = signatureForRecord({
    ...base,
    tracks: [{ target: ".card", timing: { duration: 300 }, keyframes: [{ offset: 1, transform: "scale(1.02)" }] }],
  });

  assert.notEqual(translate, scale);
});
