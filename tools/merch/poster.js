/* SHANNON poster generator.
 *
 * Builds a print-size SVG for one plate: the statement, the drawing, the
 * credit, the ledger line and a QR back to the plate.
 *
 * Two rules hold this together and neither is decorative.
 *
 * 1. NOTHING IS TYPED TWICE. The claim counts, the credit and the plate name
 *    are read from graph.json and index.html at build time. A poster hangs on
 *    a wall for years and cannot be corrected, so it may not carry a number
 *    that was copied by hand from something that can change.
 * 2. EVERY POSTER CITES A VERIFIED CLAIM. The statement on the poster names
 *    the claim it rests on, the build looks that claim up, and it refuses to
 *    render if the claim is missing or is anything other than verified.
 *    The commercial layer inherits the archive's discipline mechanically.
 *
 * Usage: node tools/merch/poster.js <plate-id> [size]
 */
const fs = require("fs");
const path = require("path");
const { encode } = require("./qr.js");

const ROOT = path.join(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");

/* Printful stocks no 9:16. These are the real options, tallest first. */
const SIZES = {
  "10x24": { w: 10, h: 24 },   /* a column. genuinely unlike a poster */
  "11x17": { w: 11, h: 17 },   /* broadside */
  "12x18": { w: 12, h: 18 },   /* the common tall poster */
  "24x36": { w: 24, h: 36 },
};
const DPI = 300;

const C = {
  bg: "#0b0c10", panel: "#15171a", line: "#2a2e34", line2: "#33383f",
  steel: "#ccd1d6", mid: "#8f959c", faint: "#5d636a", green: "#10b981",
};

/* ---------- read the archive, never retype it ---------- */
function archive(plateId) {
  const graph = JSON.parse(fs.readFileSync(path.join(SITE, "graph.json"), "utf8"));
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");

  const art = graph.nodes.find(n => n.id === plateId && n.type === "artifact");
  if (!art) throw new Error("no artifact " + plateId + " in graph.json");

  const claims = graph.nodes.filter(n => n.type === "claim" && (n.aboutIds || []).includes(plateId));
  const verified = claims.filter(c => c.status === "verified").length;

  /* the plate block in the page carries the display name, year and credit */
  const i = html.indexOf('id:"' + plateId + '"');
  if (i < 0) throw new Error("no plate " + plateId + " on the site");
  const seg = html.slice(i, i + 2600);
  const grab = re => { const m = seg.match(re); return m ? m[1] : null; };

  const line = (graph.nodes.find(n => n.type === "line" && n.id === art.lineId) || {});

  return {
    id: plateId,
    name: grab(/name:"([^"]+)"/),
    year: grab(/year:(\d+)/),
    lineName: (line.name || art.lineId || "").toUpperCase(),
    lineTag: "L-" + String(["kelly","petroski","hammurabi","barenyi","tipper","roebling",
                            "lovelace","wright","sutter","carnot","noyce"].indexOf(art.lineId) + 1).padStart(2, "0"),
    artCredit: grab(/artCredit:"([^"]+)"/),
    artHref: grab(/<image href="(art\/[^"]+)"/),
    claims: claims.length,
    verified,
    claimById: id => graph.nodes.find(n => n.id === id && n.type === "claim"),
  };
}

