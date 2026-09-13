# Family project kit integration review

Date: 2026-09-07 KST
Scope: read-only review of `design-system/package.json`, `design-system/README.md`, `design-system/ASSETS.md`, `design-system/CHANGELOG.md`, `design-system/examples/*`, `scripts/build-project-kit.py`, `system.html`, and root handoff links. Runtime implementation review was not repeated; `runtime-validation.json` already reports 14 passing browser checks.

## Findings

1. `tools/__pycache__/build-tokens.cpython-312.pyc` is packaged in both `family-design-system-1.0.0.tgz` and `family-project-kit.zip`.
   - Evidence: `scripts/build-project-kit.py` packages every file returned by `npm pack`; `design-system/package.json` includes the whole `tools` directory in `files`; `npm pack` output includes `tools/__pycache__/build-tokens.cpython-312.pyc`.
   - Impact: unnecessary generated Python bytecode ships in the project kit. It is not a runtime break, but it weakens the “source-only, copyable kit” claim and adds avoidable generated noise to consumer projects.
   - Suggested fix: change the package `files` entry from `tools` to `tools/build-tokens.py`, or remove `design-system/tools/__pycache__` before packing.

## Passed Checks

- `system.html` local `href`/`src` references resolve to existing files.
- `design-system/examples/starter.html` local `href`/`src` references resolve to existing files.
- `design-system/examples/starter.js` contains no `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, storage writes, `eval`, `Function`, `innerHTML =`, or `insertAdjacentHTML` matches in the reviewed surface.
- README dialog guidance matches the runtime boundary: opener and dialog must be in the same initialized root; portal/cross-root ownership is not promised.
- `family-design-system-1.0.0.tgz` contains the documented public package files: README, changelog, asset note, styles, tokens, JS runtime, TypeScript declarations, starter example, and token build tool.

## Resolution verified by leader

The package now explicitly allows `tools/build-tokens.py` instead of the whole tools directory. Repacked ZIP/npm archives contain 14 source/document/example files; `verify-project-kit.py` rejects `__pycache__` and `.pyc` entries. Independent npm installation, TypeScript consumer compilation and extracted-kit browser validation pass again. No open integration finding remains in this review scope.
