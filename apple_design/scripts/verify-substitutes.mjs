import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launchBrowser} from './browser-runtime.mjs';
const browser=await launchBrowser();const checks=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173/#reconstructions');await page.locator('.recon-hero').waitFor();
 check('Single main landmark',await page.locator('main').count()===1);
 const store=page.locator('.recon-menu-buttons').getByRole('button',{name:'Store',exact:true});await store.click();check('Menu opens',await store.getAttribute('aria-expanded')==='true');await page.keyboard.press('Escape');check('Menu closes on Escape',await store.getAttribute('aria-expanded')==='false');
 await page.getByRole('textbox',{name:'Search replacement states'}).fill('no-match-1938');check('Search empty state',await page.getByText('No matching local substitute.').isVisible());
 await page.getByRole('textbox',{name:'Search replacement states'}).fill('');
 await page.getByRole('button',{name:'Add iPhone 17 Pro',exact:true}).click();await page.getByRole('button',{name:'Add iPhone 17 Pro',exact:true}).click();check('Bag quantity increments',await page.locator('.recon-bag-row small').textContent().then(t=>t.includes('× 2')));await page.getByRole('button',{name:'Remove iPhone 17 Pro'}).click();check('Bag decrements',await page.locator('.recon-bag-row small').textContent().then(t=>t.includes('× 1')));await page.getByRole('button',{name:'Remove iPhone 17 Pro'}).click();check('Bag empty state',await page.getByText('Your bag is empty.',{exact:true}).isVisible());
 await page.getByRole('checkbox',{name:'Demo signed in'}).check();check('Account demo toggles',await page.getByText('Saved devices visible',{exact:true}).isVisible());
 const family=page.getByRole('radiogroup',{name:'Product family'});await family.getByRole('radio').first().click();await page.keyboard.press('ArrowRight');check('Product tabs support keyboard',await family.getByRole('radio').nth(1).getAttribute('aria-checked')==='true');
 const colors=page.locator('.recon-color-nav button');if(await colors.count()>1){await colors.nth(1).click();check('Color selection updates',await colors.nth(1).getAttribute('aria-pressed')==='true');}
 await page.getByRole('button',{name:'Details',exact:true}).click();check('Named modal opens',await page.getByRole('dialog').isVisible()&&!!await page.getByRole('dialog').getAttribute('aria-labelledby'));await page.keyboard.press('Escape');check('Modal closes and restores focus',await page.getByRole('dialog').count()===0&&await page.getByRole('button',{name:'Details',exact:true}).evaluate(e=>e===document.activeElement));
 await page.getByRole('radiogroup',{name:'Replacement area'}).getByRole('radio',{name:'AirPods',exact:true}).click();await page.getByText('Heart Rate Sensing',{exact:true}).last().click();check('AirPods named disclosure expands',await page.locator('details[open]').count()>0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.recon-product-stage')?.dataset.reducedMotion==='true');check('Reduced motion honored',await page.locator('.recon-product-stage').getAttribute('data-reduced-motion')==='true');
 check('No runtime errors',errors.length===0);await fs.writeFile('evidence/substitutes-verification.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,errors}));
}finally{await browser.close();}
