"""Create a portable source/reference bundle without runtime caches."""
import pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
target=root/'family-design-system.zip'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
 for source in sorted(root.rglob('*')):
  rel=source.relative_to(root)
  if not source.is_file() or source==target or any(x.startswith('.') or x in ('__pycache__','node_modules') for x in rel.parts):continue
  if source.suffix == '.pyc':continue
  archive.write(source,str(pathlib.Path('family-design-system')/rel))
print(f'Portable package: {target.name} ({target.stat().st_size/1024/1024:.1f} MB)')
