import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = new URL('../src/system/', import.meta.url);
const tokens = JSON.parse(await fs.readFile(new URL('tokens.json', root), 'utf8'));
const css = await fs.readFile(new URL('tokens.css', root), 'utf8');

test('core observed colors are present', () => {
  const c = tokens.reatic.color;
  assert.equal(c.black, '#000000'); assert.equal(c.gray100, '#f3f3f3'); assert.equal(c.gray500, '#8a8a8a');
  assert.equal(c.amber500, '#eea302'); assert.equal(c.redNav, '#ff4040'); assert.equal(c.accent, c.amber500);
});
test('type scale keeps 1.4 leading except lead-tight h5', () => {
  for (const [name, spec] of Object.entries(tokens.reatic.text)) {
    if (name === 'h5') assert.equal(spec.lineHeight, 1.2); else if (name === 'body') assert.equal(spec.lineHeight, 1.5); else assert.equal(spec.lineHeight, 1.4, name);
  }
  assert.equal(tokens.reatic.text.mega.fontSize, 260); assert.equal(tokens.reatic.text.display.fontSize, 100);
});
test('layout geometry matches capture', () => {
  const l = tokens.reatic.layout;
  assert.equal(l.headerH, 76); assert.equal(l.logoBox, 64); assert.equal(l.navItemW, 141); assert.equal(l.contentColumn, 980); assert.equal(l.wideColumn, 1360); assert.equal(l.footerH, 48);
});
test('motion durations and easings are the observed values', () => {
  const m = tokens.reatic.motion;
  assert.match(m.enter, /1200ms cubic-bezier\(0\.445, 0\.05, 0\.55, 0\.95\)/);
  assert.match(m.fold, /cubic-bezier\(0\.175, 0\.885, 0\.32, 1\.275\)/);
  assert.equal(m.offset, '60px'); assert.equal(m.staggerDelay, '700ms'); assert.equal(m.heroDelay, '3000ms');
});
test('generated css contains every color and text token', () => {
  for (const name of Object.keys(tokens.reatic.color)) assert.ok(css.includes(`--rt-color-${name.replace(/[A-Z]/g, l => '-' + l.toLowerCase())}:`), name);
  for (const name of Object.keys(tokens.reatic.text)) assert.ok(css.includes(`--rt-text-${name.replace(/[A-Z]/g, l => '-' + l.toLowerCase())}-size:`), name);
  assert.ok(css.includes('[data-rt-theme="dark"]'));
});
