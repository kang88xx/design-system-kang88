import { createRequire } from 'node:module';
import { readdir, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Reuse an installed test runner; this helper never installs application dependencies.
export async function launchBrowser() {
  const require = createRequire(import.meta.url);
  let modulePath = process.env.PLAYWRIGHT_MODULE;
  if (!modulePath) {
    try { modulePath = require.resolve('playwright'); } catch {}
  }
  if (!modulePath) {
    const cache = path.join(homedir(), '.npm/_npx');
    for (const entry of await readdir(cache).catch(() => [])) {
      const candidate = path.join(cache, entry, 'node_modules/playwright/index.mjs');
      try { await access(candidate); modulePath = candidate; break; } catch {}
    }
  }
  if (!modulePath) throw new Error('An existing Playwright installation is required. Set PLAYWRIGHT_MODULE to its absolute index.mjs path.');
  const { chromium } = await import(pathToFileURL(path.resolve(modulePath)).href);
  const options = { headless: true, args: ['--no-sandbox'] };
  if (process.env.CHROMIUM_EXECUTABLE) options.executablePath = process.env.CHROMIUM_EXECUTABLE;
  try { return await chromium.launch(options); } catch (error) {
    if (options.executablePath) throw error;
    const cache = path.join(homedir(), '.cache/ms-playwright');
    for (const entry of (await readdir(cache).catch(() => [])).filter(x => /^chromium-\d+$/.test(x)).sort().reverse()) {
      for (const bin of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
        const executablePath = path.join(cache, entry, bin);
        try { await access(executablePath); return await chromium.launch({ ...options, executablePath }); } catch {}
      }
    }
    throw error;
  }
}
