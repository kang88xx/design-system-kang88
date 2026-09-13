const earthSection = document.querySelector("[data-earth-section]");
const earthVisual = document.querySelector("[data-earth-visual]");
const earthCanvas = document.querySelector("[data-earth-canvas]");
const earthStarsCanvas = document.querySelector("[data-earth-stars]");
const earthCopy = document.querySelector("[data-earth-copy]");
const earthLoading = document.querySelector("[data-earth-loading]");
const earthReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const EARTH_DOT_COUNT = 13149;
const EARTH_ROTATION_SPEED = 6;
const EARTH_FRAME_INTERVAL = 1000 / 30;
const EARTH_MAX_FRAME_DELTA = 100;
const EARTH_MAX_DPR = 1.5;
const EARTH_MAX_PIXELS = 4_000_000;
const EARTH_DOTS_URL = "./assets/source/1d45ee4082e0-framer-globe-dots.bin";

function earthClamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function addSpherePoint(target, longitude, latitude) {
  const longitudeRadians = longitude * (Math.PI / 180);
  const latitudeRadians = latitude * (Math.PI / 180);
  const latitudeRadius = Math.cos(latitudeRadians);
  target.push(
    latitudeRadius * Math.cos(longitudeRadians),
    latitudeRadius * Math.sin(longitudeRadians),
    Math.sin(latitudeRadians),
  );
}

function createEarthGrid() {
  const grid = [];
  for (let longitude = -180; longitude < 180; longitude += 10) {
    for (let latitude = -90; latitude <= 90; latitude += 2) {
      addSpherePoint(grid, longitude, latitude);
    }
    grid.push(Number.NaN, Number.NaN, Number.NaN);
  }
  for (let latitude = -80; latitude <= 80; latitude += 10) {
    for (let longitude = -180; longitude <= 180; longitude += 2) {
      addSpherePoint(grid, longitude, latitude);
    }
    grid.push(Number.NaN, Number.NaN, Number.NaN);
  }
  return new Float32Array(grid);
}

function parseEarthDots(buffer) {
  if (buffer.byteLength < Uint32Array.BYTES_PER_ELEMENT) throw new Error("지구 데이터 헤더가 없다.");
  const view = new DataView(buffer);
  const pointCount = view.getUint32(0, true);
  if (pointCount !== EARTH_DOT_COUNT) throw new Error(`지구 점 개수가 다르다: ${pointCount}`);
  const valueCount = pointCount * 3;
  const expectedBytes = Uint32Array.BYTES_PER_ELEMENT + (valueCount * Float32Array.BYTES_PER_ELEMENT);
  if (buffer.byteLength !== expectedBytes) throw new Error("지구 데이터 크기가 다르다.");
  const points = new Float32Array(valueCount);
  for (let index = 0; index < valueCount; index += 1) {
    points[index] = view.getFloat32(
      Uint32Array.BYTES_PER_ELEMENT + (index * Float32Array.BYTES_PER_ELEMENT),
      true,
    );
  }
  return points;
}

function earthProjection(longitude, latitude, width) {
  const longitudeRadians = longitude * (Math.PI / 180);
  const latitudeRadians = latitude * (Math.PI / 180);
  return {
    cosLongitude: Math.cos(longitudeRadians),
    sinLongitude: Math.sin(longitudeRadians),
    cosLatitude: Math.cos(latitudeRadians),
    sinLatitude: Math.sin(latitudeRadians),
    centerX: width / 2,
    centerY: width / 2,
    radius: width / 2,
  };
}

function projectEarthPoint(x, y, z, projection, output) {
  const rotatedX = (x * projection.cosLongitude) - (y * projection.sinLongitude);
  const rotatedY = (x * projection.sinLongitude) + (y * projection.cosLongitude);
  const depth = (rotatedX * projection.cosLatitude) - (z * projection.sinLatitude);
  if (depth <= 1e-12) return false;
  output.x = projection.centerX + (projection.radius * rotatedY);
  output.y = projection.centerY - (projection.radius * ((z * projection.cosLatitude) + (rotatedX * projection.sinLatitude)));
  return true;
}

function earthBackingStore(width, height) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 1;
  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    EARTH_MAX_DPR,
    Math.sqrt(EARTH_MAX_PIXELS / (safeWidth * safeHeight)),
  );
  return {
    width: Math.max(1, Math.floor(safeWidth * pixelRatio)),
    height: Math.max(1, Math.floor(safeHeight * pixelRatio)),
    pixelRatio,
  };
}

