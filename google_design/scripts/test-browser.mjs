import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_URL = "http://127.0.0.1:8094/viewer/";
const TARGET_URL = process.env.BROWSER_QA_URL || DEFAULT_URL;
const REPORT_PATH = path.join(ROOT, ".gstack/qa-reports/source-expansion.json");
const SCREENSHOT_DIR = path.join(ROOT, "references-private/catalog");
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const SECTION_IDS = ["overview", "foundations", "components", "interactions", "assets", "sources"];
const INTERACTION_IDS = [
  "hover",
  "focus",
  "press",
  "selection",
  "expand-collapse",
  "dialog",
  "snackbar",
  "drag-drop",
  "switch",
  "checkbox",
  "keyboard-tabs",
  "menu",
  "text-field",
  "progress",
];

const startedAt = new Date().toISOString();
const failures = [];
const checks = [];
const artifacts = [];
const consoleErrors = [];
const pageErrors = [];
const failedResponses = [];

function record(name, ok, details = {}) {
  const entry = { name, ok, ...details };
  checks.push(entry);
  if (!ok) failures.push(entry);
}

async function loadPlaywright() {
  const moduleRef = process.env.PLAYWRIGHT_MODULE;
  if (moduleRef) {
    const specifier = path.isAbsolute(moduleRef) ? pathToFileURL(moduleRef).href : moduleRef;
    return import(specifier);
  }
  return import("playwright");
}

function visibleText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function expectLocator(page, selector, name, options = {}) {
  const locator = page.locator(selector);
  const count = await locator.count();
  const ok = count >= (options.min ?? 1);
  record(name, ok, { selector, count });
  if (!ok && options.required !== false) throw new Error(`${name}: ${selector} not found`);
  return locator;
}

async function clickNav(page, id) {
  await page.locator(`[data-section="${id}"]`).click();
  await page.waitForFunction((section) => location.hash === `#${section}`, id);
  await page.waitForFunction((section) => document.querySelector(`[data-section="${section}"]`)?.getAttribute("aria-current") === "page", id);
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function assertNoHorizontalOverflow(page, section, viewportName) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const offenders = [...document.body.querySelectorAll("*")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector:
            element.id ? `#${element.id}` :
            element.dataset.section ? `[data-section="${element.dataset.section}"]` :
            element.className && typeof element.className === "string" ? `.${element.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")}` :
            element.tagName.toLowerCase(),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewportWidth + 1))
      .slice(0, 10);
    return { viewportWidth, scrollWidth, overflow: scrollWidth - viewportWidth, offenders };
  });
  record(`${viewportName} ${section} has no horizontal overflow`, result.overflow <= 1, result);
}

async function screenshot(page, name) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const target = path.join(SCREENSHOT_DIR, `extension-${name}.png`);
  await page.screenshot({ path: target, fullPage: true });
  artifacts.push(path.relative(ROOT, target).replaceAll(path.sep, "/"));
}

async function installObservers(context) {
  await context.addInitScript(() => {
    window.__qaClipboardWrites = [];
    window.__qaUnhandledRejections = [];
    window.addEventListener("unhandledrejection", (event) => {
      window.__qaUnhandledRejections.push(String(event.reason && event.reason.message ? event.reason.message : event.reason));
      event.preventDefault();
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__qaClipboardWrites.push(String(value));
        },
      },
    });
  });
}

function bindErrorObservers(page) {
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) consoleErrors.push(text);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push({ url: response.url(), status: response.status() });
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
}

async function assertThemePersistence(page, context) {
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  await expectLocator(page, "#theme", "theme button exists");
  const before = await page.locator("#theme").getAttribute("aria-label");
  await page.locator("#theme").click();
  const afterTheme = await page.locator("html").getAttribute("data-theme");
  const afterLabel = await page.locator("#theme").getAttribute("aria-label");
  const afterIcon = visibleText(await page.locator("#theme .material-symbols-rounded").textContent());
  record("theme toggle switches to dark and updates accessible label", afterTheme === "dark" && afterLabel === "라이트 테마로 전환" && afterIcon === "light_mode", { before, afterTheme, afterLabel, afterIcon });

  const persistedPage = await context.newPage();
  bindErrorObservers(persistedPage);
  await persistedPage.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  const persistedTheme = await persistedPage.locator("html").getAttribute("data-theme");
  const persistedLabel = await persistedPage.locator("#theme").getAttribute("aria-label");
  record("theme persists across pages", persistedTheme === "dark" && persistedLabel === "라이트 테마로 전환", { persistedTheme, persistedLabel });
  await persistedPage.close();
}

