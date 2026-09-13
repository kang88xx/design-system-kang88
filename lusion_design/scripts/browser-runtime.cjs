// Optional capture/verification tooling. The delivered catalog needs no Node dependencies.
const fs = require('fs');
const path = require('path');
const os = require('os');
function playwright() {
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  try { return require('playwright'); } catch {}
  const cache = path.join(os.homedir(), '.npm', '_npx');
  if (fs.existsSync(cache)) for (const dir of fs.readdirSync(cache)) {
    const candidate = path.join(cache, dir, 'node_modules', 'playwright');
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error('Install optional Playwright capture tooling or set PLAYWRIGHT_MODULE.');
}
function executable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  if (fs.existsSync(cache)) for (const dir of fs.readdirSync(cache).filter(x => /^chromium-\d+$/.test(x)).sort().reverse()) {
    for (const tail of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const candidate = path.join(cache, dir, tail);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}
module.exports = { chromium: playwright().chromium, executablePath: executable() };
