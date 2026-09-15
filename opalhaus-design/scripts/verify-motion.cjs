const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/henry/.bun/install/cache/playwright-core@1.58.2@@@1');
const fs=require('fs');
const base=require('path').resolve(__dirname,'..')+'/';
fs.writeFileSync('/tmp/opal-motion-test.html',`<!doctype html><html><head><meta charset="utf-8"><base href="file://${base}"><link rel="stylesheet" href="design/fonts.css"><link rel="stylesheet" href="motion-library.css"></head><body style="margin:30px;font-family:Arial"><main id="motion-library"></main><script defer src="motion-library.js"></script></body></html>`);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///tmp/opal-motion-test.html');await page.waitForSelector('[data-motion-ready="true"]');
 const count=await page.locator('.motion-card').count();if(count!==14)throw Error('card count '+count);
 const imageOk=await page.locator('.motion-image img').evaluate(n=>n.complete&&n.naturalWidth>0);if(!imageOk)throw Error('image not loaded');
 await page.locator('[data-motion-id="faq"]').scrollIntoViewIfNeeded();
 const faq=page.locator('.motion-faq-item button');await faq.nth(0).click();await faq.nth(1).click();await page.waitForTimeout(700);
 if(await page.locator('.motion-faq-item button[aria-expanded="true"]').count()!==2)throw Error('multiopen');
 await faq.nth(0).click();await faq.nth(0).click();await page.waitForTimeout(700);
 if(await page.locator('#motion-answer-0').isHidden())throw Error('rapid toggle');
 const menu=page.locator('.motion-mobile header button');await menu.click();await page.keyboard.press('Escape');if(await menu.getAttribute('aria-expanded')!=='false')throw Error('escape');
 const submit=page.locator('.motion-submit');for(const state of ['Loading','Disabled','Success','Error','Default']){await submit.click();if(await submit.getAttribute('data-state')!==state)throw Error('form '+state);}
 for(let i=0;i<14;i++){await page.locator('[data-replay]').nth(i).click();}
 await page.evaluate(()=>{document.documentElement.dataset.reducedMotion='true';window.dispatchEvent(new Event('opal:motion-change'));});
 await page.waitForTimeout(100);
 let running=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);if(running)throw Error('reduced '+running);
 await page.evaluate(()=>window.OpalMotion.init());if(await page.locator('.motion-card').count()!==14)throw Error('repeat init');
 await page.evaluate(()=>{window.OpalMotion.destroy();window.OpalMotion.init();});
 if(await page.locator('.motion-card').count()!==14)throw Error('destroy init');
 const spring=await page.evaluate(()=>[0,.1,.5,2,4].map(t=>window.OpalMotion.springProgress(t,100)));if(Math.abs(spring[4]-1)>.001)throw Error('spring settle');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:base+'evidence/motion-mobile-validation.png'});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({cards:count,fileProtocol:true,localArtwork:imageOk,multiOpen:true,rapidToggle:true,menuEscape:true,formStates:5,replay:14,reducedMotionRunning:running,reinit:true,mobileOverflow:false,pageErrors:errors,springSamples:spring}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
