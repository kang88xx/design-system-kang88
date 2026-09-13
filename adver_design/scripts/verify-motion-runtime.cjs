/* Consumer lifecycle regressions: executes the source kit without generated demo wrappers. */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'references/verification/release');
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1100,height:900}});
  const checks = [], failures = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const samples = JSON.parse(fs.readFileSync(path.join(root,'design-system/motion-samples.json')));
  const test = async (name, run) => {
    try {await run();checks.push(name);console.log('PASS',name);} catch(e) {failures.push({name,error:e.message});console.log('FAIL',name,e.message);}
  };
  const setup = async (html) => {
    await page.goto('about:blank');
    await page.setContent('<style>body{margin:0}*{box-sizing:content-box}</style><div id="host">'+html+'</div>');
    for(const file of ['tokens.css','motion-kit.css']) await page.addStyleTag({path:path.join(root,'design-system',file)});
    await page.addScriptTag({path:path.join(root,'design-system/motion-kit.js')});
  };
  const sample = id => samples.find(s=>s.id===id).html;
  await test('motion components own their box sizing in unrelated hosts', async()=>{
    await setup(sample('hero'));
    assert.equal(await page.locator('.rm-sample').evaluate(n=>getComputedStyle(n).boxSizing),'border-box');
  });
  await test('ancestor and child mounts retain independent ownership',async()=>{
    await setup(sample('hero'));
    await page.evaluate(()=>{
      window.parentCleanup=ReferenceMotion.mount(document.querySelector('#host'));
      window.childCleanup=ReferenceMotion.mount(document.querySelector('[data-rm]'));
      childCleanup();
    });
    assert.equal(await page.locator('.rm-sample').evaluate(n=>n.classList.contains('rm-js-stopped')),false);
    await page.evaluate(()=>parentCleanup());
    assert.equal(await page.locator('.rm-sample').evaluate(n=>n.classList.contains('rm-js-stopped')),true);
  });
  await test('stale cleanup cannot unregister a newer mount',async()=>{
    await setup(sample('hero'));
    await page.evaluate(()=>{const host=document.querySelector('#host');const old=ReferenceMotion.mount(host);old();window.newCleanup=ReferenceMotion.mount(host);old();ReferenceMotion.setSpeed(2);});
    assert.equal(await page.locator('.rm-sample').evaluate(n=>n.classList.contains('rm-js-stopped')),false);
    await page.evaluate(()=>newCleanup());
    assert.equal(await page.locator('.rm-sample').evaluate(n=>n.classList.contains('rm-js-stopped')),true);
  });
  await test('mount discovers newly inserted children without duplicate handlers',async()=>{
    await setup(sample('hero'));
    await page.evaluate(html=>{window.clean=ReferenceMotion.mount(document.querySelector('#host'));const el=document.createElement('div');el.innerHTML=html;document.querySelector('#host').append(el);ReferenceMotion.mount(document.querySelector('#host'));},sample('benefits'));
    await page.locator('.rm-benefit button').first().click();
    assert(await page.locator('.rm-benefit').first().evaluate(n=>n.classList.contains('rm-active')));
    await page.evaluate(()=>clean());
  });
  await test('decimal counters preserve the consumer supplied precision',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await setup('<section class="rm-sample" data-rm="metrics"><div class="rm-metric"><strong data-rm-count="4.74" data-rm-suffix="×">4.74×</strong></div></section>');
    await page.evaluate(()=>ReferenceMotion.mount(document.querySelector('#host')));
    assert.equal(await page.locator('[data-rm-count]').innerText(),'4.74×');
    await page.emulateMedia({reducedMotion:'no-preference'});
  });
  await test('speed changes preserve active state instead of restarting counters',async()=>{
    await setup('<section class="rm-sample" data-rm="metrics"><div class="rm-metric"><strong data-rm-count="4.74" data-rm-suffix="×">4.74×</strong></div></section>');
    await page.evaluate(()=>ReferenceMotion.mount(document.querySelector('#host')));
    await page.waitForTimeout(1100);
    const before=await page.locator('[data-rm-count]').innerText();
    await page.evaluate(()=>ReferenceMotion.setSpeed(2));
    assert.equal(await page.locator('[data-rm-count]').innerText(),before);
    assert.equal(before,'4.74×');
  });
  await test('cleanup stops all motion and tolerates replay before final cleanup',async()=>{
    await setup(sample('hero'));
    await page.evaluate(()=>{const node=document.querySelector('#host');const clean=ReferenceMotion.mount(node);ReferenceMotion.replay(node);clean();clean();});
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running' && a.constructor.name !== 'CSSTransition').length),0);
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  });
  await browser.close();
  if(errors.length) failures.push({name:'page errors',error:errors.join(';')});
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'motion-runtime-result.json'),JSON.stringify({status:failures.length?'failed':'pass',checks,failures},null,2));
  if(failures.length)process.exitCode=1;
})();
