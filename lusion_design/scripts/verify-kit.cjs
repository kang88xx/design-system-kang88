const fs = require('node:fs');
const { chromium, executablePath } = require('./browser-runtime.cjs');
const BASE = process.env.KIT_BASE_URL || 'http://127.0.0.1:4187';
const checks = [], errors = [];
const check = (name, passed, detail) => checks.push({ name, passed: !!passed, ...(detail ? { detail } : {}) });
(async () => {
 const browser = await chromium.launch({headless:true, executablePath, args:['--no-sandbox']});
 const page = await browser.newPage();
 page.on('pageerror', error => errors.push(error.message));
 page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
 try {
  await page.goto(BASE + '/project-kit.html');
  await page.waitForSelector('#kit-preview[data-ds-runtime="ready"]');
  const ids = await page.locator('[data-recipe]').evaluateAll(nodes => nodes.map(node => node.dataset.recipe));
  check('All eighteen recipes available', ids.length === 18);
  for (const id of ids) {
   await page.locator(`[data-recipe="${id}"]`).click();
   check(id + ': matching copy source', await page.locator('#recipe-code').textContent().then(text => text.includes('class="ds-root"') && text.includes('kit/tokens.css')));
   for (const theme of ['light', 'dark']) {
    await page.selectOption('#kit-theme', theme);
    for (const width of [320, 390, 812, 1440]) {
     await page.setViewportSize({width,height:1000});
     if (id === 'button') check(`Auto layout preserves readable button width: ${theme} ${width}px`, await page.locator('#kit-preview .ds-grid--auto').evaluateAll(grids => grids.every(grid => [...grid.children].every(button => button.getBoundingClientRect().width >= Math.min(220, grid.getBoundingClientRect().width)-1))));
     const size = await page.evaluate(() => ({width:innerWidth,document:document.documentElement.scrollWidth, preview:document.querySelector('#kit-preview').getBoundingClientRect().width}));
     check(`${id}: ${theme} ${width}px has usable preview/no page overflow`, size.document <= width+1 && size.preview > 200, size.document > width+1 ? size : undefined);
    }
   }
  }
  await page.locator('[data-recipe="dialog"]').click();
  const opener = page.locator('#kit-preview [data-ds-dialog-open]');
  await opener.click();
  check('Recipe dialog opens modally', await page.locator('#kit-preview dialog').evaluate(node => node.matches(':modal')));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(50);
  check('Recipe dialog Escape restores opener focus', await opener.evaluate(node => node === document.activeElement));
  await page.locator('[data-recipe="tabs"]').click();
  const tabs = page.locator('#kit-preview [role="tab"]');
  await tabs.first().focus(); await page.keyboard.press('End');
  check('Recipe tabs keyboard End selects last', await tabs.last().getAttribute('aria-selected') === 'true');
  await page.locator('[data-recipe="toast"]').click();
  await page.locator('#kit-preview [data-ds-toast]').click();
  check('Recipe toast actually renders', await page.locator('#kit-preview [data-ds-toast-item]').count() === 1);
  await page.fill('#recipe-search','없는컴포넌트XYZ');
  check('Search empty state visible', await page.locator('#recipe-empty').isVisible());
  await page.fill('#recipe-search','');
  await page.locator('[data-recipe="button"]').click();
  await page.locator('[data-code="css"]').click();
  check('Copied theme overrides explicit theme selector', (await page.locator('#recipe-code').textContent()).includes('.ds-root[data-ds-theme]'));
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0,0); });
  await page.screenshot({path:'screenshots/project-kit-desktop-v4.png',fullPage:true});
  await page.setViewportSize({width:390,height:900});
  await page.screenshot({path:'screenshots/project-kit-mobile-v4.png',fullPage:true});

  await page.goto(BASE + '/kit/examples/index.html');
  await page.waitForSelector('.ds-root[data-ds-runtime="ready"]');
  for (const theme of ['light','dark']) {
   await page.selectOption('#theme-select',theme);
   for (const width of [320,390,812,1440]) {
    await page.setViewportSize({width,height:1000});
    check(`Standalone example ${theme} ${width}px: no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1));
   }
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.screenshot({path:`screenshots/kit-example-${theme}-v4.png`,fullPage:true});
  }
  await page.locator('#simulate-error').click();
  check('Example error is linked to input', await page.locator('#project-budget').getAttribute('aria-describedby') === 'budget-error' && await page.locator('#project-budget').getAttribute('aria-invalid') === 'true');
  await page.locator('#project-budget').fill('2500');
  check('Example error clears on correction', !(await page.locator('#project-budget').getAttribute('aria-invalid')));
  await page.locator('#settings-form [type="submit"]').click();
  check('Example reports local validation honestly', (await page.locator('[data-ds-toast-item]').last().textContent()).includes('서버에 저장하지 않습니다'));
  check('Reduced-motion progress settles immediately', await page.locator('#project-progress').evaluate(node => node.value === 74));
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0,0); });
  await page.waitForTimeout(100);
  await page.screenshot({path:'screenshots/kit-example-mobile-v4.png',fullPage:true});

  // Host fixture: core styles must not reset unrelated controls, even ds-* classes.
  await page.goto(BASE + '/kit/examples/index.html');
  const fixture = await page.evaluate(async () => {
   document.head.querySelector('link[href="./example.css"]').remove();
   document.body.innerHTML = '<button id="host" class="ds-button">Host</button><div class="ds-root" id="parent" data-ds-theme="dark"><div class="ds-root" id="child" data-ds-theme="light"><button class="ds-button ds-button--sm">Child</button></div></div>';
   const child = document.querySelector('#child');
   return {hostMin:getComputedStyle(document.querySelector('#host')).minHeight,childBg:getComputedStyle(child).getPropertyValue('--ds-color-bg').trim(),target:child.querySelector('button').getBoundingClientRect().height};
  });
  check('Core CSS leaves unrelated host button alone', fixture.hostMin === '0px');
  check('Explicit nested light theme survives dark parent', fixture.childBg === '#f0f1fa', fixture);
  check('Small button retains 44px target', fixture.target >=44);
  const tokenReport = await page.evaluate(async () => {
   const token = await fetch('/kit/tokens.json').then(r => r.json());
   const node=document.querySelector('#child'), failures=[];
   const normalized = s => s.replace(/\s+/g,' ').trim();
   for (const theme of ['light','dark']) {
    node.dataset.dsTheme=theme;
    const expected = {...token.cssVariables,...(theme==='dark'?token.themes.dark.cssVariables:{})};
    const style=getComputedStyle(node);
    for (const [key,value] of Object.entries(expected)) if(normalized(style.getPropertyValue(key))!==normalized(value)) failures.push({theme,key,expected:value,actual:style.getPropertyValue(key)});
   }
   const lum = hex => { const c=hex.match(/[a-f\d]{2}/ig).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722; };
   const contrast=[];
   for (const theme of ['light','dark']) {
    const t={...token.cssVariables,...(theme==='dark'?token.themes.dark.cssVariables:{})};
    for (const [fg,bg] of [['text','bg'],['text','surface'],['muted','surface'],['muted','bg'],['on-primary','primary'],['on-danger','danger']]) {
     const a=lum(t['--ds-color-'+fg]),b=lum(t['--ds-color-'+bg]);
     contrast.push({name:theme+' '+fg+'/'+bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
    }
   }
   return {failures,contrast,count:Object.keys(token.cssVariables).length};
  });
  check('JSON tokens equal actual computed CSS in both themes', !tokenReport.failures.length, tokenReport);
  for(const pair of tokenReport.contrast) check('Text contrast >=4.5: '+pair.name,pair.ratio>=4.5,{ratio:pair.ratio});
 } finally {
  await browser.close();
  check('No browser runtime/HTTP errors', !errors.length, errors.length?errors:undefined);
  const report={checked_at:new Date().toISOString(),checks,errors,passed:checks.every(c=>c.passed)};
  fs.writeFileSync('research/kit-browser-v4.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,failures:checks.filter(c=>!c.passed),errors},null,2));
  if(!report.passed) process.exitCode=1;
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
