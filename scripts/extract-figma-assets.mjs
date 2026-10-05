#!/usr/bin/env node
// Extracts the Brand / Marés lockups and the Icon / * components from the Figma file
// (.fig) as SVG. The paths come straight from the vector geometry stored in the file:
// fill geometry for the brand, the original vector network (centerline + stroke
// settings) for the icons. Nothing is redrawn or traced.
//
// Usage: npm run assets:extract -- path/to/file.fig

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync, zstdDecompressSync } from 'node:zlib';
import kiwi from 'kiwi-schema';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = join(root, 'src/assets/brand');
const iconDir = join(root, 'src/assets/icons');

const BRAND_FILES = {
  'Lockup=Signature, Tone=Dark': 'signature-dark.svg',
  'Lockup=Signature, Tone=Light': 'signature-light.svg',
  'Lockup=Wordmark, Tone=Dark': 'wordmark-dark.svg',
  'Lockup=Wordmark, Tone=Light': 'wordmark-light.svg',
};
const COMPACT_NAME = 'Brand / Marés / Compact / Dark';
const COMPACT_FILE = 'compact-dark.svg';

// --- reading the file ---------------------------------------------------------

// A .fig export is a zip with canvas.fig inside; canvas.fig itself is also accepted.
function readCanvas(path) {
  const file = readFileSync(path);
  if (file.readUInt32LE(0) !== 0x04034b50) return file;

  const eocd = file.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let entry = file.readUInt32LE(eocd + 16);
  const count = file.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const method = file.readUInt16LE(entry + 10);
    const size = file.readUInt32LE(entry + 20);
    const nameLength = file.readUInt16LE(entry + 28);
    const extraLength = file.readUInt16LE(entry + 30);
    const commentLength = file.readUInt16LE(entry + 32);
    const localHeader = file.readUInt32LE(entry + 42);
    const name = file.toString('utf8', entry + 46, entry + 46 + nameLength);
    if (name === 'canvas.fig') {
      const start = localHeader + 30 + file.readUInt16LE(localHeader + 26) + file.readUInt16LE(localHeader + 28);
      const data = file.subarray(start, start + size);
      return method === 0 ? data : inflateRawSync(data);
    }
    entry += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error('canvas.fig not found inside ' + path);
}

// canvas.fig: "fig-kiwi" header, version, then length-prefixed chunks
// (compressed kiwi schema, compressed message).
function decodeCanvas(canvas) {
  const chunks = [];
  for (let offset = 12; offset < canvas.length; ) {
    const length = canvas.readUInt32LE(offset);
    chunks.push(canvas.subarray(offset + 4, offset + 4 + length));
    offset += 4 + length;
  }
  const decompress = (chunk) =>
    chunk[0] === 0x28 && chunk[1] === 0xb5 ? zstdDecompressSync(chunk) : inflateRawSync(chunk);
  const schema = kiwi.compileSchema(kiwi.decodeBinarySchema(decompress(chunks[0])));
  return schema.decodeMessage(decompress(chunks[1]));
}

function buildTree(message) {
  const key = (guid) => `${guid.sessionID}:${guid.localID}`;
  const nodes = new Map(message.nodeChanges.map((node) => [key(node.guid), { ...node, children: [] }]));
  for (const node of nodes.values()) {
    const parent = node.parentIndex && nodes.get(key(node.parentIndex.guid));
    if (parent) parent.children.push(node);
  }
  for (const node of nodes.values()) {
    node.children.sort((a, b) => (a.parentIndex.position < b.parentIndex.position ? -1 : 1));
  }
  return nodes;
}

// --- geometry -----------------------------------------------------------------

const num = (value) => String(Math.round(value * 10000) / 10000).replace(/^-0$/, '0');

// Path commands blob: one byte per command followed by float32 coordinates.
function commandsToPath(bytes, dx, dy) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts = [];
  let offset = 0;
  const points = (count) => {
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push(num(view.getFloat32(offset, true) + dx), num(view.getFloat32(offset + 4, true) + dy));
      offset += 8;
    }
    return values.join(' ');
  };
  while (offset < bytes.length) {
    const command = bytes[offset++];
    if (command === 0) parts.push('Z');
    else if (command === 1) parts.push('M' + points(1));
    else if (command === 2) parts.push('L' + points(1));
    else if (command === 3) parts.push('Q' + points(2));
    else if (command === 4) parts.push('C' + points(3));
    else throw new Error(`unknown path command ${command}`);
  }
  return parts.join('');
}

