/** Native, progressively enhanced interactions. No imports or framework runtime. */
const instances = new WeakMap();
export function initOpalhaus(root = globalThis.document) {
  if (!root?.querySelectorAll) throw new TypeError('initOpalhaus requires a Document or Element.');
  if (instances.has(root)) return instances.get(root);
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const win = doc.defaultView;
  const cleanups = [];
  const saved = new Map();
  const initialized = new WeakSet();
  let destroyed = false;
  const mobile = win.matchMedia('(max-width: 809.98px)');
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const find = selector => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)].filter(el => el.closest('.ods'));
  function set(el, name, value) {
    if (!saved.has(el)) saved.set(el, new Map());
    if (!saved.get(el).has(name)) saved.get(el).set(name, el.getAttribute(name));
    if (value === null) el.removeAttribute(name); else el.setAttribute(name, value);
  }
  function on(el, event, fn) {
    el.addEventListener(event, fn);
    cleanups.push(() => el.removeEventListener(event, fn));
  }
  const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      set(entry.target, 'data-ods-pending', null);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 }) : null;
  on(reduced, 'change', () => {
    if (reduced.matches) for (const el of find('[data-ods-pending]')) {
      set(el, 'data-ods-pending', null);
      observer?.unobserve(el);
    }
  });
  function refresh() {
    if (destroyed) return;
    for (const nav of find('.ods-nav')) {
      if (initialized.has(nav)) continue;
      const button = nav.querySelector('[data-ods-nav-toggle]');
      const panel = nav.querySelector('[data-ods-nav-panel]');
      if (!button || !panel?.id || button.getAttribute('aria-controls') !== panel.id) continue;
      initialized.add(nav);
      let open = false;
      const sync = () => {
        set(button, 'aria-expanded', String(!mobile.matches || open));
        set(panel, 'hidden', mobile.matches && !open ? '' : null);
      };
      const close = returnFocus => {
        if (returnFocus && panel.contains(doc.activeElement)) button.focus();
        open = false;
        sync();
      };
      set(nav, 'data-ods-enhanced', '');
      on(button, 'click', () => { open = !open; sync(); });
      on(nav, 'keydown', event => {
        if (event.key === 'Escape' && mobile.matches && open) {
          event.preventDefault();
          close(true);
          button.focus();
        }
      });
      on(panel, 'click', event => {
        if (event.target.closest?.('a[href]') && mobile.matches) close(true);
      });
      on(doc, 'click', event => { if (!nav.contains(event.target) && mobile.matches && open) close(true); });
      on(nav, 'focusout', event => {
        if (event.relatedTarget && !nav.contains(event.relatedTarget) && mobile.matches && open) close(false);
      });
      on(mobile, 'change', () => {
        if (mobile.matches && panel.contains(doc.activeElement)) button.focus();
        open = false;
        sync();
      });
      sync();
    }
    for (const el of find('[data-ods-reveal]')) {
      if (initialized.has(el)) continue;
      initialized.add(el);
      if (observer && !reduced.matches) { set(el, 'data-ods-pending', ''); observer.observe(el); }
    }
    for (const button of find('[data-ods-ticker-toggle]')) {
      if (initialized.has(button)) continue;
      const ticker = button.closest('.ods-ticker');
      if (!ticker) continue;
      initialized.add(button);
      set(button, 'aria-pressed', String(ticker.dataset.paused === 'true'));
      on(button, 'click', () => {
        const paused = ticker.dataset.paused !== 'true';
        set(ticker, 'data-paused', String(paused));
        set(button, 'aria-pressed', String(paused));
      });
    }
    for (const link of find('a.ods-button[aria-disabled="true"]')) {
      if (initialized.has(link)) continue;
      initialized.add(link);
      on(link, 'click', event => { if (link.getAttribute('aria-disabled') === 'true') event.preventDefault(); });
    }
  }
  const controller = { refresh, destroy() {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    for (const cleanup of cleanups.reverse()) cleanup();
    for (const [el, attrs] of saved) for (const [name, value] of attrs) {
      if (value === null) el.removeAttribute(name); else el.setAttribute(name, value);
    }
    saved.clear();
    instances.delete(root);
  } };
  instances.set(root, controller);
  refresh();
  return controller;
}
