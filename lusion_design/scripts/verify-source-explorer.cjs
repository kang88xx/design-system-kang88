const { chromium, executablePath } = require("./browser-runtime.cjs");
const path = require("path");

const fixture = {
  summary: { total: 8, extracted: 5, reconstructed: 1, substitute: 1, private: 1 },
  items: [
    { id: "home", title: "Home HTML", path: "sources/pages/home.html", url: "https://lusion.co/", kind: "text", status: "extracted", bytes: 59671, description: "공개 홈 HTML 원문" },
    { id: "css", title: "Main CSS", path: "sources/site.css", url: "https://lusion.co/_astro/about.CNa9RfUh.css", kind: "text", status: "extracted", bytes: 200000, description: "공개 CSS 번들" },
    { id: "js-large", title: "Runtime JS", path: "sources/site.js", url: "https://lusion.co/_astro/hoisted.CUO_IjfL.js", kind: "text", status: "extracted", bytes: 900000, description: "큰 JS 번들은 제한 안내 확인용" },
    { id: "image", title: "Porsche Home Image", path: "sources/assets/lusion.dev/assets/projects/porsche_dream_machine/home.webp", url: "https://lusion.dev/assets/projects/porsche_dream_machine/home.webp", kind: "image", status: "extracted", bytes: 202000, description: "프로젝트 이미지" },
    { id: "video", title: "Desktop Reel", path: "sources/assets/lusion.dev/assets/textures/reel/desktop.mp4", url: "https://lusion.dev/assets/textures/reel/desktop.mp4", kind: "video", status: "extracted", bytes: 12000000, description: "릴 영상" },
    { id: "audio", title: "Hover Sound", path: "sources/assets/lusion.dev/assets/audios/hover_0.ogg", url: "https://lusion.dev/assets/audios/hover_0.ogg", kind: "audio", status: "extracted", bytes: 12000, description: "오디오 효과" },
    { id: "font", title: "Aeonik Regular", path: "sources/assets/lusion.co/assets/fonts/Aeonik-Regular.woff2", url: "https://lusion.co/assets/fonts/Aeonik-Regular.woff2", kind: "font", status: "private", bytes: 33000, description: "권리 확인 필요 폰트" },
    { id: "buf", title: "Home Cross Buffer", path: "sources/assets/lusion.dev/assets/models/home/cross.buf", url: "https://lusion.dev/assets/models/home/cross.buf", kind: "data", status: "substitute", bytes: 64200, description: "편집 원본이 아닌 배포 버퍼. 대체 미리보기 표시." }
  ]
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const errors = [];
  const badResponses = [];
  const checks = [];
  const root = path.resolve(__dirname, "..");

  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    const url = response.url();
    if (!url.endsWith("/source-index.js") && response.status() >= 400) badResponses.push({ url, status: response.status() });
  });

  function check(name, passed) {
    checks.push({ name, passed: Boolean(passed) });
    if (!passed) throw new Error(name);
  }

  await page.route("**/source-index.js", route => route.fulfill({
    contentType: "text/javascript",
    body: `window.LUSION_SOURCE_INDEX=${JSON.stringify(fixture)};`
  }));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:4187/source-explorer.html", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(root, "screenshots/source-explorer-desktop.png"), fullPage: true });
  check("fixture rows render", await page.locator(".source-row").count() === fixture.items.length);
  check("summary total renders", await page.locator('[data-summary="total"]').textContent() === "8");
  check("default text source is textContent", (await page.locator("#code-view code").textContent()).includes("<!DOCTYPE html>"));
  await page.locator("#kind-filter").selectOption("image");
  check("image filter", await page.locator(".source-row").count() === 1);
  await page.locator("#kind-filter").selectOption("all");
  await page.locator("#status-filter").selectOption("substitute");
  check("status filter", await page.locator(".source-row-title").textContent() === "Home Cross Buffer");
  await page.locator(".source-row").click();
  check("binary substitute preview", (await page.locator(".binary-preview").textContent()).includes("대체 미리보기"));
  await page.locator("#status-filter").selectOption("all");
  await page.locator("#source-search").fill("Runtime");
  await page.locator(".source-row").click();
  await page.waitForFunction(() => document.querySelector("#code-status")?.textContent.includes("앞부분"));
  check("large text preview", (await page.locator("#code-status").textContent()).includes("앞부분"));
  await page.locator("#source-search").fill("zzz-no-result");
  check("empty state", await page.locator("#empty-list").isVisible());
  await page.locator("#source-search").fill("Home HTML");
  await page.locator(".source-row").click();
  await page.locator("#code-tab").click();
  await page.locator("#copy-code").click();
  check("copy code", (await page.evaluate(() => navigator.clipboard.readText())).includes("<!DOCTYPE html>"));
  check("desktop no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4187/source-explorer.html", { waitUntil: "networkidle" });
  await page.locator(".source-row").nth(3).click();
  await page.screenshot({ path: path.join(root, "screenshots/source-explorer-mobile.png"), fullPage: true });
  check("mobile detail after selection", await page.locator("#detail-title").textContent() === "Porsche Home Image");
  check("mobile no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  await page.goto(`file://${path.join(root, "source-explorer.html")}`, { waitUntil: "load" });
  check("file protocol usable", await page.locator(".source-row").count() > 0 || await page.locator("#data-state").isVisible());
  check("no page errors", errors.length === 0);
  check("no bad responses", badResponses.length === 0);

  console.log(JSON.stringify({ checks: checks.length, screenshots: ["screenshots/source-explorer-desktop.png", "screenshots/source-explorer-mobile.png"] }));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