async function assertOverviewSourceZipDownload(page) {
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  const link = page.locator('a[download][href="downloads/google-design-source-kit.zip"]');
  await expectLocator(page, 'a[download][href="downloads/google-design-source-kit.zip"]', "overview source ZIP download link exists");
  const download = page.waitForEvent("download");
  await link.click();
  const file = await download;
  const temporaryPath = await file.path();
  const size = temporaryPath ? (await stat(temporaryPath)).size : 0;
  record("overview source ZIP downloads expected nonempty archive", file.suggestedFilename() === "google-design-source-kit.zip" && size > 0, { suggestedFilename: file.suggestedFilename(), size });
}

async function assertHashNavigation(page) {
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  for (const section of SECTION_IDS) {
    await clickNav(page, section);
    const current = await page.locator(`[data-section="${section}"]`).getAttribute("aria-current");
    record(`hash navigation activates ${section}`, current === "page", { section, url: page.url(), current });
  }
  await page.goBack();
  await page.waitForFunction(() => location.hash === "#assets");
  record("browser back syncs URL and active section", await page.locator('[data-section="assets"]').getAttribute("aria-current") === "page", { url: page.url() });
  await page.goForward();
  await page.waitForFunction(() => location.hash === "#sources");
  record("browser forward syncs URL and active section", await page.locator('[data-section="sources"]').getAttribute("aria-current") === "page", { url: page.url() });
}

async function assertLibraryFiltersReset(page) {
  await page.goto(`${TARGET_URL}#components`, { waitUntil: "domcontentloaded" });
  await page.locator("#search").fill("zzzz-no-component-match");
  await page.waitForTimeout(50);
  const noMatch = visibleText(await page.locator("#component-catalog").textContent());
  record("component search shows no-match state", noMatch.includes("검색 조건과 일치하는 컴포넌트가 없습니다."), { text: noMatch.slice(0, 180) });
  await page.locator("#search").fill("");
  await page.locator('[data-service="gmail"]').click();
  const gmailCount = await page.locator("#component-catalog .component-card").count();
  await page.locator('[data-service="all"]').click();
  const resetCount = await page.locator("#component-catalog .component-card").count();
  record("component filters reset from no matches to full library", gmailCount > 0 && resetCount >= gmailCount, { gmailCount, resetCount });

  await clickNav(page, "assets");
  await page.locator("#search").fill("zzzz-no-icon-match");
  await page.waitForTimeout(50);
  const emptyIconText = visibleText(await page.locator(".wb-icon-grid").textContent());
  await page.locator("#search").fill("");
  await page.waitForTimeout(50);
  const restoredIcons = await page.locator(".wb-icon-tile").count();
  record("SVG library search no-match clears back to icon tiles", emptyIconText.includes("검색 결과가 없습니다.") && restoredIcons > 0, { emptyIconText, restoredIcons });
}

