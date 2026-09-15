#!/usr/bin/env bash
# Design Systems Hub → GitHub Pages 배포 사본 빌드.
# 사용: bash All/deploy/build-site.sh [DEST]   (기본 DEST: ~/design-system-kang88)
# 1) 02_Source 를 rsync-excludes.txt(merge 필터: '- ' 제외 / '+ ' 포함) 기준으로 DEST에 복사(대용량 원본 제외, 삭제 동기화)
# 2) Apple Vite 빌드의 루트 절대 경로(/assets, /research …)를 /apple_design/app/dist/client/ 접두어로 재작성 (사본에서만)
# 3) 루트 index.html(→ /All/), CNAME, .nojekyll, README.md, .gitignore 생성
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"          # 02_Source
DEST="${1:-$HOME/design-system-kang88}"
DOMAIN="design.system.kang88.io"
mkdir -p "$DEST"
OPAL_IMG_MAX="${OPAL_IMG_MAX:-150000}"   # opalhaus 소스 이미지 배포 상한(바이트). 초과분은 제외 후 원본 CDN URL로 대체

echo "[0/3] Opalhaus 대용량 소스 이미지 동적 필터 (> $OPAL_IMG_MAX B, 소스 브라우저 데이터 밖에서 참조되는 파일은 유지)"
OPAL_FILTER="$(mktemp)"
python3 - "$SRC/opalhaus-design" "$OPAL_IMG_MAX" "$OPAL_FILTER" <<'PY'
import sys, pathlib
root = pathlib.Path(sys.argv[1]); limit = int(sys.argv[2]); out = pathlib.Path(sys.argv[3])
imgdir = root / "assets" / "images"
if not imgdir.is_dir(): out.write_text(""); sys.exit(0)
# 뷰어 HTML/CSS/JS(소스 브라우저 데이터 source-library-data.js 제외)가 직접 참조하는 이미지는 화면 구성 요소이므로 유지.
# 색인·데이터 JSON(manifest, source-library.json 등)의 참조는 2d 단계에서 원본 CDN URL로 대체된다.
texts = []
for p in root.rglob("*"):
    if p.suffix.lower() not in {".html", ".js", ".css"} or not p.is_file(): continue
    if p.name == "source-library-data.js" or any(part.startswith(".") for part in p.relative_to(root).parts): continue
    try: texts.append(p.read_text(encoding="utf-8"))
    except UnicodeDecodeError: pass
blob = "\n".join(texts)
keep, drop = [], []
for f in sorted(imgdir.iterdir()):
    if not f.is_file() or f.name.startswith("._") or f.stat().st_size <= limit: continue
    (keep if f.name in blob else drop).append(f.name)
lines = [f"+ /opalhaus-design/assets/images/{n}" for n in keep] + [f"- /opalhaus-design/assets/images/{n}" for n in drop]
out.write_text("\n".join(lines) + "\n")
print(f"  excluded {len(drop)} images ({sum((imgdir/n).stat().st_size for n in drop)/1e6:.0f} MB), kept {len(keep)} directly referenced")
PY

echo "[1/3] rsync → $DEST"
rsync -a --delete --delete-excluded --prune-empty-dirs \
  --filter="merge $OPAL_FILTER" \
  --filter="merge $SRC/All/deploy/rsync-excludes.txt" \
  --filter='P /.git' --filter='P /index.html' --filter='P /CNAME' --filter='P /.nojekyll' \
  --filter='P /README.md' --filter='P /.gitignore' \
  "$SRC/" "$DEST/"

echo "[2/3] Apple 절대 경로 재작성"
python3 - "$DEST/apple_design/app/dist/client" <<'PY'
import re, sys, pathlib
root = pathlib.Path(sys.argv[1]); prefix = "/apple_design/app/dist/client"
entries = sorted((p.name for p in root.iterdir()), key=len, reverse=True)
alts = "|".join(re.escape(e) for e in entries)
pat = re.compile(r'(["\'(=])/(' + alts + r')(?=[/"\'?)#\s]|$)')
srcset_pat = re.compile(r'(,\s*)/(' + alts + r')(?=[/"\'?)#\s]|$)')
n_files = n_hits = 0
for p in root.rglob("*"):
    if p.suffix.lower() not in {".html", ".js", ".mjs", ".css", ".json", ".txt", ".map"} or not p.is_file(): continue
    try: s = p.read_text(encoding="utf-8")
    except UnicodeDecodeError: continue
    if prefix in s and prefix + prefix not in s and not pat.search(s): continue
    new, k = pat.subn(lambda m: m.group(1) + prefix + "/" + m.group(2), s)
    # srcset="a.jpg 1x, /v/b.jpg 2x": 쉼표 뒤 후보 URL도 치환
    new, k2 = srcset_pat.subn(lambda m: m.group(1) + prefix + "/" + m.group(2), new)
    k += k2
    if k: p.write_text(new, encoding="utf-8"); n_files += 1; n_hits += k
