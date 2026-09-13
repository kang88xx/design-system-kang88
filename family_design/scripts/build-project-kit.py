"""Build a small copyable kit and npm tarball from the package's explicit files."""
import json,pathlib,subprocess,zipfile,os
ROOT=pathlib.Path(__file__).resolve().parents[1]
kit=ROOT/'design-system'
result=subprocess.run(['npm','pack','--ignore-scripts','--json','--pack-destination',str(ROOT)],cwd=kit,text=True,capture_output=True,check=True)
meta=json.loads(result.stdout)[0]
archive=ROOT/'family-project-kit.zip'
temporary=ROOT/'.family-project-kit.tmp'
with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as bundle:
 for item in meta['files']:
  relative=pathlib.PurePosixPath(item['path'])
  if relative.is_absolute() or '..' in relative.parts:raise ValueError(str(relative))
  bundle.write(kit/relative,str(pathlib.PurePosixPath('design-system')/relative))
os.replace(temporary,archive)
print(json.dumps({'zip':archive.name,'zipBytes':archive.stat().st_size,'tarball':meta['filename'],'tarballBytes':meta['size'],'unpackedBytes':meta['unpackedSize'],'files':[x['path'] for x in meta['files']]},ensure_ascii=False,indent=2))
