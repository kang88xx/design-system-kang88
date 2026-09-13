(function () {
  const mountedRoots = new WeakMap();
  const mountedSamples = new WeakMap();
  const preparedSamples = new WeakSet();
  let uid = 0;
  const apiState = {
    paused: false,
    speed: 1,
    reduced: false,
    reduceQuery: null,
    carouselRefreshers: new Set()
  };

  const clampSpeed = (value) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return 1;
    return Math.min(4, Math.max(0.25, next));
  };

  const setSpeedVar = () => {
    document.documentElement.style.setProperty('--ri-speed-factor', String(1 / apiState.speed));
  };

  const getRoot = (root) => root || document;
  const queryAll = (root, selector) => Array.from(getRoot(root).querySelectorAll(selector));
  const focusableSelector = 'a, button, input, select, textarea, [tabindex]';
  const samplesIn = (root) => {
    const resolvedRoot = getRoot(root);
    const samples = queryAll(resolvedRoot, '[data-ri]');
    if (resolvedRoot.nodeType === 1 && resolvedRoot.matches('[data-ri]')) samples.unshift(resolvedRoot);
    return samples;
  };
  const getScopedId = (scope, id) => {
    if (!id) return null;
    if (scope.nodeType === 1 && scope.id === id) return scope;
    return queryAll(scope, '[id]').find((node) => node.id === id) || null;
  };
  const setButtonLabel = (button, text, leadingNode, trailingNode) => {
    button.textContent = '';
    if (leadingNode) {
      button.appendChild(leadingNode);
      button.appendChild(document.createTextNode(' '));
    }
    button.appendChild(document.createTextNode(text));
    if (trailingNode) {
      button.appendChild(document.createTextNode(' '));
      button.appendChild(trailingNode);
    }
  };

  const listen = (target, type, handler, options, cleanup) => {
    if (!target) return;
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  };

  const clearTimer = (state, key) => {
    if (state[key]) {
      window.clearTimeout(state[key]);
      state[key] = 0;
    }
  };

  const isReduced = () => Boolean(apiState.reduced || (apiState.reduceQuery && apiState.reduceQuery.matches));
  const duration = (ms) => isReduced() ? 0 : Math.max(0, ms / apiState.speed);

  const remapIds = (sample) => {
    if (preparedSamples.has(sample)) return;
    const map = new Map();
    queryAll(sample, '[id]').forEach((node) => {
      const next = `${node.id}--ri-${++uid}`;
      map.set(node.id, next);
      node.id = next;
    });
    const remapTokenList = (value) => value.split(/\s+/).map((token) => map.get(token) || token).join(' ');
    const scopedNodes = (selector) => {
      const nodes = queryAll(sample, selector);
      if (sample.matches(selector)) nodes.unshift(sample);
      return nodes;
    };
    ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-owns'].forEach((attr) => {
      scopedNodes(`[${attr}]`).forEach((node) => node.setAttribute(attr, remapTokenList(node.getAttribute(attr) || '')));
    });
    scopedNodes('label[for]').forEach((label) => {
      const next = map.get(label.getAttribute('for'));
      if (next) label.setAttribute('for', next);
    });
    queryAll(sample, 'a[href^="#"]').forEach((link) => {
      const next = map.get(link.getAttribute('href').slice(1));
      if (next) link.setAttribute('href', `#${next}`);
    });
    preparedSamples.add(sample);
    sample.dataset.riIdsReady = 'true';
  };

  const setContainedFocusAccess = (container, open) => {
    container.toggleAttribute('inert', !open);
    queryAll(container, focusableSelector).forEach((item) => {
      if (open) {
        if (item.dataset.riSavedTabIndex === '') item.removeAttribute('tabindex');
        else if (item.dataset.riSavedTabIndex !== undefined) item.setAttribute('tabindex', item.dataset.riSavedTabIndex);
        delete item.dataset.riSavedTabIndex;
      } else {
        if (item.dataset.riSavedTabIndex === undefined) item.dataset.riSavedTabIndex = item.getAttribute('tabindex') || '';
        item.setAttribute('tabindex', '-1');
      }
    });
  };

  const setPanelAccess = (panel, open) => {
    if (!panel) return;
    if (!open && panel.contains(document.activeElement) && panel.previousElementSibling && panel.previousElementSibling.focus) {
      panel.previousElementSibling.focus();
    }
    panel.hidden = false;
    setContainedFocusAccess(panel, open);
    panel.setAttribute('aria-hidden', String(!open));
  };

  const clearPanelTimer = (panel) => {
    if (panel && panel.dataset.riHeightTimer) window.clearTimeout(Number(panel.dataset.riHeightTimer));
    if (panel) delete panel.dataset.riHeightTimer;
  };

  const finishPanelClose = (panel) => {
    if (panel && panel.dataset.riOpen !== 'true') panel.hidden = true;
  };

  const animateHeight = (panel, open) => {
    if (!panel) return;
    clearPanelTimer(panel);
    setPanelAccess(panel, open);
    if (isReduced()) {
      panel.style.height = open ? 'auto' : '0px';
      finishPanelClose(panel);
      return;
    }
    const start = panel.getBoundingClientRect().height;
    panel.style.height = `${start}px`;
    panel.offsetHeight;
    panel.style.height = open ? `${panel.scrollHeight}px` : '0px';
    if (open) {
      const done = () => {
        if (panel.dataset.riOpen === 'true') panel.style.height = 'auto';
      };
      panel.dataset.riHeightTimer = String(window.setTimeout(() => {
        delete panel.dataset.riHeightTimer;
        done();
      }, duration(220)));
    } else {
      panel.dataset.riHeightTimer = String(window.setTimeout(() => {
        delete panel.dataset.riHeightTimer;
        finishPanelClose(panel);
      }, duration(220)));
    }
  };

  const mountButtons = (sample, cleanup, options = {}) => {
    const action = sample.querySelector('[data-ri-button-action]');
    const status = sample.querySelector('[data-ri-button-status]');
    const state = { timer: 0, pending: false, actionId: 0, controller: null };
    const idleHtml = action ? action.innerHTML : '';
    const idleText = status ? status.textContent : '';
    const abortPending = () => {
      state.actionId += 1;
      state.pending = false;
      if (state.controller) state.controller.abort();
      state.controller = null;
    };
    cleanup.push(() => clearTimer(state, 'timer'));
    cleanup.push(() => {
      abortPending();
      if (action) {
        action.disabled = false;
        action.setAttribute('aria-busy', 'false');
        action.innerHTML = idleHtml;
      }
    });

    const reset = () => {
      clearTimer(state, 'timer');
      abortPending();
      if (action) {
        action.disabled = false;
        action.setAttribute('aria-busy', 'false');
        action.innerHTML = idleHtml;
      }
      if (status) {
        status.dataset.state = '';
        status.textContent = idleText || '버튼 상태 피드백은 권장 추가 항목입니다. 외부 요청 없이 로컬에서만 실행됩니다.';
      }
    };

    listen(action, 'click', async () => {
      const production = sample.dataset.riMode === 'production';
      if (production && typeof options.onAction !== 'function') {
        action.disabled = false;
        action.setAttribute('aria-busy', 'false');
        action.innerHTML = idleHtml;
        if (status) {
          status.dataset.state = 'error';
          status.textContent = '요청 기능이 연결되지 않았습니다.';
        }
        return;
      }
      if (state.pending) return;
      clearTimer(state, 'timer');
      action.disabled = true;
      action.setAttribute('aria-busy', 'true');
      const spinner = document.createElement('span');
      spinner.className = 'ri-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      setButtonLabel(action, action.dataset.riLoadingText || '확인 중', spinner);
      if (status) {
        status.dataset.state = '';
        status.textContent = action.dataset.riLoadingMessage || '로컬 확인 상태를 표시하는 중입니다.';
      }
      if (typeof options.onAction === 'function') {
        const actionId = state.actionId + 1;
        state.actionId = actionId;
        state.pending = true;
        if (state.controller) state.controller.abort();
        state.controller = new AbortController();
        try {
          const result = await options.onAction({ button: action, signal: state.controller.signal });
          if (state.actionId !== actionId || state.controller.signal.aborted) return;
          action.disabled = false;
          action.setAttribute('aria-busy', 'false');
          action.innerHTML = idleHtml;
          state.pending = false;
          state.controller = null;
          if (status) {
            status.dataset.state = 'success';
            status.textContent = result && result.message ? String(result.message) : '요청이 완료되었습니다.';
          }
        } catch (error) {
          if (state.actionId !== actionId || (state.controller && state.controller.signal.aborted)) return;
          action.disabled = false;
          action.setAttribute('aria-busy', 'false');
          action.innerHTML = idleHtml;
          state.pending = false;
          state.controller = null;
          if (status) {
            status.dataset.state = 'error';
            status.textContent = '요청을 완료하지 못했습니다. 잠시 후 다시 시도하세요.';
          }
        }
        return;
      }
      state.timer = window.setTimeout(() => {
        action.disabled = false;
        action.setAttribute('aria-busy', 'false');
        const arrow = document.createElement('span');
        arrow.className = 'ri-button-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '->';
        setButtonLabel(action, action.dataset.riSuccessText || '확인 완료', null, arrow);
        if (status) {
          status.dataset.state = 'success';
          status.textContent = action.dataset.riSuccessMessage || '완료 상태가 같은 위치에 남아 레이아웃이 흔들리지 않습니다.';
        }
      }, duration(800));
    }, undefined, cleanup);

    reset();
    return reset;
  };

  const mountTabs = (sample, cleanup) => {
    const tabs = queryAll(sample, '[role="tab"]');
    const panel = sample.querySelector('[role="tabpanel"]');
    const indicator = sample.querySelector('[data-ri-tabs-indicator]');
    const list = sample.querySelector('[role="tablist"]');
    const title = sample.querySelector('[data-ri-panel-title]');
    const copy = sample.querySelector('[data-ri-panel-copy]');
    const kicker = sample.querySelector('[data-ri-panel-kicker]');
    const state = { index: 0, timer: 0 };
    cleanup.push(() => clearTimer(state, 'timer'));

    const moveIndicator = (animated = true) => {
      const active = tabs[state.index];
      if (!active || !indicator || !list) return;
      const activeBox = active.getBoundingClientRect();
      const listBox = list.getBoundingClientRect();
      const rowOffset = activeBox.bottom - listBox.bottom;
      indicator.toggleAttribute('data-ri-no-transition', !animated);
      indicator.style.width = `${activeBox.width}px`;
      indicator.style.transform = `translate(${activeBox.left - listBox.left}px, ${rowOffset}px)`;
      if (!animated) {
        requestAnimationFrame(() => {
          indicator.removeAttribute('data-ri-no-transition');
        });
      }
    };

    const select = (index, focus) => {
      state.index = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === state.index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      const active = tabs[state.index];
      if (panel && active) {
        panel.setAttribute('aria-labelledby', active.id);
        panel.classList.remove('ri-entering');
        panel.offsetHeight;
        if (!isReduced()) panel.classList.add('ri-entering');
        clearTimer(state, 'timer');
        state.timer = window.setTimeout(() => panel.classList.remove('ri-entering'), duration(240));
      }
      if (kicker) kicker.textContent = active.dataset.kicker || '';
      if (title) title.textContent = active.dataset.title || active.textContent.trim();
      if (copy) copy.textContent = active.dataset.copy || '';
      moveIndicator(true);
      if (focus && active) active.focus();
    };

    tabs.forEach((tab, index) => {
      listen(tab, 'click', () => select(index, false), undefined, cleanup);
      listen(tab, 'keydown', (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (event.key in keys) {
          event.preventDefault();
          select(state.index + keys[event.key], true);
        } else if (event.key === 'Home') {
          event.preventDefault();
          select(0, true);
        } else if (event.key === 'End') {
          event.preventDefault();
          select(tabs.length - 1, true);
        }
      }, undefined, cleanup);
    });
    listen(window, 'resize', () => moveIndicator(false), undefined, cleanup);
    if ('ResizeObserver' in window && list) {
      const observer = new ResizeObserver(() => moveIndicator(false));
      observer.observe(list);
      tabs.forEach((tab) => observer.observe(tab));
      cleanup.push(() => observer.disconnect());
    }

    const reset = () => select(0, false);
    reset();
    return reset;
  };

  const mountCarousel = (sample, cleanup) => {
    const track = sample.querySelector('[data-ri-carousel-track]');
    const slides = queryAll(sample, '[data-ri-slide]');
    const dots = queryAll(sample, '[data-ri-dot]');
    const prev = sample.querySelector('[data-ri-prev]');
    const next = sample.querySelector('[data-ri-next]');
    const toggle = sample.querySelector('[data-ri-autoplay]');
    const status = sample.querySelector('[data-ri-carousel-status]');
    const viewport = sample.querySelector('[data-ri-carousel-viewport]');
    const state = { index: 0, autoplay: false, hovered: false, focused: false, offscreen: false, timer: 0, touchX: 0 };

    const stopTimer = () => clearTimer(state, 'timer');
    const canRun = () => state.autoplay && !state.hovered && !state.focused && !state.offscreen && !apiState.paused && !isReduced() && !document.hidden;
    const schedule = () => {
      stopTimer();
      if (!canRun()) return;
      state.timer = window.setTimeout(() => {
        go(state.index + 1);
        schedule();
      }, duration(4200));
    };
    const updateAutoplay = () => {
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(state.autoplay));
        toggle.textContent = state.autoplay ? '자동 재생 끄기' : '자동 재생 켜기';
      }
      schedule();
    };
    const go = (index) => {
      state.index = (index + slides.length) % slides.length;
      if (track) track.style.transform = `translateX(${-100 * state.index}%)`;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === state.index;
        if (!active && slide.contains(document.activeElement)) {
          const fallback = dots[state.index] || next || prev;
          if (fallback && fallback.focus) fallback.focus();
        }
        slide.setAttribute('aria-hidden', String(!active));
        setContainedFocusAccess(slide, active);
      });
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === state.index;
        dot.setAttribute('aria-selected', String(active));
        dot.tabIndex = active ? 0 : -1;
      });
      if (status) status.textContent = `${state.index + 1} / ${slides.length}`;
    };
    const setPauseFlag = (key, value) => {
      state[key] = value;
      schedule();
    };

    listen(prev, 'click', () => { go(state.index - 1); schedule(); }, undefined, cleanup);
    listen(next, 'click', () => { go(state.index + 1); schedule(); }, undefined, cleanup);
    dots.forEach((dot, index) => listen(dot, 'click', () => { go(index); schedule(); }, undefined, cleanup));
    dots.forEach((dot) => listen(dot, 'keydown', (event) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (event.key in keys) {
        event.preventDefault();
        go(state.index + keys[event.key]);
        dots[state.index].focus();
        schedule();
      } else if (event.key === 'Home') {
        event.preventDefault();
        go(0);
        dots[state.index].focus();
        schedule();
      } else if (event.key === 'End') {
        event.preventDefault();
        go(dots.length - 1);
        dots[state.index].focus();
        schedule();
      }
    }, undefined, cleanup));
    listen(toggle, 'click', () => { state.autoplay = !state.autoplay; updateAutoplay(); }, undefined, cleanup);
    listen(sample, 'mouseenter', () => setPauseFlag('hovered', true), undefined, cleanup);
    listen(sample, 'mouseleave', () => setPauseFlag('hovered', false), undefined, cleanup);
    listen(sample, 'focusin', () => setPauseFlag('focused', true), undefined, cleanup);
    listen(sample, 'focusout', (event) => {
      if (!sample.contains(event.relatedTarget)) setPauseFlag('focused', false);
    }, undefined, cleanup);
    listen(document, 'visibilitychange', schedule, undefined, cleanup);
    listen(viewport, 'touchstart', (event) => {
      state.touchX = event.changedTouches[0].clientX;
    }, { passive: true }, cleanup);
    listen(viewport, 'touchend', (event) => {
      const delta = event.changedTouches[0].clientX - state.touchX;
      if (Math.abs(delta) > 36) {
        go(state.index + (delta < 0 ? 1 : -1));
        schedule();
      }
    }, { passive: true }, cleanup);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        state.offscreen = entries.some((entry) => !entry.isIntersecting);
        schedule();
      }, { threshold: 0.2 });
      observer.observe(sample);
      cleanup.push(() => observer.disconnect());
    }

    const refresh = () => schedule();
    apiState.carouselRefreshers.add(refresh);
    cleanup.push(() => {
      stopTimer();
      apiState.carouselRefreshers.delete(refresh);
    });

    const reset = () => {
      stopTimer();
      state.index = 0;
      state.autoplay = false;
      state.hovered = false;
      state.focused = false;
      state.offscreen = false;
      go(0);
      updateAutoplay();
    };
    reset();
    return reset;
  };

  const mountForm = (sample, cleanup, options = {}) => {
    const form = sample.querySelector('form');
    const status = sample.querySelector('[data-ri-form-status]');
    const selector = sample.querySelector('[data-ri-form-mode]');
    const submit = sample.querySelector('button[type="submit"]');
    const controlled = sample.dataset.riMode === 'production' || typeof options.onSubmit === 'function';
    const idleStatus = status ? status.textContent : '';
    const state = { timer: 0, resetTimer: 0, internalReset: false, pending: false, submitId: 0, controller: null };
    const required = queryAll(sample, '[data-ri-required]');

    const abortPending = () => {
      state.submitId += 1;
      state.pending = false;
      if (state.controller) state.controller.abort();
      state.controller = null;
    };
    cleanup.push(() => clearTimer(state, 'timer'));
    cleanup.push(() => clearTimer(state, 'resetTimer'));
    cleanup.push(() => {
      abortPending();
      setPending(false);
    });

    const setError = (input, message) => {
      const ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      const nodes = ids.map((id) => getScopedId(sample, id)).filter(Boolean);
      const error = nodes.find((node) => node.matches('.ri-error, [data-ri-error]')) || nodes[nodes.length - 1];
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message || '';
    };
    const validate = () => {
      let valid = true;
      required.forEach((input) => {
        let message = '';
        if (!input.value.trim()) message = '필수 입력 항목입니다.';
        if (!message && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) message = '올바른 이메일 주소를 입력하세요.';
        setError(input, message);
        if (message) valid = false;
      });
      return valid;
    };
    const setStatus = (stateName, text) => {
      if (!status) return;
      status.dataset.state = stateName;
      status.textContent = text;
    };
    const setPending = (pending) => {
      state.pending = pending;
      if (!submit) return;
      submit.disabled = pending;
      submit.setAttribute('aria-busy', String(pending));
    };
    const resetVisual = () => {
      clearTimer(state, 'timer');
      abortPending();
      setPending(false);
      required.forEach((input) => setError(input, ''));
      setStatus('', controlled ? idleStatus : '제출 결과는 데모 선택값으로 재현합니다. 네트워크 요청은 발생하지 않습니다.');
    };
    const reset = () => {
      if (form) {
        state.internalReset = true;
        form.reset();
        state.internalReset = false;
      }
      resetVisual();
    };

    listen(form, 'input', (event) => {
      if (event.target && event.target.matches('[data-ri-required]')) setError(event.target, '');
    }, undefined, cleanup);
    listen(form, 'reset', () => {
      if (state.internalReset) return;
      clearTimer(state, 'resetTimer');
      abortPending();
      state.resetTimer = window.setTimeout(() => {
        state.resetTimer = 0;
        resetVisual();
      }, 0);
    }, undefined, cleanup);
    listen(form, 'submit', async (event) => {
      event.preventDefault();
      if (state.pending) return;
      clearTimer(state, 'timer');
      if (!validate()) {
        const firstInvalid = sample.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        setStatus('error', '입력값을 확인하세요.');
        return;
      }
      if (sample.dataset.riMode === 'production' && typeof options.onSubmit !== 'function') {
        setPending(false);
        setStatus('error', '전송 기능이 연결되지 않았습니다.');
        return;
      }
      if (typeof options.onSubmit === 'function') {
        const submitId = state.submitId + 1;
        state.submitId = submitId;
        if (state.controller) state.controller.abort();
        state.controller = new AbortController();
        setPending(true);
        setStatus('', '상담 요청을 확인하는 중입니다.');
        try {
          const values = Object.fromEntries(new FormData(form).entries());
          const result = await options.onSubmit({ values, form, signal: state.controller.signal });
          if (state.submitId !== submitId || state.controller.signal.aborted) return;
          setPending(false);
          state.controller = null;
          setStatus('success', result && result.message ? String(result.message) : '요청이 접수되었습니다.');
        } catch (error) {
          if (state.submitId !== submitId || (state.controller && state.controller.signal.aborted)) return;
          setPending(false);
          state.controller = null;
          setStatus('error', '요청을 완료하지 못했습니다. 잠시 후 다시 시도하세요.');
        }
        return;
      }
      const mode = selector ? selector.value : 'success';
      if (mode === 'pending') {
        setPending(true);
        setStatus('', '상담 요청을 확인하는 중입니다.');
        state.timer = window.setTimeout(() => {
          setPending(false);
          setStatus('success', '데모 지연 후 성공 상태로 전환했습니다.');
        }, duration(900));
      } else if (mode === 'failure') {
        setPending(false);
        setStatus('error', '데모 실패 상태입니다. 같은 화면에서 다시 시도할 수 있습니다.');
      } else {
        setPending(false);
        setStatus('success', '데모 성공 상태입니다. 외부 전송 없이 완료했습니다.');
      }
    }, undefined, cleanup);

    required.forEach((input) => {
      input.required = true;
      input.setAttribute('aria-required', 'true');
    });
    if (controlled) resetVisual();
    else reset();
    return reset;
  };

  const mountFAQ = (sample, cleanup) => {
    const buttons = queryAll(sample, '[data-ri-faq-button]');
    const setOpen = (button, open) => {
      const panel = getScopedId(sample, button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(open));
      if (panel) panel.dataset.riOpen = String(open);
      animateHeight(panel, open);
    };
    buttons.forEach((button) => listen(button, 'click', () => {
      setOpen(button, button.getAttribute('aria-expanded') !== 'true');
    }, undefined, cleanup));
    const reset = () => buttons.forEach((button, index) => setOpen(button, index === 0));
    reset();
    return reset;
  };

  const mountTheme = (sample, cleanup) => {
    const buttons = queryAll(sample, '[data-ri-theme-choice]');
    const status = sample.querySelector('[data-ri-theme-status]');
    const storageKey = sample.dataset.riStorageKey || 'reference-interactions-theme';
    const systemQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    let choice = 'system';

    const readStored = () => {
      try {
        const stored = window.localStorage && window.localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark' || stored === 'system') choice = stored;
      } catch (error) {
        choice = 'system';
      }
    };
    const writeStored = () => {
      try {
        if (window.localStorage) window.localStorage.setItem(storageKey, choice);
      } catch (error) {
        return;
      }
    };
    const apply = () => {
      const resolved = choice === 'system' ? (systemQuery && systemQuery.matches ? 'dark' : 'light') : choice;
      sample.dataset.theme = resolved;
      sample.dataset.riThemeChoice = choice;
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.riThemeChoice === choice)));
      if (status) status.textContent = `현재 샘플 테마: ${choice === 'system' ? `system -> ${resolved}` : resolved}`;
    };

    buttons.forEach((button) => listen(button, 'click', () => {
      choice = button.dataset.riThemeChoice || 'system';
      writeStored();
      apply();
    }, undefined, cleanup));
    if (systemQuery) {
      const handler = () => {
        if (choice === 'system') apply();
      };
      if (systemQuery.addEventListener) listen(systemQuery, 'change', handler, undefined, cleanup);
      else if (systemQuery.addListener) {
        systemQuery.addListener(handler);
        cleanup.push(() => systemQuery.removeListener(handler));
      }
    }
    const reset = () => {
      choice = 'system';
      writeStored();
      apply();
    };
    readStored();
    apply();
    return reset;
  };

  const mountNavigation = (sample, cleanup) => {
    const toggle = sample.querySelector('[data-ri-nav-toggle]');
    const menu = sample.querySelector('[data-ri-nav-menu]');
    const categoryButtons = queryAll(sample, '[data-ri-nav-category]');
    const links = queryAll(sample, '[data-ri-nav-link]');
    const contentTitle = sample.querySelector('[data-ri-nav-title]');
    const contentCopy = sample.querySelector('[data-ri-nav-copy]');
    const preview = sample.querySelector('[data-ri-nav-preview]');
    const sections = queryAll(sample, '[data-ri-nav-section]');
    let lastFocus = null;

    const setMenu = (open) => {
      if (!menu || !toggle) return;
      menu.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
      if (!open && lastFocus) lastFocus.focus();
    };
    const setCategory = (button, open) => {
      const panel = getScopedId(sample, button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(open));
      if (panel) panel.dataset.riOpen = String(open);
      animateHeight(panel, open);
    };
    const activate = (link, scroll = false) => {
      links.forEach((item) => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'page');
      if (contentTitle) contentTitle.textContent = link.dataset.title || link.textContent.trim();
      if (contentCopy) contentCopy.textContent = link.dataset.copy || '선택한 섹션의 요약이 이 자리에 표시됩니다.';
      if (scroll && preview) {
        const href = link.getAttribute('href') || '';
        const target = href.startsWith('#') ? getScopedId(sample, href.slice(1)) : null;
        if (target) preview.scrollTo({ top: target.offsetTop - preview.offsetTop, behavior: isReduced() || apiState.paused ? 'auto' : 'smooth' });
      }
      if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) setMenu(false);
    };
    const activateBySection = (section) => {
      const link = links.find((item) => item.getAttribute('href') === `#${section.id}`);
      if (link) activate(link, false);
    };

    listen(toggle, 'click', () => {
      lastFocus = toggle;
      setMenu(!(menu && menu.dataset.open === 'true'));
    }, undefined, cleanup);
    listen(sample, 'keydown', (event) => {
      if (event.key === 'Escape' && menu && menu.dataset.open === 'true') {
        event.preventDefault();
        setMenu(false);
      }
    }, undefined, cleanup);
    categoryButtons.forEach((button) => listen(button, 'click', () => {
      setCategory(button, button.getAttribute('aria-expanded') !== 'true');
    }, undefined, cleanup));
    links.forEach((link) => listen(link, 'click', (event) => {
      event.preventDefault();
      activate(link, true);
    }, undefined, cleanup));
    if (preview && sections.length && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) activateBySection(visible.target);
      }, { root: preview, threshold: [0.35, 0.6, 0.9] });
      sections.forEach((section) => observer.observe(section));
      cleanup.push(() => observer.disconnect());
    } else if (preview && sections.length) {
      listen(preview, 'scroll', () => {
        const current = sections.reduce((best, section) => {
          const distance = Math.abs(section.offsetTop - preview.scrollTop);
          return !best || distance < best.distance ? { section, distance } : best;
        }, null);
        if (current) activateBySection(current.section);
      }, { passive: true }, cleanup);
    }

    const reset = () => {
      setMenu(false);
      categoryButtons.forEach((button, index) => setCategory(button, index === 0));
      if (preview) preview.scrollTop = 0;
      if (links[0]) activate(links[0], false);
    };
    reset();
    return reset;
  };

  const mountSample = (sample, cleanup, options) => {
    const current = mountedSamples.get(sample);
    if (current) {
      current.refs += 1;
      cleanup.push(() => {
        if (!mountedSamples.has(sample)) return;
        current.refs -= 1;
        if (current.refs <= 0) {
          while (current.cleanup.length) current.cleanup.pop()();
          mountedSamples.delete(sample);
        }
      });
      return current.reset;
    }
    remapIds(sample);
    const type = sample.dataset.ri;
    const mounts = {
      buttons: mountButtons,
      tabs: mountTabs,
      carousel: mountCarousel,
      form: mountForm,
      faq: mountFAQ,
      theme: mountTheme,
      navigation: mountNavigation
    };
    if (!mounts[type]) return null;
    const sampleCleanup = [];
    sampleCleanup.push(() => queryAll(sample, '[data-ri-height-timer]').forEach(clearPanelTimer));
    const reset = mounts[type](sample, sampleCleanup, options);
    const state = { reset, cleanup: sampleCleanup, refs: 1 };
    mountedSamples.set(sample, state);
    cleanup.push(() => {
      if (!mountedSamples.has(sample)) return;
      state.refs -= 1;
      if (state.refs <= 0) {
        while (sampleCleanup.length) sampleCleanup.pop()();
        mountedSamples.delete(sample);
      }
    });
    return reset;
  };

  const refreshGlobalState = () => {
    setSpeedVar();
    document.documentElement.toggleAttribute('data-ri-paused', apiState.paused);
    apiState.carouselRefreshers.forEach((refresh) => refresh());
  };

  const mount = (root = document, options = {}) => {
    const resolvedRoot = getRoot(root);
    if (mountedRoots.has(resolvedRoot)) {
      const rootState = mountedRoots.get(resolvedRoot);
      samplesIn(resolvedRoot).forEach((sample) => {
        if (rootState.samples.has(sample)) return;
        mountSample(sample, rootState.cleanup, options);
        rootState.samples.add(sample);
      });
      return rootState.clean;
    }
    const cleanup = [];
    const rootState = { cleanup, samples: new WeakSet(), cleaned: false, clean: null };
    samplesIn(resolvedRoot).forEach((sample) => {
      mountSample(sample, cleanup, options);
      rootState.samples.add(sample);
    });
    const clean = () => {
      if (rootState.cleaned) return;
      rootState.cleaned = true;
      while (cleanup.length) cleanup.pop()();
      mountedRoots.delete(resolvedRoot);
    };
    rootState.clean = clean;
    mountedRoots.set(resolvedRoot, rootState);
    refreshGlobalState();
    return clean;
  };

  const replay = (root = document) => {
    samplesIn(getRoot(root)).forEach((sample) => {
      const state = mountedSamples.get(sample);
      if (state && state.reset) state.reset();
    });
  };

  const setPaused = (value) => {
    apiState.paused = Boolean(value);
    refreshGlobalState();
  };

  const setSpeed = (value) => {
    apiState.speed = clampSpeed(value);
    refreshGlobalState();
  };

  if (window.matchMedia) {
    apiState.reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduceHandler = () => {
      apiState.reduced = apiState.reduceQuery.matches;
      refreshGlobalState();
    };
    apiState.reduced = apiState.reduceQuery.matches;
    if (apiState.reduceQuery.addEventListener) apiState.reduceQuery.addEventListener('change', reduceHandler);
    else if (apiState.reduceQuery.addListener) apiState.reduceQuery.addListener(reduceHandler);
  }

  window.ReferenceInteractions = { mount, replay, setPaused, setSpeed };
})();
