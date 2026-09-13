#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const outRoot = path.join(root, 'sources', 'decoded');
const analysisFile = path.join(root, 'research', 'buf-analysis-v3.json');
const typeMap = {
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
};

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function safeName(file) {
  return rel(file).replace(/^sources\/assets\/lusion\.dev\/assets\//, '').replaceAll('/', '__').replace(/\.buf$/, '');
}

function decodeAttribute(buffer, offset, count, attr) {
  const Type = typeMap[attr.storageType];
  if (!Type) throw new Error(`unsupported storageType ${attr.storageType}`);
  const raw = new Type(buffer.buffer, buffer.byteOffset + offset, count * attr.componentSize);
  const bytes = raw.byteLength;
  if (!attr.needsPack) {
    return { values: Array.from(raw), bytes };
  }
  const packed = attr.packedComponents || [];
  const signed = attr.storageType.startsWith('Int');
  const range = 2 ** (Type.BYTES_PER_ELEMENT * 8);
  const neutral = signed ? range * .5 : 0;
  const scale = 1 / range;
  const values = new Array(count * attr.componentSize);
  for (let vertex = 0, cursor = 0; vertex < count; vertex += 1) {
    for (let component = 0; component < packed.length; component += 1, cursor += 1) {
      const pack = packed[component];
      values[cursor] = (raw[cursor] + neutral) * scale * pack.delta + pack.from;
    }
  }
  return { values, bytes };
}

function bounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[i + axis]);
      max[axis] = Math.max(max[axis], positions[i + axis]);
    }
  }
  return { min, max };
}

function finiteStats(positions) {
  let finite = 0;
  for (const value of positions) {
    if (Number.isFinite(value)) finite += 1;
  }
  return { finite, total: positions.length, ok: finite === positions.length };
}

