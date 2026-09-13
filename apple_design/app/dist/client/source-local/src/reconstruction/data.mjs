export const replacementTabs = [
  {
    id: "mac",
    label: "Mac",
    sourceStateIds: ["01-www-apple-com-mac-state-1"],
    title: "Mac menu substitute",
    summary: "A blocked global navigation menu button is replaced with a local open and close menu.",
  },
  {
    id: "airpods",
    label: "AirPods",
    sourceStateIds: [
      "05-www-apple-com-airpods-state-1",
      "05-www-apple-com-airpods-state-2",
      "05-www-apple-com-airpods-state-3",
    ],
    title: "AirPods feature disclosures",
    summary: "Blocked feature controls are represented by named local detail panels.",
  },
  {
    id: "home",
    label: "TV & Home",
    sourceStateIds: [
      "07-www-apple-com-tv-home-state-2",
      "07-www-apple-com-tv-home-state-3",
    ],
    title: "TV & Home menu substitute",
    summary: "Blocked global navigation menu buttons are replaced with local menu panels and links.",
  },
  {
    id: "macbook",
    label: "MacBook Air",
    sourceStateIds: ["11-www-apple-com-macbook-air-state-3"],
    title: "Answer calls and texts continuity tab",
    summary: "The blocked MacBook Air continuity tab is represented by matching expandable local content.",
  },
  {
    id: "iphone",
    label: "iPhone 17 Pro",
    sourceStateIds: [
      "12-www-apple-com-iphone-17-pro-state-1",
      "iphone-pro-highlight-chip",
      "iphone-pro-silver",
    ],
    title: "iPhone menu, chip, and color substitutes",
    summary: "Blocked menu, chip highlight, and silver color states are local approximations of observed patterns.",
  },
  {
    id: "support",
    label: "Support",
    sourceStateIds: [
      "13-support-apple-com-state-0",
      "13-support-apple-com-state-1",
      "13-support-apple-com-state-2",
      "13-support-apple-com-state-3",
    ],
    title: "Support menu substitute",
    summary: "Blocked global navigation menu buttons are replaced with local support menu panels and account states.",
  },
];

export const menuFamilies = [
  {
    id: "store",
    label: "Store",
    mappedTabs: ["support"],
    groups: [
      ["Shop", ["Shop the latest", "Mac", "iPad", "iPhone", "Accessories"]],
      ["Quick Links", ["Find a Store", "Order Status", "Apple Trade In"]],
    ],
  },
  {
    id: "mac",
    label: "Mac",
    mappedTabs: ["mac", "macbook"],
    groups: [
      ["Explore Mac", ["Explore All Mac", "MacBook Air", "MacBook Pro", "iMac"]],
      ["Shop Mac", ["Shop Mac", "Mac Accessories", "Compare Mac"]],
    ],
  },
  {
    id: "ipad",
    label: "iPad",
    mappedTabs: ["support"],
    groups: [
      ["Explore iPad", ["Explore All iPad", "iPad Pro", "iPad Air", "iPad mini"]],
      ["Shop iPad", ["Shop iPad", "iPad Accessories", "Apple Pencil"]],
    ],
  },
  {
    id: "iphone",
    label: "iPhone",
    mappedTabs: ["iphone"],
    groups: [
      ["Explore iPhone", ["Explore All iPhone", "iPhone 17 Pro", "iPhone 17", "Compare iPhone"]],
      ["Shop iPhone", ["Shop iPhone", "iPhone Accessories", "Apple Trade In"]],
    ],
  },
  {
    id: "tv-home",
    label: "TV & Home",
    mappedTabs: ["home"],
    groups: [
      ["Explore TV & Home", ["Apple TV 4K", "HomePod", "HomePod mini", "Home app"]],
      ["Shop TV & Home", ["Shop Apple TV 4K", "Shop HomePod", "TV & Home Accessories"]],
    ],
  },
  {
    id: "support",
    label: "Support",
    mappedTabs: ["support"],
    groups: [
      ["Explore Support", ["iPhone Support", "Mac Support", "iPad Support", "Apple Account"]],
      ["Get Help", ["Community", "Check Coverage", "Repair Options"]],
    ],
  },
];

