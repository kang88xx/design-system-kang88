"""Build a UI-ready source index and reproducible coverage audit."""
from __future__ import annotations

import collections
import argparse
import hashlib
import html
import json
import mimetypes
import pathlib
import re
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_DOMAINS = {"lusion.co", "lusion.dev"}
TEXT_EXTENSIONS = {".html", ".css", ".js", ".mjs", ".json", ".xml", ".svg", ".webmanifest", ".map", ".md"}
SOURCE_EXTENSIONS = {".html", ".css", ".js", ".mjs", ".json", ".xml", ".svg", ".webmanifest", ".map"}
INDEX_EXCLUDES = {
    "source-index.js",
    "research/source-index.json",
    "research/source-audit-v3.json",
    "research/source-audit-v3.md",
    "research/source-fragments-v3.json",
}
EXCLUDED_PARTS = {".omx", "downloads", "__pycache__"}
EXCLUDED_PREFIXES = ("sources/extracted/", "assets/icons/")
DELIVERED_ROOTS = ("assets", "media", "research", "scripts", "tokens", "kit")
DELIVERED_SOURCE_PREFIXES = ("sources/readable/", "sources/decoded/")
ROOT_SOURCE_SUFFIXES = (".html", ".css", ".js", ".md")


def read_json(path: pathlib.Path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def item_id(path: str, url: str = "") -> str:
    key = path or url
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", key).strip("-").lower()
    return slug[:120] or hashlib.sha256(key.encode()).hexdigest()[:12]


def classify(path: str, content_type: str = "") -> str:
    p = pathlib.PurePosixPath(path)
    ext = p.suffix.lower()
    mime = (content_type or mimetypes.guess_type(path)[0] or "").split(";")[0]
    if ext in {".html"} or mime == "text/html":
        return "page"
    if path.startswith("scripts/") or ext in {".py", ".cjs", ".mjs"}:
        return "script"
    if ext in {".css"} or mime == "text/css":
        return "css"
    if ext in {".js", ".mjs"} or "javascript" in mime:
        return "js"
    if ext == ".map":
        return "source-map"
    if ext in {".json", ".webmanifest"} or mime in {"application/json", "application/manifest+json"}:
        return "json"
    if ext in {".svg", ".ico"} or mime.startswith("image/svg"):
        return "icon"
    if mime.startswith("image/") or ext in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".exr"}:
        return "media"
    if mime.startswith("video/") or mime.startswith("audio/") or ext in {".mp4", ".webm", ".ogg", ".mp3", ".wav"}:
        return "media"
    if ext in {".woff", ".woff2", ".ttf", ".otf"}:
        return "font"
    if ext in {".buf", ".bin", ".glb", ".gltf", ".ktx", ".ktx2"}:
        return "binary"
    if ext == ".glsl":
        return "shader"
    if ext == ".md":
        return "doc"
    return "asset"


def delivered_status(local: str) -> tuple[str, str, str]:
    extraction_prefixes = ("tokens/", "sources/readable/", "sources/decoded/", "media/video-frames/")
    extraction_files = {
        "research/asset-manifest.json",
        "research/collection-summary.json",
        "research/icon-data.js",
        "research/icon-manifest.json",
        "research/media-metadata.json",
        "research/projects.json",
        "research/source-fragments.json",
        "research/readable-code-v3.json",
        "research/buf-analysis-v3.json",
        "research/video-analysis-data.js",
        "research/video-analysis.json",
        "research/video-frames.json",
    }
    analysis_prefixes = ("research/",)
    if local.startswith(extraction_prefixes) or local in extraction_files:
        return "captured-derived", "derived", "원본 공개 자료에서 기계적으로 추출하거나 디코딩한 분석용 소스입니다."
    if local.startswith(analysis_prefixes) or local in {"README.md", "DESIGN.md"}:
        return "analysis", "analysis", "공개 자료 검증과 재구성 판단을 기록한 분석 문서입니다."
    if local.startswith("scripts/"):
        return "reconstructed", "reconstructed", "수집, 검증, 패키징을 위해 작성한 로컬 작업 스크립트입니다."
    if local.startswith("media/") and local.endswith(".md"):
        return "analysis", "analysis", "공개 자료 기반 재구성 판단과 제작 명세를 기록한 문서입니다."
    return "reconstructed", "reconstructed", "공개 증거를 바탕으로 만든 로컬 재구성 소스입니다."


