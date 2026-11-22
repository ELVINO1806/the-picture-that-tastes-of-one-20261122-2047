// The picture that tastes of one ingredient — a steaming bowl of ramen.
// Draws a 1024x1024 PNG with the Node standard library only and writes it
// to /output/entry.png. Fully deterministic: fixed seed, no clock, no network.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const img = new Uint8Array(W * H * 4);

// --- tiny seeded PRNG (mulberry32) ---------------------------------------
let seed = 20261123;
function rnd(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// --- pixel helpers ---------------------------------------------------------
function setPx(x: number, y: number, r: number, g: number, b: number, a = 1): void {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const i = (yi * W + xi) * 4;
  if (a >= 1) {
    img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = 255;
  } else {
    img[i] = Math.round(img[i] * (1 - a) + r * a);
    img[i + 1] = Math.round(img[i + 1] * (1 - a) + g * a);
    img[i + 2] = Math.round(img[i + 2] * (1 - a) + b * a);
    img[i + 3] = 255;
  }
}

function fillCircle(cx: number, cy: number, r: number, col: [number, number, number], a = 1): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(x, y, col[0], col[1], col[2], a);
    }
  }
}

function fillEllipse(cx: number, cy: number, rx: number, ry: number, col: [number, number, number], a = 1): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(x, y, col[0], col[1], col[2], a);
    }
  }
}

// Thick line segment, used for chopsticks and noodle strokes.
function thickLine(x0: number, y0: number, x1: number, y1: number, w: number, col: [number, number, number], a = 1): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const steps = Math.ceil(len);
  const nx = -dy / len;
  const ny = dx / len;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const bx = x0 + dx * t;
    const by = y0 + dy * t;
    for (let o = -w / 2; o <= w / 2; o += 0.8) {
      setPx(bx + nx * o, by + ny * o, col[0], col[1], col[2], a);
    }
  }
}

// Wavy noodle: a sine curve drawn as a chain of thick dots.
function noodle(yBase: number, amp: number, period: number, phase: number, col: [number, number, number], thick: number): void {
  for (let x = 200; x <= 824; x += 1) {
    const y = yBase + Math.sin((x / period) * Math.PI * 2 + phase) * amp;
    // keep the noodle inside the broth ellipse
    const dx = (x - 512) / 330;
    const dy = (y - 560) / 185;
    if (dx * dx + dy * dy > 1) continue;
    for (let o = -thick / 2; o <= thick / 2; o += 1) {
      setPx(x, y + o, col[0], col[1], col[2]);
    }
  }
}

// Steam wisp: a rising sine column of soft white dots.
function steam(cx: number, baseY: number, height: number, amp: number, phase: number): void {
  for (let y = baseY; y >= baseY - height; y -= 2) {
    const prog = (baseY - y) / height; // 0 at bottom, 1 at top
    const x = cx + Math.sin(prog * Math.PI * 2.2 + phase) * amp * (0.4 + prog);
    const alpha = 0.48 * (1 - prog) + 0.06;
    for (let o = -12; o <= 12; o++) {
      const fall = 1 - Math.abs(o) / 13;
      setPx(x + o, y, 245, 240, 230, alpha * fall);
    }
  }
}

// --- 1. dark warm background, vertical gradient ---------------------------
for (let y = 0; y < H; y++) {
  const t = y / H;
  const r = Math.round(26 + 34 * t);
  const g = Math.round(14 + 18 * t);
  const b = Math.round(9 + 10 * t);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = 255;
  }
}
// warm glow behind the bowl
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = (x - 512) / 620;
    const dy = (y - 540) / 620;
    const d = dx * dx + dy * dy;
    if (d < 1) {
      const glow = (1 - d) * 0.35;
      const i = (y * W + x) * 4;
      img[i] = Math.min(255, img[i] + Math.round(90 * glow));
      img[i + 1] = Math.min(255, img[i + 1] + Math.round(48 * glow));
      img[i + 2] = Math.min(255, img[i + 2] + Math.round(16 * glow));
    }
  }
}
// table surface at the bottom
for (let y = 830; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    img[i] = Math.round(img[i] * 0.75 + 58 * 0.25);
    img[i + 1] = Math.round(img[i + 1] * 0.75 + 34 * 0.25);
    img[i + 2] = Math.round(img[i + 2] * 0.75 + 18 * 0.25);
  }
}

// --- 2. bowl: deep red ceramic, big and central ---------------------------
fillCircle(512, 560, 392, [122, 22, 18]);            // outer body
fillCircle(512, 556, 380, [150, 30, 22]);            // main ceramic
fillEllipse(512, 560, 352, 268, [168, 40, 26]);      // inner wall shading
// foot ring
fillEllipse(512, 900, 150, 34, [96, 16, 14]);
fillEllipse(512, 894, 138, 28, [140, 26, 20]);

