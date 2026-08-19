/* Read a QR back out, the long way round.
 *
 * A poster is a physical object. A code that fails to scan is a defect that
 * reaches a customer's wall, and there is no patch for a printed sheet. The
 * encoder in qr.js cannot be its own witness: a wrong mask, a wrong format
 * string or a misplaced codeword produces a matrix that looks perfectly like
 * a QR code and decodes to nothing.
 *
 * So this decodes. It reads the format bits out of the matrix and trusts them
 * rather than the encoder's own answer, rebuilds the mask from the spec's
 * formulas, walks the zigzag, undoes the block interleave and parses the byte
 * mode segment. Error correction is deliberately not used: the codewords are
 * required to be right on their own, because correction would paper over
 * exactly the bugs this is looking for.
 *
 * The only thing shared with the encoder is the version table, which is
 * printed data from the standard rather than logic.
 *
 *   node tools/merch/qr-verify.js                  self test
 *   node tools/merch/qr-verify.js "some text"      round trip one string
 */
const { encode } = require("./qr.js");

/* Level H block layout, from the standard. [ec per block, [blocks, data]...] */
const H = {
  1:[17,[[1,9]]], 2:[28,[[1,16]]], 3:[22,[[2,13]]], 4:[16,[[4,9]]],
  5:[22,[[2,11],[2,12]]], 6:[28,[[4,15]]], 7:[26,[[4,13],[1,14]]],
  8:[26,[[4,14],[2,15]]], 9:[24,[[4,12],[4,13]]], 10:[28,[[6,15],[2,16]]],
};
const ALIGN = {
  1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30],
  6:[6,34], 7:[6,22,38], 8:[6,24,42], 9:[6,26,46], 10:[6,28,50],
};
/* The mask formulas, straight from the spec. i is row, j is column. */
const MASKS = [
  (i,j) => (i + j) % 2 === 0,
  (i,j) => i % 2 === 0,
  (i,j) => j % 3 === 0,
  (i,j) => (i + j) % 3 === 0,
  (i,j) => (Math.floor(i/2) + Math.floor(j/3)) % 2 === 0,
  (i,j) => (i*j) % 2 + (i*j) % 3 === 0,
  (i,j) => ((i*j) % 2 + (i*j) % 3) % 2 === 0,
  (i,j) => ((i+j) % 2 + (i*j) % 3) % 2 === 0,
];

/* Which cells carry no data: finders, timing, alignment, format, version. */
function functionMap(version) {
  const size = version * 4 + 17;
  const f = Array.from({ length: size }, () => new Uint8Array(size));
  const block = (r, c, h, w) => {
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
      const rr = r + i, cc = c + j;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) f[rr][cc] = 1;
    }
  };
  /* finders plus their separators, and the format areas beside them */
  block(0, 0, 9, 9);
  block(0, size - 8, 9, 8);
  block(size - 8, 0, 8, 9);
  /* timing */
  for (let i = 0; i < size; i++) { f[6][i] = 1; f[i][6] = 1; }
  /* alignment, skipping the three that collide with the finders */
  const cs = ALIGN[version];
  for (const r of cs) for (const c of cs) {
    if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
    block(r - 2, c - 2, 5, 5);
  }
  /* version blocks */
  if (version >= 7) { block(0, size - 11, 6, 3); block(size - 11, 0, 3, 6); }
  return f;
}

const bch15 = v => {              /* format info generator, used to check */
  let d = v << 10;
  for (let i = 14; i >= 10; i--) if ((d >> i) & 1) d ^= 0x537 << (i - 10);
  return ((v << 10) | d) ^ 0x5412;
};

/* The 15 bit word runs most significant bit first, away from the corner.
   Both copies are read, and they have to agree: a symbol whose two copies
   disagree is one a phone may or may not read depending on which half it
   trusts, and that is not a thing to print. */
function readFormat(g) {
  const size = g.length;
  let a = 0, b = 0;
  /* copy 1: the ring around the top left finder */
  for (let i = 0; i <= 5; i++) a |= g[8][i] << (14 - i);
  a |= g[8][7] << 8;
  a |= g[8][8] << 7;
  a |= g[7][8] << 6;
  for (let i = 0; i <= 5; i++) a |= g[i][8] << i;
  /* copy 2: down the left edge and along the top right */
  for (let i = 0; i <= 6; i++) b |= g[size - 1 - i][8] << (14 - i);
  for (let i = 0; i <= 7; i++) b |= g[8][size - 8 + i] << (7 - i);
  if (a !== b) return { ecBits: null, mask: null, raw: a, disagree: b };
  /* find which of the 32 valid format strings this is */
  for (let ec = 0; ec < 4; ec++) for (let mask = 0; mask < 8; mask++)
    if (bch15((ec << 3) | mask) === a) return { ecBits: ec, mask, raw: a };
  return { ecBits: null, mask: null, raw: a };
}

