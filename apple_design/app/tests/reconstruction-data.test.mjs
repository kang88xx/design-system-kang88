import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addToBag,
  airPodsFeatureDetails,
  calculateBagTotal,
  continuityDetails,
  filterSuggestions,
  menuFamilies,
  removeFromBag,
  replacementTabs,
  sourceIdsForTab,
} from "../src/reconstruction/data.mjs";

test("replacement tabs cover all 14 blocked page state ids", () => {
  const ids = replacementTabs.flatMap((tab) => tab.sourceStateIds);
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  assert.deepEqual(
    ids.toSorted(),
    [
      "01-www-apple-com-mac-state-1",
      "05-www-apple-com-airpods-state-1",
      "05-www-apple-com-airpods-state-2",
      "05-www-apple-com-airpods-state-3",
      "07-www-apple-com-tv-home-state-2",
      "07-www-apple-com-tv-home-state-3",
      "11-www-apple-com-macbook-air-state-3",
      "12-www-apple-com-iphone-17-pro-state-1",
      "13-support-apple-com-state-0",
      "13-support-apple-com-state-1",
      "13-support-apple-com-state-2",
      "13-support-apple-com-state-3",
      "iphone-pro-highlight-chip",
      "iphone-pro-silver",
    ].toSorted(),
  );
});

test("bag helpers add, increment, remove, and total local sample items", () => {
  const one = addToBag([], "iphone-pro");
  const two = addToBag(one, "iphone-pro");
  const three = addToBag(two, "airpods-pro");
  assert.deepEqual(
    three.map((item) => [item.id, item.quantity]),
    [
      ["iphone-pro", 2],
      ["airpods-pro", 1],
    ],
  );
  assert.equal(calculateBagTotal(three), 2447);
  assert.deepEqual(
    removeFromBag(three, "iphone-pro").map((item) => [item.id, item.quantity]),
    [
      ["iphone-pro", 1],
      ["airpods-pro", 1],
    ],
  );
});

test("search and tab helpers return bounded local navigation data", () => {
  assert.deepEqual(sourceIdsForTab("iphone"), [
    "12-www-apple-com-iphone-17-pro-state-1",
    "iphone-pro-highlight-chip",
    "iphone-pro-silver",
  ]);
  assert.deepEqual(filterSuggestions("silver"), ["iPhone silver color"]);
  assert.equal(filterSuggestions("").length, 5);
  assert.deepEqual(filterSuggestions("does-not-exist"), []);
});

test("reconstruction data names the corrected substitute behavior", () => {
  assert.deepEqual(
    airPodsFeatureDetails.map((item) => item.title),
    ["Heart Rate Sensing", "Live Translation", "Active Noise Cancellation"],
  );
  assert.equal(continuityDetails[0].title, "Answer calls and texts");
  assert.deepEqual(
    menuFamilies.map((item) => item.label),
    ["Store", "Mac", "iPad", "iPhone", "TV & Home", "Support"],
  );
});