async function assertSvgCopyAndDownload(page) {
  await page.goto(`${TARGET_URL}#assets`, { waitUntil: "domcontentloaded" });
  const firstIcon = page.locator(".wb-icon-tile").first();
  await expectLocator(page, ".wb-icon-tile", "open source SVG tiles render");
  await firstIcon.click();
  await expectLocator(page, "#wb-svg-source", "selected SVG source panel renders");
  await page.waitForFunction(() => {
    const source = document.querySelector("#wb-svg-source");
    return source && source.textContent.includes("<svg");
  });
  const sourceText = await page.locator("#wb-svg-source").textContent();
  await page.locator("#wb-copy-svg").click();
  const clipboardCount = await page.evaluate(() => window.__qaClipboardWrites.filter((value) => value.includes("<svg")).length);
  record("SVG copy writes source to clipboard", clipboardCount > 0, { clipboardCount, bytes: sourceText.length });

  await page.evaluate(() => {
    window.__qaUnhandledRejections = [];
    navigator.clipboard.writeText = async () => {
      throw new Error("QA clipboard denied");
    };
  });
  await page.locator("#wb-copy-svg").click();
  await page.waitForFunction(() => document.querySelector("#wb-copy-dialog")?.open === true);
  const fallback = await page.evaluate(() => ({
    dialogOpen: document.querySelector("#wb-copy-dialog")?.open === true,
    textarea: document.querySelector("#wb-copy-dialog textarea")?.value || "",
    unhandled: window.__qaUnhandledRejections,
  }));
  record("SVG copy failure opens manual fallback without unhandled rejection", fallback.dialogOpen && fallback.textarea.includes("<svg") && fallback.unhandled.length === 0, { dialogOpen: fallback.dialogOpen, textareaBytes: fallback.textarea.length, unhandled: fallback.unhandled });
  await page.locator("#wb-copy-dialog button").click();

  const download = page.waitForEvent("download");
  await page.locator(".wb-icon-detail a[download]").click();
  const file = await download;
  record("SVG download starts with .svg filename", file.suggestedFilename().endsWith(".svg"), { suggestedFilename: file.suggestedFilename() });
}

async function assertOriginalInteractions(page) {
  await page.goto(`${TARGET_URL}#interactions`, { waitUntil: "domcontentloaded" });
  await expectLocator(page, "#interaction-contracts", "interaction contracts render");
  const cardCount = await page.locator("#interaction-contracts .interaction").count();
  record("all 14 interaction cards render", cardCount === 14, { cardCount });

  await page.locator("#contract-hover-row").hover();
  record("hover sample updates output", visibleText(await page.locator("#contract-hover-output").textContent()).includes("hover"), { output: await page.locator("#contract-hover-output").textContent() });

  await page.locator("#contract-focus-button").focus();
  record("focus sample updates output", visibleText(await page.locator("#contract-focus-output").textContent()).includes("focused"), { output: await page.locator("#contract-focus-output").textContent() });

  await page.locator("#contract-press-button").dispatchEvent("pointerdown");
  const pressed = visibleText(await page.locator("#contract-press-output").textContent());
  await page.locator("#contract-press-button").dispatchEvent("pointerup");
  const released = visibleText(await page.locator("#contract-press-output").textContent());
  record("press sample updates pressed and released states", pressed.includes("pressed") && released.includes("released"), { pressed, released });

  await page.locator('[data-contract-selection="파일"]').click();
  record("selection sample moves aria-current", await page.locator('[data-contract-selection="파일"]').getAttribute("aria-current") === "page", { output: await page.locator("#contract-selection-output").textContent() });

  await page.locator("#contract-expand-button").click();
  record("expand sample toggles aria-expanded and panel visibility", await page.locator("#contract-expand-button").getAttribute("aria-expanded") === "true" && !(await page.locator("#contract-expand-panel").evaluate((el) => el.classList.contains("hidden"))), { output: await page.locator("#contract-expand-output").textContent() });

  await page.locator("#contract-dialog-open").click();
  record("dialog sample opens modal", await page.locator("#interaction-dialog").evaluate((el) => el.open), { output: await page.locator("#contract-dialog-output").textContent() });
  await page.locator('#interaction-dialog button[value="confirm"]').click();
  await page.waitForFunction(() => !document.querySelector("#interaction-dialog")?.open);
  record("dialog sample closes and restores trigger focus", await page.evaluate(() => document.activeElement?.id === "contract-dialog-open"), { output: await page.locator("#contract-dialog-output").textContent() });

  await page.locator("#contract-snackbar-trigger").click();
  const snackbarVisible = await page.locator("#contract-snackbar").evaluate((el) => !el.classList.contains("hidden"));
  await page.locator("#contract-snackbar-undo").click();
  record("snackbar sample supports action dismissal", snackbarVisible && visibleText(await page.locator("#contract-snackbar-output").textContent()).includes("undo"), { output: await page.locator("#contract-snackbar-output").textContent() });

  await page.locator("#contract-drag-item").click();
  const picked = await page.locator("#contract-drag-item").getAttribute("aria-pressed");
  await page.locator("#contract-drop-zone").click();
  record("drag-drop sample supports click fallback", picked === "true" && visibleText(await page.locator("#contract-drag-output").textContent()).includes("dropped"), { output: await page.locator("#contract-drag-output").textContent() });
}

