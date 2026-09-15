"""Verify reproducible tokens, standalone references, and the actual npm archive."""
from pathlib import Path
import json
import re
import subprocess
import tempfile
import tarfile
root = Path(__file__).resolve().parents[1]
kit = root / 'design-system'
pkg = json.loads((kit / 'package.json').read_text())
assert pkg['name'] == '@opalhaus-design/system'
assert not pkg.get('dependencies')
before = (kit / 'tokens.css').read_text()
subprocess.run(['python3', str(kit / 'tools/build-tokens.py')], check=True)
assert before == (kit / 'tokens.css').read_text(), 'Token CSS was stale'
data = json.loads((kit / 'tokens.json').read_text())
for key, token in data['tokens'].items():
    assert token['status'] in ['extracted', 'measured', 'reconstructed']
    assert token['evidence'] and f'--ods-{key}: {token["value"]};' in before
for name in ['styles.css', 'tokens.css', 'index.js']:
    text = (kit / name).read_text()
    assert not re.search(r'https?://|\.\./assets|\.\./source', text), name
subprocess.run(['node', '--check', str(kit / 'index.js')], check=True)
with tempfile.TemporaryDirectory(prefix='opalhaus-verify-') as temp:
    with tarfile.open(root / 'opalhaus-design-system-1.0.0.tgz') as archive:
        assert all(member.name.startswith('package/') and '..' not in Path(member.name).parts and (member.isfile() or member.isdir()) for member in archive.getmembers())
        archive.extractall(temp)
    extracted = Path(temp) / 'package'
    for name in ['index.js','index.d.ts','styles.css','tokens.css','tokens.json','README.md','examples/starter.html']:
        assert (extracted / name).read_bytes() == (kit / name).read_bytes(), name
    subprocess.run(['node','--input-type=module','-e',"import {initOpalhaus} from './package/index.js'; if(typeof initOpalhaus !== 'function') process.exit(1)"], cwd=temp,check=True)
print(f'PASS: {len(data["tokens"])} evidence-annotated tokens, deterministic CSS, standalone source, exact npm archive, SSR-safe module import')