def delivered_files() -> list[pathlib.Path]:
    files = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        parts = set(path.relative_to(ROOT).parts)
        if rel in INDEX_EXCLUDES or parts & EXCLUDED_PARTS or rel.startswith(EXCLUDED_PREFIXES):
            continue
        if rel.startswith(DELIVERED_ROOTS) or rel.startswith(DELIVERED_SOURCE_PREFIXES) or (path.parent == ROOT and path.suffix.lower() in ROOT_SOURCE_SUFFIXES):
            files.append(path)
    return sorted(files, key=lambda p: p.relative_to(ROOT).as_posix())


def title_from_entry(entry: dict) -> str:
    url = entry.get("url", "")
    local = entry.get("local", "")
    if entry.get("kind") == "page":
        return urllib.parse.urlparse(url).path or "/"
    return pathlib.PurePosixPath(local or urllib.parse.urlparse(url).path).name or url


def normalize_ref(ref: str, source_url: str) -> str | None:
    ref = html.unescape(ref.strip()).strip("'\"")
    if not ref or ref.startswith(("data:", "blob:", "mailto:", "tel:", "#")):
        return None
    url = urllib.parse.urljoin(source_url, ref)
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or parsed.netloc not in SOURCE_DOMAINS:
        return None
    if pathlib.PurePosixPath(parsed.path).suffix.lower() not in SOURCE_EXTENSIONS | {
        ".ico", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".mp4", ".webm", ".ogg", ".mp3", ".wav", ".woff", ".woff2", ".ttf", ".otf", ".buf", ".bin", ".glb", ".gltf", ".exr", ".ktx", ".ktx2",
    }:
        return None
    return urllib.parse.urlunparse(parsed._replace(fragment=""))


def discover_refs(entries: list[dict]) -> dict[str, set[str]]:
    refs: dict[str, set[str]] = collections.defaultdict(set)
    patterns = [
        r"""(?:src|href)=["']([^"']+)["']""",
        r"""url\(["']?([^\)"']+)""",
        r"""["'(]((?:https?://|/assets/|\./assets/|/_astro/)[^\s"'<>)]*)""",
        r"""[#@]\s*sourceMappingURL=([^\s*]+)""",
    ]
    for entry in entries:
        local = entry.get("local")
        if not local:
            continue
        path = ROOT / local
        if path.suffix.lower() not in TEXT_EXTENSIONS or not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        source_url = entry.get("url") or "https://lusion.co/"
        if '<base href="/">' in text:
            text = text.replace('"./assets/', '"/assets/')
        for pattern in patterns:
            for raw in re.findall(pattern, text):
                ref = normalize_ref(raw, source_url)
                if ref:
                    refs[ref].add(entry.get("url") or local)
        if path.suffix.lower() in {".json", ".webmanifest"}:
            for raw in re.findall(r'"([^"]+(?:/assets/|/_astro/|https?://)[^"]+)"', text):
                ref = normalize_ref(raw, source_url)
                if ref:
                    refs[ref].add(entry.get("url") or local)
    return refs


def js_strings(text: str):
    i = 0
    n = len(text)
    previous_significant = ""
    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        if ch == "/" and nxt == "/":
            i += 2
            while i < n and text[i] not in "\r\n":
                i += 1
            continue
        if ch == "/" and nxt == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
            continue
        if ch == "/" and previous_significant in ("", "(", "=", ":", ",", "[", "{", "!", "?", ";", "\n"):
            i += 1
            escaped = False
            in_class = False
            while i < n:
                cur = text[i]
                if escaped:
                    escaped = False
                elif cur == "\\":
                    escaped = True
                elif cur == "[":
                    in_class = True
                elif cur == "]":
                    in_class = False
                elif cur == "/" and not in_class:
                    i += 1
                    while i < n and text[i].isalpha():
                        i += 1
                    break
                elif cur in "\r\n":
                    break
                i += 1
            continue
        quote = ch
        if quote not in "'\"`":
            if not ch.isspace():
                previous_significant = ch
            i += 1
            continue
        start = i
        i += 1
        out = []
        escaped = False
        while i < n:
            ch = text[i]
            if escaped:
                out.append("\\" + ch)
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                break
            else:
                out.append(ch)
            i += 1
        raw = "".join(out)
        i += 1
        if len(raw) > 40:
            yield start, raw
        previous_significant = quote