async function assertNewInteractions(page) {
  await page.goto(`${TARGET_URL}#interactions`, { waitUntil: "domcontentloaded" });
  const sampleSelectors = {
    hover: "#contract-hover-row",
    focus: "#contract-focus-button",
    press: "#contract-press-button",
    selection: '[data-contract-selection="오늘"]',
    "expand-collapse": "#contract-expand-button",
    dialog: "#contract-dialog-open",
    snackbar: "#contract-snackbar-trigger",
    "drag-drop": "#contract-drag-item",
    switch: '[data-iw-sample="switch"]',
    checkbox: '[data-iw-sample="checkbox"]',
    "keyboard-tabs": '[data-iw-sample="keyboard-tabs"]',
    menu: '[data-iw-sample="menu"]',
    "text-field": '[data-iw-sample="text-field"]',
    progress: '[data-iw-sample="progress"]',
  };
  for (const id of INTERACTION_IDS) {
    const count = await page.locator(sampleSelectors[id]).count();
    record(`interaction sample exists: ${id}`, count > 0, { id, count });
  }

  await page.locator("[data-iw-switch]").focus();
  await page.keyboard.press("Space");
  record("switch sample toggles by keyboard space", await page.locator("[data-iw-switch]").getAttribute("aria-checked") === "true", { output: await page.locator("#iw-switch-output").textContent() });

  await page.locator('[data-iw-check][value="메일"]').check();
  await page.locator('[data-iw-check][value="파일"]').check();
  record("checkbox sample counts selected values", visibleText(await page.locator("#iw-checkbox-output").textContent()).includes("2 selected"), { output: await page.locator("#iw-checkbox-output").textContent() });

  await page.locator("#iw-tab-mail").focus();
  await page.keyboard.press("ArrowRight");
  record("keyboard tabs move selection with arrow keys", await page.locator("#iw-tab-drive").getAttribute("aria-selected") === "true" && await page.locator("#iw-panel-drive").isVisible(), { output: await page.locator("#iw-tabs-output").textContent() });
  await page.keyboard.press("End");
  record("keyboard tabs support End key", await page.locator("#iw-tab-calendar").getAttribute("aria-selected") === "true", { output: await page.locator("#iw-tabs-output").textContent() });

  await page.locator("[data-iw-menu-button]").focus();
  await page.keyboard.press("ArrowDown");
  const menuOpen = await page.locator("[data-iw-menu-button]").getAttribute("aria-expanded");
  await page.keyboard.press("Escape");
  record("menu opens from keyboard and Escape restores focus", menuOpen === "true" && await page.evaluate(() => document.activeElement?.id === "iw-menu-button"), { output: await page.locator("#iw-menu-output").textContent() });

  await page.locator("[data-iw-menu-button]").click();
  const clickMenuOpen = await page.locator("[data-iw-menu-button]").getAttribute("aria-expanded");
  await page.keyboard.press("Escape");
  const clickEscapeState = await page.evaluate(() => ({
    expanded: document.querySelector("[data-iw-menu-button]")?.getAttribute("aria-expanded"),
    hidden: document.querySelector("[data-iw-menu]")?.hidden,
    activeElement: document.activeElement?.id,
    output: document.querySelector("#iw-menu-output")?.textContent || "",
  }));
  record("menu click-open Escape closes and restores trigger focus", clickMenuOpen === "true" && clickEscapeState.expanded === "false" && clickEscapeState.hidden === true && clickEscapeState.activeElement === "iw-menu-button", clickEscapeState);

  await page.locator("[data-iw-text-field]").fill("bad");
  const invalid = await page.locator("[data-iw-text-field]").getAttribute("aria-invalid");
  await page.locator("[data-iw-text-field]").fill("GDS-124");
  const validOutput = visibleText(await page.locator("#iw-field-output").textContent());
  await page.locator("[data-iw-field-form] button").click();
  record("text field exposes error and valid submitted states", invalid === "true" && validOutput === "valid" && visibleText(await page.locator("#iw-field-output").textContent()).includes("submitted"), { invalid, output: await page.locator("#iw-field-output").textContent() });

  await page.locator("[data-iw-progress-action]").click();
  await page.waitForFunction(() => Number(document.querySelector("[data-iw-progressbar]")?.getAttribute("aria-valuenow")) >= 10);
  const runningNow = Number(await page.locator("[data-iw-progressbar]").getAttribute("aria-valuenow"));
  await page.locator("[data-iw-progress-action]").click();
  record("progress sample starts and cancels with ARIA updates", runningNow >= 10 && Number(await page.locator("[data-iw-progressbar]").getAttribute("aria-valuenow")) === 0, { runningNow, output: await page.locator("#iw-progress-output").textContent() });
}