// Vector network blob: vertices and segments (with cubic tangents) as drawn in Figma.
function networkToPath(bytes, dx, dy) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const uint = () => ((offset += 4), view.getUint32(offset - 4, true));
  const float = () => ((offset += 4), view.getFloat32(offset - 4, true));

  const vertexCount = uint();
  const segmentCount = uint();
  uint(); // regions: the icons are open strokes, so regions are not needed
  const vertices = [];
  for (let i = 0; i < vertexCount; i++) {
    uint();
    vertices.push([float(), float()]);
  }
  const point = ([x, y]) => `${num(x + dx)} ${num(y + dy)}`;

  const parts = [];
  let subpathStart = -1;
  let current = -1;
  for (let i = 0; i < segmentCount; i++) {
    uint();
    const start = uint();
    const startTangent = [float(), float()];
    const end = uint();
    const endTangent = [float(), float()];

    if (start !== current) {
      parts.push('M' + point(vertices[start]));
      subpathStart = start;
    }
    const isLine = startTangent.every((v) => v === 0) && endTangent.every((v) => v === 0);
    if (isLine) {
      parts.push('L' + point(vertices[end]));
    } else {
      const [ax, ay] = vertices[start];
      const [bx, by] = vertices[end];
      const c1 = [ax + startTangent[0], ay + startTangent[1]];
      const c2 = [bx + endTangent[0], by + endTangent[1]];
      parts.push(`C${point(c1)} ${point(c2)} ${point(vertices[end])}`);
    }
    current = end;
    if (end === subpathStart) {
      parts.push('Z');
      current = -1;
    }
  }
  return parts.join('');
}

function translation(node) {
  const t = node.transform;
  if (Math.abs(t.m00 - 1) > 1e-6 || Math.abs(t.m11 - 1) > 1e-6 || t.m01 || t.m10) {
    throw new Error(`${node.name} has rotation or scale; only translations are supported`);
  }
  return [t.m02, t.m12];
}

const hex = ({ r, g, b }) =>
  '#' + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

function solidFill(paints, name) {
  const paint = (paints ?? []).find((p) => p.type === 'SOLID' && p.visible !== false);
  if (!paint) return null;
  if ((paint.opacity ?? 1) !== 1 || (paint.color.a ?? 1) !== 1) {
    throw new Error(`${name} uses a translucent fill; not expected in the brand assets`);
  }
  return hex(paint.color);
}

// A vector region can override the node fill (the counter of the "é" in the wordmark
// is painted this way, in the opposite tone, rather than being a hole).
function geometryFill(node, geometry) {
  const override = node.vectorData?.styleOverrideTable?.find((style) => style.styleID === geometry.styleID);
  return solidFill(override?.fillPaints ?? node.fillPaints, node.name);
}

// --- SVG output ---------------------------------------------------------------

function brandSvg(symbol, blobs) {
  const paths = [];
  const visit = (node, dx, dy) => {
    if (node.visible === false) return;
    for (const geometry of node.fillGeometry ?? []) {
      const fill = geometryFill(node, geometry);
      if (!fill) continue;
      const rule = geometry.windingRule === 'ODD' ? ' fill-rule="evenodd"' : '';
      paths.push(`<path fill="${fill}"${rule} d="${commandsToPath(blobs[geometry.commandsBlob].bytes, dx, dy)}"/>`);
    }
    for (const child of node.children) {
      const [x, y] = translation(child);
      visit(child, dx + x, dy + y);
    }
  };
  visit(symbol, 0, 0);
  const width = num(symbol.size.x);
  const height = num(symbol.size.y);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${paths.join('\n')}\n</svg>\n`;
}

function iconSvg(symbol, blobs) {
  const paths = symbol.children.map((glyph) => {
    const [dx, dy] = translation(glyph);
    const d = networkToPath(blobs[glyph.vectorData.vectorNetworkBlob].bytes, dx, dy);
    return (
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${num(glyph.strokeWeight)}" ` +
      `stroke-linecap="${glyph.strokeCap.toLowerCase()}" stroke-linejoin="${glyph.strokeJoin.toLowerCase()}"/>`
    );
  });
  const width = num(symbol.size.x);
  const height = num(symbol.size.y);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${paths.join('\n')}\n</svg>\n`;
}

// --- main ---------------------------------------------------------------------

const figPath = process.argv[2];
if (!figPath) {
  console.error('usage: npm run assets:extract -- path/to/file.fig');
  process.exit(1);
}

const message = decodeCanvas(readCanvas(figPath));
const nodes = [...buildTree(message).values()];
const blobs = message.blobs;

mkdirSync(brandDir, { recursive: true });
mkdirSync(iconDir, { recursive: true });

const brandSet = nodes.find((n) => n.type === 'FRAME' && n.isStateGroup && n.name === 'Brand / Marés');
for (const [variant, file] of Object.entries(BRAND_FILES)) {
  const symbol = brandSet?.children.find((n) => n.name === variant);
  if (!symbol) throw new Error(`Brand / Marés variant not found: ${variant}`);
  writeFileSync(join(brandDir, file), brandSvg(symbol, blobs));
  console.log('brand', file);
}

const compact = nodes.find((n) => n.type === 'SYMBOL' && n.name === COMPACT_NAME);
if (!compact) throw new Error(`${COMPACT_NAME} not found`);
writeFileSync(join(brandDir, COMPACT_FILE), brandSvg(compact, blobs));
console.log('brand', COMPACT_FILE);

const icons = nodes.filter((n) => n.type === 'SYMBOL' && n.name.startsWith('Icon / '));
for (const icon of icons) {
  const file = icon.name.slice('Icon / '.length).toLowerCase().replace(/\s+/g, '-') + '.svg';
  writeFileSync(join(iconDir, file), iconSvg(icon, blobs));
  console.log('icon', file);
}
