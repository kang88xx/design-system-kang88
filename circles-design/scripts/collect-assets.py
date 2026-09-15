#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Download every image the live page references (from live-effects.json allImages + live-source.html) and rebuild references/assets-manifest.json with roles."""
import json, re, pathlib, hashlib, urllib.request, os
ROOT = pathlib.Path(__file__).resolve().parents[1]; REF = ROOT / 'references'; ASSETS = REF / 'assets'; ASSETS.mkdir(exist_ok=True)
eff = json.loads((REF / 'live-effects.json').read_text())
src = (REF / 'live-source.html').read_text(encoding='utf-8')
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36', 'Accept': 'image/svg+xml,image/png,image/jpeg,image/*'}
ctx = {}
for i in eff['allImages']:
    for u in [i['src'], *i['srcset']]:
        ctx.setdefault(u, i)
urls = set(ctx) | set(u.split('?')[0] for u in re.findall(r'https://framerusercontent\.com/images/[^"\'\s)>&]+', src))
FAN = {'yOGH0VMe0dxDvOWCTEYdA3mM', 'wV00y50FP7VauWUCrxOvtC71n9w', 'AFqibCRH55ISngIoZcqWp5WHHU', 'YggtxYl2AEg0mgpkCRkPzPhJBA'}
def role_of(u, i):
    name = u.rsplit('/', 1)[1].split('.')[0]
    alt = (i or {}).get('alt', ''); sec = (i or {}).get('section', ''); fn = (i or {}).get('framerName', '')
    if 'FINFuWlDrvdTGrMGIQHG2CfiNQ' in u: return 'logo', 'three circles logo mark (3 shapes)'
    if name in FAN: return 'nav-fan', 'projects nav card image fan'
    if 'Y1rpbPtKnTjQTLhSQ5SACNd6MM' in u: return 'hero-circle', 'hero letter-o photo (90px circle)'
    if alt == 'Client': return 'client-logo', 'client ticker logo'
    if alt in ('Social Icon',) or name in ('X80bZzkkLRKGykPwJYCoGBmkAc', 'M6jES7Nekmucvc7x06OLkOa2FQ', 's7rMb4y8AKkybRtdqpSO5Xx58', '7n5N7HXPeeF40jSUMmjnacb8AS8', 'rzKeFADXLTHTWIFtlQU0gE4dlDM', 'sB6tdZyRKxUSaLMKd94lSQy2kSs', '8zTwq4050Ye50RzpyHJV8oA1YY', 'Xf2Q8Wzl7VPwvCCvRQ6GQLF9xiE'): return 'icon-social', 'social icon (sidebar / footer)'
    if alt in ('List Icon', 'Icon', 'Shape') or name in ('kgmUU8cJuSv0JwRfWoUg57n93sw', 'JCDk8i61Ec1N2laCFRxqdUPv0sM', 'fXyiOWTrGvtHLrru4JUf1FvRPw', 'ay3KCEennR2H9wBfTF0rgts6o', 'sQnMsrdmtbdGGohDHaN2mtKVGy4', 'A4Xf2pHVeBlAQlLKWrXDL9eWMwU', '7cES3finIJ41QzId3yZc4BVqqI', 'c6ZeLYaJC8zdoW1ayA0T4K5A', 'WFCNF7JcgklFHWsJlgfw0vVv2OI', 'IgXeAhCPhJKMkKz0lBBVUAThuHA', 'Yoi0yNdzYdY4keH6LHDYRJ7MsY'):
        return 'icon', {'kgmUU8cJuSv0JwRfWoUg57n93sw': 'rating stars', 'JCDk8i61Ec1N2laCFRxqdUPv0sM': 'arrow 21×21', 'A4Xf2pHVeBlAQlLKWrXDL9eWMwU': 'infinity shape (est.2015 → ∞)', '7cES3finIJ41QzId3yZc4BVqqI': 'chevron 9×14', 'fXyiOWTrGvtHLrru4JUf1FvRPw': 'arrow 13×9', 'ay3KCEennR2H9wBfTF0rgts6o': 'arrow 13×9 (blog)', 'sQnMsrdmtbdGGohDHaN2mtKVGy4': 'arrow 13×9 (footer)', 'c6ZeLYaJC8zdoW1ayA0T4K5A': 'list check (about nav card)', 'WFCNF7JcgklFHWsJlgfw0vVv2OI': 'list icon discover', 'IgXeAhCPhJKMkKz0lBBVUAThuHA': 'list icon design', 'Yoi0yNdzYdY4keH6LHDYRJ7MsY': 'list icon deliver'}.get(name, alt or 'icon')
    if name in ('QLhF04hBOb9L34XIibvs57mpNHM', 'Os4iHidNg3ghQBQ87Yt2s7KOXo'): return 'decoration', 'envelope illustration (contact)'
    if alt == 'Vector' or name == '17DMTvim49YUVPrBQP9hPqmcaY': return 'decoration', 'paperclip (about card)'
    if alt == 'Project Image': return 'photo-project', 'project image (featured 1400×650 / row thumb 90×42)'
    if alt == 'Project CTA Image': return 'photo-project-cta', 'other projects image stack'
    if alt == 'Founder Image': return 'photo-founder', 'about founder portrait'
    if alt == 'Service Image': return 'photo-service', 'service thumbnail 120×120'
    if alt == 'Avatar': return 'photo-avatar', 'testimonial / rating avatar'
    if alt == 'Blog Image': return 'photo-blog', 'blog thumbnail 810×420'
    if alt == 'BG Image' or name == 'QX9eyUg5EConzS4KaBAYAcYWkz8': return 'photo-results', 'results section background 1400×750'
    if name in ('Lqid88w7hgNx0d3SqdzlvRT6AU', 'Y6ot66J9kGvRmaMRheYt7c4M'): return 'meta', 'favicon / touch icon (head)'
    return 'other', alt or fn
manifest = []
for u in sorted(urls):
    i = ctx.get(u); role, note = role_of(u, i)
    name = u.rsplit('/', 1)[1]; ext = os.path.splitext(name)[1] or '.bin'
    fn = f"{role}-{name.split('.')[0][:12]}{ext}"; target = ASSETS / fn
    # reuse a previously downloaded copy under an older role name
    old = next((p for p in ASSETS.glob(f"*-{name.split('.')[0][:12]}{ext}") if p.name != fn), None)
    if old and not target.exists(): old.rename(target)
    dl = u + ('' if ext == '.svg' else '?width=1400')  # request a large rendition
    try:
        if not target.exists():
            data = urllib.request.urlopen(urllib.request.Request(dl, headers=UA), timeout=40).read(); target.write_bytes(data)
        data = target.read_bytes()
        manifest.append({'file': f'references/assets/{fn}', 'sourceUrl': u, 'role': role, 'alt': (i or {}).get('alt', ''), 'note': note, 'section': (i or {}).get('section', ''), 'framerName': (i or {}).get('framerName', ''), 'renderedSize': f"{(i or {}).get('w','?')}×{(i or {}).get('h','?')}", 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'status': 200})
    except Exception as e:
        manifest.append({'file': None, 'sourceUrl': u, 'role': role, 'alt': (i or {}).get('alt', ''), 'note': note, 'status': str(e)[:80]})
for p in ASSETS.glob('hero-circle-*'):
    if p.stem.split('-')[-1] in [x[:12] for x in FAN]: p.unlink()
fonts = [
 {'family': 'Bricolage Grotesque', 'weights': '400/500/600/700 loaded, 800 declared (Google Fonts variable, fonts.gstatic.com)', 'source': 'https://fonts.google.com/specimen/Bricolage+Grotesque'},
 {'family': 'Be Vietnam Pro', 'weights': '400/500/600 loaded; 700/900 + italics declared (Fontshare via framerusercontent third-party-assets)', 'source': 'https://www.fontshare.com/fonts/be-vietnam-pro'},
 {'family': 'Anonymous Pro', 'weights': '400 (footer email input code font)', 'source': 'https://fonts.google.com/specimen/Anonymous+Pro'},
 {'family': 'Geist', 'weights': '700 (Framer badge only)', 'source': 'https://fonts.google.com/specimen/Geist'},
 {'family': 'Inter', 'weights': 'Declared by Framer runtime; not used by rendered text', 'source': 'https://rsms.me/inter/'}]
roles = {}
for m in manifest: roles[m['role']] = roles.get(m['role'], 0) + 1
json.dump({'captured': '2026-09-14', 'site': 'https://three-circles-wbs.framer.website/', 'note': 'Every framerusercontent image referenced by the served HTML or rendered DOM at 1440px. Third-party template assets (Webestica / Framer), stored for documentation preview only; no license transfer implied. Raster files were requested at width=1400 (largest rendition).', 'roles': roles, 'assets': manifest, 'fonts': fonts}, open(REF / 'assets-manifest.json', 'w'), indent=2, ensure_ascii=False)
print(len(manifest), 'assets', roles, 'failed', [m['sourceUrl'][-30:] for m in manifest if m['status'] != 200])
