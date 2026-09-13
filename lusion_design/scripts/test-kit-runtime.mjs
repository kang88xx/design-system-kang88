import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, executablePath } = require("./browser-runtime.cjs");

const rootDir = resolve(".");
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"]
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = url.pathname === "/" ? "/test.html" : url.pathname;
    if (pathname === "/test.html") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<!doctype html>
        <html>
          <head><meta charset="utf-8"><title>kit runtime test</title></head>
          <body>
            <div id="outside"><button data-ds-toast="outside">Outside</button></div>
            <main id="a" class="ds-root">
              <section data-ds-tabs>
                <button id="tab-a1" role="tab" aria-controls="panel-a1">One</button>
                <button id="tab-a2" role="tab" aria-controls="panel-a2"><span>Two</span></button>
                <div id="panel-a1" role="tabpanel">Panel one</div>
                <div id="panel-a2" role="tabpanel">Panel two</div>
                <div data-ds-tabs>
                  <button id="tab-nested" role="tab" aria-controls="panel-nested">Nested</button>
                  <div id="panel-nested" role="tabpanel">Nested panel</div>
                </div>
              </section>
              <section id="vertical-tabs" data-ds-tabs>
                <div role="tablist" aria-orientation="vertical" aria-label="Vertical tabs">
                  <button id="tab-v1" role="tab" aria-controls="panel-v1" aria-selected="true">First</button>
                  <button id="tab-v-disabled" role="tab" aria-controls="panel-v-disabled" disabled>Disabled</button>
                  <button id="tab-v2" role="tab" aria-controls="panel-v2">Second</button>
                </div>
                <div id="panel-v1" role="tabpanel">Vertical one</div>
                <div id="panel-v-disabled" role="tabpanel">Vertical disabled</div>
                <div id="panel-v2" role="tabpanel">Vertical two</div>
              </section>
              <button id="open-a" data-ds-dialog-open="dialog-a">Open</button>
              <dialog id="dialog-a"><button id="close-a" data-ds-dialog-close>Close</button></dialog>
              <dialog id="user-open-dialog" open><button>User opened</button></dialog>
              <button id="toast-a" data-ds-toast="Saved">Toast</button>
              <div id="toast-region-a" data-ds-toast-region></div>
              <p id="reveal-a" data-ds-reveal>Reveal text stays readable.</p>
              <button id="magnetic-a" data-ds-magnetic="0.2">Magnetic</button>
              <aside id="nested-root" class="ds-root">
                <button id="nested-toast" data-ds-toast="nested">Nested toast</button>
                <div id="nested-toast-region" data-ds-toast-region></div>
                <dialog id="nested-dialog"></dialog>
              </aside>
            </main>
            <main id="b" class="ds-root">
              <button id="toast-b" data-ds-toast="Other root">Toast B</button>
              <div id="toast-region-b" data-ds-toast-region></div>
            </main>
          </body>
        </html>`);
      return;
    }

    const filePath = resolve(rootDir, "." + pathname);
    if (!filePath.startsWith(rootDir)) throw new Error("Invalid path.");
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": mimeTypes.get(extname(filePath)) || "application/octet-stream" });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end(String(error.message || error));
  }
});

await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;
const checks = [];
const errors = [];
const check = (name, passed, details) => checks.push({ name, passed: Boolean(passed), ...(details ? { details } : {}) });

const browser = await chromium.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  page.on("pageerror", error => errors.push(error.message));

  const moduleUrl = pathToFileURL(resolve("kit/system.js")).href;
  const imported = await import(moduleUrl);
  check("Node import has no DOM side effects", typeof imported.mount === "function" && typeof imported.createSpring === "function");
  const packageJson = JSON.parse(await readFile(resolve("kit/package.json"), "utf8"));
  check("kit package exports runtime and types", packageJson.type === "module" && packageJson.exports["."].types === "./system.d.ts" && packageJson.exports["."].default === "./system.js");
  const spring = imported.createSpring({ frequency: 3, damping: 0.9, response: 1 });
  spring.reset(0);
  check("createSpring advances toward target", spring.update(1 / 60, 1) > 0);
  check("createSpring reset returns value", spring.reset(4) === 4 && spring.value === 4);
  const extreme = imported.createSpring({ frequency: 60, damping: 4, response: 1 });
  extreme.reset(0);
  const extremeValues = Array.from({ length: 180 }, () => extreme.update(0.064, 1));
  check("createSpring remains finite at frequency 60 and dt .064", extremeValues.every(Number.isFinite));
  check("createSpring remains bounded at frequency 60 and dt .064", Math.max(...extremeValues.map(Math.abs)) < 4);
  const snippetsModule = await import(pathToFileURL(resolve("kit/snippets.js")).href);
  check("snippets expose eighteen authored recipes", Array.isArray(snippetsModule.snippets) && snippetsModule.snippets.length === 18);

  await page.goto(`${baseUrl}/test.html`, { waitUntil: "domcontentloaded" });
  await page.addScriptTag({ content: `
    window.__motionListeners = [];
    window.__motionState = { matches: false };
    window.matchMedia = query => ({
      media: query,
      get matches() { return window.__motionState.matches; },
      addEventListener(type, listener) {
        if (type === "change") window.__motionListeners.push(listener);
      },
      removeEventListener(type, listener) {
        if (type === "change") window.__motionListeners = window.__motionListeners.filter(item => item !== listener);
      }
    });
    window.setReducedMotion = matches => {
      window.__motionState.matches = matches;
      for (const listener of window.__motionListeners) listener({ matches, media: "(prefers-reduced-motion: reduce)" });
    };
  ` });
  await page.addScriptTag({ type: "module", content: `
    import { mount, createSpring } from "/kit/system.js";
    import { snippets } from "/kit/snippets.js";
    window.results = {};
    window.snippets = snippets;
    window.mountDesignSystem = mount;
    window.runtimeA = mount(document.querySelector("#a"), { motion: true });
    window.runtimeAAgain = mount(document.querySelector("#a"));
    window.runtimeB = mount(document.querySelector("#b"), { motion: false });
    window.results.sameRootIdempotent = window.runtimeA === window.runtimeAAgain;
    window.results.spring = createSpring().reset(2);
  ` });
  await page.waitForFunction(() => window.results && window.runtimeA && window.runtimeB);

  check("same root mount is idempotent", await page.evaluate(() => window.results.sameRootIdempotent));
  check("mount marks runtime ready", await page.locator("#a").evaluate(node => node.dataset.dsRuntime === "ready"));
  check("initial tabs select first panel", await page.evaluate(() =>
    document.querySelector("#tab-a1").getAttribute("aria-selected") === "true" &&
    document.querySelector("#tab-a1").tabIndex === 0 &&
    document.querySelector("#panel-a2").hidden === true &&
    document.querySelector("#tab-nested").getAttribute("aria-selected") === "true" &&
    document.querySelector("#nested-toast-region [data-ds-toast-item]") === null
  ));

  await page.focus("#tab-a1");
  await page.keyboard.press("ArrowRight");
  check("tabs arrow keyboard selects next own tab", await page.evaluate(() =>
    document.activeElement.id === "tab-a2" &&
    document.querySelector("#tab-a2").getAttribute("aria-selected") === "true" &&
    document.querySelector("#panel-a1").hidden === true
  ));
  await page.keyboard.press("Home");
  check("tabs Home keyboard selects first tab", await page.evaluate(() => document.activeElement.id === "tab-a1"));
  await page.focus("#tab-v1");
  await page.keyboard.press("ArrowRight");
  check("vertical tabs ignore horizontal arrow keys", await page.evaluate(() =>
    document.activeElement.id === "tab-v1" &&
    document.querySelector("#tab-v1").getAttribute("aria-selected") === "true"
  ));
  await page.keyboard.press("ArrowDown");
  check("vertical tabs skip disabled tab", await page.evaluate(() =>
    document.activeElement.id === "tab-v2" &&
    document.querySelector("#tab-v-disabled").getAttribute("aria-selected") === "false" &&
    document.querySelector("#panel-v-disabled").hidden === true
  ));

  await page.click("#open-a");
  await page.evaluate(() => window.runtimeA.openDialog("dialog-a"));
  check("dialog opens and focuses contained control", await page.evaluate(() =>
    document.querySelector("#dialog-a").open === true &&
    document.activeElement.id === "close-a"
  ));
  await page.click("#close-a");
  check("dialog close restores opener focus", await page.evaluate(() =>
    document.querySelector("#dialog-a").open === false &&
    document.activeElement.id === "open-a"
  ));

  await page.click("#toast-a");
  await page.click("#toast-b");
  check("toast actions stay isolated per root", await page.evaluate(() =>
    document.querySelectorAll("#toast-region-a [data-ds-toast-item]").length === 1 &&
    document.querySelectorAll("#toast-region-b [data-ds-toast-item]").length === 1
  ));
  await page.click("#nested-toast");
  check("parent runtime ignores nested ds-root events", await page.evaluate(() =>
    document.querySelectorAll("#nested-toast-region [data-ds-toast-item]").length === 0
  ));

  await page.evaluate(() => window.runtimeA.setTheme("dark"));
  check("setTheme writes root dataset", await page.locator("#a").evaluate(node => node.dataset.dsTheme === "dark"));

  const magneticBox = await page.locator("#magnetic-a").boundingBox();
  await page.mouse.move(magneticBox.x + magneticBox.width / 2, magneticBox.y + magneticBox.height / 2);
  await page.mouse.move(magneticBox.x + magneticBox.width - 2, magneticBox.y + magneticBox.height - 2);
  check("magnetic button writes scoped CSS variables", await page.locator("#magnetic-a").evaluate(node =>
    node.dataset.dsMagneticState === "active" &&
    node.style.getPropertyValue("--ds-magnetic-x") !== ""
  ));
  await page.evaluate(() => window.setReducedMotion(true));
  await page.mouse.move(magneticBox.x + 2, magneticBox.y + 2);
  check("dynamic reduced motion reveals content and resets magnetic state", await page.evaluate(() =>
    document.querySelector("#reveal-a").dataset.dsRevealState === "visible" &&
    document.querySelector("#magnetic-a").style.getPropertyValue("--ds-magnetic-x") === "" &&
    !("dsMagneticState" in document.querySelector("#magnetic-a").dataset)
  ));

  await page.evaluate(() => {
    document.querySelector("#open-a").focus();
    window.runtimeA.openDialog("dialog-a");
  });
  await page.evaluate(() => window.runtimeA.destroy());
  check("destroy removes ready state", await page.locator("#a").evaluate(node => !("dsRuntime" in node.dataset)));
  check("destroy closes only runtime-owned dialogs", await page.evaluate(() =>
    document.querySelector("#dialog-a").open === false &&
    document.querySelector("#user-open-dialog").open === true
  ));
  await page.click("#toast-a");
  check("destroy aborts delegated click listeners", await page.evaluate(() =>
    document.querySelectorAll("#toast-region-a [data-ds-toast-item]").length === 0
  ));
  check("destroy clears magnetic inline state", await page.locator("#magnetic-a").evaluate(node =>
    node.style.getPropertyValue("--ds-magnetic-x") === "" &&
    !("dsMagneticState" in node.dataset)
  ));
  await page.evaluate(() => window.runtimeA.setTheme("light"));
  check("setTheme after destroy is a no-op", await page.locator("#a").evaluate(node => node.dataset.dsTheme === "dark"));
  await page.evaluate(() => {
    const root = document.querySelector("#a");
    const OriginalIntersectionObserver = window.IntersectionObserver;
    root.innerHTML = "<p data-ds-reveal>Failure cleanup</p>";
    window.setReducedMotion(false);
    window.IntersectionObserver = function IntersectionObserver() {
      throw new Error("forced init failure");
    };
    let threw = false;
    try {
      window.mountDesignSystem(root, { motion: true });
    } catch {
      threw = true;
    }
    window.IntersectionObserver = OriginalIntersectionObserver;
    const controller = window.mountDesignSystem(root, { motion: false });
    const remounted = root.dataset.dsRuntime === "ready";
    controller.destroy();
    window.results.initFailureCleaned = threw && remounted && !("dsRuntime" in root.dataset);
  });
  check("mount init failure cleans instance for remount", await page.evaluate(() => window.results.initFailureCleaned));
  await page.evaluate(() => {
    const root = document.querySelector("#a");
    const runtimeSnippets = window.snippets.filter(snippet => snippet.runtime);
    window.results.snippetRuntimeChecks = runtimeSnippets.map(snippet => {
      root.innerHTML = snippet.html;
      const controller = window.mountDesignSystem(root, { motion: false });
      const ready = root.dataset.dsRuntime === "ready";
      if (snippet.id === "tabs") root.querySelector("[role='tab']").click();
      if (snippet.id === "dialog") {
        const opener = root.querySelector("[data-ds-dialog-open]");
        opener.focus();
        opener.click();
        root.querySelector("[data-ds-dialog-close]").click();
      }
      if (snippet.id === "toast") root.querySelector("[data-ds-toast]").click();
      controller.destroy();
      return ready && !("dsRuntime" in root.dataset);
    });
  });
  check("runtime snippets mount after innerHTML swaps", await page.evaluate(() => window.results.snippetRuntimeChecks.every(Boolean)));

  await page.evaluate(() => {
    window.invalid = [];
    try { window.runtimeB.setTheme("sepia"); } catch (error) { window.invalid.push(error instanceof TypeError); }
    try { window.runtimeB.notify(1); } catch (error) { window.invalid.push(error instanceof TypeError); }
  });
  check("invalid public API inputs throw bounded TypeErrors", await page.evaluate(() => window.invalid.every(Boolean)));

  check("No page errors", errors.length === 0, errors);
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}

const passed = checks.every(result => result.passed) && errors.length === 0;
const report = { passed, checks, errors };
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
