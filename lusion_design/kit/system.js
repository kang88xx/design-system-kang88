const instances = new WeakMap();
const themes = new Set(["light", "dark", "system"]);
const focusable = "a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1']),[contenteditable='true']";
const MAX_DT = 1 / 20;

/**
 * Second-order dynamics presets (frequency, damping ratio, response).
 * Values were read from the public bundle; see research/interaction-evidence.md.
 */
export const dynamicsPresets = Object.freeze({
  pointer: Object.freeze({ frequency: 1.5, damping: .8, response: 2 }),
  cursor: Object.freeze({ frequency: 1, damping: .8, response: 1.2 }),
  focus: Object.freeze({ frequency: 1, damping: .6, response: 2 }),
  zoom: Object.freeze({ frequency: 2.2, damping: .7, response: 3 }),
  snap: Object.freeze({ frequency: 2.5, damping: .5, response: 2 }),
  drift: Object.freeze({ frequency: 1, damping: .65, response: 1.3 }),
  rotate: Object.freeze({ frequency: 1, damping: .85, response: 1.1 })
});

/**
 * Easing functions. `smooth` is the curve the public bundle names `ease.lusion`.
 */
export const ease = Object.freeze({
  linear: t => t,
  standard: cubicBezier(.4, 0, .1, 1),
  smooth: cubicBezier(.35, 0, 0, 1),
  enter: cubicBezier(.4, 0, 0, 1),
  out: cubicBezier(.16, 1, .3, 1),
  loop: cubicBezier(.1, 0, .1, 1),
  expoOut: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? .5 * Math.pow(2, 20 * t - 10) : 1 - .5 * Math.pow(2, -20 * t + 10)),
  cubicOut: t => 1 - Math.pow(1 - t, 3),
  cubicInOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  sineOut: t => Math.sin((t * Math.PI) / 2),
  backOut: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
});

/**
 * Build a CSS-compatible cubic-bezier easing function.
 */
export function cubicBezier(x1, y1, x2, y2) {
  for (const value of [x1, y1, x2, y2]) if (!Number.isFinite(value)) throw new TypeError("cubicBezier expects four finite numbers.");
  const sampleX = t => ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t;
  const sampleY = t => ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
  const slopeX = t => 3 * (1 - 3 * x2 + 3 * x1) * t * t + 2 * (3 * x2 - 6 * x1) * t + 3 * x1;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= (sampleX(t) - x) / slope;
    }
    if (t < 0 || t > 1) {
      let low = 0;
      let high = 1;
      t = x;
      for (let i = 0; i < 24; i++) {
        const current = sampleX(t);
        if (Math.abs(current - x) < 1e-6) break;
        if (current < x) low = t;
        else high = t;
        t = (low + high) / 2;
      }
    }
    return sampleY(t);
  };
}

/**
 * Frame-rate independent exponential smoothing: lerp(a, b, 1 - exp(-lambda * dt)).
 */
export function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Scalar second-order dynamics (frequency f, damping ratio z, response r).
 * `update(dt, target)` returns the new value; `reset(value)` snaps state.
 */
export function createDynamics(options = {}) {
  if (options === null || typeof options !== "object") throw new TypeError("createDynamics options must be an object.");
  const frequency = numberOption(options.frequency, dynamicsPresets.pointer.frequency, "frequency", 0.001, 60);
  const damping = numberOption(options.damping, dynamicsPresets.pointer.damping, "damping", 0, 4);
  const response = numberOption(options.response, dynamicsPresets.pointer.response, "response", -4, 4);
  const omega = Math.PI * 2 * frequency;
  const k1 = damping / (Math.PI * frequency);
  const k2 = 1 / (omega * omega);
  const k3 = (response * damping) / omega;
  const state = {
    value: 0,
    velocity: 0,
    update(dt, target, targetVelocity) {
      if (!Number.isFinite(dt) || dt < 0) throw new TypeError("dt must be a finite non-negative number.");
      if (!Number.isFinite(target)) throw new TypeError("target must be a finite number.");
      if (dt === 0) return state.value;
      const remaining = Math.min(dt, 0.25);
      let xd = targetVelocity;
      if (xd === undefined || !Number.isFinite(xd)) {
        xd = (target - state._target) / remaining;
      }
      state._target = target;
      let left = remaining;
      while (left > 0) {
        const step = Math.min(left, 1 / 120);
        left -= step;
        const stableK2 = Math.max(k2, (step * step) / 2 + (step * k1) / 2, step * k1);
        state.value += step * state.velocity;
        state.velocity += (step * (target + k3 * xd - state.value - k1 * state.velocity)) / stableK2;
      }
      if (!Number.isFinite(state.value) || !Number.isFinite(state.velocity)) {
        state.value = target;
        state.velocity = 0;
      }
      return state.value;
    },
    reset(value = 0) {
      if (!Number.isFinite(value)) throw new TypeError("reset value must be a finite number.");
      state.value = value;
      state.velocity = 0;
      state._target = value;
      return state.value;
    },
    settled(target, epsilon = 0.01) {
      return Math.abs(state.value - target) < epsilon && Math.abs(state.velocity) < epsilon * 10;
    },
    _target: 0
  };
  return state;
}

/**
 * Mount the framework-free design-system runtime on one `.ds-root`.
 * No work happens at import time and every listener stays scoped to `root`.
 *
 * @param {HTMLElement} root
 * @param {{ motion?: boolean }} [options]
 */