def extract_shaders(source_files: list[tuple[pathlib.Path, str]]) -> list[dict]:
    out_dir = ROOT / "sources/extracted/shaders"
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.glsl"):
        old.unlink()
    shaders = []
    files = [path for path, _status in source_files if path.exists() and path.suffix.lower() in {".js", ".mjs", ".cjs"}]
    statuses = {path.resolve(): status for path, status in source_files}
    if not files:
        return shaders
    result = subprocess.run(
        ["node", "scripts/extract-shaders.cjs", *[str(path.relative_to(ROOT)) for path in files]],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )
    payload = json.loads(result.stdout)
    for shader in [s for s in payload.get("shaders", []) if not s.get("error")]:
        source_path = ROOT / shader["file"]
        status = statuses.get(source_path.resolve(), "captured-derived")
        local = out_dir / f"{source_path.stem}-{len(shaders) + 1:03}.glsl"
        local.write_text(shader["source"], encoding="utf-8")
        shaders.append({
            "id": item_id(str(local.relative_to(ROOT))),
            "title": f"{source_path.name} shader {len(shaders) + 1:03}",
            "path": str(local.relative_to(ROOT)),
            "url": "",
            "kind": "shader",
            "status": "captured-derived" if status == "captured" else "reconstructed",
            "bytes": local.stat().st_size,
            "description": f"AST-derived readable shader string from {source_path.relative_to(ROOT)} at character offset {shader['character_offset']}. Analysis excerpt; not a standalone executable module.",
            "sha256": shader["sha256"],
            "source": str(source_path.relative_to(ROOT)),
            "confidence": shader["confidence"],
            "character_offset": shader["character_offset"],
            "character_end": shader["character_end"],
            "extraction": shader["extraction"],
            "template_part": shader.get("template_part", False),
            "complete_literal": shader.get("complete_literal", True),
            "provenance": "derived",
        })
    return shaders


def fetch_status(url: str) -> dict:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DesignReferenceAudit/1.0)"})
        with urllib.request.urlopen(req, timeout=25) as response:
            data = response.read(512 * 1024)
            return {
                "status": response.status,
                "content_type": response.headers.get("Content-Type", ""),
                "bytes_sampled": len(data),
                "sha256_sample": hashlib.sha256(data).hexdigest(),
            }
    except Exception as exc:
        return {"error": str(exc)}


def fetch_bytes(url: str, limit: int = 80 * 1024 * 1024) -> dict:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DesignReferenceAudit/1.0)"})
        with urllib.request.urlopen(req, timeout=40) as response:
            data = response.read(limit + 1)
            if len(data) > limit:
                return {"url": url, "status": response.status, "content_type": response.headers.get("Content-Type", ""), "skipped": f"exceeds {limit} byte compare limit"}
            return {
                "url": url,
                "status": response.status,
                "content_type": response.headers.get("Content-Type", ""),
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "is_html_fallback": data.lstrip().lower().startswith(b"<!doctype html") and not urllib.parse.urlparse(url).path.endswith((".html", "/")),
            }
    except Exception as exc:
        return {"url": url, "error": str(exc)}


def fresh_snapshot_compare(entries: list[dict]) -> dict:
    page_entries = [e for e in entries if e.get("kind") == "page" and e.get("url")]
    bundle_entries = [
        e for e in entries
        if e.get("url") and pathlib.PurePosixPath(urllib.parse.urlparse(e["url"]).path).suffix.lower() in {".css", ".js", ".mjs"}
    ]
    targets = page_entries + bundle_entries
    comparisons = []
    for entry in targets:
        fresh = fetch_bytes(entry["url"])
        comparison = {
            "url": entry["url"],
            "local": entry.get("local", ""),
            "snapshot_bytes": entry.get("bytes"),
            "snapshot_sha256": entry.get("sha256"),
            "fresh": fresh,
        }
        comparison["matches_snapshot"] = fresh.get("sha256") == entry.get("sha256") and fresh.get("bytes") == entry.get("bytes")
        comparisons.append(comparison)

    current_bundles = []
    fresh_home = fetch_bytes("https://lusion.co/")
    if fresh_home.get("sha256"):
        req = urllib.request.Request("https://lusion.co/", headers={"User-Agent": "Mozilla/5.0 (compatible; DesignReferenceAudit/1.0)"})
        with urllib.request.urlopen(req, timeout=40) as response:
            text = response.read(2 * 1024 * 1024).decode("utf-8", errors="replace")
        for raw in re.findall(r"""(?:src|href)=["']([^"']*(?:/_astro/)[^"']+)["']""", text):
            url = urllib.parse.urljoin("https://lusion.co/", raw)
            current_bundles.append({"url": url, "captured": url in {e.get("url") for e in bundle_entries}})
    return {
        "comparisons": comparisons,
        "changed": [c for c in comparisons if c.get("fresh", {}).get("sha256") and not c["matches_snapshot"]],
        "errors": [c for c in comparisons if c.get("fresh", {}).get("error")],
        "current_bundles": current_bundles,
        "uncaptured_current_bundles": [b for b in current_bundles if not b["captured"]],
    }


