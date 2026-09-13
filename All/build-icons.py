#!/usr/bin/env python3
"""아이콘·일러스트 소스 매니페스트(icons.js) 생성. 표준 라이브러리만 사용.

각 세트는 02_Source 아래 폴더를 스캔해 SVG/PNG 파일 목록을 기록합니다.
새 폴더를 추가하려면 SETS에 항목을 하나 더 넣고 다시 실행합니다.
"""
import json, re
from pathlib import Path

HUB = Path(__file__).resolve().parent
ROOT = HUB.parent

SETS = [
    {"id": "stripe", "name": "Stripe 제품 아이콘", "brand": "Stripe", "accent": "#635bff",
     "desc": "stripe.com 공개 페이지에서 수집한 제품·기능 아이콘 SVG.", "dirs": ["Icon_Stripe/stripe-icons-svg"], "viewer": "../Icon_Stripe/stripe-icons.html"},
    {"id": "material", "name": "Material Symbols Rounded", "brand": "Google", "accent": "#0b57d0",
     "desc": "공식 upstream에서 가져온 Material Symbols Rounded SVG. Apache-2.0.", "dirs": ["google_design/assets/material-symbols/rounded"]},
    {"id": "montage", "name": "Wanted Montage 아이콘", "brand": "Wanted", "accent": "#0066ff",
     "desc": "Montage 공개 문서 SVG와 고정 버전 공개 패키지 SVG. MIT.", "dirs": ["wanted_design/assets/montage/icons", "wanted_design/assets/montage/icons-upstream"]},
    {"id": "ark-icons", "name": "ARK 라인 아이콘", "brand": "ARK", "accent": "#011187",
     "desc": "ARK 회사소개서의 선형 규칙으로 새로 만든 주제별 아이콘.", "dirs": ["Ark-pdf/assets/icons"]},
    {"id": "ark-graphics", "name": "ARK 원본 그래픽·일러스트", "brand": "ARK", "accent": "#1a2646",
     "desc": "회사소개서 52쪽에서 선별한 로고·아이콘·캐릭터·와이어프레임 영역.", "dirs": ["Ark-pdf/source/graphics"]},
    {"id": "brand", "name": "로고·브랜드 자산", "brand": "Kang", "accent": "#e4002b",
     "desc": "개인 로고와 브랜드 SVG/PNG 원본.", "dirs": ["SVG", "PNG"]},
]
EXT = {".svg", ".png"}

def scan(rel):
    base = ROOT / rel
    out = []
    if not base.exists():
        return out
    for p in sorted(base.rglob("*")):
        if not p.is_file() or p.name.startswith("._") or p.suffix.lower() not in EXT:
            continue
        r = p.relative_to(ROOT).as_posix()
        out.append({"name": p.stem, "ext": p.suffix[1:].lower(), "size": p.stat().st_size,
                    "path": "../" + "/".join(re.sub(r"[^\w.\-~]", lambda m: "%%%02X" % ord(m.group()), s) for s in r.split("/"))})
    return out

sets = []
for s in SETS:
    files = []
    for d in s["dirs"]:
        files += scan(d)
    # 같은 이름의 svg/png가 있으면 svg만 남긴다 (ARK graphics)
    seen = {}
    for f in files:
        k = f["name"]
        if k not in seen or (f["ext"] == "svg" and seen[k]["ext"] == "png"):
            seen[k] = f
    files = list(seen.values())
    sets.append({**{k: v for k, v in s.items() if k != "dirs"}, "folders": s["dirs"], "count": len(files), "files": files})
    print(f'{s["id"]:14s} {len(files):4d} files  <- {", ".join(s["dirs"])}')

(HUB / "icons.js").write_text("// build-icons.py가 생성한 파일. 직접 수정하지 말고 스크립트를 다시 실행하세요.\nwindow.ICON_SETS = " + json.dumps(sets, ensure_ascii=False) + ";\n", encoding="utf-8")
print("icons.js written:", sum(s["count"] for s in sets), "files")
