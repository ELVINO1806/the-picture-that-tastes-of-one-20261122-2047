// The picture that tastes of one ingredient — a steaming bowl of ramen.
// Draws a 1024x1024 PNG with the standard library only (node:fs, node:zlib,
// node:path) and writes it to /output/entry.png. Deterministic: every run
// produces byte-identical output (seeded PRNG, no clock, no network).
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const W = 1024;
const H = 1024;
const OUT_DIR = '/output';
const OUT_FILE = join(OUT_DIR, 'entry.png');

// ---- seeded PRNG (mulberry32) -------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261123);

// ---- pixel buffer ----------------------------------------------------------
const buf = new Uint8ClampedArray(W * H * 4);

function blend(x, y, r, g, b, a) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || xi >= W || yi < 0 || yi >= H) return;
  const i = (yi * W + xi) * 4;
  const inv = 1 - a;
  buf[i] = r * a + buf[i] * inv;
  buf[i + 1] = g * a + buf[i + 1] * inv;
  buf[i + 2] = b * a + buf[i + 2] * inv;
  buf[i + 3] = 255;
}

function disc(cx, cy, rad, r, g, b, a = 1) {
  const x0 = Math.max(0, Math.floor(cx - rad));
  const x1 = Math.min(W - 1, Math.ceil(cx + rad));
  const y0 = Math.max(0, Math.floor(cy - rad));
  const y1 = Math.min(H - 1, Math.ceil(cy + rad));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rad * rad) blend(x, y, r, g, b, a);
    }
  }
}

function ellipse(cx, cy, rx, ry, r, g, b, a = 1) {
  const x0 = Math.max(0, Math.floor(cx - rx));
  const x1 = Math.min(W - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const y1 = Math.min(H - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) blend(x, y, r, g, b, a);
    }
  }
}

// Thick line drawn as a chain of small discs.
function thickLine(x0, y0, x1, y1, w, r, g, b, a = 1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(len / (w * 0.4)));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(x0 + dx * t, y0 + dy * t, w / 2, r, g, b, a);
  }
}

// Wavy noodle strand: a sine curve drawn as short thick segments.
function noodle(x0, y0, len, amp, freq, phase, w, r, g, b, a = 1) {
  const steps = 90;
  let px = x0;
  let py = y0 + amp * Math.sin(phase);
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const x = x0 + len * t;
    const y = y0 + amp * Math.sin(freq * t * Math.PI * 2 + phase);
    thickLine(px, py, x, y, w, r, g, b, a);
    px = x;
    py = y;
  }
}

// ---- background: warm dark gradient ---------------------------------------
for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  const r = Math.round(46 + (18 - 46) * t);
  const g = Math.round(26 + (10 - 26) * t);
  const b = Math.round(16 + (6 - 16) * t);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  }
}
// Warm table glow behind the bowl.
ellipse(512, 640, 470, 330, 96, 52, 26, 0.55);
ellipse(512, 660, 380, 250, 120, 66, 32, 0.35);

// ---- steam wisps (behind chopsticks, above the bowl) -----------------------
for (let k = 0; k < 4; k++) {
  const baseX = 380 + k * 90 + rand() * 20;
  const topY = 150 + rand() * 40;
  const steps = 60;
  let px = baseX;
  let py = 430;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const y = 430 - (430 - topY) * t;
    const x = baseX + Math.sin(t * Math.PI * 3.2 + k * 1.7) * (18 + 26 * t);
    thickLine(px, py, x, y, 16 - 8 * t, 255, 240, 220, 0.10);
    px = x;
    py = y;
  }
}

// ---- bowl ------------------------------------------------------------------
const BX = 512;
const BY = 640;
const BOWL_R = 350;
// Bowl body: deep red ceramic with a darker bottom shade.
disc(BX, BY, BOWL_R, 138, 38, 28);
disc(BX, BY + 90, 300, 112, 28, 20, 0.55);
ellipse(BX, BY + 250, 250, 90, 70, 16, 12, 0.6);
// Rim highlight following the bowl's upper-left curve.
for (let s = 0; s < 26; s++) {
  const a0 = Math.PI * (1.08 + (s / 26) * 0.42);
  const a1 = Math.PI * (1.08 + ((s + 1) / 26) * 0.42);
  thickLine(
    BX + Math.cos(a0) * (BOWL_R - 14), BY + Math.sin(a0) * (BOWL_R - 14),
    BX + Math.cos(a1) * (BOWL_R - 14), BY + Math.sin(a1) * (BOWL_R - 14),
    13, 214, 96, 66, 0.75,
  );
}

