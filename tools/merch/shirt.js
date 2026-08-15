/* SHANNON shirt generator.
 *
 * A shirt is not a small poster. It is read at three metres, on someone who
 * is moving, by a person who did not choose to read it. So the rules change:
 *
 * 1. NO GROUND. These print DTG onto dark fabric. Anything drawn on a dark
 *    rectangle prints that rectangle, so the artwork sits on nothing and the
 *    fabric is the background. Light ink only.
 * 2. ONE IDEA. A poster can hold a statement, a drawing, a ledger and a code.
 *    A shirt holds a sentence somebody can finish before the wearer walks
 *    past, and at most one thing that rewards stepping closer.
 * 3. SAME EVIDENCE RULE AS THE POSTER. Every shirt names the claims it rests
 *    on, the build looks each one up in graph.json, and it refuses to render
 *    if any is missing or is anything other than verified.
 *
 * Usage: node tools/merch/shirt.js [slug...]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(ROOT, "merch", "shirts");

/* Bella + Canvas 3001, large front print: up to 12 by 16 inches at 300 DPI.
   The width is fixed and the height is whatever the design needs. Sizing
   every file to the full 16 inches left the first draft sitting in the top
   third of its own canvas, which prints small and high on the chest, because
   the file is fitted to the print area and empty pixels are still pixels. */
const DPI = 300, HMAX = 16 * DPI;

const C = {
  ink: "#e8ebee",      /* brighter than the site's steel: fabric eats contrast */
  mid: "#9aa1a8",
  faint: "#6c737a",
  green: "#10b981",
  rust: "#9c6b6b",     /* the one that did not work, never a brand colour */
};

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function verifyClaims(claimId) {
  /* A shirt stating two facts has to cite two claims. Every id is checked and
     one bad id refuses the whole design. */
  const ids = Array.isArray(claimId) ? claimId : [claimId];
  const graph = JSON.parse(fs.readFileSync(path.join(SITE, "graph.json"), "utf8"));
  return ids.map(id => {
    const c = graph.nodes.find(n => n.id === id && n.type === "claim");
    if (!c) throw new Error("cites " + id + ", which is not in the graph");
    if (c.status !== "verified")
      throw new Error("cites " + id + ", which is " + c.status + ", not verified");
    return c;
  });
}

/* Some early plates carry no claims in the graph, only their published hook.
   The SR-71 is one. A design standing on a hook names the plate and lists the
   figures it prints, and the build checks each one appears in the hook as
   published. A paraphrase cannot be machine-checked, but a number can, and
   the numbers are what a shirt gets wrong. */
function verifyHook(plateId, facts) {
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  const i = html.indexOf('id:"' + plateId + '"');
  if (i < 0) throw new Error("no plate " + plateId + " on the site");
  const next = html.indexOf('{id:"', i + 1);
  const seg = html.slice(i, next > i ? next : i + 2600);
  if (!/status:"covered"/.test(seg))
    throw new Error(plateId + " is not a covered plate, nothing it says is published");
  const m = seg.match(/hook:"([^"]+)"/);
  if (!m) throw new Error(plateId + " has no hook");
  const hook = m[1].toUpperCase();
  for (const f of facts || [])
    if (hook.indexOf(String(f).toUpperCase()) < 0)
      throw new Error('"' + f + '" is not in the ' + plateId + " hook, so it does not ship");
  return hook;
}

/* Plate art, embedded the way the poster does it: the site's own file,
   base64, never redrawn. */
function plateArt(plateId) {
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  const i = html.indexOf('id:"' + plateId + '"');
  const next = html.indexOf('{id:"', i + 1);
  const seg = html.slice(i, next > i ? next : i + 2600);
  const href = (seg.match(/<image href="(art\/[^"]+)"/) || [])[1];
  if (!href) throw new Error(plateId + " carries no drawing of its own");
  const raw = fs.readFileSync(path.join(SITE, href));
  return {
    b64: raw.toString("base64"),
    w: raw.readUInt32BE(16), h: raw.readUInt32BE(20),
    credit: (seg.match(/artCredit:"([^"]+)"/) || [])[1] || "",
  };
}

