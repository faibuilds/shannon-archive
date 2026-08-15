/* Source scan to plate figure.
 *
 * Plate art in this archive is a public-domain drawing, recoloured and never
 * redrawn. Patent sheets and engineering records arrive as black line work on
 * white paper, and the plates are near black, so the art has to be inverted
 * and the paper dropped to transparent or it prints as a white slab.
 *
 * This crops, inverts, tints to the archive's steel, and keys the paper out.
 * Nothing is added inside the outline and no line is redrawn: the geometry
 * that arrives is the geometry that ships.
 *
 *   node tools/plate-art.js <in.png> <out.png> <x> <y> <w> <h>
 *   then open http://localhost:4407/
 *
 * Coordinates are in the source image's own pixels. Omit them to take the
 * whole sheet.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const [, , SRC, OUT, X, Y, W, H] = process.argv;
if (!SRC || !OUT) {
  console.error("usage: node tools/plate-art.js <in.png> <out.png> [x y w h]");
  process.exit(1);
}
if (!fs.existsSync(SRC)) { console.error("no such file: " + SRC); process.exit(1); }
const PORT = 4407;
const CROP = X !== undefined ? { x: +X, y: +Y, w: +W, h: +H } : null;

const page = `<!doctype html><meta charset="utf-8"><title>plate art</title>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.7 "IBM Plex Mono",monospace;padding:22px}
b{color:#10b981}i{color:#5d636a;font-style:normal}
canvas{max-width:520px;height:auto;margin-top:14px;background:#0b0c10;border:1px solid #2a2e34}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">MAKING THE PLATE FIGURE</h3>
<div id="log"></div>
<script>
const CROP = ${JSON.stringify(CROP)};
const log = document.getElementById("log");
const say = h => { log.innerHTML += "<div>" + h + "</div>"; };
(async () => {
  try {
    const img = new Image();
    img.src = "/src";
    await img.decode();
    say("<i>source " + img.naturalWidth + "x" + img.naturalHeight + "</i>");
    const c = CROP || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const cv = document.createElement("canvas");
    cv.width = c.w; cv.height = c.h;
    const x = cv.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);

    const d = x.getImageData(0, 0, c.w, c.h);
    const p = d.data;
    /* The archive's steel, so the figure sits in the same register as the
       type around it rather than shouting white. */
    const R = 200, G = 206, B = 212;
    let ink = 0;
    for (let i = 0; i < p.length; i += 4) {
      /* paper is bright, line work is dark: invert luminance into alpha */
      const lum = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      let a = 255 - lum;
      /* lift the scanner's grey haze off the paper without eating the lines */
      a = a < 42 ? 0 : Math.min(255, Math.round((a - 42) * 1.45));
      if (a > 0) ink++;
      p[i] = R; p[i + 1] = G; p[i + 2] = B; p[i + 3] = a;
    }
    x.putImageData(d, 0, 0);
    document.body.appendChild(cv);
    say("<i>" + (100 * ink / (c.w * c.h)).toFixed(1) + "% of the crop carries ink</i>");

    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const res = await fetch("/save", { method: "POST", body: await blob.arrayBuffer() });
    say((await res.text()) + " <i>" + cv.width + "x" + cv.height + ", "
      + Math.round(blob.size / 1024) + " kb</i>");
    say("<b>done.</b>");
  } catch (e) { say("<b style=color:#e5534b>failed: " + e.message + "</b>"); }
})();
</script>`;

http.createServer((req, res) => {
  if (req.url === "/src") {
    res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
    return fs.createReadStream(SRC).pipe(res);
  }
  if (req.method === "POST" && req.url === "/save") {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, buf);
      console.log("  wrote " + OUT + "  " + Math.round(buf.length / 1024) + " kb");
      res.end("wrote <b>" + path.basename(OUT) + "</b>");
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(page);
}).listen(PORT, () => console.log("plate art: open http://localhost:" + PORT + "/"));
