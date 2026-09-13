const ORIGIN = "https://montage.wanted.co.kr";
  const MAX_PAGES = 500;
  const CONCURRENCY = 10;
  const seedPaths = [
    "/",
    "/docs/getting-started",
    "/docs/foundations",
    "/docs/components",
    "/docs/utilities",
  ];

  const normalizeText = (value) =>
    (value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const normalizeUrl = (value, base = ORIGIN) => {
    try {
      const url = new URL(value, base);
      if (url.origin !== ORIGIN) return url.href;
      url.hash = "";
      url.search = "";
      if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
      return url.href;
    } catch {
      return null;
    }
  };

  const isCrawlable = (value) => {
    try {
      const url = new URL(value);
      return url.origin === ORIGIN && (url.pathname === "/" || url.pathname.startsWith("/docs/"));
    } catch {
      return false;
    }
  };

  const absoluteAssetUrl = (value, base) => {
    if (!value || value.startsWith("data:")) return null;
    try {
      return new URL(value, base).href;
    } catch {
      return null;
    }
  };

  const normalizeSvg = (svg) => {
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    clone.removeAttribute("class");
    clone.removeAttribute("aria-hidden");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", "0 0 24 24");
    clone.setAttribute("width", "24");
    clone.setAttribute("height", "24");
    return clone.outerHTML;
  };

  const extractCssUrls = (value, base) =>
    [...(value || "").matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)]
      .map((match) => absoluteAssetUrl(match[2], base))
      .filter(Boolean);

  const extractSerializedAssets = (value, base) => {
    const decoded = (value || "")
      .replaceAll("\\/", "/")
      .replaceAll("\\u0026", "&")
      .replaceAll("&amp;", "&");
    return [
      ...new Set(
        [...decoded.matchAll(/(?:https?:\/\/|\/)[A-Za-z0-9@:%._+~#=/&?,-]*?\.(?:png|jpe?g|webp|gif|svg)(?:\?[A-Za-z0-9@:%_+.~#=&/,-]*)?/gi)]
          .map((match) => absoluteAssetUrl(match[0], base))
          .filter((url) => {
            try {
              return new URL(url).origin === ORIGIN;
            } catch {
              return false;
            }
          }),
      ),
    ];
  };

  const extractPage = (html, url, status) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const main = doc.querySelector("main") || doc.body;
    main.querySelectorAll("script,style,noscript").forEach((node) => node.remove());

    const links = [...doc.querySelectorAll("a[href]")]
      .map((anchor) => ({
        text: normalizeText(anchor.textContent),
        href: normalizeUrl(anchor.getAttribute("href"), url),
      }))
      .filter((link) => link.href);

    const blocks = [...main.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption")]
      .map((element) => ({
        type: element.tagName.toLowerCase(),
        text: normalizeText(element.textContent),
      }))
      .filter((block) => block.text);

    const tables = [...main.querySelectorAll("table")].map((table) => ({
      caption: normalizeText(table.querySelector("caption")?.textContent),
      rows: [...table.querySelectorAll("tr")].map((row) =>
        [...row.querySelectorAll("th,td")].map((cell) => normalizeText(cell.textContent)),
      ),
    }));

    const code = [...main.querySelectorAll("pre,code")]
      .map((element) => normalizeText(element.textContent))
      .filter(Boolean);

    const images = [...doc.querySelectorAll("img")]
      .map((image) => ({
        src: absoluteAssetUrl(image.getAttribute("src"), url),
        alt: image.getAttribute("alt") || "",
        width: Number(image.getAttribute("width")) || null,
        height: Number(image.getAttribute("height")) || null,
      }))
      .filter((image) => image.src);

    const sources = [...doc.querySelectorAll("source[src],source[srcset]")]
      .flatMap((source) => {
        const srcset = source.getAttribute("srcset") || source.getAttribute("src") || "";
        return srcset.split(",").map((entry) => entry.trim().split(/\s+/)[0]);
      })
      .map((src) => absoluteAssetUrl(src, url))
      .filter(Boolean);

    const posters = [...doc.querySelectorAll("video[poster]")]
      .map((video) => absoluteAssetUrl(video.getAttribute("poster"), url))
      .filter(Boolean);

    const inlineStyleAssets = [...doc.querySelectorAll("[style]")]
      .flatMap((element) => extractCssUrls(element.getAttribute("style"), url));
    const serializedAssets = extractSerializedAssets(html, url);

    const iconVectors = [...main.querySelectorAll('button[aria-label^="Show detail Icon"]')]
      .map((button) => {
        const name = button.getAttribute("aria-label")?.replace(/^Show detail /, "");
        const svg = button.querySelector("svg");
        if (!name || !svg) return null;
        return {
          name,
          viewBox: svg.getAttribute("viewBox") || "0 0 24 24",
          width: 24,
          height: 24,
          svg: normalizeSvg(svg),
        };
      })
      .filter(Boolean);

    const iconNames = iconVectors.map((icon) => icon.name);

    const buttons = [...main.querySelectorAll("button")].map((button) => ({
      text: normalizeText(button.textContent),
      ariaLabel: button.getAttribute("aria-label"),
      type: button.getAttribute("type") || "submit",
      disabled: button.hasAttribute("disabled"),
      className: button.getAttribute("class") || "",
      dataAttributes: Object.fromEntries(
        [...button.attributes]
          .filter((attribute) => attribute.name.startsWith("data-"))
          .map((attribute) => [attribute.name, attribute.value]),
      ),
    }));

    const figures = [...main.querySelectorAll("figure")].map((figure) => ({
      caption: normalizeText(figure.querySelector("figcaption")?.textContent),
      imageSources: [...figure.querySelectorAll("img[src]")]
        .map((image) => absoluteAssetUrl(image.getAttribute("src"), url))
        .filter(Boolean),
    }));

    const customPropertyReferences = [
      ...new Set([...html.matchAll(/var\((--[A-Za-z0-9_-]+)/g)].map((match) => match[1])),
    ].sort();

    return {
      url,
      path: new URL(url).pathname,
      status,
      title: normalizeText(doc.title),
      description: doc.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      headings: [...main.querySelectorAll("h1,h2,h3,h4,h5,h6")]
        .map((heading) => ({
          level: Number(heading.tagName.slice(1)),
          id: heading.id || null,
          text: normalizeText(heading.textContent),
        }))
        .filter((heading) => heading.text),
      blocks,
      tables,
      code: [...new Set(code)],
      links,
      images,
      sources: [...new Set(sources)],
      posters: [...new Set(posters)],
      inlineStyleAssets: [...new Set(inlineStyleAssets)],
      serializedAssets,
      iconNames,
      iconVectors,
      buttons,
      figures,
      customPropertyReferences,
    };
  };

  const sitemapUrls = [];
  try {
    const sitemap = await fetch(`${ORIGIN}/sitemap.xml`, { credentials: "omit" }).then((response) =>
      response.text(),
    );
    const sitemapDocument = new DOMParser().parseFromString(sitemap, "application/xml");
    sitemapUrls.push(
      ...[...sitemapDocument.querySelectorAll("loc")]
        .map((location) => normalizeUrl(location.textContent))
        .filter((url) => url && isCrawlable(url)),
    );
  } catch {
    // Link discovery below remains a complete fallback for sites without a sitemap.
  }

  const queue = [...new Set([...seedPaths.map((path) => normalizeUrl(path)), ...sitemapUrls])].filter(
    Boolean,
  );
  const queued = new Set(queue);
  const pages = [];
  const failures = [];
  const cssUrls = new Set();

  while (queue.length && pages.length < MAX_PAGES) {
    const batch = queue.splice(0, CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          const response = await fetch(url, { credentials: "omit" });
          const html = await response.text();
          return { page: extractPage(html, url, response.status), html };
        } catch (error) {
          return { error: String(error), url };
        }
      }),
    );

    for (const result of results) {
      if (result.error) {
        failures.push({ url: result.url, error: result.error });
        continue;
      }

      pages.push(result.page);
      const parsed = new DOMParser().parseFromString(result.html, "text/html");
      [...parsed.querySelectorAll('link[rel="stylesheet"][href]')].forEach((link) => {
        const href = absoluteAssetUrl(link.getAttribute("href"), result.page.url);
        if (href) cssUrls.add(href);
      });

      for (const link of result.page.links) {
        const href = normalizeUrl(link.href);
        if (!href || !isCrawlable(href) || queued.has(href)) continue;
        queued.add(href);
        queue.push(href);
      }
    }
  }

  const cssCustomProperties = {};
  const cssAssets = new Set();
  for (const cssUrl of cssUrls) {
    try {
      const css = await fetch(cssUrl, { credentials: "omit" }).then((response) => response.text());
      extractCssUrls(css, cssUrl).forEach((assetUrl) => cssAssets.add(assetUrl));
      for (const match of css.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+)/g)) {
        const [, name, rawValue] = match;
        const value = normalizeText(rawValue);
        if (!cssCustomProperties[name]) cssCustomProperties[name] = [];
        if (!cssCustomProperties[name].includes(value)) cssCustomProperties[name].push(value);
      }
    } catch (error) {
      failures.push({ url: cssUrl, error: `Stylesheet: ${String(error)}` });
    }
  }

  const captureTheme = async (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const styles = getComputedStyle(document.documentElement);
    const tokens = {};
    for (const name of styles) {
      if (/^--(?:atomic|semantic|font|layout|gnb|lnb)-/.test(name)) {
        tokens[name] = styles.getPropertyValue(name).trim();
      }
    }
    const assets = [
      ...new Set(
        [...document.querySelectorAll("*")].flatMap((element) =>
          extractCssUrls(getComputedStyle(element).backgroundImage, location.href),
        ),
      ),
    ];
    return { tokens, assets };
  };

  const previousTheme = document.documentElement.getAttribute("data-theme") || "light";
  const themeCaptures = {
    light: await captureTheme("light"),
    dark: await captureTheme("dark"),
  };
  const themes = {
    light: themeCaptures.light.tokens,
    dark: themeCaptures.dark.tokens,
  };
  const themeAssets = [...new Set([...themeCaptures.light.assets, ...themeCaptures.dark.assets])];
  document.documentElement.setAttribute("data-theme", previousTheme);

  pages.sort((a, b) => a.path.localeCompare(b.path));
  const assets = [...new Set([
    ...pages.flatMap((page) => [
      ...page.images.map((image) => image.src),
      ...page.sources,
      ...page.posters,
      ...page.inlineStyleAssets,
      ...page.serializedAssets,
    ]),
    ...cssAssets,
    ...themeAssets,
  ])]
    .filter(Boolean)
    .sort();
  const icons = [...new Set(pages.flatMap((page) => page.iconNames))].sort();
  const iconVectors = [...new Map(
    pages.flatMap((page) => page.iconVectors).map((icon) => [icon.name, icon]),
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

return JSON.stringify(
    {
      metadata: {
        source: ORIGIN,
        collectedAt: new Date().toISOString(),
        pageCount: pages.length,
        assetCount: assets.length,
        iconCount: icons.length,
        iconVectorCount: iconVectors.length,
        themeAssetCount: themeAssets.length,
        cssStylesheets: [...cssUrls].sort(),
        sitemapUrlCount: sitemapUrls.length,
        maxPagesReached: pages.length >= MAX_PAGES,
      },
      themes,
      cssCustomProperties,
      pages,
      assets,
      icons,
      iconVectors,
      failures,
    },
    null,
    2,
);
