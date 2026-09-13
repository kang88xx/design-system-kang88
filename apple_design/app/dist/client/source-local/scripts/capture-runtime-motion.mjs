import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { launchBrowser } from "./browser-runtime.mjs";
import { deriveMotionTracks } from "./runtime-tracks.mjs";
import {
  createEmptyManifest,
  hashText,
  makeRecordId,
  observedProperties,
  signatureForRecord,
  slugify,
  updateTotals,
  viewportPresets,
} from "./runtime-motion-schema.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "app/public");
const researchRoot = path.join(publicRoot, "research");
const outFile = path.join(researchRoot, "runtime-motion.json");
const recordsDir = path.join(researchRoot, "runtime-motion/records");
const shotDir = path.join(researchRoot, "runtime-motion/screenshots");
const sourceDir = path.join(researchRoot, "runtime-sources");
const domDir = path.join(researchRoot, "runtime-dom");
const delays = [80, 240, 600];
const args = new Set(process.argv.slice(2));
const probe = args.has("--probe");
const concurrency = Math.max(1, Math.min(3, Number(process.env.RUNTIME_MOTION_CONCURRENCY || 3)));

await Promise.all([
  fs.mkdir(recordsDir, { recursive: true }),
  fs.mkdir(shotDir, { recursive: true }),
  fs.mkdir(sourceDir, { recursive: true }),
  fs.mkdir(domDir, { recursive: true }),
]);

const staticManifest = JSON.parse(await fs.readFile(path.join(researchRoot, "manifest.json"), "utf8"));
const pages = buildPages(staticManifest.pages || []);
const targetPages = probe ? pages.slice(0, 1) : pages;
const resources = [];
const resourceByUrl = new Map();
let shotCount = 0;

const manifest = createEmptyManifest({
  generatedAt: new Date().toISOString(),
  scope: {
    source: "live Apple runtime capture",
    pages: targetPages.map((page) => page.id),
    viewports: Object.keys(viewportPresets),
    triggers: ["load", "hover", "click", "scroll", "autoplay", "focus"],
    sampleDelaysMs: delays,
    note: "Records marked observed require WebAnimations or computed style/state changes; skipped controls keep reasons.",
  },
  pages: targetPages.map((page) => ({
    id: page.id,
    title: page.title,
    url: page.url,
    status: "pending",
    viewports: [],
    coverage: [],
  })),
  resources,
});

const browser = await launchBrowser();
try {
  await runPool(targetPages, concurrency, capturePage);
} finally {
  await browser.close();
}

manifest.resources = resources;
updateTotals(manifest);
await fs.writeFile(outFile, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ file: "/apple_design/app/dist/client/research/runtime-motion.json", totals: manifest.totals }, null, 2));

function buildPages(manifestPages) {
  const extra = [
    ["00-www-apple-com-home", "Apple", "https://www.apple.com/", "homepage"],
    ["14-www-apple-com-mac-mini", "Mac mini - Apple", "https://www.apple.com/mac-mini/", "homepage-learn-more"],
    ["15-www-apple-com-ipad-air", "iPad Air - Apple", "https://www.apple.com/ipad-air/", "homepage-learn-more"],
    ["16-www-apple-com-ipad-pro", "iPad Pro - Apple", "https://www.apple.com/ipad-pro/", "homepage-learn-more"],
  ];
  const seen = new Set(manifestPages.map((page) => normalizeUrl(page.url)));
  return [
    ...extra.slice(0, 1).map(([id, title, url, source]) => ({ id, title, url, source })),
    ...manifestPages.map((page) => ({ id: page.id, title: page.title, url: page.url, source: "manifest" })),
    ...extra
      .slice(1)
      .filter(([, , url]) => !seen.has(normalizeUrl(url)))
      .map(([id, title, url, source]) => ({ id, title, url, source })),
  ];
}

function normalizeUrl(url) {
  return String(url || "").replace(/\/$/, "");
}

async function runPool(items, limit, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift());
    }),
  );
}

