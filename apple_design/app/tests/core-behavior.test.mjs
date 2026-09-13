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

test("Button preserves native button props and blocks loading activation", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      components.Button,
      {
        "data-track": "primary",
        loading: true,
        name: "hero",
        tabIndex: 3,
        type: "submit",
      },
      "Buy",
    ),
  );

  assert.match(html, /<button/);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /data-loading="true"/);
  assert.match(html, /tabindex="3"/);
  assert.match(html, /type="submit"/);
  assert.match(html, /name="hero"/);
  assert.match(html, /data-track="primary"/);
});

test("SegmentedControl falls back to one valid tab stop and omits disabled options", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.SegmentedControl, {
      "data-ui": "segments",
      "aria-label": "Product family",
      className: "custom-segments",
      value: "missing",
      options: [
        { value: "mac", label: "Mac", disabled: true },
        { value: "ipad", label: "iPad" },
        { value: "iphone", label: "iPhone" },
      ],
    }),
  );

  assert.match(html, /role="radiogroup"/);
  assert.match(html, /aria-label="Product family"/);
  assert.match(html, /data-ui="segments"/);
  assert.match(html, /custom-segments/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /tabindex="-1"[^>]*>Mac/);
  assert.match(html, /tabindex="0"[^>]*>iPad/);
  assert.match(html, /tabindex="-1"[^>]*>iPhone/);
});

test("Toggle supports native input props and uncontrolled default state", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.Toggle, {
      defaultChecked: true,
      disabled: true,
      id: "availability",
      "aria-label": "Store availability",
      label: "Available",
      name: "available",
      required: true,
      value: "yes",
    }),
  );

  assert.match(html, /for="availability"/);
  assert.match(html, /id="availability"/);
  assert.match(html, /name="available"/);
  assert.match(html, /value="yes"/);
  assert.match(html, /required=""/);
  assert.match(html, /disabled=""/);
  assert.match(html, /checked=""/);
  assert.match(html, /aria-label="Store availability"/);
});

test("Accordion uses stable ids, default open state, and root props", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.Accordion, {
      "data-kind": "faq",
      className: "custom-accordion",
      items: [
        {
          id: "shipping",
          title: "Shipping",
          content: "Ships tomorrow",
          defaultOpen: true,
        },
      ],
    }),
  );

  assert.match(html, /custom-accordion/);
  assert.match(html, /data-kind="faq"/);
  assert.match(html, /<details[^>]*id="shipping"[^>]*open=""/);
});

test("ProductTile exposes project-ready content controls", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.ProductTile, {
      ctaLabel: "Explore",
      href: "/mac",
      headingLevel: 3,
      image: "/mac.jpg",
      imageAlt: "MacBook Air in sky blue",
      secondaryCtaLabel: "Compare",
      secondaryHref: "/compare",
      title: "MacBook Air",
    }),
  );

  assert.match(html, /<h3/);
  assert.match(html, /alt="MacBook Air in sky blue"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, />Explore</);
  assert.match(html, />Compare</);
});

test("Carousel exposes i18n labels, stable autoplay defaults, and no-image fallback", () => {
  const html = renderToStaticMarkup(
    React.createElement(components.Carousel, {
      "data-carousel": "featured",
      className: "custom-carousel",
      interval: 0,
      items: [
        { title: "MacBook Air", description: "Light. Fast." },
        { title: "iPhone", description: "Built for Apple Intelligence." },
      ],
      labels: {
        carousel: "Featured products",
        next: "Next",
        pause: "Stop",
        pauseText: "Stop",
        previous: "Previous",
        resume: "Start",
        resumeText: "Start",
        slidePicker: "Slides",
        slideTo: (index, item) => `Go to ${index + 1}: ${item.title}`,
      },
    }),
  );

  assert.match(html, /custom-carousel/);
  assert.match(html, /data-carousel="featured"/);
  assert.match(html, /aria-label="Featured products"/);
  assert.match(html, /aria-label="Previous"/);
  assert.match(html, /aria-label="Stop"/);
  assert.match(html, />Stop</);
  assert.match(html, /aria-label="Next"/);
  assert.match(html, /aria-label="Slides"/);
  assert.match(html, /aria-label="Go to 1: MacBook Air"/);
  assert.match(html, /ds-carousel-card-fallback/);
});
