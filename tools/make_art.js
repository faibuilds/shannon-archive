#!/usr/bin/env node
// SHANNON art pipeline. Plain Node, no dependencies (zlib is built in).
//
//   node tools/make_art.js <input.png> <output.png> [options]
//     --maxside N     cap the long side at N pixels (default 900, never upscales)
//     --crop x,y,w,h  manual crop override (skips plan-view detection)
//     --report path   write per-row ink extremes as JSON for measurement
//
// Takes a scanned line drawing (multi-view sheet), crops to the plan view,
// and emits a transparent PNG where line ink is #aeb6bd and the background
// is fully transparent. Anti-aliasing is preserved by mapping the scan's
// luminance to alpha instead of hard-thresholding the output.
// Prints a JSON summary with the measured span extremes (leftmost and
// rightmost ink pixels) for dimension-line overlays.

const fs = require("fs");
const zlib = require("zlib");

// ---------------------------------------------------------------------- CRC
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// --dropgreen / --dropblue / --dropred: treat color-dominant pixels as
// background. Source sheets and educational graphics print callouts in
// color over grey geometry; these drop the annotations at decode time.
let DROP_GREEN = false, DROP_BLUE = false, DROP_RED = false;

// -------------------------------------------------------------- PNG decode
function decodePNG(buf) {
  if (!buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("not a PNG");
  }
  let pos = 8, width, height, bitDepth, colorType, interlace, palette = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error("only 8-bit PNGs supported, got depth " + bitDepth);
  if (interlace !== 0) throw new Error("interlaced PNGs not supported");
  const CHANNELS = { 0: 1, 2: 3, 3: 1, 6: 4 };
  const ch = CHANNELS[colorType];
  if (!ch) throw new Error("unsupported color type " + colorType);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const px = Buffer.alloc(width * height * ch);
  let rp = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = raw.slice(rp, rp + stride); rp += stride;
    const out = px.slice(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? out[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = row[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 0xff;
    }
    prev = out;
  }

  // Collapse to a luminance map (0 = black ink, 255 = white background).
  const lum = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    let r, g, b;
    if (colorType === 3) {
      const pi = px[i] * 3; r = palette[pi]; g = palette[pi + 1]; b = palette[pi + 2];
    } else if (colorType === 0) {
      r = g = b = px[i];
    } else {
      const o = i * ch; r = px[o]; g = px[o + 1]; b = px[o + 2];
      if (ch === 4) { const a = px[o + 3] / 255; r = 255 + (r - 255) * a; g = 255 + (g - 255) * a; b = 255 + (b - 255) * a; }
    }
    if (DROP_GREEN && g > 80 && g > r * 1.3 && g > b * 1.3) { lum[i] = 255; continue; }
    if (DROP_BLUE && b > 80 && b > r * 1.3 && b > g * 1.3) { lum[i] = 255; continue; }
    if (DROP_RED && r > 80 && r > g * 1.3 && r > b * 1.3) { lum[i] = 255; continue; }
    lum[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return { width, height, lum };
}

// -------------------------------------------------------------- PNG encode
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.slice(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ----------------------------------------------------- plan view detection
const INK = 160; // luminance below this counts as line ink

// Label 8-connected ink components; return per-pixel labels, sizes, bboxes.
function components(lum, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  const boxes = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (lum[i] >= INK || label[i] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    const bb = { x0: w, y0: h, x1: -1, y1: -1 };
    stack.push(i); label[i] = id;
    while (stack.length) {
      const p = stack.pop(); size++;
      const x = p % w, y = (p / w) | 0;
      if (x < bb.x0) bb.x0 = x; if (x > bb.x1) bb.x1 = x;
      if (y < bb.y0) bb.y0 = y; if (y > bb.y1) bb.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = ny * w + nx;
        if (lum[np] < INK && label[np] === -1) { label[np] = id; stack.push(np); }
      }
    }
    sizes.push(size);
    boxes.push(bb);
  }
  return { label, sizes, boxes };
}

// The plan view is the largest ink component plus everything within reach
// of it (dashed lines are separate components a few pixels away). Absorb
// transitively with a BFS of radius r until stable. A neighboring view's
// protruding edge (a front view's wing line, a side view's nose) can sit
// within r of the plan view, so a component is only absorbed if its own
// bbox stays inside the largest component's bbox grown by `keep` px;
// other views extend far beyond that and are rejected.
function planViewBox(lum, w, h, r, keep) {
  const { label, sizes, boxes } = components(lum, w, h);
  let largest = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[largest]) largest = i;
  const home = boxes[largest];
  const fits = (bb) =>
    bb.x0 >= home.x0 - keep && bb.x1 <= home.x1 + keep &&
    bb.y0 >= home.y0 - keep && bb.y1 <= home.y1 + keep;
  const inSet = new Uint8Array(sizes.length);
  inSet[largest] = 1;
  let changed = true;
  while (changed) {
    changed = false;
    const dist = new Int16Array(w * h).fill(-1);
    const q = [];
    for (let i = 0; i < w * h; i++) if (label[i] >= 0 && inSet[label[i]]) { dist[i] = 0; q.push(i); }
    for (let qi = 0; qi < q.length; qi++) {
      const p = q[qi];
      if (dist[p] >= r) continue;
      const x = p % w, y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = ny * w + nx;
        if (dist[np] !== -1) continue;
        dist[np] = dist[p] + 1;
        q.push(np);
        const l = label[np];
        if (l >= 0 && !inSet[l] && fits(boxes[l])) { inSet[l] = 1; changed = true; }
      }
    }
  }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < w * h; i++) {
    if (label[i] >= 0 && inSet[label[i]]) {
      const x = i % w, y = (i / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }

  // Foreign views can protrude into this rectangle, so the caller must not
  // render the box blindly. Build a pixel mask: absorbed ink dilated by 2px
  // so the anti-aliased halo around each line survives.
  const mask = new Uint8Array(w * h);
  const dq = [];
  const dd = new Int16Array(w * h).fill(-1);
  for (let i = 0; i < w * h; i++) if (label[i] >= 0 && inSet[label[i]]) { mask[i] = 1; dd[i] = 0; dq.push(i); }
  for (let qi = 0; qi < dq.length; qi++) {
    const p = dq[qi];
    if (dd[p] >= 2) continue;
    const x = p % w, y = (p / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const np = ny * w + nx;
      if (dd[np] !== -1) continue;
      dd[np] = dd[p] + 1; mask[np] = 1; dq.push(np);
    }
  }
  return { x0, y0, x1, y1, mask, label, inSet, largest };
}

// ------------------------------------------------------------------- main
const args = process.argv.slice(2);
const BOOL_FLAGS = new Set(["--dropgreen", "--dropblue", "--dropred"]);
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) { if (!BOOL_FLAGS.has(args[i])) i++; } // skip the option's value
  else files.push(args[i]);
}
if (files.length !== 2) {
  console.error("usage: node tools/make_art.js <input.png> <output.png> [--maxside N] [--crop x,y,w,h] [--report path]");
  process.exit(2);
}
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const MAXSIDE = Number(opt("maxside", 900));
const PAD = 8;
DROP_GREEN = args.includes("--dropgreen");
DROP_BLUE = args.includes("--dropblue");
DROP_RED = args.includes("--dropred");