// --- 3. rich amber broth ----------------------------------------------------
fillEllipse(512, 560, 330, 196, [176, 96, 18]);
fillEllipse(512, 552, 318, 184, [198, 118, 26]);
fillEllipse(512, 545, 300, 168, [214, 138, 36]);
// glossy highlight on the broth
fillEllipse(392, 486, 150, 52, [240, 176, 72], 0.55);
fillEllipse(380, 478, 80, 26, [250, 205, 110], 0.5);

// --- 4. wavy noodles across the broth ---------------------------------------
const noodleCols: [number, number, number][] = [
  [242, 206, 106],
  [236, 194, 88],
  [248, 216, 128],
  [230, 184, 78],
];
for (let n = 0; n < 9; n++) {
  const yBase = 470 + n * 22 + rnd() * 6;
  noodle(yBase, 10 + rnd() * 8, 120 + rnd() * 60, rnd() * 6.28, noodleCols[n % 4], 7);
}
// a few noodle strands lifted above the broth surface
for (let n = 0; n < 3; n++) {
  const yBase = 452 + n * 14;
  noodle(yBase, 8, 100, 1.2 + n, [250, 220, 140], 6);
}

// --- 5. halved soft egg, left side ------------------------------------------
fillEllipse(392, 528, 82, 58, [252, 244, 226]);      // egg white
fillEllipse(392, 528, 74, 51, [246, 236, 214]);
fillCircle(392, 530, 34, [232, 122, 20]);            // yolk
fillCircle(392, 530, 27, [248, 148, 32]);
fillCircle(382, 520, 10, [255, 190, 90]);            // yolk highlight

// --- 6. green onion rings ----------------------------------------------------
const onions: [number, number, number][] = [
  [600, 470, 17], [652, 512, 14], [560, 640, 15], [640, 600, 16],
  [700, 556, 13], [512, 668, 14], [470, 620, 12], [724, 470, 12],
];
for (const [ox, oy, orr] of onions) {
  fillCircle(ox, oy, orr, [46, 130, 52]);
  fillCircle(ox, oy, orr - 5, [120, 196, 72]);
  fillCircle(ox, oy, orr - 9, [30, 96, 40]);
}
// a couple of chive strips
thickLine(610, 660, 668, 640, 7, [52, 140, 58]);
thickLine(560, 480, 606, 500, 7, [52, 140, 58]);

// --- 7. nori sheet, right side ----------------------------------------------
for (let y = 470; y < 600; y++) {
  for (let x = 716; x < 800; x++) {
    const dx = (x - 512) / 330;
    const dy = (y - 560) / 185;
    if (dx * dx + dy * dy > 1) continue;
    setPx(x, y, 22, 46, 30);
  }
}
thickLine(716, 470, 716, 600, 3, [40, 78, 52]);

// --- 8. chopsticks resting on the rim ---------------------------------------
thickLine(600, 300, 950, 420, 13, [146, 96, 44]);
thickLine(612, 330, 962, 450, 13, [120, 76, 34]);
thickLine(600, 300, 950, 420, 4, [190, 138, 74]);
thickLine(612, 330, 962, 450, 4, [162, 112, 58]);

// --- 9. rim highlight + bowl shadow ------------------------------------------
for (let a = 0; a < Math.PI * 2; a += 0.004) {
  const x = 512 + Math.cos(a) * 386;
  const y = 556 + Math.sin(a) * 288;
  if (a > Math.PI * 1.05 && a < Math.PI * 1.95) {
    setPx(x, y, 210, 70, 48, 0.9);
  }
}
// soft shadow under the bowl
for (let x = 200; x < 824; x++) {
  for (let y = 920; y < 960; y++) {
    const dx = (x - 512) / 330;
    const dy = (y - 938) / 22;
    if (dx * dx + dy * dy <= 1) {
      const i = (y * W + x) * 4;
      img[i] = Math.round(img[i] * 0.55);
      img[i + 1] = Math.round(img[i + 1] * 0.55);
      img[i + 2] = Math.round(img[i + 2] * 0.55);
    }
  }
}

// --- 10. rising steam ---------------------------------------------------------
steam(430, 330, 210, 26, 0.4);
steam(512, 310, 250, 30, 2.1);
steam(596, 330, 220, 24, 4.0);
steam(470, 350, 150, 18, 5.2);

// --- 11. gentle vignette ------------------------------------------------------
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = (x - 512) / 512;
    const dy = (y - 512) / 512;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0.82) {
      const f = Math.min(1, (d - 0.82) / 0.35) * 0.35;
      const i = (y * W + x) * 4;
      img[i] = Math.round(img[i] * (1 - f));
      img[i + 1] = Math.round(img[i + 1] * (1 - f));
      img[i + 2] = Math.round(img[i + 2] * (1 - f));
    }
  }
}

// --- PNG encoding (zlib deflate, filter 0) ------------------------------------
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter type 0
  raw.set(img.subarray(y * W * 4, (y + 1) * W * 4), y * (W * 4 + 1) + 1);
}
const idat = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.png", png);
console.log(`wrote /output/entry.png (${png.length} bytes, ${W}x${H})`);
