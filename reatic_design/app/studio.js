// Studio behaviour: hash routing highlight, token table, copy/export, theme toggle, motion replay, sources index.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---- theme ----
const root = document.documentElement;
$('#theme-dark').addEventListener('click', () => root.setAttribute('data-rt-theme', 'dark'));
$('#theme-light').addEventListener('click', () => root.removeAttribute('data-rt-theme'));

// ---- nav highlight ----
const navLinks = $$('.as-sidebar nav a');
const setActive = () => { const h = location.hash || '#overview'; navLinks.forEach(a => { const on = a.getAttribute('href') === h; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); };
addEventListener('hashchange', setActive); setActive();

// ---- tokens ----
const tokensCssPromise = fetch('src/system/tokens.css').then(r => r.text());
fetch('src/system/tokens.json').then(r => r.json()).then(data => {
  const t = data.reatic; const list = $('#token-list'); const rows = [];
  const kebab = v => v.replace(/[A-Z]/g, l => '-' + l.toLowerCase());
  const add = (name, value) => rows.push(`<div><code>${name}</code><span>${value}</span></div>`);
  for (const [k, v] of Object.entries(t.color)) add(`--rt-color-${kebab(k)}`, v);
  for (const [k, v] of Object.entries(t.text)) add(`--rt-text-${kebab(k)}`, `${v.fontSize}px / ${v.lineHeight}`);
  for (const g of ['layout', 'section', 'radius', 'button']) for (const [k, v] of Object.entries(t[g])) add(`--rt-${g}-${kebab(k)}`, typeof v === 'number' ? v + 'px' : v);
  for (const [k, v] of Object.entries(t.motion)) add(`--rt-motion-${kebab(k)}`, v);
  list.innerHTML = rows.join('');
  $('#token-count').textContent = rows.length;
});
$$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const value = btn.getAttribute('data-copy');
  try { await navigator.clipboard.writeText(value); btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = `Copy ${value}`; }, 1200); } catch { btn.textContent = value; }
}));
$('#export-tokens').addEventListener('click', async () => {
  const css = await tokensCssPromise;
  const blob = new Blob([css], { type: 'text/css' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'reatic-tokens.css'; document.body.appendChild(a); a.click(); a.remove();
});

// ---- motion ----
const replay = (card) => { card.classList.remove('play'); $$('.box', card).forEach(b => { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }); void card.offsetWidth; card.classList.add('play'); };
$$('[data-replay]').forEach(btn => btn.addEventListener('click', () => replay(btn.closest('.mo'))));
const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { replay(e.target); io.unobserve(e.target); } }), { threshold: .4 });
$$('.mo[data-motion-demo]').forEach(c => io.observe(c));
$('#reduce-motion').addEventListener('change', e => { document.body.classList.toggle('reduce-motion', e.target.checked); if (e.target.checked) $$('.mo').forEach(c => c.classList.remove('play')); });

// ---- component state demo ----
const submit = $('#demo-submit');
$('#state-disabled').addEventListener('click', () => { submit.disabled = true; submit.removeAttribute('data-loading'); });
$('#state-loading').addEventListener('click', () => { submit.disabled = false; submit.setAttribute('data-loading', 'true'); submit.setAttribute('aria-busy', 'true'); });
$('#state-reset').addEventListener('click', () => { submit.disabled = false; submit.removeAttribute('data-loading'); submit.removeAttribute('aria-busy'); });
$('#demo-form').addEventListener('submit', e => { e.preventDefault(); const f = $('#demo-company'); const wrap = f.closest('.rt-field'); if (!f.value.trim()) { wrap.setAttribute('data-invalid', 'true'); $('#demo-error').textContent = '회사명을 입력해주세요.'; } else { wrap.removeAttribute('data-invalid'); $('#demo-error').textContent = ''; $('#demo-status').textContent = `접수됨: ${f.value}`; } });
const range = $('#demo-range'); const out = $('#demo-range-out'); range.addEventListener('input', () => { out.textContent = `약 ${range.value}만원`; });

// ---- sources ----
fetch('../evidence/source-index.json').then(r => r.json()).then(index => {
  const list = $('#source-list'); const filter = $('#source-filter'); const count = $('#source-count');
  const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n > 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';
  const render = () => {
    const q = filter.value.trim().toLowerCase();
    const items = index.filter(i => !q || i.file.toLowerCase().includes(q) || i.group.includes(q));
    count.textContent = `${items.length} / ${index.length} files · ${fmt(items.reduce((a, b) => a + b.bytes, 0))}`;
    list.innerHTML = items.slice(0, 400).map(i => `<li><a href="../${i.file}" target="_blank" rel="noreferrer">${i.file}</a><span>${i.group} · ${fmt(i.bytes)}</span></li>`).join('') + (items.length > 400 ? `<li><span>… ${items.length - 400} more (narrow the filter)</span></li>` : '');
  };
  filter.addEventListener('input', render); render();
  const groups = {}; index.forEach(i => { groups[i.group] = (groups[i.group] || 0) + 1; });
  $('#source-groups').innerHTML = Object.entries(groups).map(([g, n]) => `<div><span>${g}</span><span>${n}</span></div>`).join('');
}).catch(() => { $('#source-count').textContent = 'evidence/source-index.json not found — run node scripts/build-source-index.mjs'; });
