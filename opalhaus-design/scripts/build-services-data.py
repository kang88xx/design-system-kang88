#!/usr/bin/env python3
"""Extract service states and copy the four original preview images into the installable kit."""
from pathlib import Path
import json,re,shutil
ROOT=Path(__file__).resolve().parents[1]
row='source/js/b04af18483f3-KbD64yvaE.DTnnafWx.mjs'
hero='source/js/56d9e2b185ec-OPWD7ZWkt3yivZbi40Zl69wwUoA2leUVbFXe0jpmNpE.kuRLFEra.mjs'
s=(ROOT/row).read_text();h=(ROOT/hero).read_text();manifest=json.loads((ROOT/'assets/manifest.json').read_text())['files']
items=[]
for i,(slug,label,short,asset) in enumerate(zip(['brand-strategy','visual-identity','content-systems','website-design'],['Brand Strategy','Visual Identity','Content System','Website Design'],['Brand Strategy','Visual Identity','Content Systems','Website Design'],['KrPpHKmRy2XLEf21lAOEfVKCA','OFbK57XQRHPx3cE38yULCCAK22M','qJ7UtCqFnNIWr4SocIe8e3Q3R3A','610feyFL6iJydBShdkcOX1JJI'])):
 matches=[f for f in manifest if '/images/'+asset+'.' in f['url']]
 f=next((f for f in matches if 'scale-down-to=1024' in f['url']),next((f for f in matches if 'scale-down-to=2048' in f['url']),matches[0]))
 dest='design-system/components/service-media/'+Path(f['path']).name;shutil.copyfile(ROOT/f['path'],ROOT/dest)
 items.append({'number':f'{i+1:02}','label':label,'heroLabel':short,'href':'https://opalhaus.framer.website/services/'+slug,'image':dest,'originalImage':f['url']})
evidence=[]
for name,file,content,start,end in [('Service row hover',row,s,650,8600),('Image variant callbacks',row,s,12000,13000),('Image positions and responsive variants',row,s,s.index('`.framer-pvGWB'),s.index('$.displayName')) ,('Hero rolling link',hero,h,1800,8200)]:
 evidence.append({'name':name,'file':file,'offset':start,'offsetUnit':'unicode-character','excerpt':content[start:end]})
data={'items':items,'renderedInstance':{'evidence':'evidence/text-services/service-default.json','white':'#ffffff','tag':{'text':'SERVICE','dotSize':8,'font':'Inter Tight','fontSize':14,'weight':500,'lineHeight':19.6,'letterSpacing':0.28},'heading':{'fontSize':62,'weight':600,'lineHeight':74.4,'letterSpacing':-1.24},'note':'Resolved white token differs from archived #f8f8f8 fallback; rendered instance uses orange dot, no parentheses.'},'row':{'spring':{'stiffness':400,'damping':65,'mass':1},'opacity':[0.44,1],'arrowSize':60,'arrowRotation':[0,-45],'arrowBackground':['#f8f8f8','#ff5d17'],'underlineWidth':['0%','100%'],'paddingY':32,'labelGap':70,'font':'Inter Tight','fontSize':40,'fontWeight':600},'media':{'width':471,'height':248,'radius':12,'direction':'up','persistOnLeave':True,'spring':{'duration':0.4,'bounce':0.2}},'hero':{'width':250,'rowHeight':46,'fontSize':18,'lineHeight':26,'mask':26,'gap':10,'translation':-36,'spring':{'duration':0.4,'bounce':0.2}},'responsive':{'homepageMobileBelow':1200,'mediaVisible':False,'rowPaddingY':20,'labelGap':10,'arrowSize':49,'textOpacity':1},'evidence':evidence,'limitations':'Native reconstruction from published Framer source. Physical row/entrance spring sampled from original parameters; duration/bounce image and hero springs use a CSS approximation. Focus mirrors hover for accessibility. No separate pressed scale exists in these source components.'}
(ROOT/'services-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
example=ROOT/'design-system/components/service-list.html'
if example.exists():
 local=[dict(item,image='service-media/'+Path(item['image']).name) for item in items]
 text=re.sub(r'/\* SERVICE_ITEMS_START \*/.*?/\* SERVICE_ITEMS_END \*/',lambda m:'/* SERVICE_ITEMS_START */\nconst items='+json.dumps(local,ensure_ascii=False)+';\n/* SERVICE_ITEMS_END */',example.read_text(),flags=re.S)
 example.write_text(text)
p=ROOT/'services-library.js'
if p.exists():
 t=p.read_text()
 for marker,value in [('DATA',data),('SOURCES',{ext:(ROOT/f'design-system/components/service-list.{ext}').read_text() for ext in ['html','css','js']})]:
  t=re.sub(r'/\* SERVICES_'+marker+r'_START \*/.*?/\* SERVICES_'+marker+r'_END \*/',lambda m:'/* SERVICES_'+marker+'_START */\nconst '+('data' if marker=='DATA' else 'sources')+' = '+json.dumps(value,ensure_ascii=False)+';\n/* SERVICES_'+marker+'_END */',t,flags=re.S)
 p.write_text(t)
print('Extracted 4 linked services, 4 original media assets and 4 source excerpts')