async function assertMotionLab(page, reduced = false) {
  await page.goto(`${TARGET_URL}#interactions`, { waitUntil: "domcontentloaded" });
  await expectLocator(page, "[data-iw-motion-lab]", reduced ? "reduced motion lab renders" : "motion lab renders");
  const options = await page.locator("[data-iw-motion-recipe] option").count();
  if (options > 1) {
    await page.locator("[data-iw-motion-recipe]").selectOption({ index: 1 });
    await page.locator("[data-iw-motion-recipe]").dispatchEvent("input");
  }
  await page.locator("[data-iw-motion-duration]").fill("450");
  await page.locator("[data-iw-motion-duration]").dispatchEvent("input");
  const label = visibleText(await page.locator("[data-iw-motion-duration-label]").textContent());
  await page.locator("[data-iw-motion-replay]").click();
  const output = visibleText(await page.locator("#iw-motion-output").textContent());
  const cssValue = await page.locator("[data-iw-motion-css]").inputValue();
  record(reduced ? "reduced motion play reports instant state" : "motion recipe/duration changes update CSS and output", reduced ? output.includes("reduced motion") : label === "450ms" && cssValue.includes("450ms") && output.length > 0, { label, output, cssSnippet: cssValue.slice(0, 160) });
  if (reduced) {
    const reducedState = await page.evaluate(() => {
      const dot = document.querySelector("[data-iw-motion-dot]");
      return {
        inlineTransform: dot?.style.transform || "",
        computedTransform: dot ? getComputedStyle(dot).transform : "",
        animations: dot ? dot.getAnimations().map((animation) => animation.playState) : [],
      };
    });
    record("reduced motion keeps preview transform none with no animations", reducedState.inlineTransform === "none" && (reducedState.computedTransform === "none" || reducedState.computedTransform === "") && reducedState.animations.length === 0, reducedState);
  }
  if (!reduced) {
    await page.evaluate(() => {
      window.__qaUnhandledRejections = [];
      navigator.clipboard.writeText = async () => {
        throw new Error("QA motion clipboard denied");
      };
    });
    await page.locator("[data-iw-motion-copy]").click();
    await page.waitForTimeout(100);
    const copyFailure = await page.evaluate(() => ({
      unhandled: window.__qaUnhandledRejections,
      dialogOpen: document.querySelector("#wb-copy-dialog")?.open === true,
      textarea: document.querySelector("#wb-copy-dialog textarea")?.value || "",
      output: document.querySelector("#iw-motion-output")?.textContent || "",
    }));
    record("motion CSS copy failure opens manual dialog without success status", copyFailure.unhandled.length === 0 && copyFailure.dialogOpen && copyFailure.textarea.includes(".motion-sample") && !copyFailure.output.includes("CSS copied"), { ...copyFailure, textarea: copyFailure.textarea.slice(0, 160) });
    if (copyFailure.dialogOpen) await page.locator("#wb-copy-dialog button").click();
  }
}

