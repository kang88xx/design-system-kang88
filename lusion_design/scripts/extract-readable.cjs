// Analysis artifacts only: original deployed files are preserved byte-for-byte.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
function formatterPath() {
  if (process.env.LUSION_PRETTIER_MODULE) return process.env.LUSION_PRETTIER_MODULE;
  try { return path.dirname(require.resolve('prettier/package.json')); } catch {}
  const cache = path.join(os.homedir(), '.npm/_npx');
  if (fs.existsSync(cache)) for (const entry of fs.readdirSync(cache)) {
    const candidate = path.join(cache, entry, 'node_modules/prettier');
    if (fs.existsSync(path.join(candidate, 'plugins/babel.js'))) return candidate;
  }
  throw Error('Optional extraction tooling needs an existing Prettier installation or LUSION_PRETTIER_MODULE. The viewer has no dependency on it.');
}
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
async function main() {
  const modulePath = formatterPath();
  const prettier = require(modulePath);
  const parser = require(path.join(modulePath, 'plugins/babel.js')).parsers.babel;
  const source = fs.readFileSync(path.join(root, 'sources/site.js'), 'utf8');
  const sourceHash = hash(source);
  const tree = await parser.parse(source, {});
  const declarations = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (['ClassDeclaration', 'FunctionDeclaration'].includes(node.type) && node.id?.name) declarations.push(node);
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'tokens', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(tree);
  const directory = path.join(root, 'sources/readable');
  fs.mkdirSync(path.join(directory, 'classes'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'functions'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'site.formatted.js'), await prettier.format(source, { parser: 'babel' }));
  const css = fs.readFileSync(path.join(root, 'sources/site.css'), 'utf8');
  fs.writeFileSync(path.join(directory, 'site.formatted.css'), await prettier.format(css, { parser: 'css' }));
  const fragments = [];
  for (const node of declarations) {
    const group = node.type === 'ClassDeclaration' ? 'classes' : 'functions';
    const name = node.id.name.replace(/[^a-zA-Z0-9_$-]/g, '_');
    const relative = `sources/readable/${group}/${name}-${node.start}.js`;
    const raw = source.slice(node.start, node.end);
    const formatted = await prettier.format(raw, { parser: 'babel' });
    fs.writeFileSync(path.join(root, relative), formatted);
    fragments.push({ name: node.id.name, type: node.type, path: relative,
      source: 'sources/site.js', source_sha256: sourceHash,
      start_utf16: node.start, end_utf16: node.end,
      raw_sha256: hash(raw), sha256: hash(formatted), bytes: Buffer.byteLength(formatted),
      provenance: 'derived', status: 'captured',
      description: '공개 번들에서 분리하고 정렬한 분석용 코드. 외부 의존성과 상위 범위 변수를 포함할 수 있어 독립 실행 모듈이 아닙니다.' });
  }
  // Verify each output and each exact source range, including nested declarations.
  for (const fragment of fragments) {
    if (hash(source.slice(fragment.start_utf16, fragment.end_utf16)) !== fragment.raw_sha256) throw Error('Source range mismatch: ' + fragment.name);
    if (hash(fs.readFileSync(path.join(root, fragment.path))) !== fragment.sha256) throw Error('Output mismatch: ' + fragment.path);
  }
  if (hash(fs.readFileSync(path.join(root, 'sources/site.js'))) !== sourceHash) throw Error('Original bundle changed during extraction');
  const report = { generated_at: new Date().toISOString(), source: 'sources/site.js', source_sha256: sourceHash,
    classes: fragments.filter(item => item.type === 'ClassDeclaration').length,
    functions: fragments.filter(item => item.type === 'FunctionDeclaration').length,
    exact_source_ranges_verified: fragments.length, fragments,
    scope: 'All named class and function declarations in the parsed public bundle; nested declarations overlap their enclosing source. These counts are not additional downloaded assets.' };
  fs.writeFileSync(path.join(root, 'research/readable-code-v3.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ classes: report.classes, functions: report.functions, verified: fragments.length, original_sha256: sourceHash }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
