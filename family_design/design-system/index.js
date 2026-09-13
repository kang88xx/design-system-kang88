const controllers = new WeakMap();
const activeRoots = new WeakSet();
const originalAttributeStates = new WeakMap();

function defaultRoot() {
  return typeof document === "undefined" ? undefined : document;
}

function isDocument(node) {
  return node && node.nodeType === 9;
}

function ownerDocument(root) {
  if (isDocument(root)) return root;
  return root?.ownerDocument ?? defaultRoot();
}

function contains(root, node) {
  if (!root || !node) return false;
  return isDocument(root) ? root.contains(node) : root.contains(node);
}

function closestElement(target, selector, root) {
  const element = target instanceof Element ? target : target?.parentElement;
  const match = element?.closest(selector);
  return match && contains(root, match) ? match : null;
}

function closestActiveRoot(node) {
  for (let current = node; current; current = current.parentNode) {
    if (activeRoots.has(current)) return current;
  }
  const doc = node?.ownerDocument;
  return doc && activeRoots.has(doc) ? doc : null;
}

function ownsTarget(root, target) {
  const element = target instanceof Element ? target : target?.parentElement;
  if (!element || !contains(root, element)) return false;
  const closest = closestActiveRoot(element);
  return !closest || closest === root || contains(closest, root);
}

function queryAll(root, selector) {
  const results = Array.from(root.querySelectorAll(selector));
  if (!isDocument(root) && root.matches?.(selector)) results.unshift(root);
  return results;
}

function belongsToScope(element, scope, scopeSelector) {
  return element.closest(scopeSelector) === scope;
}

function getById(root, id) {
  if (!id) return null;
  const doc = ownerDocument(root);
  if (!doc) return null;
  const candidate = doc.getElementById(id);
  return candidate && contains(root, candidate) ? candidate : null;
}

function dispatch(target, type, detail) {
  target.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
}

function isDisabled(button) {
  return button.disabled || button.getAttribute("aria-disabled") === "true";
}

function nextEnabledTab(tabs, start, step) {
  if (!tabs.length) return null;
  for (let offset = 1; offset <= tabs.length; offset += 1) {
    const tab = tabs[(start + offset * step + tabs.length) % tabs.length];
    if (!isDisabled(tab)) return tab;
  }
  return null;
}

function ensurePanelId(panel, tab, index, base) {
  if (tab.getAttribute("aria-controls")) return tab.getAttribute("aria-controls");
  if (!panel.id) panel.id = `${base}-panel-${index + 1}`;
  tab.setAttribute("aria-controls", panel.id);
  return panel.id;
}

function ensureTabId(tab, index, base) {
  if (!tab.id) {
    tab.id = `${base}-tab-${index + 1}`;
  }
  return tab.id;
}

function getTablist(tabsRoot) {
  if (tabsRoot.matches?.("[role='tablist']")) return tabsRoot;
  return queryAll(tabsRoot, "[role='tablist']").find((tablist) => belongsToScope(tablist, tabsRoot, "[data-fds-tabs]")) || tabsRoot;
}

function getTabs(root, tabsRoot) {
  const tablist = getTablist(tabsRoot);
  return queryAll(tablist, "[role='tab'], button").filter((tab, index, tabs) => {
    return tabs.indexOf(tab) === index && ownsTarget(root, tab) && belongsToScope(tab, tabsRoot, "[data-fds-tabs]");
  });
}

function getAccordionItems(root, accordion) {
  return queryAll(accordion, "details").filter((item) => {
    return ownsTarget(root, item) && item.closest("[data-fds-accordion]") === accordion;
  });
}

function getPanels(root, tabsRoot, tabs) {
  const fallbackPanels = queryAll(tabsRoot, "[role='tabpanel']").filter((panel) => {
    return ownsTarget(root, panel) && belongsToScope(panel, tabsRoot, "[data-fds-tabs]");
  });
  return tabs.map((tab, index) => {
    const controlled = getById(root, tab.getAttribute("aria-controls"));
    if (controlled && tabsRoot.contains(controlled) && belongsToScope(controlled, tabsRoot, "[data-fds-tabs]")) return controlled;
    return fallbackPanels[index] ?? null;
  });
}

