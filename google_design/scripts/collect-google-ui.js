(() => {
  const root = document.documentElement;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const serviceByHost = {
    "mail.google.com": "gmail",
    "calendar.google.com": "calendar",
    "drive.google.com": "drive",
    "meet.google.com": "meet",
    "www.google.com": "finance",
  };
  const service = serviceByHost[location.hostname] || location.hostname;
  const isProtectedGoogleHost = Object.prototype.hasOwnProperty.call(serviceByHost, location.hostname);
  const isRedactedCapture = root.dataset.captureRedacted === "true" && root.dataset.captureAuthenticated === "true";

  if (isProtectedGoogleHost && !isRedactedCapture) {
    throw new Error(`Refusing to collect unredacted Google UI capture for ${location.hostname}. Run scripts/redact-google-ui.js first.`);
  }

  const isVisible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0
    );
  };

  const px = (value) => {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
  };

  const box = (element) => {
    if (!element || !isVisible(element)) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  };

  const increment = (map, key) => {
    if (!key || key === "none" || key === "normal" || key === "0px" || key === "transparent" || key === "rgba(0, 0, 0, 0)") return;
    map.set(key, (map.get(key) || 0) + 1);
  };

  const safeCssValue = (value) => {
    if (!value || value === "none" || value === "normal" || value === "auto") return null;
    if (/url\(|https?:|\/\/|data:|javascript:|["']|<|>/i.test(value)) return null;
    return value;
  };

  const safeGradient = (value) => {
    const safe = safeCssValue(value);
    if (!safe || !/(?:linear|radial|conic)-gradient\(/i.test(safe)) return null;
    return safe;
  };

  const safeClipPath = (value) => {
    const safe = safeCssValue(value);
    if (!safe || !/^(?:inset|circle|ellipse|polygon|path)\(/i.test(safe)) return null;
    return safe;
  };

  const ranked = (map, limit = 40) =>
    Array.from(map.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));

  const colors = new Map();
  const backgrounds = new Map();
  const borders = new Map();
  const radii = new Map();
  const shadows = new Map();
  const fontFamilies = new Map();
  const fontSizes = new Map();
  const fontWeights = new Map();
  const lineHeights = new Map();
  const letterSpacing = new Map();
  const spacing = new Map();
  const transitionDurations = new Map();
  const transitionDelays = new Map();
  const transitionTimings = new Map();
  const transitionProperties = new Map();
  const animationDurations = new Map();
  const animationTimings = new Map();
  const animationIterations = new Map();
  const gradients = new Map();
  const borderWidths = new Map();
  const borderStyles = new Map();
  const outlineWidths = new Map();
  const outlineStyles = new Map();
  const opacities = new Map();
  const transforms = new Map();
  const clipPaths = new Map();
  const aspectRatios = new Map();

  const collectComputedStyle = (style) => {
    increment(colors, style.color);
    increment(backgrounds, style.backgroundColor);
    increment(borders, style.borderTopColor);
    increment(radii, style.borderRadius);
    increment(shadows, style.boxShadow);
    increment(fontFamilies, style.fontFamily);
    increment(fontSizes, style.fontSize);
    increment(fontWeights, style.fontWeight);
    increment(lineHeights, style.lineHeight);
    increment(letterSpacing, style.letterSpacing);
    [
      style.paddingTop,
      style.paddingRight,
      style.paddingBottom,
      style.paddingLeft,
      style.marginTop,
      style.marginRight,
      style.marginBottom,
      style.marginLeft,
      style.gap,
      style.rowGap,
      style.columnGap,
    ].forEach((value) => increment(spacing, value));
    [
      style.transitionDuration,
      style.webkitTransitionDuration,
    ].forEach((value) => increment(transitionDurations, safeCssValue(value)));
    [
      style.transitionDelay,
      style.webkitTransitionDelay,
    ].forEach((value) => increment(transitionDelays, safeCssValue(value)));
    [
      style.transitionTimingFunction,
      style.webkitTransitionTimingFunction,
    ].forEach((value) => increment(transitionTimings, safeCssValue(value)));
    [
      style.transitionProperty,
      style.webkitTransitionProperty,
    ].forEach((value) => increment(transitionProperties, safeCssValue(value)));
    increment(animationDurations, safeCssValue(style.animationDuration));
    increment(animationTimings, safeCssValue(style.animationTimingFunction));
    increment(animationIterations, safeCssValue(style.animationIterationCount));
    increment(gradients, safeGradient(style.backgroundImage));
    [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
    ].forEach((value) => increment(borderWidths, value));
    [
      style.borderTopStyle,
      style.borderRightStyle,
      style.borderBottomStyle,
      style.borderLeftStyle,
    ].forEach((value) => increment(borderStyles, value));
    increment(outlineWidths, style.outlineWidth);
    increment(outlineStyles, style.outlineStyle);
    increment(opacities, safeCssValue(style.opacity));
    increment(transforms, safeCssValue(style.transform));
    increment(clipPaths, safeClipPath(style.clipPath));
    increment(aspectRatios, safeCssValue(style.aspectRatio));
  };

  const visibleElements = Array.from(document.body.querySelectorAll("*")).filter(isVisible);
  visibleElements.slice(0, 6000).forEach((element) => {
    collectComputedStyle(getComputedStyle(element));
    ["::before", "::after"].forEach((pseudo) => {
      const style = getComputedStyle(element, pseudo);
      if (style?.display && style.display !== "none" && Number(style.opacity || 1) > 0) collectComputedStyle(style);
    });
  });

  const summarizeElements = (selector, limit = 24) => {
    const groups = new Map();
    Array.from(document.querySelectorAll(selector))
      .filter(isVisible)
      .slice(0, 1000)
      .forEach((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const role = element.getAttribute("role") || element.tagName.toLowerCase();
        const state = {
          disabled: element.matches(":disabled") || element.getAttribute("aria-disabled") === "true",
          expanded: element.getAttribute("aria-expanded") || null,
          selected: element.getAttribute("aria-selected") || null,
          pressed: element.getAttribute("aria-pressed") || null,
          checked: element.getAttribute("aria-checked") || null,
        };
        const key = JSON.stringify({
          role,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          radius: style.borderRadius,
          background: style.backgroundColor,
          color: style.color,
          border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          state,
        });
        const current = groups.get(key) || { ...JSON.parse(key), count: 0 };
        current.count += 1;
        groups.set(key, current);
      });
    return Array.from(groups.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, limit);
  };

  const allowedAssetUrl = (value) => {
    if (!value || value === "none" || value.startsWith("data:")) return null;
    const match = value.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match && /gradient\(/i.test(value)) return null;
    const candidate = match ? match[1] : value;
    try {
      const url = new URL(candidate, location.href);
      const hostAllowed =
        url.hostname === location.hostname ||
        url.hostname.endsWith(".gstatic.com") ||
        url.hostname === "fonts.gstatic.com";
      if (!hostAllowed || url.hostname.endsWith("googleusercontent.com")) return null;
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      return null;
    }
  };

  const assetUrls = new Set();
  visibleElements.slice(0, 6000).forEach((element) => {
    const style = getComputedStyle(element);
    [element.getAttribute("src"), style.backgroundImage, style.maskImage].forEach((value) => {
      const safe = allowedAssetUrl(value);
      if (safe) assetUrls.add(safe);
    });
  });

  const regionSelectors = {
    header: "header, [role=banner]",
    navigation: "nav, [role=navigation]",
    main: "main, [role=main]",
    complementary: "aside, [role=complementary]",
    search: "[role=search]",
  };
  const regions = Object.fromEntries(
    Object.entries(regionSelectors).map(([name, selector]) => [
      name,
      Array.from(document.querySelectorAll(selector)).map(box).filter(Boolean).slice(0, 6),
    ]),
  );

  const result = {
    schemaVersion: "1.0.0",
    service,
    capturedAt: new Date().toISOString(),
    source: {
      host: location.hostname,
      path: location.pathname,
      route: location.hash || null,
      authenticated: root.dataset.captureRedacted === "true" && root.dataset.captureAuthenticated === "true",
      collectionGate: isProtectedGoogleHost ? "requires-redacted-authenticated-marker" : "public-fixture-or-non-google-host",
    },
    privacy: {
      textContentCollected: false,
      personalContentExcluded: true,
      assetHostAllowlist: [location.hostname, "*.gstatic.com", "fonts.gstatic.com"],
    },
    viewport,
    root: {
      colorScheme: getComputedStyle(root).colorScheme,
      fontSize: getComputedStyle(root).fontSize,
      background: getComputedStyle(document.body).backgroundColor,
    },
    layout: {
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      regions,
    },
    foundations: {
      colors: ranked(colors),
      backgrounds: ranked(backgrounds),
      borders: ranked(borders),
      radii: ranked(radii, 24),
      shadows: ranked(shadows, 24),
      typography: {
        families: ranked(fontFamilies, 16),
        sizes: ranked(fontSizes, 24),
        weights: ranked(fontWeights, 16),
        lineHeights: ranked(lineHeights, 24),
        letterSpacing: ranked(letterSpacing, 24),
      },
      spacing: ranked(spacing, 40),
      motion: {
        transitionDurations: ranked(transitionDurations, 24),
        transitionDelays: ranked(transitionDelays, 24),
        transitionTimingFunctions: ranked(transitionTimings, 24),
        transitionProperties: ranked(transitionProperties, 24),
        animationDurations: ranked(animationDurations, 24),
        animationTimingFunctions: ranked(animationTimings, 24),
        animationIterationCounts: ranked(animationIterations, 16),
      },
      gradients: ranked(gradients, 24),
      shape: {
        borderWidths: ranked(borderWidths, 24),
        borderStyles: ranked(borderStyles, 16),
        outlineWidths: ranked(outlineWidths, 24),
        outlineStyles: ranked(outlineStyles, 16),
        clipPaths: ranked(clipPaths, 24),
        aspectRatios: ranked(aspectRatios, 24),
      },
      effects: {
        opacity: ranked(opacities, 24),
        transforms: ranked(transforms, 24),
      },
    },
    components: {
      buttons: summarizeElements('button, [role="button"]'),
      links: summarizeElements('a[href], [role="link"]'),
      inputs: summarizeElements('input, textarea, select, [role="textbox"], [role="combobox"]'),
      tabs: summarizeElements('[role="tab"]'),
      checkboxes: summarizeElements('input[type="checkbox"], [role="checkbox"]'),
      menus: summarizeElements('[role="menu"], [role="menuitem"]'),
      dialogs: summarizeElements('[role="dialog"]'),
      listItems: summarizeElements('[role="listitem"], [role="row"]'),
      chips: summarizeElements('[role="option"], [role="gridcell"]'),
    },
    interactionStates: {
      focusable: visibleElements.filter((element) => element.matches('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])')).length,
      disabled: visibleElements.filter((element) => element.matches(":disabled") || element.getAttribute("aria-disabled") === "true").length,
      expanded: visibleElements.filter((element) => element.getAttribute("aria-expanded") === "true").length,
      selected: visibleElements.filter((element) => element.getAttribute("aria-selected") === "true").length,
      checked: visibleElements.filter((element) => element.getAttribute("aria-checked") === "true" || element.matches(":checked")).length,
    },
    assetPolicy: {
      observedReferencesOnly: true,
      redistributableAssetsRequireCuratedLicenseReview: true,
    },
    observedReferenceAssets: Array.from(assetUrls).sort().slice(0, 500),
    redistributableAssets: [],
    metrics: {
      visibleElementCount: visibleElements.length,
      svgCount: document.querySelectorAll("svg").length,
      imageCount: document.images.length,
      inlineStyleSheetCount: Array.from(document.styleSheets).filter((sheet) => !sheet.href).length,
      externalStyleSheetCount: Array.from(document.styleSheets).filter((sheet) => sheet.href).length,
    },
  };

  return JSON.stringify(result, null, 2);
})();
