import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { designLibrary, additionalInteractions } from "./design-library.mjs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const CURATED_DIR = path.join(ROOT, "data", "curated");

const serviceDefinitions = [
  {
    id: "gmail",
    name: "Gmail",
    url: "https://mail.google.com/",
    page: "Inbox",
    evidence: { type: "private-redacted-capture", ids: ["gmail-inbox", "gmail-row-hover"] },
    states: ["default", "row-hover", "selected-tab", "unread", "read", "attachment"],
  },
  {
    id: "calendar",
    name: "Google Calendar",
    url: "https://calendar.google.com/calendar/u/0/r",
    page: "Week view",
    evidence: { type: "private-redacted-capture", ids: ["calendar-week", "calendar-onboarding"] },
    states: ["week-grid", "today", "time-indicator", "onboarding-dialog"],
  },
  {
    id: "drive",
    name: "Google Drive",
    url: "https://drive.google.com/drive/u/0/home",
    page: "Home",
    evidence: { type: "private-redacted-capture", ids: ["drive-home"] },
    states: ["home", "selected-navigation", "filter-chip", "empty-recommendation"],
  },
  {
    id: "meet",
    name: "Google Meet",
    url: "https://meet.google.com/home?hs=197&authuser=0",
    page: "Home",
    evidence: { type: "private-redacted-capture", ids: ["meet-home"] },
    states: ["empty-schedule", "disabled-join", "new-meeting", "info-banner"],
  },
  {
    id: "finance",
    name: "Google Finance",
    url: "https://www.google.com/finance/beta",
    page: "Market overview",
    evidence: { type: "private-redacted-capture", ids: ["finance-overview"] },
    states: ["market-card", "positive", "negative", "selected-region", "research-panel"],
  },
];

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

const rawCaptureFiles = ["gmail", "calendar", "calendar-onboarding", "drive", "meet", "finance"];
const allRawCaptures = await Promise.all(rawCaptureFiles.map((name) => readJson(path.join(RAW_DIR, `${name}.json`))));
const rawByService = Object.fromEntries(
  serviceDefinitions.map(({ id }) => [id, allRawCaptures.find((capture) => capture.service === id)]),
);
const exportedAssetManifest = await readJson(path.join(ROOT, "references-private", "platform-assets", "manifest.json"));
const observedPlatformAssetSummary = exportedAssetManifest
  ? {
      available: true,
      generatedAt: exportedAssetManifest.generatedAt,
      total: exportedAssetManifest.summary.downloaded,
      failed: exportedAssetManifest.summary.failed,
      byCategory: exportedAssetManifest.summary.byCategory,
      byService: exportedAssetManifest.summary.byService,
      formats: exportedAssetManifest.summary.formats,
      exactSourceCount: exportedAssetManifest.assets.filter((asset) => asset.fidelity === "exact-observed-source").length,
      vectorAssetCount: exportedAssetManifest.assets.filter((asset) => asset.vector).length,
      gradientAssetCount: exportedAssetManifest.assets.filter((asset) => asset.vector?.gradients?.length).length,
      classification: exportedAssetManifest.classification,
    }
  : { available: false, total: 0, failed: 0, byCategory: {}, byService: {}, formats: {}, exactSourceCount: 0, vectorAssetCount: 0, gradientAssetCount: 0, classification: "unavailable" };
const observedAsset = (fragment) => exportedAssetManifest?.assets.find((asset) => asset.sourceUrl.includes(fragment)) || null;
const officialMeetLogoAsset = observedAsset("logo_meet_2026");
const officialMeetIllustrationAsset = observedAsset("agenda_empty_state");
const officialMeetShieldAsset = observedAsset("security_shield");

