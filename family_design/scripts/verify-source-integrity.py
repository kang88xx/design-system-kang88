"""Validate included assets by bytes, hash, file signature and source mappings."""
import hashlib,json,pathlib,xml.etree.ElementTree as ET,zipfile,argparse
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--archive',action='store_true');args=parser.parse_args()
manifest=json.loads((ROOT/'source-library.json').read_text());errors=[];verified=[];ids=set();missing=[]
for item in manifest['items']:
 if item['id'] in ids:errors.append('Duplicate id: '+item['id'])
 ids.add(item['id'])
 relative=item.get('path')
 if not relative:
  missing.append({'id':item['id'],'status':item['status'],'sourceUrl':item.get('sourceUrl')});continue
 file=(ROOT/relative).resolve()
 if not file.is_relative_to(ROOT.resolve()) or not file.is_file():errors.append('Missing or out-of-root: '+relative);continue
 data=file.read_bytes()
 if len(data)!=item['bytes']:errors.append('Size mismatch: '+relative)
 if hashlib.sha256(data).hexdigest()!=item['sha256']:errors.append('Hash mismatch: '+relative)
 ext=file.suffix.lower();clean=data.lstrip()
 if ext in ('.png','.jpg','.jpeg','.webp','.gif','.woff','.woff2','.mp4'):
  if clean[:15].lower().startswith((b'<!doctype html',b'<html')):errors.append('HTML saved as media: '+relative)
 if ext=='.png' and not data.startswith(b'\x89PNG\r\n\x1a\n'):errors.append('Invalid PNG: '+relative)
 if ext in ('.jpg','.jpeg') and not data.startswith(b'\xff\xd8'):errors.append('Invalid JPEG: '+relative)
 if ext in ('.woff','.woff2') and data[:4] not in (b'wOFF',b'wOF2'):errors.append('Invalid WOFF: '+relative)
 if ext=='.mp4' and b'ftyp' not in data[:32]:errors.append('Invalid MP4: '+relative)
 if ext=='.svg':
  try:
   tree=ET.fromstring(data)
   if tree.tag.split('}')[-1]!='svg':errors.append('Non-SVG document: '+relative)
  except ET.ParseError as e:errors.append('Malformed SVG: '+relative+': '+str(e))
 verified.append(relative)
# The portable consumer kit is part of the complete source inventory.
kit=ROOT/'design-system'
for source in kit.rglob('*'):
 if not source.is_file() or any(part.startswith('.') or part in ('__pycache__','node_modules') for part in source.relative_to(kit).parts):continue
 if source.suffix not in ('.js','.css','.json','.md','.html','.ts','.py'):continue
 relative=source.relative_to(ROOT).as_posix()
 if relative not in verified:errors.append('Project kit source absent from manifest: '+relative)
recon=json.loads((ROOT/'reconstruction-map.json').read_text())
for item in recon['items']:
 for relative in item['implementationPaths']+item['evidencePaths']+[item['preview'].split('#')[0]]:
  if not (ROOT/relative).is_file():errors.append('Broken reconstruction map: '+relative)
for gap in manifest['gaps']:
 for relative in gap.get('alternativePaths',[]):
  if not (ROOT/relative.split('#')[0]).exists():errors.append('Broken gap alternative: '+relative)
archive_count=None
if args.archive:
 with zipfile.ZipFile(ROOT/'family-design-system.zip') as archive:
  bad=archive.testzip()
  if bad:errors.append('ZIP CRC failure: '+bad)
  names=set(archive.namelist());archive_count=len(names)
  for relative in set(verified)|{'index.html','source-library.json','source-library-data.js','reconstruction-map.json','README.md','DESIGN.md'}:
   name='family-design-system/'+relative
   if name not in names:errors.append('ZIP missing: '+relative)
   elif archive.read(name)!=(ROOT/relative).read_bytes():errors.append('ZIP stale: '+relative)
result={'date':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'status':'passed' if not errors else 'failed','manifestEntries':len(manifest['items']),'verifiedLocalEntries':len(verified),'uniqueLocalFiles':len(set(verified)),'explicitUnavailableEntries':missing,'reconstructionGroups':len(recon['items']),'archiveEntries':archive_count,'errors':errors}
(ROOT/('references/v3-review/archive-integrity.json' if args.archive else 'references/v3-review/source-integrity.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='explicitUnavailableEntries'},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
