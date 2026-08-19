/* The storefront hero.
 *
 * Horizon has no "no image" option: a hero without one is a flat colour band
 * with type floating in it, which is the look of a theme nobody finished.
 * Stock photography would be worse, because this shop sells sheets that cite
 * their sources and a stock photo cites nothing.
 *
 * So the hero is built from what the archive already owns: its own ground,
 * its own grid, and a traced drawing from a plate. The left third is left
 * deliberately empty because the theme sets the headline and the button over
 * it, and a hero that fights its own copy is a hero that gets replaced.
 *
 *   node tools/merch/shop-hero.js
 *   node tools/merch/rasterize.js shop      then open the address it prints
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "merch", "shop");

const C = {
  bg: "#0b0c10",
  line: "#171a20",
  steel: "#c8ced4",
  faint: "#5d636a",
  green: "#10b981",
};

/* the traced outlines, so the drawing is sharp at any banner size */
function vector(plateId) {
  const f = path.join(ROOT, "merch", "art-print", plateId + ".svg");
  if (!fs.existsSync(f)) throw new Error("no traced drawing for " + plateId + ". Run tools/art-trace.js");
  const svg = fs.readFileSync(f, "utf8");
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const d = (svg.match(/<path[^>]*\sd="([^"]+)"/) || [])[1];
  return { d, w: +vb[1], h: +vb[2] };
}

const px = n => Math.round(n * 100) / 100;

function hero({ W, H, name }) {
  const parts = [];
  parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`);

  /* the archive's grid, the same 180 unit pitch the plates use */
  const u = W / 2560, gg = Math.round(96 * u);
  let grid = "";
  for (let x = 0; x < W; x += gg) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 0; y < H; y += gg) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  parts.push(`<g stroke="${C.line}" stroke-width="${px(1.4 * u)}" opacity="0.7">${grid}</g>`);

  /* The aircraft, right of centre, nose up. It bleeds off the bottom on
     purpose, because a drawing that stops politely inside the frame reads as
     a logo. It must not bleed off the right, though: the first cut had the
     wings running past the edge and the register mark printed straight
     through one of them, which reads as a mistake rather than as a crop. */
  const art = vector("sr-71");
  const margin = W * 0.05;
  let dh = H * 1.18, k = dh / art.h, dw = art.w * k;
  const room = W * 0.40 - margin;
  if (dw > room) { dw = room; k = dw / art.w; dh = art.h * k; }
  const dx = W - margin - dw, dy = H * 0.10;
  parts.push(`<g transform="translate(${px(dx)} ${px(dy)}) scale(${k.toFixed(5)})" opacity="0.62">
    <path fill="${C.steel}" fill-rule="evenodd" d="${art.d}"/></g>`);

  /* a chine across the lower third, the same taper the shirts use */
  const cy = H * 0.72, half = W * 0.30, thick = 5 * u;
  parts.push(`<path d="M${px(W * 0.06)} ${px(cy)} L${px(W * 0.06 + half)} ${px(cy - thick / 2)}
    L${px(W * 0.06 + half * 2)} ${px(cy)} L${px(W * 0.06 + half)} ${px(cy + thick / 2)} Z"
    fill="${C.green}" opacity="0.85"/>`);

  /* the register mark, bottom left, where a plate carries its number */
  parts.push(`<text x="${px(W * 0.06)}" y="${px(H * 0.88)}" font-family="IBM Plex Mono, monospace"
    font-size="${px(26 * u)}" letter-spacing="${px(6 * u)}" fill="${C.faint}">SHANNON ARCHIVE</text>`);
  /* the plate reference sits at the top, clear of the drawing, the way a
     sheet carries its number in the header rather than across the figure */
  parts.push(`<text x="${px(W - W * 0.06)}" y="${px(H * 0.10)}" text-anchor="end"
    font-family="IBM Plex Mono, monospace" font-size="${px(26 * u)}" letter-spacing="${px(6 * u)}"
    fill="${C.green}">KELLY L-01 . SR-71</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
  viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
<title>SHANNON shop hero: ${name}</title>
<style>@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&amp;display=swap");</style>
${parts.join("\n")}
</svg>`;
}

const SHEETS = [
  { name: "hero-wide", W: 2560, H: 1280 },
  { name: "hero-mobile", W: 1080, H: 1350 },
];

fs.mkdirSync(OUT, { recursive: true });
for (const s of SHEETS) {
  const svg = hero(s);
  fs.writeFileSync(path.join(OUT, s.name + ".svg"), svg);
  console.log("ok    " + s.name.padEnd(14) + s.W + "x" + s.H + "  " + Math.round(svg.length / 1024) + "KB");
}
console.log("");
console.log(SHEETS.length + " hero sheet(s) written to merch/shop/");