export function mount(root, options = {}) {
  assertRoot(root);
  assertMountOptions(options);
  const current = instances.get(root);
  if (current) return current.api;
  const runtime = createRuntime(root, options);
  instances.set(root, runtime);
  try {
    runtime.init();
  } catch (error) {
    instances.delete(root);
    runtime.api.destroy();
    throw error;
  }
  return runtime.api;
}

/**
 * Create a scalar spring with `update(dt, target)` and `reset(value)`.
 *
 * @param {{ frequency?: number, damping?: number, response?: number }} [options]
 */
export function createSpring(options = {}) {
  if (options === null || typeof options !== "object") throw new TypeError("createSpring options must be an object.");
  const frequency = numberOption(options.frequency, 2.8, "frequency", 0.001, 60);
  const damping = numberOption(options.damping, 0.82, "damping", 0, 4);
  const response = numberOption(options.response, 1, "response", 0.001, 1);
  const omega = Math.PI * 2 * frequency;
  const spring = {
    value: 0,
    update(dt, target) {
      if (!Number.isFinite(dt) || dt < 0) throw new TypeError("dt must be a finite non-negative number.");
      if (!Number.isFinite(target)) throw new TypeError("target must be a finite number.");
      if (dt === 0) return spring.value;
      const desired = spring._target + (target - spring._target) * response;
      const step = Math.min(dt, 0.064);
      const offset = spring.value - desired;
      const velocity = spring._velocity;
      let nextOffset;
      let nextVelocity;

      if (damping < 1) {
        const decay = Math.exp(-damping * omega * step);
        const dampedOmega = omega * Math.sqrt(1 - damping * damping);
        const sin = Math.sin(dampedOmega * step);
        const cos = Math.cos(dampedOmega * step);
        const shared = (velocity + damping * omega * offset) / dampedOmega;
        nextOffset = decay * (offset * cos + shared * sin);
        nextVelocity = decay * (velocity * cos - ((damping * omega * velocity + omega * omega * offset) / dampedOmega) * sin);
      } else if (damping === 1) {
        const decay = Math.exp(-omega * step);
        const shared = velocity + omega * offset;
        nextOffset = (offset + shared * step) * decay;
        nextVelocity = (velocity - omega * shared * step) * decay;
      } else {
        const root = Math.sqrt(damping * damping - 1);
        const r1 = -omega * (damping - root);
        const r2 = -omega * (damping + root);
        const c2 = (velocity - r1 * offset) / (r2 - r1);
        const c1 = offset - c2;
        const e1 = Math.exp(r1 * step);
        const e2 = Math.exp(r2 * step);
        nextOffset = c1 * e1 + c2 * e2;
        nextVelocity = c1 * r1 * e1 + c2 * r2 * e2;
      }

      spring.value = desired + nextOffset;
      spring._velocity = nextVelocity;
      spring._target = desired;
      return spring.value;
    },
    reset(value = 0) {
      if (!Number.isFinite(value)) throw new TypeError("reset value must be a finite number.");
      spring.value = value;
      spring._target = value;
      spring._velocity = 0;
      return spring.value;
    },
    _target: 0,
    _velocity: 0
  };
  return spring;
}