function indexStats(indices, vertexCount) {
  if (!indices || !indices.length) return null;
  let min = Infinity;
  let max = -Infinity;
  let finite = 0;
  for (const value of indices) {
    if (Number.isFinite(value)) {
      finite += 1;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return {
    finite,
    total: indices.length,
    min,
    max,
    triangles: Math.floor(indices.length / 3),
    inRange: finite === indices.length && min >= 0 && max < vertexCount,
  };
}

function writeObj(file, decoded) {
  const lines = [
    `# Decoded from ${decoded.file}`,
    '# Position/index data decoded from public .buf header and payload.',
  ];
  const positions = decoded.attributes.position.values;
  for (let i = 0; i < positions.length; i += 3) {
    lines.push(`v ${positions[i].toFixed(7)} ${positions[i + 1].toFixed(7)} ${positions[i + 2].toFixed(7)}`);
  }
  const indices = decoded.attributes.indices?.values || [];
  for (let i = 0; i + 2 < indices.length; i += 3) {
    lines.push(`f ${indices[i] + 1} ${indices[i + 1] + 1} ${indices[i + 2] + 1}`);
  }
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
}

function writePoints(file, decoded, classification) {
  const values = decoded.attributes.position.values;
  const positions = [];
  for (let i = 0; i < values.length; i += 3) {
    positions.push([
      Number(values[i].toFixed(7)),
      Number(values[i + 1].toFixed(7)),
      Number(values[i + 2].toFixed(7)),
    ]);
  }
  fs.writeFileSync(file, JSON.stringify({
    source: decoded.file,
    meshType: decoded.meshType,
    classification,
    vertexCount: decoded.vertexCount,
    indexCount: decoded.indexCount,
    bounds: bounds(values),
    positions,
  }));
}

function decodeBuf(file) {
  const buffer = fs.readFileSync(file);
  const headerBytes = buffer.readUInt32LE(0);
  const header = JSON.parse(buffer.subarray(4, 4 + headerBytes).toString('utf8'));
  let offset = 4 + headerBytes;
  const decoded = {
    file: rel(file),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    bytes: buffer.length,
    headerBytes,
    vertexCount: header.vertexCount,
    indexCount: header.indexCount,
    meshType: header.meshType || 'unknown',
    hasSceneData: Boolean(header.sceneData),
    attributes: {},
    sourceAttributes: header.attributes,
  };
  for (const attr of header.attributes) {
    const count = attr.id === 'indices' ? header.indexCount : header.vertexCount;
    const result = decodeAttribute(buffer, offset, count, attr);
    decoded.attributes[attr.id] = { ...attr, values: result.values };
    offset += result.bytes;
  }
  decoded.payloadBytesRead = offset - 4 - headerBytes;
  decoded.trailingBytes = buffer.length - offset;
  return decoded;
}

function classify(decoded) {
  const hasPosition = Boolean(decoded.attributes.position);
  const hasIndices = Boolean(decoded.attributes.indices) && decoded.indexCount > 0;
  const hasOrient = Boolean(decoded.attributes.orient);
  if (!hasPosition) return { status: 'header-only', reason: 'position attribute missing' };
  if (decoded.meshType === 'Mesh' && hasIndices) return { status: 'mesh-decoded', reason: 'position and indices decoded' };
  if (decoded.meshType === 'Points' && hasOrient) return { status: 'points-animation-decoded', reason: 'position decoded; orient suggests animation/spline point data, semantic playback not reconstructed' };
  if (decoded.meshType === 'Points') return { status: 'points-decoded', reason: 'position decoded; no triangle indices' };
  return { status: 'position-decoded', reason: 'position decoded; meshType/indices do not prove render semantics' };
}

function main() {
  fs.mkdirSync(outRoot, { recursive: true });
  const files = execFileSync('find', ['sources/assets/lusion.dev/assets', '-name', '*.buf'], { cwd: root, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();

  const rows = [];
  for (const file of files) {
    const absolute = path.join(root, file);
    let row;
    try {
      const decoded = decodeBuf(absolute);
      const classification = classify(decoded);
      const name = safeName(absolute);
      const position = decoded.attributes.position?.values;
      const output = {};
      if (position && classification.status === 'mesh-decoded') {
        output.obj = `sources/decoded/${name}.obj`;
        output.points = `sources/decoded/${name}.points.json`;
        writeObj(path.join(root, output.obj), decoded);
        writePoints(path.join(root, output.points), decoded, classification);
      } else if (position) {
        output.points = `sources/decoded/${name}.points.json`;
        writePoints(path.join(root, output.points), decoded, classification);
      }
      row = {
        file,
        sha256: decoded.sha256,
        bytes: decoded.bytes,
        headerBytes: decoded.headerBytes,
        payloadBytesRead: decoded.payloadBytesRead,
        trailingBytes: decoded.trailingBytes,
        vertexCount: decoded.vertexCount,
        indexCount: decoded.indexCount,
        meshType: decoded.meshType,
        attributes: decoded.sourceAttributes.map((attr) => ({
          id: attr.id,
          componentSize: attr.componentSize,
          storageType: attr.storageType,
          needsPack: Boolean(attr.needsPack),
        })),
        bounds: position ? bounds(position) : null,
        finitePosition: position ? finiteStats(position) : null,
        indexStats: decoded.attributes.indices ? indexStats(decoded.attributes.indices.values, decoded.vertexCount) : null,
        consumedAllBytes: decoded.trailingBytes === 0,
        status: classification.status,
        reason: classification.reason,
        output,
      };
    } catch (error) {
      row = { file, status: 'failed', reason: error.message };
    }
    rows.push(row);
  }

  const report = {
    checked_at: new Date().toISOString(),
    source: 'sources/readable/classes/BufItem-1203837.js',
    total: rows.length,
    statuses: rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {}),
    unpack_formula: '(raw + signedNeutral) / 2^bits * packedComponent.delta + packedComponent.from; signedNeutral is half range for Int* arrays and 0 for Uint*/Float arrays.',
    rows,
  };
  fs.writeFileSync(analysisFile, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify({
    generated_at: report.checked_at,
    total: rows.length,
    models: rows.filter((row) => row.output && row.output.points).map((row) => ({
      file: row.file,
      label: row.file.split('/').pop(),
      status: row.status,
      meshType: row.meshType,
      vertexCount: row.vertexCount,
      indexCount: row.indexCount,
      points: row.output.points,
      obj: row.output.obj || null,
    })),
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    total: report.total,
    statuses: report.statuses,
    analysis: rel(analysisFile),
    decoded: rel(outRoot),
  }, null, 2));
}

main();
