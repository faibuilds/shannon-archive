/* Share cards to PNG, for reviewing them without a phone in hand.
 *
 * The share card is drawn on a canvas by index.html itself, so the only
 * honest way to look at one is to let the site draw it. There is no image
 * toolchain here and no browser automation, so this borrows the trick
 * rasterize.js already uses: node serves, the browser draws, node files the
 * bytes, and nothing leaves the machine.
 *
 * It serves /site itself rather than pointing at the dev server, because the
 * render page has to reach inside the site's own frame to call renderCard,
 * and that is only allowed from the same origin.
 *
 *   node tools/cards.js            then open http://localhost:4402/
 *
 * Files land in merch/cards/ as <plate>-<format>.png.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(ROOT, "merch", "cards");
const PORT = 4402;

fs.mkdirSync(OUT, { recursive: true });

/* Which cards to draw. Empty plate list means every plate that carries art. */
const only = process.argv.slice(2).filter(a => !a.startsWith("-"));
const FORMATS = ["story", "square"];

const TYPES = {
  ".html": "text/html; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain",
};

const page = `<!doctype html><meta charset="utf-8"><title>cards</title>
<style>
 body{background:#0b0c10;color:#ccd1d6;font:13px/1.8 "IBM Plex Mono",monospace;padding:24px;margin:0}
 h3{color:#10b981;letter-spacing:2px;font-weight:400;margin:0 0 14px}
 b{color:#10b981} i{color:#5d636a;font-style:normal}
 iframe{position:fixed;left:-4000px;width:1280px;height:900px;border:0}
</style>
<h3>DRAWING SHARE CARDS</h3>
<div id="log">booting the archive in a hidden frame...</div>
<iframe id="f" src="/index.html?v=${Date.now()}"></iframe>
<script>
const log = document.getElementById("log");
const say = h => { log.innerHTML += "<div>" + h + "</div>"; };
const FORMATS = ${JSON.stringify(FORMATS)};
const ONLY = ${JSON.stringify(only)};

addEventListener("message", e => { if (e.data && e.data.cards) say(e.data.cards); });

/* renderCard and CARD are declared const in index.html, so they live in that
   frame's lexical scope and never become properties of its window. Reaching
   them from out here is impossible; the work has to run inside the frame. */
document.getElementById("f").onload = () => {
  const d = document.getElementById("f").contentDocument;
  const s = d.createElement("script");
  s.textContent = "(" + (async (FORMATS, ONLY) => {
    const post = h => parent.postMessage({ cards: h }, "*");
    try {
      let ids = [...document.querySelectorAll(".plate-art")].map(a => a.closest("[id]").id);
      if (ONLY.length) ids = ids.filter(x => ONLY.includes(x));
      post("<i>" + ids.length + " plate(s) with art, " + FORMATS.length + " format(s)</i>");
      let n = 0;
      for (const id of ids) {
        for (const f of FORMATS) {
          const data = plateData({ dataset: { id: id, name: id } });
          const cv = await renderCard(data, CARD[f]);
          const blob = await new Promise(r => cv.toBlob(r, "image/png"));
          const res = await fetch("/save/" + id + "-" + f + ".png",
            { method: "POST", body: await blob.arrayBuffer() });
          post((await res.text()) + " <i>" + cv.width + "x" + cv.height
            + ", " + Math.round(blob.size / 1024) + " kb</i>");
          n++;
        }
      }
      post("<b>done. " + n + " card(s) written.</b> You can close this tab.");
    } catch (err) { post("<b style=color:#e5534b>failed: " + err.message + "</b>"); }
  }).toString() + ")(" + JSON.stringify(FORMATS) + "," + JSON.stringify(ONLY) + ")";
  d.body.appendChild(s);
};
</script>`;

http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/save/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(6)));
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(path.join(OUT, name), buf);
      console.log("  wrote " + name + "  " + Math.round(buf.length / 1024) + " kb");
      res.end("wrote <b>" + name + "</b>");
    });
    return;
  }
  if (req.url === "/" || req.url === "/index") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(page);
  }
  /* Everything else is the site itself, same origin as the render page. */
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  const file = path.join(SITE, rel);
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end("not found");
  }
  /* Never cached: this runs repeatedly while the card code is being changed,
     and a cached index.html would quietly redraw the previous version. */
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store, max-age=0",
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log("cards: serving /site and waiting for the browser on http://localhost:" + PORT + "/");
  console.log("output: " + OUT);
});
