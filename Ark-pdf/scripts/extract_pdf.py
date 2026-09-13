#!/usr/bin/env python3
"""
Extract ARK proposal/design-system source data from a PDF.

Requirements:
  /tmp/catalog-premium-venv/bin/python with pymupdf and Pillow installed.

Default usage from the workspace root:
  /tmp/catalog-premium-venv/bin/python scripts/extract_pdf.py

Outputs:
  source/pages/*.svg
  source/text/*.json and source/full-text.md
  source/geometry/*.json
  source/images/native-* and source/images/preview-*.png
  source/fonts/*
  source/graphics/*.svg and source/graphics/*.png
  data/source-manifest.json
  data/source-data.js
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import pymupdf
from PIL import Image, ImageDraw, ImageFont


PAGE_META = {
    1: {"title": "COMPANY INTRODUCTION", "category": "cover"},
    2: {"title": "Company Facility Photo", "category": "photo"},
    3: {"title": "CONTENTS", "category": "contents"},
    4: {"title": "ABOUT ARK PREFAB", "category": "divider"},
    5: {"title": "Tech-Driven Modular Construction Company", "category": "brand"},
    6: {"title": "TIME LINE", "category": "brand"},
    7: {"title": "OUR MISSION, VISION AND CORE VALUE", "category": "brand"},
    8: {"title": "OUR TEAM", "category": "brand"},
    9: {"title": "Shanghai Headquarters And Core Departments", "category": "brand"},
    10: {"title": "INDUSTRY STATUS ANALYSIS", "category": "divider"},
    11: {"title": "Global Modular Building Market Size", "category": "data"},
    12: {"title": "History Of Modular Construction", "category": "data"},
    13: {"title": "Global Modular Construction Market Growth Rate", "category": "data"},
    14: {"title": "Usage Percentage Of Modular Construction", "category": "data"},
    15: {"title": "Advantages Of Modular Buildings", "category": "process"},
    16: {"title": "Certification, Qualification Certificates And Industry Recognition", "category": "data"},
    17: {"title": "CORE SERVICES AND SOLUTIONS", "category": "divider"},
    18: {"title": "FLATPACK", "category": "product"},
    19: {"title": "FLATPACK Technical Parameters", "category": "product"},
    20: {"title": "READY BOX", "category": "product"},
    21: {"title": "BATHROOM POD", "category": "product"},
    22: {"title": "BATHROOM POD Material Customization", "category": "product"},
    23: {"title": "STORAGE CABIN", "category": "product"},
    24: {"title": "STORAGE CABIN Technical Parameters", "category": "product"},
    25: {"title": "WORK FLOW", "category": "process"},
    26: {"title": "CUSTOMIZED SOLUTIONS FOR DIFFERENT MARKETS", "category": "product"},
    27: {"title": "MANUFACTURING AND PRODUCTION CAPABILITIES", "category": "divider"},
    28: {"title": "Manufacturing And Production Capability Photos", "category": "photo"},
    29: {"title": "QUALITY CONTROL AND SAFETY STANDARDS", "category": "process"},
    30: {"title": "PROJECT CASE STUDIES", "category": "divider"},
    31: {"title": "Technip Offices And Food Servicing Building", "category": "project"},
    32: {"title": "Technip Offices And Food Servicing Building Photos", "category": "project"},
    33: {"title": "CCC Camp Project", "category": "project"},
    34: {"title": "CCC Camp Project Photos", "category": "project"},
    35: {"title": "Technip Camp Project", "category": "project"},
    36: {"title": "Technip Camp Accommodations Buildings", "category": "project"},
    37: {"title": "Qatar Energy Long Site Offices And Food Service Building", "category": "project"},
    38: {"title": "Qatar Energy Project Photos", "category": "project"},
    39: {"title": "Technip Site Offices Project", "category": "project"},
    40: {"title": "Technip Site Offices Project Photos", "category": "project"},
    41: {"title": "NFE Pioneer Camp Project", "category": "project"},
    42: {"title": "NFE FOC Project", "category": "project"},
    43: {"title": "PNG KOMO Project", "category": "project"},
    44: {"title": "Lihir Gold Mine Camp 1 Project", "category": "project"},
    45: {"title": "AFTER-SALES SERVICES AND SUPPORT", "category": "divider"},
    46: {"title": "Commitment And Process Of After-Sales Maintenance Services", "category": "process"},
    47: {"title": "PARTNERS AND CLIENTS", "category": "divider"},
    48: {"title": "Partners And Clients Logo Wall", "category": "partners"},
    49: {"title": "CONTACT US", "category": "divider"},
    50: {"title": "GLOBAL ARK PREFAB", "category": "data"},
    51: {"title": "Social Channels", "category": "contact"},
    52: {"title": "THANKS FOR WATCHING", "category": "contact"},
}


GRAPHICS = [
    {"id": "p01-ark-logo", "name": "ARK Logo Lockup", "page": 1, "bbox": [1602, 72, 1848, 148], "category": "brand"},
    {"id": "p05-prefab-building", "name": "Wireframe Prefab Building", "page": 5, "bbox": [395, 285, 1920, 1080], "category": "brand"},
    {"id": "p09-character-sales", "name": "Sales Department Character", "page": 9, "bbox": [1145, 35, 1350, 260], "category": "brand"},
    {"id": "p09-character-technical", "name": "Technical Department Character", "page": 9, "bbox": [1135, 300, 1375, 510], "category": "brand"},
    {"id": "p09-character-quality", "name": "Quality Inspection Character", "page": 9, "bbox": [1135, 530, 1398, 765], "category": "brand"},
    {"id": "p09-character-affairs", "name": "General Affairs Character", "page": 9, "bbox": [1110, 820, 1400, 1012], "category": "brand"},
    {"id": "p15-icon-fast", "name": "Fast Icon", "page": 15, "bbox": [910, 110, 1080, 235], "category": "process"},
    {"id": "p15-icon-flexible", "name": "Flexible Icon", "page": 15, "bbox": [1415, 100, 1575, 235], "category": "process"},
    {"id": "p15-icon-economy", "name": "Economy Icon", "page": 15, "bbox": [955, 505, 1095, 655], "category": "process"},
    {"id": "p15-icon-safety", "name": "Safety Icon", "page": 15, "bbox": [1415, 510, 1550, 650], "category": "process"},
    {"id": "p26-icon-accommodations", "name": "Accommodations Icon", "page": 26, "bbox": [955, 35, 1058, 120], "category": "product"},
    {"id": "p26-icon-dining", "name": "Dining And Hygiene Icon", "page": 26, "bbox": [1415, 35, 1510, 120], "category": "product"},
    {"id": "p26-icon-workspaces", "name": "Workspaces Icon", "page": 26, "bbox": [955, 330, 1065, 425], "category": "product"},
    {"id": "p26-icon-medical", "name": "Medical And Health Icon", "page": 26, "bbox": [1415, 330, 1510, 430], "category": "product"},
    {"id": "p26-icon-recreation", "name": "Recreation And Leisure Icon", "page": 26, "bbox": [955, 620, 1065, 720], "category": "product"},
    {"id": "p26-icon-storage", "name": "Storage And Logistics Icon", "page": 26, "bbox": [1418, 620, 1530, 720], "category": "product"},
    {"id": "p29-icon-precision", "name": "Precision Icon", "page": 29, "bbox": [810, 330, 940, 455], "category": "process"},
    {"id": "p29-icon-compliance", "name": "Compliance Icon", "page": 29, "bbox": [810, 510, 950, 640], "category": "process"},
    {"id": "p29-icon-accountability", "name": "Accountability Icon", "page": 29, "bbox": [805, 690, 950, 815], "category": "process"},
    {"id": "p50-global-map", "name": "Dotted Global Map", "page": 50, "bbox": [1040, 70, 1885, 850], "category": "data", "limitation": "Right-side map crop avoids overlapping left text but excludes part of the Americas from the full page map."},
    {"id": "p06-timeline-diagram", "name": "Timeline Diagram", "page": 6, "bbox": [105, 275, 1820, 805], "category": "data", "type": "annotated-source-diagram"},
    {"id": "p13-market-growth-step-chart", "name": "Market Growth Step Chart", "page": 13, "bbox": [45, 295, 1870, 850], "category": "data", "type": "annotated-source-diagram"},
    {"id": "p14-modular-usage-volume-chart", "name": "Modular Usage Soft Volume Chart", "page": 14, "bbox": [555, 350, 1870, 1000], "category": "data", "type": "annotated-source-diagram"},
    {"id": "p25-overlapping-workflow-diagram", "name": "Overlapping Workflow Diagram", "page": 25, "bbox": [45, 300, 1870, 790], "category": "process", "type": "annotated-source-diagram"},
    {"id": "p46-arc-maintenance-process", "name": "Arc Maintenance Process Diagram", "page": 46, "bbox": [60, 560, 1850, 930], "category": "process", "type": "annotated-source-diagram"},
    {"id": "p51-social-facebook", "name": "Facebook Symbol", "page": 51, "bbox": [48, 825, 195, 980], "category": "contact", "type": "social-symbol"},
    {"id": "p51-social-linkedin", "name": "LinkedIn Symbol", "page": 51, "bbox": [270, 825, 420, 980], "category": "contact", "type": "social-symbol"},
    {"id": "p51-social-youtube", "name": "YouTube Symbol", "page": 51, "bbox": [475, 825, 645, 980], "category": "contact", "type": "social-symbol"},
    {"id": "p51-social-mail", "name": "Mail Symbol", "page": 51, "bbox": [705, 825, 870, 980], "category": "contact", "type": "social-symbol"},
]

ISOLATED_ICON_IDS = {
    "p15-icon-fast",
    "p15-icon-flexible",
    "p15-icon-economy",
    "p15-icon-safety",
    "p26-icon-accommodations",
    "p26-icon-dining",
    "p26-icon-workspaces",
    "p26-icon-medical",
    "p26-icon-recreation",
    "p26-icon-storage",
    "p29-icon-precision",
    "p29-icon-compliance",
    "p29-icon-accountability",
}


def clean_name(value: str) -> str:
    value = value.replace("+", "-")
    value = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-")
    return value or "unnamed"


def rel(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def color_to_hex(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, int):
        return f"#{value & 0xFFFFFF:06X}"
    if isinstance(value, (list, tuple)) and len(value) >= 3:
        comps = []
        for channel in value[:3]:
            comps.append(max(0, min(255, round(float(channel) * 255))))
        return "#" + "".join(f"{c:02X}" for c in comps)
    return None


def round_obj(value: Any) -> Any:
    if isinstance(value, float):
        return round(value, 3)
    if isinstance(value, (pymupdf.Rect, pymupdf.IRect, pymupdf.Point, pymupdf.Quad, pymupdf.Matrix)):
        return [round_obj(v) for v in value]
    if isinstance(value, (list, tuple)):
        return [round_obj(v) for v in value]
    if isinstance(value, dict):
        return {str(k): round_obj(v) for k, v in value.items() if serializable(v)}
    return value


def serializable(value: Any) -> bool:
    return value is None or isinstance(value, (str, int, float, bool, list, tuple, dict))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def title_from_spans(spans: list[dict[str, Any]], page_no: int) -> str:
    candidates = [
        s for s in spans
        if s["text"].strip()
        and s["bbox"][1] < 950
        and not re.match(r"^(VISION|MARCH|www\\.)", s["text"], re.I)
    ]
    if not candidates:
        return f"Page {page_no:02d}"
    candidates.sort(key=lambda s: (-float(s.get("size", 0)), s["bbox"][1], s["bbox"][0]))
    top_size = candidates[0]["size"]
    same_line = [
        s for s in candidates
        if abs(s["bbox"][1] - candidates[0]["bbox"][1]) < max(8, top_size * 0.45)
        and abs(s["size"] - top_size) < 2
    ]
    same_line.sort(key=lambda s: s["bbox"][0])
    title = " ".join(s["text"].strip() for s in same_line).strip()
    return title[:120] or f"Page {page_no:02d}"


def extract_spans(page: pymupdf.Page) -> tuple[list[dict[str, Any]], str]:
    raw = page.get_text("dict")
    spans: list[dict[str, Any]] = []
    text_lines: list[str] = []
    for block in raw.get("blocks", []):
        block_lines = []
        for line in block.get("lines", []):
            line_text = ""
            for span in line.get("spans", []):
                text = span.get("text", "")
                if not text:
                    continue
                bbox = [round(float(v), 3) for v in span.get("bbox", [])]
                spans.append({
                    "text": text,
                    "bbox": bbox,
                    "font": span.get("font"),
                    "size": round(float(span.get("size", 0)), 3),
                    "color": color_to_hex(span.get("color")),
                    "flags": span.get("flags", 0),
                    "ascender": round_obj(span.get("ascender")),
                    "descender": round_obj(span.get("descender")),
                    "origin": round_obj(span.get("origin")),
                })
                line_text += text
            if line_text.strip():
                block_lines.append(line_text.strip())
        if block_lines:
            text_lines.extend(block_lines)
            text_lines.append("")
    return spans, "\n".join(text_lines).strip()


def normalize_drawings(page: pymupdf.Page) -> list[dict[str, Any]]:
    drawings = []
    for item in page.get_drawings():
        drawings.append({
            "type": item.get("type"),
            "bbox": round_obj(list(item.get("rect", [])) if item.get("rect") else None),
            "fill": color_to_hex(item.get("fill")),
            "stroke": color_to_hex(item.get("color")),
            "fillOpacity": round_obj(item.get("fill_opacity")),
            "strokeOpacity": round_obj(item.get("stroke_opacity")),
            "width": round_obj(item.get("width")),
            "lineCap": round_obj(item.get("lineCap")),
            "lineJoin": round_obj(item.get("lineJoin")),
            "dashes": item.get("dashes"),
            "items": round_obj(item.get("items", [])),
        })
    return drawings


def save_svg_page(page: pymupdf.Page, path: Path) -> None:
    path.write_text(page.get_svg_image(text_as_path=1), encoding="utf-8")


def hex_from_rgb(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def image_pixels(image: Image.Image):
    if hasattr(image, "get_flattened_data"):
        return image.get_flattened_data()
    return image.getdata()


def graphic_palette(image: Image.Image, max_colors: int = 8) -> list[dict[str, Any]]:
    rgba = image.convert("RGBA")
    pixels = []
    for r, g, b, a in image_pixels(rgba):
        if a < 32:
            continue
        if r > 232 and g > 232 and b > 232:
            continue
        pixels.append((r, g, b))
    if not pixels:
        return []
    sample = Image.new("RGB", (len(pixels), 1))
    sample.putdata(pixels)
    quantized = sample.quantize(colors=max_colors, method=Image.Quantize.MEDIANCUT).convert("RGB")
    counts = Counter(image_pixels(quantized))
    return [{"hex": hex_from_rgb(rgb), "count": count} for rgb, count in counts.most_common(max_colors)]


def save_isolated_preview(src: Path, target: Path) -> str:
    rgba = Image.open(src).convert("RGBA")
    output = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = rgba.getpixel((x, y))
            is_light_background = r > 224 and g > 224 and b > 224 and max(r, g, b) - min(r, g, b) < 22
            if a >= 16 and not is_light_background:
                output.putpixel((x, y), (r, g, b, a))
    output.save(target)
    return "background-light-pixel-alpha-mask"


def save_image_thumbnail(preview_path: Path, thumb_path: Path, has_mask: bool, max_size: int = 640) -> dict[str, Any]:
    image = Image.open(preview_path)
    if has_mask:
        thumb = image.convert("RGBA")
        fmt = "png"
    else:
        thumb = image.convert("RGB")
        fmt = "jpg"
    thumb.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    if fmt == "png":
        thumb.save(thumb_path, optimize=True)
    else:
        thumb.save(thumb_path, quality=82, optimize=True, progressive=True)
    return {"width": thumb.width, "height": thumb.height, "format": fmt}


def save_graphic(doc: pymupdf.Document, spec: dict[str, Any], out_dir: Path, root: Path) -> dict[str, Any]:
    bbox = pymupdf.Rect(*spec["bbox"])
    page = doc[spec["page"] - 1]
    crop_doc = pymupdf.open()
    crop_page = crop_doc.new_page(width=bbox.width, height=bbox.height)
    crop_page.show_pdf_page(crop_page.rect, doc, spec["page"] - 1, clip=bbox)
    svg_path = out_dir / f"{spec['id']}.svg"
    png_path = out_dir / f"{spec['id']}.png"
    svg_path.write_text(crop_page.get_svg_image(text_as_path=1), encoding="utf-8")
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=bbox, alpha=True, annots=False)
    pix.save(png_path)
    crop_doc.close()
    preview_image = Image.open(png_path).convert("RGBA")
    result = {
        "id": spec["id"],
        "name": spec["name"],
        "page": spec["page"],
        "bbox": spec["bbox"],
        "path": rel(svg_path, root),
        "preview": rel(png_path, root),
        "category": spec["category"],
        "type": spec.get("type", "source-graphic"),
        "extraction": "source-crop",
        "palette": graphic_palette(preview_image),
    }
    if spec.get("limitation"):
        result["limitation"] = spec["limitation"]
    if spec["id"] in ISOLATED_ICON_IDS:
        isolated_path = out_dir / f"{spec['id']}-isolated.png"
        result["isolatedPreview"] = rel(isolated_path, root)
        result["isolatedExtraction"] = save_isolated_preview(png_path, isolated_path)
        result["isolatedLimitation"] = "PNG-only background knockout for browser/icon preview; original SVG crop remains the source-preserving vector asset."
    return result


def extract_images(
    doc: pymupdf.Document,
    image_dir: Path,
    root: Path,
) -> list[dict[str, Any]]:
    by_xref: dict[int, dict[str, Any]] = {}
    pages_by_xref: dict[int, set[int]] = defaultdict(set)
    smasks: dict[int, int] = {}
    for page_no in range(doc.page_count):
        for img in doc[page_no].get_images(full=True):
            xref = int(img[0])
            smask = int(img[1])
            pages_by_xref[xref].add(page_no + 1)
            if smask:
                smasks[xref] = smask

    for xref, pages in sorted(pages_by_xref.items()):
        info = doc.extract_image(xref)
        ext = info.get("ext", "bin")
        native_path = image_dir / f"native-xref-{xref}.{ext}"
        native_path.write_bytes(info.get("image", b""))
        preview_path = image_dir / f"preview-xref-{xref}.png"
        try:
            pix = pymupdf.Pixmap(doc, xref)
            has_mask = bool(smasks.get(xref))
            if has_mask:
                mask = pymupdf.Pixmap(doc, smasks[xref])
                pix = pymupdf.Pixmap(pix, mask)
            if pix.n > 4:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            pix.save(preview_path)
            width, height = pix.width, pix.height
        except Exception:
            preview_path = native_path
            width, height = info.get("width"), info.get("height")
            has_mask = bool(smasks.get(xref))
        thumb_ext = "png" if has_mask else "jpg"
        thumbnail_path = image_dir / f"thumb-xref-{xref}.{thumb_ext}"
        thumbnail_info = save_image_thumbnail(preview_path, thumbnail_path, has_mask)
        by_xref[xref] = {
            "id": f"img-xref-{xref}",
            "path": rel(native_path, root),
            "preview": rel(preview_path, root),
            "thumbnail": rel(thumbnail_path, root),
            "thumbnailWidth": thumbnail_info["width"],
            "thumbnailHeight": thumbnail_info["height"],
            "thumbnailFormat": thumbnail_info["format"],
            "width": width,
            "height": height,
            "pages": sorted(pages),
            "hasMask": has_mask,
        }
    return list(by_xref.values())


def extract_fonts(doc: pymupdf.Document, font_dir: Path, root: Path) -> list[dict[str, Any]]:
    font_pages: dict[int, set[int]] = defaultdict(set)
    font_names: dict[int, str] = {}
    for page_no in range(doc.page_count):
        for font in doc[page_no].get_fonts(full=True):
            xref = int(font[0])
            if xref <= 0:
                continue
            font_pages[xref].add(page_no + 1)
            font_names[xref] = str(font[3])

    fonts = []
    for xref, pages in sorted(font_pages.items()):
        try:
            name, ext, ftype, content = doc.extract_font(xref)
        except Exception:
            continue
        if not content:
            continue
        safe = clean_name(name or font_names.get(xref, f"font-{xref}"))
        extension = ext or "bin"
        path = font_dir / f"xref-{xref}-{safe}.{extension}"
        path.write_bytes(content)
        fonts.append({
            "name": re.sub(r"^[A-Z]{6}\\+", "", name or font_names.get(xref, f"font-{xref}")),
            "path": rel(path, root),
            "extension": extension,
            "pages": sorted(pages),
            "subset": True,
        })
    return fonts


def save_graphics_contact_sheet(graphics: list[dict[str, Any]], root: Path, source_dir: Path) -> str:
    thumbs = []
    for graphic in graphics:
        path = root / graphic["preview"]
        image = Image.open(path).convert("RGBA")
        image.thumbnail((220, 150), Image.Resampling.LANCZOS)
        thumbs.append((graphic, image.copy()))
    cols = 4
    cell_w, cell_h = 280, 210
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 14)
        small = ImageFont.truetype("DejaVuSans.ttf", 11)
    except Exception:
        font = ImageFont.load_default()
        small = ImageFont.load_default()
    for idx, (graphic, image) in enumerate(thumbs):
        col = idx % cols
        row = idx // cols
        x = col * cell_w
        y = row * cell_h
        draw.rectangle([x, y, x + cell_w - 1, y + cell_h - 1], outline="#E2E6EF")
        px = x + (cell_w - image.width) // 2
        py = y + 14
        sheet.paste(image, (px, py), image if image.mode == "RGBA" else None)
        draw.text((x + 14, y + 165), graphic["id"], fill="#061A58", font=font)
        draw.text((x + 14, y + 184), f"p{graphic['page']} {graphic['category']}", fill="#516086", font=small)
    path = source_dir / "graphics-contact-sheet.png"
    sheet.save(path)
    return rel(path, root)


def save_graphics_palette_report(graphics: list[dict[str, Any]], root: Path, source_dir: Path) -> str:
    report = {
        "summary": "Palette extracted from curated graphic PNG previews after excluding transparent and near-white source-background pixels. Counts are sampled/quantized for inspection, not a replacement for original vector gradients.",
        "gradientObservation": "Line icons and quality/process glyphs use a violet-blue to deep navy range rather than one flat color; observed families include #5B5DD5 / #4E56D0 highlights and #061A58 / #132887 navy endpoints.",
        "graphics": [
            {
                "id": graphic["id"],
                "name": graphic["name"],
                "page": graphic["page"],
                "palette": graphic.get("palette", []),
            }
            for graphic in graphics
        ],
    }
    path = source_dir / "graphics-palette.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return rel(path, root)


def collect_colors(spans: list[dict[str, Any]], drawings: list[dict[str, Any]], page_no: int, counter: Counter, pages: dict) -> None:
    for span in spans:
        hx = span.get("color")
        if hx:
            key = (hx, "text")
            counter[key] += max(1, len(span.get("text", "")))
            pages[key].add(page_no)
    for drawing in drawings:
        for kind_key, kind in [("fill", "fill"), ("stroke", "stroke")]:
            hx = drawing.get(kind_key)
            if hx:
                key = (hx, kind)
                counter[key] += 1
                pages[key].add(page_no)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract source assets and source-manifest data from the ARK PDF.")
    parser.add_argument("--source", default="ARK_Company Introduction .pdf", help="PDF source path, relative to cwd by default.")
    parser.add_argument("--output", default=".", help="Workspace/output root.")
    args = parser.parse_args()

    root = Path(args.output).resolve()
    pdf_path = (root / args.source).resolve() if not Path(args.source).is_absolute() else Path(args.source).resolve()
    source_dir = root / "source"
    page_dir = source_dir / "pages"
    text_dir = source_dir / "text"
    geometry_dir = source_dir / "geometry"
    image_dir = source_dir / "images"
    font_dir = source_dir / "fonts"
    graphic_dir = source_dir / "graphics"
    data_dir = root / "data"
    for directory in [page_dir, text_dir, geometry_dir, image_dir, font_dir, graphic_dir, data_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(pdf_path)
    pages = []
    full_text_parts = []
    color_counter: Counter = Counter()
    color_pages: dict[tuple[str, str], set[int]] = defaultdict(set)
    total_drawings = 0
    page_image_ids: dict[int, list[str]] = defaultdict(list)

    images = extract_images(doc, image_dir, root)
    for image in images:
        for page_no in image["pages"]:
            page_image_ids[page_no].append(image["id"])

    fonts = extract_fonts(doc, font_dir, root)
    font_names_by_page: dict[int, set[str]] = defaultdict(set)
    for font in fonts:
        for page_no in font["pages"]:
            font_names_by_page[page_no].add(font["name"])

    for index in range(doc.page_count):
        page_no = index + 1
        page = doc[index]
        svg_path = page_dir / f"page-{page_no:03d}.svg"
        text_path = text_dir / f"page-{page_no:03d}.json"
        geometry_path = geometry_dir / f"page-{page_no:03d}.json"
        save_svg_page(page, svg_path)
        spans, plain_text = extract_spans(page)
        drawings = normalize_drawings(page)
        total_drawings += len(drawings)
        collect_colors(spans, drawings, page_no, color_counter, color_pages)
        text_doc = {
            "page": page_no,
            "width": round(float(page.rect.width), 3),
            "height": round(float(page.rect.height), 3),
            "plainText": plain_text,
            "spans": spans,
        }
        geometry_doc = {
            "page": page_no,
            "width": round(float(page.rect.width), 3),
            "height": round(float(page.rect.height), 3),
            "drawings": drawings,
        }
        text_path.write_text(json.dumps(text_doc, ensure_ascii=False, indent=2), encoding="utf-8")
        geometry_path.write_text(json.dumps(geometry_doc, ensure_ascii=False, indent=2), encoding="utf-8")
        full_text_parts.append(f"## Page {page_no:02d}\n\n{plain_text}\n")
        meta = PAGE_META.get(page_no, {"title": title_from_spans(spans, page_no), "category": "project"})
        pages.append({
            "number": page_no,
            "title": meta["title"],
            "category": meta["category"],
            "preview": f"source/previews/page-{page_no:03d}.jpg",
            "svg": rel(svg_path, root),
            "text": rel(text_path, root),
            "geometry": rel(geometry_path, root),
            "searchText": plain_text,
            "width": round(float(page.rect.width), 3),
            "height": round(float(page.rect.height), 3),
            "imageIds": sorted(page_image_ids.get(page_no, [])),
            "fontNames": sorted(font_names_by_page.get(page_no, [])),
        })

    graphics = [save_graphic(doc, spec, graphic_dir, root) for spec in GRAPHICS]
    graphics_contact_sheet = save_graphics_contact_sheet(graphics, root, source_dir)
    graphics_palette_report = save_graphics_palette_report(graphics, root, source_dir)
    colors = [
        {"hex": hx, "count": count, "pages": sorted(color_pages[(hx, kind)]), "kind": kind}
        for (hx, kind), count in color_counter.most_common()
    ]

    (source_dir / "full-text.md").write_text("\n".join(full_text_parts).strip() + "\n", encoding="utf-8")
    manifest = {
        "document": {
            "filename": pdf_path.name,
            "pageCount": doc.page_count,
            "width": round(float(doc[0].rect.width), 3),
            "height": round(float(doc[0].rect.height), 3),
            "sha256": sha256(pdf_path),
            "metadata": {k: v for k, v in doc.metadata.items() if v},
        },
        "stats": {
            "pages": len(pages),
            "images": len(images),
            "fonts": len(fonts),
            "drawings": total_drawings,
            "graphics": len(graphics),
        },
        "pages": pages,
        "images": images,
        "fonts": fonts,
        "colors": colors,
        "graphics": graphics,
        "graphicsContactSheet": graphics_contact_sheet,
        "graphicsPaletteReport": graphics_palette_report,
        "limitations": [
            "Extracted font files are PDF-embedded subset fonts, not licensed production fonts or full character sets.",
            "Cropped graphics are source page clips intended to preserve visible geometry and glyph icons; transparent PNG previews may include source background fills when the PDF draws them inside the clip.",
            "Isolated icon previews are PNG-only light-background knockouts for browser usage; source SVG crops remain the canonical vector extraction.",
            "Curated graphic crop coordinates were manually selected from rendered page previews and are stored in PDF coordinate units.",
        ],
    }
    manifest_path = data_dir / "source-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    source_data_path = data_dir / "source-data.js"
    source_data_path.write_text(
        "window.ARK_SOURCE = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "document": manifest["document"],
        "stats": manifest["stats"],
        "manifest": rel(manifest_path, root),
        "sourceData": rel(source_data_path, root),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
