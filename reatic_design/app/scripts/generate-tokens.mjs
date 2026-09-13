import fs from 'node:fs/promises';
const root = new URL('../src/system/', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('tokens.json', root), 'utf8'));
const kebab = value => value.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
const px = value => (typeof value === 'number' ? value + 'px' : value);

function declarations(t) {
  const values = {};
  for (const [name, value] of Object.entries(t.color || {})) values[`--rt-color-${kebab(name)}`] = value;
  for (const [name, value] of Object.entries(t.font || {})) values[`--rt-font-${kebab(name)}`] = value;
  for (const [name, value] of Object.entries(t.weight || {})) values[`--rt-weight-${kebab(name)}`] = value;
  for (const group of ['breakpoint', 'layout', 'section', 'radius', 'border', 'space', 'button'])
    for (const [name, value] of Object.entries(t[group] || {})) values[`--rt-${group}-${kebab(name)}`] = px(value);
  for (const [name, spec] of Object.entries(t.text || {})) {
    values[`--rt-text-${kebab(name)}-size`] = px(spec.fontSize);
    values[`--rt-text-${kebab(name)}-line`] = String(spec.lineHeight);
  }
  for (const group of ['tracking', 'motion', 'shadow'])
    for (const [name, value] of Object.entries(t[group] || {})) values[`--rt-${group}-${kebab(name)}`] = value;
  return Object.entries(values).map(([name, value]) => `  ${name}: ${value};`).join('\n');
}

const header = '/* Generated from tokens.json. Run `node app/scripts/generate-tokens.mjs` after editing tokens. */\n';
const css = header + ':root {\n' + declarations(data.reatic) + '\n}\n' +
  Object.entries(data.themes || {}).map(([name, theme]) => `\n[data-rt-theme="${name}"] {\n${declarations(theme)}\n}\n`).join('');

if (process.argv.includes('--check')) {
  const current = await fs.readFile(new URL('tokens.css', root), 'utf8');
  if (current !== css) throw new Error('tokens.css is stale; run node app/scripts/generate-tokens.mjs');
  console.log('Token JSON and CSS match.');
} else {
  await fs.writeFile(new URL('tokens.css', root), css);
  console.log('Generated tokens.css');
}
