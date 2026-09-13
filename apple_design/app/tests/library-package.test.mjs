import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const appRoot = path.resolve(new URL("..", import.meta.url).pathname);
const archive = path.join(appRoot, "public", "source-design-system-0.1.0.tgz");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });

  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`,
  );

  return result;
}

test("library package packs only the reusable design system surface", async () => {
  run("node", ["scripts/build-library.mjs"]);

  const listing = run("tar", ["-tzf", archive]).stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();

  const allowed = new Set([
    "package/README.md",
    "package/dist/components.css",
    "package/dist/index.js",
    "package/dist/styles.css",
    "package/dist/system/index.d.ts",
    "package/dist/tokens.css",
    "package/dist/tokens.json",
    "package/package.json",
  ]);

  for (const entry of listing) {
    assert.ok(
      allowed.has(entry) || entry === "package/dist/forms.css",
      `Unexpected packed file: ${entry}`,
    );
    assert.doesNotMatch(entry, /\.(png|jpe?g|webp|gif|avif|svg|woff2?|ttf|otf)$/i);
    assert.doesNotMatch(entry, /^package\/(?:research|evidence|public|src)\//);
  }

  for (const required of allowed) {
    assert.ok(listing.includes(required), `Missing packed file: ${required}`);
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "source-ds-"));
  try {
    run("tar", ["-xzf", archive, "-C", tempRoot]);
    const packageRoot = path.join(tempRoot, "package");
    const packageJson = JSON.parse(
      await fs.readFile(path.join(packageRoot, "package.json"), "utf8"),
    );
    assert.equal(packageJson.name, "@local/source-design-system");
    assert.equal(packageJson.version, "0.1.0");
    assert.equal(packageJson.license, "UNLICENSED");
    assert.deepEqual(packageJson.files, ["dist", "README.md"]);
    assert.equal(packageJson.peerDependencies.react, "^19.0.0");
    assert.equal(packageJson.peerDependencies["react-dom"], "^19.0.0");

    const indexJs = await fs.readFile(path.join(packageRoot, "dist", "index.js"), "utf8");
    assert.match(indexJs, /^"use client";/);
    for (const entry of listing) {
      if (!/\.(js|css|json|md|d\.ts)$/.test(entry)) {
        continue;
      }

      const content = await fs.readFile(
        path.join(packageRoot, entry.replace(/^package\//, "")),
        "utf8",
      );
      assert.doesNotMatch(content, /https:\/\/www\.apple\.com|fonts\.apple\.com|\/research\//);
    }

    const fixtureRoot = path.join(tempRoot, "consumer");
    const fixturePackageRoot = path.join(
      fixtureRoot,
      "node_modules",
      "@local",
      "source-design-system",
    );
    await fs.mkdir(path.dirname(fixturePackageRoot), { recursive: true });
    await fs.rename(packageRoot, fixturePackageRoot);
    await fs.writeFile(
      path.join(fixtureRoot, "package.json"),
      JSON.stringify({ type: "module", dependencies: {} }, null, 2),
    );
    await fs.mkdir(path.join(fixtureRoot, "node_modules"), { recursive: true });
    await fs.symlink(
      path.join(appRoot, "node_modules", "react"),
      path.join(fixtureRoot, "node_modules", "react"),
      "dir",
    );
    await fs.symlink(
      path.join(appRoot, "node_modules", "react-dom"),
      path.join(fixtureRoot, "node_modules", "react-dom"),
      "dir",
    );

    const consumerModule = path.join(fixtureRoot, "consume.mjs");
    await fs.writeFile(
      consumerModule,
      [
        "import * as mod from '@local/source-design-system';",
        "import tokens from '@local/source-design-system/tokens.json' with { type: 'json' };",
        "export const resolved = {",
        "  styles: import.meta.resolve('@local/source-design-system/styles.css'),",
        "  tokensCss: import.meta.resolve('@local/source-design-system/tokens.css'),",
        "  componentsCss: import.meta.resolve('@local/source-design-system/components.css'),",
        "  tokensJson: import.meta.resolve('@local/source-design-system/tokens.json'),",
        "};",
        "export { mod, tokens };",
      ].join("\n"),
    );
    const { mod, tokens: importedTokens, resolved } = await import(pathToFileURL(consumerModule));
    assert.equal(importedTokens.apple.color.blue, "#0071e3");
    assert.match(resolved.styles, /\/dist\/styles\.css$/);
    assert.match(resolved.tokensCss, /\/dist\/tokens\.css$/);
    assert.match(resolved.componentsCss, /\/dist\/components\.css$/);
    assert.match(resolved.tokensJson, /\/dist\/tokens\.json$/);
    const expectedExports = [
      "Accordion",
      "Button",
      "Carousel",
      "Dialog",
      "ProductTile",
      "SegmentedControl",
      "TextField",
      "Toggle",
      "tokens",
      "useReducedMotion",
    ];
    for (const name of expectedExports) {
      assert.ok(name in mod, `Missing export: ${name}`);
    }
    assert.equal(mod.tokens.apple.color.blue, "#0071e3");

    const React = await import("react");
    const { renderToString } = await import("react-dom/server");
    const renderCases = [
      React.createElement(mod.Button, { variant: "secondary" }, "Package smoke"),
      React.createElement(mod.SegmentedControl, {
        options: [{ value: "one", label: "One" }],
        value: "one",
      }),
      React.createElement(mod.Toggle, { checked: true, label: "Enabled" }),
      React.createElement(mod.Accordion, {
        items: [{ title: "Details", content: "Open content" }],
      }),
      React.createElement(mod.ProductTile, {
        title: "Package tile",
        subtitle: "Reusable",
      }),
      React.createElement(mod.Carousel, {
        items: [{ title: "Slide one", description: "Ready" }],
      }),
      React.createElement(mod.TextField, {
        label: "Name",
        value: "",
        onChange: () => {},
      }),
      React.createElement(mod.Dialog, {
        open: true,
        title: "Dialog title",
        children: "Dialog content",
      }),
    ];
    const html = renderCases.map((element) => renderToString(element)).join("\n");
    assert.match(html, /Package smoke/);
    assert.match(html, /ds-button/);
    assert.match(html, /Package tile/);
    assert.match(html, /Dialog title/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
