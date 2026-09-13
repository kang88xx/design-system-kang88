"use strict";

(() => {
  const data = window.LUSION_CATALOG;
  if (!data) return;
  const assets = data.assets.filter(asset => asset.local && !asset.error && asset.status === 200);
  const excludedAssets = data.assets.length - assets.length;
  const toast = document.querySelector("#toast");
  let toastTimer;
  function announce(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
  }
  async function copyText(value) {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Use local fallback");
      await navigator.clipboard.writeText(value);
    } catch {
      const active = document.activeElement;
      const field = document.createElement("textarea");
      field.value = value;
      field.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (active instanceof HTMLElement) active.focus({ preventScroll: true });
      if (!copied) { announce("복사할 수 없습니다. 텍스트를 선택해 직접 복사해 주세요."); return; }
    }
    announce(value.startsWith("#") ? `${value} 복사했습니다.` : "프롬프트를 복사했습니다.");
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function link(href, className, text) {
    const anchor = node("a", className, text);
    anchor.href = href;
    if (href.startsWith("https://")) { anchor.target = "_blank"; anchor.rel = "noreferrer"; }
    return anchor;
  }
  const colors = [
    ["Off white", "#f0f1fa", "--color-off-white"],
    ["Dark white", "#e4e6ef", "--color-dark-white"],
    ["Black", "#000000", "--color-black"],
    ["Blue", "#1a2ffb", "--color-blue"],
    ["Grey blue", "#2b2e3a", "--color-grey-blue"],
    ["Green", "#c1ff00", "--color-green"],
  ];
  colors.forEach(([name, hex, token]) => {
    const button = node("button", "swatch");
    button.type = "button";
    button.setAttribute("aria-label", `${name} ${hex} 복사`);
    button.title = token;
    const surface = node("span", "swatch-color", "↗");
    surface.setAttribute("aria-hidden", "true");
    surface.style.background = hex;
    surface.style.color = ["Black", "Blue", "Grey blue"].includes(name) ? "#fff" : "#000";
    button.append(surface, node("span", "swatch-name", name), node("span", "swatch-hex", hex.toUpperCase()));
    button.addEventListener("click", () => copyText(hex));
    document.querySelector("#swatches").append(button);
  });
  for (const key of ["pages", "projects", "assets"]) document.querySelector(`[data-stat="${key}"]`).textContent = data.stats[key];
  document.querySelector('[data-stat="size"]').replaceChildren(document.createTextNode(String(Math.round(data.stats.bytes / 1048576))), node("span", "", " MiB"));

  data.projects.forEach((project, index) => {
    const card = node("article", "project-card");
    const mediaLink = link(project.url, "project-image-link");
    mediaLink.setAttribute("aria-label", `${project.title} 공식 프로젝트 열기`);
    const img = node("img");
    img.src = `sources/assets/lusion.dev/assets/projects/${project.slug}/home.webp`;
    img.alt = `${project.title} 프로젝트 썸네일`;
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 640;
    img.height = 440;
    mediaLink.append(img);
    const info = node("div", "project-info");
    const text = node("div");
    const title = node("h3");
    title.append(link(project.url, "", project.title));
    text.append(title, node("p", "", `${String(index + 1).padStart(2, "0")} / ${project.media.length} MEDIA FILES`));
    text.append(link(`source-explorer.html?path=${encodeURIComponent(`sources/pages/projects__${project.slug}.html`)}`, "project-source-link", "프로젝트 원본 코드 보기 ↗"));
    const arrow = node("span", "project-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    info.append(text, arrow);
    card.append(mediaLink, info);
    document.querySelector("#project-grid").append(card);
  });

  const prompts = [
    { title: "Hero / kinetic modular field", text: "A field of invented rounded three-armed modules with a circular core, tumbling slowly in a dark gallery void; cobalt, graphite, and porcelain ceramic finishes; close layered composition with generous negative space for interface copy; premium product-render realism, no logos, no letters, no recognizable brand geometry, no copyrighted character.", guidance: "자체 모듈 모델과 서로 다른 반사 재질을 제작합니다. 오브젝트별 회전·위상을 다르게 하고, 텍스트 안전영역을 남깁니다. 감소 모션 환경에서는 포스터로 전환합니다." },
    { title: "Pointer paint / FBO distortion plate", text: "An abstract liquid-ink interaction plate for a web canvas: transparent pearlescent pigment drifting over a near-black surface, subtle prismatic refraction, restrained motion, designed as an input texture for real-time distortion; no typography, no logo, no recognizable artwork.", guidance: "생성 이미지는 displacement/noise 참고 자료로 사용합니다. 입력 좌표·속도를 FBO에 기록하고 blur·dissipation을 적용하는 실제 상호작용은 shader에서 구현합니다." },
    { title: "Project card / depth-separated still", text: "An original editorial still life for an interactive project card: a small experimental object on a tactile workbench, layered foreground tools, middle subject, distant atmospheric backdrop, quiet warm daylight, cinematic but practical composition, intentionally clear depth separation, no logos, no readable packaging, no trademarked product.", guidance: "컬러 이미지와 별도 depth map을 제작합니다. 피사체 윤곽·투명부·배경 경계를 수동 보정한 뒤 작은 시차만 적용하고, 정지 상태에서도 깊이가 읽히는지 검수합니다." },
    { title: "Reel / responsive motion montage", text: "A concise original motion-design montage for an interactive studio reel: abstract material studies, sculptural close-ups, calm transitions, designed in both wide and vertical compositions; intentional pacing, clean frames for cropping, no logos, no client work, no borrowed footage, no readable text.", guidance: "가로·세로 편집본을 별도로 구성합니다. MP4와 포스터, 재생 컨트롤을 준비하고 루프 연결점·크롭·소리 자동재생 여부를 확인합니다." },
    { title: "Tunnel / original character journey", text: "An original faceless explorer in a minimal engineered tunnel made of repeating geometric panels, progressing from darkness toward a muted luminous threshold; matte white, charcoal, and one restrained accent color; cinematic spatial storytelling, no astronaut likeness, no franchise reference, no logos.", guidance: "자체 캐릭터와 리그에 진입·체류 루프·퇴장 클립을 분리합니다. 전환 포즈와 진행 방향을 검수하고, 낮은 성능 단계에서는 프리렌더 영상 또는 정적 key frame을 제공합니다." },
    { title: "About / terrain and person silhouette", text: "An original solitary figure standing on a softly sculpted abstract terrain, viewed as a graphic silhouette within a quiet horizon; tactile clay-like ground, gentle long shadows, limited neutral palette with one subtle color accent, contemplative and non-narrative, no face likeness, no logo, no recognizable location.", guidance: "지형 geometry와 height·shadow·light 레이어를 분리해 제작합니다. 인물·지형·그림자의 명암 분리와 작은 화면의 실루엣 가독성을 검수합니다." },
    { title: "Case-study hero / dreamlike installation", text: "An original dreamlike installation of tiny invented botanical and mechanical fragments hovering above a soft blush floor, a restrained surreal composition for a case-study hero, high craft CGI, soft haze, ample clear area for editorial text, no cars, no luxury marque, no logo, no copied campaign art.", guidance: "정보와 큰 미디어를 분리하는 편집 원칙을 적용합니다. 자체 피사체와 팔레트로 concept → 3D → motion → compositing을 진행하고 본문·CTA 공간을 함께 검수합니다." },
  ];
  prompts.forEach((prompt, index) => {
    const details = node("details", "prompt-item");
    if (index === 0) details.open = true;
    const summary = node("summary");
    summary.append(node("span", "mono", String(index + 1).padStart(2, "0")), node("span", "", prompt.title));
    const content = node("div", "prompt-content");
    const guidance = node("div", "prompt-guidance");
    const copy = node("button", "pill light", "프롬프트 복사 ↗");
    copy.type = "button";
    copy.setAttribute("aria-label", `${prompt.title} 프롬프트 복사`);
    copy.addEventListener("click", () => copyText(prompt.text));
    guidance.append(node("span", "badge proposed", "NEW PROMPT / 제작 제안"), node("p", "", prompt.guidance), copy);
    const paragraph = node("p", "prompt-text", prompt.text);
    paragraph.lang = "en";
    content.append(paragraph, guidance);
    details.append(summary, content);
    document.querySelector("#prompt-list").append(details);
  });

  const search = document.querySelector("#asset-search");
  const filter = document.querySelector("#asset-type");
  const previous = document.querySelector("#asset-prev");
  const next = document.querySelector("#asset-next");
  const list = document.querySelector("#asset-list");
  const pageSize = 12;
  let page = 1;
  function assetType(asset) {
    const type = asset.content_type || "";
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type.startsWith("font/") || /\.woff2?$/i.test(asset.local)) return "font";
    return "data";
  }
  function formatSize(bytes) {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MiB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${bytes || 0} B`;
  }
  function renderAssets() {
    const query = search.value.trim().toLowerCase();
    const selected = assets.filter(asset => (filter.value === "all" || assetType(asset) === filter.value) && `${asset.local} ${asset.url} ${asset.content_type}`.toLowerCase().includes(query));
    const totalPages = Math.max(1, Math.ceil(selected.length / pageSize));
    page = Math.min(page, totalPages);
    list.replaceChildren();
    selected.slice((page - 1) * pageSize, page * pageSize).forEach(asset => {
      const row = node("div", "asset-row");
      const path = asset.local || "";
      const name = path.split("/").pop() || "파일";
      const local = link(`source-explorer.html?path=${encodeURIComponent(path)}`, "asset-file");
      local.append(node("span", "asset-filename", name), node("span", "asset-path", path.replace(/^sources\/assets\//, "")));
      const type = assetType(asset);
      const label = { image: "IMAGE", video: "VIDEO", audio: "AUDIO", font: "FONT", data: "DATA" }[type];
      const original = link(asset.url, "asset-origin", "원본 ↗");
      original.setAttribute("aria-label", `${name} 원본 URL 열기`);
      row.append(node("span", "asset-kind", label), local, node("span", "asset-size", formatSize(asset.bytes)), original);
      list.append(row);
    });
    if (!selected.length) list.append(node("p", "empty-state", "일치하는 에셋이 없습니다. 검색어나 파일 유형을 바꿔 보세요."));
    document.querySelector("#asset-count").textContent = `${selected.length}개 에셋 / 전체 ${assets.length}개`;
    document.querySelector("#asset-page").textContent = `${page} / ${totalPages}`;
    previous.disabled = page === 1;
    next.disabled = page === totalPages;
  }
  search.addEventListener("input", () => { page = 1; renderAssets(); });
  filter.addEventListener("change", () => { page = 1; renderAssets(); });
  previous.addEventListener("click", () => { page -= 1; renderAssets(); });
  next.addEventListener("click", () => { page += 1; renderAssets(); });
  renderAssets();
  if (excludedAssets) {
    const note = node("p", "note", `수집 실패 ${excludedAssets}건은 목록에서 제외했습니다. `);
    note.append(link("research/asset-manifest.json", "", "실패 원인과 원본 URL 확인 ↗"));
    document.querySelector(".pagination").after(note);
  }

  document.querySelectorAll("[data-demo]").forEach(button => button.addEventListener("click", () => announce(button.dataset.demo)));
  const navLinks = Array.from(document.querySelectorAll(".section-nav a"));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      navLinks.forEach(anchor => {
        if (anchor.hash === `#${id}`) anchor.setAttribute("aria-current", "location");
        else anchor.removeAttribute("aria-current");
      });
    }, { rootMargin: "-12% 0px -70% 0px", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
  }
})();