def icon_derived_items() -> list[dict]:
    manifest = read_json(ROOT / "research/icon-manifest.json", {})
    items = []
    for icon in manifest.get("icons", []):
        for key, status, description in (
            ("path", "captured-derived", "Sanitized standalone SVG derived from captured inline or external SVG evidence."),
            ("raw_path", "captured-derived", "Raw SVG evidence extracted from captured HTML before standalone sanitization."),
        ):
            local = icon.get(key)
            if not local:
                continue
            p = ROOT / local
            if not p.exists():
                continue
            items.append({
                "id": item_id(f"{status}:{local}"),
                "title": icon.get("name") or pathlib.PurePosixPath(local).name,
                "path": local,
                "url": "",
                "kind": "icon",
                "status": status,
                "bytes": p.stat().st_size,
                "description": description,
                "source": icon.get("occurrences", [{}])[0].get("page", ""),
            })
    for icon in manifest.get("external_icons", []):
        local = icon.get("path")
        p = ROOT / local if local else None
        if p and p.exists():
            items.append({
                "id": item_id(f"captured-derived:{local}"),
                "title": icon.get("name") or pathlib.PurePosixPath(local).name,
                "path": local,
                "url": icon.get("url", ""),
                "kind": "icon",
                "status": "captured-derived",
                "bytes": p.stat().st_size,
                "description": "Standalone SVG copied or normalized from a captured public external SVG.",
            })
    for icon in manifest.get("replicas", []):
        local = icon.get("path")
        p = ROOT / local if local else None
        if p and p.exists():
            items.append({
                "id": item_id(f"reconstructed:{local}"),
                "title": icon.get("name") or pathlib.PurePosixPath(local).name,
                "path": local,
                "url": "",
                "kind": "icon",
                "status": "reconstructed",
                "bytes": p.stat().st_size,
                "description": "Replica SVG reconstructed from CSS/canvas behavior when no standalone original source exists.",
                "source": icon.get("source", ""),
            })
    return items


def runtime_path_audit(captured_success_urls: set[str], manifest_urls: set[str]) -> dict:
    js_path = ROOT / "sources/site.js"
    if not js_path.exists():
        return {"settings_paths": {}, "resolved": [], "unresolved": [], "note": "sources/site.js is missing."}
    js = js_path.read_text(encoding="utf-8", errors="replace")
    settings_paths = dict(re.findall(r'(\w+_PATH)="(/assets/[^" ]+)"', js))
    candidates = set()
    for key, tail in re.findall(r'settings\.(\w+_PATH)\+"([^"\n]+)"', js):
        if key in settings_paths and pathlib.PurePosixPath(tail).suffix:
            candidates.add("https://lusion.dev" + settings_paths[key] + tail)
    for raw in re.findall(r'"(/assets/[^"]+\.json)"', js):
        candidates.add("https://lusion.dev" + raw)
    for raw in re.findall(r'"(https://(?:lusion\.co|lusion\.dev)/[^"]+\.json)"', js):
        candidates.add(raw)
    resolved = sorted(url for url in candidates if url in captured_success_urls)
    unresolved = sorted(url for url in candidates if url not in captured_success_urls)
    return {
        "settings_paths": settings_paths,
        "candidate_count": len(candidates),
        "resolved": resolved,
        "unresolved": unresolved,
        "outside_manifest": sorted(url for url in candidates if url not in manifest_urls),
    }


