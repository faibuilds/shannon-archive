/* A contact sheet: every poster on one page at a size a person can judge,
   with the real webfonts loaded. The SVGs themselves are print assets and
   open at whatever the printer needs; this is the thing you look at. */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "..", "merch", "posters");
const size = process.argv[2] || "12x18";

const files = fs.readdirSync(OUT).filter(f => f.endsWith("-" + size + ".svg")).sort();
if (!files.length) { console.error("no posters at " + size + ". Run make-posters.js first."); process.exit(1); }

const cards = files.map(f => {
  const svg = fs.readFileSync(path.join(OUT, f), "utf8")
    /* strip the outer width/height so the sheet controls the size */
    .replace(/<svg([^>]*?)width="[^"]*"\s*height="[^"]*"/, "<svg$1")
    .replace(/<\?xml[^>]*\?>/, "");
  const name = f.replace("-" + size + ".svg", "");
  return `<figure><div class="sheet">${svg}</div><figcaption>${name}<span>${size} in</span></figcaption></figure>`;
}).join("\n");

const html = `<!doctype html>
<meta charset="utf-8">
<title>SHANNON posters, ${size} proof</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#0b0c10;--panel:#15171a;--line:#2a2e34;--steel:#ccd1d6;--faint:#5d636a;--green:#10b981}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--steel);
       font-family:"IBM Plex Mono",monospace;padding:34px 30px 60px}
  h1{font-family:"IBM Plex Mono",monospace;font-size:13px;letter-spacing:3px;
     text-transform:uppercase;color:var(--green);font-weight:400;margin:0 0 6px}
  p.note{font-size:11px;letter-spacing:.6px;color:var(--faint);margin:0 0 30px;line-height:1.7;max-width:760px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:26px;align-items:start}
  figure{margin:0}
  .sheet{background:#000;border:1px solid var(--line);overflow:hidden;line-height:0}
  .sheet svg{width:100%;height:auto;display:block}
  figcaption{font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--faint);
             padding-top:9px;display:flex;justify-content:space-between;gap:10px}
  figcaption span{color:var(--green)}
</style>
<h1>SHANNON posters &middot; ${size} inch proof</h1>
<p class="note">Each sheet is 300 DPI at print size; shown here scaled to fit. The QR carries the plate's own
address on the archive. The centre badge covers modules and leans on level H error correction, which is the one
thing that cannot be proved without a phone: scan two of these before anything is printed.</p>
<div class="grid">
${cards}
</div>
`;

const out = path.join(OUT, "proof-" + size + ".html");
fs.writeFileSync(out, html);
console.log("proof sheet: " + out + "  (" + files.length + " posters, " + Math.round(html.length / 1024) + "KB)");
