import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("./collect-google-ui.js", import.meta.url), "utf8");
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

class Element {
  constructor(tagName, attrs = {}, style = {}, rect = {}, pseudo = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.style = style;
    this.rect = { x: 0, y: 0, width: 100, height: 32, ...rect };
    this.pseudo = pseudo;
    this.children = [];
  }

  append(...children) {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  getBoundingClientRect() {
    return this.rect;
  }

  matches(selector) {
    const selectors = selector.split(",").map((part) => part.trim());
    return selectors.some((part) => {
      if (part === "*") return true;
      if (part === ":disabled") return this.hasAttribute("disabled");
      if (part === ":checked") return this.hasAttribute("checked");
      if (part === "button") return this.tagName === "BUTTON";
      if (part === "input") return this.tagName === "INPUT";
      if (part === "textarea") return this.tagName === "TEXTAREA";
      if (part === "select") return this.tagName === "SELECT";
      if (part === "a[href]") return this.tagName === "A" && this.hasAttribute("href");
      const role = part.match(/^\[role="?([^"\]]+)"?\]$/);
      if (role) return this.getAttribute("role") === role[1];
      const tabindex = part.match(/^\[tabindex\]:not\(\[tabindex="-1"\]\)$/);
      if (tabindex) return this.hasAttribute("tabindex") && this.getAttribute("tabindex") !== "-1";
      const inputType = part.match(/^input\[type="([^"]+)"\]$/);
      if (inputType) return this.tagName === "INPUT" && this.getAttribute("type") === inputType[1];
      return false;
    });
  }
}

const defaultStyle = {
  display: "block",
  visibility: "visible",
  opacity: "1",
  color: "rgb(32, 33, 36)",
  backgroundColor: "rgb(255, 255, 255)",
  backgroundImage: "none",
  maskImage: "none",
  borderTopColor: "rgb(218, 220, 224)",
  borderRadius: "8px",
  boxShadow: "none",
  fontFamily: "Roboto, Arial, sans-serif",
  fontSize: "14px",
  fontWeight: "400",
  lineHeight: "20px",
  letterSpacing: "normal",
  paddingTop: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  paddingLeft: "0px",
  marginTop: "0px",
  marginRight: "0px",
  marginBottom: "0px",
  marginLeft: "0px",
  gap: "normal",
  rowGap: "normal",
  columnGap: "normal",
  transitionDuration: "0s",
  webkitTransitionDuration: "",
  transitionDelay: "0s",
  webkitTransitionDelay: "",
  transitionTimingFunction: "ease",
  webkitTransitionTimingFunction: "",
  transitionProperty: "opacity, transform",
  webkitTransitionProperty: "",
  animationDuration: "0s",
  animationTimingFunction: "ease",
  animationIterationCount: "1",
  borderTopWidth: "1px",
  borderRightWidth: "1px",
  borderBottomWidth: "1px",
  borderLeftWidth: "1px",
  borderTopStyle: "solid",
  borderRightStyle: "solid",
  borderBottomStyle: "solid",
  borderLeftStyle: "solid",
  outlineWidth: "0px",
  outlineStyle: "none",
  transform: "none",
  clipPath: "none",
  aspectRatio: "auto",
  colorScheme: "light",
};

const allElements = [];
const makeElement = (...args) => {
  const element = new Element(...args);
  allElements.push(element);
  return element;
};

const root = makeElement(
  "html",
  {},
  {
    ...defaultStyle,
    fontSize: "16px",
  },
);
root.dataset = {};
const body = makeElement("body", {}, { ...defaultStyle, backgroundColor: "rgb(248, 250, 253)" }, { width: 960, height: 800 });
const card = makeElement(
  "section",
  { role: "main" },
  {
    ...defaultStyle,
    backgroundImage: "linear-gradient(135deg, rgb(66, 133, 244) 0%, rgb(52, 168, 83) 100%)",
    transitionDuration: "150ms",
    transitionDelay: "50ms",
    transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    transitionProperty: "opacity, transform",
    animationDuration: "2s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    outlineWidth: "2px",
    outlineStyle: "solid",
    transform: "matrix(1, 0, 0, 1, 0, 0)",
    clipPath: "inset(0px round 12px)",
    aspectRatio: "16 / 9",
  },
  { width: 320, height: 180 },
  {
    "::before": {
      ...defaultStyle,
      display: "block",
      opacity: "1",
      backgroundImage: "radial-gradient(circle, rgb(251, 188, 4) 0%, rgb(234, 67, 53) 100%)",
      transitionDuration: "200ms",
      content: "\"Sensitive fixture text\"",
    },
  },
);
const button = makeElement("button", { "aria-pressed": "false" }, { ...defaultStyle, backgroundImage: "url(https://private.example/account.png)" });
const img = makeElement("img", { src: "https://ssl.gstatic.com/ui/v1/icons/mail/gm3/1x/star.png" }, defaultStyle, { width: 24, height: 24 });
body.append(card, button, img);
root.append(body);

