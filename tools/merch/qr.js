/* QR encoder, byte mode, error correction level H, versions 1 to 10.
 *
 * Written here rather than pulled from npm because this repo has no
 * dependencies and a poster is a physical object: a code that fails to scan
 * is a defect that reaches a customer's wall. Level H is chosen for print,
 * where it survives ink spread, paper texture and a scuffed corner.
 *
 * Returns a matrix of 0/1 modules. Drawing is somebody else's job.
 */

/* ---- GF(256), primitive polynomial 0x11D, the one QR specifies ---- */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i;
    x <<= 1; if (x & 0x100) x ^= 0x11D;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

/* Generator polynomial for n error correction codewords. */
function genPoly(n) {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const q = [1, EXP[i]], r = new Array(p.length + 1).fill(0);
    for (let a = 0; a < p.length; a++)
      for (let b = 0; b < 2; b++) r[a + b] ^= mul(p[a], q[b]);
    p = r;
  }
  return p;
}

function ecc(data, n) {
  const g = genPoly(n), res = new Array(n).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift(); res.push(0);
    for (let i = 0; i < n; i++) res[i] ^= mul(g[i + 1], factor);
  }
  return res;
}

/* ---- Version tables, level H only.
   [ec codewords per block, [blocks, data codewords per block] ...]
   Each row is checked by TOTALS below, which the module verifies on load. ---- */
const H = {
  1:  [17, [[1, 9]]],
  2:  [28, [[1, 16]]],
  3:  [22, [[2, 13]]],
  4:  [16, [[4, 9]]],
  5:  [22, [[2, 11], [2, 12]]],
  6:  [28, [[4, 15]]],
  7:  [26, [[4, 13], [1, 14]]],
  8:  [26, [[4, 14], [2, 15]]],
  9:  [24, [[4, 12], [4, 13]]],
  10: [28, [[6, 15], [2, 16]]],
};
const TOTALS = { 1:26, 2:44, 3:70, 4:100, 5:134, 6:172, 7:196, 8:242, 9:292, 10:346 };
for (const v of Object.keys(H)) {
  const [ecn, groups] = H[v];
  const total = groups.reduce((s, [n, d]) => s + n * (d + ecn), 0);
  if (total !== TOTALS[v]) throw new Error("QR table wrong at version " + v + ": " + total + " vs " + TOTALS[v]);
}

const ALIGN = {
  1: [], 2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30],
  6: [6,34], 7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50],
};

const dataCodewords = v => H[v][1].reduce((s, [n, d]) => s + n * d, 0);

/* ---- bit stream ---- */
class Bits {
  constructor() { this.b = []; }
  push(val, len) { for (let i = len - 1; i >= 0; i--) this.b.push((val >> i) & 1); }
  get length() { return this.b.length; }
  bytes() {
    while (this.b.length % 8) this.b.push(0);
    const out = [];
    for (let i = 0; i < this.b.length; i += 8) {
      let x = 0;
      for (let j = 0; j < 8; j++) x = (x << 1) | this.b[i + j];
      out.push(x);
    }
    return out;
  }
}

/* ---- BCH for format and version information ---- */
function bch15(fmt) {
  let d = fmt << 10;
  for (let i = 14; i >= 10; i--) if ((d >> i) & 1) d ^= 0x537 << (i - 10);
  return ((fmt << 10) | d) ^ 0x5412;
}
function bch18(ver) {
  let d = ver << 12;
  for (let i = 17; i >= 12; i--) if ((d >> i) & 1) d ^= 0x1F25 << (i - 12);
  return (ver << 12) | d;
}

