(function () {
  "use strict";

  var cleanup = null;
  var timers = [];

  function icon(name) {
    return '<span class="material-symbols-rounded" aria-hidden="true">' + name + "</span>";
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function jsonForScript(value) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
  }

  function clearTimers() {
    timers.forEach(function (timer) {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers = [];
  }

  function later(fn, delay, interval) {
    var timer = interval ? setInterval(fn, delay) : setTimeout(fn, delay);
    timers.push(timer);
    return timer;
  }

  function setText(root, selector, text) {
    var el = root.querySelector(selector);
    if (el) el.textContent = text;
  }

  function sample(id) {
    var samples = {
      switch:
        '<div class="contract-sample iw-sample iw-switch-sample" data-iw-sample="switch">' +
        '<button class="iw-switch" id="iw-switch-control" type="button" role="switch" aria-checked="false" data-iw-switch>' +
        '<span class="iw-switch-track"><span class="iw-switch-thumb"></span></span><span class="iw-switch-copy">집중 모드</span>' +
        "</button>" +
        '<output id="iw-switch-output" aria-live="polite">off</output>' +
        "</div>",
      checkbox:
        '<div class="contract-sample iw-sample iw-checkbox-sample" data-iw-sample="checkbox">' +
        '<fieldset class="iw-checkset">' +
        '<legend>표시할 항목</legend>' +
        '<label><input type="checkbox" data-iw-check value="메일"> <span>메일</span></label>' +
        '<label><input type="checkbox" data-iw-check value="파일"> <span>파일</span></label>' +
        '<label><input type="checkbox" data-iw-check value="일정"> <span>일정</span></label>' +
        "</fieldset>" +
        '<output id="iw-checkbox-output" aria-live="polite">0 selected</output>' +
        "</div>",
      "keyboard-tabs":
        '<div class="contract-sample iw-sample" data-iw-sample="keyboard-tabs">' +
        '<div class="iw-tabs" data-iw-tabs>' +
        '<div class="iw-tablist" role="tablist" aria-label="키보드 탭 샘플">' +
        '<button id="iw-tab-mail" type="button" role="tab" aria-selected="true" tabindex="0" aria-controls="iw-panel-mail" data-iw-tab>메일</button>' +
        '<button id="iw-tab-drive" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="iw-panel-drive" data-iw-tab>드라이브</button>' +
        '<button id="iw-tab-calendar" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="iw-panel-calendar" data-iw-tab>캘린더</button>' +
        "</div>" +
        '<div class="iw-tabpanels">' +
        '<section id="iw-panel-mail" role="tabpanel" aria-labelledby="iw-tab-mail" data-iw-panel>읽지 않은 항목과 빠른 작업을 먼저 보여줍니다.</section>' +
        '<section id="iw-panel-drive" role="tabpanel" aria-labelledby="iw-tab-drive" data-iw-panel hidden>최근 파일과 공유 상태를 같은 밀도로 보여줍니다.</section>' +
        '<section id="iw-panel-calendar" role="tabpanel" aria-labelledby="iw-tab-calendar" data-iw-panel hidden>오늘 일정과 다음 회의 액션을 연결합니다.</section>' +
        "</div>" +
        "</div>" +
        '<output id="iw-tabs-output" aria-live="polite">메일 selected</output>' +
        "</div>",
      menu:
        '<div class="contract-sample iw-sample iw-menu-sample" data-iw-sample="menu">' +
        '<div class="iw-menu-wrap" data-iw-menu-wrap>' +
        '<button class="btn tonal" id="iw-menu-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="iw-menu" data-iw-menu-button>' +
        icon("more_vert") +
        " 작업</button>" +
        '<div class="iw-menu" id="iw-menu" role="menu" aria-labelledby="iw-menu-button" hidden data-iw-menu>' +
        '<button type="button" role="menuitem" data-iw-menu-item>보관</button>' +
        '<button type="button" role="menuitem" data-iw-menu-item>링크 복사</button>' +
        '<button type="button" role="menuitem" data-iw-menu-item>삭제</button>' +
        "</div>" +
        "</div>" +
        '<output id="iw-menu-output" aria-live="polite">closed</output>' +
        "</div>",
      "text-field":
        '<div class="contract-sample iw-sample" data-iw-sample="text-field">' +
        '<form class="iw-field-form" data-iw-field-form novalidate>' +
        '<label for="iw-text-field">프로젝트 코드</label>' +
        '<input id="iw-text-field" data-iw-text-field autocomplete="off" spellcheck="false" aria-describedby="iw-field-helper" placeholder="GDS-124" pattern="GDS-[0-9]{3}">' +
        '<p id="iw-field-helper" data-iw-field-helper>GDS-000 형식으로 입력하세요.</p>' +
        '<button class="btn filled" type="submit">확인</button>' +
        "</form>" +
        '<output id="iw-field-output" aria-live="polite">idle</output>' +
        "</div>",
      progress:
        '<div class="contract-sample iw-sample" data-iw-sample="progress">' +
        '<div class="iw-progress-card">' +
        '<div class="iw-progress-head"><span>동기화</span><strong data-iw-progress-value>0%</strong></div>' +
        '<div class="iw-progress-track" role="progressbar" aria-label="동기화 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-iw-progressbar><span></span></div>' +
        '<button class="btn tonal" type="button" data-iw-progress-action>시작</button>' +
        "</div>" +
        '<output id="iw-progress-output" aria-live="polite">ready</output>' +
        "</div>"
    };
    return samples[id] || "";
  }

  function motionLab(data) {
    var motion = data && data.designLibrary && data.designLibrary.motion ? data.designLibrary.motion : {};
    var recipes = Array.isArray(motion.recipes) ? motion.recipes : [];
    var easings = motion.easings || {};
    var recipeOptions = recipes
      .map(function (recipe) {
        return '<option value="' + esc(recipe.id) + '">' + esc(recipe.name) + "</option>";
      })
      .join("");
    var easingOptions = Object.keys(easings)
      .map(function (key) {
        return '<option value="' + esc(key) + '">' + esc(key) + "</option>";
      })
      .join("");
    var first = recipes[0] || { id: "selection", name: "선택 이동", duration: 200, easing: "standard", properties: "transform", usage: "navigation" };
    var firstEasing = first.easing || Object.keys(easings)[0] || "standard";
    return (
      '<section class="iw-motion-lab card full" data-iw-motion-lab>' +
      '<div class="iw-motion-head">' +
      '<div><span class="eyebrow">Motion Lab</span><h3>모션 레시피 실험실</h3><p>공식 duration/easing 토큰을 500ms 이하의 제품형 인터랙션으로 재생합니다.</p><div class="iw-motion-badges"><span class="tag">reconstructed</span><span class="tag">timing approximation</span><span class="tag">icon geometry substitute</span></div></div>' +
      '<output id="iw-motion-output" aria-live="polite">대기 중</output>' +
      "</div>" +
      '<div class="iw-motion-grid">' +
      '<div class="iw-motion-controls">' +
      '<label>레시피<select id="iw-motion-recipe" data-iw-motion-recipe>' + recipeOptions + "</select></label>" +
      '<label>길이 <span data-iw-motion-duration-label>' + esc(first.duration) + 'ms</span><input id="iw-motion-duration" data-iw-motion-duration type="range" min="50" max="500" step="50" value="' + esc(Math.min(500, first.duration || 200)) + '"></label>' +
      '<label>이징<select id="iw-motion-easing" data-iw-motion-easing>' + easingOptions + "</select></label>" +
      '<div class="iw-motion-actions"><button class="btn filled" type="button" data-iw-motion-replay>' + icon("play_arrow") + '재생</button><button class="btn tonal" type="button" data-iw-motion-reverse>' + icon("swap_horiz") + "반전</button></div>" +
      "</div>" +
      '<div class="iw-motion-preview">' +
      '<div class="iw-motion-stage" aria-label="모션 미리보기"><div class="iw-motion-trace"><span></span></div><div class="iw-motion-dot" data-iw-motion-dot></div></div>' +
      '<div class="iw-motion-meta"><span class="tag" data-iw-motion-props>' + esc(first.properties || "transform") + '</span><span class="tag" data-iw-motion-usage>' + esc(first.usage || "") + "</span></div>" +
      "</div>" +
      '<div class="iw-motion-code"><label for="iw-motion-css">생성 CSS</label><textarea id="iw-motion-css" data-iw-motion-css readonly></textarea><button class="btn outlined" type="button" data-iw-motion-copy>' + icon("content_copy") + "CSS 복사</button></div>" +
      "</div>" +
      '<script type="application/json" data-iw-motion-data>' + jsonForScript({ recipes: recipes, easings: easings, selectedEasing: firstEasing }) + "<\/script>" +
      "</section>"
    );
  }

  function bindSwitch(root, signal) {
    root.querySelectorAll("[data-iw-switch]").forEach(function (button) {
      function toggle() {
        var checked = button.getAttribute("aria-checked") !== "true";
        button.setAttribute("aria-checked", String(checked));
        setText(button.closest("[data-iw-sample]"), "output", checked ? "on · aria-checked true" : "off");
      }
      button.addEventListener("click", toggle, { signal: signal });
      button.addEventListener("keydown", function (event) {
        if (event.key === " ") {
          event.preventDefault();
          toggle();
        }
      }, { signal: signal });
    });
  }

  function bindCheckbox(root, signal) {
    root.querySelectorAll('[data-iw-sample="checkbox"]').forEach(function (sampleRoot) {
      var boxes = Array.prototype.slice.call(sampleRoot.querySelectorAll("[data-iw-check]"));
      function update() {
        var checked = boxes.filter(function (box) { return box.checked; });
        setText(sampleRoot, "output", checked.length + " selected" + (checked.length ? " · " + checked.map(function (box) { return box.value; }).join(", ") : ""));
      }
      boxes.forEach(function (box) { box.addEventListener("change", update, { signal: signal }); });
      update();
    });
  }

  function bindTabs(root, signal) {
    root.querySelectorAll("[data-iw-tabs]").forEach(function (tabsRoot) {
      var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll("[data-iw-tab]"));
      var panels = Array.prototype.slice.call(tabsRoot.querySelectorAll("[data-iw-panel]"));
      function select(tab, focus) {
        tabs.forEach(function (item) {
          var active = item === tab;
          item.setAttribute("aria-selected", String(active));
          item.tabIndex = active ? 0 : -1;
        });
        panels.forEach(function (panel) { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
        setText(tabsRoot.closest("[data-iw-sample]"), "output", tab.textContent.trim() + " selected");
        if (focus) tab.focus();
      }
      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () { select(tab, false); }, { signal: signal });
        tab.addEventListener("keydown", function (event) {
          var next = null;
          if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
          if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
          if (event.key === "Home") next = tabs[0];
          if (event.key === "End") next = tabs[tabs.length - 1];
          if (next) {
            event.preventDefault();
            select(next, true);
          }
        }, { signal: signal });
      });
    });
  }

  function bindMenu(root, signal) {
    root.querySelectorAll("[data-iw-menu-wrap]").forEach(function (wrap) {
      var button = wrap.querySelector("[data-iw-menu-button]");
      var menu = wrap.querySelector("[data-iw-menu]");
      var items = Array.prototype.slice.call(wrap.querySelectorAll("[data-iw-menu-item]"));
      if (!button || !menu) return;
      function openMenu(focusIndex) {
        menu.hidden = false;
        button.setAttribute("aria-expanded", "true");
        setText(wrap.closest("[data-iw-sample]"), "output", "open · menu focus");
        var focusItem = items[typeof focusIndex === "number" ? focusIndex : 0];
        if (focusItem) focusItem.focus();
      }
      function closeMenu(message, restoreFocus) {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
        setText(wrap.closest("[data-iw-sample]"), "output", message || "closed");
        if (restoreFocus) button.focus();
      }
      button.addEventListener("click", function () {
        if (menu.hidden) openMenu();
        else closeMenu("closed", true);
      }, { signal: signal });
      button.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMenu(0);
        }
      }, { signal: signal });
      wrap.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !menu.hidden) {
          event.preventDefault();
          closeMenu("escape · focus returned", true);
        }
      }, { signal: signal });
      items.forEach(function (item, index) {
        item.addEventListener("click", function () { closeMenu(item.textContent.trim() + " selected", true); }, { signal: signal });
        item.addEventListener("keydown", function (event) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            items[(index + 1) % items.length].focus();
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            items[(index - 1 + items.length) % items.length].focus();
          }
          if (event.key === "Home") {
            event.preventDefault();
            items[0].focus();
          }
          if (event.key === "End") {
            event.preventDefault();
            items[items.length - 1].focus();
          }
        }, { signal: signal });
      });
      document.addEventListener("pointerdown", function (event) {
        if (!menu.hidden && !wrap.contains(event.target)) closeMenu("outside click · focus returned", true);
      }, { signal: signal });
    });
  }

  function bindTextField(root, signal) {
    root.querySelectorAll("[data-iw-field-form]").forEach(function (form) {
      var input = form.querySelector("[data-iw-text-field]");
      var helper = form.querySelector("[data-iw-field-helper]");
      if (!input || !helper) return;
      function validate(showIdle) {
        var value = input.value.trim();
        var valid = /^GDS-[0-9]{3}$/.test(value);
        input.setAttribute("aria-invalid", value && !valid ? "true" : "false");
        form.classList.toggle("is-error", Boolean(value && !valid));
        form.classList.toggle("is-valid", valid);
        helper.textContent = !value && showIdle ? "GDS-000 형식으로 입력하세요." : valid ? "사용 가능한 코드입니다." : "예: GDS-124처럼 세 자리 숫자를 사용하세요.";
        setText(form.closest("[data-iw-sample]"), "output", valid ? "valid" : value ? "error" : "idle");
        return valid;
      }
      input.addEventListener("input", function () { validate(false); }, { signal: signal });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (validate(false)) setText(form.closest("[data-iw-sample]"), "output", "submitted · valid state");
        else input.focus();
      }, { signal: signal });
      validate(true);
    });
  }

  function bindProgress(root, signal) {
    root.querySelectorAll('[data-iw-sample="progress"]').forEach(function (sampleRoot) {
      var action = sampleRoot.querySelector("[data-iw-progress-action]");
      var bar = sampleRoot.querySelector("[data-iw-progressbar]");
      var fill = bar && bar.querySelector("span");
      var valueLabel = sampleRoot.querySelector("[data-iw-progress-value]");
      var running = false;
      var progress = 0;
      var interval = null;
      function paint(message) {
        if (fill) fill.style.width = progress + "%";
        if (bar) bar.setAttribute("aria-valuenow", String(progress));
        if (valueLabel) valueLabel.textContent = progress + "%";
        setText(sampleRoot, "output", message || (running ? "running" : "ready"));
      }
      function cancel() {
        running = false;
        clearInterval(interval);
        progress = 0;
        if (action) action.textContent = "시작";
        paint("cancelled");
      }
      function tick() {
        progress = Math.min(100, progress + 10);
        paint(progress === 100 ? "complete" : "running · cancellable");
        if (progress === 100) {
          clearInterval(interval);
          running = false;
          if (action) action.textContent = "다시 시작";
        }
      }
      action && action.addEventListener("click", function () {
        if (running) {
          cancel();
          return;
        }
        running = true;
        progress = 0;
        action.textContent = "취소";
        paint("running · cancellable");
        interval = later(tick, 250, true);
      }, { signal: signal });
      signal.addEventListener("abort", function () { clearInterval(interval); });
      paint("ready");
    });
  }

  function bindMotionLab(root, signal) {
    root.querySelectorAll("[data-iw-motion-lab]").forEach(function (lab) {
      var payloadNode = lab.querySelector("[data-iw-motion-data]");
      var payload = { recipes: [], easings: {} };
      try {
        payload = JSON.parse(payloadNode ? payloadNode.textContent : "{}");
      } catch (error) {}
      var recipes = payload.recipes || [];
      var easings = payload.easings || {};
      var recipeSelect = lab.querySelector("[data-iw-motion-recipe]");
      var durationInput = lab.querySelector("[data-iw-motion-duration]");
      var durationLabel = lab.querySelector("[data-iw-motion-duration-label]");
      var easingSelect = lab.querySelector("[data-iw-motion-easing]");
      var dot = lab.querySelector("[data-iw-motion-dot]");
      var css = lab.querySelector("[data-iw-motion-css]");
      var output = lab.querySelector("#iw-motion-output");
      var motionQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
      var reduced = Boolean(motionQuery && motionQuery.matches);
      var currentAnimation = null;
      var manualDuration = false;

      function selectedRecipe() {
        return recipes.filter(function (recipe) { return recipe.id === recipeSelect.value; })[0] || recipes[0] || {};
      }
      function selectedEasing() {
        return easings[easingSelect.value] || easingSelect.value || "cubic-bezier(0.2,0,0,1)";
      }
      function generatedCss(recipe) {
        var duration = Number(durationInput.value) || 200;
        var properties = recipe.properties || "opacity, transform";
        var transitions = properties.split(",").map(function (property) {
          return property.trim();
        }).filter(Boolean).map(function (property) {
          return property + " " + duration + "ms " + selectedEasing();
        }).join(",\n    ");
        return ".motion-sample {\n  transition:\n    " + transitions + ";\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .motion-sample {\n    transition-duration: 1ms;\n    transform: none;\n  }\n}";
      }
      function paint() {
        var recipe = selectedRecipe();
        var duration = Math.min(500, Math.max(50, Number(durationInput.value) || recipe.duration || 200));
        durationInput.value = String(duration);
        if (durationLabel) durationLabel.textContent = duration + "ms";
        var defaultEasing = recipe.easing || payload.selectedEasing;
        if (easings[defaultEasing] && !easingSelect.dataset.iwTouched) easingSelect.value = defaultEasing;
        setText(lab, "[data-iw-motion-props]", recipe.properties || "opacity, transform");
        setText(lab, "[data-iw-motion-usage]", recipe.usage || "");
        if (css) css.value = generatedCss(recipe);
      }
      function play(reverse) {
        var recipe = selectedRecipe();
        var duration = Number(durationInput.value) || 200;
        var easing = selectedEasing();
        var distance = lab.querySelector(".iw-motion-stage") ? Math.max(96, lab.querySelector(".iw-motion-stage").clientWidth - 76) : 160;
        var from = reverse ? distance : 0;
        var to = reverse ? 0 : distance;
        var recipeId = recipe.id || "";
        var properties = recipe.properties || "";
        if (currentAnimation && currentAnimation.cancel) currentAnimation.cancel();
        if (!dot) return;
        dot.classList.toggle("is-state-layer", recipeId === "state-layer");
        dot.classList.toggle("is-icon-state", recipeId === "icon-state");
        dot.style.transform = recipeId === "state-layer" || recipeId === "icon-state" ? "translateX(0)" : "translateX(" + from + "px)";
        dot.style.opacity = "1";
        dot.style.setProperty("--iw-duration", duration + "ms");
        dot.style.setProperty("--iw-easing", easing);
        var keyframes;
        if (recipeId === "state-layer" || properties === "opacity") {
          keyframes = [
            { transform: "translateX(0) scale(.96)", opacity: reverse ? 1 : 0.42 },
            { transform: "translateX(0) scale(1.08)", opacity: reverse ? 0.42 : 1 }
          ];
        } else if (recipeId === "icon-state" || properties.indexOf("font-variation-settings") >= 0) {
          keyframes = [
            { transform: "translateX(0) rotate(" + (reverse ? "12deg" : "-12deg") + ") scale(.9)", borderRadius: "12px" },
            { transform: "translateX(0) rotate(0deg) scale(1)", borderRadius: "50%" }
          ];
        } else {
          keyframes = [
            { transform: "translateX(" + from + "px) scale(.92)", opacity: properties.indexOf("opacity") >= 0 ? 0.72 : 1 },
            { transform: "translateX(" + to + "px) scale(1)", opacity: 1 }
          ];
        }
        if (reduced) {
          dot.style.transition = "none";
          dot.style.transform = "none";
          dot.style.opacity = "1";
          if (output) output.textContent = "reduced motion · instant state";
          return;
        }
        if (dot.animate) {
          currentAnimation = dot.animate(keyframes, { duration: duration, easing: easing, fill: "forwards" });
        } else {
          dot.style.transition = "transform " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing;
          requestAnimationFrame(function () {
            dot.style.transform = recipeId === "state-layer" || recipeId === "icon-state" ? "translateX(0) scale(1.08)" : "translateX(" + to + "px)";
          });
        }
        if (output) output.textContent = reduced ? "reduced motion · instant" : (reverse ? "reverse" : "replay") + " · " + recipe.name;
      }
      if (recipeSelect && recipes[0]) recipeSelect.value = recipes[0].id;
      if (easingSelect && payload.selectedEasing) easingSelect.value = payload.selectedEasing;
      recipeSelect && recipeSelect.addEventListener("input", function () {
        var recipe = selectedRecipe();
        if (durationInput && recipe.duration && !manualDuration) durationInput.value = String(Math.min(500, Math.max(50, recipe.duration)));
        if (easingSelect && recipe.easing && !easingSelect.dataset.iwTouched) easingSelect.value = recipe.easing;
        paint();
      }, { signal: signal });
      durationInput && durationInput.addEventListener("input", function () {
        manualDuration = true;
        paint();
      }, { signal: signal });
      easingSelect && easingSelect.addEventListener("input", function () {
        easingSelect.dataset.iwTouched = "true";
        paint();
      }, { signal: signal });
      lab.querySelector("[data-iw-motion-replay]") && lab.querySelector("[data-iw-motion-replay]").addEventListener("click", function () { paint(); play(false); }, { signal: signal });
      lab.querySelector("[data-iw-motion-reverse]") && lab.querySelector("[data-iw-motion-reverse]").addEventListener("click", function () { paint(); play(true); }, { signal: signal });
      lab.querySelector("[data-iw-motion-copy]") && lab.querySelector("[data-iw-motion-copy]").addEventListener("click", function () {
        if (!css) return;
        var copyValue = css.value;
        var done = function (message) {
          if (output) output.textContent = message;
        };
        if (window.DesignWorkbench && typeof window.DesignWorkbench.copyText === "function") {
          Promise.resolve(window.DesignWorkbench.copyText(copyValue)).then(function (copied) {
            done(copied ? "CSS copied" : "복사 실패 · 직접 선택됨");
          }).catch(function () {
            css.select();
            done("복사 실패 · 직접 선택됨");
          });
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyValue).then(function () {
            done("CSS copied");
          }).catch(function () {
            css.select();
            done("복사 실패 · 직접 선택됨");
          });
          return;
        }
        css.select();
        done("클립보드 미지원 · 직접 선택됨");
      }, { signal: signal });
      if (motionQuery) {
        var onMotionChange = function (event) {
          reduced = Boolean(event.matches);
          if (reduced && dot) {
            if (currentAnimation && currentAnimation.cancel) currentAnimation.cancel();
            dot.style.transition = "none";
            dot.style.transform = "none";
            dot.style.opacity = "1";
          }
          if (output) output.textContent = reduced ? "reduced motion · instant state" : "대기 중";
        };
        if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange, { signal: signal });
        else if (motionQuery.addListener) {
          motionQuery.addListener(onMotionChange);
          signal.addEventListener("abort", function () { motionQuery.removeListener(onMotionChange); });
        }
      }
      signal.addEventListener("abort", function () {
        if (currentAnimation && currentAnimation.cancel) currentAnimation.cancel();
      });
      paint();
    });
  }

  function bind() {
    if (cleanup) cleanup.abort();
    clearTimers();
    cleanup = new AbortController();
    var signal = cleanup.signal;
    var root = document;
    bindSwitch(root, signal);
    bindCheckbox(root, signal);
    bindTabs(root, signal);
    bindMenu(root, signal);
    bindTextField(root, signal);
    bindProgress(root, signal);
    bindMotionLab(root, signal);
  }

  window.InteractionWorkbench = {
    sample: sample,
    bind: bind,
    motionLab: motionLab
  };
})();