const document = {
  documentElement: root,
  body,
  images: [img],
  styleSheets: [{ href: null }, { href: "https://fonts.googleapis.com/css?family=Roboto" }],
  querySelectorAll(selector) {
    if (selector === "*") return allElements;
    return allElements.filter((element) => element.matches(selector));
  },
};
body.querySelectorAll = document.querySelectorAll.bind(document);

const context = vm.createContext({
  document,
  window: { innerWidth: 960, innerHeight: 800 },
  location: {
    hostname: "fixture.test",
    pathname: "/screen",
    hash: "#state",
    href: "https://fixture.test/screen#state",
  },
  URL,
  getComputedStyle(element, pseudo) {
    return {
      ...defaultStyle,
      ...(pseudo ? element.pseudo[pseudo] || { display: "none", opacity: "0" } : element.style),
    };
  },
});

const result = JSON.parse(new vm.Script(source).runInContext(context));
const serialized = JSON.stringify(result);

assert(result.source.authenticated === false, "public fixture remains collectible without authenticated marker");
assert(result.source.collectionGate === "public-fixture-or-non-google-host", "public fixture reports non-Google collection gate");
assert(result.privacy.textContentCollected === false, "collector still declares text-free capture");
assert(result.foundations.motion.transitionDurations.some((item) => item.value === "150ms"), "transition duration is collected");
assert(result.foundations.motion.transitionDelays.some((item) => item.value === "50ms"), "transition delay is collected");
assert(result.foundations.motion.transitionTimingFunctions.some((item) => item.value === "cubic-bezier(0.2, 0, 0, 1)"), "transition timing is collected");
assert(result.foundations.motion.transitionProperties.some((item) => item.value === "opacity, transform"), "transition property is collected");
assert(result.foundations.motion.animationDurations.some((item) => item.value === "2s"), "animation duration is collected");
assert(result.foundations.motion.animationTimingFunctions.some((item) => item.value === "linear"), "animation timing is collected");
assert(result.foundations.motion.animationIterationCounts.some((item) => item.value === "infinite"), "animation iteration is collected");
assert(result.foundations.gradients.some((item) => item.value.startsWith("linear-gradient(")), "pure element gradient is collected");
assert(result.foundations.gradients.some((item) => item.value.startsWith("radial-gradient(")), "pure pseudo gradient is collected without exporting content");
assert(result.foundations.shape.borderWidths.some((item) => item.value === "1px"), "border widths are collected");
assert(result.foundations.shape.borderStyles.some((item) => item.value === "solid"), "border styles are collected");
assert(result.foundations.shape.outlineWidths.some((item) => item.value === "2px"), "outline widths are collected");
assert(result.foundations.shape.outlineStyles.some((item) => item.value === "solid"), "outline styles are collected");
assert(result.foundations.shape.clipPaths.some((item) => item.value === "inset(0px round 12px)"), "clip-path geometry is collected");
assert(result.foundations.shape.aspectRatios.some((item) => item.value === "16 / 9"), "aspect ratios are collected");
assert(result.foundations.effects.opacity.some((item) => item.value === "1"), "opacity is collected");
assert(result.foundations.effects.transforms.some((item) => item.value === "matrix(1, 0, 0, 1, 0, 0)"), "transforms are collected");
assert(result.foundations.gradients.every((item) => !/url\(|https?:|private\.example|Sensitive fixture text/i.test(item.value)), "gradient samples do not leak URL or text content");
assert(result.observedReferenceAssets.every((item) => !/gradient|private\.example|account\.png/i.test(item)), "observed assets exclude gradients and disallowed URLs");
assert(!/Sensitive fixture text|private\.example|account\.png/.test(serialized), "collector JSON contains no pseudo text or disallowed source URL");
assert(result.foundations.gradients.length <= 24, "gradient samples are capped");
assert(result.observedReferenceAssets.length <= 500, "asset samples are capped");

const blockedGoogleContext = vm.createContext({
  ...context,
  location: {
    hostname: "mail.google.com",
    pathname: "/mail/u/0/",
    hash: "",
    href: "https://mail.google.com/mail/u/0/",
  },
});
let refused = false;
try {
  new vm.Script(source).runInContext(blockedGoogleContext);
} catch (error) {
  refused = /Refusing to collect unredacted Google UI capture/.test(error.message);
}
assert(refused, "collector refuses protected Google hosts without redaction markers");

if (failures.length) {
  console.error(`Collector fixture failed: ${failures.length} assertions`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Collector fixture passed");