async function capturePage(info) {
  const pageEntry = manifest.pages.find((page) => page.id === info.id);
  for (const [viewportName, preset] of Object.entries(viewportPresets)) {
    const coverage = {
      viewport: viewportName,
      status: "pending",
      controlsDiscovered: 0,
      controlsTested: 0,
      controlsSkipped: 0,
      hoverTargetsDiscovered: 0,
      hoverTargetsTested: 0,
      scrollSamples: 0,
      domRefs: {},
      errors: [],
    };
    pageEntry.viewports.push(viewportName);
    pageEntry.coverage.push(coverage);

    let context;
    let page;
    try {
      context = await browser.newContext({
        viewport: { width: preset.width, height: preset.height },
        deviceScaleFactor: preset.deviceScaleFactor,
        isMobile: preset.isMobile,
        hasTouch: preset.isMobile,
      });
      page = await context.newPage();
      page.setDefaultTimeout(5000);
      await installRuntimeUtil(page);
      attachSourceCapture(page, info);
      await page.goto(info.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1000);
      await dismiss(page);
      await saveDom(page, info, viewportName, coverage);

      await capturePassive(page, info, viewportName, pageEntry, "load", 900);
      await captureScroll(page, info, viewportName, pageEntry, coverage);
      await capturePassive(page, info, viewportName, pageEntry, "autoplay", 2400);

      const controls = await page.evaluate(discoverControlsInPage);
      coverage.controlsDiscovered = controls.length;
      for (const control of controls) {
        if (control.skipReason) {
          coverage.controlsSkipped += 1;
          await saveRecord(info, pageEntry, {
            trigger: "click",
            kind: "state",
            status: "skipped",
            viewport: viewportName,
            selector: control.selector,
            label: control.label,
            summary: `Skipped: ${control.skipReason}`,
            properties: [],
            skipReason: control.skipReason,
            error: control.skipReason,
          });
          continue;
        }
        coverage.controlsTested += 1;
        await captureInteractive(page, info, viewportName, pageEntry, control, "focus");
        await captureInteractive(page, info, viewportName, pageEntry, control, "click");
      }

      const hoverTargets = await page.evaluate(discoverHoverTargetsInPage);
      coverage.hoverTargetsDiscovered = hoverTargets.length;
      for (const target of hoverTargets) {
        coverage.hoverTargetsTested += 1;
        await captureInteractive(page, info, viewportName, pageEntry, target, "hover");
      }

      await captureDeclarative(page, info, viewportName, pageEntry);
      coverage.status = "ok";
      pageEntry.status = pageEntry.status === "partial" ? "partial" : "ok";
      await writeCheckpoint();
      console.log(`${info.id} ${viewportName} ok controls=${controls.length} hover=${hoverTargets.length}`);
    } catch (error) {
      coverage.status = "blocked";
      coverage.errors.push(String(error).slice(0, 600));
      pageEntry.status = pageEntry.status === "ok" ? "partial" : "blocked";
      await saveRecord(info, pageEntry, {
        trigger: "load",
        kind: "state",
        status: "blocked",
        viewport: viewportName,
        selector: "document",
        label: info.title,
        summary: "Page viewport capture failed",
        properties: [],
        error: String(error).slice(0, 800),
      });
      await writeCheckpoint();
      console.log(`${info.id} ${viewportName} blocked`);
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
    }
  }
}

async function writeCheckpoint() {
  manifest.resources = resources;
  updateTotals(manifest);
  await fs.writeFile(outFile, JSON.stringify(manifest, null, 2));
}

function attachSourceCapture(page, info) {
  page.on("response", async (response) => {
    try {
      const url = response.url();
      const headers = response.headers();
      const type = headers["content-type"] || "";
      const pathname = new URL(url).pathname;
      const kind = type.includes("css") || pathname.endsWith(".css") ? "css" : type.includes("javascript") || /\.m?js$/.test(pathname) ? "js" : "";
      if (!kind || response.status() !== 200) return;
      const existing = resourceByUrl.get(url);
      if (existing) {
        if (!existing.pageIds.includes(info.id)) existing.pageIds.push(info.id);
        return;
      }
      const body = await response.text();
      const fileName = `${slugify(info.id)}-${hashText(url)}.${kind}`;
      const file = `/research/runtime-sources/${fileName}`;
      await fs.writeFile(path.join(sourceDir, fileName), body);
      const resource = { file, url, kind, pageIds: [info.id], bytes: Buffer.byteLength(body), status: "saved" };
      resources.push(resource);
      resourceByUrl.set(url, resource);
    } catch (error) {
      resources.push({ file: null, url: response.url(), kind: "unknown", pageIds: [info.id], status: "blocked", error: String(error).slice(0, 300) });
    }
  });
}

