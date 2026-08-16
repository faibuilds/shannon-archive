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
    plate: "diesel-engine",
    claimId: "c-diesel-04",
    fullResArt: path.join(ART, "diesel-engine.png"),
    statement: "The air is the spark",
    sub: "No spark plug anywhere in it. Air compressed far enough is hot enough to light the injected fuel on its own.",
    statementSize: 176,
  },
  {
    /* The hook sheet. The plate's own published hook, the figures under it,
       and nothing else. For a wall where the words are the object. */
    plate: "diesel-engine",
    variant: "hook",
    claimId: "c-diesel-02",
    useHook: true,
    noArt: true,
    qrBox: 760,
    /* the hook is the object on this sheet, so it carries the space */
    statementPer: 19,
    statementSize: 186,
    facts: [
      ["FIRST RUN", "17 FEBRUARY 1897", "c-diesel-03"],
      ["BUILT AT", "MASCHINENFABRIK AUGSBURG", "c-diesel-03"],
      ["IGNITION", "COMPRESSION, NO SPARK", "c-diesel-04"],
      ["EFFICIENCY", "26% AGAINST STEAM'S 10%", "c-diesel-02"],
      ["OUTPUT", "ABOUT 20 HORSEPOWER", "c-diesel-05"],
      ["HEIGHT", "ABOUT TEN FEET", "c-diesel-05"],
      ["MASS", "ABOUT FIVE TONNES", "c-diesel-05"],
      ["DIESEL", "LOST AT SEA, 1913", "c-diesel-09"],
    ],
  },
  {
    plate: "float-glass-process",
    claimId: "c-float-glass-process-02",
    statement: "Fifty-six years between the patent and the glass",
    sub: "The principle was patented in 1902. The line that ran on it arrived in 1959.",
    fullResArt: path.join(ART, "fig8-full.png"),
    artWidth: 0.72,
  },
  {
    plate: "whitworth-three-plate-method",
    claimId: "c-whitworth-three-plate-method-03",
    statement: "Two surfaces can agree and both be wrong",
    sub: "So he used three, scraped in rotating pairs until flatness was the only shape left standing.",
    statementSize: 158,
  },
  {
    plate: "air-canada-143-gimli",
    claimId: "c-air-canada-143-gimli-07",
    statement: "Nobody used the wrong number",
    sub: "Every figure agreed with every other figure. The error sat in the conversion beneath all of them.",
    statementSize: 172,
  },
  {
    plate: "brooklyn-bridge",
    claimId: "c-bb-13",
    statement: "The wire is still in the cables",
    sub: "It could not come out. So the cables were built stronger than the fraud could weaken them.",
    statementSize: 168,
  },
  {
    plate: "crucible-cast-steel",
    claimId: "c-crucible-cast-steel-03",
    statement: "Forging improves one bar. Melting treats the whole charge.",
    sub: "A clockmaker who could not rely on the steel he could buy melted it in a clay pot.",
    statementSize: 132,
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
