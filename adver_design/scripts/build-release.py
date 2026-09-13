"""Rebuild tokens, demos, consumer release and full source archive in dependency order."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
for script in ['build-tokens.py','build-samples.py','build-runtime.py','build-library.py']:
    subprocess.run([sys.executable, str(ROOT/'scripts'/script)],cwd=ROOT,check=True)
print('Release built. Run the verification commands in README.md before shipping.')
