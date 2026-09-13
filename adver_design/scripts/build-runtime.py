"""Build an allowlisted consumer release, with authored code only and no research assets."""
from pathlib import Path
import json
import re
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / 'design-system'
VERSION = json.loads((DS / 'tokens.json').read_text())['meta']['version']
# Validate all source identifiers before creating any output or interpolating paths.
if not isinstance(VERSION, str) or not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', VERSION):
    raise ValueError('Runtime version must be a numeric major.minor.patch string')
sources = {kind: json.loads((DS / f'{kind}-samples.json').read_text()) for kind in ['motion', 'interaction']}
seen = set()
for items in sources.values():
    for item in items:
        identifier = item.get('id')
        if not isinstance(identifier, str) or not re.fullmatch(r'[a-z0-9-]+', identifier):
            raise ValueError(f'Invalid component ID: {identifier!r}')
        if identifier in seen:
            raise ValueError(f'Duplicate component ID: {identifier}')
        seen.add(identifier)
registry = []
for kind, items in sources.items():
    for item in items:
        markup = item['html']
        if item['id'] in ['form','buttons']:
            markup = markup.replace(f'data-ri="{item["id"]}"', f'data-ri="{item["id"]}" data-ri-mode="production"', 1)
        if item['id'] == 'form':
            markup = re.sub(r'<label\b[^>]*>(?:(?!</label>)[\s\S])*?data-ri-form-mode[\s\S]*?</label>', '', markup)
            markup = re.sub(r'(<p\b[^>]*data-ri-form-status[^>]*>)[\s\S]*?</p>', r'\1입력 내용을 확인한 뒤 요청을 보내세요.</p>', markup)
        registry.append({'id':item['id'],'title':item['title'],'kind':kind,'html':markup,
                         'files':['design-system/tokens.scoped.css',f'design-system/{kind}-kit.css',f'design-system/{kind}-kit.js'],
                         'adapter':{'form':'onSubmit','buttons':'onAction'}.get(item['id']),
                         'contract':'Components are namespaced, values are examples, and form/action handlers are consumer supplied.'})
(ROOT / 'components').mkdir(exist_ok=True)
for entry in registry:
    (ROOT / 'components' / f'{entry["id"]}.html').write_text(entry['html']+'\n')
(DS / 'components.js').write_text('/* Generated component markup. Source: *-samples.json; no research assets. */\nwindow.AdverComponents = ' + json.dumps({'version':VERSION,'components':registry},ensure_ascii=False).replace('</script','<\\/script') + ';\n')
(DS / 'components.json').write_text(json.dumps({'version':VERSION,'components':registry},ensure_ascii=False,indent=2)+'\n')
allowlist = [
    'design-system/tokens.scoped.css','design-system/tokens.json',
    'design-system/motion-kit.css','design-system/motion-kit.js',
    'design-system/interaction-kit.css','design-system/interaction-kit.js',
    'design-system/components.js','design-system/components.json',
    'starter/index.html','starter/app.css','starter/app.js','USAGE.md'
] + [f'components/{entry["id"]}.html' for entry in registry]
manifest = {'name':'adver-design-system','version':VERSION,
            'entry':'starter/index.html','runtime':'Vanilla DOM/CSS, no package dependencies',
            'scope':'Authored runtime, scoped tokens, component fragments and starter. No page-kit, original X/Recent assets, proprietary fonts, recording or source-browser research data.',
            'components':len(registry),'files':[]}
(ROOT / 'releases').mkdir(exist_ok=True)
with zipfile.ZipFile(ROOT / 'releases' / f'adver-system-{VERSION}.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in allowlist:
        data = (ROOT / name).read_bytes()
        manifest['files'].append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
        info = zipfile.ZipInfo(name, date_time=(2026,9,7,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        archive.writestr(info,data)
    content=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
    info=zipfile.ZipInfo('releases/runtime-manifest.json', date_time=(2026,9,7,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
    archive.writestr(info,content)
(ROOT / 'releases/runtime-manifest.json').write_text(content)
print(f'Built adver-system {VERSION}: {len(allowlist)} allowlisted files, {len(registry)} components.')