async function assertReducedMotionToggleDuringAnimation(page) {
  await page.goto(`${TARGET_URL}#interactions`, { waitUntil: "domcontentloaded" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("[data-iw-motion-duration]").fill("500");
  await page.locator("[data-iw-motion-duration]").dispatchEvent("input");
  await page.locator("[data-iw-motion-replay]").click();
  await page.waitForFunction(() => document.querySelector("[data-iw-motion-dot]")?.getAnimations().length > 0);
  const before = await page.evaluate(() => document.querySelector("[data-iw-motion-dot]")?.getAnimations().map((animation) => animation.playState) || []);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelector("#iw-motion-output")?.textContent.includes("reduced motion"));
  const after = await page.evaluate(() => {
    const dot = document.querySelector("[data-iw-motion-dot]");
    return {
      beforeOutput: document.querySelector("#iw-motion-output")?.textContent || "",
      inlineTransform: dot?.style.transform || "",
      computedTransform: dot ? getComputedStyle(dot).transform : "",
      animations: dot ? dot.getAnimations().map((animation) => animation.playState) : [],
    };
  });
  record("reduced motion preference change cancels running preview animation", before.some((state) => state === "running" || state === "pending") && after.inlineTransform === "none" && (after.computedTransform === "none" || after.computedTransform === "") && after.animations.length === 0, { before, after });
}

async function runViewport(playwright, viewport) {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  await installObservers(context);
  const page = await context.newPage();
  bindErrorObservers(page);

  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expectLocator(page, "#nav [data-section]", `${viewport.name} nav sections render`, { min: 6 });
  for (const section of SECTION_IDS) {
    await clickNav(page, section);
    await assertNoHorizontalOverflow(page, section, viewport.name);
  }

  if (viewport.name === "desktop") {
    await clickNav(page, "foundations");
    await screenshot(page, "desktop-foundations");
    await clickNav(page, "interactions");
    await screenshot(page, "desktop-interactions");
    await clickNav(page, "assets");
    await screenshot(page, "desktop-assets");
    await assertOverviewSourceZipDownload(page);
    await assertThemePersistence(page, context);
    await assertHashNavigation(page);
    await assertLibraryFiltersReset(page);
    await assertSvgCopyAndDownload(page);
    await assertOriginalInteractions(page);
    await assertNewInteractions(page);
    await assertMotionLab(page);
    await assertReducedMotionToggleDuringAnimation(page);
  } else {
    await clickNav(page, "assets");
    await screenshot(page, "mobile-assets");
    await clickNav(page, "interactions");
    await screenshot(page, "mobile-interactions");
    await assertLibraryFiltersReset(page);
    await assertMotionLab(page);
  }

  await browser.close();
}

async function runReducedMotion(playwright) {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  await installObservers(context);
  const page = await context.newPage();
  bindErrorObservers(page);
  await assertMotionLab(page, true);
  await page.locator("#theme").click();
  await screenshot(page, "desktop-dark-reduced-motion");
  await browser.close();
}

async function writeReport() {
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    viewportCoverage: VIEWPORTS,
    checks,
    failures,
    consoleErrors,
    pageErrors,
    failedResponses,
    artifacts,
    ok: failures.length === 0 && consoleErrors.length === 0 && pageErrors.length === 0,
  };
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

try {
  const playwright = await loadPlaywright();
  for (const viewport of VIEWPORTS) {
    await runViewport(playwright, viewport);
  }
  await runReducedMotion(playwright);
  consoleErrors.forEach((text) => record("browser console has no error entries", false, { text }));
  pageErrors.forEach((text) => record("browser page has no uncaught JavaScript errors", false, { text }));
} catch (error) {
  record("browser QA runner completed", false, { error: error && error.stack ? error.stack : String(error) });
} finally {
  await writeReport();
}

if (failures.length || consoleErrors.length || pageErrors.length) {
  console.error(`Browser QA failed: ${failures.length} assertion failures, ${consoleErrors.length} console errors, ${pageErrors.length} page errors`);
  console.error(`Report: ${path.relative(ROOT, REPORT_PATH)}`);
  process.exit(1);
}

console.log(`Browser QA passed: ${checks.length} checks`);
console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);
