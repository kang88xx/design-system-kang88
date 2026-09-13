#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const baseUrl = process.env.FDS_BASE_URL || "http://127.0.0.1:40565";
const fallbackPlaywright = "/home/kang/.claude/skills/gstack/node_modules/playwright";
const reportPath = path.join(root, "references/v4-review/runtime-validation.json");

async function main() {
  const moduleUrl = pathToFileURL(path.join(root, "design-system/index.js")).href;
  await import(moduleUrl);

  let playwright;
  try {
    playwright = require(process.env.PLAYWRIGHT_MODULE || fallbackPlaywright);
  } catch (error) {
    throw new Error("Playwright is required to run runtime browser checks.");
  }

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  const checks = [];

  async function check(name, fn) {
    try {
      await fn();
      checks.push({ name, status: "passed" });
    } catch (error) {
      checks.push({ name, status: "failed", message: error.message, stack: error.stack });
      throw error;
    }
  }

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.setContent(`<!doctype html>
      <html><body>
        <section id="outer-root">
          <div data-fds-tabs id="tabs-a">
            <div role="tablist" aria-label="Primary tabs">
              <button id="tab-a1" aria-controls="panel-a1" aria-selected="true">One</button>
              <button id="tab-a2" aria-controls="panel-a2">Two</button>
              <button id="tab-a3" aria-controls="panel-a3" disabled>Three</button>
            </div>
            <section id="panel-a1">Panel one</section>
            <section id="panel-a2" hidden>Panel two</section>
            <section id="panel-a3" hidden>Panel three</section>
          </div>

          <div data-fds-tabs id="tabs-vertical">
            <div role="tablist" aria-orientation="vertical">
              <button id="tab-v1" aria-controls="panel-v1" aria-selected="true">Top</button>
              <button id="tab-v2" aria-controls="panel-v2">Bottom</button>
            </div>
            <section id="panel-v1">Top panel</section>
            <section id="panel-v2" hidden>Bottom panel</section>
          </div>

          <div data-fds-accordion data-exclusive="true">
            <details id="acc-one" open><summary>One</summary><p>A</p></details>
            <details id="acc-two"><summary>Two</summary><p>B</p></details>
          </div>

          <div id="outer-nested-accordion" data-fds-accordion data-exclusive="true">
            <details id="nested-outer-one" open>
              <summary>Outer one</summary>
              <div id="inner-nested-accordion" data-fds-accordion data-exclusive="true">
                <details id="nested-inner-one" open><summary>Inner one</summary><p>A</p></details>
                <details id="nested-inner-two"><summary>Inner two</summary><p>B</p></details>
              </div>
            </details>
            <details id="nested-outer-two"><summary>Outer two</summary><p>C</p></details>
          </div>

          <button id="dialog-opener" data-fds-dialog-open="native-dialog">Open dialog</button>
          <dialog id="native-dialog">
            <button id="dialog-close" data-fds-dialog-close>Close</button>
          </dialog>

          <div data-fds-dropdown id="dropdown-a">
            <button id="dropdown-trigger" data-fds-dropdown-trigger aria-controls="dropdown-panel">Open menu</button>
            <div id="dropdown-panel" hidden>
              <button id="dropdown-item">Item</button>
            </div>
          </div>

          <section id="inner-root">
            <div data-fds-tabs id="inner-tabs">
              <div role="tablist">
                <button id="inner-tab-1" aria-controls="inner-panel-1" aria-selected="true">Inner one</button>
                <button id="inner-tab-2" aria-controls="inner-panel-2">Inner two</button>
              </div>
              <section id="inner-panel-1">Inner panel one</section>
              <section id="inner-panel-2" hidden>Inner panel two</section>
            </div>
            <dialog id="inner-owned-dialog">
              <button data-fds-dialog-close>Close inner</button>
            </dialog>
          </section>
          <button id="cross-root-dialog-opener" data-fds-dialog-open="inner-owned-dialog">Cross open inner dialog</button>

          <div data-fds-tabs>
            <div role="tablist">
              <button>Anon A1</button>
              <button>Anon A2</button>
            </div>
            <section role="tabpanel">Anon A panel</section>
            <section role="tabpanel" hidden>Anon A panel 2</section>
          </div>

          <div data-fds-tabs>
            <div role="tablist">
              <button>Anon B1</button>
              <button>Anon B2</button>
            </div>
            <section role="tabpanel">Anon B panel</section>
            <section role="tabpanel" hidden>Anon B panel 2</section>
          </div>

          <section id="invalid-panel">Must stay outside tab setup</section>
          <div data-fds-tabs id="bad-tabs">
            <div role="tablist">
              <button id="bad-tab" aria-controls="invalid-panel" aria-selected="true">Bad reference</button>
            </div>
            <section id="bad-local-panel" role="tabpanel">Local fallback</section>
          </div>
        </section>
        <script type="module">
          import { initFamilySystem } from "${baseUrl}/design-system/index.js";
          window.controllers = {
            outer: initFamilySystem(document.getElementById("outer-root")),
            outerAgain: initFamilySystem(document.getElementById("outer-root")),
            inner: initFamilySystem(document.getElementById("inner-root"))
          };
          window.tabEvents = [];
          window.dialogEvents = [];
          document.getElementById("tabs-a").addEventListener("fds:tabchange", (event) => window.tabEvents.push(event.detail));
          document.getElementById("native-dialog").addEventListener("fds:dialogchange", (event) => window.dialogEvents.push(event.detail));
        </script>
      </body></html>`, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(() => Boolean(window.controllers));

    await check("same root init is idempotent", async () => {
      assert.equal(await page.evaluate(() => window.controllers.outer === window.controllers.outerAgain), true);
    });

    await check("tabs initialize native roles and relationships", async () => {
      assert.equal(await page.locator("#tab-a1").getAttribute("role"), "tab");
      assert.equal(await page.locator("#panel-a1").getAttribute("role"), "tabpanel");
      assert.equal(await page.locator("#panel-a1").getAttribute("aria-labelledby"), "tab-a1");
    });

    await check("manual tabs move focus with keyboard and activate on Enter", async () => {
      await page.locator("#tab-a1").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(await page.evaluate(() => document.activeElement.id), "tab-a2");
      assert.equal(await page.locator("#panel-a2").evaluate((node) => node.hidden), true);
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#tab-a2").getAttribute("aria-selected"), "true");
      assert.equal(await page.locator("#panel-a1").evaluate((node) => node.hidden), true);
      assert.deepEqual(await page.evaluate(() => window.tabEvents.at(-1)), { tabId: "tab-a2", panelId: "panel-a2" });
      await page.keyboard.press("ArrowRight");
      assert.equal(await page.evaluate(() => document.activeElement.id), "tab-a1");
      await page.keyboard.press("End");
      assert.equal(await page.evaluate(() => document.activeElement.id), "tab-a2");
    });

    await check("vertical tabs use ArrowUp and ArrowDown only for vertical movement", async () => {
      await page.locator("#tab-v1").focus();
      await page.keyboard.press("ArrowDown");
      assert.equal(await page.evaluate(() => document.activeElement.id), "tab-v2");
      await page.keyboard.press(" ");
      assert.equal(await page.locator("#panel-v2").evaluate((node) => node.hidden), false);
    });

    await check("nested tabsets in one root stay isolated", async () => {
      await page.locator("#tab-a2").click();
      await page.locator("#inner-tab-2").click();
      assert.equal(await page.locator("#inner-tab-2").getAttribute("aria-selected"), "true");
      assert.equal(await page.locator("#tab-a2").getAttribute("aria-selected"), "true");
      assert.equal(await page.locator("#inner-panel-2").evaluate((node) => node.hidden), false);
    });

    await check("destroying nested root first leaves outer-owned nested attributes intact", async () => {
      await page.evaluate(() => window.controllers.inner.destroy());
      assert.equal(await page.locator("#inner-tab-1").getAttribute("role"), "tab");
      assert.equal(await page.locator("#inner-panel-1").getAttribute("role"), "tabpanel");
      await page.evaluate(async (url) => {
        const { initFamilySystem } = await import(url);
        window.controllers.inner = initFamilySystem(document.getElementById("inner-root"));
      }, `${baseUrl}/design-system/index.js`);
    });

    await check("anonymous tabsets receive collision-free generated ids", async () => {
      const ids = await page.evaluate(() => Array.from(document.querySelectorAll("[data-fds-tabs]:not([id]) [role='tab']")).map((tab) => tab.id));
      assert.equal(ids.length, new Set(ids).size);
      assert(ids.every(Boolean));
    });

    await check("tabs ignore aria-controls panels outside their own tab group", async () => {
      assert.equal(await page.locator("#invalid-panel").getAttribute("role"), null);
      assert.equal(await page.locator("#bad-local-panel").getAttribute("aria-labelledby"), "bad-tab");
    });

    await check("exclusive accordion keeps only the active detail open", async () => {
      await page.locator("#acc-two summary").click();
      await page.waitForFunction(() => document.getElementById("acc-two").open && !document.getElementById("acc-one").open);
    });

    await check("nested accordions only close details in their own accordion", async () => {
      await page.locator("#nested-inner-two summary").click();
      await page.waitForFunction(() => {
        return document.getElementById("nested-outer-one").open
          && !document.getElementById("nested-inner-one").open
          && document.getElementById("nested-inner-two").open;
      });
      await page.locator("#nested-outer-two summary").click();
      await page.waitForFunction(() => {
        return !document.getElementById("nested-outer-one").open
          && document.getElementById("nested-outer-two").open
          && document.getElementById("nested-inner-two").open;
      });
    });

    await check("native dialog uses showModal, emits state, and restores focus", async () => {
      await page.locator("#dialog-opener").focus();
      await page.locator("#dialog-opener").click();
      assert.equal(await page.locator("#native-dialog").evaluate((node) => node.open), true);
      assert.deepEqual(await page.evaluate(() => window.dialogEvents.at(-1)), { id: "native-dialog", open: true });
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("native-dialog").open);
      assert.deepEqual(await page.evaluate(() => window.dialogEvents.at(-1)), { id: "native-dialog", open: false });
      assert.equal(await page.evaluate(() => document.activeElement.id), "dialog-opener");
    });

    await check("dialog ownership ignores already-open and cross-root dialogs", async () => {
      const external = await page.evaluate(async (url) => {
        const { initFamilySystem } = await import(url);
        const root = document.createElement("section");
        root.id = "external-dialog-root";
        root.innerHTML = `
          <button id="external-dialog-opener" data-fds-dialog-open="external-dialog">Open external</button>
          <dialog id="external-dialog"><button data-fds-dialog-close>Close</button></dialog>
        `;
        document.body.append(root);
        const events = [];
        const dialog = document.getElementById("external-dialog");
        dialog.addEventListener("fds:dialogchange", (event) => events.push(event.detail));
        const controller = initFamilySystem(root);
        dialog.showModal();
        document.getElementById("external-dialog-opener").click();
        controller.destroy();
        const stillOpen = dialog.open;
        dialog.close();
        root.remove();
        return { stillOpen, events };
      }, `${baseUrl}/design-system/index.js`);
      assert.equal(external.stillOpen, true);
      assert.deepEqual(external.events, []);

      await page.locator("#cross-root-dialog-opener").click();
      assert.equal(await page.locator("#inner-owned-dialog").evaluate((node) => node.open), false);
    });

    await check("dropdown opens, closes on Escape, restores focus, and closes outside", async () => {
      await page.locator("#dropdown-trigger").click();
      assert.equal(await page.locator("#dropdown-trigger").getAttribute("aria-expanded"), "true");
      assert.equal(await page.locator("#dropdown-panel").evaluate((node) => node.hidden), false);
      await page.locator("#dropdown-item").focus();
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#dropdown-trigger").getAttribute("aria-expanded"), "false");
      assert.equal(await page.evaluate(() => document.activeElement.id), "dropdown-trigger");
      await page.locator("#dropdown-trigger").click();
      await page.mouse.click(1, 1);
      assert.equal(await page.locator("#dropdown-panel").evaluate((node) => node.hidden), true);
    });

    await check("destroy is idempotent, restores owned state, and supports reinit", async () => {
      await page.evaluate(() => window.controllers.outer.destroy());
      await page.evaluate(() => window.controllers.outer.destroy());
      assert.equal(await page.locator("#tab-a1").getAttribute("role"), null);
      assert.equal(await page.locator("#panel-a1").getAttribute("role"), null);
      assert.equal(await page.locator("#inner-tab-1").getAttribute("role"), "tab");
      assert.equal(await page.locator("#inner-panel-1").getAttribute("role"), "tabpanel");
      await page.evaluate(() => window.controllers.inner.destroy());
      assert.equal(await page.locator("#inner-tab-1").getAttribute("role"), null);
      assert.equal(await page.locator("#inner-panel-1").getAttribute("role"), null);

      await page.evaluate(async (url) => {
        const { initFamilySystem } = await import(url);
        window.controllers.reinit = initFamilySystem(document.getElementById("outer-root"));
      }, `${baseUrl}/design-system/index.js`);
      await page.locator("#tab-a1").click();
      assert.equal(await page.locator("#tab-a1").getAttribute("aria-selected"), "true");
    });
  } finally {
    const browserVersion = browser.version();
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      status: checks.every((item) => item.status === "passed") ? "passed" : "failed",
      browserName: "chromium",
      browserVersion,
      baseUrl,
      generatedAt: new Date().toISOString(),
      checks,
    }, null, 2));
    await browser.close();
  }

  console.log("Family design-system runtime checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