const px = n => Math.round(n * 100) / 100;
/* Mutable on purpose: a chest mark is a 4 inch file and a back print is a 12
   inch file, and every design is written in the same 3600 unit space, so the
   build sets the physical width per design and the type scales with it. */
let W = 12 * DPI;
let u = W / 3600;
let GUT = 460 * u;                         /* the type column, both sides */

/* ---------- small drawing helpers ---------- */
const anchorX = a => a === "left" ? px(GUT) : a === "right" ? px(W - GUT) : W / 2;
const anchorA = a => a === "left" ? "start" : a === "right" ? "end" : "middle";

const P = (size, weight, fill, y, text, a) =>
  `<text x="${anchorX(a)}" y="${px(y)}" text-anchor="${anchorA(a)}"
    font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="${weight}"
    font-size="${px(size)}" fill="${fill}">${esc(text)}</text>`;

const M = (size, fill, y, text, a, track) =>
  `<text x="${anchorX(a)}" y="${px(y)}" text-anchor="${anchorA(a)}"
    font-family="IBM Plex Mono, monospace" font-size="${px(size)}"
    letter-spacing="${px((track === undefined ? 4 : track) * u)}" fill="${fill}">${esc(text)}</text>`;

/* the receipt: the archive, and what the shirt stands on. Claim ids where
   they exist; the plate itself where the design rests on a published hook. */
function footer(parts, y, s) {
  const bits = [];
  if (s.claimId) bits.push(...(Array.isArray(s.claimId) ? s.claimId : [s.claimId]));
  if (s.hookOf) bits.push(s.hookOf + " PLATE");
  parts.push(M(30 * u, C.faint, y, "SHANNON", "center", 9));
  parts.push(M(24 * u, C.faint, y + 44 * u, bits.join("   ").toUpperCase(), "center", 4));
}

/* a two column row with a rule under it */
function row(parts, y, left, right, rightColour) {
  parts.push(M(60 * u, C.faint, y, left, "left", 3));
  parts.push(M(60 * u, rightColour || C.mid, y, right, "right", 3));
  parts.push(`<line x1="${px(GUT)}" y1="${px(y + 30 * u)}" x2="${px(W - GUT)}" y2="${px(y + 30 * u)}"
    stroke="${C.faint}" stroke-width="${px(3 * u)}" opacity="0.45"/>`);
  return y + 118 * u;
}

