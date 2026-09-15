#!/usr/bin/env python3
"""Rebuild source-backed design rules using only the checked-in capture (stdlib)."""
import json,re,hashlib
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
def read(p):return (ROOT/p).read_text()
def write(p,v):(ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def split_top(text,delimiter):
    out=[];start=0;depth=0;quote=None;escape=False
    for i,c in enumerate(text):
        if escape:escape=False;continue
        if c=='\\':escape=True;continue
        if quote:
            if c==quote:quote=None
            continue
        if c in '\"\'':quote=c
        elif c in '([':depth+=1
        elif c in ')]':depth-=1
        elif c==delimiter and depth==0:out.append(text[start:i]);start=i+1
    return out+[text[start:]]
def declarations(s):
    return dict((a.strip(),b.strip()) for x in split_top(s,';') if ':' in x for a,b in [x.split(':',1)])
def blocks(s,base=0,context=()):
    # Preserve character offsets while blanking comments. Respect quoted braces.
    s=re.sub(r'/\*.*?\*/',lambda m:' '*len(m[0]),s,flags=re.S)
    start=0;depth=0;quote=None;escape=False;opening=0
    for i,c in enumerate(s):
        if escape:escape=False;continue
        if c=='\\':escape=True;continue
        if quote:
            if c==quote:quote=None
            continue
        if c in '\"\'':quote=c
        elif c=='{':
            if depth==0:opening=i
            depth+=1
        elif c=='}':
            depth-=1
            if depth==0:
                selector=s[start:opening].strip();body=s[opening+1:i]
                if selector.startswith(('@media','@supports','@layer','@container')):yield from blocks(body,base+opening+1,context+(selector,))
                elif not selector.startswith('@'):yield selector,declarations(body),context,base+start
                start=i+1
class DOM(HTMLParser):
    def __init__(self):super().__init__();self.items=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('data-framer-name') or tag in ('h1','h2','h3','nav','footer','section'):self.items.append({'tag':tag,'name':a.get('data-framer-name'),'class':a.get('class',''),'id':a.get('id'),'inline':declarations(a.get('style',''))})
rules=[];by_class={};pages=[]
for p in sorted((ROOT/'source/css').glob('*.css')):
    if p.name.startswith('._'):continue
    rel=str(p.relative_to(ROOT));page=p.stem.removesuffix('-inline');html='pages/'+page+'.html';dom=DOM();dom.feed(read(html))
    pageids=[]
    for selector,props,context,offset in blocks(p.read_text()):
        # Framer's generated named component classes/presets identify authored rules.
        if not re.search(r'\.framer-(?!text\b|image\b|svg\b|body\b|html\b)[\w-]+',selector):continue
        rid='r-'+hashlib.sha256((rel+str(offset)+selector).encode()).hexdigest()[:12]
        rule={'id':rid,'selector':selector,'declarations':props,'conditions':list(context),'evidence':'source-css','source':{'file':rel,'characterOffset':offset}}
        rules.append(rule);pageids.append(rid)
        for cls in set(re.findall(r'\.(framer-[\w-]+)',selector)):by_class.setdefault((page,cls),[]).append(rid)
    pages.append({'id':page,'sourceHtml':html,'sourceCss':rel,'ruleIds':pageids,'regions':dom.items})
rulemap={r['id']:r for r in rules}
for page in pages:
    for region in page['regions']:
        region['ruleIds']=sorted(set(rid for cls in region['class'].split() for rid in by_class.get((page['id'],cls),[])))
    page['regionCount']=len(page['regions'])
write('design/extracted-rules.json',{'version':1,'scope':'Authored Framer class rules; CSS cascade retained; generic reset/font/runtime rules excluded. Conditions are not flattened. Inline values remain in region records.','ruleCount':len(rules),'rules':rules,'pages':pages})
original=json.loads(read('design/original-tokens.json'))
names=['accent','ink','white','white-40','secondary-orange','white-60','surface','ink-30']
colors={name:{'value':value,'sourceVariable':key,'evidence':'source-css','source':'source/css/home-inline.css'} for name,(key,value) in zip(names,original.items())}
presets={}
for rule in rules:
    for preset in set(re.findall(r'framer-styles-preset-[\w-]+',rule['selector'])):
        entry=presets.setdefault(preset,{'evidence':'source-css','rules':[]})
        signature=(rule['conditions'],rule['declarations'])
        if not any((r['conditions'],r['declarations'])==signature for r in entry['rules']):entry['rules'].append({k:rule[k] for k in ['id','conditions','declarations','source']})
measurements={}
for p in sorted((ROOT/'evidence').glob('*.json')):
    if p.name.startswith('._'):continue
    data=json.loads(p.read_text())
    if 'elements' in data:measurements[p.stem]=data
home=measurements['home-desktop'];components=[]
selected=[(i,e) for i,e in enumerate(home['elements']) if e['tag'] in ['NAV','FOOTER'] or (e['tag']=='SECTION' and e.get('name')) or e.get('name') in ['Primary','Hero services','Project container']]
seen=set()
for i,e in selected:
    key=(e.get('name'),e['class'])
    if key in seen:continue
    seen.add(key);ident=re.sub('[^a-z0-9]+','-',('navigation' if e['tag']=='NAV' else 'footer' if e['tag']=='FOOTER' else e['name']).lower()).strip('-')
    if any(c['id']==ident for c in components):ident+='-'+e['class'].split()[0].removeprefix('framer-')
    ids=sorted(set(r for cls in e['class'].split() for r in by_class.get(('home',cls),[])))
    states=[]
    for capture,data in measurements.items():
        if not (capture.startswith('home') or capture.startswith('faq') or capture.startswith('mobile-menu')):continue
        matches=[(n,x) for n,x in enumerate(data['elements']) if (x.get('name')==e.get('name') and x['tag']==e['tag']) or (x['tag']==e['tag'] and isinstance(x['class'],str) and e['class'].split()[0] in x['class'].split())]
        if matches:
            matches.sort(key=lambda pair: (pair[1]['class']!=e['class'],pair[1].get('name')!=e.get('name')))
            n,x=matches[0];states.append({'capture':capture,'evidence':'measured-browser','file':str(Path('evidence')/(capture+'.json')),'elementIndex':n,'viewport':data['viewport'],'rect':x['rect'],'css':x['css']})
    components.append({'id':ident,'name':e.get('name'),'tag':e['tag'],'class':e['class'],'sourceHtml':'pages/home.html','ruleIds':ids,'rules':[rulemap[r] for r in ids],'states':states,'previewId':ident,'verification':'source rules mapped; recorded computed states included; preview fidelity requires visual comparison'})
write('component-specs.json',{'version':1,'scope':'Homepage major regions and shared components. Source variants are retained verbatim; capture states are observations, not inferred design intent.','components':components})
# Reusable semantic roles use actual computed home typography across captured widths.
roles={}
for role,preset in [('display','1d6orfm'),('section-heading','1fkl8ck'),('footer-display','hviuc2')]:
    states=[]
    for cap in ['home-desktop','home-tablet','home-tablet-1024','home-mobile']:
        if cap not in measurements:continue
        data=measurements[cap];match=next(((i,e) for i,e in enumerate(data['elements']) if 'framer-styles-preset-'+preset in e['class']),None)
        if match:
            i,e=match;states.append({'capture':cap,'viewport':data['viewport'],'value':{k:e['css'][k] for k in ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing']},'evidence':'measured-browser','source':f'evidence/{cap}.json','elementIndex':i})
    roles[role]={'preset':'framer-styles-preset-'+preset,'measurements':states}
scales={}
for prop in ['gap','padding','border-radius','box-shadow','grid-template-columns','max-width']:
    values={}
    for r in rules:
        if prop in r['declarations']:
            val=r['declarations'][prop];values.setdefault(val,[]).append(r['id'])
    scales[prop]=[{'value':v,'occurrences':len(ids),'ruleIds':ids[:8],'evidence':'source-css'} for v,ids in sorted(values.items(),key=lambda x:(-len(x[1]),x[0]))]
media=sorted(set(c for r in rules for c in r['conditions'] if c.startswith('@media')))
tokens={'meta':{'name':'Opalhaus · extracted design system','version':2,'reference':'https://opalhaus.framer.website/','note':'Original values preserved. Semantic names are extraction aliases. Measured typography is labeled separately from source presets. Runtime reset defaults excluded.','motionSourceOfTruth':'motion-source-tokens.json'},'color':colors,'originalVariables':original,'typography':{'roles':roles,'presets':presets},'layout':scales,'componentLayout':{c['id']:{'measurements':[{'capture':s['capture'],'viewport':s['viewport'],'value':{k:s['css'][k] for k in ['padding','gap','maxWidth','borderRadius','boxShadow','position','overflow']},'source':s['file'],'elementIndex':s['elementIndex'],'evidence':'measured-browser'} for s in c['states'] if s['capture'] in ['home-desktop','home-tablet-1024','home-mobile']]} for c in components},'breakpoints':{'evidence':'source-css','conditions':media},'components':'component-specs.json','sourceRules':'design/extracted-rules.json'}
write('tokens.json',tokens)
css=['/* Generated by scripts/build-source-rules.py. Source values, with normalized names. */','@import url("./design/fonts.css");',':root {']
for name,obj in colors.items():css.append(f'  --opal-{name}: {obj["value"]};')
for name,value in original.items():css.append(f'  {name}: {value};')
css+=['  --opal-font: "Inter Tight", sans-serif;','}']
# Canonical export order: shared base first, responsive overrides after it.
# First occurrence across archived pages can encounter a mobile override first.
def cascade_order(rules):
    return sorted(rules,key=lambda rule:bool(rule['conditions']))
# Export original responsive preset declarations as opt-in utility classes.
for preset,obj in presets.items():
    for r in cascade_order(obj['rules']):
        mapped={k.removeprefix('--framer-'):v for k,v in r['declarations'].items() if k in ['--framer-font-family','--framer-font-size','--framer-font-weight','--framer-line-height','--framer-letter-spacing','--framer-text-transform','--framer-text-decoration']}
        if not mapped:continue
        body='.'+'opal-type-'+preset.removeprefix('framer-styles-preset-')+' { '+' '.join(k+': '+v+';' for k,v in mapped.items())+' }'
        for condition in reversed(r['conditions']):body=condition+' { '+body+' }'
        css.append(body)
for role,obj in roles.items():
    preset=presets[obj['preset']]
    for r in cascade_order(preset['rules']):
        names={'--framer-font-size':'size','--framer-line-height':'line-height','--framer-font-weight':'weight','--framer-letter-spacing':'tracking'}
        body=':root { '+' '.join('--opal-'+role+'-'+alias+': '+r['declarations'][key]+';' for key,alias in names.items() if key in r['declarations'])+' }'
        for condition in reversed(r['conditions']):body=condition+' { '+body+' }'
        css.append(body)
(ROOT/'tokens.css').write_text('\n'.join(css)+'\n')
sections=[]
for c in components:sections.append({'id':c['id'],'title':c['name'],'previewId':c['previewId'],'sourceHtml':c['sourceHtml'],'componentSpec':f'component-specs.json#'+c['id'],'ruleIds':c['ruleIds'],'evidenceFiles':sorted(set(s['file'] for s in c['states'])),'status':'source-extracted','previewStatus':'not-verified-by-extractor'})
write('source-coverage.json',{'version':2,'scope':'25 archived public routes. Authored CSS mapped to named DOM regions. Shared home components additionally map to measured browser evidence. Extraction is not a claim of full Framer project recovery or visual parity.','sections':sections,'pages':[{'id':p['id'],'sourceHtml':p['sourceHtml'],'sourceCss':p['sourceCss'],'regionCount':p['regionCount'],'ruleCount':len(p['ruleIds']),'evidenceFiles':[f'evidence/{p["id"]}.json'] if p['id'] in measurements else ['evidence/home-desktop.json'] if p['id']=='home' else [],'status':'source-extracted','visualVerification':'captured' if p['id'] in measurements or p['id']=='home' else 'not-captured','ruleMap':'design/extracted-rules.json#'+p['id']} for p in pages]})
print(json.dumps({'pages':len(pages),'rules':len(rules),'presets':len(presets),'components':len(components),'mediaQueries':len(media)},indent=2))
