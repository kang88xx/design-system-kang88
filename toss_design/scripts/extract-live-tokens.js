window.__tossTokenExtraction = (async () => {
  const urls = [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean);
  const styles = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        return response.ok ? await response.text() : "";
      } catch {
        return "";
      }
    }),
  );

  const css = styles.join("\n");
  const count = (pattern, normalize = (value) => value) => {
    const values = css.match(pattern) ?? [];
    const counts = new Map();
    for (const rawValue of values) {
      const value = normalize(rawValue);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([value, uses]) => ({ value, uses }));
  };

  return {
    stylesheetCount: urls.length,
    bytes: css.length,
    colors: count(/#[0-9a-fA-F]{3,8}\b/g, (value) => value.toLowerCase()),
    fontSizes: count(/font-size:\s*\d+(?:\.\d+)?(?:px|rem)/g, (value) => value.replace(/font-size:\s*/, "")),
    radii: count(/border-radius:\s*[^;}]+/g, (value) => value.replace(/border-radius:\s*/, "").trim()),
    gaps: count(/(?:gap|padding|margin):\s*[^;}]+/g, (value) => value.replace(/^(?:gap|padding|margin):\s*/, "").trim()),
    mediaWidths: count(/(?:min|max)-width:\s*\d+(?:\.\d+)?px/g),
    fontFamilies: count(/font-family:\s*[^;}]+/g, (value) => value.replace(/font-family:\s*/, "").trim()),
  };
})()
