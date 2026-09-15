#!/usr/bin/env python3
"""Package the design-system folder as three-circles-project-kit.zip and an npm tarball."""
import pathlib,subprocess,zipfile,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
KIT=ROOT/'design-system'
zpath=ROOT/'three-circles-project-kit.zip'
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(KIT.rglob('*')):
        if p.is_file() and '__pycache__' not in p.parts and not p.name.startswith('._'):
            z.write(p,'design-system/'+p.relative_to(KIT).as_posix())
print('wrote',zpath.name,zpath.stat().st_size,'bytes')
try:
    out=subprocess.run(['npm','pack','--silent','--pack-destination',str(ROOT)],cwd=KIT,check=True,capture_output=True,text=True).stdout.strip()
    print('wrote',out)
except Exception as e:
    print('npm pack skipped:',e,file=sys.stderr)