async function dismiss(page) {
  for (const selector of ["#ac-ls-close", "button[aria-label*='Close']", "button:has-text('Close')", "button:has-text('Continue')"]) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) await locator.click().catch(() => {});
  }
}

async function installRuntimeUtil(page) {
  await page.addInitScript(() => {
    globalThis.runtimeUtil = function runtimeUtil() {
      return {
        round: (value) => Math.round(Number(value || 0) * 100) / 100,
        safeUrl: (href) => {
          try {
            return new URL(href, location.href);
          } catch {
            return null;
          }
        },
        label: (element) =>
          (
            element.getAttribute("aria-label") ||
            element.getAttribute("title") ||
            element.textContent ||
            element.value ||
            element.id ||
            element.tagName
          )
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 180),
        selector: (element) => {
          if (!element || element === document) return "document";
          if (element === document.documentElement) return "html";
          if (element.id) {
            const candidate = `#${CSS.escape(element.id)}`;
            if (document.querySelectorAll(candidate).length === 1) return candidate;
          }
          const analytics = element.getAttribute("data-analytics-title");
          if (analytics) {
            const candidate = `[data-analytics-title="${CSS.escape(analytics)}"]`;
            if (document.querySelectorAll(candidate).length === 1) return candidate;
          }
          const parent = element.parentElement;
          if (!parent) return element.tagName.toLowerCase();
          const sameTag = [...parent.children].filter((child) => child.tagName === element.tagName);
          const nth = sameTag.indexOf(element) + 1;
          const klass =
            typeof element.className === "string"
              ? element.className
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => `.${CSS.escape(part)}`)
                  .join("")
              : "";
          return `${globalThis.runtimeUtil().selector(parent)} > ${element.tagName.toLowerCase()}${klass}:nth-of-type(${nth})`;
        },
      };
    };
  });
}

async function saveDom(page, info, viewportName, coverage) {
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  const file = `/research/runtime-dom/${info.id}-${viewportName}-rendered.html`;
  await fs.writeFile(path.join(publicRoot, file), html);
  coverage.domRefs.renderedDom = file;
  const pageEntry = manifest.pages.find((pageItem) => pageItem.id === info.id);
  pageEntry.domRefs ||= {};
  pageEntry.domRefs[viewportName] = { renderedDom: file };
}

async function capturePassive(page, info, viewportName, pageEntry, trigger, waitMs) {
  const before = await sample(page, "document", info.title);
  await page.waitForTimeout(waitMs);
  const after = await sample(page, "document", info.title);
  await saveRecord(info, pageEntry, makeRuntimeRecord(info, viewportName, trigger, "document", info.title, before, [], after));
}

async function captureScroll(page, info, viewportName, pageEntry, coverage) {
  const positions = await page.evaluate(() => {
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const step = Math.max(1, Math.floor(innerHeight * 0.85));
    const result = [];
    for (let y = 0; y < max; y += step) result.push(y);
    if (!result.includes(max)) result.push(max);
    return result;
  });
  let before;
  const frames = [];
  for (const y of positions) {
    await page.evaluate((next) => scrollTo(0, next), y);
    await page.waitForTimeout(220);
    const current = await sample(page, "document", info.title);
    before ||= current;
    frames.push({ elapsed: y, ...current });
  }
  coverage.scrollSamples = frames.length;
  const after = await sample(page, "document", info.title);
  const record = makeRuntimeRecord(info, viewportName, "scroll", "document", info.title, before, frames, after);
  record.scrollSamples = frames;
  await saveRecord(info, pageEntry, record);
}

