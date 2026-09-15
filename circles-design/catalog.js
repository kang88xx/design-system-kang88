/* three circles catalog — motion toggle, replay/hover simulation, swatch copy, asset filter, sidebar active tracking. */
(function () {
  "use strict";
  var root = document.documentElement;
  var toggle = document.getElementById("motion-toggle");
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  function setReduce(on) { root.classList.toggle("reduce-motion", on); if (toggle) { toggle.setAttribute("aria-pressed", String(on)); toggle.textContent = on ? "모션 켜기" : "모션 줄이기"; } }
  setReduce(mq.matches);
  if (toggle) toggle.addEventListener("click", function () { setReduce(!root.classList.contains("reduce-motion")); });
  // replay: remove/re-add animation class
  document.querySelectorAll("[data-replay]").forEach(function (b) {
    b.addEventListener("click", function () {
      var target = document.querySelector(b.getAttribute("data-replay")); if (!target) return;
      target.classList.remove("tc-appear"); void target.offsetWidth; target.classList.add("tc-appear");
    });
  });
  // simulate hover on touch / keyboard
  document.querySelectorAll("[data-hover]").forEach(function (b) {
    b.addEventListener("click", function () { var t = document.querySelector(b.getAttribute("data-hover")); if (!t) return; t.classList.toggle("is-hover"); t.classList.toggle("is-open"); b.setAttribute("aria-pressed", String(t.classList.contains("is-hover"))); });
  });
  // swatch copy
  document.querySelectorAll(".swatch").forEach(function (s) {
    s.addEventListener("click", function () {
      var hex = s.getAttribute("data-hex");
      function done() { if (window.asToast) window.asToast(hex + " 복사됨"); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(hex).then(done, done); else done();
    });
  });
  // asset filter
  var filters = document.querySelectorAll(".asset-filter button");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); f.setAttribute("aria-pressed", "true");
      var role = f.getAttribute("data-role");
      document.querySelectorAll(".asset").forEach(function (a) { a.hidden = role !== "all" && a.getAttribute("data-role") !== role; });
    });
  });
  // sidebar active section
  var links = Array.prototype.slice.call(document.querySelectorAll(".as-sidebar nav a[href^='#']"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (!e.isIntersecting) return; links.forEach(function (a) { var on = a.getAttribute("href") === "#" + e.target.id; a.classList.toggle("is-active", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }
  // scroll-spy demo: mark the nav card whose section is centred in the small scroller
  document.querySelectorAll(".tc-scrollspy-stage").forEach(function (stage) {
    var scroller = stage.querySelector(".scroller"); var cards = stage.querySelectorAll(".tc-navcard"); var sections = Array.prototype.slice.call(scroller.querySelectorAll("section"));
    function update() { var mid = scroller.scrollTop + scroller.clientHeight / 2; var idx = 0; sections.forEach(function (s, i) { if (s.offsetTop <= mid) idx = i; }); cards.forEach(function (c, i) { if (i === idx) { c.setAttribute("aria-current", "true"); c.classList.add("is-open"); } else { c.removeAttribute("aria-current"); c.classList.remove("is-open"); } }); }
    scroller.addEventListener("scroll", update); update();
  });
  // progressive blur toggle
  document.querySelectorAll("[data-blur-toggle]").forEach(function (b) { b.addEventListener("click", function () { var t = document.querySelector(b.getAttribute("data-blur-toggle")); var off = t.getAttribute("data-off") === "true"; t.setAttribute("data-off", off ? "false" : "true"); b.setAttribute("aria-pressed", String(off)); b.textContent = off ? "블러 끄기" : "블러 켜기"; }); });
  // menu button demo
  document.querySelectorAll(".tc-menu").forEach(function (b) { b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", String(open)); var panel = document.querySelector(b.getAttribute("aria-controls") ? "#" + b.getAttribute("aria-controls") : null); if (panel) panel.hidden = !open; }); });
  // sticky demo: scroll to middle so the effect is visible
  document.querySelectorAll(".tc-sticky-box").forEach(function (b) { b.scrollTop = 0; });
})();