function createRuntime(root, options) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const abort = new win.AbortController();
  const signal = abort.signal;
  const cleanups = [];
  const timers = new Set();
  const createdToasts = new Set();
  const dialogFocus = new WeakMap();
  const openedDialogs = new Set();
  const panelFocus = new WeakMap();
  const motionCleanups = [];
  const tasks = new Set();
  let frame = 0;
  let lastFrameTime = 0;
  let createdToastRegion = null;
  let revealObserver = null;
  let passedObserver = null;
  let destroyed = false;
  const motionPreference = typeof win.matchMedia === "function"
    ? win.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  let motionEnabled = options.motion !== false && !(motionPreference && motionPreference.matches);
  const api = {
    destroy,
    notify,
    openDialog,
    closeDialog,
    setTheme,
    openPanel,
    closePanel,
    togglePanel,
    replay,
    addTask,
    get motion() {
      return motionEnabled;
    }
  };

  return { api, init };

  function init() {
    root.dataset.dsRuntime = "ready";
    setupTabs();
    setupDialogs();
    setupToasts();
    setupSplit();
    setupStagger();
    setupReveal();
    setupPanels();
    setupMagnetic();
    setupTilt();
    setupCursor();
    setupScrollProgress();
    setupMotionPreference();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const dialog of [...openedDialogs]) {
      if (!dialog.open || !isOwned(dialog)) continue;
      closeDialogElement(dialog);
      restoreFocus(dialog);
    }
    openedDialogs.clear();
    abort.abort();
    for (const timer of timers) win.clearTimeout(timer);
    timers.clear();
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    tasks.clear();
    if (revealObserver) revealObserver.disconnect();
    if (passedObserver) passedObserver.disconnect();
    for (const cleanup of cleanups.splice(0)) cleanup();
    for (const toast of createdToasts) toast.remove();
    createdToasts.clear();
    if (createdToastRegion) createdToastRegion.remove();
    delete root.dataset.dsRuntime;
    instances.delete(root);
  }

  function notify(message, options = {}) {
    if (destroyed) return;
    if (typeof message !== "string") throw new TypeError("notify message must be a string.");
    if (options === null || typeof options !== "object") throw new TypeError("notify options must be an object.");
    const duration = numberOption(options.duration, 2600, "duration", 0, 60000);
    const region = toastRegion();
    const toast = doc.createElement("div");
    toast.className = "ds-toast-item";
    toast.dataset.dsToastItem = "";
    toast.textContent = message;
    region.append(toast);
    createdToasts.add(toast);
    if (duration > 0) {
      const timer = win.setTimeout(() => {
        toast.remove();
        createdToasts.delete(toast);
        timers.delete(timer);
      }, duration);
      timers.add(timer);
    }
  }

  function openDialog(id) {
    if (destroyed) return;
    const dialog = byId("dialog", id);
    if (!dialog) throw new ReferenceError(`No dialog with id '${id}' exists inside this design-system root.`);
    if (dialog.open) return;
    const active = doc.activeElement instanceof win.HTMLElement ? doc.activeElement : null;
    if (active && isOwned(active) && !dialogFocus.has(dialog)) dialogFocus.set(dialog, active);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else {
      dialog.setAttribute("open", "");
      dialog.setAttribute("role", dialog.getAttribute("role") || "dialog");
      dialog.setAttribute("aria-modal", "true");
    }
    openedDialogs.add(dialog);
    focusDialog(dialog);
  }

  function closeDialog(id) {
    if (destroyed) return;
    const dialog = byId("dialog", id);
    if (!dialog) throw new ReferenceError(`No dialog with id '${id}' exists inside this design-system root.`);
    closeDialogElement(dialog);
  }

  function setTheme(theme) {
    if (destroyed) return;
    if (!themes.has(theme)) throw new TypeError("theme must be 'light', 'dark', or 'system'.");
    root.dataset.dsTheme = theme;
  }

  /* ---------------------------------------------------------------- Tabs */

  function setupTabs() {
    for (const group of scopedQueryAll("[data-ds-tabs]")) {
      const tabs = [...group.querySelectorAll("[role='tab']")].filter(tab => tab.closest("[data-ds-tabs]") === group && isOwned(tab));
      if (!tabs.length) continue;
      const enabledTabs = tabs.filter(isEnabledTab);
      selectTab(group, tabs, enabledTabs.find(tab => tab.getAttribute("aria-selected") === "true") || enabledTabs[0], false);
      group.addEventListener("click", event => {
        const tab = closest(event.target, "[role='tab']");
        if (!tab || !isEnabledTab(tab) || !group.contains(tab) || tab.closest("[data-ds-tabs]") !== group || !isOwned(tab)) return;
        selectTab(group, tabs, tab, true);
      }, { signal });
      group.addEventListener("keydown", event => {
        const tab = closest(event.target, "[role='tab']");
        if (!tab || event.target !== tab || !isEnabledTab(tab) || !group.contains(tab) || tab.closest("[data-ds-tabs]") !== group || !isOwned(tab)) return;
        const enabled = tabs.filter(isEnabledTab);
        if (!enabled.length) return;
        const current = enabled.indexOf(tab);
        let next = -1;
        const vertical = tabOrientation(group) === "vertical";
        if (!vertical && event.key === "ArrowRight") next = (current + 1) % enabled.length;
        if (!vertical && event.key === "ArrowLeft") next = (current - 1 + enabled.length) % enabled.length;
        if (vertical && event.key === "ArrowDown") next = (current + 1) % enabled.length;
        if (vertical && event.key === "ArrowUp") next = (current - 1 + enabled.length) % enabled.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = enabled.length - 1;
        if (next < 0) return;
        event.preventDefault();
        selectTab(group, tabs, enabled[next], true);
      }, { signal });
    }
  }

  function selectTab(group, tabs, selected, shouldFocus) {
    for (const tab of tabs) {
      const active = selected && tab === selected && isEnabledTab(tab);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
      const panelId = tab.getAttribute("aria-controls");
      const panel = panelId ? group.querySelector(`#${escapeId(panelId)}`) : null;
      if (panel && group.contains(panel) && isOwned(panel) && panel.closest("[data-ds-tabs]") === group) panel.hidden = !active;
    }
    if (selected && shouldFocus) selected.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------- Dialogs */

  function setupDialogs() {
    root.addEventListener("click", event => {
      const opener = closest(event.target, "[data-ds-dialog-open]");
      if (opener && isOwned(opener)) {
        event.preventDefault();
        openDialog(opener.dataset.dsDialogOpen);
        return;
      }
      const closer = closest(event.target, "[data-ds-dialog-close]");
      if (closer && isOwned(closer)) {
        event.preventDefault();
        const dialog = closer.closest("dialog");
        const id = closer.dataset.dsDialogClose || (dialog && dialog.id);
        if (id) closeDialog(id);
      }
    }, { signal });
    root.addEventListener("close", event => {
      if (typeof win.HTMLDialogElement !== "undefined" && event.target instanceof win.HTMLDialogElement && isOwned(event.target)) {
        restoreFocus(event.target);
        openedDialogs.delete(event.target);
      }
    }, { capture: true, signal });
    root.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      const fallback = scopedQueryAll("dialog[open]").reverse().find(dialog => typeof dialog.close !== "function");
      if (fallback) closeDialogElement(fallback);
    }, { signal });
  }

  function setupToasts() {
    root.addEventListener("click", event => {
      const trigger = closest(event.target, "[data-ds-toast]");
      if (!trigger || !isOwned(trigger)) return;
      event.preventDefault();
      notify(trigger.dataset.dsToast || trigger.getAttribute("aria-label") || trigger.textContent.trim());
    }, { signal });
  }

  /* ---------------------------------------------------------- Split text */

  function setupSplit() {
    for (const element of scopedQueryAll("[data-ds-split]")) {
      if (element.querySelector(".ds-split__word")) continue;
      const mode = element.dataset.dsSplit === "chars" ? "chars" : "words";
      const originalHtml = element.innerHTML;
      const hadLabel = element.hasAttribute("aria-label");
      const label = element.getAttribute("aria-label");
      const text = element.textContent;
      const wrapper = doc.createElement("span");
      wrapper.setAttribute("aria-hidden", "true");
      wrapper.className = "ds-split";
      let index = 0;
      for (const node of [...element.childNodes]) {
        if (node.nodeType === 3) {
          index = appendSplitText(wrapper, node.nodeValue, mode, index);
        } else if (node.nodeType === 1 && node.tagName === "BR") {
          wrapper.append(doc.createElement("br"));
        } else if (node.nodeType === 1) {
          const clone = node.cloneNode(false);
          index = appendSplitText(clone, node.textContent, mode, index);
          wrapper.append(clone);
        }
      }
      element.replaceChildren(wrapper);
      if (!hadLabel) element.setAttribute("aria-label", text.replace(/\s+/g, " ").trim());
      element.style.setProperty("--ds-n", String(index));
      cleanups.push(() => {
        element.innerHTML = originalHtml;
        if (hadLabel) element.setAttribute("aria-label", label);
        else element.removeAttribute("aria-label");
        element.style.removeProperty("--ds-n");
      });
    }
  }

  function appendSplitText(parent, value, mode, index) {
    const parts = value.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        parent.append(doc.createTextNode(" "));
        continue;
      }
      if (mode === "chars") {
        const word = doc.createElement("span");
        word.className = "ds-split__word";
        word.style.overflow = "visible";
        for (const character of [...part]) {
          const mask = doc.createElement("span");
          mask.className = "ds-split__word";
          const inner = doc.createElement("span");
          inner.className = "ds-split__inner";
          inner.style.setProperty("--ds-i", String(index++));
          inner.textContent = character;
          mask.append(inner);
          word.append(mask);
        }
        parent.append(word);
      } else {
        const mask = doc.createElement("span");
        mask.className = "ds-split__word";
        const inner = doc.createElement("span");
        inner.className = "ds-split__inner";
        inner.style.setProperty("--ds-i", String(index++));
        inner.textContent = part;
        mask.append(inner);
        parent.append(mask);
      }
    }
    return index;
  }

  /* ------------------------------------------------------------- Stagger */

  function setupStagger() {
    for (const group of scopedQueryAll("[data-ds-stagger]")) {
      const children = [...group.children];
      const snapshots = children.map(child => ({ child, i: child.style.getPropertyValue("--ds-i"), n: child.style.getPropertyValue("--ds-n") }));
      children.forEach((child, index) => {
        child.style.setProperty("--ds-i", String(index));
        child.style.setProperty("--ds-n", String(children.length));
      });
      const hadN = group.style.getPropertyValue("--ds-n");
      group.style.setProperty("--ds-n", String(children.length));
      const panel = group.parentElement && group.parentElement.matches("[data-ds-panel]") ? group.parentElement : null;
      const panelHadN = panel ? panel.style.getPropertyValue("--ds-n") : "";
      if (panel) panel.style.setProperty("--ds-n", String(children.length));
      cleanups.push(() => {
        for (const snapshot of snapshots) {
          if (snapshot.i) snapshot.child.style.setProperty("--ds-i", snapshot.i);
          else snapshot.child.style.removeProperty("--ds-i");
          if (snapshot.n) snapshot.child.style.setProperty("--ds-n", snapshot.n);
          else snapshot.child.style.removeProperty("--ds-n");
        }
        if (hadN) group.style.setProperty("--ds-n", hadN);
        else group.style.removeProperty("--ds-n");
        if (panel) {
          if (panelHadN) panel.style.setProperty("--ds-n", panelHadN);
          else panel.style.removeProperty("--ds-n");
        }
      });
    }
  }

  /* -------------------------------------------------------------- Reveal */

  function setupReveal() {
    const items = scopedQueryAll("[data-ds-reveal],[data-ds-split]");
    if (!items.length) return;
    const snapshots = items.map(item => ({ item, had: Object.hasOwn(item.dataset, "dsRevealState"), value: item.dataset.dsRevealState }));
    cleanups.push(() => {
      for (const snapshot of snapshots) {
        if (snapshot.had) snapshot.item.dataset.dsRevealState = snapshot.value;
        else delete snapshot.item.dataset.dsRevealState;
      }
    });
    for (const item of items) item.dataset.dsRevealState = "ready";
    if (!motionEnabled || typeof win.IntersectionObserver !== "function") {
      for (const item of items) item.dataset.dsRevealState = "visible";
      return;
    }
    const show = target => {
      target.dataset.dsRevealState = "visible";
      if (target.dataset.dsRevealRepeat === undefined) {
        revealObserver.unobserve(target);
        passedObserver.unobserve(target);
      }
    };
    revealObserver = new win.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) show(entry.target);
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    // A root extended far above the viewport reports elements that were jumped past
    // (anchor navigation, fast wheels) so they never stay hidden above the fold.
    passedObserver = new win.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting && entry.boundingClientRect.bottom < 0) show(entry.target);
    }, { rootMargin: "100000px 0px 0px 0px", threshold: 0 });
    for (const item of items) {
      if (item.dataset.dsRevealManual !== undefined) continue;
      revealObserver.observe(item);
      passedObserver.observe(item);
    }
  }

  function replay(target) {
    if (destroyed) return;
    const element = typeof target === "string" ? byId("", target) : target;
    if (!element || !isOwned(element)) throw new ReferenceError("replay(target) needs an element inside this design-system root.");
    if (!motionEnabled) {
      element.dataset.dsRevealState = "visible";
      return;
    }
    element.dataset.dsRevealState = "ready";
    void element.offsetWidth;
    win.requestAnimationFrame(() => {
      if (destroyed) return;
      element.dataset.dsRevealState = "visible";
    });
  }

  /* -------------------------------------------------------------- Panels */

  function setupPanels() {
    for (const panel of scopedQueryAll("[data-ds-panel]")) {
      const had = Object.hasOwn(panel.dataset, "dsPanelState");
      const value = panel.dataset.dsPanelState;
      if (panel.dataset.dsPanelState !== "open") {
        panel.dataset.dsPanelState = "closed";
        setInert(panel, true);
      }
      cleanups.push(() => {
        if (had) panel.dataset.dsPanelState = value;
        else delete panel.dataset.dsPanelState;
        setInert(panel, false);
      });
    }
    syncPanelOpeners();
    root.addEventListener("click", event => {
      const toggle = closest(event.target, "[data-ds-panel-toggle],[data-ds-panel-open]");
      if (toggle && isOwned(toggle)) {
        event.preventDefault();
        const id = toggle.dataset.dsPanelToggle || toggle.dataset.dsPanelOpen;
        if (toggle.dataset.dsPanelToggle !== undefined) togglePanel(id);
        else openPanel(id);
        return;
      }
      const closer = closest(event.target, "[data-ds-panel-close]");
      if (closer && isOwned(closer)) {
        event.preventDefault();
        const panel = closer.closest("[data-ds-panel]");
        const id = closer.dataset.dsPanelClose || (panel && panel.id);
        if (id) closePanel(id);
      }
    }, { signal });
    root.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      const open = scopedQueryAll("[data-ds-panel][data-ds-panel-state='open']").pop();
      if (open && open.id) {
        event.preventDefault();
        closePanel(open.id);
      }
    }, { signal });
  }

  function panelById(id) {
    const panel = byId("[data-ds-panel]", id);
    if (!panel) throw new ReferenceError(`No panel with id '${id}' exists inside this design-system root.`);
    return panel;
  }

  function openPanel(id) {
    if (destroyed) return;
    const panel = panelById(id);
    if (panel.dataset.dsPanelState === "open") return;
    const active = doc.activeElement instanceof win.HTMLElement ? doc.activeElement : null;
    if (active && isOwned(active)) panelFocus.set(panel, active);
    setInert(panel, false);
    panel.dataset.dsPanelState = "open";
    syncPanelOpeners();
    const target = panel.querySelector("[data-ds-autofocus]," + focusable);
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
  }

  function closePanel(id) {
    if (destroyed) return;
    const panel = panelById(id);
    if (panel.dataset.dsPanelState !== "open") return;
    panel.dataset.dsPanelState = "closed";
    setInert(panel, true);
    syncPanelOpeners();
    const previous = panelFocus.get(panel);
    panelFocus.delete(panel);
    if (previous && isOwned(previous) && typeof previous.focus === "function") previous.focus({ preventScroll: true });
  }

  function togglePanel(id) {
    if (destroyed) return;
    const panel = panelById(id);
    if (panel.dataset.dsPanelState === "open") closePanel(id);
    else openPanel(id);
  }

  function syncPanelOpeners() {
    for (const opener of scopedQueryAll("[data-ds-panel-toggle],[data-ds-panel-open]")) {
      const id = opener.dataset.dsPanelToggle || opener.dataset.dsPanelOpen;
      const panel = id ? scopedQuery(`[data-ds-panel]#${escapeId(id)}`) : null;
      if (!panel) continue;
      opener.setAttribute("aria-expanded", panel.dataset.dsPanelState === "open" ? "true" : "false");
      if (!opener.hasAttribute("aria-controls")) opener.setAttribute("aria-controls", id);
    }
  }

  function setInert(element, value) {
    if (value) element.setAttribute("inert", "");
    else element.removeAttribute("inert");
  }

  /* -------------------------------------------------------------- Ticker */

  function addTask(update) {
    if (destroyed) return () => {};
    if (typeof update !== "function") throw new TypeError("addTask expects a function.");
    tasks.add(update);
    startTicker();
    return () => tasks.delete(update);
  }

  function startTicker() {
    if (frame || destroyed || !tasks.size) return;
    lastFrameTime = win.performance.now();
    frame = win.requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    if (destroyed) return;
    const dt = Math.min(Math.max((now - lastFrameTime) / 1000, 0), MAX_DT);
    lastFrameTime = now;
    for (const task of [...tasks]) {
      let keep = false;
      try {
        keep = task(dt) !== false;
      } catch (error) {
        tasks.delete(task);
        throw error;
      }
      if (!keep) tasks.delete(task);
    }
    if (tasks.size) frame = win.requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------ Magnetic */

  function setupMagnetic() {
    for (const item of scopedQueryAll("[data-ds-magnetic]")) {
      const strength = attributeNumber(item.dataset.dsMagnetic, 0.18, 0, 0.6);
      const preset = dynamicsPresets[item.dataset.dsMagneticDynamics] || dynamicsPresets.snap;
      const dx = createDynamics(preset);
      const dy = createDynamics(preset);
      const snapshot = {
        x: item.style.getPropertyValue("--ds-magnetic-x"),
        y: item.style.getPropertyValue("--ds-magnetic-y"),
        hadState: Object.hasOwn(item.dataset, "dsMagneticState"),
        state: item.dataset.dsMagneticState
      };
      let targetX = 0;
      let targetY = 0;
      let active = false;
      let stop = null;
      const write = () => {
        item.style.setProperty("--ds-magnetic-x", `${dx.value.toFixed(2)}px`);
        item.style.setProperty("--ds-magnetic-y", `${dy.value.toFixed(2)}px`);
      };
      const run = dt => {
        dx.update(dt, targetX);
        dy.update(dt, targetY);
        write();
        if (!active && dx.settled(0, 0.05) && dy.settled(0, 0.05)) {
          finish();
          return false;
        }
        return true;
      };
      const finish = () => {
        stop = null;
        dx.reset(0);
        dy.reset(0);
        item.style.removeProperty("--ds-magnetic-x");
        item.style.removeProperty("--ds-magnetic-y");
        delete item.dataset.dsMagneticState;
      };
      const move = event => {
        if (!motionEnabled || event.pointerType === "touch") {
          reset();
          return;
        }
        const box = item.getBoundingClientRect();
        targetX = (event.clientX - box.left - box.width / 2) * strength;
        targetY = (event.clientY - box.top - box.height / 2) * strength;
        active = true;
        item.dataset.dsMagneticState = "active";
        if (!stop) {
          dx.update(1 / 60, targetX);
          dy.update(1 / 60, targetY);
          write();
          stop = addTask(run);
        }
      };
      const release = () => {
        active = false;
        targetX = 0;
        targetY = 0;
        item.dataset.dsMagneticState = "release";
        if (!stop && isOwned(item)) stop = addTask(run);
      };
      const reset = () => {
        if (!isOwned(item)) return;
        active = false;
        targetX = 0;
        targetY = 0;
        if (stop) stop();
        finish();
      };
      item.addEventListener("pointermove", move, { signal });
      item.addEventListener("pointerleave", release, { signal });
      item.addEventListener("blur", release, { signal });
      motionCleanups.push(reset);
      cleanups.push(() => {
        if (stop) stop();
        if (snapshot.x) item.style.setProperty("--ds-magnetic-x", snapshot.x);
        else item.style.removeProperty("--ds-magnetic-x");
        if (snapshot.y) item.style.setProperty("--ds-magnetic-y", snapshot.y);
        else item.style.removeProperty("--ds-magnetic-y");
        if (snapshot.hadState) item.dataset.dsMagneticState = snapshot.state;
        else delete item.dataset.dsMagneticState;
      });
    }
  }

  /* ---------------------------------------------------------------- Tilt */

  function setupTilt() {
    for (const item of scopedQueryAll("[data-ds-tilt]")) {
      const amount = attributeNumber(item.dataset.dsTilt, 6, 0, 30);
      const preset = dynamicsPresets[item.dataset.dsTiltDynamics] || dynamicsPresets.drift;
      const rx = createDynamics(preset);
      const ry = createDynamics(preset);
      const vars = ["--ds-tilt-x", "--ds-tilt-y", "--ds-tilt-px", "--ds-tilt-py"];
      const snapshot = vars.map(name => item.style.getPropertyValue(name));
      let px = 0;
      let py = 0;
      let stop = null;
      let hovering = false;
      const write = () => {
        item.style.setProperty("--ds-tilt-x", `${(rx.value * -amount).toFixed(3)}deg`);
        item.style.setProperty("--ds-tilt-y", `${(ry.value * amount).toFixed(3)}deg`);
        item.style.setProperty("--ds-tilt-px", ry.value.toFixed(4));
        item.style.setProperty("--ds-tilt-py", rx.value.toFixed(4));
      };
      const run = dt => {
        rx.update(dt, py);
        ry.update(dt, px);
        write();
        if (!hovering && rx.settled(0, 0.002) && ry.settled(0, 0.002)) {
          clear();
          return false;
        }
        return true;
      };
      const clear = () => {
        stop = null;
        rx.reset(0);
        ry.reset(0);
        for (const name of vars) item.style.removeProperty(name);
        delete item.dataset.dsTiltState;
      };
      const move = event => {
        if (!motionEnabled || event.pointerType === "touch") return;
        const box = item.getBoundingClientRect();
        if (!box.width || !box.height) return;
        px = clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1, 1);
        py = clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1, 1);
        hovering = true;
        item.dataset.dsTiltState = "active";
        if (!stop) stop = addTask(run);
      };
      const leave = () => {
        hovering = false;
        px = 0;
        py = 0;
        if (!stop && isOwned(item)) stop = addTask(run);
      };
      const reset = () => {
        hovering = false;
        px = 0;
        py = 0;
        if (stop) stop();
        clear();
      };
      item.addEventListener("pointermove", move, { signal });
      item.addEventListener("pointerleave", leave, { signal });
      motionCleanups.push(reset);
      cleanups.push(() => {
        if (stop) stop();
        vars.forEach((name, index) => {
          if (snapshot[index]) item.style.setProperty(name, snapshot[index]);
          else item.style.removeProperty(name);
        });
        delete item.dataset.dsTiltState;
      });
    }
  }

  /* -------------------------------------------------------------- Cursor */

  function setupCursor() {
    const cursor = scopedQuery("[data-ds-cursor]");
    if (!cursor) return;
    if (!cursor.hasAttribute("aria-hidden")) cursor.setAttribute("aria-hidden", "true");
    const label = cursor.querySelector("[data-ds-cursor-text]") || cursor;
    const preset = dynamicsPresets[cursor.dataset.dsCursorDynamics] || dynamicsPresets.pointer;
    const x = createDynamics(preset);
    const y = createDynamics(preset);
    const scale = createDynamics(dynamicsPresets.cursor);
    const vars = ["--ds-cursor-x", "--ds-cursor-y", "--ds-cursor-scale", "--ds-cursor-rotate"];
    const snapshot = vars.map(name => cursor.style.getPropertyValue(name));
    const originalText = label.textContent;
    let targetX = -100;
    let targetY = -100;
    let targetScale = 0;
    let stop = null;
    let seeded = false;
    const write = () => {
      cursor.style.setProperty("--ds-cursor-x", `${x.value.toFixed(1)}px`);
      cursor.style.setProperty("--ds-cursor-y", `${y.value.toFixed(1)}px`);
      cursor.style.setProperty("--ds-cursor-scale", Math.max(0, scale.value).toFixed(3));
    };
    const run = dt => {
      const previousX = x.value;
      const previousY = y.value;
      x.update(dt, targetX);
      y.update(dt, targetY);
      scale.update(dt, targetScale);
      const vx = (x.value - previousX) / Math.max(dt, 1e-3);
      const vy = (y.value - previousY) / Math.max(dt, 1e-3);
      const speed = Math.hypot(vx, vy);
      const stretch = Math.min(1.5, 1 + speed / 4000);
      cursor.style.setProperty("--ds-cursor-rotate", `${(Math.atan2(vy, vx) * 180 / Math.PI).toFixed(1)}deg`);
      cursor.style.setProperty("--ds-cursor-stretch", stretch.toFixed(3));
      write();
      if (targetScale === 0 && scale.settled(0, 0.01)) {
        stop = null;
        cursor.style.setProperty("--ds-cursor-scale", "0");
        delete cursor.dataset.dsCursorState;
        return false;
      }
      return true;
    };
    const move = event => {
      if (!motionEnabled || event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!seeded) {
        seeded = true;
        x.reset(targetX);
        y.reset(targetY);
      }
      const target = closest(event.target, "[data-ds-cursor-label]");
      const owned = target && isOwned(target) ? target : null;
      const nextScale = owned ? attributeNumber(owned.dataset.dsCursorScale, 1, 0.1, 3) : 0;
      if (owned) {
        const text = owned.dataset.dsCursorLabel;
        if (text && label.textContent !== text) label.textContent = text;
        cursor.dataset.dsCursorState = "active";
      }
      targetScale = nextScale;
      if (!stop && (targetScale > 0 || scale.value > 0)) stop = addTask(run);
    };
    const leave = () => {
      targetScale = 0;
      if (!stop && scale.value > 0) stop = addTask(run);
    };
    const reset = () => {
      targetScale = 0;
      if (stop) stop();
      stop = null;
      scale.reset(0);
      for (const name of vars) cursor.style.removeProperty(name);
      delete cursor.dataset.dsCursorState;
    };
    root.addEventListener("pointermove", move, { signal });
    root.addEventListener("pointerleave", leave, { signal });
    root.addEventListener("pointerdown", event => {
      if (event.pointerType === "touch") reset();
    }, { signal });
    motionCleanups.push(reset);
    cleanups.push(() => {
      if (stop) stop();
      label.textContent = originalText;
      vars.forEach((name, index) => {
        if (snapshot[index]) cursor.style.setProperty(name, snapshot[index]);
        else cursor.style.removeProperty(name);
      });
      cursor.style.removeProperty("--ds-cursor-stretch");
      delete cursor.dataset.dsCursorState;
    });
  }

  /* ----------------------------------------------------- Scroll progress */

  function setupScrollProgress() {
    const bars = scopedQueryAll("[data-ds-scroll-progress]");
    if (!bars.length) return;
    const entries = bars.map(bar => {
      const selector = bar.dataset.dsScrollProgress;
      let source = null;
      if (selector) {
        try {
          source = scopedQuery(selector);
        } catch {
          source = null;
        }
      }
      return {
        bar,
        source,
        value: 0,
        snapshot: bar.style.getPropertyValue("--ds-progress"),
        hadState: Object.hasOwn(bar.dataset, "dsScrollState")
      };
    });
    let stop = null;
    let lastInput = -Infinity;
    const readTarget = entry => {
      if (entry.source) {
        const max = entry.source.scrollHeight - entry.source.clientHeight;
        return max > 0 ? clamp(entry.source.scrollTop / max, 0, 1) : 0;
      }
      const max = doc.documentElement.scrollHeight - win.innerHeight;
      return max > 0 ? clamp(win.scrollY / max, 0, 1) : 0;
    };
    const apply = (entry, value) => {
      entry.value = value;
      entry.bar.style.setProperty("--ds-progress", value.toFixed(4));
    };
    const run = dt => {
      let moving = false;
      for (const entry of entries) {
        const target = readTarget(entry);
        const next = motionEnabled ? damp(entry.value, target, 10, dt) : target;
        apply(entry, Math.abs(next - target) < 0.0005 ? target : next);
        if (entry.value !== target) moving = true;
      }
      const idle = win.performance.now() - lastInput > 500;
      for (const entry of entries) entry.bar.dataset.dsScrollState = idle ? "idle" : "scrolling";
      if (!moving && idle) {
        stop = null;
        return false;
      }
      return true;
    };
    const onScroll = () => {
      lastInput = win.performance.now();
      if (!stop) stop = addTask(run);
    };
    for (const entry of entries) {
      apply(entry, readTarget(entry));
      entry.bar.dataset.dsScrollState = "idle";
      (entry.source || win).addEventListener("scroll", onScroll, { passive: true, signal });
    }
    win.addEventListener("resize", onScroll, { passive: true, signal });
    cleanups.push(() => {
      if (stop) stop();
      for (const entry of entries) {
        if (entry.snapshot) entry.bar.style.setProperty("--ds-progress", entry.snapshot);
        else entry.bar.style.removeProperty("--ds-progress");
        if (!entry.hadState) delete entry.bar.dataset.dsScrollState;
      }
    });
  }

  /* ------------------------------------------------------------- Helpers */

  function toastRegion() {
    const existing = scopedQuery("[data-ds-toast-region]");
    if (existing) {
      if (!existing.hasAttribute("role")) existing.setAttribute("role", "status");
      if (!existing.hasAttribute("aria-live")) existing.setAttribute("aria-live", "polite");
      if (!existing.hasAttribute("aria-atomic")) existing.setAttribute("aria-atomic", "true");
      return existing;
    }
    createdToastRegion = doc.createElement("div");
    createdToastRegion.dataset.dsToastRegion = "";
    createdToastRegion.setAttribute("role", "status");
    createdToastRegion.setAttribute("aria-live", "polite");
    createdToastRegion.setAttribute("aria-atomic", "true");
    root.append(createdToastRegion);
    return createdToastRegion;
  }

  function closeDialogElement(dialog) {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else {
      dialog.removeAttribute("open");
      restoreFocus(dialog);
    }
  }

  function restoreFocus(dialog) {
    const previous = dialogFocus.get(dialog);
    dialogFocus.delete(dialog);
    if (previous && isOwned(previous) && typeof previous.focus === "function") previous.focus({ preventScroll: true });
  }

  function focusDialog(dialog) {
    const target = dialog.querySelector("[data-ds-autofocus],[autofocus]," + focusable);
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
    else {
      if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
      dialog.focus({ preventScroll: true });
    }
  }

  function byId(selector, id) {
    if (typeof id !== "string" || !id) throw new TypeError("id must be a non-empty string.");
    return scopedQuery(`${selector}#${escapeId(id)}`);
  }

  function setupMotionPreference() {
    if (!motionPreference || options.motion === false) return;
    const update = event => {
      motionEnabled = !event.matches;
      if (motionEnabled) return;
      if (revealObserver) revealObserver.disconnect();
      if (passedObserver) passedObserver.disconnect();
      for (const item of scopedQueryAll("[data-ds-reveal],[data-ds-split]")) item.dataset.dsRevealState = "visible";
      for (const cleanup of motionCleanups) cleanup();
    };
    motionPreference.addEventListener("change", update, { signal });
  }

  function scopedQuery(selector) {
    return scopedQueryAll(selector)[0] || null;
  }

  function scopedQueryAll(selector) {
    return [...root.querySelectorAll(selector)].filter(isOwned);
  }

  function isOwned(element) {
    return root.contains(element) && element.closest(".ds-root") === root;
  }
}

