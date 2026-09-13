import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launchBrowser} from './browser-runtime.mjs';
const browser=await launchBrowser();const checks=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
try {
 const page=await browser.newPage({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173/#start');await page.getByRole('heading',{name:'프로젝트에 사용하기'}).waitFor();
 check('Closed mobile navigation is inert',await page.locator('#studio-nav').evaluate(e=>e.inert));
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 check('Open navigation receives focus',await page.locator('#studio-nav').evaluate(e=>e.contains(document.activeElement)));
 await page.keyboard.press('Shift+Tab');check('Navigation wraps focus',await page.getByRole('link',{name:'Open original Apple website'}).evaluate(e=>e===document.activeElement));
 await page.keyboard.press('Tab');check('Navigation wraps to first item',await page.locator('.brand').evaluate(e=>e===document.activeElement));
 await page.keyboard.press('Escape');check('Navigation restores trigger focus',await page.getByRole('button',{name:'Open navigation',exact:true}).evaluate(e=>e===document.activeElement));
 await page.locator('.skip-link').focus();await page.keyboard.press('Enter');check('Skip link focuses main without changing route',await page.locator('#workspace').evaluate(e=>e===document.activeElement)&&new URL(page.url()).hash==='#start');
 await page.getByRole('textbox',{name:'프로젝트 이름'}).fill('');check('Empty name announces error',await page.getByText('프로젝트 이름을 입력해 주세요.',{exact:true}).isVisible());
 await page.getByRole('textbox',{name:'프로젝트 이름'}).fill('Customer portal');await page.getByRole('button',{name:'변경 사항 확인',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'설정 확인'});await dialog.waitFor();check('Review focuses confirmation',await dialog.getByRole('button',{name:'확인',exact:true}).evaluate(e=>e===document.activeElement));
 await dialog.getByRole('button',{name:'확인',exact:true}).click();check('Form confirms submitted project',await page.getByText('Customer portal 설정을 반영했습니다.',{exact:true}).isVisible());
 await page.getByRole('radio',{name:'Dark',exact:true}).click();check('Preview uses dark tokens',await page.locator('.project-demo').getAttribute('data-ds-theme')==='dark');
 for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});check(`Project guide fits ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:`evidence/local/project-final-${width}.png`,fullPage:true,animations:'disabled'});}
 await page.getByRole('button',{name:'복사',exact:true}).first().click();check('Installation command copies correctly',await page.evaluate(()=>navigator.clipboard.readText())==='npm install ./source-design-system-0.1.0.tgz');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'컴포넌트 패키지 다운로드'}).click();const download=await downloadPromise;check('Installable package downloads',download.suggestedFilename()==='source-design-system-0.1.0.tgz'&&(await fs.readFile(await download.path())).equals(await fs.readFile('app/public/source-design-system-0.1.0.tgz')));
 check('No runtime errors',errors.length===0);await fs.writeFile('evidence/project-verification.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,errors}));
} finally {await browser.close();}