const img = decodePNG(fs.readFileSync(files[0]));
let { width: w, height: h, lum } = img;

// --crop x,y,w,h pre-crops the sheet (original coords); the plan view is
// then auto-detected within it, so masking, classification, and erase
// rects all behave identically to the uncropped path. Pixels not
// belonging to the plan view's components are blanked to white so foreign
// views protruding into the rectangle do not print or skew measurements.
let originX = 0, originY = 0;
const cropArg = opt("crop", null);
if (cropArg) {
  const [x, y, cw2, ch2] = cropArg.split(",").map(Number);
  const nl = new Uint8Array(cw2 * ch2).fill(255);
  for (let yy = 0; yy < ch2; yy++) {
    for (let xx = 0; xx < cw2; xx++) {
      const sx = x + xx, sy = y + yy;
      if (sx >= 0 && sy >= 0 && sx < w && sy < h) nl[yy * cw2 + xx] = lum[sy * w + sx];
    }
  }
  lum = nl; w = cw2; h = ch2; originX = x; originY = y;
}
const box = planViewBox(lum, w, h, Number(opt("radius", 12)), Number(opt("keep", 25)));
const cx0 = Math.max(0, box.x0 - PAD), cy0 = Math.max(0, box.y0 - PAD);
const cx1 = Math.min(w - 1, box.x1 + PAD), cy1 = Math.min(h - 1, box.y1 + PAD);
const cw = cx1 - cx0 + 1, chh = cy1 - cy0 + 1;
const clum = new Uint8Array(cw * chh);
const clabel = new Int32Array(cw * chh).fill(-1);
for (let y = 0; y < chh; y++) {
  for (let x = 0; x < cw; x++) {
    const sp = (cy0 + y) * w + (cx0 + x);
    const masked = box.mask && !box.mask[sp];
    clum[y * cw + x] = masked ? 255 : lum[sp];
    if (!masked && box.label) clabel[y * cw + x] = box.label[sp];
  }
}

