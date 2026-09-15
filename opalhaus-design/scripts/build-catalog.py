"""Refresh Edition 02 catalog data. HTML/CSS are maintained source, not overwritten."""
import subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
for name in ['extract-icons.py','build-source-rules.py','build-motion-data.py','build-promo-data.py','build-reveal-data.py','build-services-data.py','build-design-guide.py','build-source-library.py']:
 subprocess.run([sys.executable,str(root/'scripts'/name)],cwd=root,check=True)
print('Edition 02 data refreshed; index.html, system.html and layout-recipes.html preserved.')