function setupRotatingEarth() {
  if (!earthCanvas || !earthVisual) return () => {};
  const context = earthCanvas.getContext("2d");
  if (!context) {
    if (earthLoading) earthLoading.textContent = "지구 canvas를 만들지 못했다.";
    return () => {};
  }

  const grid = createEarthGrid();
  const rotation = { longitude: -15, latitude: -25 };
  const projected = { x: 0, y: 0 };
  let landDots = null;
  let width = 0;
  let height = 0;
  let visible = false;
  let animationFrame = null;
  let previousTime = null;
  let elapsed = 0;
  let destroyed = false;

  function drawEarth() {
    if (!landDots || width <= 0 || height <= 0) return;
    const projection = earthProjection(rotation.longitude, rotation.latitude, width);
    context.clearRect(0, 0, width, height);

    context.beginPath();
    let lineStarted = false;
    for (let index = 0; index < grid.length; index += 3) {
      const x = grid[index];
      const y = grid[index + 1];
      const z = grid[index + 2];
      if (Number.isNaN(x) || !projectEarthPoint(x, y, z, projection, projected)) {
        lineStarted = false;
        continue;
      }
      if (lineStarted) context.lineTo(projected.x, projected.y);
      else {
        context.moveTo(projected.x, projected.y);
        lineStarted = true;
      }
    }
    context.strokeStyle = "#e0e0e0";
    context.lineWidth = 1;
    context.globalAlpha = 0.5;
    context.stroke();

    context.beginPath();
    for (let index = 0; index < landDots.length; index += 3) {
      if (!projectEarthPoint(landDots[index], landDots[index + 1], landDots[index + 2], projection, projected)) continue;
      if (projected.x < -0.96 || projected.x > width + 0.96 || projected.y < -0.96 || projected.y > height + 0.96) continue;
      context.moveTo(projected.x + 0.96, projected.y);
      context.arc(projected.x, projected.y, 0.96, 0, Math.PI * 2);
    }
    context.fillStyle = "#ffffff";
    context.globalAlpha = 1;
    context.fill();
  }

  function shouldAnimate() {
    return Boolean(landDots && width > 0 && height > 0 && visible && !document.hidden && !earthReduceMotion.matches);
  }

  function stopAnimation() {
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
    previousTime = null;
    elapsed = 0;
  }

  function tick(time) {
    animationFrame = null;
    if (!shouldAnimate()) {
      stopAnimation();
      return;
    }
    if (previousTime === null) previousTime = time;
    else {
      const delta = Math.min(EARTH_MAX_FRAME_DELTA, Math.max(0, time - previousTime));
      previousTime = time;
      elapsed = Math.min(EARTH_MAX_FRAME_DELTA, elapsed + delta);
      if (elapsed + 0.1 >= EARTH_FRAME_INTERVAL) {
        const step = Math.max(1, Math.floor((elapsed + 0.1) / EARTH_FRAME_INTERVAL)) * EARTH_FRAME_INTERVAL;
        rotation.longitude = (rotation.longitude + ((step / 1000) * EARTH_ROTATION_SPEED)) % 360;
        elapsed = Math.max(0, elapsed - step);
        drawEarth();
      }
    }
    animationFrame = window.requestAnimationFrame(tick);
  }

  function syncAnimation() {
    if (earthReduceMotion.matches) {
      stopAnimation();
      drawEarth();
      return;
    }
    if (shouldAnimate() && animationFrame === null) {
      drawEarth();
      animationFrame = window.requestAnimationFrame(tick);
    } else if (!shouldAnimate()) {
      stopAnimation();
    }
  }

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    width = entry.contentRect.width;
    height = entry.contentRect.height;
    const backingStore = earthBackingStore(width, height);
    earthCanvas.width = backingStore.width;
    earthCanvas.height = backingStore.height;
    earthCanvas.style.width = `${width}px`;
    earthCanvas.style.height = `${height}px`;
    context.setTransform(backingStore.pixelRatio, 0, 0, backingStore.pixelRatio, 0, 0);
    drawEarth();
    syncAnimation();
  });

  const visibilityObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        syncAnimation();
      })
    : null;

  resizeObserver.observe(earthVisual);
  visibilityObserver?.observe(earthCanvas);
  if (!visibilityObserver) visible = true;

  const syncVisibility = () => syncAnimation();
  const syncMotionPreference = () => syncAnimation();
  document.addEventListener("visibilitychange", syncVisibility);
  earthReduceMotion.addEventListener("change", syncMotionPreference);

  const abortController = new AbortController();
  fetch(EARTH_DOTS_URL, { signal: abortController.signal })
    .then((response) => {
      if (!response.ok) throw new Error("지구 데이터를 불러오지 못했다.");
      return response.arrayBuffer();
    })
    .then((buffer) => {
      if (destroyed) return;
      landDots = parseEarthDots(buffer);
      earthLoading?.classList.add("is-hidden");
      drawEarth();
      syncAnimation();
    })
    .catch((error) => {
      if (destroyed || error.name === "AbortError") return;
      if (earthLoading) earthLoading.textContent = "지구 데이터를 불러오지 못했다.";
    });

  return () => {
    destroyed = true;
    abortController.abort();
    stopAnimation();
    resizeObserver.disconnect();
    visibilityObserver?.disconnect();
    document.removeEventListener("visibilitychange", syncVisibility);
    earthReduceMotion.removeEventListener("change", syncMotionPreference);
  };
}

