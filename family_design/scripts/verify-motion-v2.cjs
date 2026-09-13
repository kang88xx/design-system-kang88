const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/kang/.claude/skills/gstack/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const base = process.argv[2] || "http://127.0.0.1:40565";
const outDir = path.join(root, "references", "v2-review");
const outFile = path.join(outDir, "motion-validation.json");

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
  "wallet-drag-reorder"
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function visibleText(locator) {
  return (await locator.textContent()).replace(/\s+/g, " ").trim();
}

async function card(page, id) {
  return page.locator(`.fm-grid > .fm-card[data-id="${id}"]`);
}

async function action(page, id, name) {
  return (await card(page, id)).locator(`[data-action="${name}"]`);
}

async function expectChanged(label, before, after) {
  assert.notDeepStrictEqual(after, before, `${label} did not produce an observable state change`);
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  const failedResponses = [];
  const checks = [];
  const failures = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().startsWith("https://")) {
      failedResponses.push({ url: response.url(), status: response.status() });
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

  await page.goto(`${base}?motion-v2=${Date.now()}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  await check("library API and complete card set", async () => {
    const api = await page.evaluate(() => ({
      hasLibrary: Boolean(window.FamilyMotionLibrary),
      count: window.FamilyMotionLibrary && window.FamilyMotionLibrary.count,
      hasReveal: Boolean(window.FamilyMotionLibrary && window.FamilyMotionLibrary.reveal),
      ids: Array.from(document.querySelectorAll(".fm-card")).map((node) => node.dataset.id)
    }));
    assert(api.hasLibrary, "window.FamilyMotionLibrary is missing");
    assert(api.count >= 22, `expected at least 22 motion cards, found ${api.count}`);
      assert(api.hasReveal, "FamilyMotionLibrary.reveal(target) is missing");
    for (const id of requiredIds) assert(api.ids.includes(id), `missing card ${id}`);
  });

  await check("all cards expose visual stage, explanation, code note, and control actions", async () => {
    const audit = await page.locator(".fm-card").evaluateAll((cards) => cards.map((node) => ({
      id: node.dataset.id,
      title: Boolean(node.querySelector("h3")?.textContent.trim()),
      stage: Boolean(node.querySelector(".fm-stage")?.textContent.trim() || node.querySelector(".fm-stage svg,img,button,video,form")),
      description: Boolean(node.querySelector(".fm-desc")?.textContent.trim()),
      how: Boolean(node.querySelector(".fm-how")?.textContent.trim()),
      code: Boolean(node.querySelector(".fm-code pre")?.textContent.trim()),
      actions: ["primary", "replay", "reset", "expand"].every((name) => node.querySelector(`[data-action="${name}"]`))
    })));
    const incomplete = audit.filter((item) => !item.title || !item.stage || !item.description || !item.how || !item.code || !item.actions);
    assert.deepStrictEqual(incomplete, [], `incomplete cards: ${JSON.stringify(incomplete)}`);
  });

  await check("all primary, replay, reset, and expand actions run without runtime errors", async () => {
    const ids = await page.locator(".fm-card").evaluateAll((cards) => cards.map((node) => node.dataset.id));
    for (const id of ids) {
      await (await action(page, id, "primary")).click();
      await (await action(page, id, "replay")).click();
      assert(await (await card(page, id)).evaluate((node) => node.classList.contains("is-replaying") || node.classList.contains("is-active")), `${id} replay did not mark motion state`);
      await (await action(page, id, "expand")).click();
      const dialog = page.locator(".fm-dialog");
      assert(await dialog.evaluate((node) => node.open), `${id} dialog did not open`);
      assert(await dialog.locator(".fm-stage").isVisible(), `${id} dialog stage is not visible`);
      assert(await dialog.locator("button, [tabindex], input").count() > 0, `${id} dialog has no interactive controls`);
      await dialog.locator("[data-dialog-close]").click();
      await (await action(page, id, "reset")).click();
    }
    assert.deepStrictEqual(errors, [], `runtime errors after action sweep: ${errors.join(" | ")}`);
  });

  await check("hero ornament drag moves then snaps back", async () => {
    const hero = await card(page, "hero-entry-shapes");
    await (await action(page, "hero-entry-shapes", "reset")).click();
    await hero.scrollIntoViewIfNeeded();
    const index = await hero.evaluate((node) => {
      const shapes = Array.from(node.querySelectorAll(".fm-draggable"));
      return shapes.findIndex((shape) => {
        const box = shape.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return box.width >= 20 && box.height >= 20 && (hit === shape || shape.contains(hit));
      });
    });
    assert(index >= 0, "no hit-testable hero shape found");
    const blob = hero.locator(".fm-draggable").nth(index);
    const box = await blob.boundingBox();
    assert(box, "hero draggable blob has no box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 4 });
    const moved = await blob.evaluate((node) => getComputedStyle(node).transform);
    await page.mouse.up();
    await wait(650);
    const snapped = await blob.evaluate((node) => getComputedStyle(node).transform);
    assert.notStrictEqual(moved, "none", "drag did not apply transform");
    const offset = snapped === "none" ? [0, 0] : (snapped.match(/matrix\(([^)]+)\)/)?.[1] || "")
      .split(",")
      .map((value) => Number(value.trim()))
      .slice(4, 6);
    assert(offset.length === 2 && offset.every((value) => Math.abs(value) < 0.5), `drag did not snap back: ${snapped}`);
  });

  await check("urgency selector cycles numeric semantic states", async () => {
    await page.evaluate(()=>FamilyMotionLibrary.pauseAll());
    const c = await card(page, "urgency-selector");
    const read = () => c.locator("[data-urgency-time]").textContent();
    const seen = new Set([await read()]);
    for (let i = 0; i < 3; i += 1) {
      await (await action(page, "urgency-selector", "primary")).click();
      await page.waitForTimeout(850);
      seen.add(await read());
    }
    for (const value of ["~15 Secs", "~30 Secs", "~60 Secs"]) assert(seen.has(value), `missing urgency value ${value}`);
  });

  await check("backup loop has three observable states and reduced hero stays visible", async()=>{
    await page.evaluate(()=>FamilyMotionLibrary.pauseAll());
    const c=await card(page,"backup-success"),seen=new Set();
    for(let i=0;i<3;i++){await (await action(page,"backup-success","primary")).click();seen.add(await c.locator('[data-backup-label]').textContent());}
    assert.equal(seen.size,3);
    await page.evaluate(()=>{FamilyMotionLibrary.setReduced(true);FamilyMotionLibrary.reveal('hero-entry-shapes');});
    const visible=await page.locator('.fm-hero-stage .fm-hero-shape').evaluateAll(es=>es.filter(e=>getComputedStyle(e).opacity==='1'&&e.getBoundingClientRect().width>10).length);
    assert(visible>=12,'Reduced motion hid finished hero shapes');
    await page.evaluate(()=>FamilyMotionLibrary.setReduced(false));
  });

  await check("fun carousel advances through multiple visual states", async () => {
    const c = await card(page, "fun-carousel");
    const states = new Set();
    for (let i = 0; i < 4; i += 1) {
      states.add(await c.locator(".fm-carousel").getAttribute("data-slide"));
      await (await action(page, "fun-carousel", "primary")).click();
    }
    assert(states.size >= 4, `expected 4 carousel states, got ${Array.from(states).join(",")}`);
  });

  await check("Easy preview exposes send, receive, swap, and purchase semantics", async () => {
    const c = await card(page, "send-receive-swap");
    const labels = await c.evaluate((node) => node.textContent);
    for (const term of ["Send", "Receive", "Swap"]) assert(labels.includes(term), `missing ${term} control`);
    assert(/Purchase/i.test(labels), "missing Purchase state/control");
    for (const type of ["send", "receive", "swap", "purchase"]) {
      await c.locator(`[data-icon-action="${type}"]`).click();
      assert(await c.locator(`.fm-icon-orb.is-${type}`).count(), `${type} action did not set icon state`);
    }
  });

  await check("NFT media progress and star toggle are visible and stateful", async () => {
    const c = await card(page, "nft-progress-star");
    const star = c.locator("[data-star]");
    assert.strictEqual(await star.getAttribute("aria-pressed"), "false");
    await star.click();
    assert.strictEqual(await star.getAttribute("aria-pressed"), "true");
    const width = await c.locator(".fm-progress span").evaluate((node) => getComputedStyle(node).width);
    assert.notStrictEqual(width, "0px", "progress bar has no visible width");
  });

  await check("FAQ spring expansion keeps one open row and toggles plus/minus", async () => {
    const c = await card(page, "faq-accordion");
    const rows = c.locator(".fm-faq-row");
    await rows.nth(1).locator(".fm-faq-btn").click();
    assert.strictEqual(await rows.nth(1).locator(".fm-faq-btn").getAttribute("aria-expanded"), "true");
    assert.strictEqual(await rows.nth(0).locator(".fm-faq-btn").getAttribute("aria-expanded"), "false");
    await page.waitForTimeout(650);
    const verticalScale = await rows.nth(1).locator(".fm-plus b").evaluate((node) => getComputedStyle(node).transform);
    assert(verticalScale.includes("0") || verticalScale === "none", `open row plus did not collapse vertical bar: ${verticalScale}`);
    const height = await rows.nth(1).locator(".fm-faq-answer").evaluate((node) => getComputedStyle(node).height);
    assert(!height.startsWith("0px"), `answer did not expand: ${height}`);
  });

  await check("activity action prepends row and caps list length", async () => {
    const c = await card(page, "activity-addition");
    const before = await c.locator(".fm-activity-row").first().textContent();
    for (let i = 0; i < 5; i += 1) await (await action(page, "activity-addition", "primary")).click();
    const after = await c.locator(".fm-activity-row").first().textContent();
    await expectChanged("activity row", before, after);
    assert.strictEqual(await c.locator(".fm-activity-row").count(), 4);
  });

  await check("wallet reorder supports keyboard buttons and native drag/drop", async () => {
    const c = await card(page, "wallet-drag-reorder");
    const order = async () => c.locator("[data-drag-card] strong").evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    const before = await order();
    await c.locator("[data-drag-card]").first().locator('[data-move="down"]').click();
    const afterButton = await order();
    await expectChanged("keyboard reorder", before, afterButton);
    const source = c.locator("[data-drag-card]").last();
    const target = c.locator("[data-drag-card]").first();
    await source.dragTo(target);
    const afterDrag = await order();
    await expectChanged("native drag reorder", afterButton, afterDrag);
  });

  await check("wallet grouping selection changes labels", async () => {
    const c = await card(page, "wallet-grouping");
    await c.locator('[data-group="Work"]').click();
    assert.strictEqual(await visibleText(c.locator("[data-group-label]")), "Work wallets");
    assert.strictEqual(await visibleText(c.locator("[data-group-count]")), "2 wallets");
    await c.locator('[data-group="Vault"]').click();
    assert.strictEqual(await visibleText(c.locator("[data-group-label]")), "Vault wallets");
  });

  await check("filter, search, and reveal expose discoverable card navigation", async () => {
    const library = page.locator(".fm-library");
    await library.locator('[data-filter="content"]').click();
    assert(await (await card(page, "hero-entry-shapes")).evaluate((node) => node.hidden), "filter did not hide non-matching cards");
    await library.locator('[data-filter="all"]').click();
    const search = library.locator('input[type="search"], [data-search]');
    assert(await search.count(), "motion library search input is missing");
    await search.first().fill("wallet");
    assert(await page.locator('.fm-card[data-id*="wallet"]:visible').count(), "search did not reveal wallet cards");
    await page.evaluate(() => window.FamilyMotionLibrary.reveal("nft-media"));
    const nft = await card(page, "nft-progress-star");
    assert(await nft.evaluate((node) => !node.hidden), "reveal alias did not unhide target");
    assert(await nft.evaluate((node) => node.classList.contains("fm-highlight") || node.classList.contains("is-active")), "reveal did not visibly mark target");
  });

  await check("expanded dialog keeps interactive parity for representative cards", async () => {
    for (const [id, selector, expected] of [
      ["urgency-selector", '[data-choice="Normal"]', "~60 Secs"],
      ["wallet-grouping", '[data-group="Vault"]', "Vault wallets"],
      ["faq-accordion", ".fm-faq-row:nth-child(2) .fm-faq-btn", "true"]
    ]) {
      await (await action(page, id, "expand")).click();
      const dialog = page.locator(".fm-dialog");
      await dialog.locator(selector).click();
      await page.waitForFunction(expected=>document.querySelector('.fm-dialog[open]')?.textContent.includes(expected),expected,{timeout:2000});
      const text = await visibleText(dialog);
      assert(text.includes(expected), `${id} dialog interaction did not produce ${expected}`);
      await dialog.locator("[data-dialog-close]").click();
    }
  });

  await check("offscreen/pause/reduced motion suspend autonomous animation", async () => {
    const c = await card(page, "timeline-status");
    await c.scrollIntoViewIfNeeded();
    const read = () => c.locator(".fm-timeline").getAttribute("data-step");
    await page.evaluate(()=>{if(document.querySelector('.fm-library').classList.contains('fm-paused'))document.querySelector('.fm-tool[data-tool="pause"]').click();});
    const beforePause = await read();
    await page.locator('.fm-tool[data-tool="pause"]').evaluate(b=>b.click());
    await wait(2300);
    assert.strictEqual(await read(), beforePause, "pause all did not suspend timeline loop");
    await page.locator('.fm-tool[data-tool="pause"]').evaluate(b=>b.click());
    await page.locator('.fm-tool[data-tool="reduced"]').evaluate(b=>b.click());
    const beforeReduced = await read();
    await wait(2300);
    assert.strictEqual(await read(), beforeReduced, "reduced motion did not suspend timeline loop");
    assert.strictEqual(await page.locator('.fm-tool[data-tool="reduced"]').getAttribute("aria-pressed"), "true");
    await page.locator('.fm-tool[data-tool="reduced"]').evaluate(b=>b.click());
    await page.locator("#overview").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('.fm-card[data-id="timeline-status"]').classList.contains("is-paused"),null,{timeout:2000});
    const offscreen = await c.evaluate((node) => node.classList.contains("is-paused"));
    assert(offscreen, "offscreen card was not marked paused by IntersectionObserver");
  });

  await check("global page has no local resource failures or JS errors", async () => {
    assert.deepStrictEqual(failedResponses, [], `failed local resources: ${JSON.stringify(failedResponses)}`);
    assert.deepStrictEqual(errors, [], `runtime errors: ${errors.join(" | ")}`);
  });

  const result = {
    date: new Date().toISOString(),
    url: base,
    status: failures.length ? "failed" : "passed",
    checks,
    failures,
    errors,
    failedResponses
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
