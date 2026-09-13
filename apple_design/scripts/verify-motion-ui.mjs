import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { launchBrowser } from "./browser-runtime.mjs";

const useFixture = process.argv.includes("--fixture");
const baseUrl = process.env.APP_URL || "http://localhost:4173";
const beforeImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23f5f5f7'/%3E%3Ctext x='24' y='105' font-size='28' font-family='Arial' fill='%231d1d1f'%3EBefore%3C/text%3E%3C/svg%3E";
const afterImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%231d1d1f'/%3E%3Ctext x='24' y='105' font-size='28' font-family='Arial' fill='%23ffffff'%3EAfter%3C/text%3E%3C/svg%3E";

const runtimeFixture = {
  generatedAt: "2026-09-07T00:00:00.000Z",
  scope: { fixture: true },
  pages: [
    {
      id: "home",
      title: "Apple fixture",
      url: "https://www.apple.com/",
      status: "ok",
      viewports: ["desktop", "mobile"],
      coverage: [
        {
          viewport: "desktop",
          controlsDiscovered: 2,
          controlsTested: 2,
          controlsSkipped: 0,
          hoverTargetsDiscovered: 2,
          hoverTargetsTested: 2,
          scrollSamples: 3,
          blocked: 1,
          errors: ["Fixture route only"],
        },
        {
          viewport: "mobile",
          controlsDiscovered: 1,
          controlsTested: 1,
          controlsSkipped: 0,
          hoverTargetsDiscovered: 1,
          hoverTargetsTested: 1,
          scrollSamples: 2,
          blocked: 0,
          errors: ["Fixture route only"],
        },
      ],
      supplementalCoverage: [
        { viewport: "desktop", discovered: 1, tested: 1, skipped: 0, status: "ok" },
        { viewport: "mobile", discovered: 1, tested: 1, skipped: 0, status: "ok" },
      ],
    },
  ],
  records: [
    {
      id: "scroll-track",
      pageId: "home",
      pageTitle: "Apple fixture",
      sourceUrl: "https://www.apple.com/",
      label: "Scroll hero pin",
      trigger: "scroll",
      kind: "scroll",
      status: "observed",
      viewport: "desktop",
      selector: ".hero-pin",
      summary: "Measured scroll samples mapped to schematic replay.",
      properties: ["transform", "opacity"],
      tracks: [
        {
          target: ".hero-pin",
          source: "computed-samples",
          timingProvenance: "Preview maps recorded scroll distance to 1000ms; not original",
          scrollRange: { start: 0, end: 820, unit: "px" },
          timing: { duration: 1000, easing: "linear", iterations: 1, fill: "both" },
          keyframes: [
            { offset: 0, opacity: 0, transform: "translate3d(0, 64px, 0) scale(.9)" },
            { offset: 1, opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ],
        },
      ],
      file: "/research/fixtures/scroll-track.json",
    },
    {
      id: "fade-track",
      pageId: "home",
      pageTitle: "Apple fixture",
      sourceUrl: "https://www.apple.com/",
      label: "Flyout fade",
      trigger: "hover",
      kind: "animation",
      status: "observed",
      viewport: "mobile",
      selector: ".flyout",
      summary: "Web Animations API captured with raw timing.",
      properties: ["opacity", "transform"],
      tracks: [
        {
          target: ".flyout",
          source: "web-animations",
          timingProvenance: "Raw Web Animations timing",
          timing: { duration: 320, delay: 80, easing: "cubic-bezier(.4,0,.6,1)", iterations: 1, fill: "both" },
          keyframes: [
            { offset: 0, opacity: 0, transform: "translateY(-12px)" },
            { offset: 1, opacity: 1, transform: "translateY(0)" },
          ],
        },
      ],
      file: "/research/fixtures/fade-track.json",
    },
    {
      id: "blocked-track",
      pageId: "home",
      pageTitle: "Apple fixture",
      sourceUrl: "https://www.apple.com/",
      label: "Blocked modal",
      trigger: "click",
      kind: "state",
      status: "blocked",
      viewport: "desktop",
      selector: ".modal",
      summary: "Attempt blocked by fixture condition.",
      properties: [],
      tracks: [],
      file: "/research/fixtures/blocked-track.json",
      error: "Fixture blocked state",
    },
    {
      id: "multi-track",
      pageId: "home",
      pageTitle: "Apple fixture",
      sourceUrl: "https://www.apple.com/",
      label: "Gallery multi-track",
      trigger: "autoplay",
      kind: "animation",
      status: "observed",
      viewport: "desktop",
      selector: ".gallery",
      summary: "Nine captured targets verify track pagination.",
      properties: ["opacity", "transform"],
      tracks: Array.from({ length: 9 }, (_, index) => ({
        target: `.gallery-item-${index + 1}`,
        source: "web-animations",
        timingProvenance: "Raw Web Animations timing",
        timing: { duration: 500, easing: "linear", iterations: 1, fill: "both" },
        keyframes: [
          { offset: 0, opacity: 0, transform: `translateX(${20 + index}px)` },
          { offset: 1, opacity: 1, transform: "translateX(0)" },
        ],
      })),
      file: "/research/fixtures/multi-track.json",
    },
    {
      id: "skipped-track",
      pageId: "home",
      pageTitle: "Apple fixture",
      sourceUrl: "https://www.apple.com/",
      label: "Hidden nav link",
      trigger: "hover",
      kind: "state",
      status: "skipped",
      viewport: "desktop",
      selector: ".hidden-nav",
      summary: "Fixture skipped inventory.",
      skipReason: "Hidden link not user-visible.",
      tracks: [],
      file: "/research/fixtures/skipped-track.json",
    },
  ],
  resources: [],
  totals: { observed: 3, blocked: 1, skipped: 1 },
};

const detailFixtures = Object.fromEntries(
  runtimeFixture.records.map((record) => [
    record.file,
    {
      ...record,
      detailOnly: true,
      before: { screenshot: beforeImage, label: "Original before" },
      after: { screenshot: afterImage, label: "Original after" },
      tracks: record.tracks.map((track) => ({
        ...track,
        rawTiming: track.timing,
        keyframes: track.keyframes.map((frame) => ({ ...frame, rawFrame: true })),
      })),
    },
  ]),
);
detailFixtures["/research/fixtures/blocked-track.json"].before = { url: "https://www.apple.com/" };
detailFixtures["/research/fixtures/blocked-track.json"].after = { src: "https://www.apple.com/shop/" };

runtimeFixture.records = runtimeFixture.records.map((record) => ({
  ...Object.fromEntries(
    Object.entries(record).filter(([key]) => !["tracks", "before", "after"].includes(key)),
  ),
  trackCount: record.tracks.length,
  playableTrackCount: record.status === "observed" ? record.tracks.length : 0,
}));

const catalogFixture = {
  generatedAt: runtimeFixture.generatedAt,
  pages: [{ id: "home", title: "Apple fixture", url: "https://www.apple.com/" }],
  summary: { cssRules: 2, declarations: 4, javascriptCalls: 1, sourceFiles: 4 },
  records: [
    {
      id: "source-keyframe",
      pageIds: ["home"],
      pageTitles: ["Apple fixture"],
      sourceUrl: "https://www.apple.com/source.css",
      file: "/research/files/source.css",
      selector: ".flyout",
      label: "flyout-fade",
      kind: "css-keyframes",
      trigger: "hover",
      status: "source-only",
      code: "@keyframes flyout-fade{0%{opacity:0}100%{opacity:1}}",
    },
    {
      id: "source-js",
      pageIds: ["home"],
      pageTitles: ["Apple fixture"],
      sourceUrl: "https://www.apple.com/source.js",
      file: "/research/files/source.js",
      selector: ".hero-pin",
      label: "hero animate call",
      kind: "js-animation",
      trigger: "scroll",
      status: "source-only",
      code: "element.animate([{opacity:0},{opacity:1}], {duration: 1000})",
    },
    {
      id: "source-svg",
      pageIds: ["home"],
      pageTitles: ["Apple fixture"],
      sourceUrl: "https://www.apple.com/source.svg",
      file: "/research/files/source.svg",
      selector: "svg animateTransform",
      label: "svg orbit animateTransform",
      kind: "svg-animation",
      trigger: "autoplay",
      status: "source-only",
      code: "<animateTransform attributeName=\"transform\" type=\"rotate\" from=\"0\" to=\"360\" dur=\"4s\" repeatCount=\"indefinite\" />",
    },
    {
      id: "source-media",
      pageIds: ["home"],
      pageTitles: ["Apple fixture"],
      sourceUrl: "https://www.apple.com/hero-video.html",
      file: "/research/files/hero-video.html",
      selector: "video.hero",
      label: "hero product video",
      kind: "media-source",
      trigger: "autoplay",
      status: "source-only",
      code: "<video class=\"hero\" poster=\"https://www.apple.com/media/poster.jpg\"><source src=\"https://www.apple.com/media/hero.mp4\" type=\"video/mp4\"></video>",
      media: {
        kind: "video",
        sources: ["https://www.apple.com/media/hero.mp4"],
        poster: "https://www.apple.com/media/poster.jpg",
      },
    },
  ],
};

async function installFixtureRoutes(page) {
  await page.route(`${baseUrl}/research/runtime-motion.json`, (route) =>
    route.fulfill({ json: runtimeFixture }),
  );
  await page.route(`${baseUrl}/research/motion-catalog.json`, (route) =>
    route.fulfill({ json: catalogFixture }),
  );
  for (const [file, detail] of Object.entries(detailFixtures)) {
    await page.route(`${baseUrl}${file}`, (route) => route.fulfill({ json: detail }));
  }
}

const browser = await launchBrowser();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (useFixture) await installFixtureRoutes(page);

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.goto(`${baseUrl}/#motion`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator(".motion-library").waitFor();
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      true,
      `no horizontal overflow at ${width}`,
    );
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/#motion`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".motion-library").waitFor();
  assert.match(await page.locator("main").innerText(), /Motion library/);

  if (useFixture) {
    await page.getByRole("button", { name: /Scroll hero pin/ }).waitFor();
    assert.equal(await page.getByLabel("Status").inputValue(), "playable");
    assert.match(await page.locator("main").innerText(), /전체 모션 코드 다운로드/);
    assert.match(await page.locator("main").innerText(), /3\s+Replayable records/);
    assert.match(await page.locator("main").innerText(), /4 \/ 0 \/ 1/);
    assert.match(await page.locator("main").innerText(), /1 page · 2 viewports · Coverage details/);
    await page.getByText("1 page · 2 viewports · Coverage details").click();
    assert.match(await page.locator("main").innerText(), /discovered 2 \/ tested 2 \/ hover targets 2\/2 \/ scroll samples 3 \/ blocked 1 \/ skipped 0/);
    assert.match(await page.locator("main").innerText(), /native input/);
    assert.equal(await page.getByRole("button", { name: /Blocked modal/ }).count(), 0);

    await page.getByPlaceholder("page, trigger, selector, source").fill("scroll hero");
    await page.getByRole("heading", { name: "Scroll hero pin" }).waitFor();
    await page.getByText("Original captured states").waitFor();
    assert.equal(await page.locator(".motion-evidence-thumbs img").count(), 2);
    assert.equal(await page.locator(".motion-evidence-thumbs img").evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).length), 0);
    await page.getByLabel("Scroll progress").fill("0.7");
    assert.match(await page.locator(".motion-preview-shell").innerText(), /not original|관찰값 기반 도식 재생/);

    await page.getByPlaceholder("page, trigger, selector, source").fill("fade");
    await page.getByRole("heading", { name: "Flyout fade" }).waitFor();
    await page.getByText("JSON / fetched original runtime record").waitFor();
    assert.equal(await page.locator(".motion-preview-item").count(), 1);
    await page.getByRole("button", { name: "Replay" }).click();
    await page.waitForTimeout(120);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const pausedStyle = await page.locator(".motion-preview-item").first().evaluate((node) => ({
      opacity: Number(getComputedStyle(node).opacity),
      transform: getComputedStyle(node).transform,
      currentTime: node.getAnimations()[0]?.currentTime,
    }));
    assert.ok(pausedStyle.opacity > 0 && pausedStyle.opacity < 1, `paused opacity was ${pausedStyle.opacity}`);
    assert.notEqual(pausedStyle.transform, "none");
    assert.ok(Number(pausedStyle.currentTime) > 0);
    await page.getByLabel("Scrub").fill("0.25");
    const scrubbedTransform = await page.locator(".motion-preview-item").first().evaluate((node) => getComputedStyle(node).transform);
    assert.notEqual(scrubbedTransform, "none");
    assert.match(await page.locator(".motion-preview-shell").innerText(), /Raw Web Animations timing/);

    await page.getByLabel("Scrub").fill("0.1");
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.waitForTimeout(20);
    const beforeSpeedTime = await page.locator(".motion-preview-item").first().evaluate((node) => node.getAnimations()[0]?.currentTime || 0);
    await page.getByLabel("Speed").fill("2");
    await page.waitForTimeout(30);
    const afterSpeedState = await page.locator(".motion-preview-item").first().evaluate((node) => {
      const animation = node.getAnimations()[0];
      return { playState: animation?.playState, currentTime: animation?.currentTime || 0 };
    });
    assert.equal(afterSpeedState.playState, "running");
    assert.ok(afterSpeedState.currentTime > beforeSpeedTime, `speed change stopped playback at ${afterSpeedState.currentTime}`);
    await page.getByRole("button", { name: "Replay" }).click();
    await page.waitForTimeout(60);
    const replayState = await page.locator(".motion-preview-item").first().evaluate((node) => {
      const animation = node.getAnimations()[0];
      return { playState: animation?.playState, currentTime: animation?.currentTime || 0 };
    });
    assert.equal(replayState.playState, "running");
    assert.ok(replayState.currentTime >= 0);
    await page.getByRole("button", { name: "Pause", exact: true }).click();

    await page.locator(".motion-code").first().getByRole("button", { name: "Copy" }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /"detailOnly": true/);
    assert.match(copied, /"rawTiming"/);
    assert.match(copied, /"rawFrame": true/);

    await page.getByPlaceholder("page, trigger, selector, source").fill("Gallery multi-track");
    await page.getByRole("heading", { name: "Gallery multi-track" }).waitFor();
    await page.getByText("Tracks 1-8 of 9").waitFor();
    await page.getByRole("button", { name: "Next tracks" }).click();
    await page.getByText("Tracks 9-9 of 9").waitFor();
    await page.locator(".motion-preview-stage small").filter({ hasText: /^9$/ }).waitFor();
    const stageLabels = await page.locator(".motion-preview-stage small").evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));
    assert.deepEqual(stageLabels, ["9"]);
    await page.getByText("Visible track target selectors").click();
    await page.locator(".motion-target-list li", { hasText: ".gallery-item-9" }).waitFor();

    await page.getByPlaceholder("page, trigger, selector, source").fill("");
    await page.getByLabel("Status").selectOption("skipped");
    await page.getByRole("heading", { name: "Hidden nav link" }).waitFor();
    assert.match(await page.locator("main").innerText(), /skipped/);

    await page.getByLabel("Status").selectOption("blocked");
    await page.getByRole("heading", { name: "Blocked modal" }).waitFor();
    assert.equal(await page.locator(".motion-evidence-thumbs img").count(), 0);

    await page.getByPlaceholder("page, trigger, selector, source").fill("no-such-motion-record");
    await page.getByText("No matching runtime records").waitFor();
    assert.doesNotMatch(await page.locator("main").innerText(), /Flyout fade/);

    await page.getByRole("tab", { name: "Source declarations" }).click();
    await page.getByPlaceholder("page, trigger, selector, source").fill("animate call");
    await page.getByRole("heading", { name: "hero animate call" }).waitFor();
    assert.match(await page.locator("main").innerText(), /SOURCE \/ exact declaration/);

    await page.getByLabel("Type").selectOption("svg-animation");
    await page.getByPlaceholder("page, trigger, selector, source").fill("orbit");
    await page.getByRole("heading", { name: "svg orbit animateTransform" }).waitFor();
    assert.match(await page.locator("main").innerText(), /animateTransform/);

    await page.getByLabel("Type").selectOption("media-source");
    await page.getByPlaceholder("page, trigger, selector, source").fill("product video");
    await page.getByRole("heading", { name: "hero product video" }).waitFor();
    assert.match(await page.locator("main").innerText(), /Exact media source URLs/);
    await page.getByRole("link", { name: /https:\/\/www\.apple\.com\/media\/hero\.mp4/ }).waitFor();
    assert.equal(await page.locator("video, audio").count(), 0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("tab", { name: "Observed runtime" }).click();
    await page.getByLabel("Status").selectOption("all");
    await page.getByLabel("Type").selectOption("all");
    await page.getByPlaceholder("page, trigger, selector, source").fill("fade");
    await page.getByRole("heading", { name: "Flyout fade" }).waitFor();
    assert.match(await page.locator(".motion-preview-shell").innerText(), /Reduced motion is active/);
  } else {
    const body = await page.locator("main").innerText();
    assert.doesNotMatch(body, /0\s+Replayable records/);
    await page.locator(".motion-code").first().getByText(/JSON \/ fetched original runtime record/).waitFor();
    await page.locator(".motion-code").first().getByRole("button", { name: "Copy" }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /"tracks"/);
    assert.match(copied, /"keyframes"/);
    await page.getByRole("tab", { name: "Source declarations" }).click();
    await page.locator(".motion-library").waitFor();
    const digest = (body) => createHash("sha256").update(body).digest("hex");
    for (const file of ["motion-code-kit.tar.gz", "research-source-kit.tar.gz", "source-design-system-0.1.0.tgz"]) {
      const response = await fetch(`${baseUrl}/${file}`);
      assert.equal(response.status, 200, file);
      assert.equal(response.headers.get("content-encoding"), null, `${file} must stay compressed as a downloaded artifact`);
      assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(await fs.readFile(`app/public/${file}`)), `${file} download hash`);
    }
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "전체 모션 코드 다운로드", exact: true }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "motion-code-kit.tar.gz");
    assert.equal(digest(await fs.readFile(await download.path())), digest(await fs.readFile("app/public/motion-code-kit.tar.gz")), "Browser download preserves gzip bytes");
  }

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, fixture: useFixture }, null, 2));
} finally {
  await browser.close();
}