/* ---------- text helpers, since SVG will not wrap for us ---------- */
function wrap(text, perLine) {
  const words = String(text).split(/\s+/), out = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (test.length > perLine && cur) { out.push(cur); cur = w; } else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- the poster ---------- */
function build(spec) {
  const a = archive(spec.plate);

  /* gate: the statement must rest on a verified claim */
  const claim = a.claimById(spec.claimId);
  if (!claim) throw new Error("poster cites " + spec.claimId + ", which is not in the graph");
  if (claim.status !== "verified")
    throw new Error("poster cites " + spec.claimId + ", which is " + claim.status + ", not verified");

  const size = SIZES[spec.size || "12x18"];
  if (!size) throw new Error("unknown size " + spec.size);
  const W = size.w * DPI, H = size.h * DPI;
  const M = Math.round(W * 0.085);          /* margin scales with the sheet */
  const CW = W - M * 2;
  const u = W / 3600;                       /* type scale, 12x18 is the reference */

  const parts = [];
  const px = n => Math.round(n * 100) / 100;

  parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`);

  /* a faint grid, the same one the site and the cards wear */
  const g = Math.round(180 * u);
  let grid = "";
  for (let x = 0; x < W; x += g) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 0; y < H; y += g) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  parts.push(`<g stroke="${C.line}" stroke-width="${px(1.6 * u)}" opacity="0.55">${grid}</g>`);

  let y = M + 70 * u;

  /* header */
  parts.push(`<text x="${M}" y="${px(y)}" font-family="IBM Plex Mono, monospace" font-weight="700"
    font-size="${px(58 * u)}" letter-spacing="${px(11 * u)}" fill="${C.steel}">SHANNON</text>`);
  parts.push(`<text x="${W - M}" y="${px(y)}" text-anchor="end" font-family="IBM Plex Mono, monospace"
    font-size="${px(48 * u)}" letter-spacing="${px(9 * u)}" fill="${C.green}">${esc(a.lineName)} ${a.lineTag}</text>`);
  y += 46 * u;
  parts.push(`<line x1="${M}" y1="${px(y)}" x2="${W - M}" y2="${px(y)}" stroke="${C.line2}" stroke-width="${px(3 * u)}"/>`);

  /* the statement. A title, not a feed hook: it has to stand on a wall with
     nothing after it to resolve a promise. */
  y += 150 * u;
  const tl = wrap(spec.statement, spec.statementPer || 22);
  const ts = (spec.statementSize || 150) * u;
  for (const ln of tl) {
    parts.push(`<text x="${M}" y="${px(y)}" font-family="Poppins, Helvetica, Arial, sans-serif"
      font-weight="800" font-size="${px(ts)}" fill="${C.steel}">${esc(ln.toUpperCase())}</text>`);
    y += ts * 1.14;
  }

  /* the second line, quieter, carries the fact the statement implies */
  if (spec.sub) {
    y += 44 * u;
    for (const ln of wrap(spec.sub, 46)) {
      parts.push(`<text x="${M}" y="${px(y)}" font-family="Poppins, Helvetica, Arial, sans-serif"
        font-size="${px(60 * u)}" fill="${C.mid}">${esc(ln)}</text>`);
      y += 82 * u;
    }
  }

  /* the drawing */
  const imgPath = path.join(SITE, a.artHref || "");
  let drawH = 0;
  if (a.artHref && fs.existsSync(imgPath)) {
    const src = spec.fullResArt && fs.existsSync(spec.fullResArt) ? spec.fullResArt : imgPath;
    const raw = fs.readFileSync(src);
    const iw = raw.readUInt32BE(16), ih = raw.readUInt32BE(20);
    const b64 = raw.toString("base64");
    const maxW = CW * (spec.artWidth || 0.78);
    const drawW = maxW, dh = drawW * (ih / iw);
    y += 120 * u;
    parts.push(`<image x="${px(M + (CW - drawW) / 2)}" y="${px(y)}" width="${px(drawW)}" height="${px(dh)}"
      href="data:image/png;base64,${b64}"/>`);
    y += dh;
    drawH = dh;
    parts.push(`<!-- drawing native ${iw}x${ih}px, printed ${(drawW / DPI).toFixed(2)}in wide,
      scale ${(drawW / iw).toFixed(2)}x -->`);
  }

  /* credit, exactly as the archive files it */
  if (a.artCredit) {
    y += 70 * u;
    for (const ln of wrap(a.artCredit, 62)) {
      parts.push(`<text x="${M}" y="${px(y)}" font-family="IBM Plex Mono, monospace"
        font-size="${px(36 * u)}" fill="${C.faint}">${esc(ln)}</text>`);
      y += 52 * u;
    }
  }

  /* ---------- foot: ledger, claim, QR ---------- */
  const footTop = H - M - 470 * u;
  parts.push(`<line x1="${M}" y1="${px(footTop)}" x2="${W - M}" y2="${px(footTop)}"
    stroke="${C.line2}" stroke-width="${px(3 * u)}"/>`);

  let fy = footTop + 90 * u;
  parts.push(`<text x="${M}" y="${px(fy)}" font-family="IBM Plex Mono, monospace"
    font-size="${px(40 * u)}" letter-spacing="${px(7 * u)}" fill="${C.green}">${a.verified} OF ${a.claims} CLAIMS VERIFIED</text>`);
  fy += 76 * u;
  for (const ln of wrap(claim.text, 58).slice(0, 3)) {
    parts.push(`<text x="${M}" y="${px(fy)}" font-family="Poppins, Helvetica, Arial, sans-serif"
      font-size="${px(42 * u)}" fill="${C.mid}">${esc(ln)}</text>`);
    fy += 58 * u;
  }
  parts.push(`<text x="${M}" y="${px(H - M)}" font-family="IBM Plex Mono, monospace"
    font-size="${px(38 * u)}" letter-spacing="${px(6 * u)}" fill="${C.faint}">${esc(spec.claimId.toUpperCase())}</text>`);

  /* QR, bottom right, with the quiet zone the spec requires */
  const url = "https://shannon.engineeringcommunity.net/#" + a.id;
  const q = encode(url);
  const box = 430 * u;
  const mod = box / (q.size + 8);           /* 4 modules of quiet zone each side */
  const qx = W - M - box, qy = H - M - box + 20 * u;
  parts.push(`<rect x="${px(qx)}" y="${px(qy)}" width="${px(box)}" height="${px(box)}" fill="#ffffff"/>`);
  let mods = "";
  for (let r = 0; r < q.size; r++) for (let c = 0; c < q.size; c++)
    if (q.modules[r][c]) mods += `<rect x="${px(qx + (c + 4) * mod)}" y="${px(qy + (r + 4) * mod)}"
      width="${px(mod + 0.5)}" height="${px(mod + 0.5)}"/>`;
  parts.push(`<g fill="#000000">${mods}</g>`);
  parts.push(`<text x="${px(qx + box / 2)}" y="${px(qy - 26 * u)}" text-anchor="middle"
    font-family="IBM Plex Mono, monospace" font-size="${px(32 * u)}" letter-spacing="${px(5 * u)}"
    fill="${C.faint}">SCAN FOR THE SOURCES</text>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&amp;family=IBM+Plex+Mono:wght@400;700&amp;display=swap");</style>
${parts.join("\n")}
</svg>`;

  return { svg, meta: { size: spec.size || "12x18", W, H, qrVersion: q.version, qrSize: q.size, url,
                        claims: a.claims, verified: a.verified, drawH } };
}

module.exports = { build, SIZES, archive };

if (require.main === module) {
  console.log("poster.js is a module. See tools/merch/make-posters.js");
}
