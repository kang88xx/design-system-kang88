"""Repair HTML-only named entities in standalone SVG exports; keep raw HTML evidence."""
import html.entities,re,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
def normalize(text):
 def replace(match):
  name=match.group(1)
  if name in {'amp','lt','gt','quot','apos'}:return match.group(0)
  value=html.entities.html5.get(name+';')
  return ''.join(f'&#{ord(char)};' for char in value) if value else match.group(0)
 return re.sub(r'&([a-zA-Z][a-zA-Z0-9]+);',replace,text)
if __name__=='__main__':
 fixed=[]
 for source in sorted((ROOT/'references').rglob('*.svg')):
  original=source.read_text();clean=normalize(original)
  ET.fromstring(clean)
  if clean!=original:source.write_text(clean);fixed.append(str(source.relative_to(ROOT)))
 print(f'Normalized {len(fixed)} standalone SVG files')
 for name in fixed:print(name)