// ---- broth (seen from slightly above) --------------------------------------
const BROTH_CX = BX;
const BROTH_CY = 545;
const BROTH_RX = 305;
const BROTH_RY = 128;
ellipse(BROTH_CX, BROTH_CY, BROTH_RX, BROTH_RY, 198, 122, 40);
ellipse(BROTH_CX, BROTH_CY, BROTH_RX - 14, BROTH_RY - 12, 216, 140, 52);
// Glossy highlight on the broth.
ellipse(BROTH_CX - 130, BROTH_CY - 52, 150, 34, 244, 190, 96, 0.55);
ellipse(BROTH_CX + 120, BROTH_CY + 40, 110, 24, 232, 168, 80, 0.35);

// ---- noodles: wavy golden strands across the broth -------------------------
const inBroth = (x, y) => {
  const dx = (x - BROTH_CX) / (BROTH_RX - 18);
  const dy = (y - BROTH_CY) / (BROTH_RY - 16);
  return dx * dx + dy * dy <= 1;
};
const noodleCols = [
  [245, 197, 66],
  [232, 176, 52],
  [250, 214, 96],
];
for (let n = 0; n < 16; n++) {
  const y0 = BROTH_CY - 95 + n * 12 + rand() * 6;
  const len = 430 + rand() * 90;
  const x0 = BROTH_CX - len / 2 + rand() * 30;
  const c = noodleCols[n % noodleCols.length];
  // Draw in short segments so strands stay inside the broth ellipse.
  const steps = 80;
  let px = x0;
  let py = y0 + 9 * Math.sin(n * 1.3);
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const x = x0 + len * t;
    const y = y0 + 9 * Math.sin(t * Math.PI * 4 + n * 1.3);
    if (inBroth(x, y) && inBroth(px, py)) {
      thickLine(px, py, x, y, 9, c[0], c[1], c[2], 0.95);
    }
    px = x;
    py = y;
  }
}

// ---- halved soft egg ---------------------------------------------------------
const EX = 668;
const EY = 505;
ellipse(EX, EY, 78, 60, 253, 246, 227); // egg white
ellipse(EX, EY, 66, 50, 247, 236, 205, 0.9);
disc(EX, EY + 2, 36, 240, 140, 30); // orange yolk
disc(EX - 10, EY - 8, 14, 252, 176, 66, 0.9); // yolk shine

// ---- green onion rings -------------------------------------------------------
const onionSpots = [
  [330, 500], [400, 585], [470, 610], [560, 600], [620, 560],
  [740, 560], [420, 505], [540, 500], [600, 630], [360, 560],
];
for (const [ox, oy] of onionSpots) {
  disc(ox, oy, 13, 76, 175, 80);
  disc(ox, oy, 7, 46, 125, 52);
  disc(ox, oy, 3, 140, 210, 110, 0.8);
}
// A few red chilli flecks for appetite.
for (const [cx, cy] of [[480, 545], [700, 600], [380, 540]]) {
  disc(cx, cy, 6, 200, 60, 30);
}

// ---- chopsticks resting on the bowl rim --------------------------------------
thickLine(300, 330, 780, 430, 20, 139, 90, 43);
thickLine(300, 330, 780, 430, 12, 165, 110, 55, 0.9);
thickLine(320, 368, 800, 468, 20, 122, 76, 36);
thickLine(320, 368, 800, 468, 12, 150, 98, 48, 0.9);
// Chopstick tips.
disc(782, 431, 9, 165, 110, 55);
disc(802, 469, 9, 150, 98, 48);

// ---- soft vignette -----------------------------------------------------------
for (let y = 0; y < H; y += 2) {
  for (let x = 0; x < W; x += 2) {
    const dx = (x - 512) / 512;
    const dy = (y - 512) / 512;
    const d = dx * dx + dy * dy;
    if (d > 0.75) blend(x, y, 8, 4, 2, Math.min(0.35, (d - 0.75) * 0.9));
  }
}

// ---- PNG encode (IHDR / IDAT / IEND, CRC32) ---------------------------------
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0; // filter: none
  Buffer.from(buf.buffer, y * W * 4, W * 4).copy(raw, y * (1 + W * 4) + 1);
}
const idat = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, png);
console.log(`wrote ${OUT_FILE} (${png.length} bytes, ${W}x${H})`);
