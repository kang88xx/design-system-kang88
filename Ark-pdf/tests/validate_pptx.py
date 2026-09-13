#!/usr/bin/env python3
"""Schema-oriented validation for the generated ARK PPTX package."""

from __future__ import annotations

import posixpath
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/package/2006/relationships}"
OD_R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def fail(message: str) -> None:
    raise AssertionError(message)


def read_xml(package: zipfile.ZipFile, name: str) -> ET.Element:
    try:
        return ET.fromstring(package.read(name))
    except KeyError as exc:
        fail(f"missing package part: {name}")
        raise exc


def relationship_base(rels_name: str) -> str:
    if rels_name == "_rels/.rels":
        return ""
    folder, filename = posixpath.split(rels_name)
    if not folder.endswith("/_rels"):
        fail(f"unexpected relationships location: {rels_name}")
    owner_folder = folder[: -len("/_rels")]
    owner = filename[:-5]
    return posixpath.normpath(posixpath.join(owner_folder, owner))


def relationship_target(owner_part: str, target: str) -> str:
    if target.startswith("/"):
        return target.lstrip("/")
    base_dir = posixpath.dirname(owner_part)
    return posixpath.normpath(posixpath.join(base_dir, target))


def validate_relationship_targets(package: zipfile.ZipFile) -> None:
    names = set(package.namelist())
    for rels_name in sorted(n for n in names if n.endswith(".rels")):
        owner = relationship_base(rels_name)
        rels = read_xml(package, rels_name)
        ids: set[str] = set()
        for rel in rels.findall(f"{R}Relationship"):
            rel_id = rel.attrib.get("Id")
            if not rel_id:
                fail(f"{rels_name}: relationship without Id")
            if rel_id in ids:
                fail(f"{rels_name}: duplicate relationship Id {rel_id}")
            ids.add(rel_id)
            mode = rel.attrib.get("TargetMode")
            if mode == "External":
                continue
            target = rel.attrib.get("Target")
            if not target:
                fail(f"{rels_name}: relationship {rel_id} missing Target")
            resolved = relationship_target(owner, target)
            if resolved not in names:
                fail(f"{rels_name}: relationship {rel_id} target missing: {resolved}")


def validate_presentation(package: zipfile.ZipFile) -> list[str]:
    presentation = read_xml(package, "ppt/presentation.xml")
    size = presentation.find(f"{P}sldSz")
    if size is None:
        fail("presentation missing p:sldSz")
    if size.attrib.get("type") not in {"screen16x9", "custom"}:
        fail(f"invalid p:sldSz type: {size.attrib.get('type')}")
    slides = sorted(n for n in package.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n))
    if len(slides) != 10:
        fail(f"expected 10 slides, found {len(slides)}")
    return slides


def validate_slide_master(package: zipfile.ZipFile) -> None:
    master = read_xml(package, "ppt/slideMasters/slideMaster1.xml")
    clr = master.find(f"{P}clrMap")
    if clr is None:
        fail("slide master missing p:clrMap")
    expected = {
        "bg1": "lt1",
        "tx1": "dk1",
        "bg2": "lt2",
        "tx2": "dk2",
        "accent1": "accent1",
        "accent2": "accent2",
        "accent3": "accent3",
        "accent4": "accent4",
        "accent5": "accent5",
        "accent6": "accent6",
        "hlink": "hlink",
        "folHlink": "folHlink",
    }
    for key, value in expected.items():
        if clr.attrib.get(key) != value:
            fail(f"slide master p:clrMap {key}={clr.attrib.get(key)!r}, expected {value!r}")
    rels = read_xml(package, "ppt/slideMasters/_rels/slideMaster1.xml.rels")
    rel_types = {rel.attrib.get("Type"): rel.attrib.get("Target") for rel in rels.findall(f"{R}Relationship")}
    if "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" not in rel_types:
        fail("slide master missing theme relationship")
    if "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" not in rel_types:
        fail("slide master missing slideLayout relationship")


def validate_theme(package: zipfile.ZipFile) -> None:
    theme = read_xml(package, "ppt/theme/theme1.xml")
    font_scheme = theme.find(f".//{A}fontScheme")
    if font_scheme is None:
        fail("theme missing a:fontScheme")
    for tag in ("majorFont", "minorFont"):
        node = font_scheme.find(f"{A}{tag}")
        if node is None:
            fail(f"theme missing a:{tag}")
        for child in ("latin", "ea", "cs"):
            if node.find(f"{A}{child}") is None:
                fail(f"theme a:{tag} missing a:{child}")
    fmt = theme.find(f".//{A}fmtScheme")
    if fmt is None:
        fail("theme missing a:fmtScheme")
    required_lists = {
        "fillStyleLst": 3,
        "lnStyleLst": 3,
        "effectStyleLst": 3,
        "bgFillStyleLst": 3,
    }
    for tag, min_count in required_lists.items():
        node = fmt.find(f"{A}{tag}")
        if node is None:
            fail(f"theme missing a:{tag}")
        if len(list(node)) < min_count:
            fail(f"theme a:{tag} has {len(list(node))} children, expected at least {min_count}")


def validate_slides(package: zipfile.ZipFile, slides: list[str]) -> None:
    for slide_name in slides:
        slide = read_xml(package, slide_name)
        ids: set[str] = set()
        for c_nv_pr in slide.findall(f".//{P}cNvPr"):
            shape_id = c_nv_pr.attrib.get("id")
            if not shape_id:
                fail(f"{slide_name}: p:cNvPr without id")
            if shape_id in ids:
                fail(f"{slide_name}: duplicate p:cNvPr id {shape_id}")
            ids.add(shape_id)
        for ext in slide.findall(f".//{A}ext"):
            for attr in ("cx", "cy"):
                value = int(ext.attrib.get(attr, "0"))
                if value < 0:
                    fail(f"{slide_name}: negative a:ext {attr}={value}")
        for r_pr in slide.findall(f".//{A}rPr"):
            if r_pr.find(f"{A}b") is not None:
                fail(f"{slide_name}: invalid child a:b under a:rPr")
            bold_attr = r_pr.attrib.get("b")
            if bold_attr is not None and bold_attr not in {"0", "1", "false", "true"}:
                fail(f"{slide_name}: invalid a:rPr bold attribute {bold_attr}")
            if r_pr.find(f"{A}cs") is None:
                fail(f"{slide_name}: a:rPr missing a:cs font")


def validate(path: Path) -> None:
    if not path.exists():
        fail(f"PPTX does not exist: {path}")
    with zipfile.ZipFile(path) as package:
        validate_relationship_targets(package)
        slides = validate_presentation(package)
        validate_slide_master(package)
        validate_theme(package)
        validate_slides(package, slides)
    print(f"ok {path} slides={len(slides)}")


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "templates/ark-proposal.pptx")
    validate(path)


if __name__ == "__main__":
    main()