async function captureInteractive(page, info, viewportName, pageEntry, target, trigger) {
  try {
    const locator = page.locator(target.selector).first();
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const before = await sample(page, target.selector, target.label);
    let beforeShot;
    if (shotCount < 48 && (trigger === "click" || trigger === "hover")) beforeShot = await screenshot(page, info, viewportName, target, trigger, "before");
    if (trigger === "hover") await locator.hover();
    if (trigger === "focus") await locator.focus();
    if (trigger === "click") {
      const url = page.url();
      await locator.click();
      await page.waitForTimeout(80);
      if (page.url() !== url) {
        await page.goBack({ waitUntil: "domcontentloaded", timeout: 7000 }).catch(() => {});
        await saveRecord(info, pageEntry, {
          trigger,
          kind: "state",
          status: "blocked",
          viewport: viewportName,
          selector: target.selector,
          label: target.label,
          summary: "Click navigated; reverted and recorded as skipped navigation",
          properties: [],
          error: `navigated to ${page.url()}`,
        });
        return;
      }
    }
    const frames = [];
    let elapsed = 0;
    for (const delay of delays) {
      await page.waitForTimeout(delay);
      elapsed += delay;
      frames.push({ elapsed, ...(await sample(page, target.selector, target.label)) });
    }
    const record = makeRuntimeRecord(info, viewportName, trigger, target.selector, target.label, before, frames, frames.at(-1));
    if (beforeShot && record.status === "observed") {
      record.before.screenshot = beforeShot;
      record.after.screenshot = await screenshot(page, info, viewportName, target, trigger, "after");
      shotCount += 1;
    }
    await saveRecord(info, pageEntry, record);
    await page.keyboard.press("Escape").catch(() => {});
  } catch (error) {
    await saveRecord(info, pageEntry, {
      trigger,
      kind: "state",
      status: "blocked",
      viewport: viewportName,
      selector: target.selector,
      label: target.label,
      summary: `${trigger} capture failed`,
      properties: [],
      error: String(error).slice(0, 700),
    });
  }
}

async function captureDeclarative(page, info, viewportName, pageEntry) {
  const declarative = await page.evaluate(() => {
    const util = runtimeUtil();
    return [...document.querySelectorAll("[data-anim-keyframe], [data-anim-scroll-group], [data-component-list]")]
      .map((element) => ({
        selector: util.selector(element),
        tag: element.tagName.toLowerCase(),
        text: util.label(element),
        attributes: [...element.attributes].filter((attr) => attr.name.startsWith("data-anim") || attr.name.startsWith("data-component")).map((attr) => [attr.name, attr.value]),
      }));
  });
  if (!declarative.length) return;
  await saveRecord(info, pageEntry, {
    trigger: "load",
    kind: "media",
    status: "source-only",
    viewport: viewportName,
    selector: "[data-anim-keyframe]",
    label: "Declarative animation inventory",
    summary: `Found ${declarative.length} declarative animation hooks`,
    properties: [],
    tracks: [],
    declarative,
  });
}

async function sample(page, selector, label) {
  return page.evaluate(({ selector, label, observedProperties }) => {
    const util = runtimeUtil();
    const target = selector === "document" ? document.documentElement : document.querySelector(selector);
    const scope = selector === "document" ? document : target?.closest("section, nav, footer, main") || target;
    const elements = target ? [target, ...scope.querySelectorAll("[style], [class], [data-anim-keyframe], [data-anim-scroll-group]")] : [];
    const seen = new Set();
    const relevant = [];
    for (const element of elements) {
      if (seen.has(element)) continue;
      seen.add(element);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const isRelevant =
        relevant.length === 0 ||
        style.transitionDuration !== "0s" ||
        style.animationName !== "none" ||
        style.transform !== "none" ||
        style.opacity !== "1" ||
        style.clipPath !== "none" ||
        style.filter !== "none" ||
        element.hasAttribute("data-anim-keyframe") ||
        element.hasAttribute("data-anim-scroll-group");
      if (!isRelevant) continue;
      relevant.push({
        selector: util.selector(element),
        tag: element.tagName.toLowerCase(),
        text: util.label(element),
        rect: { x: util.round(rect.x), y: util.round(rect.y), width: util.round(rect.width), height: util.round(rect.height) },
        styles: Object.fromEntries(observedProperties.map((property) => [property, style.getPropertyValue(property)])),
        state: {
          checked: element.checked ?? undefined,
          expanded: element.getAttribute("aria-expanded") || undefined,
          selected: element.getAttribute("aria-selected") || undefined,
          open: element.open ?? undefined,
        },
      });
    }
    const scopeNode = selector === "document" ? document.documentElement : scope;
    const animations = document
      .getAnimations({ subtree: true })
      .filter((animation) => {
        if (selector === "document") return true;
        const targetNode = animation.effect?.target;
        return targetNode && scopeNode?.contains(targetNode);
      })
      .map((animation) => ({
        type: animation.constructor.name,
        name: animation.animationName || animation.transitionProperty || "",
        playState: animation.playState,
        currentTime: Math.round(Number(animation.currentTime || 0)),
      target: animation.effect?.target ? util.selector(animation.effect.target) : "",
      timing: animation.effect?.getComputedTiming ? compactTiming(animation.effect.getComputedTiming()) : {},
      rawTiming: animation.effect?.getTiming ? compactTiming(animation.effect.getTiming()) : {},
      keyframes: animation.effect?.getKeyframes ? animation.effect.getKeyframes().map(compactKeyframe) : [],
    }));
    function compactKeyframe(frame) {
      return Object.fromEntries(
        Object.entries(frame).map(([key, value]) => [key, serializeMotionValue(value)]),
      );
    }
    function compactTiming(timing) {
      return Object.fromEntries(
        Object.entries(timing).map(([key, value]) => [key, serializeMotionValue(value)]),
      );
    }
    function serializeMotionValue(value) {
      if (typeof value === "number" && !Number.isFinite(value)) return String(value);
      if (Array.isArray(value)) return value.map(serializeMotionValue);
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, serializeMotionValue(item)]),
        );
      }
      return value;
    }
    return { url: location.href, label, scrollY: Math.round(scrollY), viewport: { width: innerWidth, height: innerHeight }, targetFound: Boolean(target), target: relevant[0] || null, elements: relevant, animations };
  }, { selector, label, observedProperties });
}

