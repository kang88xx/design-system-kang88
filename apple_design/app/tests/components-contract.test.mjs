import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import reactPlugin from "@vitejs/plugin-react";

let viteServer;
let components;
const appRoot = new URL("..", import.meta.url).pathname;

test.before(async () => {
  viteServer = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    plugins: [reactPlugin()],
    root: appRoot,
    server: { hmr: false, middlewareMode: true },
  });
  components = await viteServer.ssrLoadModule("/src/system/components.jsx");
});

test.after(async () => {
  await viteServer?.close();
});

test("disabled link buttons leave navigation and expose disabled state", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      components.Button,
      { disabled: true, href: "/buy", tabIndex: 4 },
      "Buy",
    ),
  );

  assert.match(html, /<a/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /tabindex="-1"/);
  assert.doesNotMatch(html, /href="\/buy"/);
});

test("segmented control keeps exactly one enabled option in the tab order", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.SegmentedControl, {
      label: "Lineup",
      value: "missing",
      options: [
        { value: "mac", label: "Mac", disabled: true },
        { value: "ipad", label: "iPad" },
        { value: "iphone", label: "iPhone" },
      ],
    }),
  );

  assert.match(html, /role="radiogroup"/);
  assert.match(html, /aria-label="Lineup"/);
  assert.equal(html.match(/tabindex="0"/g)?.length, 1);
  assert.match(html, /disabled=""[^>]*>Mac/);
  assert.match(html, /tabindex="0"[^>]*>iPad/);
});

test("carousel renders accessible controls and respects disabled autoplay", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.Carousel, {
      autoPlay: false,
      items: [
        { title: "MacBook Air", href: "/mac" },
        { title: "iPad Air", href: "/ipad" },
      ],
      labels: {
        carousel: "Featured products",
        next: "Next product",
        pause: "Pause rotation",
        pauseText: "Pause",
        previous: "Previous product",
        resume: "Resume rotation",
        resumeText: "Resume",
        slidePicker: "Product slides",
        slideTo: (index, item) => `Open ${index + 1}: ${item.title}`,
      },
    }),
  );

  assert.match(html, /aria-label="Featured products"/);
  assert.match(html, /aria-label="Previous product"/);
  assert.match(html, /aria-label="Pause rotation"/);
  assert.match(html, />Pause</);
  assert.match(html, /aria-label="Next product"/);
  assert.match(html, /aria-label="Product slides"/);
  assert.match(html, /aria-label="Open 2: iPad Air"/);
  assert.match(html, /aria-live="polite"/);
});

test("carousel and component motion remain reducible through CSS", async () => {
  const styles = await viteServer.transformRequest("/src/system/components.css");
  const code = styles?.code || "";

  assert.match(code, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(code, /\.ds-carousel-track[\s\S]*transition: none;/);
});
