/* The poster set. Each entry names the verified claim it stands on; the
   builder refuses to render one that does not, so a poster cannot outrun the
   archive. Statements are written for a wall, not for a feed: a hook plants a
   question the caption answers, and a poster has no caption. */
const fs = require("fs");
const path = require("path");
const { build } = require("./poster.js");

const OUT = path.join(__dirname, "..", "..", "merch", "posters");
const ART = process.env.SHANNON_FULLRES || "";

const POSTERS = [
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
fs.mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const p of POSTERS) {
  try {
    const { svg, meta } = build({ ...p, size });
    const f = path.join(OUT, p.plate + "-" + size + ".svg");
    fs.writeFileSync(f, svg);
    console.log("ok    " + p.plate.padEnd(30) + size.padEnd(7) +
      meta.W + "x" + meta.H + "px  QR v" + meta.qrVersion +
      "  " + meta.verified + "/" + meta.claims + " verified  " +
      Math.round(svg.length / 1024) + "KB");
  } catch (e) {
    failed++;
    console.log("FAIL  " + p.plate.padEnd(30) + e.message);
  }
}
console.log("");
console.log(failed ? failed + " poster(s) refused to build." : POSTERS.length + " posters written to merch/posters/");
