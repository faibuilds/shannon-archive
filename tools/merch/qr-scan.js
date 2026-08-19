/* The scan test. A real decoder, on the actual printed pixels.
 *
 * The encoder in qr.js and the decoder in qr-verify.js were both written
 * here, and for a while they shared a mistake: the format bits were written
 * in reverse, so every code round tripped perfectly between them and no
 * phone on earth could read one. An encoder cannot be its own witness, and
 * neither can a decoder that grew up next to it.
 *
 * So this one is borrowed. The browser hands the actual rendered pixels to
 * jsQR twice over: once with the whole sheet in frame, at the sizes it gets
 * looked at on a screen, and once framed on the code itself, the way a
 * phone is held up to a wall, down to the point where the camera can barely
 * resolve a module. A code that only reads at one size is a code that fails
 * at arm's length.
 *
 *   node tools/merch/qr-scan.js            posters
 *   node tools/merch/qr-scan.js shirts     shirts
 *
 * Then open the address it prints. It exits nonzero if any code fails.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..", "..");
const SUB = process.argv[2] || "posters";
const DIR = path.join(ROOT, "merch", SUB);
const PORT = 4402;

if (!fs.existsSync(DIR)) { console.error("no " + DIR); process.exit(1); }
const pngs = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).sort();
if (!pngs.length) { console.error("no PNGs in merch/" + SUB + ". Rasterise first."); process.exit(1); }

/* What each sheet is supposed to say. The poster states its own target in a
   comment, so this never has to guess from a filename. */
const target = {};
for (const p of pngs) {
  const svg = path.join(DIR, p.replace(/\.png$/, ".svg"));
  const m = fs.existsSync(svg) && fs.readFileSync(svg, "utf8").match(/<!-- qr-target ([^\s]+) -->/);
  target[p] = m ? m[1] : null;
}
const missing = pngs.filter(p => !target[p]);
if (missing.length) console.log("no stated target for: " + missing.join(", ") + "  (will report whatever reads)");

const page = `<!doctype html><meta charset="utf-8"><title>scan test</title>
<script src="https://unpkg.com/jsqr@1.4.0/dist/jsQR.js"></script>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.7 "IBM Plex Mono",monospace;padding:26px}
b{color:#10b981}u{color:#ef4444;text-decoration:none}i{color:#5d636a;font-style:normal}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">SCAN TEST, ${pngs.length} SHEET(S)</h3>
<div id="log"></div>
<script>
const files = ${JSON.stringify(pngs)};
const want = ${JSON.stringify(target)};
/* the whole sheet, at the heights it gets looked at on a screen */
const SHEET = [1600, 1100, 800];
/* the code alone, in the frame, measured in pixels across the code: print
   held up close, a good phone at arm's length, a poor one, and past the
   point where a module is a single pixel */
const FRAMED = [900, 400, 220, 140];
const log = document.getElementById("log");
const say = h => { const d = document.createElement("div"); d.innerHTML = h; log.appendChild(d); };

const load = src => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("decode")); i.src = src;
});

function scan(img, sx, sy, sw, sh, out) {
  const W = Math.round(sw * out / sh), H = out;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const cx = cv.getContext("2d");
  cx.imageSmoothingQuality = "high";
  cx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  const d = cx.getImageData(0, 0, W, H);
  try { const g = jsQR(d.data, W, H); return g || null; } catch (e) { return null; }
}

(async () => {
  const report = [];
  for (const f of files) {
    const img = await load("/png/" + f).catch(() => null);
    if (!img) { say("<u>FAIL</u> " + f + " could not decode"); report.push({ f, ok: false, why: "image" }); continue; }
    const IW = img.naturalWidth, IH = img.naturalHeight, w = want[f];
    const results = [];

    /* whole sheet */
    let located = null;
    for (const h of SHEET) {
      const g = scan(img, 0, 0, IW, IH, h);
      const v = g ? g.data : null;
      if (g && !located) located = { g, h };
      results.push({ where: "sheet", h, ok: w ? v === w : !!v, read: v });
    }

    /* framed on the code, found from wherever it first read */
    if (!located) {
      results.push({ where: "framed", h: 0, ok: false, read: null, note: "never located" });
    } else {
      const s = IH / located.h;
      const pts = Object.values(located.g.location).filter(p => p && typeof p.x === "number");
      const xs = pts.map(p => p.x * s), ys = pts.map(p => p.y * s);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const pad = Math.max(x1 - x0, y1 - y0) * 0.22;
      const sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad);
      const sw = Math.min(IW - sx, x1 - x0 + pad * 2), sh = Math.min(IH - sy, y1 - y0 + pad * 2);
      for (const px of FRAMED) {
        const g = scan(img, sx, sy, sw, sh, px);
        const v = g ? g.data : null;
        results.push({ where: "framed", h: px, ok: w ? v === w : !!v, read: v });
      }
    }

    const bad = results.filter(r => !r.ok);
    const fmt = k => results.filter(r => r.where === k)
      .map(r => r.h + "px " + (r.ok ? "ok" : r.read ? "WRONG" : "no")).join("   ");
    const first = results.find(r => r.read);
    say((bad.length ? "<u>FAIL</u> " : "<b>ok</b>   ") + f +
        "<br><i>&nbsp;&nbsp;&nbsp;&nbsp;whole sheet:&nbsp; " + fmt("sheet") + "</i>" +
        "<br><i>&nbsp;&nbsp;&nbsp;&nbsp;framed on it: " + fmt("framed") + "</i>" +
        (first ? "<br><i>&nbsp;&nbsp;&nbsp;&nbsp;reads: " + first.read + "</i>" : ""));
    report.push({ f, ok: !bad.length, results });
  }
  const failed = report.filter(r => !r.ok).length;
  say("<br>" + (failed ? "<u>" + failed + " sheet(s) failed</u>" : "<b>every sheet read correctly at every size</b>"));
  await fetch("/done", { method: "POST", body: JSON.stringify(report) });
})();
</script>`;

let server;
server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/done") {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      res.writeHead(200); res.end("ok");
      const report = JSON.parse(Buffer.concat(chunks).toString());
      console.log("");
      let failed = 0;
      for (const r of report) {
        if (!r.ok) failed++;
        const part = k => (r.results || []).filter(x => x.where === k)
          .map(x => x.h + ":" + (x.ok ? "ok" : x.read ? "WRONG" : "no")).join(" ");
        console.log((r.ok ? "ok    " : "FAIL  ") + r.f.padEnd(34) +
          "sheet " + part("sheet") + "   framed " + part("framed"));
      }
      console.log("");
      console.log(failed ? failed + " sheet(s) failed the scan test." : report.length + " sheet(s) read correctly at every size.");
      server.close();
      process.exit(failed ? 1 : 0);
    });
    return;
  }
  if (req.url.startsWith("/png/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(5)));
    const p = path.join(DIR, name);
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": "image/png" });
    return res.end(fs.readFileSync(p));
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page);
}).listen(PORT, () => console.log("scan test on http://localhost:" + PORT + "/  (" + pngs.length + " sheet(s))"));