function activateTab(root, tabsRoot, tab, emit = true) {
  if (!tab || isDisabled(tab)) return;
  const tabs = getTabs(root, tabsRoot);
  const panels = getPanels(root, tabsRoot, tabs);
  const activeIndex = tabs.indexOf(tab);
  if (activeIndex === -1) return;

  tabs.forEach((candidate, index) => {
    const selected = candidate === tab;
    candidate.setAttribute("aria-selected", selected ? "true" : "false");
    candidate.tabIndex = selected ? 0 : -1;
    const panel = panels[index];
    if (panel) panel.hidden = !selected;
  });

  const panel = panels[activeIndex];
  if (emit && panel) {
    dispatch(tabsRoot, "fds:tabchange", { tabId: tab.id, panelId: panel.id });
  }
}

function setupTabs(root, remember, nextId) {
  queryAll(root, "[data-fds-tabs]").forEach((tabsRoot) => {
    if (!ownsTarget(root, tabsRoot)) return;
    const tablist = getTablist(tabsRoot);
    if (!tablist.hasAttribute("role")) {
      remember(tablist, "role", tablist.getAttribute("role"));
      tablist.setAttribute("role", "tablist");
    }

    const tabs = getTabs(root, tabsRoot);
    const panels = getPanels(root, tabsRoot, tabs);
    let selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true" && !isDisabled(tab));
    selected = selected || tabs.find((tab) => !isDisabled(tab)) || tabs[0];
    const base = tabsRoot.id || nextId();

    tabs.forEach((tab, index) => {
      remember(tab, "role", tab.getAttribute("role"));
      remember(tab, "id", tab.getAttribute("id"));
      remember(tab, "aria-controls", tab.getAttribute("aria-controls"));
      remember(tab, "aria-selected", tab.getAttribute("aria-selected"));
      remember(tab, "tabindex", tab.getAttribute("tabindex"));
      tab.setAttribute("role", "tab");
      const panel = panels[index];
      ensureTabId(tab, index, base);
      if (panel) {
        remember(panel, "role", panel.getAttribute("role"));
        remember(panel, "id", panel.getAttribute("id"));
        remember(panel, "aria-labelledby", panel.getAttribute("aria-labelledby"));
        remember(panel, "hidden", panel.hasAttribute("hidden") ? "" : null);
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        ensurePanelId(panel, tab, index, base);
      }
    });

    activateTab(root, tabsRoot, selected, false);
  });
}

function setupAccordions(root) {
  queryAll(root, "[data-fds-accordion][data-exclusive='true']").forEach((accordion) => {
    if (!accordion || !ownsTarget(root, accordion)) return;
    const openItems = getAccordionItems(root, accordion).filter((item) => item.open);
    openItems.slice(1).forEach((item) => {
      item.open = false;
    });
  });
}

function setupDropdowns(root, remember) {
  queryAll(root, "[data-fds-dropdown]").forEach((dropdown) => {
    if (!ownsTarget(root, dropdown)) return;
    const trigger = dropdown.querySelector("[data-fds-dropdown-trigger]");
    const panel = trigger ? getById(root, trigger.getAttribute("aria-controls")) : null;
    if (!(trigger instanceof HTMLButtonElement) || !panel || !dropdown.contains(panel)) return;
    remember(trigger, "aria-expanded", trigger.getAttribute("aria-expanded"));
    remember(panel, "hidden", panel.hasAttribute("hidden") ? "" : null);
    trigger.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
  });
}

