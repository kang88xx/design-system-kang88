import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = new URL('../src/system/', import.meta.url);
const jsx = await fs.readFile(new URL('components.jsx', root), 'utf8');
const css = await fs.readFile(new URL('components.css', root), 'utf8');
const motion = await fs.readFile(new URL('motion.css', root), 'utf8');
const dts = await fs.readFile(new URL('index.d.ts', root), 'utf8');
const index = await fs.readFile(new URL('index.js', root), 'utf8');
const exportsList = ['Logo', 'Header', 'NavMenu', 'Button', 'TextField', 'Select', 'Checkbox', 'Card', 'GalleryTile', 'Gallery', 'AnchorDots', 'ScrollHint', 'CtaStrip', 'Footer', 'EnterMotion', 'useEnterMotion', 'useReducedMotion'];

test('every component is exported, typed and styled', () => {
  for (const name of exportsList) {
    assert.ok(index.includes(name), `index.js exports ${name}`);
    assert.ok(new RegExp(`export (const|function) ${name}\\b`).test(jsx), `components.jsx defines ${name}`);
    assert.ok(dts.includes(name), `index.d.ts declares ${name}`);
  }
  for (const cls of ['.rt-nav__link', '.rt-button--cta', '.rt-button--secondary', '.rt-button--submit', '.rt-field--underline', '.rt-field--box', '.rt-select__input', '.rt-card', '.rt-tile', '.rt-anchor-dots', '.rt-scroll-hint', '.rt-cta-strip', '.rt-footer']) assert.ok(css.includes(cls), cls);
});
test('button forwards refs, defaults type=button and supports links and loading', () => {
  assert.ok(/forwardRef\(function Button/.test(jsx));
  assert.ok(jsx.includes('type={type || "button"}'));
  assert.ok(jsx.includes('data-loading={loading || undefined}'));
  assert.ok(jsx.includes('aria-disabled={disabled || undefined}'));
});
test('fields wire label, hint and error ids', () => {
  assert.ok(jsx.includes('aria-describedby'));
  assert.ok(jsx.includes('aria-invalid'));
  assert.ok(jsx.includes('role="alert"'));
});
test('motion presets cover all six observed entrances and honor reduced motion', () => {
  for (const kf of ['rt-fadeIn', 'rt-floatIn', 'rt-foldIn', 'rt-blurIn', 'rt-glideIn', 'rt-revealIn']) assert.ok(motion.includes(`@keyframes ${kf}`), kf);
  for (const preset of ['fade', 'float-up', 'fold-2', 'fold-3', 'fold-side', 'blur-hero', 'glide-right', 'reveal']) assert.ok(motion.includes(`[data-rt-enter="${preset}"]`), preset);
  assert.ok(motion.includes('prefers-reduced-motion: reduce'));
  assert.ok(css.includes(':focus-visible'));
});
