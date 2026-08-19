/* Line drawing to outlines.
 *
 * The plate art in /site/art is web resolution. On a poster or a shirt that
 * is not enough: the SR-71 three view is 469 pixels wide, which is about 80
 * DPI once it is big enough to wear, and Printful wants 150 at the very
 * least. Stretching the pixels does not add any, it only makes the softness
 * bigger.
 *
 * These drawings are line work, though: dark strokes on white paper, with
 * nothing but ink and paper in them. So instead of scaling the pixels, this
 * traces the boundary between ink and paper and writes it out as outlines.
 * The result is the same drawing at any size, sharp at 300 DPI or 3000,
 * and nothing inside the outline is invented: every vertex sits on an edge
 * that was already in the file.
 *
 *   node tools/art-trace.js <in.png> <out.svg> [threshold] [epsilon]
 *   then open http://localhost:4408/
 *
 * threshold is the luminance below which a pixel counts as ink, 0 to 255,
 * default 205. epsilon is how far a traced corner may move when the pixel
 * staircase is straightened, in source pixels, default 0.62. Raising it
 * makes a smaller file and a looser drawing.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const [, , SRC, OUT, T, E] = process.argv;
if (!SRC || !OUT) {
  console.error("usage: node tools/art-trace.js <in.png> <out.svg> [threshold] [epsilon]");
  process.exit(1);
}
if (!fs.existsSync(SRC)) { console.error("no such file: " + SRC); process.exit(1); }
const THRESHOLD = T === undefined ? 205 : +T;
const EPSILON = E === undefined ? 0.62 : +E;
const PORT = 4408;

/* ---------- tracing ----------
   Every boundary between an ink pixel and a paper pixel is one unit edge.
   Chained into loops and filled even-odd, they reproduce the drawing
   exactly, holes and all, before any smoothing. */
function loops(mask, w, h) {
  const ink = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : mask[y * w + x];
  /* key a lattice point, and keep the edges leaving it */
  const from = new Map();
  const add = (ax, ay, bx, by) => {
    const k = ax * 100000 + ay;
    if (!from.has(k)) from.set(k, []);
    from.get(k).push([bx, by]);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ink(x, y)) continue;
    if (!ink(x, y - 1)) add(x, y, x + 1, y);
    if (!ink(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!ink(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!ink(x - 1, y)) add(x, y + 1, x, y);
  }
  const out = [];
  for (const [k0] of from) {
    while (from.get(k0) && from.get(k0).length) {
      const loop = [];
      let cx = Math.floor(k0 / 100000), cy = k0 % 100000;
      let px = null, py = null;
      /* eslint no-constant-condition: off */
      while (true) {
        const k = cx * 100000 + cy;
        const outs = from.get(k);
        if (!outs || !outs.length) break;
        /* at a pixel corner two strands can meet. Take the sharpest left
           turn, which keeps touching shapes apart instead of welding them */
        let pick = 0;
        if (outs.length > 1 && px !== null) {
          const idx = (dx, dy) => (dx === 1 ? 0 : dy === 1 ? 1 : dx === -1 ? 2 : 3);
          const back = idx(px - cx, py - cy);
          let best = 9;
          outs.forEach((e, i) => {
            const t = (idx(e[0] - cx, e[1] - cy) - back + 4) % 4;
            if (t && t < best) { best = t; pick = i; }
          });
        }
        const [nx, ny] = outs.splice(pick, 1)[0];
        loop.push([cx, cy]);
        px = cx; py = cy; cx = nx; cy = ny;
        if (cx * 100000 + cy === k0) break;
      }
      if (loop.length > 3) out.push(loop);
    }
  }
  return out;
}

/* Douglas-Peucker wants two fixed ends, and a ring has none: handed a
   closed loop it measures every point against a zero length line, finds
   nothing far from it, and hands back the two ends. So the ring is cut at
   its furthest point first and simplified as two open halves. */
function simplifyRing(pts, eps) {
  if (pts.length < 5) return pts;
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > fd) { fd = d; far = i; }
  }
  const a = simplify(pts.slice(0, far + 1), eps);
  const b = simplify(pts.slice(far).concat([pts[0]]), eps);
  return a.concat(b.slice(1, -1));
}

function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let far = -1, fd = eps;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > fd) { fd = d; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function toSvg(mask, w, h) {
  const raw = loops(mask, w, h);
  let before = 0, after = 0;
  const paths = [];
  for (const l of raw) {
    before += l.length;
    const s = simplifyRing(l, EPSILON);
    if (s.length < 3) continue;
    after += s.length;
    paths.push("M" + s.map(p => p[0] + " " + p[1]).join("L") + "Z");
  }
  return { d: paths.join(""), rings: paths.length, before, after };
}

/* ---------- node serves, the browser reads the pixels ---------- */
const page = `<!doctype html><meta charset="utf-8"><title>trace</title>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.7 "IBM Plex Mono",monospace;padding:26px}
b{color:#10b981}u{color:#ef4444;text-decoration:none}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">TRACING ${path.basename(SRC)}</h3>
<div id="log"></div>
<script>
const log = document.getElementById("log");
const say = h => { const d = document.createElement("div"); d.innerHTML = h; log.appendChild(d); };
const img = new Image();
img.onload = async () => {
  const w = img.naturalWidth, h = img.naturalHeight;
  say("source " + w + "x" + h);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  /* paper first: a transparent source has to read as paper, not as ink */
  cx.fillStyle = "#ffffff"; cx.fillRect(0, 0, w, h);
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  let ink = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (l < ${THRESHOLD}) { mask[p] = 1; ink++; }
  }
  say("ink " + (100 * ink / (w * h)).toFixed(1) + "% of the sheet at threshold ${THRESHOLD}");
  const r = await fetch("/mask?w=" + w + "&h=" + h, { method: "POST", body: mask });
  say(r.ok ? "<b>" + (await r.text()) + "</b>" : "<u>node refused the mask</u>");
};
img.onerror = () => say("<u>could not decode the source</u>");
img.src = "/src.png";
</script>`;

let server;
server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/mask")) {
    const u = new URL(req.url, "http://x");
    const w = +u.searchParams.get("w"), h = +u.searchParams.get("h");
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const mask = Buffer.concat(chunks);
      if (mask.length !== w * h) {
        res.writeHead(400); res.end("mask is " + mask.length + ", expected " + w * h);
        return;
      }
      const t0 = Date.now();
      const { d, rings, before, after } = toSvg(mask, w, h);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<title>${path.basename(SRC)} traced</title>
<!-- traced from ${path.basename(SRC)} at threshold ${THRESHOLD}, epsilon ${EPSILON}.
     ${rings} outlines, ${after} points from ${before}. No line redrawn. -->
<path fill="currentColor" fill-rule="evenodd" d="${d}"/>
</svg>`;
      fs.writeFileSync(OUT, svg);
      const msg = "wrote " + path.basename(OUT) + "  " + rings + " outlines  " +
        after + " points from " + before + "  " + Math.round(svg.length / 1024) + "KB  " +
        (Date.now() - t0) + "ms";
      console.log("  " + msg);
      res.writeHead(200); res.end(msg);
      setTimeout(() => { server.close(); process.exit(0); }, 300);
    });
    return;
  }
  if (req.url === "/src.png") {
    res.writeHead(200, { "content-type": "image/png" });
    return res.end(fs.readFileSync(SRC));
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page);
}).listen(PORT, () => console.log("tracer on http://localhost:" + PORT + "/"));
