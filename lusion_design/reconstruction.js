(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    paused: false,
    reduced: reducedQuery.matches,
    speed: 1,
    previous: 0,
    raf: 0,
    visible: new Set(),
  };

  $('#reduce-motion').checked = state.reduced;

  function fit(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { width, height, dpr };
  }

  function requestFrame() {
    if (!state.raf && !document.hidden) state.raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    state.raf = 0;
    const baseDt = state.previous ? Math.min((now - state.previous) / 1000, .05) : 0;
    state.previous = now;
    const dt = state.paused || state.reduced ? 0 : baseDt * state.speed;
    demos.forEach((demo) => {
      if (state.visible.has(demo.id)) demo.render(dt, baseDt);
    });
    if (!state.paused && !state.reduced && state.visible.size) requestFrame();
  }

  function updateRuntime() {
    document.body.classList.toggle('motion-paused', state.paused);
    document.body.classList.toggle('motion-reduced', state.reduced);
    $('#toggle-motion').textContent = state.paused ? '다시 재생' : '일시정지';
    $('#toggle-motion').setAttribute('aria-pressed', String(state.paused));
    $('#runtime-status').textContent = state.reduced ? '동작 감소: 고정 프레임과 수동 조작만 표시' : state.paused ? '일시정지: 입력은 유지, 시간 누적 중지' : '화면 안 데모만 재생 중';
    state.previous = 0;
    requestFrame();
  }

  $('#toggle-motion').addEventListener('click', () => {
    state.paused = !state.paused;
    updateRuntime();
  });
  $('#reduce-motion').addEventListener('change', (event) => {
    state.reduced = event.target.checked;
    demos.forEach((demo) => demo.settle?.());
    updateRuntime();
  });
  reducedQuery.addEventListener('change', (event) => {
    state.reduced = event.matches;
    $('#reduce-motion').checked = state.reduced;
    demos.forEach((demo) => demo.settle?.());
    updateRuntime();
  });
  $('#speed').addEventListener('input', (event) => {
    state.speed = Number(event.target.value);
    $('#speed-value').textContent = `${state.speed.toFixed(2)}×`;
    requestFrame();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.previous = 0;
    } else {
      requestFrame();
    }
  });

  function localPoint(element, event) {
    const rect = element.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height),
    };
  }

  const demos = [];
  function demo(id, render, settle) {
    const item = { id, render, settle };
    demos.push(item);
    return item;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.dataset.demo;
      if (entry.isIntersecting) state.visible.add(id);
      else state.visible.delete(id);
    });
    requestFrame();
  }, { rootMargin: '140px' });
  $$('.studio[data-demo]').forEach((element) => observer.observe(element));

  const fluidCanvas = $('#fluid-canvas');
  const fluidCtx = fluidCanvas.getContext('2d');
  const strokes = [];
  let fluidPointer = { x: .5, y: .5, px: .5, py: .5 };

  function pushFluid(x, y, force = 1) {
    for (let i = 0; i < 10; i += 1) {
      const angle = i * .628 + force;
      strokes.push({
        x, y,
        vx: Math.cos(angle) * (.06 + force * .025),
        vy: Math.sin(angle) * (.06 + force * .025),
        r: .012 + force * .012,
        age: 0,
        hue: i % 3,
      });
    }
    while (strokes.length > 210) strokes.shift();
    requestFrame();
  }

  fluidCanvas.addEventListener('pointermove', (event) => {
    const p = localPoint(fluidCanvas, event);
    const distance = Math.hypot(p.x - fluidPointer.px, p.y - fluidPointer.py);
    fluidPointer = { x: p.x, y: p.y, px: fluidPointer.x, py: fluidPointer.y };
    if (!state.paused) pushFluid(p.x, p.y, clamp(distance * 18, .25, 2.4));
  });
  fluidCanvas.addEventListener('keydown', (event) => {
    const step = .06;
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      fluidPointer.x = clamp(fluidPointer.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0));
      fluidPointer.y = clamp(fluidPointer.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0));
      pushFluid(fluidPointer.x, fluidPointer.y, 1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pushFluid(.5, .5, 2.2);
    }
  });
  $('[data-action="fluid-burst"]').addEventListener('click', () => pushFluid(.5, .5, 2.6));
  $('[data-action="fluid-clear"]').addEventListener('click', () => {
    strokes.length = 0;
    requestFrame();
  });

  demo('fluid', (dt) => {
    const { width, height } = fit(fluidCanvas);
    fluidCtx.fillStyle = 'rgba(17,18,23,.18)';
    fluidCtx.fillRect(0, 0, width, height);
    fluidCtx.save();
    fluidCtx.strokeStyle = 'rgba(240,241,250,.08)';
    fluidCtx.lineWidth = 1;
    for (let y = 0; y < height; y += height / 12) {
      fluidCtx.beginPath();
      for (let x = 0; x <= width; x += width / 38) {
        const wobble = Math.sin(x * .015 + y * .02 + strokes.length * .04) * 6;
        x ? fluidCtx.lineTo(x, y + wobble) : fluidCtx.moveTo(x, y + wobble);
      }
      fluidCtx.stroke();
    }
    fluidCtx.restore();
    fluidCtx.save();
    fluidCtx.globalCompositeOperation = 'lighter';
    for (let i = strokes.length - 1; i >= 0; i -= 1) {
      const s = strokes[i];
      if (dt) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= Math.exp(-1.9 * dt);
        s.vy *= Math.exp(-1.9 * dt);
        s.age += dt;
      }
      if (s.age > 2.7) {
        strokes.splice(i, 1);
        continue;
      }
      const alpha = clamp(1 - s.age / 2.7);
      const radius = Math.max(width, height) * s.r * (1 + s.age * .9);
      const gradient = fluidCtx.createRadialGradient(s.x * width, s.y * height, 0, s.x * width, s.y * height, radius);
      const colors = ['82,101,255', '193,255,0', '240,241,250'];
      gradient.addColorStop(0, `rgba(${colors[s.hue]},${.45 * alpha})`);
      gradient.addColorStop(1, `rgba(${colors[s.hue]},0)`);
      fluidCtx.fillStyle = gradient;
      fluidCtx.beginPath();
      fluidCtx.arc(s.x * width, s.y * height, radius, 0, Math.PI * 2);
      fluidCtx.fill();
    }
    fluidCtx.restore();
    $('#fluid-count').textContent = `${strokes.length} strokes`;
  }, () => {
    strokes.length = 0;
  });

  const morphCanvas = $('#morph-canvas');
  const morphCtx = morphCanvas.getContext('2d');
  const particles = Array.from({ length: 1300 }, (_, i) => ({
    seed: i * 12.9898,
    x: Math.random(),
    y: Math.random(),
  }));
  let morphTarget = 0;
  let morphValue = 0;

  function facePoint(t) {
    const a = t * Math.PI * 2;
    const r = .34 + .04 * Math.sin(3 * a);
    const x = .5 + Math.cos(a) * r * .55;
    const y = .48 + Math.sin(a) * r * .88;
    return [x, y];
  }
  function astronautPoint(t) {
    const row = Math.floor(t * 48) / 48;
    const side = t * 48 - Math.floor(t * 48);
    const torso = row > .28 && row < .82;
    const helmet = row < .31;
    const width = helmet ? .16 + Math.sin(row / .31 * Math.PI) * .18 : torso ? .26 - Math.abs(row - .55) * .18 : .12;
    return [.5 + (side - .5) * width * 2.4, .14 + row * .75];
  }
  function randomJitter(seed, amount) {
    return (Math.sin(seed) * 43758.5453 % 1) * amount;
  }

  function setMorph(value, direct = false) {
    morphTarget = clamp(value);
    $('#morph-range').value = Math.round(morphTarget * 100);
    $('#morph-range-value').textContent = `${Math.round(morphTarget * 100)}%`;
    if (direct) morphValue = morphTarget;
    requestFrame();
  }
  $('[data-action="morph-toggle"]').addEventListener('click', () => setMorph(morphTarget < .5 ? 1 : 0));
  $('[data-action="morph-reset"]').addEventListener('click', () => setMorph(0, true));
  $('#morph-range').addEventListener('input', (event) => setMorph(Number(event.target.value) / 100, true));
  morphCanvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setMorph(morphTarget + (event.key === 'ArrowRight' ? .1 : -.1));
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setMorph(morphTarget < .5 ? 1 : 0);
    }
  });

  demo('morph', (dt, baseDt) => {
    const { width, height, dpr } = fit(morphCanvas);
    morphValue += (morphTarget - morphValue) * (state.reduced ? 1 : 1 - Math.exp(-7 * (dt || baseDt)));
    morphCtx.fillStyle = '#08090f';
    morphCtx.fillRect(0, 0, width, height);
    for (const p of particles) {
      const t = (p.seed % 1000) / 1000;
      const face = facePoint(t);
      const suit = astronautPoint(t);
      const x = lerp(face[0], suit[0], morphValue) + randomJitter(p.seed, .018) * (1 - Math.abs(morphValue - .5));
      const y = lerp(face[1], suit[1], morphValue) + randomJitter(p.seed + 2, .018) * (1 - Math.abs(morphValue - .5));
      const blue = p.seed % 5 < 1;
      morphCtx.fillStyle = blue ? '#5265ff' : morphValue > .55 ? '#f0f1fa' : '#cdd0de';
      morphCtx.globalAlpha = .45 + .45 * Math.sin(t * Math.PI);
      morphCtx.fillRect(x * width, y * height, Math.max(1, 2.2 * dpr), Math.max(1, 2.2 * dpr));
    }
    morphCtx.globalAlpha = 1;
    $('#morph-label').textContent = morphValue < .5 ? `FACE ${Math.round(morphValue * 100)}%` : `ASTRONAUT ${Math.round(morphValue * 100)}%`;
  }, () => setMorph(morphTarget, true));

  const shatterCanvas = $('#shatter-canvas');
  const shatterCtx = shatterCanvas.getContext('2d');
  let shards = [];
  let shatterPoint = { x: .5, y: .5 };

  function buildShards() {
    shards = [];
    const cols = 9;
    const rows = 6;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const cx = (x + .5) / cols;
        const cy = (y + .5) / rows;
        const angle = Math.atan2(cy - shatterPoint.y, cx - shatterPoint.x);
        const distance = Math.hypot(cx - shatterPoint.x, cy - shatterPoint.y);
        shards.push({
          cx, cy,
          points: [[x / cols, y / rows], [(x + 1) / cols, y / rows + .025], [(x + .72) / cols, (y + 1) / rows], [x / cols + .02, (y + .78) / rows]],
          vx: Math.cos(angle) * (.13 + distance * .25),
          vy: Math.sin(angle) * (.13 + distance * .25) - .04,
          spin: (Math.sin((x + y * cols) * 4.1) * 2 - 1) * 1.5,
          progress: 0,
        });
      }
    }
  }
  buildShards();

  function hitShatter(point = shatterPoint) {
    shatterPoint = point;
    buildShards();
    shards.forEach((s) => { s.progress = .001; });
    requestFrame();
  }
  function resetShatter() {
    shards.forEach((s) => { s.progress = 0; });
    requestFrame();
  }
  shatterCanvas.addEventListener('pointerdown', (event) => hitShatter(localPoint(shatterCanvas, event)));
  shatterCanvas.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      hitShatter();
    }
  });
  $('[data-action="shatter-hit"]').addEventListener('click', () => hitShatter());
  $('[data-action="shatter-reset"]').addEventListener('click', resetShatter);

  demo('shatter', (dt) => {
    const { width, height } = fit(shatterCanvas);
    shatterCtx.clearRect(0, 0, width, height);
    shatterCtx.fillStyle = '#1a2ffb';
    shatterCtx.fillRect(0, 0, width, height);
    shatterCtx.strokeStyle = 'rgba(255,255,255,.55)';
    shatterCtx.lineWidth = 1;
    let moving = 0;
    shards.forEach((s, index) => {
      if (s.progress > 0 && s.progress < 1) {
        s.progress = clamp(s.progress + dt * .55);
      }
      if (s.progress > 0) moving += 1;
      const p = ease(s.progress);
      const dx = s.vx * p * width;
      const dy = (s.vy * p + .18 * p * p) * height;
      const rot = s.spin * p;
      shatterCtx.save();
      shatterCtx.translate(s.cx * width + dx, s.cy * height + dy);
      shatterCtx.rotate(rot);
      shatterCtx.translate(-s.cx * width, -s.cy * height);
      shatterCtx.beginPath();
      s.points.forEach((point, i) => {
        const x = point[0] * width;
        const y = point[1] * height;
        i ? shatterCtx.lineTo(x, y) : shatterCtx.moveTo(x, y);
      });
      shatterCtx.closePath();
      shatterCtx.fillStyle = index % 3 ? `rgba(240,241,250,${.18 + p * .18})` : `rgba(193,255,0,${.16 + p * .12})`;
      shatterCtx.fill();
      shatterCtx.stroke();
      shatterCtx.restore();
    });
    $('#shatter-count').textContent = moving ? `${moving} fragments` : 'assembled';
  });

  class SecondOrderDynamics {
    constructor(frequency, damping, response, x = .5, y = .5) {
      this.configure(frequency, damping, response);
      this.x = { x, y };
      this.y = { x, y };
      this.yd = { x: 0, y: 0 };
      this.xp = { x, y };
    }
    configure(frequency, damping, response) {
      this.frequency = frequency;
      this.damping = damping;
      this.response = response;
      this.k1 = damping / (Math.PI * frequency);
      this.k2 = 1 / ((2 * Math.PI * frequency) ** 2);
      this.k3 = response * damping / (2 * Math.PI * frequency);
    }
    update(dt, target) {
      if (!dt) {
        this.x = { ...target };
        this.y = { ...target };
        this.yd = { x: 0, y: 0 };
        this.xp = { ...target };
        return this.y;
      }
      const xd = { x: (target.x - this.xp.x) / dt, y: (target.y - this.xp.y) / dt };
      this.xp = { ...target };
      const k2Stable = Math.max(this.k2, dt * dt / 2 + dt * this.k1 / 2, dt * this.k1);
      this.y.x += dt * this.yd.x;
      this.y.y += dt * this.yd.y;
      this.yd.x += dt * (target.x + this.k3 * xd.x - this.y.x - this.k1 * this.yd.x) / k2Stable;
      this.yd.y += dt * (target.y + this.k3 * xd.y - this.y.y - this.k1 * this.yd.y) / k2Stable;
      this.x = { ...target };
      return this.y;
    }
  }

  const springStage = $('.spring-stage');
  const springTarget = $('#spring-target');
  const springFollower = $('#spring-follower');
  const springPath = $('#spring-path');
  const presets = { focus: [1, .6, 2], zoom: [2.2, .7, 3], border: [2.5, .5, 2] };
  let springGoal = { x: .5, y: .5 };
  const spring = new SecondOrderDynamics(...presets.focus);

  function setSpringPosition(point) {
    springGoal = { x: clamp(point.x), y: clamp(point.y) };
    requestFrame();
  }
  springStage.addEventListener('pointermove', (event) => setSpringPosition(localPoint(springStage, event)));
  springStage.addEventListener('keydown', (event) => {
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    setSpringPosition({
      x: springGoal.x + (event.key === 'ArrowRight' ? .05 : event.key === 'ArrowLeft' ? -.05 : 0),
      y: springGoal.y + (event.key === 'ArrowDown' ? .05 : event.key === 'ArrowUp' ? -.05 : 0),
    });
  });
  $('#spring-preset').addEventListener('change', (event) => {
    spring.configure(...presets[event.target.value]);
    $('#spring-preset-name').textContent = `${event.target.value} (${presets[event.target.value].join(', ')})`;
    requestFrame();
  });
  $('[data-action="spring-center"]').addEventListener('click', () => setSpringPosition({ x: .5, y: .5 }));

  demo('spring', (dt, baseDt) => {
    const rect = springStage.getBoundingClientRect();
    const p = spring.update(state.reduced ? 0 : dt || baseDt, springGoal);
    springTarget.style.left = `${springGoal.x * 100}%`;
    springTarget.style.top = `${springGoal.y * 100}%`;
    springFollower.style.left = `${p.x * 100}%`;
    springFollower.style.top = `${p.y * 100}%`;
    springPath.setAttribute('d', `M ${springGoal.x * rect.width} ${springGoal.y * rect.height} C ${springGoal.x * rect.width} ${p.y * rect.height}, ${p.x * rect.width} ${springGoal.y * rect.height}, ${p.x * rect.width} ${p.y * rect.height}`);
    $('#spring-readout').textContent = `x ${Math.round(p.x * 100)} / y ${Math.round(p.y * 100)}`;
  });

  const loaderCanvas = $('#loader-canvas');
  const loaderCtx = loaderCanvas.getContext('2d');
  let loaderTime = 0;
  let loaderRunning = false;
  let loaderScene = false;
  function resetLoader() {
    loaderTime = 0;
    loaderRunning = false;
    loaderScene = false;
    $('#loader-page').classList.remove('is-b');
    $('#loader-page span').textContent = 'SCENE A';
    $('#loader-page strong').textContent = 'OPEN THE SOURCE';
    $('#loader-status').textContent = 'ready';
    requestFrame();
  }
  $('[data-action="loader-play"]').addEventListener('click', () => {
    loaderTime = 0;
    loaderRunning = true;
    requestFrame();
  });
  $('[data-action="loader-reset"]').addEventListener('click', resetLoader);

  demo('loader', (dt) => {
    const { width, height } = fit(loaderCanvas);
    if (loaderRunning && dt) loaderTime += dt;
    const t = clamp(loaderTime / 3.2);
    const percent = Math.round(t * 100);
    $('#digit-a').textContent = Math.floor(percent / 100);
    $('#digit-b').textContent = Math.floor(percent / 10) % 10;
    $('#digit-c').textContent = percent % 10;
    if (t > .38 && !loaderScene) {
      loaderScene = true;
      $('#loader-page').classList.add('is-b');
      $('#loader-page span').textContent = 'SCENE B';
      $('#loader-page strong').textContent = 'SHOW THE LIMIT';
    }
    loaderCtx.clearRect(0, 0, width, height);
    if (t < 1 || loaderRunning) {
      loaderCtx.fillStyle = '#000';
      loaderCtx.fillRect(0, 0, width, height);
      const bar = clamp(t / .38);
      loaderCtx.fillStyle = '#f0f1fa';
      for (let i = 0; i < 5; i += 1) {
        const active = clamp(bar * 5 - i);
        loaderCtx.fillRect(width * .5 - 95 + i * 42, height * .5, 28 * active, 5);
      }
      loaderCtx.globalCompositeOperation = 'destination-out';
      const open = ease((t - .36) / .64);
      loaderCtx.save();
      loaderCtx.translate(width / 2, height / 2);
      loaderCtx.rotate(open * Math.PI * .52);
      const size = open * Math.max(width, height) * 1.4;
      loaderCtx.fillRect(-size / 2, -size * .11, size, size * .22);
      loaderCtx.fillRect(-size * .11, -size / 2, size * .22, size);
      loaderCtx.restore();
      loaderCtx.globalCompositeOperation = 'source-over';
      $('#loader-status').textContent = loaderRunning ? `${percent}% / staged loader` : 'ready';
    }
    if (loaderRunning && t >= 1) {
      loaderRunning = false;
      $('#loader-status').textContent = 'complete / local transition only';
    }
  }, resetLoader);

  const modelCanvas = $('#model-canvas');
  const modelCtx = modelCanvas.getContext('2d');
  const modelSelect = $('#model-select');
  let modelRotation = { x: -.2, y: .4 };
  let modelDrag = null;
  let decodedModels = [];
  let activeModel = null;
  let modelRequest = 0;
  let modelController;

  function normalizePoints(model) {
    const min = model.bounds.min;
    const max = model.bounds.max;
    const center = min.map((value, index) => (value + max[index]) / 2);
    const span = Math.max(...max.map((value, index) => Math.abs(value - min[index])), .0001);
    return model.positions.map((p, index) => ({
      x: (p[0] - center[0]) / span,
      y: (p[1] - center[1]) / span,
      z: (p[2] - center[2]) / span,
      i: index,
    }));
  }

  async function loadModel(index) {
    const entry = decodedModels[index];
    if (!entry) return;
    const request = ++modelRequest;
    modelController?.abort();
    modelController = new AbortController();
    $('#model-readout').textContent = '모델을 읽는 중…';
    try {
      const response = await fetch(entry.points, { signal: modelController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const model = await response.json();
      if (request !== modelRequest) return;
      activeModel = {
        ...entry,
        bounds: model.bounds,
        points: normalizePoints(model),
        source: model.source,
      };
      $('#model-name').textContent = `${entry.label} / ${entry.status}`;
      $('#model-readout').textContent = `${entry.vertexCount} vertices`;
      demos.find((item) => item.id === 'models')?.render(0, 1 / 60);
      requestFrame();
    } catch (error) {
      if (error.name === 'AbortError' || request !== modelRequest) return;
      $('#model-readout').textContent = '모델을 읽지 못했습니다. 다른 모델을 선택하거나 로컬 서버에서 다시 열어주세요.';
    }
  }

  fetch('sources/decoded/manifest.json').then((response) => response.json()).then((manifest) => {
    decodedModels = manifest.models.filter((entry) => entry.points);
    modelSelect.innerHTML = decodedModels.map((entry, index) => `<option value="${index}">${entry.label} · ${entry.status}</option>`).join('');
    const requested = new URLSearchParams(location.search).get('path');
    const matched = decodedModels.findIndex((entry) => entry.file === requested || entry.points === requested || entry.obj === requested);
    const preferred = matched >= 0 ? matched : decodedModels.findIndex((entry) => /cross\.buf$/.test(entry.file));
    modelSelect.value = String(preferred >= 0 ? preferred : 0);
    return loadModel(Number(modelSelect.value));
  }).catch((error) => {
    modelSelect.innerHTML = '<option>decoded manifest 로드 실패</option>';
    $('#model-readout').textContent = error.message;
  });
  modelSelect.addEventListener('change', (event) => loadModel(Number(event.target.value)));
  $('[data-action="model-reset"]').addEventListener('click', () => {
    modelRotation = { x: -.2, y: .4 };
    requestFrame();
  });
  modelCanvas.addEventListener('pointerdown', (event) => {
    modelDrag = { x: event.clientX, y: event.clientY };
    modelCanvas.setPointerCapture(event.pointerId);
  });
  modelCanvas.addEventListener('pointermove', (event) => {
    if (!modelDrag) return;
    modelRotation.y += (event.clientX - modelDrag.x) * .008;
    modelRotation.x += (event.clientY - modelDrag.y) * .008;
    modelDrag = { x: event.clientX, y: event.clientY };
    requestFrame();
  });
  modelCanvas.addEventListener('pointerup', () => { modelDrag = null; });
  modelCanvas.addEventListener('keydown', (event) => {
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    modelRotation.y += event.key === 'ArrowRight' ? .12 : event.key === 'ArrowLeft' ? -.12 : 0;
    modelRotation.x += event.key === 'ArrowDown' ? .12 : event.key === 'ArrowUp' ? -.12 : 0;
    requestFrame();
  });

  demo('models', (dt) => {
    const { width, height, dpr } = fit(modelCanvas);
    if (!state.reduced && !state.paused) modelRotation.y += dt * .18;
    modelCtx.fillStyle = '#111217';
    modelCtx.fillRect(0, 0, width, height);
    modelCtx.strokeStyle = 'rgba(240,241,250,.08)';
    modelCtx.lineWidth = 1;
    for (let x = width * .1; x < width; x += width * .1) {
      modelCtx.beginPath();
      modelCtx.moveTo(x, 0);
      modelCtx.lineTo(x, height);
      modelCtx.stroke();
    }
    for (let y = height * .1; y < height; y += height * .1) {
      modelCtx.beginPath();
      modelCtx.moveTo(0, y);
      modelCtx.lineTo(width, y);
      modelCtx.stroke();
    }
    if (!activeModel) return;
    const sx = Math.sin(modelRotation.x);
    const cx = Math.cos(modelRotation.x);
    const sy = Math.sin(modelRotation.y);
    const cy = Math.cos(modelRotation.y);
    const step = Math.max(1, Math.ceil(activeModel.points.length / 4800));
    const projected = [];
    for (let i = 0; i < activeModel.points.length; i += step) {
      const p = activeModel.points[i];
      const y1 = p.y * cx - p.z * sx;
      const z1 = p.y * sx + p.z * cx;
      const x2 = p.x * cy + z1 * sy;
      const z2 = -p.x * sy + z1 * cy;
      const scale = Math.min(width, height) * .92 / (2.1 + z2);
      projected.push({ x: width / 2 + x2 * scale, y: height / 2 - y1 * scale, z: z2, i });
    }
    projected.sort((a, b) => b.z - a.z);
    for (const p of projected) {
      modelCtx.globalAlpha = clamp(.35 - p.z * .16, .18, .9);
      modelCtx.fillStyle = p.i % 7 === 0 ? '#c1ff00' : '#f0f1fa';
      modelCtx.fillRect(p.x, p.y, Math.max(1.5, 2.4 * dpr), Math.max(1.5, 2.4 * dpr));
    }
    modelCtx.globalAlpha = 1;
  });

  const bufFiles = [
    'sources/assets/lusion.dev/assets/models/about/person.buf',
    'sources/assets/lusion.dev/assets/models/about/person_idle.buf',
    'sources/assets/lusion.dev/assets/models/playground/tunnel.buf',
    'sources/assets/lusion.dev/assets/models/home/cross.buf',
  ];
  async function parseBuf(url) {
    const response = await fetch(url);
    const array = await response.arrayBuffer();
    const view = new DataView(array);
    const length = view.getUint32(0, true);
    const header = JSON.parse(new TextDecoder().decode(new Uint8Array(array, 4, length)));
    return {
      file: url,
      vertexCount: header.vertexCount,
      indexCount: header.indexCount,
      attributes: header.attributes.map((attr) => `${attr.id}:${attr.storageType}[${attr.componentSize}]${attr.needsPack ? '*' : ''}`).join(', '),
      bytes: array.byteLength,
      headerBytes: length,
    };
  }
  Promise.all(bufFiles.map(parseBuf)).then((rows) => {
    $('#buf-table').innerHTML = rows.map((row) => `<tr><td>${row.file}</td><td>${row.vertexCount}</td><td>${row.indexCount}</td><td>${row.attributes}</td><td>${row.headerBytes}B JSON + binary payload / ${row.bytes}B</td></tr>`).join('');
  }).catch((error) => {
    $('#buf-table').innerHTML = `<tr><td colspan="5">fetch 실패: ${error.message}</td></tr>`;
  });

  updateRuntime();
  demos.forEach((item) => item.render(0, 1 / 60));
})();
