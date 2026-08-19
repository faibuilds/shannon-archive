/* SVG to print-ready PNG.
 *
 * Printful takes PNG or JPG, not SVG, so the poster has to be rasterised at
 * full print size. There is no image toolchain on this machine, and writing
 * an SVG renderer to do it would be absurd when a browser already is one.
 *
 * So: this serves the posters and a render page, the browser draws each one
 * onto a 300 DPI canvas and posts the bytes back, and this writes them to
 * disk. The browser does the rendering, node does the filing, and nothing
 * leaves the machine.
 *
 *   node tools/merch/rasterize.js          then open http://localhost:4400/
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..", "..");
/* Posters by default. Shirts print on dark fabric, so they are drawn on
   nothing at all and the ground has to stay transparent. */
const SUB = process.argv[2] || "posters";
const TRANSPARENT = SUB === "shirts";
const DIR = path.join(ROOT, "merch", SUB);
const PORT = 4400;

const svgs = fs.readdirSync(DIR).filter(f => f.endsWith(".svg")).sort();
if (!svgs.length) { console.error("no posters to rasterise. Run make-posters.js first."); process.exit(1); }

const page = `<script>const TRANSPARENT = ${TRANSPARENT};</script><!doctype html><meta charset="utf-8"><title>rasterise</title>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.7 "IBM Plex Mono",monospace;padding:26px}
b{color:#10b981}i{color:#5d636a;font-style:normal}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">RASTERISING ${svgs.length} POSTER(S) AT 300 DPI</h3>
<div id="log"></div>
<script>
const files = ${JSON.stringify(svgs)};
const log = document.getElementById("log");
const say = h => { const d = document.createElement("div"); d.innerHTML = h; log.appendChild(d); };

/* The SVG embeds its drawing as a data URI and pulls webfonts by @import.
   An <img> will not run that @import, so the fonts are inlined into the
   markup as a <style> the SVG document owns before it is ever decoded. */
async function fontCss() {
  const url = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&family=IBM+Plex+Mono:wght@400;700&display=swap";
  const css = await (await fetch(url)).text();
  const urls = [...css.matchAll(/url\\((https:[^)]+)\\)/g)].map(m => m[1]);
  let out = css;
  for (const u of urls) {
    const b = await (await fetch(u)).blob();
    const d = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    out = out.split(u).join(d);
  }
  return out;
}

(async () => {
  say("<i>fetching and inlining webfonts…</i>");
  const css = await fontCss();
  say("<i>fonts inlined, " + Math.round(css.length / 1024) + "KB</i>");

  for (const f of files) {
    const t0 = performance.now();
    let svg = await (await fetch("/svg/" + f)).text();
    svg = svg.replace(/<style>[\\s\\S]*?<\\/style>/, "<style>" + css + "</style>");
    const vb = svg.match(/viewBox="0 0 (\\d+) (\\d+)"/);
    const W = +vb[1], H = +vb[2];

    const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("decode failed")); i.src = blobUrl;
    }).catch(e => null);
    if (!img) { say("<b style='color:#ef4444'>FAIL</b> " + f + " could not decode"); continue; }

    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    if (!TRANSPARENT) { x.fillStyle = "#0b0c10"; x.fillRect(0, 0, W, H); }
    x.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(blobUrl);

    /* A design is written by stacking baselines, and a baseline is not a top:
       the SR-71 chest mark once put a 500 unit cap on a 330 unit baseline and
       printed with its head cut off. Nothing upstream noticed, because the
       SVG was valid and the build was happy. So the pixels are asked instead:
       any ink on the outer edge of a garment file means the artwork is
       clipped, or is about to be by the printer's own tolerance. */
    let edge = "";
    if (TRANSPARENT) {
      const d = x.getImageData(0, 0, W, H).data;
      const lit = (px, py) => d[(py * W + px) * 4 + 3] > 8;
      const band = 2;
      const sides = [];
      for (let b = 0; b < band; b++) {
        for (let px = 0; px < W; px++) {
          if (lit(px, b) && !sides.includes("top")) sides.push("top");
          if (lit(px, H - 1 - b) && !sides.includes("bottom")) sides.push("bottom");
        }
        for (let py = 0; py < H; py++) {
          if (lit(b, py) && !sides.includes("left")) sides.push("left");
          if (lit(W - 1 - b, py) && !sides.includes("right")) sides.push("right");
        }
      }
      if (sides.length) edge = " <b style='color:#ef4444'>CLIPPED: ink on the " + sides.join(", ") + " edge</b>";
    }

    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const name = f.replace(/\\.svg$/, ".png");
    const r = await fetch("/save/" + name, { method: "POST", body: blob });
    const ms = Math.round(performance.now() - t0);
    say((r.ok ? "<b>ok</b>   " : "<b style='color:#ef4444'>FAIL</b> ") + name +
        "  " + W + "x" + H + "  " + Math.round(blob.size / 1024) + "KB  " + ms + "ms" + edge);
  }
  say("<br><b>done. Files are in merch/posters/</b>");
})();
</script>`;

http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/save/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(6)));
    if (!/^[a-z0-9._-]+\.png$/i.test(name)) { res.writeHead(400); return res.end("bad name"); }
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(path.join(DIR, name), buf);
      console.log("  wrote " + name + "  " + Math.round(buf.length / 1024) + "KB");
      res.writeHead(200); res.end("ok");
    });
    return;
  }
  if (req.url.startsWith("/svg/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(5)));
    const p = path.join(DIR, name);
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": "image/svg+xml" });
    return res.end(fs.readFileSync(p));
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page);
}).listen(PORT, () => console.log("rasteriser on http://localhost:" + PORT + "/  (" + svgs.length + " posters)"));