// --erasedetached x,y,w,h (repeatable, source coords): blank everything in
// the rect except the main airframe component and its 3px anti-alias halo.
// Used to drop a sheet's projection or alignment dash chains that the view
// isolation truncated mid-run; the airframe is immune by construction.
const eraseRects = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--erasedetached") {
    const [rx, ry, rw, rh] = args[i + 1].split(",").map(Number);
    eraseRects.push([rx - originX, ry - originY, rw, rh]); // original -> pre-crop coords
  }
}
if (eraseRects.length && box.largest !== undefined) {
  // Distance (capped at 3) from each crop pixel to the largest component.
  const dl = new Int16Array(cw * chh).fill(-1);
  const q = [];
  for (let i = 0; i < cw * chh; i++) if (clabel[i] === box.largest) { dl[i] = 0; q.push(i); }
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    if (dl[p] >= 3) continue;
    const x = p % cw, y = (p / cw) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cw || ny >= chh) continue;
      const np = ny * cw + nx;
      if (dl[np] === -1) { dl[np] = dl[p] + 1; q.push(np); }
    }
  }
  for (const [rx, ry, rw, rh] of eraseRects) {
    const x0 = Math.max(0, rx - cx0), y0 = Math.max(0, ry - cy0);
    const x1 = Math.min(cw - 1, rx + rw - cx0), y1 = Math.min(chh - 1, ry + rh - cy0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = y * cw + x;
      if (dl[p] === -1) { clum[p] = 255; clabel[p] = -1; }
    }
  }
}

// Scale down if the long side exceeds MAXSIDE (box filter for luminance,
// nearest neighbor for the component labels). Never upscale.
let ow = cw, oh = chh, olum = clum, olabel = clabel;
const long = Math.max(cw, chh);
if (long > MAXSIDE) {
  const s = MAXSIDE / long;
  ow = Math.round(cw * s); oh = Math.round(chh * s);
  olum = new Uint8Array(ow * oh);
  olabel = new Int32Array(ow * oh);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const sx0 = Math.floor(x / s), sx1 = Math.min(cw - 1, Math.ceil((x + 1) / s) - 1);
      const sy0 = Math.floor(y / s), sy1 = Math.min(chh - 1, Math.ceil((y + 1) / s) - 1);
      let sum = 0, n = 0;
      for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) { sum += clum[sy * cw + sx]; n++; }
      olum[y * ow + x] = Math.round(sum / n);
      olabel[y * ow + x] = clabel[Math.min(chh - 1, Math.round((y + 0.5) / s)) * cw + Math.min(cw - 1, Math.round((x + 0.5) / s))];
    }
  }
}

