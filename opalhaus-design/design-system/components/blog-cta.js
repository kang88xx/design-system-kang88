/* Optional click integration. The anchor works, including hover, without JavaScript. */
(() => {
  function init(root = document) {
    root.querySelectorAll('.opal-blog-cta:not([data-cta-bound])').forEach(link => {
      link.dataset.ctaBound = 'true';
      link.addEventListener('pointerdown', () => { link.dataset.pressed = 'true'; });
      ['pointerup','pointercancel','pointerleave','blur'].forEach(type => link.addEventListener(type, () => { delete link.dataset.pressed; }));
      link.addEventListener('click', event => {
        delete link.dataset.pressed;
        const activate = new CustomEvent('opal:cta-activate', {bubbles:true,cancelable:true,detail:{href:link.getAttribute('href'),originalEvent:event}});
        if (!link.dispatchEvent(activate)) event.preventDefault();
        if (link.hasAttribute('data-preview')) {
          event.preventDefault();
          const output = root.querySelector('[data-cta-destination]');
          if (output) output.textContent = 'Destination: ' + link.getAttribute('href');
        }
      });
    });
  }
  function mount(target, options = {}) {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    host.innerHTML = "<a class=\"opal-blog-cta\" href=\"/blog\" data-preview><span class=\"opal-blog-cta__text\"><span>View All Blogs</span><span aria-hidden=\"true\">View All Blogs</span></span><span class=\"opal-blog-cta__circle\" aria-hidden=\"true\"><span class=\"opal-blog-cta__viewport\"><span class=\"opal-blog-cta__arrow opal-blog-cta__arrow--incoming\"><svg class=\"opal-blog-cta__incoming-caret\" viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M96 48L176 128L96 208\"/></svg><svg class=\"opal-blog-cta__incoming-arrow\" viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M48 128H208M136 56L208 128L136 200\"/></svg></span><span class=\"opal-blog-cta__arrow opal-blog-cta__arrow--outgoing\"><svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M48 128H208M136 56L208 128L136 200\"/></svg></span></span></span></a>";
    const link = host.querySelector('.opal-blog-cta');
    link.href = options.href || '/blog';
    link.querySelectorAll('.opal-blog-cta__text > span').forEach(span => { span.textContent = options.label || 'View All Blogs'; });
    if (options.preview) {
      const output = document.createElement('output'); output.dataset.ctaDestination=''; output.setAttribute('aria-live','polite');
      output.style.cssText='display:block;margin-top:24px;font:12px monospace;color:#777';output.textContent='Destination: —';host.append(output);
    } else link.removeAttribute('data-preview');
    init(host);return link;
  }
  window.OpalBlogCTA = {init,mount};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), {once:true}); else init();
})();
