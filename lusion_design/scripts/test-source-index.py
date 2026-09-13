"""Targeted regression checks for source index collection rules."""
from __future__ import annotations

import importlib.util
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("build_source_index", ROOT / "scripts/build-source-index.py")
build_source_index = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(build_source_index)


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def test_delivered_scan_boundaries():
    paths = {path.relative_to(ROOT).as_posix() for path in build_source_index.delivered_files()}
    assert_true("source-index.js" not in paths, "generated source-index.js must not be scanned as delivered source")
    assert_true(not any(path.startswith(".omx/") for path in paths), ".omx files must be excluded")
    assert_true(not any(path.startswith("downloads/") for path in paths), "downloads must be excluded")
    assert_true(not any(path.startswith("sources/extracted/") for path in paths), "shader extraction duplicates must be excluded from delivered scan")
    if (ROOT / "source-explorer.css").exists():
        assert_true("source-explorer.css" in paths, "source-explorer.css should be included by full delivered-source scan")
    if (ROOT / "workspace-nav.css").exists():
        assert_true("workspace-nav.css" in paths, "workspace-nav.css should be included by full delivered-source scan")


def test_ast_shader_extraction_ignores_comments_and_regex():
    fixture = """
    // uniform float fake; void main(){ gl_FragColor=vec4(1.0); }
    const r = /uniform float fake; void main\\(\\){ gl_FragColor=vec4\\(1.0\\); }/;
    const shader = `precision highp float;
    uniform float u_time;
    void main(){ gl_FragColor = vec4(u_time); }`;
    """
    with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
        fixture_path = pathlib.Path(tmp) / "shader-fixture.js"
        fixture_path.write_text(fixture, encoding="utf-8")
        result = subprocess.run(
            ["node", "scripts/extract-shaders.cjs", fixture_path.relative_to(ROOT).as_posix()],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )
    payload = json.loads(result.stdout)
    shaders = [entry for entry in payload["shaders"] if not entry.get("error")]
    assert_true(len(shaders) == 1, f"expected exactly one real shader literal, got {len(shaders)}")
    assert_true(shaders[0]["extraction"] == "babel-ast-string-literal", "shader extraction should use Babel AST")
    assert_true("character_offset" in shaders[0], "shader extraction must include character offsets")


def test_source_index_schema_if_present():
    index_path = ROOT / "research/source-index.json"
    if not index_path.exists():
        return
    data = json.loads(index_path.read_text(encoding="utf-8"))
    required = {"id", "title", "path", "url", "kind", "status", "bytes", "description"}
    missing = [item for item in data["items"] if not required.issubset(item)]
    assert_true(not missing, f"source index items missing required keys: {len(missing)}")
    blocked = [item for item in data["items"] if item.get("path", "").startswith((".omx/", "downloads/"))]
    assert_true(not blocked, "source index must not include .omx or downloads files")
    paths = [item.get("path", "") for item in data["items"] if item.get("path")]
    ids = [item.get("id", "") for item in data["items"] if item.get("id")]
    assert_true(len(paths) == len(set(paths)), "source index must not contain duplicate paths")
    assert_true(len(ids) == len(set(ids)), "source index must not contain duplicate ids")
    shaders = [item for item in data["items"] if item.get("kind") == "shader"]
    assert_true(len(shaders) == 155, f"source index should include 155 AST shader snippets once, got {len(shaders)}")
    icon_paths = [item for item in data["items"] if item.get("path", "").startswith("assets/icons/")]
    assert_true(len(icon_paths) >= 58, f"source index should include extracted/reconstructed icon assets, got {len(icon_paths)}")


if __name__ == "__main__":
    test_delivered_scan_boundaries()
    test_ast_shader_extraction_ignores_comments_and_regex()
    test_source_index_schema_if_present()
    print("source index regression checks passed")
