/* A page of a PDF, out as a PNG.
 *
 * Patent drawings are how several plates in this archive get their figure,
 * and patents arrive as PDFs. There is no image toolchain on this machine
 * and poppler is not installed, so this borrows the trick rasterize.js uses:
 * node serves the file, the browser renders it, node writes the bytes back.
 * pdf.js does the decoding, loaded from a CDN because the browser has network
 * and this is a local tool rather than anything that ships.
 *
 *   node tools/pdf-page.js <file.pdf> <page> <outfile.png> [scale]
 *   then open http://localhost:4406/
 *
 * Scale defaults to 4, which turns a US Letter patent sheet into roughly
 * 3400 by 4400, plenty for a plate figure.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const [, , SRC, PAGE = "1", OUT, SCALE = "4"] = process.argv;
if (!SRC || !OUT) {
  console.error("usage: node tools/pdf-page.js <file.pdf> <page> <out.png> [scale]");
  process.exit(1);
}
if (!fs.existsSync(SRC)) { console.error("no such file: " + SRC); process.exit(1); }
const PORT = 4406;

const page = `<!doctype html><meta charset="utf-8"><title>pdf page</title>
<style>body{background:#0b0c10;color:#ccd1d6;font:13px/1.7 "IBM Plex Mono",monospace;padding:22px}
b{color:#10b981}i{color:#5d636a;font-style:normal}canvas{max-width:460px;height:auto;margin-top:14px;border:1px solid #2a2e34}</style>
<h3 style="color:#10b981;letter-spacing:2px;font-weight:400">RENDERING PAGE ${PAGE}</h3>
<div id="log"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
const log = document.getElementById("log");
const say = h => { log.innerHTML += "<div>" + h + "</div>"; };
(async () => {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument("/pdf").promise;
    say("<i>" + pdf.numPages + " page(s) in the file</i>");
    const p = await pdf.getPage(${+PAGE});
    const viewport = p.getViewport({ scale: ${+SCALE} });
    const cv = document.createElement("canvas");
    cv.width = Math.round(viewport.width);
    cv.height = Math.round(viewport.height);
    const ctx = cv.getContext("2d");
    /* patent sheets are line art on white; keep the white so the recolour
       step downstream has a clean matte to work from */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    await p.render({ canvasContext: ctx, viewport }).promise;
    document.body.appendChild(cv);
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const res = await fetch("/save", { method: "POST", body: await blob.arrayBuffer() });
    say((await res.text()) + " <i>" + cv.width + "x" + cv.height + ", "
      + Math.round(blob.size / 1024) + " kb</i>");
    say("<b>done.</b>");
  } catch (e) { say("<b style=color:#e5534b>failed: " + e.message + "</b>"); }
})();
</script>`;

http.createServer((req, res) => {
  if (req.url === "/pdf") {
    res.writeHead(200, { "Content-Type": "application/pdf", "Cache-Control": "no-store" });
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
}).listen(PORT, () => console.log("pdf page: open http://localhost:" + PORT + "/"));