export const products = [
  {
    id: "macbook-air",
    family: "Mac",
    title: "MacBook Air",
    subtitle: "13-inch and 15-inch local comparison",
    price: 999,
    colors: [
      { id: "midnight", label: "Midnight", hex: "#2e3642" },
      { id: "starlight", label: "Starlight", hex: "#f4eadc" },
      { id: "silver", label: "Silver", hex: "#e3e4e5" },
    ],
    features: ["Answer calls and texts", "Universal Clipboard", "iPhone Mirroring"],
  },
  {
    id: "iphone-pro",
    family: "iPhone",
    title: "iPhone 17 Pro",
    subtitle: "Color and camera state substitute",
    price: 1099,
    colors: [
      { id: "orange", label: "Cosmic Orange", hex: "#d86932" },
      { id: "blue", label: "Deep Blue", hex: "#3f5368" },
      { id: "silver", label: "Silver", hex: "#ece9e2" },
    ],
    features: ["Chip highlight card", "Camera feature tabs", "Color nav fallback"],
  },
  {
    id: "airpods-pro",
    family: "AirPods",
    title: "AirPods Pro",
    subtitle: "Audio feature substitute",
    price: 249,
    colors: [{ id: "white", label: "White", hex: "#f7f7f5" }],
    features: ["Heart Rate Sensing", "Live Translation", "Active Noise Cancellation"],
  },
  {
    id: "homepod-mini",
    family: "TV & Home",
    title: "HomePod mini",
    subtitle: "Home ecosystem card",
    price: 99,
    colors: [
      { id: "white", label: "White", hex: "#f6f4ef" },
      { id: "yellow", label: "Yellow", hex: "#f0ca47" },
      { id: "blue", label: "Blue", hex: "#57758d" },
    ],
    features: ["Home hub card", "Service logo substitute", "Room grouping"],
  },
];

export const supportTopics = [
  {
    title: "Apple Account demo",
    content: "Signed-out, saved-device, and service-status views are local only and contain no credential fields.",
  },
  {
    title: "Repairs and coverage",
    content: "The substitute shows topic routing and status cards without contacting Apple Support systems.",
  },
  {
    title: "Subscriptions and media",
    content: "Private service logos and dynamic account content are represented with text labels and local tiles.",
  },
  {
    title: "Device setup",
    content: "Guided setup uses static sample steps so reviewers can inspect flow states offline.",
  },
];

export const airPodsFeatureDetails = [
  {
    title: "Heart Rate Sensing",
    content: "Local expandable detail for the blocked AirPods health sensor panel. It shows content structure only.",
  },
  {
    title: "Live Translation",
    content: "Local expandable detail for the blocked translation panel. No speech, language, or network service runs here.",
  },
  {
    title: "Active Noise Cancellation",
    content: "Local expandable detail for the blocked noise control panel with representative copy and no audio engine.",
  },
];

export const continuityDetails = [
  {
    title: "Answer calls and texts",
    content: "Local continuity tab substitute for the blocked MacBook Air state. It mirrors the observed tab/disclosure pattern with static device handoff copy.",
  },
  {
    title: "Keep conversations nearby",
    content: "A representative panel for call and message continuity; it does not connect to phone, account, or notification services.",
  },
];

export const searchSuggestions = [
  "Mac menu",
  "AirPods Heart Rate Sensing",
  "AirPods Live Translation",
  "AirPods Active Noise Cancellation",
  "TV & Home menu",
  "MacBook Air Answer calls and texts",
  "iPhone silver color",
  "iPhone chip highlight",
  "Support menu",
  "Bag empty state",
];

export function filterSuggestions(query, suggestions = searchSuggestions) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return suggestions.slice(0, 5);
  return suggestions.filter((item) => item.toLowerCase().includes(needle)).slice(0, 6);
}

export function calculateBagTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function addToBag(items, productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return items;
  const current = items.find((item) => item.id === productId);
  if (current) {
    return items.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }
  return [...items, { id: product.id, title: product.title, price: product.price, quantity: 1 }];
}

export function removeFromBag(items, productId) {
  return items
    .map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
    )
    .filter((item) => item.quantity > 0);
}

export function sourceIdsForTab(tabId) {
  return replacementTabs.find((tab) => tab.id === tabId)?.sourceStateIds || [];
}