function isEnabledTab(tab) {
  return !tab.disabled && tab.getAttribute("aria-disabled") !== "true";
}

function tabOrientation(group) {
  const tablist = group.querySelector("[role='tablist']");
  return (tablist && tablist.getAttribute("aria-orientation")) || group.getAttribute("aria-orientation") || "horizontal";
}

function assertRoot(root) {
  const win = root && root.ownerDocument && root.ownerDocument.defaultView;
  if (!win || !(root instanceof win.HTMLElement)) throw new TypeError("mount(root) requires an HTMLElement root.");
  if (!root.classList.contains("ds-root")) throw new TypeError("mount(root) requires an element with class 'ds-root'.");
}

function assertMountOptions(options) {
  if (options === null || typeof options !== "object") throw new TypeError("mount options must be an object.");
  if ("motion" in options && typeof options.motion !== "boolean") throw new TypeError("mount option 'motion' must be a boolean.");
}

function numberOption(value, fallback, label, min, max) {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < min || value > max) throw new TypeError(`${label} must be a finite number between ${min} and ${max}.`);
  return value;
}

function attributeNumber(value, fallback, min, max) {
  if (value === undefined || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function closest(target, selector) {
  return target && typeof target.closest === "function" ? target.closest(selector) : null;
}

function escapeId(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, character => `\\${character.codePointAt(0).toString(16)} `);
}
