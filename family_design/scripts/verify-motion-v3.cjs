const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/kang/.claude/skills/gstack/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const base = process.argv[2] || "http://127.0.0.1:40565";
const outDir = path.join(root, "references", "v3-review");
const outFile = path.join(outDir, "motion-validation-v3.json");

const requiredIds = [
  "hero-entry-shapes",
  "nav-dropdown",
  "pill-cta",
  "waitlist-validation",
  "backup-success",
  "timeline-status",
  "urgency-selector",
  "fun-carousel",
  "send-receive-swap",
  "padlock-security",
  "activity-addition",
  "nft-progress-star",
  "transaction-toast",
  "protection-badges",
  "wallet-assets",
  "wallet-grouping",
  "testimonial-rail",
  "faq-accordion",
  "article-hover",
  "mobile-menu",
  "wallet-drag-reorder",
  "footer-reveal"
];

const originalVideos = ["send", "receive", "swap", "nft", "watch", "activity", "onboarding", "missioncontrol", "dragdropdone"];
const expectedLabelTokens = ["원본 수치", "원본 에셋", "CSS 근거", "영상 근거", "토큰 근거", "추론 대체"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assertLocalFile(relPath) {
  const abs = path.join(root, relPath);
  assert(fs.existsSync(abs), `missing local source file ${relPath}`);
  assert(fs.statSync(abs).size > 0, `empty local source file ${relPath}`);
}

async function card(page, id) {
  return page.locator(`.fm-grid > .fm-card[data-id="${id}"]`);
}

async function action(page, id, name) {
  return (await card(page, id)).locator(`[data-action="${name}"]`);
}

async function visibleText(locator) {
  return (await locator.textContent()).replace(/\s+/g, " ").trim();
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  const errors = [];
  const failedResponses = [];
  const ignoredResponses = [];
  const checks = [];
  const failures = [];
  const screenshots = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.setDefaultTimeout(6000);

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().startsWith("https://")) {
      const failed = { url: response.url(), status: response.status() };
      if (response.url().endsWith("/source-library.js")) ignoredResponses.push(failed);
      else failedResponses.push(failed);
    }
  });

  async function closeOpenDialogs() {
    await page.evaluate(() => {
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    }).catch(() => {});
  }

  async function check(name, fn) {
    try {
      await closeOpenDialogs();
      await fn();
      checks.push({ name, status: "passed" });
    } catch (error) {
      failures.push({ name, message: error.message });
      checks.push({ name, status: "failed", message: error.message });
    } finally {
      await closeOpenDialogs();
    }
  }

  await page.goto(`${base}?motion-v3=${Date.now()}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  await check("exact 22-card motion inventory is present and ordered", async () => {
    const ids = await page.locator(".fm-grid > .fm-card").evaluateAll((cards) => cards.map((node) => node.dataset.id));
    assert.deepStrictEqual(ids, requiredIds);
    const dataIds = await page.evaluate(() => window.FamilyMotionLibrary.data.map((entry) => entry.id));
    assert.deepStrictEqual(dataIds, requiredIds);
    assert.strictEqual(await page.evaluate(() => window.FamilyMotionLibrary.count), 22);
  });

  await check("all extracted source assets referenced by motion demos exist", async () => {
    for (let index = 0; index < 69; index += 1) {
      assertLocalFile(`references/v2-source/previews/shape-${String(index).padStart(2, "0")}.svg`);
    }
    for (let index = 1; index <= 10; index += 1) {
      assertLocalFile(`references/assets/emoji-${index}.png`);
    }
    for (const name of originalVideos) {
      assertLocalFile(`references/v2-source/videos/${name}.mp4`);
      assertLocalFile(`references/v2-source/videos/${name}-poster.jpg`);
      assertLocalFile(`references/v2-source/previews/${name}-storyboard.jpg`);
    }
  });

  await check("source labels distinguish original, evidence, and inferred replacements", async () => {
    const audit = await page.locator(".fm-card").evaluateAll((cards) => cards.map((node) => ({
      id: node.dataset.id,
      label: node.querySelector(".fm-label")?.textContent.trim() || "",
      source: node.querySelector(".fm-code-source")?.textContent.trim() || "",
      note: node.querySelector(".fm-source-note")?.textContent.trim() || ""
    })));
    const missing = audit.filter((item) => !expectedLabelTokens.some((token) => item.label.includes(token)));
    assert.deepStrictEqual(missing, [], `labels lack evidence class: ${JSON.stringify(missing)}`);
    const inferred = audit.filter((item) => item.label.includes("추론 대체") || item.note.includes("비공개"));
    assert(inferred.length >= 4, "expected private/unavailable states to be marked as inferred replacements");
    assert(inferred.every((item) => /추론|대체|비공개|재구성/.test(`${item.label} ${item.note} ${item.source}`)), `inferred cards are not clearly labeled: ${JSON.stringify(inferred)}`);
  });

  await check("Fun carousel uses extracted first-party emoji assets, not handcrafted SVG stand-ins", async () => {
    const c = await card(page, "fun-carousel");
    const images = await c.locator(".fm-emoji-rail img").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src")));
    assert.strictEqual(new Set(images).size, 10, `expected 10 unique emoji assets, got ${JSON.stringify(images)}`);
    for (let index = 1; index <= 10; index += 1) {
      assert(images.includes(`references/assets/emoji-${index}.png`), `missing emoji-${index}.png in carousel`);
    }
    assert.strictEqual(await c.locator(".fm-shape-card svg").count(), 0, "fun carousel still renders SVG placeholder shapes");
  });

  await check("core controls, dialog parity, and private-state stand-ins run without errors", async () => {
    for (const id of requiredIds) {
      await (await action(page, id, "primary")).click();
      await (await action(page, id, "replay")).click();
      await (await action(page, id, "expand")).click();
      const dialog = page.locator(".fm-dialog");
      assert(await dialog.evaluate((node) => node.open), `${id} dialog did not open`);
      assert(await dialog.locator(".fm-stage").isVisible(), `${id} dialog stage is not visible`);
      await dialog.locator("[data-dialog-close]").click();
      await (await action(page, id, "reset")).click();
    }
    assert.deepStrictEqual(errors, [], `runtime errors after action sweep: ${errors.join(" | ")}`);
  });

  await check("details present implementation notes and direct source downloads", async () => {
    const missing = await page.locator(".fm-card").evaluateAll((cards) => cards.filter((node) => {
      const summary = node.querySelector(".fm-code summary")?.textContent.trim();
      const js = node.querySelector('.fm-code a[href="motion-library.js"][download]');
      const css = node.querySelector('.fm-code a[href="motion-library.css"][download]');
      return summary !== "구현 노트" || !js || !css;
    }).map((node) => node.dataset.id));
    assert.deepStrictEqual(missing, [], `cards missing implementation-note details/downloads: ${missing.join(", ")}`);
  });

  await check("FAQ, drag reorder, and reduced motion stay accessible", async () => {
    await page.evaluate(() => window.FamilyMotionLibrary.pauseAll());
    const faq = await card(page, "faq-accordion");
    await faq.locator(".fm-faq-row").nth(1).locator(".fm-faq-btn").click();
    assert.strictEqual(await faq.locator(".fm-faq-row").nth(1).locator(".fm-faq-btn").getAttribute("aria-expanded"), "true");
    assert.strictEqual(await faq.locator(".fm-faq-row").nth(0).locator(".fm-faq-btn").getAttribute("aria-expanded"), "false");

    const reorder = await card(page, "wallet-drag-reorder");
    const before = await reorder.locator("[data-drag-card] strong").evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    await reorder.locator("[data-drag-card]").first().locator('[data-move="down"]').click();
    const after = await reorder.locator("[data-drag-card] strong").evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    assert.notDeepStrictEqual(after, before, "keyboard reorder did not change order");

    await page.evaluate(() => window.FamilyMotionLibrary.setReduced(true));
    const heroVisible = await page.locator('.fm-card[data-id="hero-entry-shapes"] .fm-hero-shape').evaluateAll((nodes) => nodes.filter((node) => {
      const style = getComputedStyle(node);
      return style.opacity === "1" && node.getBoundingClientRect().width > 10;
    }).length);
    assert(heroVisible >= 12, `reduced motion hid hero source shapes: ${heroVisible}`);
    await page.evaluate(() => window.FamilyMotionLibrary.setReduced(false));
  });

  await check("filter search and reveal cover all aliases including footer", async () => {
    const library = page.locator(".fm-library");
    await library.locator('[data-filter="intro"]').click();
    assert(await (await card(page, "footer-reveal")).evaluate((node) => !node.hidden), "intro filter hid footer-reveal");
    await library.locator('[data-filter="all"]').click();
    await library.locator("[data-search]").fill("원본 에셋");
    assert(await page.locator(".fm-card:visible").count() >= 1, "source-label search returned no visible cards");
    const found = await page.evaluate(() => Boolean(window.FamilyMotionLibrary.reveal("footer")));
    assert(found, "reveal('footer') did not resolve footer-reveal alias");
    assert(await (await card(page, "footer-reveal")).evaluate((node) => node.classList.contains("is-highlighted")), "footer reveal did not visibly highlight target");
  });

  await check("desktop and mobile motion UI screenshots are nonblank", async () => {
    await page.evaluate(() => document.querySelector("#motion").scrollIntoView({ block: "start" }));
    await wait(300);
    await page.evaluate(() => window.FamilyMotionLibrary.pauseAll());
    const desktop = path.join(outDir, "motion-after-1440.png");
    await page.screenshot({ path: desktop, fullPage: false });
    screenshots.push(path.relative(root, desktop));
    await page.evaluate(() => window.FamilyMotionLibrary.reveal("fun-carousel"));
    await wait(300);
    const fun = path.join(outDir, "motion-after-fun-1440.png");
    await page.screenshot({ path: fun, fullPage: false });
    screenshots.push(path.relative(root, fun));
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${base}?motion-v3-mobile=${Date.now()}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector("#motion").scrollIntoView({ block: "start" }));
    await wait(300);
    await page.evaluate(() => window.FamilyMotionLibrary.pauseAll());
    const mobile = path.join(outDir, "motion-after-390.png");
    await page.screenshot({ path: mobile, fullPage: false });
    screenshots.push(path.relative(root, mobile));
    for (const rel of screenshots) {
      assert(fs.statSync(path.join(root, rel)).size > 12000, `blank or tiny screenshot ${rel}`);
    }
  });

  await check("motion-owned page resources have no local failures or JS errors", async () => {
    assert.deepStrictEqual(failedResponses, [], `failed local resources: ${JSON.stringify(failedResponses)}`);
    const relevantErrors = errors.filter((message) => !message.includes("source-library.js"));
    assert.deepStrictEqual(relevantErrors, [], `runtime errors: ${relevantErrors.join(" | ")}`);
  });

  const result = {
    date: new Date().toISOString(),
    url: base,
    status: failures.length ? "failed" : "passed",
    checks,
    failures,
    errors,
    failedResponses,
    ignoredResponses,
    screenshots
  };
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + "\n");
  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  const result = {
    date: new Date().toISOString(),
    url: base,
    status: "failed",
    fatal: error.stack || error.message
  };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + "\n");
  console.error(error);
  process.exit(1);
});
