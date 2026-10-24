// tools/generate-icons.mjs — rasterise the app icon to PNG without any
// dependency (Node's zlib only). Run: node tools/generate-icons.mjs
// The icon is drawn as vector geometry (rounded square + chevrons + dot),
// supersampled 3×3 for antialiasing, then written as RGBA PNGs.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [14, 17, 22];
const BORDER = [31, 41, 55];
const BLUE = [59, 130, 246];
const GREEN = [34, 197, 94];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── geometry (unit square coordinates) ──────────────────────────────────────
const R = 0.219; // corner radius
function roundRectSdf(x, y) {
  const qx = Math.abs(x - 0.5) - (0.5 - R);
  const qy = Math.abs(y - 0.5) - (0.5 - R);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - R;
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const STROKE = 0.036; // half-width
const CHEVRONS = [
  [[0.400, 0.334], [0.268, 0.5], [0.400, 0.666]],
  [[0.600, 0.334], [0.732, 0.5], [0.600, 0.666]],
];
function inside(x, y) {
  if (roundRectSdf(x, y) > -0.016) return 'border';
  if (roundRectSdf(x, y) > 0) return 'bg';
  for (const path of CHEVRONS) {
    for (let i = 0; i < path.length - 1; i++) {
      const [a, b] = [path[i], path[i + 1]];
      if (segDist(x, y, a[0], a[1], b[0], b[1]) < STROKE) return 'blue';
    }
  }
  if (Math.hypot(x - 0.5, y - 0.5) < 0.0295) return 'green';
  return 'bg';
}

function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const S = 3, samples = S * S;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const kind = inside((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size);
          const c = kind === 'blue' ? BLUE : kind === 'green' ? GREEN : kind === 'border' ? BORDER : BG;
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / samples);
      buf[i + 1] = Math.round(g / samples);
      buf[i + 2] = Math.round(b / samples);
      buf[i + 3] = 255;
    }
  }
  return png(size, size, buf);
}

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
for (const size of [192, 512]) {
  const out = new URL(`../icons/icon-${size}.png`, import.meta.url);
  writeFileSync(out, render(size));
  console.log(`icons/icon-${size}.png (${size}×${size})`);
}