/* ---- the encoder ---- */
function encode(text) {
  const data = Array.from(Buffer.from(text, "utf8"));

  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const countBits = v < 10 ? 8 : 16;
    if (4 + countBits + data.length * 8 <= dataCodewords(v) * 8) { version = v; break; }
  }
  if (!version) throw new Error("does not fit in version 10 at level H: " + data.length + " bytes");

  const size = 17 + version * 4;
  const [ecn, groups] = H[version];
  const cap = dataCodewords(version);

  const bits = new Bits();
  bits.push(0b0100, 4);                                  /* byte mode */
  bits.push(data.length, version < 10 ? 8 : 16);
  for (const d of data) bits.push(d, 8);
  for (let i = 0; i < 4 && bits.length < cap * 8; i++) bits.b.push(0);   /* terminator */
  let bytes = bits.bytes();
  const PAD = [0xEC, 0x11];
  for (let i = 0; bytes.length < cap; i++) bytes.push(PAD[i % 2]);

  /* split into blocks, compute ecc, interleave */
  const dBlocks = [], eBlocks = [];
  let at = 0;
  for (const [count, len] of groups) {
    for (let i = 0; i < count; i++) {
      const chunk = bytes.slice(at, at + len); at += len;
      dBlocks.push(chunk); eBlocks.push(ecc(chunk, ecn));
    }
  }
  const stream = [];
  const maxD = Math.max(...dBlocks.map(b => b.length));
  for (let i = 0; i < maxD; i++) for (const b of dBlocks) if (i < b.length) stream.push(b[i]);
  for (let i = 0; i < ecn; i++) for (const b of eBlocks) stream.push(b[i]);

  /* ---- matrix ---- */
  const m = Array.from({ length: size }, () => new Array(size).fill(null));
  const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < size && c < size) m[r][c] = v; };

  const finder = (r, c) => {
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                 (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                 (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      set(r + i, c + j, on ? 1 : 0);
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {                    /* timing */
    const v = i % 2 === 0 ? 1 : 0;
    m[6][i] = v; m[i][6] = v;
  }

  const centers = ALIGN[version];
  for (const r of centers) for (const c of centers) {
    if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++)
      set(r + i, c + j, (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) ? 1 : 0);
  }

  m[size - 8][8] = 1;                                     /* dark module */

  /* reserve format and version areas so data placement skips them */
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) if (m[i][j] !== null) reserved[i][j] = true;
  for (let i = 0; i < 9; i++) { reserved[8][i] = true; reserved[i][8] = true; }
  for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  if (version >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    reserved[size - 11 + j][i] = true; reserved[i][size - 11 + j] = true;
  }

  /* data placement, upward then downward, two columns at a time, skipping col 6 */
  let bi = 0, up = true;
  const bitAt = k => (k >> 3) < stream.length ? (stream[k >> 3] >> (7 - (k & 7))) & 1 : 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let n = 0; n < size; n++) {
      const row = up ? size - 1 - n : n;
      for (let k = 0; k < 2; k++) {
        const c = col - k;
        if (reserved[row][c]) continue;
        m[row][c] = bitAt(bi++);
      }
    }
    up = !up;
  }

  /* ---- masking ---- */
  const MASKS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
  ];

  function penalty(g) {
    let p = 0;
    /* rule 1: runs of five or more */
    for (let i = 0; i < size; i++) {
      for (const line of [g[i], g.map(r => r[i])]) {
        let run = 1;
        for (let j = 1; j < size; j++) {
          if (line[j] === line[j - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else run = 1;
        }
      }
    }
    /* rule 2: 2x2 blocks */
    for (let i = 0; i < size - 1; i++) for (let j = 0; j < size - 1; j++)
      if (g[i][j] === g[i][j+1] && g[i][j] === g[i+1][j] && g[i][j] === g[i+1][j+1]) p += 3;
    /* rule 3: finder-like patterns */
    const A = [1,0,1,1,1,0,1,0,0,0,0], B = [0,0,0,0,1,0,1,1,1,0,1];
    for (let i = 0; i < size; i++) for (let j = 0; j <= size - 11; j++) {
      const row = g[i].slice(j, j + 11), colv = [];
      for (let k = 0; k < 11; k++) colv.push(g[j + k][i]);
      for (const seq of [A, B]) {
        if (row.every((v, k) => v === seq[k])) p += 40;
        if (colv.every((v, k) => v === seq[k])) p += 40;
      }
    }
    /* rule 4: proportion of dark */
    let dark = 0;
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) dark += g[i][j];
    p += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10;
    return p;
  }

  let best = null, bestScore = Infinity, bestMask = 0;
  for (let mask = 0; mask < 8; mask++) {
    const g = m.map(r => r.slice());
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++)
      if (!reserved[i][j] && MASKS[mask](i, j)) g[i][j] ^= 1;

    /* Format information, level H is 0b10. The 15 bit word is written most
       significant bit first, walking away from the corner: bit 14 lands
       against the finder and bit 0 furthest from it. Writing it the other
       way round produces a symbol that looks perfect, decodes perfectly
       with a reader that shares the mistake, and cannot be read by any
       phone, which is how it survived here for as long as it did. The two
       copies are written from explicit coordinates rather than from
       arithmetic that has to bend around the timing column and the dark
       module. */
    const fmt = bch15((0b10 << 3) | mask);
    const bit = i => (fmt >> i) & 1;
    for (let i = 0; i <= 5; i++) g[8][i] = bit(14 - i);   /* copy 1, row 8 */
    g[8][7] = bit(8);
    g[8][8] = bit(7);
    g[7][8] = bit(6);
    for (let i = 0; i <= 5; i++) g[i][8] = bit(i);        /* copy 1, column 8 */
    for (let i = 0; i <= 6; i++) g[size - 1 - i][8] = bit(14 - i);   /* copy 2, column 8 */
    for (let i = 0; i <= 7; i++) g[8][size - 8 + i] = bit(7 - i);    /* copy 2, row 8 */
    g[size - 8][8] = 1;                                  /* dark module, restated */
    if (version >= 7) {
      const vi = bch18(version);
      for (let i = 0; i < 18; i++) {
        const bit = (vi >> i) & 1;
        g[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
        g[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
      }
    }
    const s = penalty(g);
    if (s < bestScore) { bestScore = s; best = g; bestMask = mask; }
  }

  return { size, version, mask: bestMask, modules: best, bytes: data.length };
}

module.exports = { encode };