/* ---------- the designs ---------- */
const SHIRTS = {

  /* 1. A STATEMENT. No drawing. The sentence is the object, and it is true of
     far more than surface plates, which is why it travels off the shirt. */
  "two-surfaces": {
    claimId: "c-whitworth-three-plate-method-03",
    name: "Two surfaces",
    draw(parts) {
      let y = 300 * u;
      for (const ln of ["TWO SURFACES", "CAN AGREE", "AND BOTH", "BE WRONG"]) {
        parts.push(P(300 * u, 800, C.ink, y, ln));
        y += 300 * u * 1.06;
      }
      /* the mechanism, small, for whoever steps closer: three plates, and the
         rotation that stops any one plate's error from surviving */
      y += 130 * u;
      const r = 96 * u, gap = 310 * u, cy = y + r;
      ["A", "B", "C"].forEach((tag, i) => {
        const cx = W / 2 + (i - 1) * gap;
        parts.push(`<circle cx="${px(cx)}" cy="${px(cy)}" r="${px(r)}" fill="none"
          stroke="${C.mid}" stroke-width="${px(7 * u)}"/>`);
        parts.push(`<text x="${px(cx)}" y="${px(cy + 30 * u)}" text-anchor="middle"
          font-family="IBM Plex Mono, monospace" font-size="${px(78 * u)}" fill="${C.mid}">${tag}</text>`);
      });
      parts.push(M(54 * u, C.green, cy + r + 108 * u, "A:B   B:C   C:A", "center", 8));
      return cy + r + 160 * u;
    },
  },

  /* 2. A FAILURE. The shirt is the arithmetic. Every number on it is correct,
     which is the whole point: the error was underneath all of them. */
  "wrong-number": {
    claimId: "c-air-canada-143-gimli-07",
    name: "Nobody used the wrong number",
    draw(parts) {
      let y = 300 * u;
      for (const ln of ["NOBODY USED", "THE WRONG", "NUMBER"]) {
        parts.push(P(322 * u, 800, C.ink, y, ln));
        y += 322 * u * 1.06;
      }
      y += 150 * u;
      y = row(parts, y, "THE SHORTFALL", "AGREED", C.green);
      y = row(parts, y, "THE VOLUME TO ADD", "AGREED", C.green);
      y = row(parts, y, "THE RECHECK AT OTTAWA", "AGREED", C.green);
      y += 40 * u;
      parts.push(P(72 * u, 600, C.ink, y, "The error sat in the conversion"));
      y += 92 * u;
      parts.push(P(72 * u, 600, C.ink, y, "beneath all of them."));
      return y + 60 * u;
    },
  },

  /* 3. A MECHANISM. Almost no words. A section through the tin bath, which is
     the whole invention in one horizontal line. */
  "inherited-flat": {
    claimId: "c-float-glass-process-02",
    name: "Flatness is inherited",
    draw(parts) {
      let y = 300 * u;
      for (const ln of ["FLATNESS", "IS INHERITED"]) {
        parts.push(P(340 * u, 800, C.ink, y, ln));
        y += 340 * u * 1.06;
      }
      y += 40 * u;
      parts.push(P(96 * u, 600, C.mid, y, "not imposed"));
      y += 250 * u;

      const L = 500 * u, R = W - 500 * u;
      parts.push(`<text x="${px(L)}" y="${px(y - 44 * u)}" font-family="IBM Plex Mono, monospace"
        font-size="${px(50 * u)}" letter-spacing="${px(5 * u)}" fill="${C.mid}">GLASS</text>`);
      parts.push(`<rect x="${px(L)}" y="${px(y)}" width="${px(R - L)}" height="${px(56 * u)}"
        fill="none" stroke="${C.ink}" stroke-width="${px(8 * u)}"/>`);
      const ty = y + 56 * u;
      parts.push(`<rect x="${px(L)}" y="${px(ty)}" width="${px(R - L)}" height="${px(156 * u)}"
        fill="none" stroke="${C.green}" stroke-width="${px(8 * u)}"/>`);
      let hatch = "";
      for (let x0 = L + 46 * u; x0 < R - 30 * u; x0 += 78 * u)
        hatch += `<line x1="${px(x0)}" y1="${px(ty + 156 * u)}" x2="${px(Math.min(x0 + 62 * u, R))}" y2="${px(ty)}"/>`;
      parts.push(`<g stroke="${C.green}" stroke-width="${px(4 * u)}" opacity="0.5">${hatch}</g>`);
      const by = ty + 156 * u + 80 * u;
      parts.push(`<text x="${px(L)}" y="${px(by)}" font-family="IBM Plex Mono, monospace"
        font-size="${px(50 * u)}" letter-spacing="${px(5 * u)}" fill="${C.green}">MOLTEN TIN</text>`);
      parts.push(`<text x="${px(R)}" y="${px(by)}" text-anchor="end" font-family="IBM Plex Mono, monospace"
        font-size="${px(50 * u)}" letter-spacing="${px(5 * u)}" fill="${C.mid}">LEVEL</text>`);
      return by + 60 * u;
    },
  },

  /* 4. KELLY. The one about a person being wrong. Johnson fought the C-130
     because he believed speed was aviation's future, then flew chase on its
     first flight, and it outlasted everything he was right about. */
  "tried-to-kill": {
    claimId: ["c-c130-10", "c-c130-11"],
    name: "The aircraft he tried to kill",
    draw(parts) {
      let y = 300 * u;
      for (const ln of ["HE FLEW CHASE", "ON THE AIRCRAFT", "HE TRIED TO KILL"]) {
        parts.push(P(268 * u, 800, C.ink, y, ln));
        y += 268 * u * 1.08;
      }
      y += 150 * u;
      y = row(parts, y, "PILOT", "KELLY JOHNSON");
      y = row(parts, y, "FLYING", "A P2V NEPTUNE");
      y = row(parts, y, "CHASING", "THE C-130");
      y += 46 * u;
      parts.push(P(70 * u, 600, C.green, y, "Still in production, seventy years on."));
      return y + 60 * u;
    },
  },

  /* 5. KELLY. The fix. A hinged elevator sits in air the shock has already
     separated. The whole stabilizer reaches forward of it. Two small side
     views say that faster than a sentence can. */
  "whole-tail": {
    claimId: ["c-bell-x-1-09", "c-bell-x-1-11"],
    name: "Move the whole tail",
    draw(parts) {
      let y = 300 * u;
      for (const ln of ["MOVE THE", "WHOLE TAIL"]) {
        parts.push(P(360 * u, 800, C.ink, y, ln));
        y += 360 * u * 1.06;
      }
      y += 180 * u;
      const top = y, h = 210 * u, w = 600 * u;
      const tail = (cx, label, colour, moving) => {
        const x0 = cx - w / 2, yb = top + h;
        parts.push(`<path d="M${px(x0)} ${px(yb)} L${px(x0 + w * 0.52)} ${px(yb)}
          L${px(x0 + w * 0.40)} ${px(top)} L${px(x0 + w * 0.16)} ${px(top)} Z"
          fill="none" stroke="${C.mid}" stroke-width="${px(7 * u)}"/>`);
        const hinge = moving ? 0.52 : 0.78;
        if (!moving) {
          parts.push(`<path d="M${px(x0 + w * 0.52)} ${px(yb)} L${px(x0 + w * 0.78)} ${px(yb)}"
            stroke="${C.mid}" stroke-width="${px(7 * u)}" fill="none"/>`);
        }
        parts.push(`<path d="M${px(x0 + w * hinge)} ${px(yb)} L${px(x0 + w)} ${px(yb - 52 * u)}"
          stroke="${colour}" stroke-width="${px(14 * u)}" fill="none" stroke-linecap="round"/>`);
        parts.push(`<circle cx="${px(x0 + w * hinge)}" cy="${px(yb)}" r="${px(16 * u)}" fill="${colour}"/>`);
        parts.push(`<text x="${px(cx)}" y="${px(yb + 100 * u)}" text-anchor="middle"
          font-family="IBM Plex Mono, monospace" font-size="${px(50 * u)}"
          letter-spacing="${px(4 * u)}" fill="${colour}">${esc(label)}</text>`);
      };
      tail(W * 0.29, "HINGED", C.rust, false);
      tail(W * 0.71, "ALL MOVING", C.green, true);
      y = top + h + 210 * u;
      for (const ln of ["The full surface reaches flow", "ahead of the shock."]) {
        parts.push(P(66 * u, 600, C.ink, y, ln));
        y += 84 * u;
      }
      y += 50 * u;
      parts.push(M(46 * u, C.faint, y, "F-100  F-104  F-4  F-15  F-16", "center", 7));
      return y + 50 * u;
    },
  },

  /* 6. KELLY. A specification and its consequence. The number is the hook.
     The offset nose gear is the part almost nobody knows. */
  "recoil": {
    claimId: ["c-a10-recoil", "c-a10-gear"],
    name: "More recoil than thrust",
    draw(parts) {
      let y = 340 * u;
      parts.push(P(460 * u, 800, C.ink, y, "10,000 LB"));
      y += 460 * u * 1.04;
      parts.push(P(300 * u, 800, C.ink, y, "OF RECOIL"));
      y += 300 * u * 1.12;
      parts.push(P(80 * u, 600, C.green, y, "More than one engine makes thrust."));
      y += 220 * u;
      const cx = W / 2, half = 940 * u;
      parts.push(`<text x="${px(cx - half)}" y="${px(y - 54 * u)}" font-family="IBM Plex Mono, monospace"
        font-size="${px(44 * u)}" letter-spacing="${px(4 * u)}" fill="${C.ink}">BARREL ON CENTERLINE</text>`);
      parts.push(`<line x1="${px(cx - half)}" y1="${px(y)}" x2="${px(cx + half)}" y2="${px(y)}"
        stroke="${C.mid}" stroke-width="${px(6 * u)}" stroke-dasharray="${px(26 * u)} ${px(20 * u)}"/>`);
      parts.push(`<circle cx="${px(cx)}" cy="${px(y)}" r="${px(28 * u)}" fill="none"
        stroke="${C.ink}" stroke-width="${px(8 * u)}"/>`);
      parts.push(`<circle cx="${px(cx + 168 * u)}" cy="${px(y)}" r="${px(18 * u)}" fill="${C.green}"/>`);
      parts.push(`<text x="${px(cx + half)}" y="${px(y + 92 * u)}" text-anchor="end"
        font-family="IBM Plex Mono, monospace" font-size="${px(44 * u)}"
        letter-spacing="${px(4 * u)}" fill="${C.green}">NOSE GEAR OFFSET</text>`);
      return y + 130 * u;
    },
  },
  /* 7a. SR-71 front. A chest mark, not a billboard: the number worn quietly,
     with the contradiction in small type underneath. Whoever reads the second
     line gets the story from the wearer, which is the point of a front. */
  "no-starter-front": {
    hookOf: "sr-71",
    hookFacts: ["MACH 3.2"],
    name: "No starter, the chest mark",
    widthIn: 4.4,
    noFooter: true,
    draw(parts) {
      let y = 430 * u;
      /* display tightened: at this size Poppins 800 needs negative tracking
         or the digits drift apart */
      parts.push(`<text x="${W / 2}" y="${px(y)}" text-anchor="middle"
        font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${px(560 * u)}" letter-spacing="${px(-8 * u)}" fill="${C.ink}">MACH 3.2</text>`);
      y += 110 * u;
      parts.push(`<line x1="${px(W / 2 - 1290 * u)}" y1="${px(y)}" x2="${px(W / 2 + 1290 * u)}" y2="${px(y)}"
        stroke="${C.green}" stroke-width="${px(16 * u)}"/>`);
      y += 210 * u;
      parts.push(M(128 * u, C.mid, y, "AND NO STARTER", "center", 26));
      return y + 30 * u;
    },
  },

  /* 7b. SR-71 back. The argument, for everyone behind the wearer. Headline
     lines are cut to seventeen characters each so the rag is a straight
     deliberate edge, not an accident. The spec rows carry the punchline and
     the hem carries the receipt. */
  "no-starter-back": {
    hookOf: "sr-71",
    hookFacts: ["MACH 3.2", "TWO BUICK V8", "600"],
    name: "No starter, the back",
    draw(parts) {
      let y = 300 * u;
      for (const ln of ["THE FASTEST THING", "ON THE FLIGHTLINE", "WAS PUSH-STARTED."]) {
        parts.push(`<text x="${W / 2}" y="${px(y)}" text-anchor="middle"
          font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="800"
          font-size="${px(270 * u)}" letter-spacing="${px(-4 * u)}" fill="${C.ink}">${esc(ln)}</text>`);
        y += 270 * u * 1.12;
      }
      y += 170 * u;
      y = row(parts, y, "CRUISE", "MACH 3.2");
      y = row(parts, y, "STARTER ABOARD", "NONE", C.rust);
      y = row(parts, y, "START CART", "TWO BUICK V8s", C.green);
      y = row(parts, y, "CART OUTPUT", "600+ HP", C.green);
      return y + 30 * u;
    },
  },

  /* 8a. SR-71 planform front. The designation alone. The person this shirt
     is for does not need it explained, and that is who it is for. */
  "planform-front": {
    hookOf: "sr-71",
    hookFacts: [],
    name: "Planform, the chest mark",
    widthIn: 3.4,
    noFooter: true,
    draw(parts) {
      let y = 320 * u;
      parts.push(M(340 * u, C.ink, y, "SR-71", "center", 60));
      y += 120 * u;
      parts.push(`<line x1="${px(W / 2 - 700 * u)}" y1="${px(y)}" x2="${px(W / 2 + 700 * u)}" y2="${px(y)}"
        stroke="${C.green}" stroke-width="${px(18 * u)}"/>`);
      return y + 40 * u;
    },
  },

  /* 8. SR-71. The quiet one. The aircraft itself, from NASA's own three
     view, treated as a drawing rather than a hero shot. For the wearer who
     does not need the name explained. */
  "three-view": {
    hookOf: "sr-71",
    hookFacts: [],
    name: "The planform",
    draw(parts) {
      const art = plateArt("sr-71");
      /* NASA's file stacks the three views, so it is far taller than wide.
         Sized by height or it runs off the garment. */
      const drawH = 3300 * u, drawW = drawH * (art.w / art.h);
      let y = 260 * u;
      parts.push(`<image x="${px((W - drawW) / 2)}" y="${px(y)}" width="${px(drawW)}"
        height="${px(drawH)}" href="data:image/png;base64,${art.b64}"/>`);
      y += drawH + 120 * u;
      parts.push(M(64 * u, C.ink, y, "SR-71", "center", 14));
      y += 76 * u;
      parts.push(M(38 * u, C.faint, y, art.credit.replace(/\.\s*$/, "").toUpperCase(), "center", 5));
      return y + 40 * u;
    },
  },

};