// ------------------------------------------------- SHANNON branding pass
// Match the house plate style (see the F-117 hand tracing):
//   silhouette outline  #aeb6bd  bright, the outermost ink
//   interior detail     #5d636a  dim
//   detached overlays   #10b981  green at 0.85 (a swing wing's swept
//                                position dashes, and similar), only when
//                                they sit outside the closed silhouette
//   enclosed airframe   #aeb6bd at 4% as a faint panel fill
// Alpha ramps from FLOOR (opaque core) to CEIL (transparent) so scanned
// anti-aliasing survives; a linear map would leave mid-grey scan lines
// half transparent and invisible on the dark page.
const FLOOR = Number(opt("floor", 128));
const CEIL = Number(opt("ceil", 245));
const isInk = (i) => olum[i] < INK;

// Region map: flood the outside background in from the borders. Scanned
// outlines carry small gaps that would let the flood leak into the
// airframe and misclassify interior detail, so the flood runs against the
// ink dilated by CLOSE px, which seals gaps up to ~2*CLOSE wide.
const CLOSE = 2;
const dilated = new Uint8Array(ow * oh);
{
  const q = [];
  const dist = new Int16Array(ow * oh).fill(-1);
  for (let i = 0; i < ow * oh; i++) if (isInk(i)) { dist[i] = 0; dilated[i] = 1; q.push(i); }
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    if (dist[p] >= CLOSE) continue;
    const x = p % ow, y = (p / ow) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ow || ny >= oh) continue;
      const np = ny * ow + nx;
      if (dist[np] !== -1) continue;
      dist[np] = dist[p] + 1; dilated[np] = 1; q.push(np);
    }
  }
}
const OUTSIDE = 1;
const region = new Uint8Array(ow * oh);
{
  const q = [];
  for (let x = 0; x < ow; x++) { q.push(x, (oh - 1) * ow + x); }
  for (let y = 0; y < oh; y++) { q.push(y * ow, y * ow + ow - 1); }
  for (const p of q) if (!dilated[p]) region[p] = OUTSIDE;
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    if (region[p] !== OUTSIDE) continue;
    const x = p % ow, y = (p / ow) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ow || ny >= oh) continue;
      const np = ny * ow + nx;
      if (!dilated[np] && region[np] === 0) { region[np] = OUTSIDE; q.push(np); }
    }
  }
}

// distOut: distance to the outside, capped at CLOSE+1. Ink within that
// band is silhouette; everything deeper is interior. -1 means far inside.
const distOut = new Int16Array(ow * oh).fill(-1);
{
  const q = [];
  for (let i = 0; i < ow * oh; i++) if (region[i] === OUTSIDE) { distOut[i] = 0; q.push(i); }
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    if (distOut[p] >= CLOSE + 1) continue;
    const x = p % ow, y = (p / ow) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ow || ny >= oh) continue;
      const np = ny * ow + nx;
      if (distOut[np] !== -1) continue;
      distOut[np] = distOut[p] + 1; q.push(np);
    }
  }
}

// A detached component goes green only if it reaches the outside band AND
// is dash-sized. Dashes are short segments; a detached stretch of outline
// (a scan break in a leading edge) is long and must stay silhouette grey.
const DASH_MAX = Number(opt("dashmax", 24)); // max bbox diagonal in px
const touchesOutside = new Set();
const satBox = new Map();
for (let i = 0; i < ow * oh; i++) {
  if (!isInk(i) || olabel[i] < 0) continue;
  const l = olabel[i];
  if (distOut[i] !== -1) touchesOutside.add(l);
  const x = i % ow, y = (i / ow) | 0;
  let bb = satBox.get(l);
  if (!bb) { bb = { x0: x, y0: y, x1: x, y1: y }; satBox.set(l, bb); }
  else {
    if (x < bb.x0) bb.x0 = x; if (x > bb.x1) bb.x1 = x;
    if (y < bb.y0) bb.y0 = y; if (y > bb.y1) bb.y1 = y;
  }
}
const dashSized = (l) => {
  const bb = satBox.get(l);
  return bb && Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0) <= DASH_MAX;
};