function decode(g) {
  const size = g.length;
  const version = (size - 17) / 4;
  if (!Number.isInteger(version) || !H[version]) throw new Error("bad size " + size);
  const fmt = readFormat(g);
  if (fmt.mask === null) throw new Error("format bits do not match any valid format string");
  /* 0b10 is level H in the format encoding */
  if (fmt.ecBits !== 0b10) throw new Error("format says EC level bits " + fmt.ecBits.toString(2) + ", expected 10 for H");

  const fn = functionMap(version);
  const maskFn = MASKS[fmt.mask];
  /* zigzag: column pairs right to left, skipping the timing column */
  const bits = [];
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      const row = upward ? size - 1 - v : v;
      for (let k = 0; k < 2; k++) {
        const col = right - k;
        if (fn[row][col]) continue;
        bits.push(g[row][col] ^ (maskFn(row, col) ? 1 : 0));
      }
    }
    upward = !upward;
  }
  const codewords = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let b = 0;
    for (let k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
    codewords.push(b);
  }

  /* undo the interleave: data codewords first, block by block, then EC */
  const [ecn, groups] = H[version];
  const blocks = [];
  for (const [n, dlen] of groups) for (let i = 0; i < n; i++) blocks.push({ dlen, data: [] });
  const maxLen = Math.max(...blocks.map(b => b.dlen));
  let p = 0;
  for (let i = 0; i < maxLen; i++)
    for (const b of blocks) if (i < b.dlen) b.data.push(codewords[p++]);
  const data = [].concat(...blocks.map(b => b.data));

  /* byte mode segment */
  let bp = 0;
  const take = n => { let v = 0; for (let i = 0; i < n; i++) {
    const byte = data[(bp >> 3)], bit = (byte >> (7 - (bp & 7))) & 1; v = (v << 1) | bit; bp++;
  } return v; };
  const mode = take(4);
  if (mode !== 0b0100) throw new Error("mode is " + mode.toString(2) + ", expected 0100 (byte)");
  const len = take(version <= 9 ? 8 : 16);
  let out = "";
  for (let i = 0; i < len; i++) out += String.fromCharCode(take(8));
  return { text: out, version, mask: fmt.mask, length: len };
}

function roundTrip(text) {
  const q = encode(text);
  const got = decode(q.modules);
  const ok = got.text === text;
  return { ok, text, got: got.text, version: got.version,
           maskEncoded: q.mask, maskRead: got.mask, size: q.size };
}

module.exports = { decode, roundTrip };

if (require.main === module) {
  const arg = process.argv[2];
  const cases = arg ? [arg] : [
    "https://shannon.engineeringcommunity.net/#brooklyn-bridge",
    "https://shannon.engineeringcommunity.net/#float-glass-process",
    "https://shannon.engineeringcommunity.net/#whitworth-three-plate-method",
    "https://shannon.engineeringcommunity.net/#crucible-cast-steel",
    "https://shannon.engineeringcommunity.net/#air-canada-143-gimli",
    "A", "0123456789",
    "https://shannon.engineeringcommunity.net/#a-really-long-plate-id-that-pushes-the-version-up-and-up",
  ];
  let bad = 0;
  for (const c of cases) {
    let r;
    try { r = roundTrip(c); }
    catch (e) { console.log("FAIL  " + JSON.stringify(c.slice(0, 46)) + "  " + e.message); bad++; continue; }
    if (!r.ok) { bad++; console.log("FAIL  wanted " + JSON.stringify(c) + "\n      got    " + JSON.stringify(r.got)); }
    else console.log("ok    v" + String(r.version).padEnd(2) + " mask " + r.maskRead
      + (r.maskEncoded === r.maskRead ? "" : " (encoder said " + r.maskEncoded + ")")
      + "  " + r.size + "x" + r.size + "  " + JSON.stringify(c.slice(0, 50)));
  }
  console.log("");
  console.log(bad ? bad + " FAILED" : "all " + cases.length + " round trips decoded");
  process.exit(bad ? 1 : 0);
}
