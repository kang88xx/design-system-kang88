const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const {pathToFileURL}=require('url');const path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.join(__dirname,'text-reveal.html')).href);await page.waitForSelector('.opal-text-reveal__char');
 const result=await page.evaluate(()=>{
  const hero=document.querySelector('#hero');const chars=[...hero.querySelectorAll('.opal-text-reveal__char')];
  return {text:hero.querySelector('h2').getAttribute('aria-label'),visualHidden:hero.querySelector('.opal-text-reveal__visual').getAttribute('aria-hidden'),characters:chars.length,firstDelay:chars[0].getAnimations()[0]?.effect.getTiming().delay,secondDelay:chars[1].getAnimations()[0]?.effect.getTiming().delay,lastDelay:chars.at(-1).getAnimations()[0]?.effect.getTiming().delay,label:hero.querySelector('.opal-text-reveal__label').textContent,dot:getComputedStyle(hero.querySelector('.opal-text-reveal__label'),'::before').backgroundColor};
 });
 if(result.text!=='Opalhaus® Visual Collective'||result.visualHidden!=='true'||result.characters!==27)throw Error('full accessible text '+JSON.stringify(result));
 if(Math.abs(result.firstDelay-100)>.001||Math.abs(result.secondDelay-150)>.001||Math.abs(result.lastDelay-1400)>.001)throw Error('source stagger');
 if(result.label!=='BRAND ARCHITECTS'||result.dot!=='rgb(255, 93, 23)')throw Error('label');
 await page.locator('#replay-hero').click();await page.waitForTimeout(2000);if(await page.locator('#hero').getAttribute('data-reveal-state')!=='complete')throw Error('settling');
 await page.locator('#replay-service').click();const service=await page.evaluate(()=>{const host=document.querySelector('#service');const group=host.querySelector('.opal-text-reveal__group');return {characters:host.querySelectorAll('.opal-text-reveal__char').length,animations:group.getAnimations().length,keyframes:group.getAnimations()[0]?.effect.getKeyframes()[0]};});
 if(service.characters!==0||service.animations!==1||service.keyframes.transform!=='translateY(150px)')throw Error('service group '+JSON.stringify(service));
 await page.evaluate(()=>{document.documentElement.dataset.reducedMotion='true';window.dispatchEvent(new Event('opal:motion-change'));});await page.waitForTimeout(20);if(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length))throw Error('reduced motion');
 await page.evaluate(()=>{delete document.documentElement.dataset.reducedMotion;OpalTextReveal.mount('#hero',{trigger:'manual'});OpalTextReveal.mount('#hero',{trigger:'manual'});});
 if(await page.locator('#hero .opal-text-reveal__heading').count()!==1)throw Error('repeat mount');
 await page.setViewportSize({width:390,height:844});await page.locator('#replay-service').click();if(await page.locator('#service').getAttribute('data-reveal-state')!=='static')throw Error('source mobile disable');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('mobile overflow');
 await page.evaluate(()=>OpalTextReveal.destroy());if(await page.evaluate(()=>document.getAnimations().length))throw Error('destroy');
 const indexPath=path.resolve(__dirname,'../../index.html');
 if(require('fs').existsSync(indexPath)){
  await page.goto(pathToFileURL(indexPath).href);await page.waitForSelector('[data-reveal-ready="true"]');
  await page.evaluate(()=>{document.documentElement.dataset.reducedMotion='true';});await page.evaluate(()=>document.fonts.ready);
  await page.locator('.reveal-stage-characters').scrollIntoViewIfNeeded();
  const bounds=await page.locator('.reveal-stage-characters').evaluate(stage=>{
    const r=stage.getBoundingClientRect();return {stage:{left:r.left,right:r.right,width:r.width},viewport:innerWidth,filter:getComputedStyle(stage,'::before').filter,dot:getComputedStyle(stage.querySelector('.opal-text-reveal__label'),'::before').backgroundColor,clipped:[...stage.querySelectorAll('.opal-text-reveal__char')].filter(char=>{const b=char.getBoundingClientRect();return b.left<r.left-.5||b.right>r.right+.5||b.top<r.top-.5||b.bottom>r.bottom+.5;}).map(char=>char.textContent)};
  });
  if(bounds.clipped.length||bounds.stage.right>bounds.viewport||bounds.stage.left<0)throw Error('gallery child clipping '+JSON.stringify(bounds));
  if(bounds.filter!=='grayscale(1)'||bounds.dot!=='rgb(255, 93, 23)')throw Error('background-only grayscale');
  await page.locator('.reveal-stage-characters').screenshot({path:'/tmp/opal-reveal-fixed-mobile.png'});
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({hero:result,service:{group:true,initialY:150},replay:true,reducedMotion:true,mobileDisable:true,reinit:true,noOverflow:true,pageErrors:errors}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
