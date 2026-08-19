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
  sub: "#bcc3ca",     /* a second line that still has to read across a room */
  faint: "#8f979e",    /* the quiet register, but 6c737a measured 3.9 to 1 on
                          black fabric, which is a line nobody can read once
                          the ink has spread. This measures 6.4. */
  green: "#10b981",
  rust: "#b58080",     /* the one that did not work, never a brand colour */
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

/* The same drawing as outlines, for anything printed large. The site's file
   is web resolution, so a drawing worn at a foot tall would go to the
   printer at eighty DPI. tools/art-trace.js traces the ink and writes the
   outlines to merch/art-print, and a design that wants the drawing big asks
   for it here. The credit still comes off the plate, so it cannot drift from
   what the site says. */
function plateVector(plateId) {
  const f = path.join(ROOT, "merch", "art-print", plateId + ".svg");
  if (!fs.existsSync(f))
    throw new Error(plateId + " has no traced drawing. Run: node tools/art-trace.js site/art/"
      + plateId + ".png merch/art-print/" + plateId + ".svg");
  const svg = fs.readFileSync(f, "utf8");
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const d = (svg.match(/<path[^>]*\sd="([^"]+)"/) || [])[1];
  if (!vb || !d) throw new Error("the traced drawing for " + plateId + " has no outlines");
  return { d, w: +vb[1], h: +vb[2], credit: plateArt(plateId).credit };
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

/* Letter spacing in SVG is added after the last glyph as well as between
   them, so a centred line carries half a space of dead air on its right and
   sits that far left of where it looks like it should. At the tracking a
   chest mark uses that is a visible shove, and the rule underneath, which is
   drawn symmetrically, stops lining up with the word above it. Centred lines
   are nudged back by half a space. */
const M = (size, fill, y, text, a, track) => {
  const t = (track === undefined ? 4 : track) * u;
  const x = a === "left" || a === "right" ? anchorX(a) : px(anchorX(a) + t / 2);
  return `<text x="${x}" y="${px(y)}" text-anchor="${anchorA(a)}"
    font-family="IBM Plex Mono, monospace" font-size="${px(size)}"
    letter-spacing="${px(t)}" fill="${fill}">${esc(text)}</text>`;
};

/* The chine. The SR-71's defining line is not a stripe, it is a knife edge
   that runs out from the nose and tapers to nothing at both ends. A plain
   rectangular rule under a headline says nothing. The same rule cut to that
   taper says aircraft without the type having to dress up as one, and it
   prints as one clean shape rather than as a hairline that DTG can lose. */
const chine = (y, half, thick, fill, cx) => {
  const x = cx === undefined ? W / 2 : cx;
  return `<path d="M${px(x - half)} ${px(y)} L${px(x)} ${px(y - thick / 2)}
    L${px(x + half)} ${px(y)} L${px(x)} ${px(y + thick / 2)} Z" fill="${fill}"/>`;
};

/* The aircraft itself, placed. Height in canvas units, centred on cx, from
   the traced outlines so it is sharp at any size. */
function planform(parts, cx, top, h, fill, opacity) {
  const art = plateVector("sr-71");
  const k = h / art.h, w = art.w * k;
  parts.push(`<g transform="translate(${px(cx - w / 2)} ${px(top)}) scale(${k.toFixed(5)})"${
    opacity === undefined ? "" : ` opacity="${opacity}"`}>
    <path fill="${fill}" fill-rule="evenodd" d="${art.d}"/></g>`);
  return { w, h, bottom: top + h };
}

/* the receipt: the archive, and what the shirt stands on. Claim ids where
   they exist; the plate itself where the design rests on a published hook. */
function footer(parts, y, s) {
  const bits = [];
  if (s.claimId) bits.push(...(Array.isArray(s.claimId) ? s.claimId : [s.claimId]));
  if (s.hookOf) bits.push(s.hookOf + " PLATE");
  /* 30 and 24 units are 7.2pt and 5.8pt at 300 DPI. A shirt is not a page:
     light ink on dark cotton spreads, and under about 9pt the receipt closes
     up into a grey smudge. These are 11pt and 9.1pt. */
  parts.push(M(46 * u, C.faint, y, "SHANNON", "center", 11));
  parts.push(M(38 * u, C.faint, y + 66 * u, bits.join("   ").toUpperCase(), "center", 5));
  /* A drawing carries its credit on the garment, not on the file. The chest
     mark on the front of this shirt prints the NASA planform, and a credit
     set small enough to fit a chest mark is a credit nobody can read, so the
     back of the same shirt carries it. */
  if (s.credit) parts.push(M(38 * u, C.faint, y + 124 * u, s.credit.toUpperCase(), "center", 5));
}

/* a two column row with a rule under it */
/* the label used to sit at C.faint, which is fine on a screen and thin
   on fabric. A spec row nobody can read from a metre away is decoration. */
function row(parts, y, left, right, rightColour) {
  parts.push(M(60 * u, C.mid, y, left, "left", 3));
  parts.push(M(60 * u, rightColour || C.mid, y, right, "right", 3));
  parts.push(`<line x1="${px(GUT)}" y1="${px(y + 30 * u)}" x2="${px(W - GUT)}" y2="${px(y + 30 * u)}"
    stroke="${C.mid}" stroke-width="${px(3.5 * u)}" opacity="0.6"/>`);
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
      /* 460 unit caps on a 340 unit baseline left nine units of headroom, and
         the round shoulders of the zeros overshoot the cap line, so the top of
         this line was printing shaved. The rasteriser catches it now. */
      let y = 440 * u;
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
  /* 7a. SR-71 front. The aircraft, then the two facts that have no business
     sitting together. The old version whispered the punchline in mono under a
     bar rule, which is the wrong way round: "AND NO STARTER" is the reason
     anybody reads the shirt twice, so it is set in the same weight as the
     number it contradicts and the two are cut apart by a chine rather than by
     a rectangle. */
  "no-starter-front": {
    hookOf: "sr-71",
    hookFacts: ["MACH 3.2", "NO INTERNAL STARTER"],
    name: "No starter, the chest mark",
    /* 5.6in is an honest chest mark and reads small on a body. Fai had the old
       file stretched to 10.51in, which printed at 126 DPI, under Printful own
       floor. Generated at 8in instead, so it is big and still 300 DPI. */
    widthIn: 8,
    noFooter: true,
    draw(parts) {
      let y = 150 * u;
      const air = planform(parts, W / 2, y, 880 * u, C.ink);
      /* a text y is a baseline, and Poppins caps stand about 0.72 of the size
         above it. Spacing off the baseline put the tail of the aircraft
         through the top of the H. */
      const mach = 540 * u;
      y = air.bottom + mach * 0.72 + 120 * u;
      parts.push(`<text x="${W / 2}" y="${px(y)}" text-anchor="middle"
        font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${px(mach)}" letter-spacing="${px(-14 * u)}" fill="${C.ink}">MACH 3.2</text>`);
      y += 118 * u;
      parts.push(chine(y, 1240 * u, 34 * u, C.green));
      y += 268 * u;
      parts.push(`<text x="${W / 2}" y="${px(y)}" text-anchor="middle"
        font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${px(206 * u)}" letter-spacing="${px(12 * u)}" fill="${C.sub}">AND NO INTERNAL STARTER</text>`);
      return y + 60 * u;
    },
  },

  /* 7b. SR-71 back. The two published numbers, put in one another's way. The
     old back explained the joke across three lines of headline and then set
     the evidence in a table nobody needed by then. This states the collision
     in two lines, gives the reason in one, and lets the block underneath put
     the air and the ground in the same column, which is the whole story. */
  "no-starter-back": {
    hookOf: "sr-71",
    claimId: ["c-sr71-01"],
    hookFacts: ["THE SR-71", "MACH 3.2", "NO INTERNAL STARTER", "TO START",
                 "A CART", "TWO BUICK V8s", "BUICK", "600+ HP"],
    credit: "NASA Dryden 3-view, public domain",
    name: "No starter, the back",
    /* Nothing is said twice. The headline had MACH 3.2 in it and so did the
       block underneath, and 600+ HP appeared in both, which meant the block
       was decoration rather than evidence. Now the headline carries the
       collision, and every row below it adds something the headline does not:
       the speed, the reason a cart was needed at all, and what was in it. */
    draw(parts) {
      let y = 340 * u;
      for (const ln of ["600+ HP OF BUICK", "TO START THE SR-71."]) {
        parts.push(`<text x="${W / 2}" y="${px(y)}" text-anchor="middle"
          font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="800"
          font-size="${px(292 * u)}" letter-spacing="${px(-6 * u)}" fill="${C.ink}">${esc(ln)}</text>`);
        y += 292 * u * 1.13;
      }
      y += 170 * u;
      parts.push(chine(y, 1420 * u, 30 * u, C.green));
      y += 230 * u;
      y = row(parts, y, "CRUISE", "MACH 3.2");
      y = row(parts, y, "RECORD ALTITUDE", "85,069 FT");
      y = row(parts, y, "INTERNAL STARTER", "NONE", C.rust);
      y = row(parts, y, "GROUND START", "TWO BUICK V8s", C.green);
      return y + 30 * u;
    },
  },

  /* 8a. SR-71 planform front. The designation alone. The person this shirt
     is for does not need it explained, and that is who it is for. */
  "planform-front": {
    hookOf: "sr-71",
    hookFacts: [],
    name: "Planform, the chest mark",
    /* 6in, because that is the size it actually prints at on the shirt, and a
       file generated at its printed size is a file at 300 DPI */
    widthIn: 6,
    noFooter: true,
    draw(parts) {
      /* The designation was set in the mono, which is the archive's reading
         face and reads as a caption, not as a mark. In Poppins 800, tracked
         open just enough to stop the digits closing up, it is a badge. */
      const mark = 500 * u;
      /* a baseline is not a top. Poppins caps stand about 0.72 of the size above
         it, so a 500 unit mark on a 330 unit baseline had its head off the sheet. */
      let y = mark * 0.72 + 110 * u;
      parts.push(`<text x="${W / 2}" y="${px(y)}" text-anchor="middle"
        font-family="Poppins, Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${px(mark)}" letter-spacing="${px(26 * u)}" fill="${C.ink}">SR-71</text>`);
      y += 128 * u;
      parts.push(chine(y, 900 * u, 30 * u, C.green));
      return y + 60 * u;
    },
  },

  /* 8. SR-71 back. The aircraft itself, from NASA's own drawing, treated as
     a drawing rather than a hero shot. The planform is long and narrow, so
     it is sized by height and runs almost the full back: at a foot tall it
     is read across a room, which is what a back is for. Printed from traced
     outlines rather than the site's raster, because the site's file is 469
     pixels wide and this is a foot of fabric. */
  "three-view": {
    hookOf: "sr-71",
    hookFacts: [],
    name: "The planform, the back",
    draw(parts) {
      const art = plateVector("sr-71");
      const drawH = 3600 * u, drawW = drawH * (art.w / art.h);
      const k = drawH / art.h;
      let y = 180 * u;
      parts.push(`<g transform="translate(${px((W - drawW) / 2)} ${px(y)}) scale(${k.toFixed(5)})">
        <path fill="${C.ink}" fill-rule="evenodd" d="${art.d}"/></g>`);
      y += drawH + 150 * u;
      parts.push(M(78 * u, C.ink, y, "SR-71", "center", 18));
      y += 96 * u;
      parts.push(M(40 * u, C.faint, y, art.credit.replace(/\.\s*$/, "").toUpperCase(), "center", 5));
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
    footer(parts, end + 170 * u, s);
    H = Math.round(end + 170 * u + (s.credit ? 124 : 66) * u + 130 * u);
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
      /* the physical size to a tenth: these numbers get typed into Printful,
         so a rounded width is a wrongly sized shirt */
      console.log("ok    " + slug.padEnd(16) + r.name.padEnd(32)
        + (r.W / DPI).toFixed(1) + " x " + (r.H / DPI).toFixed(1) + " in   "
        + r.W + "x" + r.H + "px at " + DPI + " DPI");
    } catch (e) { failed++; console.log("FAIL  " + slug.padEnd(16) + e.message); }
  }
  console.log("");
  console.log(failed ? failed + " shirt(s) refused to build."
    : want.length + " shirt(s) written to merch/shirts/");
  process.exit(failed ? 1 : 0);
}
