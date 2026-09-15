/* Developer test only. Uses installed Playwright; no package runtime dependency. */
const { chromium } = require(process.env.OPAL_PLAYWRIGHT_PATH || '/Users/henry/.bun/install/cache/playwright-core@1.58.2@@@1');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'opal-kit-browser-'));
 fs.cpSync(path.resolve(__dirname, '../design-system'), temp, {recursive:true});
 const server = http.createServer((req,res) => {
   const file = path.resolve(temp, '.' + new URL(req.url, 'http://localhost').pathname);
   if (!file.startsWith(temp + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {res.writeHead(404).end();return;}
   res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
   res.end(fs.readFileSync(file));
 });
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
   browser = await chromium.launch({headless:true,executablePath:process.env.OPAL_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
   const page = await browser.newPage({viewport:{width:390,height:844}});
   const errors = [], remote = [];
   page.on('pageerror', error => errors.push(error.message));
   page.on('request', request => {if (!request.url().startsWith('http://127.0.0.1:')) remote.push(request.url());});
   const url = `http://127.0.0.1:${server.address().port}/examples/starter.html`;
   await page.goto(url);
   await page.waitForSelector('[data-ods-enhanced]');
   assert.equal(await page.locator('#navigation').isVisible(),false);
   await page.locator('[data-ods-nav-toggle]').click();
   assert.equal(await page.locator('#navigation').isVisible(),true);
   await page.locator('#navigation a').first().focus();
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#navigation').isVisible(),false);
   assert.equal(await page.locator('[data-ods-nav-toggle]').evaluate(el=>el===document.activeElement),true);
   await page.locator('[data-ods-nav-toggle]').click();
   await page.locator('#navigation a').first().click();
   assert.equal(await page.locator('#navigation').isVisible(),false);
   await page.setViewportSize({width:1280,height:900});
   assert.equal(await page.locator('#navigation').isVisible(),true);
   assert.equal(await page.locator('[data-ods-nav-toggle]').isVisible(),false);
   await page.locator('.ods-faq summary').first().focus();
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('.ods-faq').first().getAttribute('open'),'');
   await page.locator('[data-ods-ticker-toggle]').click();
   assert.equal(await page.locator('.ods-ticker').getAttribute('data-paused'),'true');
   assert.equal(await page.locator('[data-ods-ticker-toggle]').getAttribute('aria-pressed'),'true');
   await page.locator('#name').fill('Test'); await page.locator('#email').fill('test@example.com');await page.locator('#message').fill('Project');
   await page.locator('[type=submit]').click(); assert.equal(await page.locator('#form-status').isVisible(),true);
   for (const width of [390,810,1280]) {
     await page.setViewportSize({width,height:900});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
   }
   const lifecycle = await page.evaluate(async()=>{
     const {initOpalhaus}=await import('../index.js'); const root=document.querySelector('#app');const ui=initOpalhaus(root);
     const duplicate=ui===initOpalhaus(root);ui.destroy();ui.destroy();
     const restored=!document.querySelector('.ods-nav').hasAttribute('data-ods-enhanced')&&!document.querySelector('#navigation').hidden;
     const next=initOpalhaus(root);const el=document.createElement('p');el.setAttribute('data-ods-reveal','');el.textContent='dynamic';root.append(el);next.refresh();
     const enhanced=el.hasAttribute('data-ods-pending');next.destroy();const clean=!el.hasAttribute('data-ods-pending');
     return {duplicate,restored,enhanced,clean};
   });
   assert.deepEqual(lifecycle,{duplicate:true,restored:true,enhanced:true,clean:true});
   await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
   assert.equal(await page.locator('[data-ods-pending]').count(),0);
   assert.equal(await page.locator('.ods-ticker__track').evaluate(el=>getComputedStyle(el).animationName),'none');
   const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(url);
   assert.equal(await nojs.locator('#navigation').isVisible(),true);
   assert.equal(await nojs.locator('.ods-display').evaluate(el=>getComputedStyle(el).opacity),'1');
   assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   console.log('PASS: isolated Chrome mobile/desktop navigation, Escape/focus, FAQ keyboard, ticker pause, form, 3 viewport overflow checks, init/refresh/destroy, reduced motion, no-JS, zero external requests/errors');
 } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