// Classify ink: 1 silhouette, 2 interior, 3 green overlay.
const cls = new Uint8Array(ow * oh);
for (let i = 0; i < ow * oh; i++) {
  if (!isInk(i)) continue;
  const l = olabel[i];
  if (box.largest !== undefined && l >= 0 && l !== box.largest && touchesOutside.has(l) && dashSized(l)) {
    cls[i] = 3;
    continue;
  }
  cls[i] = distOut[i] !== -1 ? 1 : 2;
}

// Halo pixels (partial alpha, not ink) borrow the class of the nearest ink
// within 3px so anti-aliased edges take the right color.
const haloCls = new Uint8Array(ow * oh);
{
  const q = [];
  const dist = new Int16Array(ow * oh).fill(-1);
  for (let i = 0; i < ow * oh; i++) if (isInk(i)) { dist[i] = 0; haloCls[i] = cls[i]; q.push(i); }
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    if (dist[p] >= 3) continue;
    const x = p % ow, y = (p / ow) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ow || ny >= oh) continue;
      const np = ny * ow + nx;
      if (dist[np] !== -1) continue;
      dist[np] = dist[p] + 1; haloCls[np] = haloCls[p]; q.push(np);
    }
  }
}

const COLORS = { 1: [174, 182, 189], 2: [93, 99, 106], 3: [16, 185, 129] };
const FILL_ALPHA = 10; // ~4% panel fill inside the silhouette
const rgba = Buffer.alloc(ow * oh * 4);
for (let i = 0; i < ow * oh; i++) {
  const l = olum[i];
  let a = l >= CEIL ? 0 : l <= FLOOR ? 255 : Math.round((255 * (CEIL - l)) / (CEIL - FLOOR));
  let c = COLORS[haloCls[i]] || COLORS[1];
  if (haloCls[i] === 3) a = Math.round(a * 0.85);
  if (a < FILL_ALPHA && !isInk(i) && region[i] !== OUTSIDE && distOut[i] === -1) { a = FILL_ALPHA; c = COLORS[1]; }
  rgba[i * 4] = c[0]; rgba[i * 4 + 1] = c[1]; rgba[i * 4 + 2] = c[2]; rgba[i * 4 + 3] = a;
}
fs.writeFileSync(files[1], encodePNG(ow, oh, rgba));

// Measure ink extremes per row (for dimension anchors) on the output image.
const rows = [];
let minX = ow, maxX = -1, minXRow = -1, maxXRow = -1;
for (let y = 0; y < oh; y++) {
  let lo = -1, hi = -1;
  for (let x = 0; x < ow; x++) {
    if (olum[y * ow + x] < INK) { if (lo === -1) lo = x; hi = x; }
  }
  if (lo !== -1) {
    rows.push([y, lo, hi]);
    if (lo < minX) { minX = lo; minXRow = y; }
    if (hi > maxX) { maxX = hi; maxXRow = y; }
  }
}
const reportPath = opt("report", null);
if (reportPath) fs.writeFileSync(reportPath, JSON.stringify({ rows }, null, 1));

console.log(JSON.stringify({
  input: files[0], output: files[1],
  sourceSize: [w, h], cropBox: [cx0, cy0, cw, chh], outputSize: [ow, oh],
  spanExtremes: { leftX: minX, leftAtRow: minXRow, rightX: maxX, rightAtRow: maxXRow },
}, null, 2));
