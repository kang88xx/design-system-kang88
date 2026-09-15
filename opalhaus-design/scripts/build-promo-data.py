#!/usr/bin/env python3
"""Extract source-backed promotion assets and evidence; embed offline catalog payload."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source='source/js/d46c92adb536-script_main.BwHbeoB9.mjs'
s=(ROOT/source).read_text()
manifest=json.loads((ROOT/'assets/manifest.json').read_text())['files']
slugs=['voui19yhvlTrMW30lyYkvKkP2U','Te26rQp4D0RlgnQKdAe90TZYd0','2uHrE7dNBKBOPd52Y9tOXJKt8U','a3WP6yjGjkY8y1NygXdc9Rm4Yas']
slides=[]
for slug,title in zip(slugs,['All-Access Bundle','60+ Templates','Pay Once, Yours Forever','Access to Future Templates']):
 f=next(x for x in manifest if slug in x['url'] and 'scale-down-to=512' in x['url'])
 assert (ROOT/f['path']).is_file()
 slides.append({'src':f['path'],'alt':title,'originalUrl':f['url']})
evidence=[]
for name,start,end in [('banner component',19188,27730),('price component',27920,37300),('active instances',159380,160550),('slideshow scheduling',4350,5200)]:
 evidence.append({'name':name,'file':source,'offset':start,'offsetUnit':'unicode-character','excerpt':s[start:end]})
data={'slides':slides,'bannerHref':'https://pentaclay.com','href':'https://pentaclay-framer.blink.store/opalhaus-design-agency-marketing-template','banner':{'width':140,'height':60,'padding':4,'radius':8,'border':1.3,'interval':3000,'direction':'top','drag':False,'pauseOnHover':False,'transition':{'type':'spring','stiffness':200,'damping':40,'mass':1}},'buy':{'width':140,'height':36,'radius':10,'background':'#0a0a0a','hoverBackground':'#dd453d','font':'Inter','fontSize':14,'weight':600,'letterSpacing':'-0.05em','transition':{'type':'spring','duration':0.4,'bounce':0.25},'pressed':'No separate pressed variant in published source; native link activation.','appearance':{'y':[40,0],'opacity':[0.001,1],'delay':1.8,'stiffness':235,'damping':30,'mass':1}},'evidence':evidence,'limitations':'Published source values and original raster assets; native reconstruction, not Framer editing project. Duration/bounce price spring uses CSS approximation; banner spring is sampled from its physical parameters. Focus and pause controls are accessibility additions.'}
(ROOT/'promo-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'promo-library.js'
if p.exists():
 t=p.read_text();t=re.sub(r'/\* PROMO_DATA_START \*/.*?/\* PROMO_DATA_END \*/','/* PROMO_DATA_START */\nconst data = '+json.dumps(data,ensure_ascii=False)+';\n/* PROMO_DATA_END */',t,flags=re.S);
 sources={ext:(ROOT/f'design-system/components/promo-widget.{ext}').read_text() for ext in ['html','css','js']}
 t=re.sub(r'/\* PROMO_SOURCES_START \*/.*?/\* PROMO_SOURCES_END \*/',lambda m:'/* PROMO_SOURCES_START */\nconst sources = '+json.dumps(sources,ensure_ascii=False)+';\n/* PROMO_SOURCES_END */',t,flags=re.S)
 p.write_text(t)
print(f'Extracted {len(slides)} assets and {len(evidence)} source excerpts')
