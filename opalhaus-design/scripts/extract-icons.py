"""Extract and normalize SVG markup from published HTML, preserving provenance."""
from pathlib import Path
from urllib.parse import unquote
import re,json,hashlib,html
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent;out=root/'assets/icons';out.mkdir(exist_ok=True)
seen={};entries=[]
for p in (root/'pages').rglob('*.html'):
 if p.name.startswith('._'):continue
 s=p.read_text()
 for m in re.finditer(r'<svg\b[\s\S]*?</svg>',s):
  raw=m.group();svg=html.unescape(unquote(raw))
  svg=re.sub(r'\s+id="[^"]+"','',svg)
  svg=re.sub(r'var\(--[\w-]+,\s*([^)]*\([^)]*\)|[^)]+)\)\s*(?:/\*.*?\*/)?',r'\1',svg)
  if 'xmlns=' not in svg:svg=svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"',1)
  try:ET.fromstring(svg)
  except ET.ParseError:continue
  h=hashlib.sha256(svg.encode()).hexdigest()
  if h in seen:seen[h]['usedBy'].append(str(p.relative_to(root)));continue
  path='assets/icons/inline-'+h[:12]+'.svg';(root/path).write_text(svg)
  e={'path':path,'sourceFile':str(p.relative_to(root)),'offset':m.start(),'kind':'normalized-inline-svg','transform':'URL/HTML decode; remove instance ID; CSS variable fallback resolved for standalone SVG','usedBy':[str(p.relative_to(root))]};seen[h]=e;entries.append(e)
for e in entries:e['usedBy']=sorted(set(e['usedBy']))
(out/'manifest.json').write_text(json.dumps(entries,indent=2));print(len(entries),'unique standalone inline SVGs')
