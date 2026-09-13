/* Independent reconstruction. Source anchors and differences: media/reconstruction-spec.md.
   No original site bundle, dependencies, telemetry, network submission, audio or video execution. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { paused: false, reduced: reducedQuery.matches, speed: 1, amplitude: 1 };
  const scenes = [];
  let raf = 0, previous = 0;
  $('reduce-motion').checked = state.reduced;
  function requestDraw() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now;
    const running = !state.paused && !state.reduced && !document.hidden;
    for (const scene of scenes) if (scene.visible) scene.render(running ? dt * state.speed : 0);
    if (running && scenes.some((s) => s.visible)) requestDraw();
  }
  function register(id, render) {
    const scene = { id, element: $(id), render, visible: false };
    scenes.push(scene); return scene;
  }
  function motionAllowed() { return !state.paused && !state.reduced; }
  function syncRuntime() {
    document.body.classList.toggle('motion-reduced', state.reduced);
    document.body.classList.toggle('motion-paused', state.paused);
    $('pause-all').textContent = state.paused ? '▶ 전체 다시 재생' : 'Ⅱ 전체 일시정지';
    $('pause-all').setAttribute('aria-pressed', String(state.paused));
    $('runtime-status').textContent = state.reduced ? '동작 감소 · 고정 장면' : state.paused ? '모든 타임라인 일시정지' : '화면 안 장면만 재생';
    previous = 0; requestDraw();
  }
  $('pause-all').addEventListener('click', () => { state.paused = !state.paused; syncRuntime(); });
  $('reduce-motion').addEventListener('change', (e) => { state.reduced = e.target.checked; settleReduced(); syncRuntime(); });
  reducedQuery.addEventListener('change', (e) => { state.reduced = e.matches; $('reduce-motion').checked = e.matches; settleReduced(); syncRuntime(); });
  for (const key of ['speed', 'amplitude']) $(key).addEventListener('input', (e) => {
    state[key] = Number(e.target.value); $(`${key}-value`).textContent = `${state[key].toFixed(2)}×`; requestDraw();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; previous = 0; } else requestDraw();
  });
  function fit(canvas) {
    const bounds = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(bounds.width * dpr)), height = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    return { w: canvas.width, h: canvas.height, dpr };
  }
  function pointerInput(element, pointer, action) {
    element.addEventListener('pointermove', (e) => {
      if (!motionAllowed()) return;
      const r = element.getBoundingClientRect();
      pointer.x = clamp((e.clientX - r.left) / r.width, 0, 1) * 2 - 1;
      pointer.y = clamp((e.clientY - r.top) / r.height, 0, 1) * 2 - 1;
      requestDraw();
    });
    element.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; requestDraw(); });
    element.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); if (!motionAllowed()) return;
        pointer.x = clamp(pointer.x + (e.key === 'ArrowRight' ? .2 : e.key === 'ArrowLeft' ? -.2 : 0), -1, 1);
        pointer.y = clamp(pointer.y + (e.key === 'ArrowDown' ? .2 : e.key === 'ArrowUp' ? -.2 : 0), -1, 1); requestDraw();
      } else if (action && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); action(); }
    });
    if (action) element.addEventListener('click', action);
  }
  function program(gl, vertex, fragment) {
    const shaders = [];
    for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(kind); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      shaders.push(shader);
    }
    const p = gl.createProgram(); shaders.forEach((s) => gl.attachShader(p, s)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    shaders.forEach((s) => gl.deleteShader(s)); gl.useProgram(p); return p;
  }
  function buffer(gl, p, name, values, size) {
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(p, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }
  function uniform(gl, p, name) { return gl.getUniformLocation(p, name); }

  // 01: A real rounded box mesh for each of three intersecting bars, with per-vertex normals.
  function crossGeometry() {
    const positions = [], normals = [], steps = 8, bevel = .20;
    for (let bar = 0; bar < 3; bar++) {
      const half = [.32, .32, .32]; half[bar] = 1.03;
      for (let axis = 0; axis < 3; axis++) for (const side of [-1, 1]) {
        const u = (axis + 1) % 3, v = (axis + 2) % 3;
        function point(i, j) {
          const a = [0, 0, 0]; a[axis] = half[axis] * side;
          a[u] = (i / steps * 2 - 1) * half[u]; a[v] = (j / steps * 2 - 1) * half[v];
          const inner = a.map((x, k) => clamp(x, -half[k] + bevel, half[k] - bevel));
          const n = a.map((x, k) => x - inner[k]), length = Math.hypot(...n);
          return { p: inner.map((x, k) => x + n[k] / length * bevel), n: n.map((x) => x / length) };
        }
        for (let i = 0; i < steps; i++) for (let j = 0; j < steps; j++) {
          const corners = [point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)];
          for (const k of [0, 1, 2, 0, 2, 3]) { positions.push(...corners[k].p); normals.push(...corners[k].n); }
        }
      }
    }
    return { positions, normals };
  }
  const kineticCanvas = $('kinetic-canvas'), kp = { x: 0, y: 0 };
  const bodies = Array.from({ length: 11 }, (_, i) => ({
    x: ((i % 4) - 1.5) * 1.64 + (i > 7 ? .7 : 0), y: (Math.floor(i / 4) - 1) * 1.48,
    z: Math.sin(i * 4.1) * 1.1, offset: [0, 0], velocity: [0, 0], phase: i * 2.399,
  }));
  let kt = 0, palette = 0, kineticRenderer;
  function burst() {
    palette = (palette + 1) % 3;
    if (motionAllowed()) bodies.forEach((b, i) => { b.velocity[0] += Math.cos(i * 2.399) * 5; b.velocity[1] += Math.sin(i * 2.399) * 5; });
    requestDraw();
  }
  $('burst').addEventListener('click', burst); pointerInput(kineticCanvas, kp, burst);
  const colors = [[.91, .89, .82], [.045, .05, .06], [.045, .12, .95]];
  try {
    const gl = kineticCanvas.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) throw new Error('WebGL unavailable');
    const p = program(gl, `attribute vec3 aPosition; attribute vec3 aNormal;
      uniform vec3 uRotation; uniform vec3 uPosition; uniform float uAspect; uniform float uScale;
      varying vec3 vNormal; varying vec3 vPosition;
      vec3 rotate(vec3 p){vec3 c=cos(uRotation),s=sin(uRotation);
        p=vec3(p.x,p.y*c.x-p.z*s.x,p.y*s.x+p.z*c.x);
        p=vec3(p.x*c.y+p.z*s.y,p.y,-p.x*s.y+p.z*c.y);
        return vec3(p.x*c.z-p.y*s.z,p.x*s.z+p.y*c.z,p.z);}
      void main(){vec3 p=rotate(aPosition*uScale)+uPosition;vNormal=rotate(aNormal);vPosition=p;
        float z=8.8+p.z;gl_Position=vec4(p.x*2.65/uAspect,p.y*2.65,z*1.01005-.201005,z);}`,
      `precision mediump float; varying vec3 vNormal; varying vec3 vPosition; uniform vec3 uColor;
      void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.5,1.,-1.5));
        vec3 view=normalize(vec3(0.,0.,-8.8)-vPosition);float diff=max(dot(n,light),0.);
        float spec=pow(max(dot(n,normalize(light+view)),0.),44.);
        float rim=pow(1.-max(dot(n,view),0.),3.);
        vec3 color=uColor*(.22+.78*diff)+vec3(.80,.85,1.)*spec*.8+vec3(.1,.13,.2)*rim;
        gl_FragColor=vec4(pow(color,vec3(.85)),1.);}`);
    const geometry = crossGeometry(); buffer(gl, p, 'aPosition', geometry.positions, 3); buffer(gl, p, 'aNormal', geometry.normals, 3);
    const uniforms = Object.fromEntries(['uRotation', 'uPosition', 'uAspect', 'uScale', 'uColor'].map((n) => [n, uniform(gl, p, n)]));
    kineticRenderer = (w, h) => {
      gl.viewport(0, 0, w, h); gl.clearColor(.047, .051, .059, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
      gl.uniform1f(uniforms.uAspect, w / h);
      const narrow = w / h < 1, spread = narrow ? .65 : 1;
      bodies.forEach((b, i) => {
        gl.uniform3f(uniforms.uRotation, b.phase + kt * .18 * state.amplitude + kp.y * .4, b.phase * .7 + kt * .23 * state.amplitude + kp.x * .65, Math.sin(kt * .22 + b.phase) * .3 * state.amplitude);
        gl.uniform3f(uniforms.uPosition, (b.x + b.offset[0]) * spread, b.y + b.offset[1] + (narrow ? .75 : .28), b.z);
        gl.uniform1f(uniforms.uScale, narrow ? .54 : .84); gl.uniform3fv(uniforms.uColor, colors[(i + palette) % 3]);
        gl.drawArrays(gl.TRIANGLES, 0, geometry.positions.length / 3);
      });
    };
    $('kinetic-engine').textContent = 'NATIVE WEBGL / 11 MODULES';
    kineticCanvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); $('kinetic-engine').textContent = 'GPU 중단 · 정적 대체 화면'; showKineticFallback(); });
  } catch { showKineticFallback(); }
  function showKineticFallback() {
    const old = $('kinetic-canvas'), replacement = old.cloneNode(false); old.replaceWith(replacement);
    const ctx = replacement.getContext('2d'); pointerInput(replacement, kp, burst);
    $('kinetic-engine').textContent = 'CANVAS 2D / 3D PROJECTION FALLBACK';
    kineticRenderer = (w, h) => {
      ctx.fillStyle = '#101112'; ctx.fillRect(0, 0, w, h);
      const faces = [];
      function rotate(v, a, b) {
        const [x, y, z] = v, yy = y * Math.cos(a) - z * Math.sin(a), zz = y * Math.sin(a) + z * Math.cos(a);
        return [x * Math.cos(b) + zz * Math.sin(b), yy, -x * Math.sin(b) + zz * Math.cos(b)];
      }
      bodies.forEach((body, index) => {
        for (let bar = 0; bar < 3; bar++) {
          const half = [.25, .25, .25]; half[bar] = .85;
          const points = Array.from({ length: 8 }, (_, n) => rotate(half.map((v, axis) => v * ((n >> axis & 1) ? 1 : -1)), body.phase + kt * .18 * state.amplitude + kp.y * .4, body.phase * .7 + kt * .23 * state.amplitude + kp.x * .65)).map((v) => [v[0] + (body.x + body.offset[0]) * (w < h ? .62 : 1), v[1] + body.y + body.offset[1] + .25, v[2] + body.z]);
          for (const f of [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]) {
            const coords = f.map((i) => points[i]), z = coords.reduce((sum, v) => sum + v[2], 0) / 4;
            const color = colors[(index + palette) % 3].map((c) => Math.round(clamp(c * (.75 + f[0] * .04)) * 255));
            faces.push({ coords, z, color });
          }
        }
      });
      faces.sort((a, b) => b.z - a.z).forEach((f) => {
        ctx.beginPath(); f.coords.forEach((v, i) => { const scale = h * 1.325 / (8.8 + v[2]); const x = w / 2 + v[0] * scale, y = h / 2 - v[1] * scale; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fillStyle = `rgb(${f.color.join(',')})`; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.stroke();
      });
    };
  }
  // Alternative point-cloud study: sphere -> rounded cross, plus decaying radial scatter.
  const cloudCanvas = document.createElement('canvas'); cloudCanvas.id = 'kinetic-cloud'; cloudCanvas.tabIndex = 0;
  cloudCanvas.setAttribute('role', 'img'); cloudCanvas.setAttribute('aria-label', '3D 점 구름의 구체와 십자 형태 전환. 방향키로 회전, Enter로 흩뜨리기');
  Object.assign(cloudCanvas.style, { position: 'absolute', inset: '0', display: 'none' });
  $('kinetic-canvas').after(cloudCanvas); const cloudContext = cloudCanvas.getContext('2d');
  const cloudButton = document.createElement('button'); cloudButton.type = 'button'; cloudButton.id = 'kinetic-cloud-toggle'; cloudButton.className = 'pill inverse';
  cloudButton.textContent = '점 구름 모드'; cloudButton.setAttribute('aria-pressed', 'false'); $('burst').before(cloudButton);
  let cloudMode = false, cloudScatter = 0;
  const cloudGeometry = crossGeometry().positions;
  const cloudPoints = Array.from({ length: 2400 }, (_, i) => {
    const y = 1 - i / 2399 * 2, radius = Math.sqrt(1 - y * y), angle = i * 2.399963;
    const index = (i * 23 % (cloudGeometry.length / 3)) * 3;
    return { sphere: [Math.cos(angle) * radius * 2.1, y * 2.1, Math.sin(angle) * radius * 2.1], cross: cloudGeometry.slice(index, index + 3).map((v) => v * 1.9), phase: i * 2.399963 };
  });
  const engineLabel = $('kinetic-engine').textContent;
  cloudButton.addEventListener('click', () => {
    cloudMode = !cloudMode; cloudCanvas.style.display = cloudMode ? 'block' : 'none'; $('kinetic-canvas').style.opacity = cloudMode ? '0' : '1'; $('kinetic-canvas').tabIndex = cloudMode ? -1 : 0;
    cloudButton.textContent = cloudMode ? '입체 모듈 모드' : '점 구름 모드'; cloudButton.setAttribute('aria-pressed', String(cloudMode));
    $('kinetic-engine').textContent = cloudMode ? '3D POINT CLOUD / 2,400 PARTICLES' : engineLabel; requestDraw();
  });
  function cloudBurst() { burst(); if (motionAllowed()) cloudScatter = 1; }
  pointerInput(cloudCanvas, kp, cloudBurst); $('burst').addEventListener('click', () => { if (cloudMode && motionAllowed()) cloudScatter = 1; });
  function renderCloud(dt) {
    const { w, h, dpr } = fit(cloudCanvas); cloudScatter *= Math.exp(-1.4 * dt);
    cloudContext.fillStyle = '#101112'; cloudContext.fillRect(0, 0, w, h);
    const morph = state.reduced ? 0 : (Math.sin(kt * .42) + 1) / 2, ax = kp.y * .4 + .2, ay = kt * .18 * state.amplitude + kp.x * .6;
    const points = cloudPoints.map((point, i) => {
      const p = point.sphere.map((v, k) => v * (1 - morph) + point.cross[k] * morph + Math.sin(point.phase + k * 5.1) * cloudScatter * 2.7 * state.amplitude);
      const yy = p[1] * Math.cos(ax) - p[2] * Math.sin(ax), zz = p[1] * Math.sin(ax) + p[2] * Math.cos(ax);
      const x = p[0] * Math.cos(ay) + zz * Math.sin(ay), z = -p[0] * Math.sin(ay) + zz * Math.cos(ay);
      const scale = Math.min(w, h) * 1.22 / (7 + z);
      return { x: w * .5 + x * scale, y: h * (w < h ? .40 : .47) - yy * scale, z, size: clamp(2.4 - z * .3, .9, 3.5) * dpr, i };
    });
    points.sort((a, b) => b.z - a.z).forEach((p) => {
      cloudContext.globalAlpha = clamp(.72 - p.z * .12, .2, 1); cloudContext.fillStyle = (p.i + palette) % 4 ? '#eeeeff' : '#425bff';
      cloudContext.fillRect(p.x, p.y, p.size, p.size);
    }); cloudContext.globalAlpha = 1;
  }
  register('kinetic', (dt) => {
    const { w, h } = fit($('kinetic-canvas')); kt += dt;
    if (dt) bodies.forEach((b) => { for (let k = 0; k < 2; k++) { b.velocity[k] += -b.offset[k] * 14 * dt; b.velocity[k] *= Math.exp(-3.8 * dt); b.offset[k] += b.velocity[k] * dt * state.amplitude; } });
    if (cloudMode) renderCloud(dt); else kineticRenderer(w, h);
  });

  // 02: RGB + depth are genuinely sampled in a fragment shader. Static poster survives failure.
  const dc = $('depth-canvas'), dp = { x: 0, y: 0 }, ds = { x: 0, y: 0 };
  let depthRender = null;
  pointerInput(dc, dp); $('show-depth').addEventListener('change', requestDraw);
  $('depth-center').addEventListener('click', () => { dp.x = dp.y = ds.x = ds.y = 0; requestDraw(); });
  const assetBase = 'sources/assets/lusion.dev/assets/projects/porsche_dream_machine/';
  function imageLoad(src) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; }); }
  function depthFallback(message) {
    dc.style.opacity = '0'; $('depth-engine').textContent = message;
    $('show-depth').disabled = true; $('show-depth').checked = false; depthRender = null;
  }
  (async () => {
    try {
      const gl = dc.getContext('webgl', { alpha: false, antialias: false }); if (!gl) throw new Error('WebGL unavailable');
      const p = program(gl, `attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`,
        `precision mediump float; varying vec2 vUv; uniform sampler2D uImage;uniform sampler2D uDepth;
        uniform vec2 uPointer;uniform vec2 uCover;uniform float uShowDepth;
        void main(){vec2 uv=(vUv-.5)*uCover*.94+.5;vec2 ray=uPointer*.026;vec2 sampleUv=uv;
          for(int i=0;i<12;i++){float d=texture2D(uDepth,clamp(sampleUv,.001,.999)).r;sampleUv=uv+ray*(d-.5);}
          sampleUv=clamp(sampleUv,.001,.999);vec4 rgb=texture2D(uImage,sampleUv);float d=texture2D(uDepth,uv).r;
          gl_FragColor=mix(rgb,vec4(vec3(d),1.),uShowDepth);}`);
      buffer(gl, p, 'aPosition', [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1], 2);
      const imgs = await Promise.all([imageLoad(`${assetBase}home.webp`), imageLoad(`${assetBase}home_depth.webp`)]);
      imgs.forEach((img, i) => {
        gl.activeTexture(gl.TEXTURE0 + i); const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(uniform(gl, p, i ? 'uDepth' : 'uImage'), i);
      });
      const pointer = uniform(gl, p, 'uPointer'), cover = uniform(gl, p, 'uCover'), showDepth = uniform(gl, p, 'uShowDepth');
      depthRender = (w, h) => {
        gl.viewport(0, 0, w, h); const imageAspect = imgs[0].width / imgs[0].height, aspect = w / h;
        gl.uniform2f(cover, Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect));
        gl.uniform2f(pointer, ds.x * state.amplitude, -ds.y * state.amplitude); gl.uniform1f(showDepth, $('show-depth').checked ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };
      dc.style.opacity = '1'; $('depth-engine').textContent = 'WEBGL / 12 DEPTH SAMPLES'; requestDraw();
      dc.addEventListener('webglcontextlost', (e) => { e.preventDefault(); depthFallback('GPU 중단 · RGB 포스터'); });
    } catch { depthFallback('RGB 포스터 · GPU 또는 텍스처 로드 불가'); }
  })();
  register('depth', (dt) => {
    if (dt) { const f = 1 - Math.exp(-7 * dt); ds.x += (dp.x - ds.x) * f; ds.y += (dp.y - ds.y) * f; }
    const { w, h } = fit(dc); if (depthRender) depthRender(w, h);
  });

  // 03: Velocity-sensitive particles plus a displaced line field; deliberately no fake FBO claim.
  const impactCanvas = $('impact-canvas'), ic = impactCanvas.getContext('2d');
  const particles = [], ripples = [];
  let lastPointer = null;
  function addImpact(x = .5, y = .5) {
    if (state.paused) return;
    ripples.push({ x, y, age: 0 });
    if (!state.reduced) for (let i = 0; i < 28; i++) { const angle = i / 28 * Math.PI * 2; particles.push({ x, y, vx: Math.cos(angle) * .13, vy: Math.sin(angle) * .13, age: 0, radius: 5 + i % 4 }); }
    if (ripples.length > 8) ripples.shift(); requestDraw();
  }
  impactCanvas.addEventListener('pointermove', (e) => {
    if (!motionAllowed()) return;
    const r = impactCanvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const velocity = lastPointer ? Math.hypot(x - lastPointer.x, y - lastPointer.y) : 0;
    particles.push({ x, y, vx: 0, vy: -.007, age: 0, radius: clamp(velocity * 170, 4, 24) });
    if (particles.length > 160) particles.shift(); lastPointer = { x, y }; requestDraw();
  });
  impactCanvas.addEventListener('pointerleave', () => { lastPointer = null; });
  impactCanvas.addEventListener('click', (e) => { const r = impactCanvas.getBoundingClientRect(); addImpact((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
  impactCanvas.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addImpact(); } });
  $('impact-trigger').addEventListener('click', () => addImpact());
  $('impact-clear').addEventListener('click', () => { particles.length = ripples.length = 0; $('impact-count').textContent = '0 PARTICLES / 0 WAVES'; requestDraw(); });
  register('impact', (dt) => {
    const { w, h, dpr } = fit(impactCanvas); ic.fillStyle = '#10111b'; ic.fillRect(0, 0, w, h);
    const step = 30 * dpr;
    ic.lineWidth = dpr * .6; ic.strokeStyle = '#2a2c46';
    function displace(x, y) {
      let dx = 0, dy = 0;
      for (const r of ripples) {
        const rx = x - r.x * w, ry = y - r.y * h, dist = Math.hypot(rx, ry) || 1;
        const wave = Math.sin((dist - r.age * 240 * dpr) / (22 * dpr)) * Math.exp(-Math.pow((dist - r.age * 240 * dpr) / (90 * dpr), 2)) * Math.max(0, 1 - r.age / 2) * 20 * dpr * state.amplitude;
        dx += rx / dist * wave; dy += ry / dist * wave;
      }
      return [x + dx, y + dy];
    }
    for (let y = 0; y < h; y += step) { ic.beginPath(); for (let x = 0; x <= w + step; x += step / 2) { const p = displace(x, y); x === 0 ? ic.moveTo(...p) : ic.lineTo(...p); } ic.stroke(); }
    for (let x = 0; x < w; x += step) { ic.beginPath(); for (let y = 0; y <= h + step; y += step / 2) { const p = displace(x, y); y === 0 ? ic.moveTo(...p) : ic.lineTo(...p); } ic.stroke(); }
    ic.globalCompositeOperation = 'screen';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.age += dt; p.x += p.vx * dt * state.amplitude; p.y += p.vy * dt * state.amplitude;
      if (p.age > 1.8) { particles.splice(i, 1); continue; }
      const radius = (p.radius + p.age * 17) * dpr, alpha = Math.pow(1 - p.age / 1.8, 2);
      const gradient = ic.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, radius);
      gradient.addColorStop(0, `rgba(85,108,255,${alpha * .9})`); gradient.addColorStop(.3, `rgba(49,64,255,${alpha * .65})`); gradient.addColorStop(1, 'rgba(67,70,250,0)');
      ic.fillStyle = gradient; ic.beginPath(); ic.arc(p.x * w, p.y * h, radius, 0, Math.PI * 2); ic.fill();
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]; r.age += dt; if (r.age > 2) { ripples.splice(i, 1); continue; }
      ic.strokeStyle = `rgba(170,179,255,${.6 * (1 - r.age / 2)})`; ic.lineWidth = 2 * dpr; ic.beginPath(); ic.arc(r.x * w, r.y * h, (12 + r.age * 220 * state.amplitude) * dpr, 0, Math.PI * 2); ic.stroke();
    }
    ic.globalCompositeOperation = 'source-over'; $('impact-count').textContent = `${particles.length} PARTICLES / ${ripples.length} WAVES`;
  });

  // 04: A procedural 3D tunnel, projected into Canvas 2D. Camera progress is the sole timeline input.
  const tc = $('tunnel-canvas'), tctx = tc.getContext('2d');
  let tunnelProgress = 0, tunnelPlaying = false, tunnelPortal = false;
  const portalButton = document.createElement('button'); portalButton.type = 'button'; portalButton.id = 'tunnel-portal'; portalButton.textContent = '포털·파편 모드'; portalButton.setAttribute('aria-pressed', 'false');
  $('tunnel-play').after(portalButton);
  portalButton.addEventListener('click', () => { tunnelPortal = !tunnelPortal; portalButton.setAttribute('aria-pressed', String(tunnelPortal)); portalButton.textContent = tunnelPortal ? '구조 터널 모드' : '포털·파편 모드'; requestDraw(); });
  function syncTunnel() {
    $('tunnel-progress').value = tunnelProgress * 100; $('tunnel-progress-value').textContent = `${Math.round(tunnelProgress * 100)}%`;
    $('tunnel-number').textContent = String(Math.round(tunnelProgress * 100)).padStart(3, '0');
    $('tunnel-phase').textContent = `${tunnelPortal ? 'PORTAL / ' : ''}${tunnelProgress < .22 ? 'ENTER' : tunnelProgress > .78 ? 'EXIT' : 'TRAVEL'}`;
    $('tunnel-play').textContent = tunnelPlaying ? '자동 탐색 정지' : '자동 탐색 재생'; $('tunnel-play').setAttribute('aria-pressed', String(tunnelPlaying));
  }
  $('tunnel-progress').addEventListener('input', (e) => { tunnelProgress = Number(e.target.value) / 100; tunnelPlaying = false; $('tunnel-scroll').checked = false; syncTunnel(); requestDraw(); });
  $('tunnel-play').addEventListener('click', () => { tunnelPlaying = !tunnelPlaying; $('tunnel-scroll').checked = false; if (tunnelProgress >= 1) tunnelProgress = 0; syncTunnel(); requestDraw(); });
  function scrollTunnel() {
    if (!$('tunnel-scroll').checked || !motionAllowed()) return;
    const r = $('tunnel').getBoundingClientRect(); tunnelProgress = clamp((innerHeight - r.top) / (innerHeight + r.height)); syncTunnel(); requestDraw();
  }
  $('tunnel-scroll').addEventListener('change', () => { tunnelPlaying = false; scrollTunnel(); syncTunnel(); });
  window.addEventListener('scroll', scrollTunnel, { passive: true });
  register('tunnel', (dt) => {
    const { w, h, dpr } = fit(tc); if (tunnelPlaying && dt) { tunnelProgress = Math.min(1, tunnelProgress + dt * .075); if (tunnelProgress >= 1) tunnelPlaying = false; syncTunnel(); }
    tctx.fillStyle = tunnelPortal ? '#1a111d' : '#090b13'; tctx.fillRect(0, 0, w, h);
    const p = tunnelProgress, camera = p * 29, centerX = w * .5 + Math.sin(p * Math.PI * 2) * w * .07 * state.amplitude, centerY = h * .47 + Math.cos(p * Math.PI * 2) * h * .03 * state.amplitude;
    const glow = tctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * .5);
    glow.addColorStop(0, tunnelPortal ? '#a4669170' : '#1a2ffb40'); glow.addColorStop(1, '#00000000'); tctx.fillStyle = glow; tctx.fillRect(0, 0, w, h);
    const count = 32, sides = tunnelPortal ? 48 : 8;
    function project(angle, z, radius) { const k = h * 1.15 / z; return [centerX + Math.cos(angle) * radius * k, centerY + Math.sin(angle) * radius * k]; }
    for (let ring = count; ring >= 0; ring--) {
      const z = ((ring * 1.65 - camera) % (count * 1.65) + count * 1.65) % (count * 1.65) + .7;
      const twist = Math.sin((z + camera) * .085) * .22 * state.amplitude, radius = tunnelPortal ? 1.18 + Math.sin(ring) * .05 : 1.65;
      const alpha = clamp(1 - z / 60, .12, 1), hue = tunnelPortal ? 304 + ring % 5 * 5 : 228;
      tctx.strokeStyle = tunnelPortal ? `hsla(${hue},40%,${45 + alpha * 35}%,${alpha})` : `rgba(${ring % 4 === 0 ? '70,93,255' : '155,168,192'},${alpha * .6})`;
      tctx.lineWidth = (tunnelPortal ? clamp(12 / z, .8, 9) : clamp(4 / z, .7, 3)) * dpr;
      tctx.beginPath();
      for (let a = 0; a <= sides; a++) { const point = project(a / sides * Math.PI * 2 + twist + Math.PI / 8, z, radius); a ? tctx.lineTo(...point) : tctx.moveTo(...point); }
      tctx.stroke();
      if (!tunnelPortal) for (let a = 0; a < 8; a++) {
        const angle = a / 8 * Math.PI * 2 + twist + Math.PI / 8, from = project(angle, z, radius), to = project(angle + .015, z + 1.65, radius);
        tctx.beginPath(); tctx.moveTo(...from); tctx.lineTo(...to); tctx.strokeStyle = `rgba(94,109,160,${alpha * .32})`; tctx.lineWidth = dpr; tctx.stroke();
      }
    }
    if (tunnelPortal) for (let i = 0; i < 44; i++) {
      const z = ((i * 1.4 - camera * 1.5) % 40 + 40) % 40 + 1, angle = i * 2.399 + p * .8, point = project(angle, z, 1.05 + (i % 5) * .22);
      const size = h / z * .05;
      tctx.save(); tctx.translate(...point); tctx.rotate(angle + p * 2); tctx.fillStyle = `rgba(235,186,222,${clamp(1 - z / 45, .15, .9)})`; tctx.beginPath(); tctx.moveTo(-size, 0); tctx.lineTo(size * .25, -size * 1.8); tctx.lineTo(size, size * .6); tctx.closePath(); tctx.fill(); tctx.restore();
    }
    tctx.fillStyle = '#cdd7ff'; tctx.beginPath(); tctx.arc(centerX, centerY, 2 * dpr, 0, Math.PI * 2); tctx.fill();
  });

  // 05: One accessible sentence, six decorative word transforms, no SplitType dependency.
  let typeTime = 3;
  const words = [...document.querySelectorAll('.type-line span')];
  $('type-replay').addEventListener('click', () => { typeTime = state.reduced ? 3 : 0; $('type-progress').textContent = state.reduced ? '완료' : '0%'; requestDraw(); });
  register('type', (dt) => {
    typeTime = Math.min(3, typeTime + dt);
    words.forEach((word, i) => { const progress = ease((typeTime - i * .09) / 1.1); word.style.transform = `translateY(${(1 - progress) * 120 * state.amplitude}%) rotate(${(1 - progress) * 12 * state.amplitude}deg)`; });
    $('type-progress').textContent = typeTime >= 1.55 ? '완료' : `${Math.round(clamp(typeTime / 1.55) * 100)}%`;
  });

  // 06: Sample data only. Rounded displayed categories sum exactly to the displayed total.
  let dataTime = 2.5, orbitTime = 0, dataTarget = [45, 35, 20];
  $('data-replay').addEventListener('click', () => { dataTime = state.reduced ? 2.5 : 0; $('data-total').textContent = state.reduced ? '100' : '0'; requestDraw(); });
  $('data-mix').addEventListener('input', (e) => {
    const creative = Number(e.target.value), tech = Math.round((100 - creative) * .63636);
    dataTarget = [creative, tech, 100 - creative - tech]; dataTime = state.reduced ? 2.5 : 0;
    $('data-mix-value').textContent = `${creative}%`; $('data-total').textContent = state.reduced ? '100' : '0'; requestDraw();
  });
  const arcs = [...document.querySelectorAll('.orbit-segment')], circumference = 2 * Math.PI * 155;
  register('data', (dt) => {
    dataTime = Math.min(2.5, dataTime + dt); orbitTime += dt * .3 * state.amplitude;
    const progress = ease(dataTime / 1.8), total = Math.round(100 * progress);
    const values = [Math.round(dataTarget[0] * progress), Math.round(dataTarget[1] * progress)]; values.push(total - values[0] - values[1]);
    $('data-total').textContent = total; ['creative', 'tech', 'motion'].forEach((key, i) => { $(`value-${key}`).textContent = values[i]; });
    let offset = 0;
    arcs.forEach((arc, i) => { const length = dataTarget[i] / 100 * circumference * progress; arc.style.strokeDasharray = `${Math.max(0, length - 5)} ${circumference}`; arc.style.strokeDashoffset = -offset; offset += length; });
    $('orbit-dot').setAttribute('cx', 200 + Math.sin(orbitTime) * 155); $('orbit-dot').setAttribute('cy', 200 - Math.cos(orbitTime) * 155);
  });

  // 07: Loader bar -> rotating cross aperture. The timeline measures this demo, not network load.
  const wc = $('wipe-canvas'), wctx = wc.getContext('2d');
  let wipeTime = 4, wipeScene = false, wipeSwitched = true;
  function switchWipe() {
    wipeScene = !wipeScene; $('wipe-scene').textContent = wipeScene ? 'B' : 'A';
    $('wipe-title').innerHTML = wipeScene ? 'Another<br>dimension.' : 'A new<br>perspective.';
    document.querySelector('.wipe-stage').style.background = wipeScene ? '#171922' : 'var(--lab-blue)'; wipeSwitched = true;
  }
  $('wipe-replay').addEventListener('click', () => {
    if (state.reduced) { switchWipe(); wipeTime = 4; $('wipe-status').textContent = '동작 감소 · 즉시 전환 완료'; }
    else { wipeTime = 0; wipeSwitched = false; $('wipe-status').textContent = '전환 0% · 연출용 타임라인'; } requestDraw();
  });
  register('wipe', (dt) => {
    const { w, h, dpr } = fit(wc); wipeTime += dt; wctx.clearRect(0, 0, w, h);
    if (wipeTime >= 3.2) { if (!wipeSwitched) switchWipe(); $('wipe-status').textContent = '완료 · 로더는 연출용입니다'; return; }
    if (!wipeSwitched && wipeTime > .8) switchWipe();
    const enter = clamp(wipeTime / .35); wctx.fillStyle = '#000'; wctx.fillRect(0, 0, w, h * enter);
    if (wipeTime < 1.15) {
      const barWidth = Math.min(w * .35, 210 * dpr), progress = clamp(wipeTime / 1.15);
      wctx.fillStyle = '#303036'; wctx.fillRect((w - barWidth) / 2, h / 2, barWidth, 6 * dpr);
      wctx.fillStyle = '#f0f1fa'; wctx.fillRect((w - barWidth) / 2, h / 2, barWidth * progress, 6 * dpr);
      wctx.font = `${13 * dpr}px monospace`; wctx.textAlign = 'center'; wctx.fillText(`${String(Math.floor(progress * 100)).padStart(3, '0')} / DEMO`, w / 2, h / 2 + 32 * dpr);
    } else {
      const progress = ease((wipeTime - 1.15) / 2.05), size = 12 * dpr + progress * Math.hypot(w, h) * 2.1;
      wctx.save(); wctx.translate(w / 2, h / 2); wctx.rotate(progress * Math.PI * .45 * state.amplitude);
      wctx.globalCompositeOperation = 'destination-out'; wctx.fillRect(-size * .5, -size * .12, size, size * .24); wctx.fillRect(-size * .12, -size * .5, size * .24, size); wctx.restore();
    }
    $('wipe-status').textContent = `전환 ${Math.min(100, Math.round(wipeTime / 3.2 * 100))}% · 연출용 타임라인`;
  });

  // 08: Spring-follow CTA with an actual dot-to-plus geometry change, keyboard/touch equivalent.
  const mb = $('magnetic-button'), magnetArea = document.querySelector('.magnet-area');
  const magnet = { tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, hover: false, pressed: false, morph: 0 };
  magnetArea.addEventListener('pointermove', (e) => {
    if (!motionAllowed() || e.pointerType === 'touch') return;
    const r = magnetArea.getBoundingClientRect(); magnet.tx = (e.clientX - r.left - r.width / 2) * .2 * state.amplitude; magnet.ty = (e.clientY - r.top - r.height / 2) * .25 * state.amplitude; magnet.hover = true; requestDraw();
  });
  magnetArea.addEventListener('pointerleave', () => { magnet.tx = magnet.ty = 0; magnet.hover = false; requestDraw(); });
  mb.addEventListener('focus', () => { magnet.hover = true; requestDraw(); }); mb.addEventListener('blur', () => { magnet.hover = false; requestDraw(); });
  mb.addEventListener('click', () => {
    magnet.pressed = !magnet.pressed; mb.setAttribute('aria-pressed', String(magnet.pressed));
    $('magnetic-label').textContent = magnet.pressed ? 'Made to move' : "Let's make it move";
    $('magnet-status').textContent = magnet.pressed ? 'ACTIVE / 예시 상태 전환 완료' : 'READY / 다시 실행할 수 있습니다'; requestDraw();
  });
  register('magnet', (dt) => {
    const target = magnet.hover || magnet.pressed ? 1 : 0;
    if (state.reduced) { magnet.x = magnet.y = 0; magnet.morph = target; }
    else if (dt) {
      for (const [pos, vel, dest] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty']]) { magnet[vel] += (magnet[dest] - magnet[pos]) * 100 * dt; magnet[vel] *= Math.exp(-15 * dt); magnet[pos] += magnet[vel] * dt; }
      magnet.morph += (target - magnet.morph) * (1 - Math.exp(-10 * dt));
    }
    mb.style.transform = `translate(${magnet.x}px,${magnet.y}px)`;
    [...mb.querySelectorAll('.morph-icon i')].forEach((dot, i) => {
      const m = magnet.morph; dot.style.width = `${8 + m * 12}px`; dot.style.height = `${8 - m * 5}px`; dot.style.borderRadius = `${4 - m * 3}px`;
      dot.style.transform = `translate(${-m * 6}px,${m * 2.5}px) rotate(${i * m * 90}deg)`;
    });
  });
  function settleReduced() {
    if (!state.reduced) return;
    kp.x = kp.y = dp.x = dp.y = ds.x = ds.y = 0;
    bodies.forEach((b) => { b.offset.fill(0); b.velocity.fill(0); }); particles.length = ripples.length = 0;
    typeTime = 3; dataTime = 2.5; cloudScatter = 0; magnet.tx = magnet.ty = magnet.x = magnet.y = magnet.vx = magnet.vy = 0;
    if (!wipeSwitched) switchWipe(); wipeTime = 4;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) { const scene = scenes.find((s) => s.element === entry.target); if (scene) scene.visible = entry.isIntersecting; }
    previous = 0; requestDraw();
  }, { threshold: 0 });
  scenes.forEach((scene) => observer.observe(scene.element));
  const resizeObserver = new ResizeObserver(() => { requestDraw(); });
  document.querySelectorAll('.stage').forEach((stage) => resizeObserver.observe(stage));
  settleReduced(); syncRuntime(); syncTunnel();
})();
