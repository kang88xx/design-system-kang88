#!/usr/bin/env python3
"""뷰어 콘텐츠 인벤토리 추출·비교 도구 (셸 변환 전후에 내용 누락·변형이 없는지 검사).

사용:
  python3 inventory.py dump  <URL 또는 파일경로> <out.json>     # headless chrome DOM 덤프 → 인벤토리 저장
  python3 inventory.py diff  <before.json> <after.json>          # 누락 항목 보고 (누락 0이면 exit 0)

인벤토리 항목: href/src 집합, id 집합, data-* 속성(이름=값) 집합, 보이는 텍스트 토큰(공백 정규화, 12자 이상 문장) 집합, img alt 집합
셸 자체가 추가하는 텍스트("WORKSPACE", "Design system", "Export tokens", "Skip to content")는 무시한다.
"""
import sys, json, re, subprocess, os, html
from html.parser import HTMLParser
from pathlib import Path

CHROME = os.environ.get("CHROME") or str(Path.home() / ".cache/ms-playwright/chromium-1234/chrome-linux64/chrome")
SHELL_TEXT = {"workspace", "design system", "export tokens", "skip to content", "open navigation", "close navigation", "↗", "↧", "☰", "/"}

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.hrefs=set(); self.ids=set(); self.data=set(); self.alts=set(); self.text=[]; self.skip=0; self.cur=[]
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script","style","template","noscript"): self.skip += 1
        for k in ("href","src","srcset","poster","data-src"):
            if a.get(k): self.hrefs.add(a[k].strip())
        if a.get("id"): self.ids.add(a["id"])
        if tag == "img" and a.get("alt"): self.alts.add(a["alt"].strip())
        for k,v in a.items():
            if k.startswith("data-") and v is not None: self.data.add(f"{k}={v}")
    def handle_endtag(self, tag):
        if tag in ("script","style","template","noscript"): self.skip = max(0, self.skip-1)
    def handle_data(self, d):
        if self.skip: return
        t = re.sub(r"\s+", " ", html.unescape(d)).strip()
        if t: self.text.append(t)

def dump(target, out):
    if re.match(r"^https?://", target):
        dom = subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=8000", "--dump-dom", target],
                             capture_output=True, text=True, timeout=120).stdout
    else:
        dom = Path(target).read_text(encoding="utf-8", errors="replace")
    p = P(); p.feed(dom)
    texts = set(t.lower() for t in p.text if len(t) >= 12 and t.lower() not in SHELL_TEXT)
    inv = {"target": target, "hrefs": sorted(p.hrefs), "ids": sorted(p.ids), "data": sorted(p.data), "alts": sorted(p.alts),
           "texts": sorted(texts), "text_count": len(p.text), "dom_bytes": len(dom)}
    Path(out).write_text(json.dumps(inv, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{target}\n  hrefs {len(inv['hrefs'])}  ids {len(inv['ids'])}  data {len(inv['data'])}  texts {len(inv['texts'])}  dom {inv['dom_bytes']}B")

def diff(a, b):
    A = json.loads(Path(a).read_text(encoding="utf-8")); B = json.loads(Path(b).read_text(encoding="utf-8"))
    bad = 0
    for k in ("hrefs","ids","data","alts","texts"):
        lost = sorted(set(A[k]) - set(B[k])); added = len(set(B[k]) - set(A[k]))
        print(f"{k:6s} before {len(A[k]):5d}  after {len(B[k]):5d}  lost {len(lost):4d}  added {added:4d}")
        for x in lost[:60]: print("    LOST:", x[:160])
        bad += len(lost)
    print("RESULT:", "OK — 누락 없음" if bad == 0 else f"FAIL — {bad}개 누락")
    sys.exit(0 if bad == 0 else 1)

if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "dump": dump(sys.argv[2], sys.argv[3])
    elif len(sys.argv) >= 4 and sys.argv[1] == "diff": diff(sys.argv[2], sys.argv[3])
    else: print(__doc__)
