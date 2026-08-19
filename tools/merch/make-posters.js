/* The poster set. Each entry names the verified claim it stands on; the
   builder refuses to render one that does not, so a poster cannot outrun the
   archive. Statements are written for a wall, not for a feed: a hook plants a
   question the caption answers, and a poster has no caption. */
const fs = require("fs");
const path = require("path");
const { build } = require("./poster.js");

const OUT = path.join(__dirname, "..", "..", "merch", "posters");
/* Print resolution art. The site carries web resolution drawings, roughly
   40 DPI at poster size, which is far below the 150 DPI a printer wants.
   merch/art-print holds the same figures rendered from the source patents
   at print size, and a poster prefers them when they exist. */
const ART = process.env.SHANNON_FULLRES || path.join(__dirname, "..", "..", "merch", "art-print");

const POSTERS = [
  {
    /* The plate, printed. Same layout the site already shows on a share
       card, with the code standing in for the URL and the claim count. */
    plate: "diesel-engine",
    variant: "card",
    claimId: "c-diesel-04",
    fullResArt: path.join(ART, "diesel-engine.png"),
    artCaption: "US 542,846 · PATENTED 1895",
    artWidth: 0.78,
    /* The code is the last thing you should notice. The sheet is the drawing
       and the sentence; the code is how you follow it up afterwards, so it is
       sized to be found rather than to be seen. Shrinking it also gives the
       drawing back the room the foot band was taking. */
    qrBox: 540,
  },
];

const size = process.argv[2] || "12x18";
/* Optional plate ids after the size, so one poster can be built on its own
   while the rest of the set is still being settled. */
const only = process.argv.slice(3);
/* A plate may carry more than one poster, so match on ids present rather
   than on counts: asking for diesel-engine should build every diesel sheet. */
const chosen = only.length ? POSTERS.filter(p => only.includes(p.plate) || only.includes(p.plate + "-" + (p.variant || ""))) : POSTERS;
const known = [...new Set(POSTERS.map(p => p.plate))];
const unknown = only.filter(o => !known.includes(o) && !POSTERS.some(p => p.plate + "-" + (p.variant || "") === o));
if (unknown.length) {
  console.error("no poster defined for: " + unknown.join(", "));
  console.error("defined: " + known.join(", "));
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const p of chosen) {
  try {
    const { svg, meta } = build({ ...p, size });
    const slug = p.plate + (p.variant ? "-" + p.variant : "");
    const f = path.join(OUT, slug + "-" + size + ".svg");
    fs.writeFileSync(f, svg);
    console.log("ok    " + slug.padEnd(30) + size.padEnd(7) +
      meta.W + "x" + meta.H + "px  QR v" + meta.qrVersion +
      "  " + meta.verified + "/" + meta.claims + " verified  " +
      Math.round(svg.length / 1024) + "KB");
  } catch (e) {
    failed++;
    console.log("FAIL  " + p.plate.padEnd(30) + e.message);
  }
}
console.log("");
console.log(failed ? failed + " poster(s) refused to build." : chosen.length + " poster(s) written to merch/posters/");
/* Exit nonzero when a poster refuses. This printed FAIL and exited 0, so a
   chained build and rasterise walked straight past a broken sheet and
   rasterised the previous one instead, which looked exactly like success. */
process.exit(failed ? 1 : 0);