print(f"  rewritten {n_hits} paths in {n_files} files")
# 검증: 재작성된 로컬 경로가 실제 파일을 가리키는지 (HTML/CSS만, 쿼리·해시 제거)
import urllib.parse
missing = set(); checked = 0
for p in list(root.rglob("*.html")) + list(root.rglob("*.css")):
    try: s = p.read_text(encoding="utf-8")
    except UnicodeDecodeError: continue
    for m in re.finditer(re.escape(prefix) + r'/([^"\'()\s,#?]+)', s):
        checked += 1
        rel = urllib.parse.unquote(m.group(1))
        if not (root / rel).exists(): missing.add(rel)
print(f"  checked {checked} local refs in html/css → missing {len(missing)}")
for r in sorted(missing)[:15]: print("   MISSING:", r)
PY

echo "[2b] 허브 레지스트리: 배포 사본에 없는 링크를 unavailable 로 표시"
python3 - "$DEST" <<'PY'
import re, sys, pathlib, urllib.parse
dest = pathlib.Path(sys.argv[1]); reg = dest / "All" / "systems.js"; s = reg.read_text(encoding="utf-8")
hub = dest / "All"; missing = []
def fix(m):
    href = m.group(2); path = href.split("#")[0].split("?")[0]
    if not path or path.startswith("http") or path.startswith("icons.html") or path.startswith("doc.html"): return m.group(0)
    target = (hub / urllib.parse.unquote(path)).resolve()
    if target.exists(): return m.group(0)
    missing.append(href); return m.group(0) + ", unavailable: true"
s2 = re.sub(r'(href:\s*")([^"]+)(")', lambda m: fix(m) if fix else m.group(0), s)
reg.write_text(s2, encoding="utf-8")
print(f"  unavailable 표시 {len(missing)}건"); [print("   -", h) for h in missing]
PY

echo "[2c] 배포 사본의 키 형태 문자열 마스킹 (stripe.com 공개 페이지에 표시된 예시 테스트 키 — GitHub 푸시 보호 회피·공개 노출 방지)"
python3 - "$DEST" <<'PY'
import re, sys, pathlib
dest = pathlib.Path(sys.argv[1]); pat = re.compile(r'\b([sr]k_(?:test|live)_)[0-9A-Za-z]{8,}')
n = 0
for p in list((dest / "stripe_design").rglob("*.json")) + list((dest / "stripe_design").rglob("*.js")) + list((dest / "stripe_design").rglob("*.html")):
    try: s = p.read_text(encoding="utf-8")
    except (UnicodeDecodeError, FileNotFoundError): continue
    new, k = pat.subn(lambda m: m.group(1) + "REDACTED", s)
    if k: p.write_text(new, encoding="utf-8"); n += k
print(f"  masked {n} key-like strings")
PY

echo "[2d] Opalhaus: 배포 사본에 없는 소스 이미지·영상 참조를 원본 CDN URL로 대체 (source-library.json 의 sourceUrl)"
python3 - "$DEST/opalhaus-design" <<'PY'
import sys, json, pathlib
root = pathlib.Path(sys.argv[1]); lib = root / "source-library.json"
if not lib.exists(): print("  (skip)"); sys.exit(0)
items = json.loads(lib.read_text(encoding="utf-8"))["items"]
repl = {}
for it in items:
    path, url = it.get("path") or "", it.get("sourceUrl") or ""
    if path.startswith("assets/") and url.startswith("http") and not (root / path).exists(): repl[path] = url
n_files = n_hits = 0
for p in root.rglob("*"):
    if p.suffix.lower() not in {".html", ".js", ".json", ".css", ".md"} or not p.is_file(): continue
    try: s = p.read_text(encoding="utf-8")
    except UnicodeDecodeError: continue
    new, k = s, 0
    for path, url in repl.items():
        if path in new: c = new.count(path); new = new.replace(path, url); k += c
    if k: p.write_text(new, encoding="utf-8"); n_files += 1; n_hits += k
print(f"  {len(repl)} missing assets → CDN URL, {n_hits} references in {n_files} files")
PY
rm -f "$OPAL_FILTER"