/* ---------- build ---------- */
function build(slug) {
  const s = SHIRTS[slug];
  if (!s) throw new Error("no shirt called " + slug);
  if (!s.claimId && !s.hookOf) throw new Error(slug + " stands on nothing: no claims, no hook");
  if (s.claimId) verifyClaims(s.claimId);
  if (s.hookOf) verifyHook(s.hookOf, s.hookFacts);
  /* the design's physical width, and everything scales with it */
  W = Math.round((s.widthIn || 12) * DPI);
  u = W / 3600;
  GUT = 460 * u;
  const parts = [];
  const end = s.draw(parts);
  let H;
  if (s.noFooter) {
    /* a chest mark carries no receipt: at three inches wide the receipt
       would be illegible ink, and the back of the same shirt carries it */
    H = Math.round(end + 120 * u);
  } else {
    footer(parts, end + 160 * u, s);
    H = Math.round(end + 160 * u + 44 * u + 120 * u);
  }
  if (H > HMAX)
    throw new Error("design is " + (H / DPI).toFixed(1) + "in tall, over the 16in print area");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${(W / DPI).toFixed(2)}in" height="${(H / DPI).toFixed(2)}in"
  viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
<title>SHANNON shirt: ${esc(s.name)}</title>
<style>@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;800&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap");</style>
${parts.join("\n")}
</svg>`;
  return { svg, name: s.name, W, H };
}

module.exports = { build, SHIRTS };

if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHIRTS);
  let failed = 0;
  for (const slug of want) {
    try {
      const r = build(slug);
      fs.writeFileSync(path.join(OUT, slug + ".svg"), r.svg);
      console.log("ok    " + slug.padEnd(16) + r.name.padEnd(32)
        + (r.W / DPI).toFixed(0) + "x" + (r.H / DPI).toFixed(1) + "in");
    } catch (e) { failed++; console.log("FAIL  " + slug.padEnd(16) + e.message); }
  }
  console.log("");
  console.log(failed ? failed + " shirt(s) refused to build."
    : want.length + " shirt(s) written to merch/shirts/");
  process.exit(failed ? 1 : 0);
}
