const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/henry/.bun/install/cache/playwright-core@1.58.2@@@1');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),base=process.env.BASE_URL||'http://localhost:8765';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}); const checks=[],errors=[],broken=[];
try {const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)broken.push(r.url())});
await page.goto(base);await page.waitForSelector('[data-source-search]');
const data=JSON.parse(fs.readFileSync(path.join(root,'source-library.json')));
assert.equal(await page.evaluate(()=>window.OpalSourceBrowser.filtered().length),data.items.length);checks.push('Full source inventory loads');
await page.selectOption('[data-rule-component]','hero');await page.fill('[data-rule-search]','padding');assert(await page.locator('.rule-item').count()>0);checks.push('Component CSS selector search');
assert.equal(await page.locator('[data-motion-id]').count(),14);
for(const button of await page.locator('[data-replay]').all())await button.click();
await page.locator('#motion-toggle').click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest('#motion-library')).length),0);checks.push('Integrated 14 motion demos and global reduced-motion cancellation');
await page.locator('#motion-toggle').click();

for(const cat of [...new Set(data.items.map(i=>i.category))]){await page.selectOption('[data-source-category]',cat);assert.equal(await page.evaluate(()=>window.OpalSourceBrowser.filtered().length),data.items.filter(i=>i.category===cat).length)}
checks.push('All category filters match inventory');await page.selectOption('[data-source-category]','all');
await page.fill('[data-source-search]','not-found-9f91a');assert.equal(await page.locator('.source-card').count(),0);await page.locator('[data-empty] [data-reset]').click();checks.push('Empty state reset');
const target=data.items.find(i=>i.path==='motion-library.js');assert(target);await page.fill('[data-source-search]',target.id);await page.locator('.source-card button').first().click();await page.waitForFunction(()=>document.querySelector('#source-inspector pre')?.textContent.length>100);await page.keyboard.press('Escape');assert.equal(await page.locator('#source-inspector').evaluate(e=>e.open),false);checks.push('Source code inspector and Escape');
await page.fill('[data-source-search]','');
const ids=new Set();let pages=0;
while(true){for(const id of await page.locator('[data-source-id]').evaluateAll(es=>es.map(e=>e.dataset.sourceId))){assert(!ids.has(id));ids.add(id)}pages++;const next=page.locator('[data-pagination] button').last();if(await next.isDisabled())break;await next.click();assert(pages<100)}assert.equal(ids.size,data.items.length);checks.push('Pagination reaches all '+ids.size+' sources');
for(const route of ['index.html','system.html','layout-recipes.html']){
 await page.goto(base+'/'+route);await page.evaluate(()=>document.fonts.ready);
 for(const width of [1440,1024,390]){await page.setViewportSize({width,height:900});await page.waitForTimeout(150);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,`${route} overflow ${width}`);await page.screenshot({path:path.join(root,`evidence/v2-${route.replace('.html','')}-${width}.png`)});}
 checks.push(route+' responsive at 1440/1024/390');
}
await page.goto('file://'+path.join(root,'index.html'));await page.waitForSelector('[data-source-search]');assert.equal(await page.locator('[data-motion-id]').count(),14);await page.fill('[data-source-search]','motion-library.js');assert(await page.locator('.source-card').count()>0);checks.push('file URL embedded inventory and motion');
await page.goto(base+'/');await page.addStyleTag({url:base+'/tokens.css'});await page.evaluate(()=>{for(const id of ['1gcdmbl','1u3r5fg','1d6orfm']){const e=document.createElement('p');e.className='opal-type-'+id;e.id='test-'+id;e.textContent='Test';document.body.append(e)}});
for(const [width,expected] of [[390,['15px','19px','70px']],[1024,['15px','19px','106px']],[1280,['16px','20px','150px']]]){await page.setViewportSize({width,height:900});assert.deepEqual(await page.evaluate(()=>['1gcdmbl','1u3r5fg','1d6orfm'].map(id=>getComputedStyle(document.querySelector('#test-'+id)).fontSize)),expected)}checks.push('Original responsive preset cascade at three widths');
assert.deepEqual(errors,[]);assert.deepEqual([...new Set(broken)],[]);const result={status:'passed',checks,errors,broken};fs.writeFileSync(path.join(root,'evidence/catalog-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
