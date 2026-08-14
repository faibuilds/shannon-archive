/* Decode the QR out of the printed pixels.
 *
 * poster-check.js reads the module rects out of the SVG, which proves the
 * geometry but not the file that goes to the printer. The PNG is a raster of
 * that SVG, and rasterising can shift, blur or swallow a module without
 * changing anything upstream. This samples the actual PNG: it finds the code
 * from the SVG's own coordinates, reads the centre pixel of every module,
 * rebuilds the matrix from what is really there, and decodes it.
 *
 * node serves, the browser samples, node decodes.
 *
 *   node tools/merch/png-check.js      then open http://localhost:4404/
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { decode } = require("./qr-verify.js");

const DIR = path.join(__dirname, "..", "..", "merch", "posters");
const PORT = 4404;

/* the QR geometry, straight out of the poster's own svg */
function geometry(svg) {
  const g = svg.match(/<g fill="#000000">([\s\S]*?)<\/g>/);
  if (!g) throw new Error("no module group");
  const rects = [...g[1].matchAll(/<rect x="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"/g)]
    .map(m => ({ x: +m[1], y: +m[2], w: +m[3] }));
  const xs = [...new Set(rects.map(r => +r.x.toFixed(2)))].sort((a, b) => a - b);
  const ys = [...new Set(rects.map(r => +r.y.toFixed(2)))].sort((a, b) => a - b);
  let pitch = Infinity;
  for (let i = 1; i < xs.length; i++) pitch = Math.min(pitch, xs[i] - xs[i - 1]);
  for (let i = 1; i < ys.length; i++) pitch = Math.min(pitch, ys[i] - ys[i - 1]);
  const x0 = xs[0], y0 = ys[0];
  const size = Math.max(
    ...rects.map(r => Math.round((r.x - x0) / pitch)),
    ...rects.map(r => Math.round((r.y - y0) / pitch))) + 1;
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return { x0, y0, pitch, size, vbW: +vb[1], vbH: +vb[2] };
}

const jobs = fs.readdirSync(DIR)
  .filter(f => f.endsWith(".svg"))
  .map(f => {
    const png = f.replace(/\.svg$/, ".png");
    if (!fs.existsSync(path.join(DIR, png))) return null;
    return { png, geom: geometry(fs.readFileSync(path.join(DIR, f), "utf8")),
             want: "https://shannon.engineeringcommunity.net/#" + f.replace(/-\d+x\d+\.svg$/, "") };
  })
  .filter(Boolean);

if (!jobs.length) { console.error("no rasterised posters. Run make-posters.js then rasterize.js."); process.exit(1); }

const page = `<!doctype html><meta charset="utf-8"><title>png check</title>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.8 "IBM Plex Mono",monospace;padding:24px}
b{color:#10b981}i{color:#5d636a;font-style:normal}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">SAMPLING ${jobs.length} POSTER PNG(S)</h3>
<div id="log"></div>
<script>
const JOBS = ${JSON.stringify(jobs)};
const log = document.getElementById("log");
const say = h => { log.innerHTML += "<div>" + h + "</div>"; };
(async () => {
  for (const j of JOBS) {
    const img = new Image();
    img.src = "/png/" + j.png;
    await img.decode();
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const x = cv.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    /* the svg user units and the png pixels may differ in scale */
    const k = img.naturalWidth / j.geom.vbW;
    const rows = [];
    let ambiguous = 0;
    for (let r = 0; r < j.geom.size; r++) {
      let line = "";
      for (let c = 0; c < j.geom.size; c++) {
        const px = Math.round((j.geom.x0 + (c + 0.5) * j.geom.pitch) * k);
        const py = Math.round((j.geom.y0 + (r + 0.5) * j.geom.pitch) * k);
        const d = x.getImageData(px, py, 1, 1).data;
        const lum = 0.2126*d[0] + 0.7152*d[1] + 0.0722*d[2];
        if (lum > 80 && lum < 175) ambiguous++;
        line += lum < 128 ? "1" : "0";
      }
      rows.push(line);
    }
    const res = await fetch("/decode/" + j.png, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, ambiguous, w: img.naturalWidth, h: img.naturalHeight }) });
    say(await res.text());
  }
  say("<b>done.</b>");
})();
</script>`;

let bad = 0;
http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/decode/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(8)));
    const job = jobs.find(j => j.png === name);
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      const { rows, ambiguous, w, h } = JSON.parse(body);
      const m = rows.map(r => Uint8Array.from(r, ch => +ch));
      let out;
      try {
        const got = decode(m);
        const ok = got.text === job.want;
        if (!ok) { bad++; out = "FAIL  " + name + "  decoded " + JSON.stringify(got.text); }
        else out = "ok    <b>" + name + "</b> " + w + "x" + h
          + "  v" + got.version + " mask " + got.mask
          + "  <i>" + ambiguous + " grey pixels</i>  " + got.text;
      } catch (e) { bad++; out = "FAIL  " + name + "  " + e.message; }
      console.log(out.replace(/<[^>]+>/g, ""));
      res.end(out);
    });
    return;
  }
  if (req.url.startsWith("/png/")) {
    const f = path.join(DIR, path.basename(decodeURIComponent(req.url.slice(5))));
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
    return fs.createReadStream(f).pipe(res);
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(page);
}).listen(PORT, () => console.log("png check: open http://localhost:" + PORT + "/"));