def previous_fresh_compare() -> dict | None:
    previous = read_json(ROOT / "research/source-audit-v3.json", {})
    return previous.get("fresh_snapshot_compare")


def main():
    parser = argparse.ArgumentParser(description="Build Lusion source index and audit reports.")
    parser.add_argument("--offline", action="store_true", help="reuse the previous fresh snapshot comparison instead of hitting lusion.co again")
    args = parser.parse_args()
    manifest = read_json(ROOT / "research/asset-manifest.json", {"entries": []})
    entries = manifest.get("entries", [])
    items = []
    validation = []
    captured_success_urls = {entry.get("url") for entry in entries if entry.get("url") and (entry.get("capture_status") or "captured") == "captured" and entry.get("local")}
    manifest_urls = {entry.get("url") for entry in entries if entry.get("url")}
    item_paths = set()

    for entry in entries:
        local = entry.get("local", "")
        path = ROOT / local if local else None
        status = entry.get("capture_status") or ("captured" if local else entry.get("error") and "error" or "unknown")
        check = {
            "url": entry.get("url", ""),
            "local": local,
            "status": status,
            "expected_bytes": entry.get("bytes"),
            "expected_sha256": entry.get("sha256"),
            "exists": bool(path and path.exists()),
        }
        if path and path.exists():
            check["actual_bytes"] = path.stat().st_size
            check["actual_sha256"] = sha256(path)
            check["bytes_match"] = entry.get("bytes") in (None, check["actual_bytes"])
            check["sha256_match"] = entry.get("sha256") in (None, check["actual_sha256"])
        validation.append(check)
        item = {
            "id": item_id(local, entry.get("url", "")),
            "title": title_from_entry(entry),
            "path": local,
            "url": entry.get("url", ""),
            "kind": classify(local or entry.get("url", ""), entry.get("content_type", "")),
            "status": status,
            "bytes": entry.get("bytes", 0),
            "description": ("요청한 파일 대신 HTML을 반환하여 원본 소스로 수집하지 않았습니다."
                            if status == "html_fallback" else
                            f"공개 원본 파일 · 출처: {urllib.parse.urlparse(entry.get('url', '')).netloc or '원본 원장'}"),
            "provenance": "official-public",
        }
        items.append(item)
        if local:
            item_paths.add(local)

    official_source_files = []
    for entry in entries:
        local = entry.get("local")
        if local and pathlib.PurePosixPath(local).suffix.lower() in {".js", ".mjs"}:
            official_source_files.append((ROOT / local, "captured"))
    for local in ("sources/site.js", "sources/site.css"):
        p = ROOT / local
        if p.exists():
            entry = {
                "id": item_id(local),
                "title": pathlib.PurePosixPath(local).name,
                "path": local,
                "url": "",
                "kind": classify(local),
                "status": "captured-derived",
                "provenance": "derived",
                "bytes": p.stat().st_size,
                "description": "Convenience copy of the public deployed bundle used by the design-system reference.",
            }
            if local not in item_paths:
                items.append(entry)
                item_paths.add(local)
            if p.suffix == ".js":
                official_source_files.append((p, "captured"))

    reconstructed_source_files = []
    readable = {entry["path"]: entry for entry in read_json(ROOT / "research/readable-code-v3.json", {}).get("fragments", [])}
    decoded = {}
    for entry in read_json(ROOT / "sources/decoded/manifest.json", {}).get("models", []):
        for key in ("points", "obj"):
            if entry.get(key):
                decoded[entry[key]] = entry
    for p in delivered_files():
        local = p.relative_to(ROOT).as_posix()
        if local in item_paths:
            continue
        status, provenance, description = delivered_status(local)
        if p.suffix.lower() in {".js", ".mjs", ".cjs"} and status == "reconstructed":
            reconstructed_source_files.append((p, status))
        items.append({
            "id": item_id(local),
            "title": pathlib.PurePosixPath(local).name,
            "path": local,
            "url": "",
            "kind": classify(local),
            "status": status,
            "bytes": p.stat().st_size,
            "description": description,
            "provenance": provenance,
        })
        if local in readable:
            evidence = readable[local]
            items[-1].update({"source": evidence["source"], "sha256": evidence["sha256"],
                              "source_start_utf16": evidence["start_utf16"], "source_end_utf16": evidence["end_utf16"],
                              "description": f"{evidence['name']} · 공개 번들의 UTF-16 위치 {evidence['start_utf16']}–{evidence['end_utf16']}에서 분리한 분석용 코드. 상위 범위와 다른 코드에 의존할 수 있습니다."})
        elif local in decoded:
            evidence = decoded[local]
            items[-1].update({"source": evidence["file"],
                              "description": f"공개 BUF에서 디코딩한 좌표 · {evidence['status']} · 정점 {evidence['vertexCount']}개. 원본 리그·재질 재생과 구분합니다."})
        item_paths.add(local)

    for item in icon_derived_items():
        if item["path"] in item_paths:
            continue
        items.append(item)
        item_paths.add(item["path"])

    shaders = extract_shaders(official_source_files + reconstructed_source_files)
    for item in shaders:
        if item["path"] in item_paths:
            continue
        items.append(item)
        item_paths.add(item["path"])

    refs = discover_refs(entries + [{"local": "sources/site.js", "url": "https://lusion.co/_astro/hoisted.CUO_IjfL.js"}, {"local": "sources/site.css", "url": "https://lusion.co/_astro/about.CNa9RfUh.css"}])
    missing_refs = sorted(url for url in refs if url not in manifest_urls)
    unresolved_refs = sorted(url for url in refs if url not in captured_success_urls)
    source_maps = sorted(url for url in refs if pathlib.PurePosixPath(urllib.parse.urlparse(url).path).suffix.lower() == ".map")

    official_routes = [
        "https://lusion.co/",
        "https://lusion.co/about",
        "https://lusion.co/projects",
        *sorted(entry["url"] for entry in entries if entry.get("kind") == "page" and "/projects/" in entry.get("url", "")),
    ]
    sampled_routes = (read_json(ROOT / "research/source-audit-v3.json", {}).get("official_route_sample", {})
                      if args.offline else {url: fetch_status(url) for url in official_routes[:25]})
    fresh_compare = previous_fresh_compare() if args.offline else fresh_snapshot_compare(entries)
    if not fresh_compare:
        fresh_compare = {"comparisons": [], "changed": [], "errors": [], "current_bundles": [], "uncaptured_current_bundles": [], "offline": True}
    elif args.offline:
        fresh_compare = {**fresh_compare, "offline_reused": True}
    runtime_refs = runtime_path_audit(captured_success_urls, manifest_urls)

    failures = [x for x in validation if x["status"] == "captured" and (not x["exists"] or x.get("bytes_match") is False or x.get("sha256_match") is False)]
    fallback_resources = [x for x in validation if x["status"] == "html_fallback"]
    by_kind = dict(collections.Counter(item["kind"] for item in items))
    by_status = dict(collections.Counter(item["status"] for item in items))
    official_count = sum(1 for item in items if item.get("provenance") == "official-public" and item.get("status") == "captured")
    derived_count = sum(1 for item in items if item.get("provenance") == "derived" or item.get("status") == "captured-derived")
    summary = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "items": len(items),
        "captured_items": by_status.get("captured", 0),
        "captured_derived_items": by_status.get("captured-derived", 0),
        "reconstructed_items": by_status.get("reconstructed", 0),
        "official_public_items": official_count,
        "derived_items": derived_count,
        "manifest_entries": len(entries),
        "manifest_pages": sum(1 for e in entries if e.get("kind") == "page"),
        "manifest_assets": sum(1 for e in entries if e.get("kind") == "asset" and e.get("local")),
        "bytes": sum(item.get("bytes") or 0 for item in items),
        "by_kind": by_kind,
        "by_status": by_status,
        "missing_public_refs": len(missing_refs),
        "unresolved_public_refs": len(unresolved_refs),
        "explicit_source_maps": len(source_maps),
        "validation_failures": len(failures),
        "html_fallbacks": len(fallback_resources),
        "fresh_snapshot_changes": len(fresh_compare["changed"]),
        "fresh_snapshot_errors": len(fresh_compare["errors"]),
        "uncaptured_current_bundles": len(fresh_compare["uncaptured_current_bundles"]),
        "runtime_ref_candidates": runtime_refs.get("candidate_count", 0),
        "runtime_ref_unresolved": len(runtime_refs.get("unresolved", [])),
        "scope": "공식 공개 lusion.co/lusion.dev 페이지, 배포 HTML/CSS/JS, 정적/런타임 발견 에셋, 명시 sourceMappingURL 대상만 포함하고 비공개 구조 대체물은 reconstructed로 표시한다.",
    }

    index = {"items": items, "summary": summary}
    (ROOT / "research/source-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "source-index.js").write_text("window.LUSION_SOURCE_INDEX=" + json.dumps(index, ensure_ascii=False) + ";\n", encoding="utf-8")
    (ROOT / "research/source-fragments-v3.json").write_text(json.dumps({"shaders": shaders}, ensure_ascii=False, indent=2), encoding="utf-8")

    audit = {
        "summary": summary,
        "missing_public_refs": [{"url": url, "referenced_by": sorted(refs[url])} for url in missing_refs],
        "unresolved_public_refs": [{"url": url, "referenced_by": sorted(refs[url])} for url in unresolved_refs],
        "source_maps": source_maps,
        "validation_failures": failures,
        "html_fallbacks": fallback_resources,
        "fresh_snapshot_compare": fresh_compare,
        "runtime_path_audit": runtime_refs,
        "validation_sample": validation[:20],
        "official_route_sample": sampled_routes,
        "notes": [
            "비공개 경로나 숨은 라우트 brute force는 수행하지 않았다.",
            "source map은 명시 sourceMappingURL 참조만 인정한다.",
            "HTML fallback 응답은 captured asset으로 보지 않고 별도 unresolved/fallback으로 분리한다.",
            "공개되지 않은 원본 내부 구조 대체물은 status='reconstructed'로 표시한다.",
        ],
    }
    (ROOT / "research/source-audit-v3.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        "# 소스 감사 V3",
        "",
        f"- 생성 시각: {summary['generated_at']}",
        f"- 인덱스 항목: {summary['items']}",
        f"- 공식 공개 원본 항목: {summary['official_public_items']}",
        f"- 공개 원본 파생 항목: {summary['captured_derived_items']}",
        f"- 재구성 대체 항목: {summary['reconstructed_items']}",
        f"- manifest 페이지/에셋: {summary['manifest_pages']} pages / {summary['manifest_assets']} assets",
        f"- 로컬 검증 실패: {summary['validation_failures']}",
        f"- 수집 manifest 밖 공개 참조: {summary['missing_public_refs']}",
        f"- captured 성공으로 해결되지 않은 공개 참조: {summary['unresolved_public_refs']}",
        f"- 명시 source map: {summary['explicit_source_maps']}",
        f"- HTML fallback 리소스: {summary['html_fallbacks']}",
        f"- 최신 snapshot hash 변경: {summary['fresh_snapshot_changes']}",
        f"- 최신 snapshot 확인 오류: {summary['fresh_snapshot_errors']}",
        f"- 현재 홈 HTML의 미수집 bundle: {summary['uncaptured_current_bundles']}",
        f"- 런타임 settings/JSON 후보: {summary['runtime_ref_candidates']}",
        f"- 런타임 settings/JSON 미해결: {summary['runtime_ref_unresolved']}",
        "",
        "## 범위",
        "",
        summary["scope"],
        "",
        "## 한계",
        "",
        "- 비공개 리소스, 링크되지 않은 숨은 라우트, brute-force 발견은 범위 밖이다.",
        "- 런타임 전용 URL은 저장된 네트워크 캡처나 배포 번들에서 정적으로 복원 가능한 경우에만 포함했다.",
        "- 공개되지 않은 원본 내부 구조는 재구성 파일로 대체하고 인덱스에서 reconstructed로 표시했다.",
    ]
    if missing_refs:
        lines.extend(["", "## manifest 밖 공개 참조", ""])
        for ref in missing_refs[:100]:
            lines.append(f"- {ref}")
    if unresolved_refs:
        lines.extend(["", "## captured 성공으로 해결되지 않은 공개 참조", ""])
        for ref in unresolved_refs[:100]:
            lines.append(f"- {ref}")
    if failures:
        lines.extend(["", "## 검증 실패", ""])
        for failure in failures[:100]:
            lines.append(f"- {failure.get('local') or failure.get('url')}: {failure.get('status')}")
    if runtime_refs.get("unresolved"):
        lines.extend(["", "## 런타임 settings/JSON 미해결", ""])
        for ref in runtime_refs["unresolved"][:100]:
            lines.append(f"- {ref}")
    (ROOT / "research/source-audit-v3.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
