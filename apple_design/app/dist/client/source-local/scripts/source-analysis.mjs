import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require = createRequire(new URL('../app/package.json', import.meta.url));
const postcss = require('postcss');
const {parse} = require('@babel/parser');
export const hash = value => createHash('sha256').update(value).digest('hex');
export const codePattern = /\.(?:css|[cm]?js|jsx|tsx?|json|html?|svg|map|md|txt|xml)$/i;
export function resolveReference(reference, base) {
  try {
    if (!reference || /^(?:data:|blob:|javascript:|#)/i.test(reference)) return null;
    const url = new URL(reference, base);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}
function contexts(node) {
  const list = [];
  for (let p = node.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') list.unshift(`@${p.name} ${p.params}`);
  return list;
}
export function analyzeCss(css, sourceUrl, file) {
  const root = postcss.parse(css, {from: file});
  const motions = [], variables = [], shapes = [], references = [];
  root.walkAtRules(rule => {
    if (/keyframes$/i.test(rule.name)) motions.push({name: rule.params, kind: 'keyframes', css: rule.toString(), context: contexts(rule)});
    if (rule.name === 'import') {
      const ref = rule.params.match(/^(?:url\(\s*)?["']?([^"'\s;)]+)/)?.[1];
      if (ref) references.push(ref);
    }
  });
  root.walkRules(rule => {
    const motionDecls = (rule.nodes || []).filter(d => d.type === 'decl' && /^(?:-webkit-)?(?:transition|animation)(?:-|$)/.test(d.prop));
    if (motionDecls.length && !contexts(rule).some(c => /keyframes/.test(c))) {
      const duration = motionDecls.map(d=>d.value).join(' ').match(/\b\d*\.?\d+m?s\b/)?.[0] || null;
      const easing = motionDecls.map(d=>d.value).join(' ').match(/cubic-bezier\([^)]+\)|steps\([^)]+\)|\bease(?:-in-out|-in|-out)?\b|\blinear\b/)?.[0] || null;
      motions.push({name:rule.selector, selector:rule.selector, kind:motionDecls.some(d=>d.prop.includes('animation'))?'animation':'transition',css:rule.toString(),duration,easing,context:contexts(rule)});
    }
    const styles = Object.fromEntries((rule.nodes || []).filter(d=>d.type==='decl' && /^(?:border(?:-radius)?|box-shadow|clip-path|(?:-webkit-)?mask(?:-image)?|background-image)$/.test(d.prop) && !['none','0','0px'].includes(d.value)).map(d=>[d.prop,d.value]));
    if (Object.keys(styles).length) shapes.push({selector:rule.selector, styles, css:rule.toString(),context:contexts(rule)});
  });
  root.walkDecls(decl => {
    if (decl.prop.startsWith('--')) variables.push({name:decl.prop,value:decl.value,selector:decl.parent.selector || '',context:contexts(decl),line:decl.source?.start?.line});
    for (const m of decl.value.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) references.push(m[1].trim());
  });
  const decorate = (items, prefix) => items.map((item,index)=>({id:`${prefix}-${hash(file+'\0'+index+'\0'+JSON.stringify(item)).slice(0,16)}`,sourceUrl,file,...item}));
  return {motions:decorate(motions,'motion'),variables:decorate(variables,'variable'),shapes:decorate(shapes,'css-shape'),references};
}
export function javascriptReferences(code) {
  const ast = parse(code, {sourceType:'unambiguous',errorRecovery:true});
  const refs = new Set(); let unresolvedDynamicImports = 0;
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration','ImportExpression'].includes(node.type) && node.source?.value) refs.add(node.source.value);
    if (node.type === 'CallExpression' && node.callee?.type === 'Import') {
      if (node.arguments[0]?.type === 'StringLiteral') refs.add(node.arguments[0].value);
      else unresolvedDynamicImports++;
    }
    if (node.type==='NewExpression' && node.callee?.name==='URL' && node.arguments[0]?.type==='StringLiteral' && node.arguments[1]?.type==='MemberExpression' && node.arguments[1]?.object?.type==='MetaProperty') refs.add(node.arguments[0].value);
    for (const [key,value] of Object.entries(node)) {
      if (['loc','start','end','errors','comments','tokens'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(walk); else if(value && typeof value==='object') walk(value);
    }
  }
  walk(ast);
  return {references:[...refs].filter(ref=>/^(?:\.|\/|https?:)/.test(ref)),unresolvedDynamicImports};
}
