"""Package source catalog, raw sources and project kit without workspace metadata."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
ROOT=Path(__file__).resolve().parent.parent
output=ROOT/'opalhaus-design-system.zip'
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted(ROOT.rglob('*')):
  rel=p.relative_to(ROOT)
  if not p.is_file() or any(x.startswith('.') or x=='__pycache__' for x in rel.parts) or p.suffix in ['.zip','.tgz','.pyc']:continue
  z.write(p,rel)
print(output.name,output.stat().st_size)