function makeRuntimeRecord(info, viewportName, trigger, selector, label, before, frames, after) {
  const afterSample = after || frames.at(-1) || before;
  const tracks = deriveMotionTracks(before, frames, afterSample, { trigger });
  const props = new Set(
    tracks.flatMap((track) =>
      (track.keyframes || []).flatMap((frame) =>
        Object.keys(frame).filter((key) => !["offset", "easing"].includes(key)),
      ),
    ),
  );
  const stateChanged = JSON.stringify(before?.target?.state || {}) !== JSON.stringify(afterSample?.target?.state || {});
  const status = tracks.length || stateChanged ? "observed" : "no-change";
  const kind = tracks.length ? (trigger === "scroll" ? "scroll" : "animation") : stateChanged ? "state" : "state";
  const keptSelectors = new Set([before?.target?.selector, afterSample?.target?.selector, selector, ...tracks.map((track) => track.target)].filter(Boolean));
  const record = {
    id: makeRecordId([info.id, viewportName, trigger, selector, label]),
    pageId: info.id,
    pageTitle: info.title,
    sourceUrl: info.url,
    label: String(label || info.title || "").slice(0, 220),
    trigger,
    kind,
    status,
    viewport: viewportName,
    selector,
    summary: status === "observed" ? `${trigger}: ${tracks.length} WAAPI track(s), ${props.size} changed computed propert(ies)` : `${trigger}: no measured motion or state change`,
    properties: [...props],
    duration: tracks.find((track) => track.timing?.duration)?.timing.duration,
    easing: tracks.find((track) => track.timing?.easing)?.timing.easing,
    tracks,
    before: filterSample(before, keptSelectors),
    after: filterSample(afterSample, keptSelectors),
    frames: frames.map((frame) => filterSample(frame, keptSelectors)),
    sourceRefs: resources.filter((resource) => resource.pageIds.includes(info.id)).map((resource) => resource.file).filter(Boolean),
  };
  record.dedupeSignature = signatureForRecord(record);
  return record;
}

async function saveRecord(info, pageEntry, partial) {
  const record = {
    id: partial.id || makeRecordId([info.id, partial.viewport, partial.trigger, partial.selector, partial.label]),
    pageId: info.id,
    pageTitle: info.title,
    sourceUrl: info.url,
    label: partial.label || info.title,
    trigger: partial.trigger,
    kind: partial.kind,
    status: partial.status,
    viewport: partial.viewport,
    selector: partial.selector,
    summary: partial.summary || "",
    properties: partial.properties || [],
    duration: partial.duration,
    easing: partial.easing,
    tracks: partial.tracks || [],
    before: partial.before,
    after: partial.after,
    sourceRefs: partial.sourceRefs || [],
    error: partial.error,
    skipReason: partial.skipReason,
    declarative: partial.declarative,
    scrollSamples: partial.scrollSamples,
    frames: partial.frames,
  };
  record.dedupeSignature = partial.dedupeSignature || signatureForRecord(record);
  const fileName = `${record.id}.json`;
  await fs.writeFile(path.join(recordsDir, fileName), JSON.stringify(record, null, 2));
  manifest.records.push({
    ...record,
    file: `/research/runtime-motion/records/${fileName}`,
    before: compactSample(record.before),
    after: compactSample(record.after),
    declarative: record.declarative?.slice(0, 20),
    scrollSamples: record.scrollSamples?.slice(0, 8).map((frame) => ({ ...compactSample(frame), elapsed: frame.elapsed })),
    frames: record.frames?.slice(0, 4).map((frame) => ({ ...compactSample(frame), elapsed: frame.elapsed })),
  });
}

