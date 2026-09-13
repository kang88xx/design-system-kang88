(function () {
  'use strict';

  var mountedRoots = new Map();
  var controllers = new Set();
  var globalPaused = false;
  var speed = 1;
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = reduceQuery ? reduceQuery.matches : false;
  var hidden = document.hidden;

  function clampSpeed(value) {
    var next = Number(value);
    if (!Number.isFinite(next)) return 1;
    return Math.min(4, Math.max(.25, next));
  }

  function speedFactor() {
    return String(1 / speed);
  }

  function effectivePaused(controller) {
    return globalPaused || hidden || controller.inView === false;
  }

  function applyGlobalState() {
    document.documentElement.classList.toggle('rm-is-paused', globalPaused || hidden);
    document.documentElement.classList.toggle('rm-reduce-motion', reduced);
    document.documentElement.style.setProperty('--rm-speed-factor', speedFactor());
    controllers.forEach(function (controller) {
      controller.apply();
    });
  }

  function makeController(root, node) {
    var controller = {
      root: root,
      node: node,
      owners: new Set(),
      cleanups: [],
      animations: [],
      timers: [],
      inView: true,
      loop: Boolean(node.querySelector('.rm-loop')),
      active: true,
      apply: function () {
        if (!controller.active) return;
        var paused = effectivePaused(controller);
        controller.timers.slice().forEach(function (handle) { if (handle.retime) handle.retime(); });
        node.dataset.rmInview = String(controller.inView !== false);
        controller.animations.forEach(function (animation) {
          if (!animation) return;
          if (reduced) {
            if (animation.finish) {
              try { animation.finish(); } catch (error) {}
            }
            return;
          }
          if (animation.playbackRate !== undefined) animation.playbackRate = speed;
          if (paused && animation.pause) animation.pause();
          if (!paused && animation.play && animation.playState === 'paused') animation.play();
        });
      },
      cleanup: function () {
        if (!controller.active) return;
        controller.active = false;
        controller.cleanups.forEach(function (cleanup) { cleanup(); });
        controller.timers.forEach(function (timer) {
          timer.active = false;
          if (timer.raf) cancelAnimationFrame(timer.id);
          else {
            clearTimeout(timer.id);
            clearInterval(timer.id);
          }
        });
        controller.animations.slice().forEach(function (animation) {
          if (animation && animation.cancel) animation.cancel();
        });
        stopCssLoops(controller.node);
        controller.cleanups = [];
        controller.timers = [];
        controller.animations = [];
        controller.owners.forEach(function (entry) {
          var index = entry.controllers.indexOf(controller);
          if (index >= 0) entry.controllers.splice(index, 1);
        });
        controller.owners.clear();
        controllers.delete(controller);
      }
    };
    controllers.add(controller);
    return controller;
  }

  function on(target, type, handler, options, controller) {
    target.addEventListener(type, handler, options);
    controller.cleanups.push(function () {
      target.removeEventListener(type, handler, options);
    });
  }

  function timer(controller, fn, delay, repeat) {
    var remaining = reduced ? 0 : delay;
    var previousTime = performance.now();
    var previousSpeed = speed;
    var wasPaused = effectivePaused(controller);
    var handle = { id: 0, active: true, retime: schedule };
    function schedule() {
      clearTimeout(handle.id);
      if (!handle.active || !controller.active) return;
      var now = performance.now();
      if (!wasPaused) remaining -= (now - previousTime) * previousSpeed;
      previousTime = now;
      previousSpeed = speed;
      wasPaused = effectivePaused(controller);
      if (reduced) remaining = 0;
      handle.id = setTimeout(run, wasPaused && !reduced ? 100 : Math.max(0, remaining / speed));
    }
    function run() {
      if (!handle.active || !controller.active) return;
      if (!reduced && effectivePaused(controller)) { schedule(); return; }
      if (!repeat) {
        handle.active = false;
        var index = controller.timers.indexOf(handle);
        if (index >= 0) controller.timers.splice(index, 1);
      }
      fn();
      if (repeat && handle.active && controller.active) {
        remaining = delay;
        previousTime = performance.now();
        previousSpeed = speed;
        wasPaused = effectivePaused(controller);
        schedule();
      }
    }
    controller.timers.push(handle);
    schedule();
    return handle;
  }

  function animate(controller, element, keyframes, options, fallback) {
    if (!element) return null;
    var opts = Object.assign({}, options);
    if (element.animate && !reduced) {
      var animation = element.animate(keyframes, opts);
      animation.playbackRate = speed;
      controller.animations.push(animation);
      var settled = false;
      var remove = function () {
        var index = controller.animations.indexOf(animation);
        if (index >= 0) controller.animations.splice(index, 1);
      };
      var finish = function () {
        if (settled) return;
        settled = true;
        commitFinalStyles(animation, element, keyframes);
        if (animation.cancel) animation.cancel();
        remove();
      };
      var cancel = function () {
        if (settled) return;
        settled = true;
        remove();
      };
      if (animation.addEventListener) {
        animation.addEventListener('finish', finish, { once: true });
        animation.addEventListener('cancel', cancel, { once: true });
      } else {
        animation.onfinish = finish;
        animation.oncancel = cancel;
      }
      controller.apply();
      return animation;
    }
    if (typeof fallback === 'function') fallback(element);
    return null;
  }

  function commitFinalStyles(animation, element, keyframes) {
    if (animation.commitStyles) {
      try {
        animation.commitStyles();
        return;
      } catch (error) {}
    }
    var finalFrame = keyframes && keyframes[keyframes.length - 1];
    if (!finalFrame) return;
    Object.keys(finalFrame).forEach(function (property) {
      if (property === 'offset' || property === 'easing' || property === 'composite') return;
      element.style[property] = finalFrame[property];
    });
  }

  function loopElements(root) {
    return Array.prototype.slice.call(root.querySelectorAll('.rm-loop, .rm-anim, .rm-product, .rm-ping, .rm-mask'));
  }

  function stopCssLoops(root) {
    if (root.classList) root.classList.add('rm-js-stopped');
    loopElements(root).forEach(function (element) {
      element.style.animation = 'none';
    });
  }

  function restoreCssLoops(root) {
    if (root.classList) root.classList.remove('rm-js-stopped');
    loopElements(root).forEach(function (element) {
      element.style.animation = '';
    });
  }

  function drawSvgLines(controller, scope, selector, stagger) {
    var lines = Array.prototype.slice.call(scope.querySelectorAll(selector));
    lines.forEach(function (line, index) {
      if (!line.getTotalLength) return;
      var length = Math.ceil(line.getTotalLength());
      line.style.strokeDasharray = String(length);
      line.style.strokeDashoffset = String(length);
      timer(controller, function () {
        animate(controller, line, [
          { strokeDashoffset: length, opacity: .18 },
          { strokeDashoffset: 0, opacity: getComputedStyle(line).opacity || 1 }
        ], {
          duration: 760,
          easing: 'cubic-bezier(.16,1,.3,1)',
          fill: 'forwards'
        }, function () {
          line.style.strokeDashoffset = '0';
        });
      }, reduced ? 0 : index * stagger, false);
    });
  }

  function observeLoop(controller) {
    if (!controller.loop || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        controller.inView = entry.isIntersecting;
        controller.apply();
      });
    }, { threshold: .08 });
    observer.observe(controller.node);
    controller.cleanups.push(function () { observer.disconnect(); });
  }

  function triggerActive(controller, node) {
    node.classList.remove('rm-active');
    void node.offsetWidth;
    node.classList.add('rm-active');
    timer(controller, function () { node.classList.remove('rm-active'); }, reduced ? 0 : 420, false);
  }

  function mountHero(controller) {
    var core = controller.node.querySelector('.rm-hero-core');
    drawSvgLines(controller, controller.node, '.rm-hero-ring', 70);
    if (reduced && core) {
      core.style.transform = 'scale(1)';
      core.style.opacity = '1';
    }
    observeLoop(controller);
  }

  function mountBenefits(controller) {
    controller.node.querySelectorAll('.rm-benefit').forEach(function (card) {
      var button = card.querySelector('button');
      if (!button) return;
      drawSvgLines(controller, card, 'circle,path,rect,ellipse,line', 42);
      var activate = function () { triggerActive(controller, card); };
      on(button, 'click', activate, false, controller);
      on(button, 'focus', activate, false, controller);
      on(button, 'touchstart', activate, { passive: true }, controller);
    });
  }

  function mountOrbit(controller) {
    observeLoop(controller);
    drawSvgLines(controller, controller.node, '.rm-orbit-ring,line', 90);
    var button = controller.node.querySelector('.rm-credit-card .rm-button');
    if (!button) return;
    on(button, 'click', function () {
      triggerActive(controller, button);
    }, false, controller);
  }

  function mountMetrics(controller) {
    var metrics = Array.prototype.slice.call(controller.node.querySelectorAll('.rm-metric'));
    var run = function () {
      metrics.forEach(function (metric, index) {
        timer(controller, function () {
          metric.classList.add('rm-entered');
          countMetric(controller, metric);
        }, reduced ? 0 : index * 130, false);
      });
    };
    if (reduced) {
      metrics.forEach(function (metric) {
        metric.classList.add('rm-entered');
        countMetric(controller, metric);
      });
      return;
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.disconnect();
            run();
          }
        });
      }, { threshold: .18 });
      observer.observe(controller.node);
      controller.cleanups.push(function () { observer.disconnect(); });
    } else {
      run();
    }
  }

  function countMetric(controller, metric) {
    var valueNode = metric.querySelector('[data-rm-count]');
    if (!valueNode) return;
    var raw = valueNode.dataset.rmCount;
    var target = Number(raw);
    var decimals = Math.min(10, (raw.split('.')[1] || '').length);
    var suffix = valueNode.dataset.rmSuffix || '';
    var prefix = valueNode.dataset.rmPrefix || '';
    var format = function (value) {
      return decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
    };
    var finalValue = prefix + (Number.isFinite(target) ? format(target) : '0') + suffix;
    if (!Number.isFinite(target) || reduced) {
      valueNode.textContent = finalValue;
      return;
    }
    var elapsed = 0;
    var last = performance.now();
    var handle = { id: 0, raf: true, active: true };
    controller.timers.push(handle);
    function frame(now) {
      if (!controller.active || !handle.active) return;
      var delta = now - last;
      last = now;
      if (!effectivePaused(controller)) elapsed += delta * speed;
      var progress = reduced ? 1 : Math.min(1, elapsed / 860);
      var eased = 1 - Math.pow(1 - progress, 3);
      valueNode.textContent = progress === 1 ? finalValue : prefix + format(target * eased) + suffix;
      if (progress < 1) handle.id = requestAnimationFrame(frame);
      else {
        handle.active = false;
        var index = controller.timers.indexOf(handle);
        if (index >= 0) controller.timers.splice(index, 1);
      }
    }
    handle.id = requestAnimationFrame(frame);
  }

  function mountReveal(controller) {
    var cards = Array.prototype.slice.call(controller.node.querySelectorAll('.rm-editorial'));
    var reveal = function (card, index) {
      timer(controller, function () {
        card.classList.add('rm-entered');
      }, reduced ? 0 : index * 90, false);
    };
    if (reduced) {
      cards.forEach(function (card) {
        card.classList.add('rm-entered');
      });
      return;
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target, cards.indexOf(entry.target));
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });
      cards.forEach(function (card) { observer.observe(card); });
      controller.cleanups.push(function () { observer.disconnect(); });
    } else {
      cards.forEach(reveal);
    }
  }

  function mountFormats(controller) {
    observeLoop(controller);
    controller.node.querySelectorAll('.rm-format').forEach(function (format) {
      format.classList.add('rm-entered');
      var button = format.querySelector('button');
      if (button) {
        on(button, 'click', function () { triggerActive(controller, format); }, false, controller);
        on(button, 'focus', function () { triggerActive(controller, format); }, false, controller);
      }
    });
    var carousel = controller.node.querySelector('.rm-carousel .rm-slide');
    if (carousel) runCarousel(controller, carousel);
    var boost = controller.node.querySelector('.rm-boost-counts .rm-count');
    if (boost) runBoost(controller, boost);
  }

  function runCarousel(controller, node) {
    var values = ['01', '02', '03'];
    var index = 0;
    node.textContent = values[index];
    if (reduced) return;
    timer(controller, function () {
      if (effectivePaused(controller)) return;
      index = (index + 1) % values.length;
      node.textContent = values[index];
      animate(controller, node, [
        { transform: 'translateX(18px)', opacity: .25 },
        { transform: 'translateX(0)', opacity: 1 }
      ], { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' });
    }, 1500, true);
  }

  function runBoost(controller, node) {
    var count = 1240;
    node.textContent = '+1,240';
    if (reduced) return;
    timer(controller, function () {
      if (effectivePaused(controller)) return;
      count += Math.floor(18 + Math.random() * 54);
      node.textContent = '+' + count.toLocaleString('en-US');
    }, 1350, true);
  }

  function mountNode(root, node) {
    restoreCssLoops(node);
    var controller = makeController(root, node);
    node.querySelectorAll('[data-rm-replay]').forEach(function (button) {
      on(button, 'click', function () { replayNode(controller); }, false, controller);
    });
    var type = node.dataset.rm;
    if (type === 'hero') mountHero(controller);
    if (type === 'benefits') mountBenefits(controller);
    if (type === 'orbit') mountOrbit(controller);
    if (type === 'metrics') mountMetrics(controller);
    if (type === 'reveal') mountReveal(controller);
    if (type === 'formats') mountFormats(controller);
    controller.apply();
    return controller;
  }

  function matchingControllers(root) {
    var matches = [];
    controllers.forEach(function (controller) {
      if (controller.node === root || (root.contains && root.contains(controller.node))) {
        matches.push(controller);
      }
    });
    return matches;
  }

  function controllerForNode(node) {
    var found = null;
    controllers.forEach(function (controller) {
      if (controller.node === node) found = controller;
    });
    return found;
  }

  function replayNode(controller) {
    var owners = Array.from(controller.owners).filter(function (entry) { return entry.active; });
    var node = controller.node;
    controller.cleanup();
    if (!owners.length) return;
    resetScope(node);
    var next = mountNode(controller.root, node);
    owners.forEach(function (entry) {
      next.owners.add(entry);
      entry.controllers.push(next);
    });
    applyGlobalState();
  }

  function collectNodes(root) {
    var nodes = [];
    if (root.matches && root.matches('[data-rm]')) nodes.push(root);
    root.querySelectorAll('[data-rm]').forEach(function (node) {
      if (nodes.indexOf(node) === -1) nodes.push(node);
    });
    return nodes;
  }

  function mountNodes(root, entry) {
    collectNodes(root).forEach(function (node) {
      var controller = controllerForNode(node) || mountNode(root, node);
      if (controller.owners.has(entry)) return;
      controller.owners.add(entry);
      entry.controllers.push(controller);
    });
  }

  function resetScope(root) {
    restoreCssLoops(root);
    var activeNodes = [];
    if (root.matches && (root.matches('.rm-entered') || root.matches('.rm-active'))) activeNodes.push(root);
    root.querySelectorAll('.rm-entered, .rm-active').forEach(function (node) {
      if (activeNodes.indexOf(node) === -1) activeNodes.push(node);
    });
    activeNodes.forEach(function (node) {
      node.classList.remove('rm-entered', 'rm-active');
    });
    root.querySelectorAll('[data-rm-count]').forEach(function (node) {
      node.textContent = (node.dataset.rmPrefix || '') + '0' + (node.dataset.rmSuffix || '');
    });
  }

  function mount(root) {
    root = root || document;
    if (mountedRoots.has(root)) {
      var current = mountedRoots.get(root);
      mountNodes(root, current);
      applyGlobalState();
      return current.cleanup;
    }
    var entry = {
      active: true,
      controllers: [],
      cleanup: function () {
        if (!entry.active) return;
        entry.active = false;
        entry.controllers.slice().forEach(function (controller) {
          controller.owners.delete(entry);
          if (!controller.owners.size) controller.cleanup();
        });
        entry.controllers = [];
        if (mountedRoots.get(root) === entry) mountedRoots.delete(root);
      }
    };
    mountNodes(root, entry);
    mountedRoots.set(root, entry);
    applyGlobalState();
    return entry.cleanup;
  }

  function replay(root) {
    root = root || document;
    var existing = matchingControllers(root);
    if (existing.length) existing.slice().forEach(replayNode);
    else return mount(root);
  }

  function setPaused(value) {
    globalPaused = Boolean(value);
    applyGlobalState();
  }

  function setSpeed(value) {
    speed = clampSpeed(value);
    applyGlobalState();
  }

  function handleReducedMotion(event) {
    reduced = Boolean(event.matches);
    Array.from(controllers).forEach(replayNode);
    applyGlobalState();
  }

  function handleVisibility() {
    hidden = document.hidden;
    applyGlobalState();
  }

  if (reduceQuery) {
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', handleReducedMotion);
    else if (reduceQuery.addListener) reduceQuery.addListener(handleReducedMotion);
  }
  document.addEventListener('visibilitychange', handleVisibility);
  applyGlobalState();

  window.ReferenceMotion = {
    mount: mount,
    replay: replay,
    setPaused: setPaused,
    setSpeed: setSpeed
  };
})();