function setDropdown(root, dropdown, open, restoreFocus = false) {
  const trigger = dropdown.querySelector("[data-fds-dropdown-trigger]");
  const panel = trigger ? getById(root, trigger.getAttribute("aria-controls")) : null;
  if (!(trigger instanceof HTMLButtonElement) || !panel) return;
  panel.hidden = !open;
  trigger.setAttribute("aria-expanded", open ? "true" : "false");
  if (!open && restoreFocus) trigger.focus();
}

function createController(root) {
  const doc = ownerDocument(root);
  const originalAttrs = new Map();
  const ownedDialogs = new Set();
  const lastDialogFocus = new WeakMap();
  const listeners = [];
  let generatedId = 0;
  let destroyed = false;

  const remember = (element, attr, value) => {
    let attrs = originalAttrs.get(element);
    if (!attrs) {
      attrs = new Map();
      originalAttrs.set(element, attrs);
    }
    if (attrs.has(attr)) return;

    let states = originalAttributeStates.get(element);
    if (!states) {
      states = new Map();
      originalAttributeStates.set(element, states);
    }
    let state = states.get(attr);
    if (!state) {
      state = { value, count: 0 };
      states.set(attr, state);
    }
    state.count += 1;
    attrs.set(attr, state);
  };

  const on = (target, type, listener, options) => {
    target.addEventListener(type, listener, options);
    listeners.push([target, type, listener, options]);
  };

  const closeDropdowns = (except, restoreFocus = false) => {
    queryAll(root, "[data-fds-dropdown]").forEach((dropdown) => {
      if (dropdown !== except && ownsTarget(root, dropdown)) setDropdown(root, dropdown, false, restoreFocus);
    });
  };

  const nextId = () => {
    generatedId += 1;
    return `fds-tabs-${generatedId}`;
  };

  setupTabs(root, remember, nextId);
  setupAccordions(root);
  setupDropdowns(root, remember);

  on(root, "click", (event) => {
    if (!ownsTarget(root, event.target)) return;

    const tab = closestElement(event.target, "[role='tab']", root);
    if (tab) {
      const tabsRoot = tab.closest("[data-fds-tabs]");
      if (tabsRoot && ownsTarget(root, tabsRoot)) activateTab(root, tabsRoot, tab);
      return;
    }

    const opener = closestElement(event.target, "[data-fds-dialog-open]", root);
    if (opener) {
      const id = opener.getAttribute("data-fds-dialog-open");
      const dialog = getById(root, id);
      if (dialog instanceof HTMLDialogElement && ownsTarget(root, dialog) && !dialog.open) {
        const restore = doc.activeElement instanceof HTMLElement ? doc.activeElement : opener;
        dialog.showModal();
        lastDialogFocus.set(dialog, restore);
        ownedDialogs.add(dialog);
        dispatch(dialog, "fds:dialogchange", { id, open: true });
      }
      return;
    }

    const closer = closestElement(event.target, "[data-fds-dialog-close]", root);
    if (closer) {
      const dialog = closer.closest("dialog");
      if (dialog instanceof HTMLDialogElement && ownedDialogs.has(dialog)) dialog.close();
      return;
    }

    const trigger = closestElement(event.target, "[data-fds-dropdown-trigger]", root);
    if (trigger) {
      const dropdown = trigger.closest("[data-fds-dropdown]");
      const panel = getById(root, trigger.getAttribute("aria-controls"));
      if (dropdown && panel && dropdown.contains(panel)) {
        const open = panel.hidden;
        closeDropdowns(dropdown);
        setDropdown(root, dropdown, open);
      }
      return;
    }

    closeDropdowns();
  });

  on(root, "keydown", (event) => {
    if (!ownsTarget(root, event.target)) return;

    const tab = closestElement(event.target, "[role='tab']", root);
    if (tab) {
      const tabsRoot = tab.closest("[data-fds-tabs]");
      if (!tabsRoot || !ownsTarget(root, tabsRoot)) return;
      const tabs = getTabs(root, tabsRoot);
      const index = tabs.indexOf(tab);
      const orientation = tabsRoot.querySelector("[role='tablist']")?.getAttribute("aria-orientation") || tabsRoot.getAttribute("aria-orientation");
      let next = null;
      if (event.key === "ArrowRight") next = nextEnabledTab(tabs, index, 1);
      if (event.key === "ArrowLeft") next = nextEnabledTab(tabs, index, -1);
      if (orientation === "vertical" && event.key === "ArrowDown") next = nextEnabledTab(tabs, index, 1);
      if (orientation === "vertical" && event.key === "ArrowUp") next = nextEnabledTab(tabs, index, -1);
      if (event.key === "Home") next = tabs.find((candidate) => !isDisabled(candidate));
      if (event.key === "End") next = [...tabs].reverse().find((candidate) => !isDisabled(candidate));
      if (next) {
        event.preventDefault();
        next.focus();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateTab(root, tabsRoot, tab);
      }
      return;
    }

    const dropdown = closestElement(event.target, "[data-fds-dropdown]", root);
    if (dropdown && event.key === "Escape") {
      event.preventDefault();
      setDropdown(root, dropdown, false, true);
    }
  });

  on(root, "toggle", (event) => {
    if (!ownsTarget(root, event.target)) return;
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;
    const accordion = details.closest("[data-fds-accordion][data-exclusive='true']");
    if (!accordion || !ownsTarget(root, accordion)) return;
    getAccordionItems(root, accordion).filter((item) => item.open).forEach((item) => {
      if (item !== details && ownsTarget(root, item)) item.open = false;
    });
  }, true);

  on(root, "focusout", (event) => {
    const dropdown = closestElement(event.target, "[data-fds-dropdown]", root);
    if (!dropdown) return;
    const next = event.relatedTarget;
    if (!next || !dropdown.contains(next)) setDropdown(root, dropdown, false);
  });

  if (doc) {
    on(doc, "click", (event) => {
      if (!contains(root, event.target)) closeDropdowns();
    });

    on(doc, "keydown", (event) => {
      if (event.key !== "Escape") return;
      queryAll(root, "[data-fds-dropdown]").forEach((dropdown) => {
        if (ownsTarget(root, dropdown)) setDropdown(root, dropdown, false, dropdown.contains(doc.activeElement));
      });
    });
  }

  queryAll(root, "dialog").forEach((dialog) => {
    on(dialog, "close", () => {
      if (!ownedDialogs.has(dialog)) return;
      const id = dialog.id || "";
      ownedDialogs.delete(dialog);
      dispatch(dialog, "fds:dialogchange", { id, open: false });
      const restore = lastDialogFocus.get(dialog);
      lastDialogFocus.delete(dialog);
      if (restore instanceof HTMLElement && contains(root, restore)) restore.focus();
    });
  });

  activeRoots.add(root);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.forEach(([target, type, listener, options]) => {
        target.removeEventListener(type, listener, options);
      });
      ownedDialogs.forEach((dialog) => {
        if (dialog.open) dialog.close();
      });
      originalAttrs.forEach((attrs, element) => {
        const activeOwner = closestActiveRoot(element);
        attrs.forEach((state, attr) => {
          const shouldRestore = state.count <= 1 && (!activeOwner || activeOwner === root);
          if (shouldRestore) {
            if (state.value === null) element.removeAttribute(attr);
            else element.setAttribute(attr, state.value);
          }
          state.count -= 1;
          if (state.count <= 0) {
            originalAttributeStates.get(element)?.delete(attr);
          }
        });
      });
      activeRoots.delete(root);
      controllers.delete(root);
    },
  };
}

export function initFamilySystem(root = defaultRoot()) {
  if (!root || typeof root.querySelectorAll !== "function") {
    throw new TypeError("initFamilySystem requires an HTMLElement or Document root.");
  }
  const existing = controllers.get(root);
  if (existing) return existing;
  const controller = createController(root);
  controllers.set(root, controller);
  return controller;
}
