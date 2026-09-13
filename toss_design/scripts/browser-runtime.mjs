import { createRequire } from 'node:module';
import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Browser tooling is optional development tooling; the delivered library has no dependencies.
export async function browserRuntime() {
  const require = createRequire(import.meta.url);
  let playwright;
  const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright'].filter(Boolean);
  const cache = path.join(os.homedir(), '.npm/_npx');
  for (const dir of await readdir(cache).catch(() => [])) candidates.push(path.join(cache, dir, 'node_modules/playwright'));
  for (const candidate of candidates) {
    try { playwright = require(candidate); break; } catch { /* Try an existing local installation. */ }
  }
  if (!playwright) throw new Error('Playwright is required for capture/QA. Set PLAYWRIGHT_MODULE to an existing installation.');
  const executables = [process.env.CHROMIUM_PATH, playwright.chromium.executablePath()].filter(Boolean);
  const browsers = path.join(os.homedir(), '.cache/ms-playwright');
  for (const dir of (await readdir(browsers).catch(() => [])).filter(name => /^chromium-/.test(name)).reverse()) {
    executables.push(path.join(browsers, dir, 'chrome-linux64/chrome'), path.join(browsers, dir, 'chrome-linux/chrome'));
  }
  for (const executablePath of executables) {
    try { await access(executablePath); return await playwright.chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] }); } catch { /* Try next installed browser. */ }
  }
  throw new Error('No usable Chromium found. Set CHROMIUM_PATH to an installed browser.');
}
