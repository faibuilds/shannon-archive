/* Read the QR back off a built poster.
 *
 * qr-verify.js proves the encoder can be decoded. This proves the thing that
 * actually gets printed: it takes the modules out of the poster's own SVG,
 * rebuilds the matrix from their coordinates, and decodes that. A correct
 * encoder drawn at the wrong pitch, shifted half a module, or clipped by the
 * branding is still an unscannable poster, and none of those show up until
 * somebody points a phone at a printed sheet.
 *
 * Also checks the quiet zone, because a code with no margin fails to scan
 * against a dark wall no matter how good the codewords are.
 *
 *   node tools/merch/poster-check.js                  every built poster
 *   node tools/merch/poster-check.js brooklyn-bridge  just one
 */
const fs = require("fs");
const path = require("path");
const { decode } = require("./qr-verify.js");

const DIR = path.join(__dirname, "..", "..", "merch", "posters");

/* the modules are the rects inside the one <g fill="#000000"> group */
function matrixFromSvg(svg) {
  const g = svg.match(/<g fill="#000000">([\s\S]*?)<\/g>/);
  if (!g) throw new Error("no module group in the svg");
  const rects = [...g[1].matchAll(/<rect x="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"\/>/g)]
    .map(m => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));
  if (!rects.length) throw new Error("module group holds no rects");

  const xs = [...new Set(rects.map(r => +r.x.toFixed(2)))].sort((a, b) => a - b);
  const ys = [...new Set(rects.map(r => +r.y.toFixed(2)))].sort((a, b) => a - b);
  /* pitch is the smallest gap between neighbouring module positions */
  const gaps = [];
  for (let i = 1; i < xs.length; i++) gaps.push(xs[i] - xs[i - 1]);
  for (let i = 1; i < ys.length; i++) gaps.push(ys[i] - ys[i - 1]);
  const pitch = Math.min(...gaps);
  if (!(pitch > 0)) throw new Error("could not work out the module pitch");

  const x0 = xs[0], y0 = ys[0];
  const col = r => Math.round((r.x - x0) / pitch);
  const row = r => Math.round((r.y - y0) / pitch);
  const size = Math.max(...rects.map(col), ...rects.map(row)) + 1;

  /* every rect must land on the lattice, or the drawing is drifting */
  let worst = 0;
  for (const r of rects) {
    worst = Math.max(worst, Math.abs((r.x - x0) / pitch - col(r)), Math.abs((r.y - y0) / pitch - row(r)));
  }
  if (worst > 0.05) throw new Error("modules are off the lattice by up to " + worst.toFixed(3) + " of a module");

  const m = Array.from({ length: size }, () => new Uint8Array(size));
  for (const r of rects) m[row(r)][col(r)] = 1;
  return { m, size, pitch, x0, y0, moduleW: rects[0].w, count: rects.length };
}

function quietZone(svg, q) {
  /* the white panel the code sits on */
  const panels = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#ffffff"\/>/g)]
    .map(m => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));
  const codeR = q.x0 + q.size * q.pitch, codeB = q.y0 + q.size * q.pitch;
  const panel = panels.find(p => p.x <= q.x0 && p.y <= q.y0 && p.x + p.w >= codeR && p.y + p.h >= codeB);
  if (!panel) throw new Error("no white panel encloses the code");
  const left = (q.x0 - panel.x) / q.pitch, top = (q.y0 - panel.y) / q.pitch;
  const right = (panel.x + panel.w - codeR) / q.pitch, bottom = (panel.y + panel.h - codeB) / q.pitch;
  return { left, top, right, bottom, min: Math.min(left, top, right, bottom) };
}

const only = process.argv.slice(2);
let files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith(".svg")) : [];
if (only.length) files = files.filter(f => only.some(o => f.startsWith(o)));
if (!files.length) { console.error("no built posters to check. Run make-posters.js first."); process.exit(1); }

let bad = 0;
for (const f of files.sort()) {
  const svg = fs.readFileSync(path.join(DIR, f), "utf8");
  try {
    const q = matrixFromSvg(svg);
    const got = decode(q.m);
    const zone = quietZone(svg, q);
    /* The sheet states its own target. Deriving it from the filename broke
       the moment one plate carried two posters, because a variant suffix is
       not part of a plate id. */
    const stated = svg.match(/<!-- qr-target (\S+) -->/);
    const want = stated ? stated[1]
      : "https://shannon.engineeringcommunity.net/#" + f.replace(/-\d+x\d+\.svg$/, "");
    const okUrl = got.text === want;
    const okZone = zone.min >= 4 - 1e-6;
    if (!okUrl) { bad++; console.log("FAIL  " + f + "\n      decoded " + JSON.stringify(got.text) + "\n      wanted  " + JSON.stringify(want)); continue; }
    if (!okZone) { bad++; console.log("FAIL  " + f + "  quiet zone is only " + zone.min.toFixed(2) + " modules, needs 4"); continue; }
    console.log("ok    " + f.padEnd(34)
      + "v" + got.version + " mask " + got.mask + "  " + q.size + "x" + q.size
      + "  " + q.count + " modules  quiet " + zone.min.toFixed(1)
      + "  " + got.text);
  } catch (e) {
    bad++;
    console.log("FAIL  " + f + "  " + e.message);
  }
}
console.log("");
console.log(bad ? bad + " poster(s) FAILED" : files.length + " poster(s) decoded from their own artwork");
process.exit(bad ? 1 : 0);
