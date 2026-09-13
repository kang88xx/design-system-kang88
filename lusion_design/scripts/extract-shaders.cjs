#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

function prettierModulePath() {
  if (process.env.LUSION_PRETTIER_MODULE) return process.env.LUSION_PRETTIER_MODULE;
  try { return path.dirname(require.resolve('prettier/package.json')); } catch {}
  const cache = path.join(os.homedir(), '.npm/_npx');
  if (fs.existsSync(cache)) {
    for (const entry of fs.readdirSync(cache)) {
      const candidate = path.join(cache, entry, 'node_modules/prettier');
      if (fs.existsSync(path.join(candidate, 'plugins/babel.js'))) return candidate;
    }
  }
  throw Error('Optional extraction tooling needs an existing Prettier installation or LUSION_PRETTIER_MODULE.');
}

const parser = require(path.join(prettierModulePath(), 'plugins/babel.js'));

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit);
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      walk(value, visit);
    }
  }
}

function isShader(value) {
  return value.length > 40 &&
    value.includes('void main') &&
    ['gl_Position', 'gl_FragColor', 'fragColor', 'uniform ', 'varying ', 'attribute ', 'precision '].some((token) => value.includes(token));
}

const results = [];
const seen = new Set();

for (const file of process.argv.slice(2)) {
  const text = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parsers.babel.parse(text, {}, { filepath: file });
  } catch (error) {
    results.push({ file, error: error.message });
    continue;
  }
  walk(ast, (node) => {
    const candidates = [];
    if ((node.type === 'StringLiteral' || node.type === 'DirectiveLiteral') && typeof node.value === 'string') {
      candidates.push({ value: node.value, raw: node.extra && node.extra.raw, template_part: false, complete_literal: true });
    }
    if (node.type === 'TemplateElement' && node.value) {
      const template = node.parent;
      candidates.push({
        value: node.value.cooked ?? node.value.raw ?? '',
        raw: node.value.raw,
        template_part: true,
        complete_literal: Boolean(template && template.type === 'TemplateLiteral' && template.expressions && template.expressions.length === 0),
      });
    }
    for (const candidate of candidates) {
      const value = candidate.value;
      if (!isShader(value)) continue;
      const digest = crypto.createHash('sha256').update(value).digest('hex');
      if (seen.has(digest)) continue;
      seen.add(digest);
      results.push({
        file,
        character_offset: node.start,
        character_end: node.end,
        sha256: digest,
        bytes: Buffer.byteLength(value),
        source: value,
        confidence: 'high',
        extraction: 'babel-ast-string-literal',
        template_part: candidate.template_part,
        complete_literal: candidate.complete_literal,
      });
    }
  });
}

process.stdout.write(JSON.stringify({ shaders: results }, null, 2));
