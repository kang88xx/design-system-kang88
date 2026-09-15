#!/usr/bin/env python3
"""Wrap design-system/examples/starter.html's <main> in the studio shell to produce system.html."""
import pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
src=(ROOT/'design-system/examples/starter.html').read_text(encoding='utf-8')
main=re.search(r'<main id="demo-main".*?</main>',src,re.S).group(0)
main=main.replace('href="../README.md"','href="design-system/README.md"').replace('href="../CHANGELOG.md"','href="design-system/CHANGELOG.md"')
main=main.replace('class="demo-main"','class="demo-main as-workspace as-page-system"',1)
shell=(ROOT/'scripts/system-shell.html').read_text(encoding='utf-8')
out=shell.replace('<!--MAIN-->',main)
(ROOT/'system.html').write_text(out,encoding='utf-8')
print('system.html',len(out),'bytes')
