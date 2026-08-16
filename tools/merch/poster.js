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
  /* Stop at the next plate, not at a fixed character count. A 2600 character
     window ran off the end of any short plate and into its neighbour, which
     put the diesel engine's patent figure on the Whitworth poster: Whitworth
     carries no drawing, so the search simply kept going until it found one.
     Every plate object opens with {id:", so that is the boundary. */
  const next = html.indexOf('{id:"', i + 1);
  const seg = html.slice(i, next > i ? next : i + 2600);
  const grab = re => { const m = seg.match(re); return m ? m[1] : null; };

  const line = (graph.nodes.find(n => n.type === "line" && n.id === art.lineId) || {});

  return {
    id: plateId,
    name: grab(/name:"([^"]+)"/),
    year: grab(/year:(\d+)/),
    /* the plate's own published hook, so a hook poster never retypes it */
    hook: grab(/hook:"([^"]+)"/),
    field: grab(/field:"([^"]+)"/),
    /* Some plates span years and say so. The bridge is dated 1876 in the
       array because that is where its story starts, but it opened in 1883
       and the plate carries "1876 to 1883" for exactly that reason. A poster
       printing the bare year states something the archive does not. */
    date: grab(/date:"([^"]+)"/),
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

  /* A hook poster prints the plate's own published hook rather than a
     statement written for the wall. It never retypes it: the hook is read
     off the plate, so the sheet and the site cannot drift apart. */
  if (spec.useHook) {
    if (!a.hook) throw new Error(spec.plate + " has no hook to print");
    spec.statement = a.hook;
    spec.statementPer = spec.statementPer || 26;
    spec.statementSize = spec.statementSize || 104;
  }

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

  /* The footer is measured before the drawing is placed, because the drawing
     has to know how much room is left. It used to be a fixed 470 units with
     the art at a fixed width above it, so whatever did not happen to be used
     stayed empty: on Brooklyn that was a fifth of the sheet sitting blank
     between the credit and the rule. */
  const qrBox = (spec.qrBox || 700) * u;
  const qCapH = 96 * u, qUrlH = 84 * u;
  const footH = Math.max(470 * u, qCapH + qrBox + qUrlH);
  const footTop = H - M - footH;

  /* A hook poster carries a table instead of a drawing. Every row names the
     claim it rests on and the build refuses the whole sheet if any of them
     is missing or unverified, exactly as the statement is gated. */
  if (spec.facts) {
    for (const [, , cid] of spec.facts) {
      const c = a.claimById(cid);
      if (!c) throw new Error("fact row cites " + cid + ", which is not in the graph");
      if (c.status !== "verified")
        throw new Error("fact row cites " + cid + ", which is " + c.status + ", not verified");
    }
    /* Anchor the table just above the footer rather than tucking it under
       the hook. With no drawing on the sheet the space has to go somewhere,
       and a wall poster wants it as air between the statement and the
       evidence, not as a hole at the bottom. */
    const rowH = 102 * u;
    const tableH = spec.facts.length * rowH;
    y = Math.max(y + 150 * u, footTop - 150 * u - tableH);
    const L = M, R = W - M;
    for (const [label, value] of spec.facts) {
      parts.push(`<text x="${L}" y="${px(y)}" font-family="IBM Plex Mono, monospace"
        font-size="${px(46 * u)}" letter-spacing="${px(5 * u)}" fill="${C.faint}">${esc(label)}</text>`);
      parts.push(`<text x="${R}" y="${px(y)}" text-anchor="end" font-family="IBM Plex Mono, monospace"
        font-size="${px(46 * u)}" letter-spacing="${px(3 * u)}" fill="${C.steel}">${esc(value)}</text>`);
      y += 26 * u;
      parts.push(`<line x1="${L}" y1="${px(y)}" x2="${R}" y2="${px(y)}"
        stroke="${C.line2}" stroke-width="${px(2.5 * u)}"/>`);
      y += 76 * u;
    }
  }

  /* the drawing */
  /* No drawing, no poster. The editor's rule is that visual-less plates do
     not ship, and enforcing it here also means a plate can never quietly
     borrow a neighbour's figure again. A hook poster is the one exception:
     the words are the object and the table is the evidence. */
  if (spec.noArt) { a.artHref = null; }
  if (!spec.noArt && !a.artHref) throw new Error("plate carries no drawing of its own, so no poster");
  const imgPath = path.join(SITE, a.artHref || "");
  const creditLines = a.artCredit ? wrap(a.artCredit, 62) : [];
  const creditH = creditLines.length ? 70 * u + creditLines.length * 52 * u : 0;
  let drawH = 0;
  if (a.artHref && fs.existsSync(imgPath)) {
    const src = spec.fullResArt && fs.existsSync(spec.fullResArt) ? spec.fullResArt : imgPath;
    const raw = fs.readFileSync(src);
    const iw = raw.readUInt32BE(16), ih = raw.readUInt32BE(20);
    const b64 = raw.toString("base64");
    const artTop = y + 120 * u;
    /* everything between the sub-headline and the rule, less the credit */
    const band = footTop - 96 * u - creditH - artTop;
    let drawW = CW * (spec.artWidth || 0.92), dh = drawW * (ih / iw);
    if (dh > band) { dh = band; drawW = dh * (iw / ih); }
    /* centred in the band, so the space that is left reads as margin rather
       than as the drawing having drifted to the top */
    const top = artTop + Math.max(0, (band - dh) / 2);
    parts.push(`<image x="${px(M + (CW - drawW) / 2)}" y="${px(top)}" width="${px(drawW)}" height="${px(dh)}"
      href="data:image/png;base64,${b64}"/>`);
    y = top + dh;
    drawH = dh;
    parts.push(`<!-- drawing native ${iw}x${ih}px, printed ${(drawW / DPI).toFixed(2)}in wide,
      scale ${(drawW / iw).toFixed(2)}x -->`);
  }

  /* credit, exactly as the archive files it */
  /* no drawing, no credit for one */
  if (creditLines.length && !spec.noArt) {
    y += 70 * u;
    for (const ln of creditLines) {
      parts.push(`<text x="${M}" y="${px(y)}" font-family="IBM Plex Mono, monospace"
        font-size="${px(36 * u)}" fill="${C.faint}">${esc(ln)}</text>`);
      y += 52 * u;
    }
  }

  /* ---------- foot: ledger, claim, QR ---------- */
  parts.push(`<line x1="${M}" y1="${px(footTop)}" x2="${W - M}" y2="${px(footTop)}"
    stroke="${C.line2}" stroke-width="${px(3 * u)}"/>`);

  /* The sheet never said what it was of. Read cold it offered a sentence, a
     drawing and a line code, and nowhere the words Brooklyn Bridge. A poster
     that will not name its subject is a puzzle rather than a label, so the
     footer opens the way a drawing's title block does. It also gives the
     left column the weight to stand beside the QR. */
  let fy = footTop + 112 * u;
  for (const ln of wrap(a.name.toUpperCase(), 26)) {
    parts.push(`<text x="${M}" y="${px(fy)}" font-family="Poppins, Helvetica, Arial, sans-serif"
      font-weight="800" font-size="${px(92 * u)}" fill="${C.steel}">${esc(ln)}</text>`);
    fy += 104 * u;
  }
  fy += 4 * u;
  parts.push(`<text x="${M}" y="${px(fy)}" font-family="IBM Plex Mono, monospace"
    font-size="${px(38 * u)}" letter-spacing="${px(7 * u)}" fill="${C.faint}">${esc(String(a.date || a.year))} &#183; ${esc(a.lineName)} ${esc(a.lineTag)}</text>`);
  fy += 96 * u;
  parts.push(`<text x="${M}" y="${px(fy)}" font-family="IBM Plex Mono, monospace"
    font-size="${px(40 * u)}" letter-spacing="${px(7 * u)}" fill="${C.green}">${a.verified} OF ${a.claims} CLAIMS VERIFIED</text>`);
  fy += 76 * u;
  /* Three lines is all there is room for, and the claim is usually longer.
     Slicing the wrapped lines cut Brooklyn mid clause, ending the poster on
     "Roebling estimated", which reads as a printing fault rather than an
     extract. Cut the sentence instead: the longest run of whole sentences
     that fits, or failing that the longest run of whole clauses with an
     ellipsis to say plainly that there is more. */
  const fitClaim = (text, cols, lines) => {
    const fits = s => wrap(s, cols).length <= lines;
    if (fits(text)) return text;
    const ends = [];
    for (let i = 0; i < text.length; i++) {
      if (/[.!?]/.test(text[i]) && (i + 1 === text.length || /\s/.test(text[i + 1]))) ends.push(i + 1);
    }
    for (let i = ends.length - 1; i >= 0; i--) {
      const s = text.slice(0, ends[i]).trim();
      if (fits(s)) return s;
    }
    const clauses = [];
    for (let i = 0; i < text.length; i++) if (/[;,]/.test(text[i])) clauses.push(i);
    for (let i = clauses.length - 1; i >= 0; i--) {
      const s = text.slice(0, clauses[i]).trim() + "…";
      if (fits(s)) return s;
    }
    const words = text.split(/\s+/);
    for (let n = words.length - 1; n > 0; n--) {
      const s = words.slice(0, n).join(" ") + "…";
      if (fits(s)) return s;
    }
    return text;
  };
  for (const ln of wrap(fitClaim(claim.text, 58, 3), 58)) {
    parts.push(`<text x="${M}" y="${px(fy)}" font-family="Poppins, Helvetica, Arial, sans-serif"
      font-size="${px(42 * u)}" fill="${C.mid}">${esc(ln)}</text>`);
    fy += 58 * u;
  }
  parts.push(`<text x="${M}" y="${px(H - M)}" font-family="IBM Plex Mono, monospace"
    font-size="${px(38 * u)}" letter-spacing="${px(6 * u)}" fill="${C.faint}">${esc(spec.claimId.toUpperCase())}</text>`);

  /* QR, bottom right, with the quiet zone the spec requires.
     The invitation is not "scan for the sources". It is the archive's own
     promise: this plate is joined to others and the joins are evidenced. */
  const url = "https://shannon.engineeringcommunity.net/#" + a.id;
  const q = encode(url);
  const box = qrBox;
  const mod = box / (q.size + 8);           /* 4 modules of quiet zone each side */
  /* Sat directly under the rule with its caption drawn straight through it.
     Both now hang off footTop with real clearance. */
  const qx = W - M - box, qy = footTop + qCapH;
  parts.push(`<rect x="${px(qx)}" y="${px(qy)}" width="${px(box)}" height="${px(box)}" fill="#ffffff"/>`);
  let mods = "";
  for (let r = 0; r < q.size; r++) for (let c = 0; c < q.size; c++)
    if (q.modules[r][c]) mods += `<rect x="${px(qx + (c + 4) * mod)}" y="${px(qy + (r + 4) * mod)}"
      width="${px(mod + 0.5)}" height="${px(mod + 0.5)}"/>`;
  parts.push(`<g fill="#000000">${mods}</g>`);

  /* Branding, in two parts with very different risk.
     The brackets sit in the quiet zone margin and touch no module, so they
     are free. The centre badge covers modules and relies on level H having
     error correction to spare; it is kept under about a tenth of the area,
     well inside what H recovers, but it is the one thing here that cannot be
     proved without a phone. */
  const bl = box * 0.17, bw = px(5 * u);
  const bracket = (x0, y0, dx, dy) =>
    `<path d="M${px(x0 + dx * bl)} ${px(y0)} H${px(x0)} V${px(y0 + dy * bl)}"
      stroke="${C.green}" stroke-width="${bw}" fill="none" stroke-linecap="square"/>`;
  const pad = 22 * u;
  parts.push(bracket(qx - pad, qy - pad, 1, 1));
  parts.push(bracket(qx + box + pad, qy - pad, -1, 1));
  parts.push(bracket(qx - pad, qy + box + pad, 1, -1));
  parts.push(bracket(qx + box + pad, qy + box + pad, -1, -1));

  /* Off unless asked for. The brackets are free, sitting in the quiet zone
     and touching no module. The centre badge covers modules and relies on
     level H having correction to spare, and neither of us has been able to
     put a phone on it. An unverified risk does not go on a printed product. */
  if (spec.qrBadge === true) {
    const bs = box * 0.155, cx = qx + box / 2, cy = qy + box / 2;
    parts.push(`<rect x="${px(cx - bs / 2)}" y="${px(cy - bs / 2)}" width="${px(bs)}" height="${px(bs)}"
      fill="${C.bg}" stroke="${C.green}" stroke-width="${px(4 * u)}"/>`);
    /* the mark: concentric rings, the shape the brand already wears */
    parts.push(`<g fill="none" stroke="${C.green}" stroke-width="${px(3.4 * u)}">
      <circle cx="${px(cx)}" cy="${px(cy)}" r="${px(bs * 0.30)}"/>
      <circle cx="${px(cx)}" cy="${px(cy)}" r="${px(bs * 0.15)}"/></g>`);
  }

  parts.push(`<text x="${px(qx + box / 2)}" y="${px(qy - 34 * u)}" text-anchor="middle"
    font-family="IBM Plex Mono, monospace" font-size="${px(33 * u)}" letter-spacing="${px(5 * u)}"
    fill="${C.green}">SEE WHAT IT CONNECTS TO</text>`);
  parts.push(`<text x="${px(qx + box / 2)}" y="${px(qy + box + 56 * u)}" text-anchor="middle"
    font-family="IBM Plex Mono, monospace" font-size="${px(28 * u)}" letter-spacing="${px(3 * u)}"
    fill="${C.faint}">SHANNON.ENGINEERINGCOMMUNITY.NET</text>`);

  /* Physical size lives in the inch attributes and the viewBox carries the
     300 DPI pixel grid. Stating the width in pixels instead made every viewer
     open the proof at 3600px across, which is correct for a printer and
     useless for a person. */
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}in" height="${size.h}in"
  viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
<title>SHANNON poster: ${esc(a.name)}</title>
<!-- qr-target ${url} -->
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
