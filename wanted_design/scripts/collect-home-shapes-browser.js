await Promise.resolve();

const ORIGIN = "https://montage.wanted.co.kr";

const absoluteUrl = (value) => new URL(value, ORIGIN).href;
const uniqueImages = (selector, pathFragment, namePrefix) => {
  const seen = new Set();
  return [...document.querySelectorAll(selector)]
    .map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.alt || "",
      width: image.naturalWidth || Number(image.getAttribute("width")) || null,
      height: image.naturalHeight || Number(image.getAttribute("height")) || null,
    }))
    .filter((image) => image.src.includes(pathFragment) && !seen.has(image.src) && seen.add(image.src))
    .map((image, index) => ({
      id: `${namePrefix}-${String(index + 1).padStart(2, "0")}`,
      name: `${namePrefix === "shape" ? "Shape" : "Behind"} ${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      sourceUrl: absoluteUrl(image.src),
      alt: image.alt,
      dimensions: { width: image.width, height: image.height },
    }));
};

const marquee = uniqueImages("img", "/home/marquee/", "shape");
const behind = uniqueImages("img", "/home/behind/Image", "behind");
const resourceRegion = document.querySelector('[aria-label="Resources Section"]');
const resourceLinks = resourceRegion ? [...resourceRegion.querySelectorAll("a")].slice(0, 3) : [];
const resources = resourceLinks.map((link, index) => {
  const text = (link.textContent || "").replace(/\s+/g, " ").trim();
  const updatedMatch = text.match(/Last Updated\.\s*([0-9.]+)/i);
  const title = text.replace(/Last Updated\..*$/i, "").trim();
  const svg = link.querySelector("svg")?.cloneNode(true);
  if (svg) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "250");
    svg.setAttribute("height", "250");
    svg.removeAttribute("class");
    svg.removeAttribute("aria-hidden");
  }
  return {
    id: `resource-${index + 1}`,
    name: `Resource ${String(index + 1).padStart(2, "0")}`,
    order: index + 1,
    title,
    lastUpdated: updatedMatch?.[1] || null,
    href: link.href,
    jsonUrl: `${ORIGIN}/home/resources/${index + 1}.json`,
    svg: svg?.outerHTML || null,
  };
});

return JSON.stringify(
  {
    source: ORIGIN,
    collectedAt: new Date().toISOString(),
    marquee,
    behind,
    resources,
  },
  null,
  2,
);