echo "[3/3] 루트 파일"
cat > "$DEST/index.html" <<HTML
<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Design Systems Hub</title>
<meta http-equiv="refresh" content="0; url=/All/"><link rel="canonical" href="https://$DOMAIN/All/">
<script>location.replace("/All/" + location.hash);</script></head>
<body><p>이동 중… <a href="/All/">Design Systems Hub</a></p></body></html>
HTML
printf '%s\n' "$DOMAIN" > "$DEST/CNAME"
: > "$DEST/.nojekyll"
printf '%s\n' ".DS_Store" "._*" "Thumbs.db" > "$DEST/.gitignore"
cat > "$DEST/README.md" <<'MD'
# design-system-kang88

세션마다 만든 디자인 시스템 뷰어를 한 곳에서 보는 **Design Systems Hub**의 배포 사본입니다.
사이트: https://design.system.kang88.io/ (→ `/All/`). 원본 작업 폴더는 로컬 `02_Source/` 이고, 이 저장소는 `All/deploy/build-site.sh` 가 만든 산출물입니다. 직접 편집하지 말고 원본을 고친 뒤 다시 빌드·푸시하세요.

## 구성
- `All/` — 허브(레지스트리 `systems.js`, 아이콘 브라우저, 문서 뷰어)와 뷰어 공통 셸 규격 `All/shell/`
- `apple_design/`, `google_design/`, `toss_design/`, `wanted_design/`, `family_design/`, `lusion_design/`, `adver_design/`, `reatic_design/`, `stripe_design/`, `opalhaus-design/`, `circles-design/`, `Ark-pdf/` — 각 디자인 시스템 뷰어. 모두 Apple 스튜디오 셸(Studio Shell) 뼈대를 공유합니다.
- `Icon_Stripe/`, `SVG/`, `PNG/` — 아이콘·브랜드 자산 세트

Apple 뷰어(Vite 빌드)의 루트 절대 경로는 배포 사본에서 `/apple_design/app/dist/client/` 접두어로 재작성돼 있습니다.

## 배포에서 제외된 것 (GitHub Pages 한도: 사이트 1GB, 파일 100MB)
원본 증거·대용량 아카이브는 로컬에만 있습니다. 해당 링크는 사이트에서 열리지 않습니다.
- Apple: `app/public/`(dist 중복), `research/runtime-motion/`, `research/inline/`, `research/pages/`, `research/runtime-sources/`, `research/runtime-dom/`, `research/motion-replay.json`
- 50MB 초과 아카이브: Apple `research-source-kit.tar.gz`, Toss `dist/toss-source-kit.zip`, Wanted `assets/montage/source/*.tar.gz`
- Toss: `dist/snippets/` · Wanted: `exports/montage-reference-assets.zip` · Family: `family-design-system.zip`, `references/v3-source/`
- Lusion: `downloads/lusion-source-system-v3/v4.zip`, `sources/readable/`, `sources/assets/` 중 lusion.co 폰트·이미지와 프로젝트 썸네일(`home.webp`)만 포함
- ARK: `downloads/ark-design-system.zip`, `downloads/ark-source-archive.zip`, `source/images/`
- Family·Adver가 화면에서 쓰는 `references/` 하위만 포함, 그 외 모든 `references/`, `evidence/`, `captures/`, `screenshots/`, `backups/`, `test-results/`, `*-private/`, `node_modules/`, `.git/`
- Reatic: `evidence/source/`, `app/public/source/fonts/`(유료 폰트 원본) · Stripe: `data/raw/`(원본 캡처, 문서 예시 키 포함) · `captures/` 중 effects·motion·illustrations·viewer 스크린샷 세트와 pages 전체 화면(접힌 화면 썸네일 `*-fold.png`만 포함)
- Opalhaus: 전체 보관본 `opalhaus-design-system.zip`(265MB), 스톡 영상 `assets/videos/`, 계측 JSON 덤프 `evidence/*.json`, 문서 전용 캡처 `evidence/text-services/`, 150KB 초과 소스 이미지(소스 브라우저 데이터에서만 참조되는 것). 제외된 이미지·영상은 사본에서 원본 CDN URL(framerusercontent.com, videos.pexels.com)로 대체돼 화면에는 그대로 보입니다.
- 허브 미등록 폴더 `logo/`, `design/`, 초안 `reatic-design/`, 루트 ZIP
MD
echo "done → $DEST"; du -sh "$DEST" --exclude=.git | cut -f1
