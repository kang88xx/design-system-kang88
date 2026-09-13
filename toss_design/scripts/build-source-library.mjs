import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const capture = await read('data/toss-source-capture.json');
const manifest = await read('data/toss-asset-manifest.json');
const recipes = await read('data/motion-recipes.json');
const entries = new Map();
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const cleanLabel = (value, fallback) => {
  let label = String(value || '').trim().replace(/\s+/g, ' ');
  if (/^(?:DIV|IMG|SVG|SPAN|VIDEO|CANVAS|svg|BUTTON)$/.test(label)) label = '';
  if (label.length % 2 === 0 && label.slice(0, label.length / 2) === label.slice(label.length / 2)) label = label.slice(0, label.length / 2);
  return (label || fallback).slice(0, 64);
};
const kebab = value => value.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
const declarations = style => Object.entries(style).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([p, v]) => `  ${kebab(p)}: ${v};`).join('\n');
const css = (style, name = '.source-sample') => `${name} {\n${declarations(style)}\n}`;
const source = (viewport, sample = {}, url = capture.sourceUrl) => ({ url, section: sample.section || 'public home', viewport, selector: sample.selector || '', sectionAttribution: sample.sectionAttribution || (sample.section ? 'source observation' : 'page-level') });
function add(entry) {
  const key = `${entry.category}:${entry.code.language}:${entry.code.value}`;
  if (entries.has(key)) {
    const current = entries.get(key);
    current.uses = (current.uses || 1) + (entry.uses || 1);
    current.tags = [...new Set([...current.tags, ...(entry.tags || [])])];
    current.sources.push(entry.source);
    return current;
  }
  const normalized = { id: `${entry.category}-${hash(key)}`, evidence: 'observed', description: '공개 화면에서 수집한 값입니다. 예시의 컨테이너는 미리보기를 위해 구성했습니다.', tags: [], ...entry, sources: [entry.source] };
  entries.set(key, normalized);
  return normalized;
}
const assetsByUrl = new Map(manifest.assets.map(a => [a.url, a]));
const assetUrl = url => assetsByUrl.get(url)?.localPath ? `./${assetsByUrl.get(url).localPath.replace(/^\.\//, '')}` : url;
const localize = value => String(value).replace(/https:\/\/static\.toss\.im\/[^\s"')<>]+/g, url => assetUrl(url));
const observedTokens = {};
for (const rule of capture.stylesheetRules || []) if (rule.kind === 'tokens') Object.assign(observedTokens, rule.values);
function resolveVariables(value, depth = 0) {
  if (depth > 6) return value;
  return String(value).replace(/var\((--[\w-]+)(?:,\s*([^()]+))?\)/g, (all, name, fallback) => observedTokens[name] !== undefined ? resolveVariables(observedTokens[name], depth + 1) : fallback || all);
}

for (const width of [1440, 390]) {
  const catalog = await read(`data/source/catalog-${width}.json`);
  const viewport = width === 1440 ? '1440×1000' : '390×844';
  for (const icon of catalog.icons.inline) {
    const style = { color: icon.rootStyle.color, fill: icon.rootStyle.fill, stroke: icon.rootStyle.stroke, strokeWidth: icon.rootStyle.strokeWidth };
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${escape(icon.viewBox)}" width="24" height="24" style="${declarations(style).replaceAll('\n', '').trim()}" aria-hidden="true">${icon.innerMarkup}</svg>`;
    add({ category: 'icons', label: cleanLabel(icon.labels[0], `${icon.kind === 'graphic' ? '그래픽' : '기능'} SVG · ${icon.viewBox}`), uses: icon.uses, tags: [icon.kind, 'svg', '벡터', ...icon.labels], source: source(viewport), code: { language: 'svg', value: markup }, preview: { kind: 'svg', value: markup } });
  }
  for (const icon of catalog.icons.masks) {
    const values = { display: 'inline-block', width: '24px', height: '24px', backgroundColor: 'currentColor', maskImage: icon.value, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' };
    add({ category: 'icons', label: cleanLabel(icon.label, '마스크 아이콘'), tags: ['mask', '아이콘'], source: source(viewport), code: { language: 'css', value: css(values, '.source-icon') }, preview: { kind: 'shape', style: { ...values, maskImage: localize(icon.value), backgroundColor: '#3182f6' } } });
  }
  for (const button of catalog.buttons) {
    const { height, minHeight, ...values } = button.signature;
    const style = { ...values, minHeight: `${height}px`, fontFamily: 'inherit', cursor: 'pointer' };
    const label = cleanLabel(button.labels[0], `버튼 · ${height}px`);
    add({ category: 'buttons', label, uses: button.uses, tags: ['button', '버튼', ...button.labels], source: source(viewport), code: { language: 'html', value: `<style>\n${css(style, '.source-button')}\n.source-button:focus-visible { outline: 2px solid #3182f6; outline-offset: 3px; }\n</style>\n<button class="source-button" type="button">${escape(label)}</button>` }, preview: { kind: 'button', value: label, style } });
  }
  for (const shape of catalog.shapes) {
    const sample = shape.samples[0];
    const style = { width: `${sample.width}px`, height: `${sample.height}px`, borderRadius: `${shape.radius}px`, background: '#e8f3ff' };
    add({ category: 'shapes', label: `${shape.kind} · ${shape.radius}px`, uses: shape.uses, tags: ['radius', 'box', '박스', '도형', shape.kind], description: '실제 요소의 크기·반경을 보존했습니다. 옅은 파랑은 형태를 보여주기 위한 미리보기 색상입니다.', source: source(viewport), code: { language: 'css', value: css(style, '.source-shape') }, preview: { kind: 'shape', style } });
  }
  for (const [role, colors] of [['background', catalog.color.backgroundColors], ['text', catalog.color.foregroundColors]]) {
    for (const color of colors) {
      const values = { [role === 'background' ? 'backgroundColor' : 'color']: color.value };
      add({ category: 'colors', label: `${role === 'background' ? '배경' : '텍스트'} · ${color.value}`, uses: color.uses, tags: ['color', '컬러', role, ...(color.samples || [])], source: source(viewport), code: { language: 'css', value: css(values, '.source-color') }, preview: { kind: 'color', value: color.value } });
    }
  }
  for (const background of catalog.color.computedBackgroundImages) {
    add({ category: /gradient/.test(background.value) ? 'gradients' : 'images', label: cleanLabel(background.samples[0], '배경 이미지'), tags: ['background', '배경'], source: source(viewport), code: { language: 'css', value: css({ backgroundImage: background.value }) }, preview: { kind: 'gradient', value: localize(background.value) } });
  }
}

for (const c of capture.captures) {
  const viewport = `${c.viewport.width}×${c.viewport.height}`;
  for (const group of c.groups) {
    const sample = group.samples[0] || {};
    const values = group.values;
    const kind = group.category;
    let category = 'effects';
    let preview = { kind: 'shape', style: values };
    let label = cleanLabel(sample.label, kind);
    let code = css(values);
    if (kind === 'typography') { category = 'typography'; preview = { kind: 'type', value: cleanLabel(sample.label, '금융부터 일상까지'), style: values }; label = `${values.fontSize} / ${values.lineHeight} · ${values.fontWeight}`; }
    if (kind === 'transition' || kind === 'animation') { category = 'motion'; preview = { kind: 'motion', value: kind, style: values }; label = `${kind === 'transition' ? '전환' : '반복'} · ${values.transitionDuration || values.animationName}`; }
    if (kind === 'spacing') { category = 'shapes'; label = `여백 · ${values.padding} / gap ${values.gap}`; preview = { kind: 'shape', style: { padding: values.padding, gap: values.gap, background: '#e8f3ff', borderRadius: '12px', display: 'flex' } }; }
    if (kind === 'shadow') { label = `그림자 · ${cleanLabel(sample.label, '표면')}`; preview.kind = 'shadow'; }
    if (kind === 'filter') label = `블러·필터 · ${values.backdropFilter !== 'none' ? values.backdropFilter : values.filter}`;
    if (kind === 'border') label = `테두리 · ${values.border}`;
    if (kind === 'mask') label = `마스크 · ${cleanLabel(sample.label, '콘텐츠')}`;
    if (kind === 'pseudo') { label = `가상 요소 · ${sample.selector?.endsWith('::before') ? 'before' : 'after'}`; code = css(values, `.source-sample${sample.selector?.endsWith('::before') ? '::before' : '::after'}`); preview = { kind: 'shape', style: { background: localize(values.background), borderRadius: values.borderRadius, width: values.width, height: values.height } }; }
    add({ category, label, uses: group.uses, tags: [kind, ...group.samples.map(s => s.label)], source: source(viewport, sample), code: { language: 'css', value: code }, preview });
  }
  for (const state of c.interactionStates) {
    if (JSON.stringify(state.normal) === JSON.stringify(state.hover) && JSON.stringify(state.normal) === JSON.stringify(state.focus)) continue;
    add({ category: 'motion', label: `상태 · ${cleanLabel(state.label, '내비게이션')}`, tags: ['hover', 'focus', 'interaction', '인터랙션'], source: source(viewport, { section: 'navigation' }), description: '실제 컨트롤에 포인터와 포커스를 옮겨 얻은 계산 스타일입니다.', code: { language: 'css', value: [css(state.normal, '.source-control'), css(state.hover, '.source-control:hover'), css(state.focus, '.source-control:focus')].join('\n\n') }, preview: { kind: 'button', value: cleanLabel(state.label, '메뉴'), style: state.normal } });
  }
}

for (const rule of capture.stylesheetRules || []) {
  const origin = source('stylesheet', { selector: rule.selector }, rule.url);
  if (rule.kind === 'gradient') {
    add({ category: 'gradients', label: `${rule.property.includes('mask') ? '마스크' : '표면'} · ${rule.value.startsWith('radial') ? 'radial' : 'linear'} gradient`, tags: ['gradient', '그라데이션', rule.property, rule.context], source: origin, description: `선언 위치: ${rule.selector}. ${rule.context ? `조건: ${rule.context}` : '공통 스타일'}. 마스크와 표면 그라데이션을 구분합니다.`, code: { language: 'css', value: css({ [rule.property]: resolveVariables(rule.value) }, '.source-gradient') }, preview: { kind: 'gradient', value: resolveVariables(rule.value) } });
  }
  if (rule.kind === 'keyframes') {
    add({ category: 'motion', label: `키프레임 · ${rule.css.match(/keyframes\s+([^\s{]+)/)?.[1] || 'animation'}`, tags: ['keyframes', 'animation', '모션'], source: origin, description: '배포된 CSS의 원본 키프레임입니다. 실제 재생 시간과 트리거는 사용 위치에 따라 달라집니다.', code: { language: 'css', value: rule.css }, preview: { kind: 'motion', value: 'keyframes' } });
  }
  if (rule.kind === 'state') {
    add({ category: 'effects', label: `${rule.selector.includes(':hover') ? 'Hover' : rule.selector.includes(':focus') ? 'Focus' : rule.selector.includes(':disabled') ? 'Disabled' : 'Active'} · ${rule.selector.slice(0, 44)}`, tags: ['state', 'interaction', '상태', rule.context], source: origin, description: '배포된 CSS 선택자와 상태 선언 원문입니다. 해당 DOM 구조가 있을 때 적용됩니다.', code: { language: 'css', value: rule.css }, preview: { kind: 'code', value: rule.css } });
  }
  if (rule.kind === 'font') {
    add({ category: 'typography', label: `폰트 · ${rule.css.match(/font-family:\s*([^;]+)/)?.[1] || 'font face'}`, tags: ['font', 'woff2', '폰트'], source: origin, description: '공개 스타일시트의 폰트 선언과 원격 경로입니다. 폰트 파일은 다운로드 키트에 포함하지 않습니다.', code: { language: 'css', value: rule.css }, preview: { kind: 'font', value: '금융부터 일상까지', style: { fontFamily: 'sans-serif' } } });
  }
}

const frames = [];
for (const asset of manifest.assets) {
  const url = asset.url;
  if (asset.kind === 'font' || asset.status === 'failed') continue;
  if (/(?:frame[-_]?\d+|\/\d+\.(?:avif|webp)|sequence)/i.test(url)) { frames.push(asset); continue; }
  const filename = decodeURIComponent(new URL(url).pathname.split('/').at(-1));
  const label = cleanLabel(asset.label, filename.replace(/[-_]/g, ' '));
  const media = capture.captures.flatMap(c => c.media).find(m => m.url === url);
  const isIcon = /(?:\/icon|icon[-_]|logo|emoji)/i.test(url);
  let category = isIcon ? 'icons' : 'images';
  let preview = { kind: asset.kind === 'video' ? 'video' : 'image', url: assetUrl(url), poster: media?.poster ? assetUrl(media.poster) : undefined };
  let code = { language: 'html', value: asset.kind === 'video' ? `<video controls playsinline preload="none"${media?.poster ? ` poster="${escape(media.poster)}"` : ''}>\n  <source src="${escape(url)}" type="video/mp4">\n</video>` : `<img src="${escape(url)}" alt="${escape(label)}" loading="lazy" decoding="async">` };
  if (asset.kind === 'animation' || asset.kind === 'binary') { category = 'motion'; preview = { kind: 'code', value: `${asset.kind} · ${filename}` }; code = { language: 'json', value: JSON.stringify({ url, kind: asset.kind, localPath: asset.localPath, sha256: asset.sha256 }, null, 2) }; }
  add({ category, label, tags: [asset.kind, filename, asset.discovery || '', isIcon ? '아이콘' : '이미지'], source: source(media ? 'DOM / network' : 'public resource', { section: media?.section || asset.section }, url), description: `공개 자산 · ${asset.status === 'archived' ? '로컬 스터디 보관' : asset.reason || '원본 링크'}. 원본 권리는 출처에 있습니다.`, code, preview, assetId: asset.id });
}
if (frames.length) add({ category: 'motion', label: `스크롤 프레임 시퀀스 · ${frames.length}개 자산`, tags: ['sequence', 'scroll', 'avif', 'webp', '스크롤'], source: source('network', { section: 'transfer' }), description: '페이지를 스크롤하며 실제 요청되거나 공개 번들에 명시된 프레임 주소입니다. 모든 프레임과 보관 상태는 자산 목록에 보존했습니다.', code: { language: 'json', value: JSON.stringify(frames.map(({ url, localPath, status }) => ({ url, localPath, status })), null, 2) }, preview: { kind: 'image', url: assetUrl(frames[Math.floor(frames.length / 2)].url) } });

// Keep full runtime samples in the capture, while grouping identical keyframe programs for discovery.
const runtime = new Map();
for (const c of capture.captures) for (const sample of c.motionSamples) {
  const key = JSON.stringify({ name: sample.name, keyframes: sample.keyframes, duration: sample.timing?.duration });
  if (!runtime.has(key)) runtime.set(key, { ...sample, viewport: `${c.viewport.width}×${c.viewport.height}` });
}
for (const sample of [...runtime.values()].slice(0, 32)) {
  const timing = { ...sample.timing, iterations: sample.timing?.iterations === null ? 1 : sample.timing?.iterations };
  add({ category: 'motion', label: `런타임 · ${sample.name}`, tags: ['web animations', 'runtime', '키프레임'], description: '스크롤 중 Web Animations API에서 관찰한 프레임입니다. 원본의 스크롤 트리거와 주변 DOM은 별도로 구성해야 합니다. 반복은 예시에서 1회로 제한합니다.', source: source(sample.viewport, { section: sample.section }), code: { language: 'javascript', value: `// target: an element in your own UI\nconst frames = ${JSON.stringify(sample.keyframes, null, 2)};\nconst timing = ${JSON.stringify(timing, null, 2)};\nif (matchMedia('(prefers-reduced-motion: reduce)').matches) {\n  Object.assign(target.style, frames.at(-1));\n} else {\n  target.animate(frames, timing);\n}` }, preview: { kind: 'motion', value: 'runtime' } });
}
for (const recipe of recipes) add(recipe);

const list = [...entries.values()];
for (const entry of list) {
  if (entry.evidence === 'recreated') continue;
  entry.code.value = localize(entry.code.value);
  const dependencies = [...new Set([...entry.code.value.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]))];
  const missing = dependencies.filter(name => observedTokens[name] === undefined);
  if (dependencies.length) {
    entry.reuse = { mode: 'source-context', dependencies, unresolved: missing };
    entry.description = `원본 선언 자료입니다. 원본 선택자·상태와 연결된 CSS 변수가 필요합니다.${missing.length ? ` 수집하지 못한 동적 변수 ${missing.length}개는 아래 주석에 표시했습니다.` : ' 변수 값은 toss-observed-tokens.css에 있습니다.'} ${entry.description}`;
    if (entry.code.language === 'css') entry.code.value = `/* Source context required.\n * Dependencies: ${dependencies.join(', ')}\n${missing.length ? ` * Dynamic / unavailable: ${missing.join(', ')}\n` : ''} * See dist/toss-observed-tokens.css and the original selector.\n */\n${entry.code.value}`;
  } else entry.reuse = { mode: ['css', 'html', 'svg'].includes(entry.code.language) ? 'snippet' : 'source-data', dependencies: [] };
  // A denied public asset remains in the manifest, but is never requested in a visual preview.
  const unavailable = manifest.assets.find(asset => asset.status === 'failed' && JSON.stringify(entry.preview).includes(asset.url));
  if (unavailable) entry.preview = { kind: 'code', value: `원본 응답 ${unavailable.reason}. 수집 기록에서 URL을 확인할 수 있어요.` };
}
const categories = Object.fromEntries([...new Set(list.map(e => e.category))].map(category => [category, list.filter(e => e.category === category).length]));
const library = {
  schemaVersion: 2,
  collectedAt: capture.collectedAt,
  sourceUrl: capture.sourceUrl,
  coverage: {
    viewports: capture.captures.map(c => c.viewport),
    sections: [...new Set(capture.captures.flatMap(c => c.sections.map(s => s.id)))],
    notes: ['공개 홈의 데스크톱·모바일 lazy sections를 끝까지 순회한 스냅샷입니다.', '원본 소스 저장소, 비공개 API, 인증 페이지는 포함하지 않습니다.', '스타일은 수집한 상태 기준이며 모든 시간·프레임·hover 조합의 완전 수집을 의미하지 않습니다.', '원본 관찰값과 독립 재현한 예제를 구분합니다. 재사용 시 원본 자산의 권리는 별도 확인이 필요합니다.', '일부 section은 스냅샷 위치에 따른 추정입니다. 정확한 선택자와 출처 URL을 우선합니다.', '전체 런타임 샘플은 toss-source-capture.json, 프레임 목록은 toss-asset-manifest.json에 있습니다.'],
    documents: capture.documents.length,
    stylesheets: capture.documents.filter(d => d.type === 'stylesheet').length,
    resourceUrls: capture.resources.length,
    categories,
    runtimeSamples: capture.captures.reduce((n, c) => n + c.motionSamples.length, 0),
  },
  assets: manifest.assets,
  entries: list,
};
await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'data/toss-source-library.json'), JSON.stringify(library, null, 2) + '\n');
await writeFile(path.join(root, 'data/toss-css-tokens.json'), JSON.stringify({ sourceUrl: capture.sourceUrl, collectedAt: capture.collectedAt, tokens: observedTokens }, null, 2) + '\n');
await writeFile(path.join(root, 'dist/toss-observed-tokens.css'), `/* Public homepage CSS variables, captured ${capture.collectedAt}. Snapshot values, not an official TDS API. */\n:root {\n${Object.entries(observedTokens).map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`);
const figma = await read('figma/figma-variables.json');
figma.generatedAt = capture.collectedAt;
figma.collections = figma.collections.filter(collection => collection.name !== 'ObservedCSS');
figma.collections.push({
  name: 'ObservedCSS', modes: ['Snapshot'],
  variables: Object.entries(observedTokens).map(([name, value]) => {
    const dimension = String(value).match(/^(-?\d+(?:\.\d+)?)(px|ms)$/);
    const number = /^-?\d+(?:\.\d+)?$/.test(value);
    return { name: `observed/${name.slice(2)}`, type: dimension || number ? 'FLOAT' : /^#[0-9a-f]{3,8}$/i.test(value) ? 'COLOR' : 'STRING', ...(dimension ? { unit: dimension[2] } : {}), values: { Snapshot: dimension ? Number(dimension[1]) : number ? Number(value) : value } };
  }),
});
await writeFile(path.join(root, 'figma/figma-variables.json'), JSON.stringify(figma, null, 2) + '\n');
console.log(JSON.stringify({ entries: list.length, categories, assets: manifest.assets.length, frames: frames.length, cssTokens: Object.keys(observedTokens).length }, null, 2));
