/* Shirt artwork on a shirt-coloured ground.
 *
 * The print files are light ink on transparency, which is correct for DTG and
 * useless for judging: opened anywhere with a white background they are very
 * nearly invisible. This lays each one on the fabric colour at the size it
 * actually prints, so a design can be looked at before anybody pays for it.
 *
 *   node tools/merch/shirt-proof.js     then open http://localhost:4405/
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..", "..");
const DIR = path.join(ROOT, "merch", "shirts");
const PORT = 4405;

const pngs = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).sort();
if (!pngs.length) { console.error("no shirt PNGs. Run shirt.js then rasterize.js shirts."); process.exit(1); }

/* Bella + Canvas 3001 black, and the print sits 2in below the collar. */
const FABRIC = "#101114";

const page = `<!doctype html><meta charset="utf-8"><title>shirt proof</title>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.7 "IBM Plex Mono",monospace;padding:22px}
b{color:#10b981}i{color:#5d636a;font-style:normal}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">PROOFING ${pngs.length} SHIRT(S)</h3>
<div id="log"></div>
<script>
const PNGS = ${JSON.stringify(pngs)};
const FABRIC = ${JSON.stringify(FABRIC)};
const log = document.getElementById("log");
const say = h => { log.innerHTML += "<div>" + h + "</div>"; };
(async () => {
  for (const f of PNGS) {
    const img = new Image();
    img.src = "/png/" + f;
    await img.decode();
    /* a torso's worth of fabric around the print, so the scale reads true */
    const pad = Math.round(img.naturalWidth * 0.22);
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth + pad * 2;
    cv.height = img.naturalHeight + pad * 2;
    const x = cv.getContext("2d");
    x.fillStyle = FABRIC; x.fillRect(0, 0, cv.width, cv.height);
    x.drawImage(img, pad, pad);
    /* a faint outline of the printable area, for judging margins only */
    x.strokeStyle = "rgba(255,255,255,0.07)";
    x.setLineDash([18, 18]); x.lineWidth = 3;
    x.strokeRect(pad, pad, img.naturalWidth, img.naturalHeight);
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const res = await fetch("/save/proof-" + f, { method: "POST", body: await blob.arrayBuffer() });
    say((await res.text()) + " <i>" + cv.width + "x" + cv.height + "</i>");
  }
  say("<b>done.</b>");
})();
</script>`;

http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/save/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(6)));
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      fs.writeFileSync(path.join(DIR, name), Buffer.concat(chunks));
      console.log("  wrote " + name);
      res.end("wrote <b>" + name + "</b>");
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
}).listen(PORT, () => console.log("shirt proof: open http://localhost:" + PORT + "/"));