function setupEarthStars() {
  if (!earthStarsCanvas || !earthSection) return () => {};
  const context = earthStarsCanvas.getContext("2d");
  if (!context) return () => {};
  let stars = [];
  let width = 0;
  let height = 0;
  let visible = false;
  let frame = null;
  const pointerTarget = { x: 0, y: 0 };
  const pointerCurrent = { x: 0, y: 0 };

  function randomBetween(min, max) {
    return min + (Math.random() * (max - min));
  }

  function drawStars(time = performance.now()) {
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";
    context.fillStyle = "#ffffff";
    stars.forEach((star) => {
      const twinkle = 0.72 + (0.28 * Math.sin((time * star.twinkleSpeed) + star.phase));
      context.globalAlpha = star.alpha * twinkle;
      context.beginPath();
      context.arc(
        star.x + (pointerCurrent.x * star.depth),
        star.y + (pointerCurrent.y * star.depth),
        star.radius,
        0,
        Math.PI * 2,
      );
      context.fill();
    });
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  function tick(time) {
    frame = null;
    if (!visible || document.hidden || earthReduceMotion.matches) return;
    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.055;
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.055;
    pointerTarget.x *= 0.86;
    pointerTarget.y *= 0.86;
    drawStars(time);
    frame = requestAnimationFrame(tick);
  }

  function syncStars() {
    if (earthReduceMotion.matches) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      drawStars();
      return;
    }
    if (visible && !document.hidden && frame === null) frame = requestAnimationFrame(tick);
    if ((!visible || document.hidden) && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  }

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    width = entry.contentRect.width;
    height = entry.contentRect.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    earthStarsCanvas.width = Math.round(width * pixelRatio);
    earthStarsCanvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const starCount = earthClamp(Math.round((width * height) / 36000), 35, 90);
    stars = Array.from({ length: starCount }, () => {
      const depth = randomBetween(0.35, 1);
      return {
        x: randomBetween(0, width),
        y: randomBetween(0, height),
        radius: randomBetween(1.1, 3.2) * depth,
        alpha: randomBetween(0.42, 0.95),
        depth,
        phase: randomBetween(0, Math.PI * 2),
        twinkleSpeed: randomBetween(0.0008, 0.0022),
      };
    });
    drawStars();
    syncStars();
  });

  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = Boolean(entries[0]?.isIntersecting);
    syncStars();
  });

  function handlePointerMove(event) {
    pointerTarget.x = earthClamp(pointerTarget.x + (event.movementX * 0.9), -14, 14);
    pointerTarget.y = earthClamp(pointerTarget.y + (event.movementY * 0.9), -14, 14);
  }

  resizeObserver.observe(earthSection.querySelector(".global-earth__sticky"));
  visibilityObserver.observe(earthStarsCanvas);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("visibilitychange", syncStars);
  earthReduceMotion.addEventListener("change", syncStars);

  return () => {
    if (frame !== null) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    window.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("visibilitychange", syncStars);
    earthReduceMotion.removeEventListener("change", syncStars);
  };
}

function updateEarthScroll() {
  if (!earthSection || !earthVisual || !earthCopy) return;
  const rect = earthSection.getBoundingClientRect();
  const scrollDistance = Math.max(1, rect.height - window.innerHeight);
  const progress = earthReduceMotion.matches ? 0.6 : earthClamp(-rect.top / scrollDistance);
  const inStickyRange = rect.top <= 0 && rect.bottom >= window.innerHeight;
  document.body.classList.toggle("is-motion-active", inStickyRange && !earthReduceMotion.matches);

  const liftRange = window.innerWidth < 768 ? 70 : window.innerWidth < 1024 ? 100 : 130;
  const earthLift = progress * liftRange;
  earthVisual.style.transform = `translate3d(-50%, ${-earthLift}vh, 0)`;
  const copyOpacity = earthReduceMotion.matches ? 1 : earthClamp(1 - (progress / 0.48));
  earthCopy.style.opacity = String(copyOpacity);
  earthCopy.style.transform = window.innerWidth < 768
    ? `translate(0, calc(-50% - ${progress * 4}rem))`
    : `translate(-50%, calc(-50% - ${progress * 4}rem))`;
}

setupRotatingEarth();
setupEarthStars();

let earthScrollFrame = null;
function scheduleEarthScroll() {
  if (earthScrollFrame !== null) return;
  earthScrollFrame = requestAnimationFrame(() => {
    earthScrollFrame = null;
    updateEarthScroll();
  });
}

window.addEventListener("scroll", scheduleEarthScroll, { passive: true });
window.addEventListener("resize", scheduleEarthScroll);
earthReduceMotion.addEventListener("change", scheduleEarthScroll);
scheduleEarthScroll();
