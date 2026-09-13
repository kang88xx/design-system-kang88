/* Requires an existing Playwright installation, not a project dependency. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const {pathToFileURL} = require('url');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8766';
const out = path.resolve(__dirname, '../references/verification');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(out, {recursive:true});
const checks = [];
let browser;
(async () => {
  browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => {if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);});
  const go = async () => {
    await page.goto(`${base}/motion.html`, {waitUntil:'networkidle'});
    await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  };
  const check = (name) => {checks.push(name); console.log('PASS',name);};
  await go();
  assert.equal(await page.locator('.lab-card').count(),13);
  assert.equal(await page.locator('#coverage-rows tr').count(),13);
  const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n=>n.id));
  assert.equal(new Set(ids).size,ids.length,'unique page IDs');
  check('13 code-backed samples and coverage rows with unique IDs');
  const sourceContract = await page.evaluate(() => ({
    samples: ReferenceLabData.samples.map(sample => ({
      id: sample.id,
      kind: sample.kind,
      html: sample.html,
      hasCard: Boolean(document.querySelector(`#sample-${sample.id}`)),
      hasCodeAction: Boolean(document.querySelector(`#sample-${sample.id} [data-action="code"]`))
    })),
    files: Object.fromEntries(Object.entries(ReferenceLabData.files).map(([name, content]) => [name, content.length])),
    standalone: Object.fromEntries(Object.entries(ReferenceLabData.standalone).map(([id, content]) => [id, content]))
  }));
  const motionSourceIds = JSON.parse(fs.readFileSync(path.join(root,'design-system/motion-samples.json'),'utf8')).map(sample => sample.id);
  const interactionSourceIds = JSON.parse(fs.readFileSync(path.join(root,'design-system/interaction-samples.json'),'utf8')).map(sample => sample.id);
  const expectedSourceIds = [...motionSourceIds, ...interactionSourceIds];
  assert.deepEqual(sourceContract.samples.map(sample => sample.id), expectedSourceIds, 'rendered sample order follows source JSON');
  assert.deepEqual(Object.keys(sourceContract.standalone), expectedSourceIds, 'standalone payloads cover every sample');
  assert.deepEqual(Object.keys(sourceContract.files), ['tokens.css','tokens.scoped.css','motion-kit.css','motion-kit.js','interaction-kit.css','interaction-kit.js']);
  for (const [name, length] of Object.entries(sourceContract.files)) {
    assert(length > 1000, `${name} source payload should not be empty or truncated`);
  }
  for (const sample of sourceContract.samples) {
    assert(sample.hasCard, `${sample.id} has rendered card`);
    assert(sample.hasCodeAction, `${sample.id} has code action`);
    const marker = sample.kind === 'motion' ? `data-rm="${sample.id}"` : `data-ri="${sample.id}"`;
    assert(sample.html.includes(marker), `${sample.id} HTML contains its kit marker`);
    assert(sourceContract.standalone[sample.id].includes(marker), `${sample.id} standalone contains its kit marker`);
    assert(sourceContract.standalone[sample.id].includes('--color-bg'), `${sample.id} standalone includes token source`);
    assert(sourceContract.standalone[sample.id].includes(sample.kind === 'motion' ? 'ReferenceMotion' : 'ReferenceInteractions'), `${sample.id} standalone includes matching runtime API`);
  }
  check('source JSON, generated source payloads and standalone HTML cover all 13 samples');
  await page.locator('[data-filter=motion]').click();
  assert.equal(await page.locator('.lab-card:visible').count(),6);
  await page.locator('[data-filter=interaction]').click();
  assert.equal(await page.locator('.lab-card:visible').count(),7);
  await page.locator('#sample-search').fill('no-match-xyz');
  assert(await page.locator('#no-results').isVisible());
  await page.locator('#sample-search').fill('');
  await page.locator('[data-filter=all]').click();
  check('category and text filtering with empty state');
  await page.locator('#sample-hero [data-action=code]').click();
  assert(await page.locator('#code-dialog').isVisible());
  assert((await page.locator('#code-content').innerText()).includes('data-rm="hero"'));
  await page.locator('#code-html').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#code-css').getAttribute('aria-selected'),'true');
  assert((await page.locator('#code-content').innerText()).includes('--color-bg'));
  await page.keyboard.press('End');
  assert((await page.locator('#code-content').innerText()).includes('ReferenceMotion'));
  await page.locator('#copy-code').click();
  await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.includes('복사'));
  const download = page.waitForEvent('download');
  await page.locator('#download-code').click();
  assert.equal((await download).suggestedFilename(),'hero.html');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#code-dialog').isVisible()));
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'code');
  check('HTML/CSS/JS source tabs, copy feedback, download and dialog focus restoration');
  for (const sample of sourceContract.samples) {
    await page.locator(`#sample-${sample.id} [data-action=code]`).click();
    assert(await page.locator('#code-dialog').isVisible(), `${sample.id} code dialog opens`);
    await page.locator('#code-html').click();
    const htmlSource = await page.locator('#code-content').innerText();
    assert(htmlSource.includes(sample.kind === 'motion' ? `data-rm="${sample.id}"` : `data-ri="${sample.id}"`), `${sample.id} HTML tab exposes sample source`);
    await page.locator('#code-css').click();
    assert((await page.locator('#code-content').innerText()).includes(sample.kind === 'motion' ? '.rm-' : '.ri-'), `${sample.id} CSS tab exposes matching kit source`);
    await page.locator('#code-js').click();
    assert((await page.locator('#code-content').innerText()).includes(sample.kind === 'motion' ? 'ReferenceMotion' : 'ReferenceInteractions'), `${sample.id} JS tab exposes matching kit source`);
    const sampleDownload = page.waitForEvent('download');
    await page.locator('#download-code').click();
    assert.equal((await sampleDownload).suggestedFilename(),`${sample.id}.html`,`${sample.id} download filename`);
    await page.keyboard.press('Escape');
  }
  check('all 13 sample source dialogs expose matching HTML, CSS, JS and downloads');
  await page.locator('#sample-tabs [data-action=reference]').click();
  await page.waitForFunction(()=>{const v=document.querySelector('#lab-video');return v.readyState>0 && Math.abs(v.currentTime-14)<.15;});
  await page.keyboard.press('Escape');
  assert(await page.locator('#lab-video').evaluate(v=>v.paused));
  check('reference video opens at sample timestamp and pauses on dialog close');
  const hero = page.locator('.rm-hero-core');
  await hero.scrollIntoViewIfNeeded();
  await page.locator('#sample-hero [data-action=replay]').click();
  const transform = () => hero.evaluate(el=>getComputedStyle(el).transform);
  const first = await transform();
  await page.waitForFunction(initial=>getComputedStyle(document.querySelector('.rm-hero-core')).transform!==initial, first,{timeout:6500});
  await page.locator('#pause-all').click();
  await page.waitForTimeout(120);
  const frozen = await transform();
  await page.waitForTimeout(400);
  assert.equal(await transform(), frozen);
  await page.locator('#pause-all').click();
  check('hero actually animates; global pause freezes and resume restores motion');
  const tabSample = page.locator('[data-ri=tabs]');
  const tabs = tabSample.locator('[role=tab]');
  await tabs.first().click();
  await page.keyboard.press('End');
  assert.equal(await tabs.last().getAttribute('aria-selected'),'true');
  const titleAtEnd = await tabSample.locator('[data-ri-panel-title]').innerText();
  await page.keyboard.press('Home');
  assert.notEqual(await tabSample.locator('[data-ri-panel-title]').innerText(),titleAtEnd);
  await tabs.nth(1).click();await tabs.nth(2).click();await tabs.nth(3).click();
  assert.equal(await tabs.last().getAttribute('aria-selected'),'true');
  check('campaign keyboard navigation and rapid tab switches');
  const carousel = page.locator('[data-ri=carousel]');
  await carousel.locator('[data-ri-next]').click();
  assert((await carousel.locator('[data-ri-carousel-status]').innerText()).startsWith('2'));
  await carousel.locator('[data-ri-prev]').click();
  assert((await carousel.locator('[data-ri-carousel-status]').innerText()).startsWith('1'));
  await carousel.locator('[data-ri-dot]').last().click();
  assert((await carousel.locator('[data-ri-carousel-status]').innerText()).startsWith('3'));
  check('carousel previous/next/dot controls');
  const form = page.locator('[data-ri=form]');
  await form.locator('[type=submit]').click();
  assert.equal(await form.locator('[aria-invalid=true]').count(),3);
  await form.locator('[name=name]').fill('테스트 사용자');
  await form.locator('[name=company]').fill('Example Studio');
  await form.locator('[name=email]').fill('bad-email');
  await form.locator('[type=submit]').click();
  assert.equal(await form.locator('[name=email]').getAttribute('aria-invalid'),'true');
  await form.locator('[name=email]').fill('hello@example.com');
  await form.locator('[data-ri-form-mode]').selectOption('failure');
  await form.locator('[type=submit]').click();
  assert.equal(await form.locator('[data-ri-form-status]').getAttribute('data-state'),'error');
  await form.locator('[data-ri-form-mode]').selectOption('pending');
  await form.locator('[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('[data-ri-form-status]').dataset.state==='success');
  await form.locator('[type=reset]').click();
  assert.equal(await form.locator('[name=email]').inputValue(),'');
  check('form invalid/email validation, simulated failure, delayed success and reset');
  const faq = page.locator('[data-ri=faq]');
  const faqButton = faq.locator('[data-ri-faq-button]').nth(1);
  await faqButton.click();await faqButton.click();await faqButton.click();
  await page.waitForTimeout(350);
  assert.equal(await faqButton.getAttribute('aria-expanded'),'true');
  const panelId = await faqButton.getAttribute('aria-controls');
  assert(await page.locator(`#${panelId}`).evaluate(el=>el.offsetHeight>0));
  await faqButton.click();
  assert.equal(await faqButton.getAttribute('aria-expanded'),'false');
  check('FAQ rapid reversal leaves correct expanded and collapsed states');
  await page.locator('#lab-theme').click();
  const themeSample = page.locator('[data-ri=theme]');
  await themeSample.locator('[data-ri-theme-choice=light]').click();
  assert.equal(await themeSample.getAttribute('data-theme'),'light');
  assert.equal(await themeSample.evaluate(el=>getComputedStyle(el).getPropertyValue('--color-bg').trim()),'#ffffff');
  await themeSample.locator('[data-ri-theme-choice=dark]').click();
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-ri=theme]').getAttribute('data-theme'),'dark');
  check('scoped light under dark and persisted theme selection');
  await page.setViewportSize({width:375,height:900});
  const nav = page.locator('[data-ri=navigation]');
  await nav.locator('[data-ri-nav-toggle]').click();
  assert.equal(await nav.locator('[data-ri-nav-toggle]').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await nav.locator('[data-ri-nav-toggle]').getAttribute('aria-expanded'),'false');
  assert(await nav.locator('[data-ri-nav-toggle]').evaluate(el=>document.activeElement===el));
  check('mobile navigation Escape and focus restoration');
  for(const width of [1440,768,375]) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(()=>scrollTo(0,0));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`document overflow at ${width}`);
    for(const theme of ['light','dark']) {
      await page.evaluate(theme=>document.body.dataset.theme=theme,theme);
      const coreColor=await page.locator('.rm-hero-core').evaluate(el=>getComputedStyle(el).fill);
      assert.equal(coreColor,theme==='dark'?'rgb(255, 255, 255)':'rgb(0, 0, 0)','motion ink follows nested theme');
      await page.screenshot({path:path.join(out,`motion-${theme}-${width}.png`)});
    }
  }
  check('1440/768/375 light and dark layouts without horizontal document overflow');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(150);
  const infinite = await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.getTiming().iterations===Infinity && a.playState==='running').length);
  assert.equal(infinite,0,'reduced motion must stop all infinite effects');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  await page.locator('#sample-hero [data-action=replay]').click();
  assert.equal(await page.evaluate(()=>document.querySelector('.rm-hero-core').getAnimations().length),0);
  check('live reduced-motion stops loops, resolves replay and disables smooth scrolling');
  const sampleData = await page.evaluate(()=>ReferenceLabData.samples.map(s=>({id:s.id,kind:s.kind})));
  for(const sample of sampleData) {
    const single = await context.newPage();
    const singleErrors=[];
    single.on('pageerror', e=>singleErrors.push(e.message));
    await single.goto(pathToFileURL(path.join(root,`samples/${sample.id}.html`)).href,{waitUntil:'load'});
    assert.equal(await single.locator('[data-rm],[data-ri]').count(),1,`${sample.id} standalone marker`);
    assert.equal(await single.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${sample.id} standalone overflow`);
    await single.setViewportSize({width:375,height:900});
    assert.equal(await single.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${sample.id} standalone mobile overflow`);
    await single.locator('#replay').click();
    await single.locator('#speed').selectOption('2');
    await single.locator('#pause').click();
    assert.equal(await single.locator('#pause').getAttribute('aria-pressed'),'true');
    await single.locator('#theme').click();
    assert.equal(await single.locator('body').getAttribute('data-theme'),'dark');
    assert.deepEqual(singleErrors,[],`${sample.id} errors`);
    await single.close();
  }
  check('13 standalone HTML files work over file:// with no external dependencies');
  assert.deepEqual(errors,[]);
  check('no uncaught page errors or failed HTTP resources');
  const result={date:new Date().toISOString(),status:'pass',samples:13,checks,limits:['Exact original duration/easing and unobserved states are proposals','No real form backend or complete WCAG certification','Browsers tested: installed Chromium; no Safari/Firefox run']};
  fs.writeFileSync(path.join(out,'motion-result.json'),JSON.stringify(result,null,2)+'\n');
  await browser.close();
})().catch(async error=>{console.error(error);fs.writeFileSync(path.join(out,'motion-result.json'),JSON.stringify({date:new Date().toISOString(),status:'failed',checks,error:error.message},null,2)+'\n');if(browser)await browser.close();process.exit(1);});