const rgbToHex = (value) => {
  const match = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return value;
  return `#${match
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
};

const aggregateRanked = (selector, limit = 40) => {
  const totals = new Map();
  allRawCaptures.forEach((raw) => {
    selector(raw).forEach(({ value, count }) => {
      if (value === "transparent" || /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(value)) return;
      const normalized = value.startsWith("rgb(") ? rgbToHex(value) : value;
      totals.set(normalized, (totals.get(normalized) || 0) + count);
    });
  });
  return Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
};

const tokens = {
  metadata: {
    name: "Google Product Observation Tokens",
    version: "1.0.0",
    source: "Observed from authenticated product shells and reconciled with Material 3 roles.",
    redistribution: "Original Google product captures are reference-only. Token values are independently documented observations.",
  },
  color: {
    light: {
      primary: "#0b57d0",
      onPrimary: "#ffffff",
      primaryContainer: "#d3e3fd",
      onPrimaryContainer: "#041e49",
      secondary: "#00639b",
      onSecondary: "#ffffff",
      secondaryContainer: "#c2e7ff",
      onSecondaryContainer: "#001d35",
      tertiary: "#0b8043",
      onTertiary: "#ffffff",
      tertiaryContainer: "#c4eed0",
      onTertiaryContainer: "#072711",
      surface: "#ffffff",
      surfaceDim: "#f8fafd",
      surfaceContainerLow: "#f2f6fc",
      surfaceContainer: "#e9eef6",
      surfaceContainerHigh: "#e1e3e1",
      onSurface: "#1f1f1f",
      onSurfaceVariant: "#444746",
      outline: "#747775",
      outlineVariant: "#c4c7c5",
      error: "#b3261e",
      onError: "#ffffff",
      errorContainer: "#f9dedc",
      positive: "#0b8043",
      negative: "#c0151d",
      info: "#3364f0",
      scrim: "rgba(0,0,0,.32)",
    },
    dark: {
      primary: "#a8c7fa",
      onPrimary: "#062e6f",
      primaryContainer: "#0842a0",
      onPrimaryContainer: "#d3e3fd",
      secondary: "#7fcfff",
      onSecondary: "#00344f",
      secondaryContainer: "#004a6f",
      onSecondaryContainer: "#c2e7ff",
      tertiary: "#a8dab5",
      onTertiary: "#0f5223",
      tertiaryContainer: "#146c2e",
      onTertiaryContainer: "#c4eed0",
      surface: "#1f1f1f",
      surfaceDim: "#131314",
      surfaceContainerLow: "#1e1f20",
      surfaceContainer: "#282a2c",
      surfaceContainerHigh: "#303134",
      onSurface: "#e3e3e3",
      onSurfaceVariant: "#c4c7c5",
      outline: "#8e918f",
      outlineVariant: "#444746",
      error: "#f2b8b5",
      onError: "#601410",
      errorContainer: "#8c1d18",
      positive: "#a8dab5",
      negative: "#ffb4ab",
      info: "#adc6ff",
      scrim: "rgba(0,0,0,.64)",
    },
  },
  typography: {
    family: {
      brand: "'Google Sans', 'Google Sans Text', Roboto, Arial, sans-serif",
      body: "'Google Sans Text', Roboto, Arial, sans-serif",
      fallback: "Roboto, Arial, sans-serif",
      data: "'Google Sans Text', Roboto, Arial, sans-serif",
      emoji: "'Noto Color Emoji', sans-serif",
      icon: "'Material Symbols Rounded'",
    },
    scale: {
      displayLarge: { size: "36px", lineHeight: "44px", weight: 400, tracking: "0" },
      headlineLarge: { size: "32px", lineHeight: "40px", weight: 400, tracking: "0" },
      headlineMedium: { size: "24px", lineHeight: "32px", weight: 400, tracking: "0" },
      titleLarge: { size: "22px", lineHeight: "28px", weight: 400, tracking: "0" },
      titleMedium: { size: "16px", lineHeight: "24px", weight: 500, tracking: "0.15px" },
      bodyLarge: { size: "16px", lineHeight: "24px", weight: 400, tracking: "0.15px" },
      bodyMedium: { size: "14px", lineHeight: "20px", weight: 400, tracking: "0.25px" },
      bodySmall: { size: "12px", lineHeight: "16px", weight: 400, tracking: "0.4px" },
      labelLarge: { size: "14px", lineHeight: "20px", weight: 500, tracking: "0.1px" },
      labelMedium: { size: "12px", lineHeight: "16px", weight: 500, tracking: "0.5px" },
      labelSmall: { size: "11px", lineHeight: "16px", weight: 500, tracking: "0.5px" },
    },
  },
  spacing: {
    base: 4,
    scale: { none: 0, "2xs": 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, "3xl": 32, "4xl": 40, "5xl": 48, "6xl": 64 },
  },
  radius: { none: "0", xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "28px", full: "9999px" },
  elevation: {
    level0: "none",
    level1: "0 1px 2px rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)",
    level2: "0 1px 3px rgba(60,64,67,.30), 0 4px 8px 3px rgba(60,64,67,.15)",
    level3: "0 4px 8px 3px rgba(60,64,67,.18), 0 1px 3px rgba(60,64,67,.30)",
  },
  motion: {
    duration: { instant: "50ms", short: "100ms", standard: "200ms", emphasized: "300ms", long: "500ms" },
    easing: { standard: "cubic-bezier(.2,0,0,1)", emphasized: "cubic-bezier(.2,0,0,1)", exit: "cubic-bezier(.4,0,1,1)" },
  },
  layout: {
    appBarHeight: "64px",
    navigationRailWidth: "80px",
    navigationDrawerWidth: "256px",
    contentMaxWidth: "1440px",
    pageInset: "24px",
    compactInset: "16px",
    touchTarget: "48px",
    breakpoints: { compact: 600, medium: 840, expanded: 1200, large: 1440 },
  },
};

const components = [
  { id: "top-app-bar", family: "app-shell", variant: "top-bar", category: "Navigation", title: "Top app bar", anatomy: ["menu or product mark", "search", "utility actions", "account"], states: ["default", "search-active", "scrolled"], services: ["gmail", "calendar", "drive", "meet", "finance"] },
  { id: "navigation-drawer", family: "navigation", variant: "drawer", category: "Navigation", title: "Navigation drawer", anatomy: ["primary action", "section links", "selected item", "storage or secondary actions"], states: ["expanded", "collapsed", "selected", "hover"], services: ["gmail", "calendar", "drive"] },
  { id: "navigation-rail", family: "navigation", variant: "rail", category: "Navigation", title: "Navigation rail", anatomy: ["destination icon", "label", "selected container"], states: ["default", "selected", "hover"], services: ["meet"] },
  { id: "tabs", family: "navigation", variant: "tabs", category: "Navigation", title: "Tabs", anatomy: ["label", "optional count", "active indicator"], states: ["default", "hover", "selected", "disabled"], services: ["gmail", "finance"] },
  { id: "search-bar", category: "Input", title: "Search bar", anatomy: ["leading icon", "placeholder", "optional filter or voice action"], states: ["default", "hover", "focus", "query", "disabled"], services: ["gmail", "drive", "finance"] },
  { id: "filter-chip", category: "Input", title: "Filter chip", anatomy: ["leading icon", "label", "trailing menu"], states: ["default", "hover", "selected", "disabled"], services: ["drive", "finance"] },
  { id: "filled-button", family: "button", variant: "filled", category: "Actions", title: "Filled button", anatomy: ["optional icon", "label"], states: ["default", "hover", "pressed", "focus", "disabled"], services: ["calendar", "finance"] },
  { id: "tonal-button", family: "button", variant: "tonal", category: "Actions", title: "Filled tonal button", anatomy: ["optional icon", "label"], states: ["default", "hover", "pressed", "focus", "disabled"], services: ["gmail", "drive", "meet", "finance"] },
  { id: "outlined-button", family: "button", variant: "outlined", category: "Actions", title: "Outlined button", anatomy: ["optional icon", "label", "outline"], states: ["default", "hover", "pressed", "focus", "disabled"], services: ["calendar", "meet", "finance"] },
  { id: "icon-button", family: "button", variant: "icon", category: "Actions", title: "Icon button", anatomy: ["24px symbol", "40-48px target", "tooltip"], states: ["default", "hover", "pressed", "focus", "disabled", "selected"], services: ["gmail", "calendar", "drive", "meet", "finance"] },
  { id: "fab", family: "button", variant: "floating-action", category: "Actions", title: "FAB / extended FAB", anatomy: ["icon", "optional label", "elevated container"], states: ["default", "hover", "pressed", "focus"], services: ["gmail", "calendar", "drive"] },
  { id: "list-row", category: "Content", title: "Dense list row", anatomy: ["selection", "leading state", "primary text", "secondary text", "metadata", "hover actions"], states: ["read", "unread", "hover", "selected", "disabled"], services: ["gmail", "drive"] },
  { id: "data-card", category: "Content", title: "Data card", anatomy: ["title", "value", "delta", "sparkline"], states: ["default", "positive", "negative", "selected"], services: ["finance"] },
  { id: "calendar-grid", category: "Content", title: "Calendar grid", anatomy: ["day header", "time gutter", "slot", "today indicator", "event chip"], states: ["empty", "today", "current-time", "event", "drag"], services: ["calendar", "meet"] },
  { id: "banner", category: "Feedback", title: "Inline banner", anatomy: ["leading icon", "title", "supporting text", "action", "dismiss"], states: ["info", "warning", "success", "dismissed"], services: ["gmail", "drive", "meet"] },
  { id: "snackbar", category: "Feedback", title: "Snackbar", anatomy: ["message", "optional action", "dismiss"], states: ["enter", "rest", "action-hover", "exit"], services: ["gmail"] },
  { id: "dialog", category: "Feedback", title: "Dialog", anatomy: ["media or icon", "headline", "supporting content", "actions", "scrim"], states: ["enter", "rest", "focus-trap", "exit"], services: ["calendar"] },
  { id: "empty-state", category: "Feedback", title: "Empty state", anatomy: ["illustration", "headline", "supporting text", "primary action"], states: ["empty", "loading", "resolved"], services: ["drive", "meet"] },
  { id: "side-panel", category: "Layout", title: "Utility side panel", anatomy: ["icon rail", "expanded panel", "divider", "add action"], states: ["collapsed", "expanded", "selected"], services: ["gmail", "calendar", "drive"] },
];

const interactions = [
  { id: "hover", trigger: "pointer hover", duration: "100ms", result: "surface tint appears; contextual actions may replace metadata", evidence: "Gmail row actions and icon-button state" },
  { id: "focus", trigger: "keyboard focus", duration: "instant", result: "2-3px high-contrast focus ring outside the component", evidence: "Meet primary action and Calendar dialog confirmation" },
  { id: "press", trigger: "pointer or keyboard activation", duration: "50-100ms", result: "state layer strengthens and elevation compresses", evidence: "Buttons and chips across all products" },
  { id: "selection", trigger: "navigation, tab, chip, or row selection", duration: "200ms", result: "tonal container plus stronger label/icon color", evidence: "Gmail inbox, Calendar today, Drive home, Finance region" },
  { id: "expand-collapse", trigger: "disclosure action", duration: "200-300ms", result: "height/width animates with content opacity and chevron rotation", evidence: "Navigation sections and Finance news accordion" },
  { id: "dialog", trigger: "modal action", duration: "200-300ms", result: "scrim fades, surface scales/fades in, focus moves inside", evidence: "Calendar first-run dialog" },
  { id: "snackbar", trigger: "background status or confirmation", duration: "300ms enter; 4-10s rest", result: "bottom surface appears with optional action and dismiss", evidence: "Gmail desktop notification prompt" },
  { id: "drag-drop", trigger: "pointer drag or keyboard/click fallback", duration: "continuous", result: "lifted preview, insertion target, auto-scroll, drop confirmation", evidence: "Calendar events and Drive files; local sample executes the shared contract" },
];

const interactionSamples = [
  { id: "hover-row", contractId: "hover", title: "Hover row actions", behavior: "Hover or focus the row to reveal the tonal state and contextual actions.", states: ["rest", "hover", "focus"] },
  { id: "focus-ring", contractId: "focus", title: "Keyboard focus ring", behavior: "Tab to or click the action to show the high-contrast exterior focus ring.", states: ["rest", "focused"] },
  { id: "press-state", contractId: "press", title: "Press state layer", behavior: "Press and hold the action to compress elevation and strengthen the state layer.", states: ["rest", "pressed", "released"] },
  { id: "navigation-selection", contractId: "selection", title: "Selected navigation", behavior: "Choose a destination to move the tonal container and aria-current.", states: ["default", "hover", "selected", "focus"] },
  { id: "disclosure", contractId: "expand-collapse", title: "Expand and collapse", behavior: "Toggle aria-expanded, rotate the chevron, and reveal supporting content.", states: ["collapsed", "expanded"] },
  { id: "dialog", contractId: "dialog", title: "Modal dialog", behavior: "Open a native modal, move focus inside, then restore it on close.", states: ["closed", "open", "focus-trap"] },
  { id: "snackbar", contractId: "snackbar", title: "Snackbar feedback", behavior: "Trigger a snackbar with action and dismiss controls.", states: ["hidden", "enter", "rest", "dismissed"] },
  { id: "drag-drop", contractId: "drag-drop", title: "Drag and drop", behavior: "Drag the file to the destination, or use the click fallback for keyboard and touch access.", states: ["rest", "picked", "over-target", "dropped"] },
];

const sources = [
  { id: "material-3", kind: "guidance", name: "Material Design 3", url: "https://m3.material.io/", license: "Reference guidance", reuse: "reference-only", notes: "Use principles and semantic roles. Do not bundle documentation screenshots or illustrations." },
  { id: "material-web", kind: "code", name: "Material Web", url: "https://github.com/material-components/material-web", license: "Apache-2.0", reuse: "redistributable", notes: "Official M3 web components and tokens." },
  { id: "material-color-utilities", kind: "code", name: "Material Color Utilities", url: "https://github.com/material-foundation/material-color-utilities", license: "Apache-2.0", reuse: "redistributable", notes: "Dynamic color and semantic role implementation." },
  { id: "material-symbols", kind: "icons", name: "Material Symbols", url: "https://github.com/google/material-design-icons", license: "Apache-2.0", reuse: "redistributable", notes: "Product logos are excluded; use only the symbol library." },
  { id: "noto-emoji", kind: "emoji", name: "Noto Emoji", url: "https://github.com/googlefonts/noto-emoji", license: "OFL-1.1 fonts; Apache-2.0 SVG/resources", reuse: "redistributable-with-file-check", notes: "Region flags have separate provenance and must be verified individually." },
  { id: "roboto", kind: "font", name: "Roboto", url: "https://github.com/googlefonts/roboto-3-classic", license: "OFL-1.1", reuse: "redistributable", notes: "Open fallback and body font." },
  { id: "google-sans", kind: "font", name: "Google Sans / Google Sans Flex", url: "https://fonts.google.com/specimen/Google+Sans", license: "Google Fonts open-source bundle", reuse: "redistributable-with-bundle-license", notes: "Use only official Google Fonts downloads and preserve the bundled license. Product Sans dumps are excluded." },
  { id: "google-brand", kind: "brand", name: "Google Brand Resource Center", url: "https://about.google/brand-resource-center/guidance/", license: "Brand terms", reuse: "reference-only", notes: "Google product logos, icons, screenshots, and visual identity are not bundled in distributable assets." },
];

const representativeFallbacks = {
  gmail: { observedAssetId: "official-hosted-gmail-lockup", category: "product-logo", width: 109, height: 40, palette: ["#FC413D", "#FA413E", "#FF5F94", "#FD9916", "#1F1F1F"], sourceUrl: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r7.png" },
  calendar: { observedAssetId: "official-hosted-calendar-2026", category: "product-logo", width: 96, height: 96, palette: ["#BBE2FF", "#3C90FF", "#4A9CFF", "#FFFFFF"], sourceUrl: "https://www.gstatic.com/images/branding/productlogos/calendar_2026_01/v2/png/calendar_2026_01_96dp.png" },
  drive: { observedAssetId: "official-hosted-drive-2026", category: "product-logo", width: 48, height: 48, palette: ["#3186FF", "#0EBC5F", "#FECE07", "#78C9FF"], sourceUrl: "https://www.gstatic.com/images/branding/productlogos/drive_2026/v1/web-48dp/logo_drive_2026_color_1x_web_48dp.png" },
  meet: { observedAssetId: "official-hosted-meet-2026-lockup", category: "product-logo", width: 124, height: 40, palette: ["#FBB100", "#FECC05", "#FFD00A", "#212226"], sourceUrl: "https://www.gstatic.com/meet/icons/logo_meet_2026_1x_6468c1b9f0dedbff2aa2a8e003f73eca.png" },
  keep: { observedAssetId: "official-hosted-keep-2026", category: "companion-app-icon", width: 48, height: 48, palette: ["#F6A100", "#FFBF02", "#FFC103", "#FFC0D1"], sourceUrl: "https://www.gstatic.com/companion/icon_assets/keep_2026_2x.png" },
  contacts: { observedAssetId: "official-hosted-contacts-2022", category: "companion-app-icon", width: 40, height: 40, palette: ["#0057CC", "#578CFF", "#89ACFF", "#FFFFFF"], sourceUrl: "https://www.gstatic.com/companion/icon_assets/contacts_2022_2x.png" },
  tasks: { observedAssetId: "official-hosted-tasks-2026", category: "companion-app-icon", width: 48, height: 48, palette: ["#3186FF", "#BBE2FF", "#3085FF", "#FFFFFF"], sourceUrl: "https://www.gstatic.com/companion/icon_assets/tasks_2026_2x.png" },
  maps: { observedAssetId: "official-hosted-maps-2025", category: "product-logo", width: 48, height: 48, palette: ["#0DBB62", "#4D82FE", "#EA4335", "#FBBC04"], sourceUrl: "https://www.gstatic.com/images/branding/productlogos/maps_2025/v1/web-24dp/logo_maps_2025_color_2x_web_24dp.png" },
};

const representativeAsset = (fragment, displayMode = "contain", fallbackId) => {
  const asset = exportedAssetManifest?.assets.find((item) => item.localFile.includes(fragment) || item.sourceUrl.includes(fragment));
  const fallback = representativeFallbacks[fallbackId];
  if (!asset && !fallback) return null;
  const width = asset?.width || fallback.width;
  const height = asset?.height || fallback.height;
  const containScale = Math.min(1, 52 / Math.max(width, height));
  return {
    observedAssetId: asset?.id || fallback.observedAssetId,
    category: asset?.category || fallback.category,
    width,
    height,
    palette: asset ? [...(asset.accentColors || []), ...(asset.neutralColors || [])].slice(0, 5) : fallback.palette,
    privateLocalFile: asset?.localFile || null,
    sourceUrl: asset?.sourceUrl || fallback.sourceUrl,
    displayMode,
    displaySize: displayMode === "leading-symbol-crop"
      ? { width: 40, height: 40 }
      : { width: Math.round(width * containScale), height: Math.round(height * containScale) },
    referenceOnly: true,
  };
};

const productSourceRegistry = [
  { id: "gmail", name: "Gmail", productUrl: "https://workspace.google.com/products/gmail/", policyUrl: "https://about.google/brand-resource-center/products-and-services/", observedImageCount: observedPlatformAssetSummary.byService.gmail || 0, status: "official-observed-reference", redistribution: "ask-first", representative: representativeAsset("logo_gmail_lockup", "leading-symbol-crop", "gmail") },
  { id: "calendar", name: "Google Calendar", productUrl: "https://workspace.google.com/products/calendar/", policyUrl: "https://about.google/brand-resource-center/products-and-services/", observedImageCount: observedPlatformAssetSummary.byService.calendar || 0, status: "official-observed-reference", redistribution: "ask-first", representative: representativeAsset("calendar_2026_01", "contain", "calendar") },
  { id: "drive", name: "Google Drive", productUrl: "https://workspace.google.com/products/drive/", policyUrl: "https://about.google/brand-resource-center/products-and-services/", observedImageCount: observedPlatformAssetSummary.byService.drive || 0, status: "official-observed-reference", redistribution: "ask-first", representative: representativeAsset("logo_drive_2026", "contain", "drive") },
  { id: "meet", name: "Google Meet", productUrl: "https://workspace.google.com/products/meet/", policyUrl: "https://about.google/brand-resource-center/guidance/", observedImageCount: observedPlatformAssetSummary.byService.meet || 0, status: "official-observed-reference", redistribution: "general-brand-guidance", representative: representativeAsset("logo_meet_2026", "leading-symbol-crop", "meet") },
  { id: "finance", name: "Google Finance", productUrl: "https://www.google.com/finance/beta", policyUrl: "https://about.google/brand-resource-center/guidance/", observedImageCount: observedPlatformAssetSummary.byService.finance || 0, status: "official-observed-reference", redistribution: "general-brand-guidance", representative: { observedAssetId: "finance-play-store-app-icon-2026", category: "official-app-icon", width: 256, height: 256, palette: ["#4285F4", "#0F9D58", "#F4B400", "#DB4437"], privateLocalFile: null, sourceUrl: "https://play-lh.googleusercontent.com/DbcRfwWKElMfl7RVuhcBHbEmxzhB-1xZjht0PAsuar3ku89ETH48AF2bvs2jJeca9L5dJvJGS1LIkXeeKvCV5w=s256", sourcePage: "https://play.google.com/store/apps/details?id=com.google.android.apps.finance", displayMode: "contain", displaySize: { width: 52, height: 52 }, referenceOnly: true } },
  { id: "keep", name: "Google Keep", productUrl: "https://workspace.google.com/products/keep/", policyUrl: "https://about.google/brand-resource-center/guidance/", observedImageCount: exportedAssetManifest?.assets.filter((asset) => asset.sourceUrl.includes("keep_2026")).length || 0, status: "official-observed-reference", redistribution: "general-brand-guidance", representative: representativeAsset("keep_2026", "contain", "keep") },
  { id: "contacts", name: "Google Contacts", productUrl: "https://contacts.google.com/", policyUrl: "https://about.google/brand-resource-center/guidance/", observedImageCount: exportedAssetManifest?.assets.filter((asset) => asset.sourceUrl.includes("contacts_2022")).length || 0, status: "official-observed-reference", redistribution: "general-brand-guidance", representative: representativeAsset("contacts_2022", "contain", "contacts") },
  { id: "tasks", name: "Google Tasks", productUrl: "https://workspace.google.com/products/tasks/", policyUrl: "https://about.google/brand-resource-center/guidance/", observedImageCount: exportedAssetManifest?.assets.filter((asset) => asset.sourceUrl.includes("tasks_2026")).length || 0, status: "official-observed-reference", redistribution: "general-brand-guidance", representative: representativeAsset("tasks_2026", "contain", "tasks") },
  { id: "maps", name: "Google Maps", productUrl: "https://about.google/brand-resource-center/products-and-services/geo-guidelines/", policyUrl: "https://developers.google.com/maps/documentation/geolocation/policies", observedImageCount: exportedAssetManifest?.assets.filter((asset) => asset.sourceUrl.includes("logo_maps_2025")).length || 0, status: "conditional-attribution-reference", redistribution: "maps-api-context-only", representative: representativeAsset("logo_maps_2025", "contain", "maps") },
];

const iconNames = [
  "menu", "search", "tune", "help", "settings", "apps", "account_circle", "add", "edit", "close", "refresh", "more_vert",
  "mail", "inbox", "star", "schedule", "send", "draft", "label", "archive", "delete", "mark_email_read", "attach_file", "filter_list",
  "calendar_today", "event", "today", "chevron_left", "chevron_right", "view_week", "task_alt", "people", "location_on", "notifications",
  "home", "folder", "description", "computer", "group", "history", "warning", "cloud", "upload", "download", "grid_view", "view_list",
  "videocam", "call", "keyboard", "shield_lock", "info", "lock", "mic", "present_to_all", "chat", "person_add", "link", "video_call",
  "finance", "monitoring", "trending_up", "trending_down", "show_chart", "candlestick_chart", "currency_exchange", "add_chart", "expand_more", "expand_less", "open_in_new", "policy",
];

const illustrations = [
  {
    id: "meet-empty-schedule",
    name: "Meet empty schedule illustration",
    sourceUrl: "https://meet.google.com/home",
    reuse: "reference-only",
    evidenceId: "meet-home",
    observation: "Soft pink, yellow, and blue editorial line illustration centered above an empty-state headline.",
    distributableSubstitute: { type: "material-symbol", name: "event_busy", treatment: "secondaryContainer surface, 28px radius" },
  },
  {
    id: "calendar-onboarding",
    name: "Calendar onboarding illustration",
    sourceUrl: "https://calendar.google.com/calendar/u/0/r",
    reuse: "reference-only",
    evidenceId: "calendar-onboarding",
    observation: "Large blue travel/calendar scene used as dialog media above onboarding copy.",
    distributableSubstitute: { type: "material-symbol", name: "calendar_month", treatment: "primaryContainer surface, 28px radius" },
  },
  {
    id: "gmail-gemini-banner-mark",
    name: "Gmail Gemini banner mark",
    sourceUrl: "https://mail.google.com/",
    reuse: "reference-only",
    evidenceId: "gmail-inbox",
    observation: "Small branded decorative mark in an informational banner.",
    distributableSubstitute: { type: "material-symbol", name: "auto_awesome", treatment: "primary color, no Google product branding" },
  },
  {
    id: "drive-empty-recommendation",
    name: "Drive recommendation empty state",
    sourceUrl: "https://drive.google.com/drive/u/0/home",
    reuse: "independent-pattern",
    evidenceId: "drive-home",
    observation: "Whitespace-first empty recommendation surface with centered support text and contextual filters.",
    distributableSubstitute: { type: "material-symbol", name: "folder_off", treatment: "surfaceContainerLow, 20px radius" },
  },
];

const productReferenceAssets = [
  {
    id: "meet-product-mark",
    name: "Google Meet product mark",
    category: "ProductBrandMarks",
    evidenceId: "meet-product-navigation-source",
    referenceOnly: true,
    bbox: { x: 38, y: 22, width: 350, height: 55 },
    sourceSize: { width: 420, height: 580 },
    colors: [
      ...(officialMeetLogoAsset?.accentColors?.slice(0, 5) || ["#FBB100", "#FECC05", "#FAAD01"]),
      ...(officialMeetLogoAsset?.neutralColors?.slice(0, 2) || ["#212226"]),
      "#FFFFFF",
    ],
    gradientId: "meet-product-mark-yellow",
    officialObservedAssetId: officialMeetLogoAsset?.id || null,
    paletteMethod: officialMeetLogoAsset?.paletteMethod || "exact-source-pixels",
    typography: { family: "Google Sans-like", weight: 500, approximateSize: "48px" },
    sourceFidelity: "official-raster-reference",
    distributableSubstitute: { type: "none", name: "no-public-substitute", note: "Do not approximate or recreate the Google product mark." },
  },
  {
    id: "meet-nav-meeting-selected",
    name: "Meeting navigation item, selected",
    category: "ProductNavigationIcons",
    evidenceId: "meet-product-navigation-source",
    referenceOnly: true,
    bbox: { x: 44, y: 212, width: 112, height: 112 },
    sourceSize: { width: 420, height: 580 },
    colors: ["#C9E6FD", "#061C33", "#1967D2", "#FFFFFF"],
    containerId: "meet-nav-selected-pill",
    states: ["selected"],
    sourceFidelity: "screenshot-measured-reference",
    distributableSubstitute: { type: "material-symbol", name: "calendar_today", axes: { fill: 0, weight: 500, grade: 0, opticalSize: 24 }, renderSize: 36 },
  },
  {
    id: "meet-nav-call-inactive",
    name: "Call navigation item, inactive",
    category: "ProductNavigationIcons",
    evidenceId: "meet-product-navigation-source",
    referenceOnly: true,
    bbox: { x: 72, y: 360, width: 70, height: 112 },
    sourceSize: { width: 420, height: 580 },
    colors: ["#454746", "#5F6368", "#FFFFFF"],
    states: ["inactive"],
    sourceFidelity: "screenshot-measured-reference",
    distributableSubstitute: { type: "material-symbol", name: "call", axes: { fill: 0, weight: 500, grade: 0, opticalSize: 24 }, renderSize: 36 },
  },
  {
    id: "meet-security-shield-lock",
    name: "Security shield-lock status icon",
    category: "StatusAndTrustIcons",
    evidenceId: "meet-security-banner-source",
    referenceOnly: true,
    bbox: { x: 80, y: 70, width: 56, height: 73 },
    sourceSize: { width: 640, height: 256 },
    colors: ["#4285F4", "#185ABC", "#FFFFFF"],
    sourceFidelity: "official-svg-exact",
    officialObservedAssetId: officialMeetShieldAsset?.id || null,
    vector: { width: 58, height: 58, paths: 3, fills: ["#4285F4", "#185ABC", "#FFFFFF"], stroke: "none" },
    distributableSubstitute: { type: "material-symbol", name: "shield_lock", axes: { fill: 0, weight: 500, grade: 0, opticalSize: 24 }, renderSize: 40 },
  },
  {
    id: "meet-security-banner",
    name: "Security / trust info banner",
    category: "ContainersAndSurfaces",
    evidenceId: "meet-security-banner-source",
    referenceOnly: true,
    bbox: { x: 28, y: 42, width: 612, height: 128 },
    sourceSize: { width: 640, height: 256 },
    colors: ["#D3E3FD", "#454746", "#4285F4", "#185ABC", "#FFFFFF"],
    containerId: "meet-security-banner-pill",
    anatomy: ["shield-lock icon", "bold title", "supporting text", "pill surface"],
    sourceFidelity: "computed-surface-plus-official-svg",
    distributableSubstitute: { type: "component", name: "banner", icon: "shield_lock", iconAxes: { fill: 0, weight: 500, grade: 0, opticalSize: 24 } },
  },
  {
    id: "meet-empty-state-illustration",
    name: "Meet empty-schedule illustration",
    category: "EmptyStateIllustrations",
    evidenceId: "meet-empty-state-source",
    referenceOnly: true,
    bbox: { x: 247, y: 123, width: 615, height: 325 },
    sourceSize: { width: 1126, height: 936 },
    colors: ["#FFC6EF", "#FFDB0F", "#FDFD6D", "#1F1F1F", "#000000", "#FFFFFF"],
    gradientIds: ["meet-cup-pink-yellow-exact"],
    stroke: { colors: ["#1F1F1F", "#000000"], nativeWidth: "1px default SVG stroke", observedScale: 1.95, approximateRenderedWidth: "1.95px", cap: "round", join: "round" },
    sourceFidelity: "official-svg-exact",
    officialObservedAssetId: officialMeetIllustrationAsset?.id || null,
    vector: { width: 315, height: 167, viewBox: [0, 0, 315, 167], paths: 12, gradientCount: 1 },
    illustrationStyle: "thin black line, flat pastel geometry, isolated white stage",
    distributableSubstitute: { type: "none", name: "original-reference-only", note: "Do not collapse the illustration into a generic icon; use a separately commissioned or licensed illustration for public implementation." },
  },
  {
    id: "meet-new-meeting-icon",
    name: "Video-plus action icon",
    category: "ActionIcons",
    evidenceId: "meet-empty-state-source",
    referenceOnly: true,
    bbox: { x: 499, y: 726, width: 35, height: 33 },
    sourceSize: { width: 1126, height: 936 },
    colors: ["#102613", "#CDEDD2"],
    sourceFidelity: "screenshot-measured-reference",
    distributableSubstitute: { type: "material-symbol", name: "video_call", axes: { fill: 0, weight: 500, grade: 0, opticalSize: 24 }, renderSize: 32 },
  },
  {
    id: "meet-new-meeting-button",
    name: "Soft-green new meeting CTA",
    category: "ContainersAndSurfaces",
    evidenceId: "meet-empty-state-source",
    referenceOnly: true,
    bbox: { x: 446, y: 686, width: 214, height: 111 },
    sourceSize: { width: 1126, height: 936 },
    colors: ["#C4EED0", "#072711"],
    containerId: "meet-new-meeting-pill",
    typography: { family: "Google Sans-like", weight: 500, approximateSize: "30px" },
    sourceFidelity: "computed-surface-plus-screenshot-geometry",
    distributableSubstitute: { type: "component", name: "tonal-button", icon: "video_call", iconAxes: { fill: 0, weight: 500, grade: 0, opticalSize: 24 } },
  },
];

const containerReferences = [
  {
    id: "meet-nav-selected-pill",
    name: "Selected navigation capsule",
    dimensions: { width: 112, height: 64 },
    radius: "32px",
    background: "#C9E6FD",
    border: "none",
    contentColors: { icon: "#061C33", label: "#1967D2" },
    usage: "selected destination in a vertical navigation rail",
  },
  {
    id: "meet-security-banner-pill",
    name: "Security information banner",
    dimensions: { height: 128, width: "fluid" },
    radius: "64px",
    background: "#D3E3FD",
    border: "none",
    padding: { block: 28, inline: 52 },
    usage: "high-trust informational message with a status icon",
  },
  {
    id: "meet-new-meeting-pill",
    name: "Soft-green primary tonal CTA",
    dimensions: { width: 214, height: 111 },
    radius: "56px",
    background: "#C4EED0",
    border: "none",
    contentColors: { icon: "#072711", label: "#072711" },
    usage: "empty-state primary action",
  },
];

const gradientReferences = [
  {
    id: "meet-product-mark-yellow",
    name: "Meet product mark yellow-orange",
    css: "linear-gradient(135deg, #FFD00A 0%, #FECC05 48%, #FBB100 100%)",
    stops: [
      { offset: 0, color: "#FFD00A" },
      { offset: 48, color: "#FECC05" },
      { offset: 100, color: "#FBB100" },
    ],
    measurement: "raster-sampled-approximation",
    confidence: 0.78,
    referenceOnly: true,
  },
  {
    id: "meet-cup-pink-yellow-exact",
    name: "Empty-state cup official SVG gradient",
    css: "linear-gradient(258deg, #FFC6EF 45%, #FFDB0F 61%)",
    stops: [
      { offset: 45, color: "#FFC6EF" },
      { offset: 61, color: "#FFDB0F" },
    ],
    vector: { id: "a", gradientUnits: "userSpaceOnUse", x1: 257.5, y1: 104.033, x2: 10.96, y2: 157.859 },
    measurement: "official-svg-exact",
    confidence: 1,
    referenceOnly: true,
  },
];

const infographics = [
  {
    id: "finance-market-sparkline",
    name: "Market sparkline card",
    sourceUrl: "https://www.google.com/finance/beta",
    reuse: "independent-data-pattern",
    evidenceId: "finance-overview",
    anatomy: ["market name", "current value", "signed delta", "direction icon", "sparkline"],
    rule: "Use semantic positive/negative tokens and always pair color with sign or icon.",
  },
  {
    id: "finance-market-summary",
    name: "Market summary block",
    sourceUrl: "https://www.google.com/finance/beta",
    reuse: "independent-data-pattern",
    evidenceId: "finance-overview",
    anatomy: ["regional filter", "index cards", "summary headline", "source attribution", "expandable stories"],
    rule: "Keep dense data above editorial context; charts are UI, not copied image assets.",
  },
  {
    id: "calendar-time-grid",
    name: "Weekly time-grid",
    sourceUrl: "https://calendar.google.com/calendar/u/0/r",
    reuse: "independent-layout-pattern",
    evidenceId: "calendar-week",
    anatomy: ["day headers", "time gutter", "hour slots", "today circle", "current-time line", "event layer"],
    rule: "Time is encoded by position first, then color and labels.",
  },
  {
    id: "material-documentation-graphics",
    name: "Material documentation diagrams",
    sourceUrl: "https://m3.material.io/",
    reuse: "reference-only",
    evidenceId: null,
    anatomy: ["component anatomy diagrams", "token relationship diagrams", "motion demonstrations"],
    rule: "Recreate diagrams with original neutral shapes and text; do not copy Material documentation imagery.",
  },
];

const services = serviceDefinitions.map((definition) => {
  const raw = rawByService[definition.id];
  return {
    ...definition,
    capturedAt: raw.capturedAt,
    viewport: raw.viewport,
    metrics: raw.metrics,
    captureCount: allRawCaptures.filter((capture) => capture.service === definition.id).length,
    primaryCaptureId: rawCaptureFiles[allRawCaptures.indexOf(raw)],
    summaryScope: "primary-capture; see captures for all measured states",
    captures: allRawCaptures.flatMap((capture,index)=>capture.service===definition.id?[{id:rawCaptureFiles[index],capturedAt:capture.capturedAt,viewport:capture.viewport,metrics:capture.metrics,interactionStates:capture.interactionStates}]:[]),
    interactionStates: raw.interactionStates,
    observed: {
      colors: raw.foundations.colors.slice(0, 12).map(({ value, count }) => ({ value: rgbToHex(value), count })),
      backgrounds: raw.foundations.backgrounds.slice(0, 12).map(({ value, count }) => ({ value: rgbToHex(value), count })),
      radii: raw.foundations.radii.slice(0, 12),
      typography: raw.foundations.typography,
      spacing: raw.foundations.spacing.slice(0, 24),
    },
  };
});

// Preserve capture-level provenance; counts are occurrences, not unique UI elements.
const observationKinds = {
  color: raw => raw.foundations.colors, background: raw => raw.foundations.backgrounds,
  borderColor: raw => raw.foundations.borders, shadow: raw => raw.foundations.shadows,
  radius: raw => raw.foundations.radii, spacing: raw => raw.foundations.spacing,
  fontFamily: raw => raw.foundations.typography.families, fontSize: raw => raw.foundations.typography.sizes,
  fontWeight: raw => raw.foundations.typography.weights, lineHeight: raw => raw.foundations.typography.lineHeights,
  letterSpacing: raw => raw.foundations.typography.letterSpacing,
  ...Object.fromEntries(['transitionDurations','transitionDelays','transitionTimingFunctions','transitionProperties','animationDurations','animationTimingFunctions','animationIterationCounts'].map(key=>[key,raw=>raw.foundations.motion?.[key]])),
  gradient: raw=>raw.foundations.gradients,
  ...Object.fromEntries(['borderWidths','borderStyles','outlineWidths','outlineStyles','clipPaths','aspectRatios'].map(key=>[key,raw=>raw.foundations.shape?.[key]])),
  ...Object.fromEntries(['opacity','transforms'].map(key=>[key,raw=>raw.foundations.effects?.[key]])),
};
const observations = Object.entries(observationKinds).flatMap(([kind, select]) => {
  const grouped = new Map();
  allRawCaptures.forEach((raw, index) => (select(raw) || []).forEach(({value, count}) => {
    const normalized = value.startsWith('rgb(') ? rgbToHex(value) : value;
    const entry = grouped.get(normalized) || {id: `${kind}-${grouped.size + 1}`, kind, value:normalized, count:0, evidence:'observed', services:[], captures:[]};
    entry.count += count;
    if (!entry.services.includes(raw.service)) entry.services.push(raw.service);
    entry.captures.push({id:rawCaptureFiles[index], service:raw.service, capturedAt:raw.capturedAt, count});
    grouped.set(normalized, entry);
  }));
  return [...grouped.values()].sort((a,b)=>b.count-a.count || a.value.localeCompare(b.value));
});
const observedComponents = allRawCaptures.flatMap((raw,index) => Object.entries(raw.components).flatMap(([family,entries]) => entries.map((entry,i) => ({id:`${rawCaptureFiles[index]}-${family}-${i+1}`,family,service:raw.service,captureId:rawCaptureFiles[index],capturedAt:raw.capturedAt,evidence:'observed',...entry}))));
const sourceCoverage = allRawCaptures.map((raw,index)=>({id:rawCaptureFiles[index],service:raw.service,capturedAt:raw.capturedAt,visibleElements:raw.metrics.visibleElementCount,foundationOccurrences:Object.values(observationKinds).reduce((sum,select)=>sum+(select(raw)||[]).reduce((n,x)=>n+x.count,0),0),componentGroups:Object.values(raw.components).reduce((sum,x)=>sum+x.length,0),states:raw.interactionStates,motionMeasured:false}));
const openSourceManifest = await readJson(path.join(ROOT,'data/sources/open-source-manifest.json'));
additionalInteractions.forEach(({sample,...contract})=>{interactions.push(contract);interactionSamples.push(sample);});
tokens.metadata.version = '2.0.0';
tokens.motion.systemDuration = Object.fromEntries(Object.entries(designLibrary.motion.durations).map(([key,value])=>[key,`${value}ms`]));
tokens.motion.easing = {...tokens.motion.easing,...designLibrary.motion.easings};
tokens.state = designLibrary.states.opacity;
tokens.shape = Object.fromEntries(designLibrary.shapes.map(shape=>[shape.id,shape.radius]));

const catalog = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  title: "Google Product Design System Catalog",
  summary: "A privacy-safe observation catalog across Gmail, Calendar, Drive, Meet, and Finance, backed by official open-source Material assets.",
  privacy: {
    sourceTextCollected: false,
    productCaptures: "reference-only and gitignored",
    distributableAssets: "official Apache-2.0 or OFL-1.1 upstreams only",
  },
  services,
  tokens,
  designLibrary: {...designLibrary, observations, observedComponents, sourceCoverage},
  observed: {
    colors: aggregateRanked((raw) => raw.foundations.colors, 48),
    backgrounds: aggregateRanked((raw) => raw.foundations.backgrounds, 32),
    radii: aggregateRanked((raw) => raw.foundations.radii, 32),
    spacing: aggregateRanked((raw) => raw.foundations.spacing, 48),
    fontFamilies: aggregateRanked((raw) => raw.foundations.typography.families, 24),
    fontSizes: aggregateRanked((raw) => raw.foundations.typography.sizes, 24),
  },
  components,
  interactions,
  interactionSamples,
  assets: {
    sources,
    openSource: openSourceManifest,
    iconNames,
    illustrations,
    infographics,
    productReferenceAssets,
    containerReferences,
    gradientReferences,
    observedPlatformAssetSummary,
    productSourceRegistry,
  },
};

const cssTokenEntries = [];
const pushTokens = (prefix, object) => {
  Object.entries(object).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) pushTokens(`${prefix}-${key}`, value);
    else cssTokenEntries.push([`--gds-${prefix}-${key}`.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value]);
  });
};
pushTokens("color", tokens.color.light);
pushTokens("space", Object.fromEntries(Object.entries(tokens.spacing.scale).map(([key,value])=>[key,`${value}px`])));
pushTokens("radius", tokens.radius);
pushTokens("elevation", tokens.elevation);
pushTokens("duration", tokens.motion.duration);
pushTokens("easing", tokens.motion.easing);
pushTokens("system-duration", tokens.motion.systemDuration);
pushTokens("state", tokens.state);
pushTokens("shape", tokens.shape);
pushTokens("layout", Object.fromEntries(Object.entries(tokens.layout).filter(([key])=>key!=="breakpoints")));

const darkEntries = [];
const pushDark = (object) => {
  Object.entries(object).forEach(([key, value]) => darkEntries.push([`--gds-color-${key}`.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value]));
};
pushDark(tokens.color.dark);

const tokensCss = `:root, [data-theme="light"] {\n${cssTokenEntries.map(([key, value]) => `  ${key}: ${value};`).join("\n")}\n}\n\n[data-theme="dark"] {\n${darkEntries.map(([key, value]) => `  ${key}: ${value};`).join("\n")}\n}\n`;

await mkdir(CURATED_DIR, { recursive: true });
await Promise.all([
  writeFile(path.join(CURATED_DIR, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "tokens.json"), `${JSON.stringify(tokens, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "services.json"), `${JSON.stringify(services, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "components.json"), `${JSON.stringify(components, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "interactions.json"), `${JSON.stringify(interactions, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "interaction-samples.json"), `${JSON.stringify(interactionSamples, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "asset-manifest.json"), `${JSON.stringify(catalog.assets, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "product-reference-assets.json"), `${JSON.stringify(productReferenceAssets, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "container-references.json"), `${JSON.stringify(containerReferences, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "gradient-references.json"), `${JSON.stringify(gradientReferences, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "product-source-registry.json"), `${JSON.stringify(productSourceRegistry, null, 2)}\n`),
  writeFile(path.join(CURATED_DIR, "tokens.css"), tokensCss),
  writeFile(path.join(CURATED_DIR, "design-library.json"), `${JSON.stringify(catalog.designLibrary, null, 2)}\n`),
]);

console.log(`Built ${services.length} services, ${components.length} components, ${interactions.length} interactions.`);
