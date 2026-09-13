(function () {
  const root = document.querySelector("[data-source-motion]");
  if (!root) return;

  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const state = {
    manifest: null,
    capture: null,
    frameGroups: [],
    videos: [],
    groupIndex: 0,
    frameIndex: 0,
    isPlaying: false,
    isVisible: true,
    speed: 1,
    loop: false,
    renderToken: 0,
    timer: 0,
    cache: new Map(),
    maxCacheSize: 28,
    videoRequested: false,
  };

  root.innerHTML = `
    <div class="source-motion__inner">
      <div class="source-motion__header as-section-heading">
        <div>
          <p class="source-motion__eyebrow">원본 프레임/원본 영상</p>
          <h2>원본 모션을 직접 살펴보세요</h2>
        </div>
        <a class="source-motion__manifest" href="./data/toss-asset-manifest.json" download>자산 목록 다운로드</a>
      </div>
      <div class="source-motion__grid">
        <article class="source-motion-card source-motion-card--frames">
          <div class="source-motion-card__top">
            <div>
              <p class="source-motion-card__kicker">원본 프레임</p>
              <h3>시퀀스 스크러버</h3>
            </div>
            <a data-frame-source class="source-motion-link" href="#" target="_blank" rel="noreferrer">프레임 원본</a>
          </div>
          <label class="source-motion-field">
            <span>시퀀스</span>
            <select data-frame-group></select>
          </label>
          <div class="source-motion-stage source-motion-stage--image">
            <img data-frame-image alt="원본 프레임 미리보기" decoding="async" />
            <span data-frame-loading class="source-motion-loading">프레임을 불러오는 중…</span>
            <div data-frame-empty class="source-motion-empty" hidden>표시할 원본 프레임 시퀀스가 없습니다.</div>
          </div>
          <div class="source-motion-controls">
            <button data-frame-play type="button" class="source-motion-button" aria-pressed="false">재생</button>
            <label class="source-motion-range">
              <span data-frame-count>0 / 0</span>
              <input data-frame-range type="range" min="0" max="0" value="0" />
            </label>
          </div>
          <div class="source-motion-options" aria-label="프레임 재생 옵션">
            <label><input data-speed type="radio" name="source-motion-speed" value="0.5" /> 0.5x</label>
            <label><input data-speed type="radio" name="source-motion-speed" value="1" checked /> 1x</label>
            <label><input data-speed type="radio" name="source-motion-speed" value="1.5" /> 1.5x</label>
            <label><input data-loop type="checkbox" /> 반복</label>
          </div>
          <p class="source-motion-note">화면 밖으로 벗어나거나 탭이 숨겨지면 자동 재생만 멈춥니다.</p>
        </article>
        <article class="source-motion-card source-motion-card--video">
          <div class="source-motion-card__top">
            <div>
              <p class="source-motion-card__kicker">원본 영상</p>
              <h3>비디오 플레이리스트</h3>
            </div>
            <a data-video-source class="source-motion-link" href="#" target="_blank" rel="noreferrer">영상 원본</a>
          </div>
          <label class="source-motion-field">
            <span>영상</span>
            <select data-video-select></select>
          </label>
          <div class="source-motion-stage source-motion-stage--video">
            <video data-video controls preload="none" playsinline></video>
            <button data-video-play type="button" class="source-motion-button source-motion-video-play">원본 영상 재생</button>
          </div>
          <p data-video-error class="source-motion-video-error" role="status" hidden>이 브라우저에서 영상을 재생하지 못했어요. 위의 원본 링크로 확인해주세요.</p>
          <p class="source-motion-note">원본 서버에서 재생됩니다. 선택을 바꾸면 이전 영상 소스는 정리됩니다.</p>
        </article>
      </div>
    </div>
  `;

  const ui = {
    frameSelect: root.querySelector("[data-frame-group]"),
    frameImage: root.querySelector("[data-frame-image]"),
    frameEmpty: root.querySelector("[data-frame-empty]"),
    frameLoading: root.querySelector("[data-frame-loading]"),
    frameSource: root.querySelector("[data-frame-source]"),
    framePlay: root.querySelector("[data-frame-play]"),
    frameRange: root.querySelector("[data-frame-range]"),
    frameCount: root.querySelector("[data-frame-count]"),
    speedInputs: [...root.querySelectorAll("[data-speed]")],
    loop: root.querySelector("[data-loop]"),
    videoSelect: root.querySelector("[data-video-select]"),
    video: root.querySelector("[data-video]"),
    videoSource: root.querySelector("[data-video-source]"),
    videoError: root.querySelector("[data-video-error]"),
    videoPlay: root.querySelector("[data-video-play]"),
  };

  init();

  async function init() {
    try {
      const [manifest, capture] = await Promise.all([
        fetchJson("./data/toss-asset-manifest.json"),
        fetchJson("./data/toss-source-capture.json").catch(() => null),
      ]);
      state.manifest = manifest;
      state.capture = capture;
      state.frameGroups = buildFrameGroups(manifest);
      state.videos = buildVideos(manifest, capture);
      bindEvents();
      observeAutoPause();
      renderFrameOptions();
      renderVideoOptions();
      await showFrame(0);
      selectVideo(0);
    } catch (error) {
      root.innerHTML = `<div class="source-motion__inner"><p class="source-motion-empty">원본 asset manifest를 불러오지 못했습니다.</p></div>`;
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function buildFrameGroups(manifest) {
    const groups = new Map();
    for (const asset of manifest.assets || []) {
      if (asset.status !== "archived" || !asset.localPath) continue;
      const url = new URL(asset.url);
      const match = url.pathname.match(/^(.*)\/(frame_(\d+)\.(?:avif|webp))$/i);
      if (!match) continue;
      const key = `${match[1]}|${url.pathname.split(".").pop().toLowerCase()}`;
      const group = groups.get(key) || {
        id: key,
        label: labelFromPath(match[1]),
        sourcePath: match[1],
        extension: url.pathname.split(".").pop().toLowerCase(),
        frames: [],
      };
      group.frames.push({ ...asset, frameNumber: Number(match[3]) });
      groups.set(key, group);
    }
    return [...groups.values()]
      .map((group) => ({ ...group, frames: group.frames.sort((a, b) => a.frameNumber - b.frameNumber) }))
      .filter((group) => group.frames.length > 1)
      .sort((a, b) => Number(b.sourcePath.includes('hero-frame')) - Number(a.sourcePath.includes('hero-frame')) || b.frames.length - a.frames.length);
  }

  function buildVideos(manifest, capture) {
    const posterByUrl = new Map();
    const archived = new Map((manifest.assets || []).filter(asset => asset.status === 'archived').map(asset => [asset.url, asset.localPath]));
    for (const pageCapture of capture?.captures || []) {
      for (const media of pageCapture.media || []) {
        if (media.kind === "video" && media.url && media.poster) posterByUrl.set(media.url, media.poster);
      }
    }
    return (manifest.assets || [])
      .filter((asset) => asset.kind === "video")
      .map((asset) => ({
        ...asset,
        label: asset.label || labelFromPath(new URL(asset.url).pathname),
        poster: archived.get(posterByUrl.get(asset.url)) || posterByUrl.get(asset.url) || "",
      }))
      .sort((a, b) => Number(Boolean(b.poster)) - Number(Boolean(a.poster)) || Number(b.discovery === 'dom') - Number(a.discovery === 'dom') || a.label.localeCompare(b.label));
  }

  function bindEvents() {
    ui.frameSelect.addEventListener("change", async () => {
      pauseFrames();
      state.groupIndex = Number(ui.frameSelect.value);
      state.frameIndex = 0;
      await showFrame(0);
    });
    ui.frameRange.addEventListener("input", async () => {
      pauseFrames();
      await showFrame(Number(ui.frameRange.value));
    });
    ui.framePlay.addEventListener("click", () => {
      if (state.isPlaying) pauseFrames();
      else playFrames();
    });
    for (const input of ui.speedInputs) {
      input.addEventListener("change", () => {
        state.speed = Number(input.value) || 1;
      });
    }
    ui.loop.addEventListener("change", () => {
      state.loop = ui.loop.checked;
    });
    ui.videoSelect.addEventListener("change", () => selectVideo(Number(ui.videoSelect.value)));
    ui.videoPlay.addEventListener('click', async () => {
      state.videoRequested = true;
      ui.videoError.hidden = true;
      ui.videoPlay.hidden = true;
      ui.video.controls = true;
      ui.video.src = ui.video.dataset.source;
      try { await ui.video.play(); } catch {
        if (state.videoRequested) { ui.videoError.hidden = false; ui.videoPlay.hidden = false; }
      }
    });
    ui.video.addEventListener("error", () => {
      if (state.videoRequested && ui.video.error && ui.video.getAttribute('src')) ui.videoError.hidden = false;
    });
    ui.video.addEventListener('loadeddata', () => { ui.videoError.hidden = true; });
    ui.video.addEventListener('emptied', () => { ui.videoError.hidden = true; });
  }

  function observeAutoPause() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseFrames();
        ui.video.pause();
      }
    });
    prefersReduced?.addEventListener?.("change", () => pauseFrames());

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        state.isVisible = entries.some((entry) => entry.isIntersecting);
        if (!state.isVisible) {
          pauseFrames();
          ui.video.pause();
        }
      }, { threshold: 0.12 });
      observer.observe(root);
    }
  }

  function renderFrameOptions() {
    if (!state.frameGroups.length) {
      ui.frameLoading.hidden = true;
      ui.frameEmpty.hidden = false;
      ui.frameImage.hidden = true;
      ui.framePlay.disabled = true;
      ui.frameRange.disabled = true;
      ui.frameSource.hidden = true;
      return;
    }
    ui.frameSelect.innerHTML = state.frameGroups.map((group, index) => (
      `<option value="${index}">${escapeHtml(group.label)} · ${group.frames.length}프레임 · ${group.extension}</option>`
    )).join("");
    ui.frameEmpty.hidden = true;
    ui.frameImage.hidden = false;
  }

  function renderVideoOptions() {
    if (!state.videos.length) {
      ui.videoSelect.innerHTML = "<option>표시할 원본 영상이 없습니다</option>";
      ui.videoSelect.disabled = true;
      ui.videoSource.hidden = true;
      return;
    }
    ui.videoSelect.innerHTML = state.videos.map((video, index) => (
      `<option value="${index}">${escapeHtml(video.section ? `${video.section} · ${video.label}` : video.label)}</option>`
    )).join("");
  }

  async function showFrame(index) {
    const group = state.frameGroups[state.groupIndex];
    if (!group) return;
    const nextIndex = Math.max(0, Math.min(index, group.frames.length - 1));
    const frame = group.frames[nextIndex];
    const token = ++state.renderToken;
    ui.frameLoading.hidden = false;
    ui.frameEmpty.hidden = true;
    ui.frameRange.max = String(group.frames.length - 1);
    ui.frameRange.value = String(nextIndex);
    ui.frameCount.textContent = `${nextIndex + 1} / ${group.frames.length}`;
    ui.frameSource.href = frame.url;
    ui.frameSource.textContent = `프레임 ${nextIndex + 1} 원본`;
    try {
      await loadImage(frame.localPath, token);
      if (token !== state.renderToken) return;
      state.frameIndex = nextIndex;
      ui.frameImage.src = frame.localPath;
      ui.frameImage.alt = `${group.label} 원본 프레임 ${nextIndex + 1}`;
      await ui.frameImage.decode();
      if (token !== state.renderToken) return;
      ui.frameImage.hidden = false;
      ui.frameImage.dataset.loadedFrame = String(nextIndex);
      ui.frameLoading.hidden = true;
      prefetchAround(group, nextIndex);
    } catch {
      if (token === state.renderToken) {
        ui.frameLoading.hidden = true;
        ui.frameEmpty.textContent = '프레임을 불러오지 못했어요. 다른 위치를 선택해보세요.';
        ui.frameEmpty.hidden = false;
        ui.frameImage.hidden = true;
      }
    }
  }

  function playFrames() {
    if (!state.frameGroups.length || document.hidden || prefersReduced?.matches || !state.isVisible) return;
    state.isPlaying = true;
    ui.framePlay.textContent = "일시정지";
    ui.framePlay.setAttribute("aria-pressed", "true");
    scheduleNextFrame();
  }

  function pauseFrames() {
    state.isPlaying = false;
    window.clearTimeout(state.timer);
    ui.framePlay.textContent = "재생";
    ui.framePlay.setAttribute("aria-pressed", "false");
  }

  function scheduleNextFrame() {
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(async () => {
      if (!state.isPlaying) return;
      const group = state.frameGroups[state.groupIndex];
      let nextIndex = state.frameIndex + 1;
      if (nextIndex >= group.frames.length) {
        if (!state.loop) {
          pauseFrames();
          return;
        }
        nextIndex = 0;
      }
      await showFrame(nextIndex);
      if (state.isPlaying) scheduleNextFrame();
    }, Math.round(110 / state.speed));
  }

  function loadImage(src, token) {
    if (!src) return Promise.reject(new Error("Missing image source"));
    if (!state.cache.has(src)) {
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
      promise.catch(() => {});
      state.cache.set(src, { promise, token });
      trimCache();
    }
    return state.cache.get(src).promise.then((image) => {
      if (token !== state.renderToken) throw new Error("Stale frame");
      return image;
    });
  }

  function prefetchAround(group, index) {
    for (let offset = 1; offset <= 4; offset += 1) {
      const frame = group.frames[index + offset];
      if (!frame?.localPath || state.cache.has(frame.localPath)) continue;
      const image = new Image();
      const promise = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
      });
      promise.catch(() => {});
      image.decoding = "async";
      image.src = frame.localPath;
      state.cache.set(frame.localPath, { promise, token: state.renderToken });
      trimCache();
    }
  }

  function trimCache() {
    while (state.cache.size > state.maxCacheSize) {
      state.cache.delete(state.cache.keys().next().value);
    }
  }

  function selectVideo(index) {
    const video = state.videos[index];
    state.videoRequested = false;
    cleanupVideo();
    if (!video) return;
    ui.videoError.hidden = true;
    ui.videoSource.href = video.url;
    ui.videoSource.textContent = "영상 원본";
    if (video.poster) ui.video.poster = video.poster;
    ui.video.dataset.source = video.url;
    ui.video.controls = false;
    ui.videoPlay.hidden = false;
  }

  function cleanupVideo() {
    ui.video.pause();
    ui.video.removeAttribute("src");
    ui.video.removeAttribute("poster");
    while (ui.video.firstChild) ui.video.firstChild.remove();
    ui.video.load();
  }

  function labelFromPath(pathname) {
    if (pathname.includes('hero-frame')) return '송금 스크롤';
    if (pathname.includes('shopping-box')) return '쇼핑 박스';
    if (/place.*kr/i.test(pathname)) return '매장 결제기';
    const parts = pathname.split("/").filter(Boolean);
    const name = parts[parts.length - 1] || parts[parts.length - 2] || "source";
    return name.replace(/[-_]+/g, " ").replace(/\bkr\b/i, "KR").replace(/\ben\b/i, "EN");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }
}());
