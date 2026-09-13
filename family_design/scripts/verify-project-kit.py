"""Verify the project kit by extracting, installing and importing it elsewhere."""
import hashlib,json,pathlib,subprocess,tempfile,zipfile,tarfile,os,datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
checks=[]
def run(args,cwd):
 result=subprocess.run(args,cwd=cwd,text=True,capture_output=True)
 if result.returncode:raise RuntimeError(' '.join(args)+'\n'+result.stdout+result.stderr)
 return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='family-kit-consumer-') as directory:
 temp=pathlib.Path(directory)
 with zipfile.ZipFile(ROOT/'family-project-kit.zip') as archive:
  assert archive.testzip() is None
  names=archive.namelist()
  for name in names:
   relative=pathlib.PurePosixPath(name)
   assert not relative.is_absolute() and '..' not in relative.parts
   assert relative.parts[0]=='design-system'
   assert not any(x in relative.parts for x in ('references','node_modules','__pycache__'))
   assert not name.endswith(('.woff','.woff2','.mp4','.png','.jpg','.svg','.pyc'))
   assert archive.read(name)==(ROOT/name).read_bytes(),f'Stale kit file {name}'
  archive.extractall(temp)
 checks.append('Copyable ZIP matches current package files, no reference/media/runtime dependency tree')
 kit=temp/'design-system';meta=json.loads((kit/'package.json').read_text())
 assert not meta.get('dependencies') and not meta.get('peerDependencies')
 before=(kit/'tokens.css').read_bytes()
 if (kit/'tools/build-tokens.py').is_file():
  run(['python3','tools/build-tokens.py','--check'],kit)
  assert (kit/'tokens.css').read_bytes()==before
  checks.append('Token generator validates in extracted standalone kit without original repository')
 else:raise AssertionError('Portable kit missing token generator')
 (temp/'package.json').write_text(json.dumps({'name':'family-kit-consumer-test','private':True,'type':'module'}))
 run(['npm','install',str(ROOT/'family-design-system-1.0.0.tgz'),'--ignore-scripts','--no-audit','--no-fund','--package-lock=false'],temp)
 output=run(['node','--input-type=module','-e',"import {initFamilySystem} from '@family-design/system';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);if(typeof initFamilySystem!=='function')throw Error('export');console.log(require.resolve('@family-design/system/styles.css'));if(typeof globalThis.document!=='undefined')throw Error('SSR fixture polluted');"],temp)
 assert output.endswith('styles.css')
 checks.append('Actual npm install in separate consumer: ESM export, CSS export path and SSR-safe import')
 (temp/'consumer.ts').write_text('''import '@family-design/system/styles.css';
import {initFamilySystem, type FamilySystemController, type FamilyTabChangeDetail} from '@family-design/system';
const root: HTMLElement = document.createElement('div');
const ui: FamilySystemController = initFamilySystem(root);
const globalUi = initFamilySystem(document);
root.addEventListener('fds:tabchange', event => { const detail: FamilyTabChangeDetail = event.detail; console.log(detail.panelId); });
document.addEventListener('fds:dialogchange', event => { const open: boolean = event.detail.open; console.log(open); });
ui.destroy();globalUi.destroy();
// @ts-expect-error string is not a valid root
initFamilySystem('invalid');
''')
 version=run(['npm','exec','--offline','--yes','--package=typescript','--','tsc','--version'],temp)
 run(['npm','exec','--offline','--yes','--package=typescript','--','tsc','--noEmit','--strict','--module','nodenext','--target','es2022','--lib','es2022,dom','consumer.ts'],temp)
 checks.append('Strict TypeScript consumer compiles CSS import, controller and typed element/document events; invalid root rejected')
 installed=temp/'node_modules/@family-design/system'
 for name in names:
  rel=pathlib.PurePosixPath(name).relative_to('design-system')
  assert (installed/rel).read_bytes()==(kit/rel).read_bytes(),f'Tarball differs from ZIP {rel}'
 checks.append('npm-installed files and copyable ZIP are byte-identical')
 result={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'passed','typescript':version,'checks':checks,'zipBytes':(ROOT/'family-project-kit.zip').stat().st_size,'tarballBytes':(ROOT/'family-design-system-1.0.0.tgz').stat().st_size,'fileCount':len(names),'errors':[]}
 (ROOT/'references/v4-review/package-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2))
