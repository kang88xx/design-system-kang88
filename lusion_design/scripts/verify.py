"""Verify the delivered reference package, without contacting the original site."""
import pathlib,json,hashlib,re,urllib.parse,xml.etree.ElementTree as ET
R=pathlib.Path(__file__).resolve().parents[1]
errors=[];checks={}
m=json.loads((R/'research/asset-manifest.json').read_text());files=[x for x in m['entries'] if x.get('local')]
for x in files:
 p=R/x['local']
 if not p.is_file():errors.append('missing '+x['local']);continue
 data=p.read_bytes()
 if len(data)!=x['bytes'] or hashlib.sha256(data).hexdigest()!=x['sha256']:errors.append('hash/size '+x['local'])
checks['manifest_files_verified']=len(files)
for p in [*R.glob('tokens/*.json'),*R.glob('research/*.json')]:
 try:json.loads(p.read_text())
 except Exception as e:errors.append(str(p)+': '+str(e))
checks['json_files_parsed']=len([*R.glob('tokens/*.json'),*R.glob('research/*.json')])
for p in [R/'README.md',R/'DESIGN.md',*R.glob('media/*.md'),R/'research/pages.md',R/'research/assets.md',R/'research/verification.md',R/'research/verification-v2.md',R/'research/coverage-v2.md']:
 if not p.exists():errors.append('missing document '+str(p));continue
 for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if urllib.parse.urlparse(target).scheme or target.startswith('#'):continue
  f=(p.parent/urllib.parse.unquote(target.split('#')[0])).resolve()
  if not f.exists():errors.append(f'{p.name}: missing link {target}')
required=['Source of truth','Brand','Product goals','Personas and jobs','Information architecture','Design principles','Visual language','Components','Accessibility','Responsive behavior','Interaction states','Content voice','Implementation constraints','Open questions']
s=(R/'DESIGN.md').read_text()
checks['design_sections']=len(required)
for section in required:
 if '\n## '+section+'\n' not in s:errors.append('missing DESIGN section '+section)
metadata=json.loads((R/'research/media-metadata.json').read_text());checks['media_metadata_verified']=len(metadata)
for entry in metadata:
 if entry.get('error'):errors.append('media '+entry['url']+': '+entry['error'])
projects=json.loads((R/'research/projects.json').read_text());urls={x['url'] for x in files};checks['project_count']=len(projects)
for project in projects:
 for media in project['media']:
  if media['url'] not in urls:errors.append('missing gallery asset '+media['url'])
checks['gallery_media_references']=sum(len(x['media']) for x in projects)
icons=json.loads((R/'research/icon-manifest.json').read_text())
for x in icons['icons']+icons['external_icons']+icons['replicas']:
 p=R/x['path']
 try:ET.parse(p)
 except Exception as e:errors.append('SVG '+str(p)+': '+str(e))
checks['symbol_files_verified']=sum(len(icons[k]) for k in ['icons','external_icons','replicas'])
videos=json.loads((R/'research/video-frames.json').read_text())
frames=[(v,f) for v in videos for f in v['frames']]
for v,f in frames:
 if not (R/f['local']).is_file():errors.append('missing frame '+f['local'])
 if abs(f['time']-v['duration']*f['ratio'])>.25:errors.append('frame timestamp '+f['local'])
checks['video_frames_verified']=len(frames)
checks['gallery_text_panels']=sum(len(p.get('text_panels',[])) for p in projects)
report={'checks':checks,'errors':errors,'passed':not errors}
(R/'research/package-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
