import {launchBrowser} from './browser-runtime.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await launchBrowser({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 await page.goto('http://localhost:4173/#icons');
 await page.locator('.research-icon-grid button').first().waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('.research-icon-grid img')].filter(image=>image.getBoundingClientRect().top<innerHeight).every(image=>image.complete&&image.naturalWidth>0));
 const panel=page.locator('.research-code').filter({hasText:'SVG / actual captured source'});
 await panel.getByRole('button',{name:'Copy',exact:true}).click();
 assert.ok(await page.evaluate(()=>navigator.clipboard.readText()).then(value=>value.startsWith('<svg')));
 await page.waitForTimeout(2900);
 await page.screenshot({path:'evidence/local/research-icons-final-1440.png'});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(450);
 await page.screenshot({path:'evidence/local/research-icons-final-390.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await fs.writeFile('evidence/research-visual-verification.json',JSON.stringify({passed:true,visibleIconsDecoded:true,actualSvgClipboard:true,mobileOverflow:false,screenshots:['evidence/local/research-icons-final-1440.png','evidence/local/research-icons-final-390.png']},null,2));
 console.log('Visible SVG images, raw SVG clipboard and responsive screenshots passed.');
}finally{await browser.close();}
