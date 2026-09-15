import hashlib,json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
m=json.loads((root/'assets/manifest.json').read_text()); failures=[]
for f in m['files']:
 p=root/f['path']
 if not p.is_file():failures.append(f['path']+' missing');continue
 raw=p.read_bytes()
 if len(raw)!=f['bytes'] or hashlib.sha256(raw).hexdigest()!=f['sha256']:failures.append(f['path']+' mismatch')
lib=json.loads((root/'source-library.json').read_text())
for f in lib['items']:
 p=root/f['path']
 if not p.is_file():failures.append(f['path']+' missing indexed source');continue
 if hashlib.sha256(p.read_bytes()).hexdigest()!=f['sha256']:failures.append(f['path']+' stale library hash')
fonts=(root/'design/fonts.css').read_text()
for u in re.findall(r'url\(([^)]+)\)',fonts):
 if not (root/'design'/u.strip('\"\'')).is_file():failures.append('font '+u)
result={'originals':len(m['files']),'indexed':len(lib['items']),'failures':failures}
print(json.dumps(result,indent=2));assert not failures