async function screenshot(page, info, viewportName, target, trigger, phase) {
  const fileName = `${info.id}-${viewportName}-${trigger}-${slugify(target.label || target.selector)}-${phase}.png`;
  await page.screenshot({ path: path.join(shotDir, fileName), fullPage: false });
  return `/research/runtime-motion/screenshots/${fileName}`;
}

function compactSample(sample) {
  if (!sample) return undefined;
  return { url: sample.url, scrollY: sample.scrollY, viewport: sample.viewport, targetFound: sample.targetFound, target: sample.target, elements: sample.elements?.slice(0, 24), animations: sample.animations?.slice(0, 24) };
}

function filterSample(sample, selectors) {
  if (!sample) return undefined;
  return {
    ...sample,
    elements: (sample.elements || []).filter((element) => selectors.has(element.selector)),
    animations: (sample.animations || []).filter(
      (animation) => selectors.has(animation.target) || animation.keyframes?.length,
    ),
  };
}

function discoverControlsInPage() {
  const util = runtimeUtil();
  const unsafe = /\b(buy|bag|cart|checkout|order|sign in|account|payment|subscribe|submit|purchase|pre.?order)\b/i;
  const scopes = [...document.querySelectorAll("nav, main, footer, #globalnav, [role='navigation']")];
  const seen = new Set();
  const controls = [];
  for (const scope of scopes) {
    for (const element of scope.querySelectorAll("button, [role='button'], [role='tab'], [role='radio'], input[type='radio'], input[type='checkbox'], summary, a[href]")) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const selector = util.selector(element);
      const label = util.label(element);
      const href = element.href || element.getAttribute("href") || "";
      const key = `${selector}|${label}|${href}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let skipReason = "";
      if (rect.width < 2 || rect.height < 2 || style.visibility === "hidden" || style.display === "none") skipReason = "hidden or not rendered";
      else if (element.matches("a[href]")) {
        const samePage = href.startsWith("#") || href.startsWith("javascript:");
        const controlled = element.hasAttribute("aria-controls") || element.getAttribute("role") === "tab";
        const parsed = util.safeUrl(href);
        if (!samePage && !controlled) skipReason = "navigation link; hover/focus only";
        if (parsed && parsed.origin !== location.origin) skipReason = "external navigation link";
      } else if (element.closest("form") || element.getAttribute("type") === "submit") skipReason = "form submit risk";
      else if (unsafe.test(label) || unsafe.test(element.getAttribute("aria-label") || "")) skipReason = "purchase/account action risk";
      else if (element.disabled || element.getAttribute("aria-disabled") === "true") skipReason = "disabled control";
      controls.push({ selector, label, tag: element.tagName.toLowerCase(), role: element.getAttribute("role") || "", href, skipReason });
    }
  }
  return controls;
}

function discoverHoverTargetsInPage() {
  const util = runtimeUtil();
  const seen = new Set();
  const targets = [];
  for (const element of document.querySelectorAll("main a[href], main button, main [class*='card'], main [data-module-template]")) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (rect.width < 8 || rect.height < 8 || style.display === "none" || style.visibility === "hidden") continue;
    if (style.transitionDuration === "0s" && style.animationName === "none") continue;
    const selector = util.selector(element);
    const label = util.label(element);
    const key = `${selector}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ selector, label, tag: element.tagName.toLowerCase() });
  }
  return targets;
}

function compactKeyframe(frame, properties) {
  const out = { offset: frame.offset ?? null };
  for (const property of properties) if (frame[property] !== undefined) out[property] = String(frame[property]);
  if (frame.easing) out.easing = frame.easing;
  return out;
}

function compactTiming(timing) {
  return { duration: Number.isFinite(timing.duration) ? timing.duration : null, easing: timing.easing, iterations: timing.iterations, delay: timing.delay, fill: timing.fill };
}
