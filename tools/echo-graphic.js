/* The echo graphic, for the Facebook post.
 *
 * Three artifacts, two centuries, no lineage between any pair. The archive
 * draws them dashed and without arrowheads because an echo has no direction,
 * and the graphic says the same thing the board says.
 *
 * Drawn with the canvas 2D API rather than as an SVG on purpose. An SVG
 * rasterised through an <img> cannot reach a webfont, which is the same
 * restriction that governs the plate art, so text would fall back to
 * whatever the machine had. Drawing into a page that has already loaded
 * Poppins and IBM Plex Mono gets the real faces.
 *
 *   node tools/echo-graphic.js       then open http://localhost:4403/
 *
 * Writes merch/social/echo-<size>.png
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "merch", "social");
const PORT = 4403;
fs.mkdirSync(OUT, { recursive: true });

/* square reads best in the feed; wide is for the link card if it is wanted */
const SIZES = { square: [1080, 1080], wide: [1200, 900] };

const page = `<!doctype html><meta charset="utf-8"><title>echo graphic</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
 body{background:#0b0c10;color:#ccd1d6;font:13px/1.8 "IBM Plex Mono",monospace;padding:24px;margin:0}
 h3{color:#10b981;letter-spacing:2px;font-weight:400;margin:0 0 14px}
 b{color:#10b981} i{color:#5d636a;font-style:normal}
 canvas{max-width:520px;height:auto;margin:18px 14px 0 0;border:1px solid #2a2e34;vertical-align:top}
</style>
<h3>ECHO GRAPHIC</h3>
<div id="log"></div>
<div id="out"></div>
<script>
const SIZES = ${JSON.stringify(SIZES)};
const log = document.getElementById("log");
const say = h => { log.innerHTML += "<div>" + h + "</div>"; };

const C = {
  bg:"#0b0c10", ink:"#ccd1d6", mute:"#8f959c", faint:"#5d636a",
  green:"#10b981", rule:"#2a2e34", panel:"#101319",
};

/* The three. Wording taken from the post, which takes it from the claims. */
const NODES = [
  { year:"1740", who:"HUNTSMAN", name:"Crucible cast steel",
    line:"Sameness from the melt, not the hammer." },
  { year:"1841", who:"WHITWORTH", name:"The Whitworth thread",
    line:"Sameness from agreement, not an optimum." },
  { year:"1959", who:"PILKINGTON, BICKERSTAFF", name:"The float glass process",
    line:"Sameness from the forming, not the finishing." },
];

function wrap(x, t, max) {
  const out = []; let cur = "";
  for (const w of t.split(/\\s+/)) {
    const test = cur ? cur + " " + w : w;
    if (x.measureText(test).width > max && cur) { out.push(cur); cur = w; } else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

/* a dashed connector between two boxes, trimmed to their edges, no arrowhead */
function link(x, a, b, S) {
  const ac = { x:a.x + a.w/2, y:a.y + a.h/2 }, bc = { x:b.x + b.w/2, y:b.y + b.h/2 };
  const dx = bc.x - ac.x, dy = bc.y - ac.y, len = Math.hypot(dx, dy);
  const ux = dx/len, uy = dy/len;
  const edge = (box, cx, cy, sx, sy) => {
    /* walk from the centre to the box edge along the unit vector */
    const tx = sx ? (box.w/2 + 10*S) / Math.abs(sx) : Infinity;
    const ty = sy ? (box.h/2 + 10*S) / Math.abs(sy) : Infinity;
    const t = Math.min(tx, ty);
    return { x: cx + sx*t, y: cy + sy*t };
  };
  const p1 = edge(a, ac.x, ac.y, ux, uy);
  const p2 = edge(b, bc.x, bc.y, -ux, -uy);
  x.save();
  x.strokeStyle = C.green; x.globalAlpha = .5; x.lineWidth = 2.5*S;
  x.setLineDash([9*S, 7*S]);
  x.beginPath(); x.moveTo(p1.x, p1.y); x.lineTo(p2.x, p2.y); x.stroke();
  x.restore();
}

function box(x, b, n, S) {
  x.fillStyle = C.panel; x.strokeStyle = C.rule; x.lineWidth = 2*S;
  x.beginPath(); x.roundRect(b.x, b.y, b.w, b.h, 6*S); x.fill(); x.stroke();
  /* the left edge in green, the way a plate carries its line colour */
  x.fillStyle = C.green; x.fillRect(b.x, b.y, 4*S, b.h);

  const px = b.x + 26*S; let y = b.y + 40*S;
  x.textAlign = "left"; x.textBaseline = "alphabetic";
  x.letterSpacing = (3*S) + "px";
  x.font = "500 " + (25*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.green;
  x.fillText(n.year, px, y);

  x.letterSpacing = "0px";
  y += 40*S;
  x.font = "700 " + (30*S) + "px Poppins"; x.fillStyle = C.ink;
  for (const ln of wrap(x, n.name, b.w - 52*S)) { x.fillText(ln, px, y); y += 36*S; }
  /* the maker on its own line: two surnames will not fit beside the year */
  x.letterSpacing = (2*S) + "px";
  x.font = "400 " + (16*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.faint;
  x.fillText(n.who, px, y); y += 30*S;
  x.letterSpacing = "0px";
  x.font = "500 " + (21*S) + "px Poppins"; x.fillStyle = C.mute;
  for (const ln of wrap(x, n.line, b.w - 52*S)) { x.fillText(ln, px, y); y += 28*S; }
}

/* A webfont is only fetched when something asks for it, and canvas asking is
   not enough on its own. Without this every face fell back to a serif. */
async function fonts() {
  const want = [];
  for (const w of [500, 600, 700, 800]) want.push(w + " 40px Poppins");
  for (const w of [400, 500]) want.push(w + ' 40px "IBM Plex Mono"');
  await Promise.all(want.map(f => document.fonts.load(f, "SHANNON 1841")));
  await document.fonts.ready;
  const missing = want.filter(f => !document.fonts.check(f, "SHANNON 1841"));
  if (missing.length) say("<b style=color:#e5534b>fonts missing: "
    + missing.join(", ") + "</b> (the graphic will look wrong)");
}

async function draw(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const x = cv.getContext("2d"), S = w/1080, M = 72*S;

  x.fillStyle = C.bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = "rgba(42,46,52,.5)"; x.lineWidth = 1;
  for (let g = 0; g < w; g += 60*S) { x.beginPath(); x.moveTo(g,0); x.lineTo(g,h); x.stroke(); }
  for (let g = 0; g < h; g += 60*S) { x.beginPath(); x.moveTo(0,g); x.lineTo(w,g); x.stroke(); }

  /* header */
  let hy = M + 24*S;
  x.textBaseline = "alphabetic"; x.letterSpacing = (4*S) + "px";
  x.font = "700 " + (25*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.ink;
  x.fillText("SHANNON", M, hy);
  x.font = "400 " + (21*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.green;
  x.textAlign = "right"; x.fillText("FINDING 03 / ECHO", w - M, hy); x.textAlign = "left";
  hy += 22*S;
  x.strokeStyle = C.rule; x.lineWidth = 2*S;
  x.beginPath(); x.moveTo(M, hy); x.lineTo(w - M, hy); x.stroke();

  /* title */
  x.letterSpacing = "0px";
  let ty = hy + 68*S;
  x.font = "800 " + (50*S) + "px Poppins"; x.fillStyle = C.ink;
  for (const ln of wrap(x, "Three engineers, three centuries, and not one of them was trying to make anything stronger.", w - M*2)) {
    x.fillText(ln, M, ty); ty += 56*S;
  }
  ty += 10*S;
  x.font = "500 " + (23*S) + "px Poppins"; x.fillStyle = C.mute;
  /* One line. At two it ran into the top box. */
  for (const ln of wrap(x, "No documented line between any pair of them. Each one sold predictability.", w - M*2)) {
    x.fillText(ln, M, ty); ty += 32*S;
  }

  /* The triangle, and it is a triangle rather than a row because all three
     pairs are drawn in the archive. Out of date order on purpose: 1841 sits
     above 1740 and 1959, because an echo is not a sequence.
     Measured from the footer up, so the boxes cannot run into it. */
  const fy = h - M - 76*S;                       /* footer rule */
  const gap = 74*S;                              /* between the two lower boxes */
  const bw = (w - M*2 - gap) / 2, bh = 196*S;
  const rowY = fy - 46*S - bh;                   /* lower row sits above the rule */
  const top  = { x: (w - bw)/2, y: rowY - 112*S - bh, w: bw, h: bh };
  const left = { x: M, y: rowY, w: bw, h: bh };
  const right= { x: w - M - bw, y: rowY, w: bw, h: bh };

  /* The text is laid out downwards and the boxes upwards from the footer, so
     they meet in the middle. Say so loudly rather than shipping an overlap. */
  if (top.y < ty + 16*S)
    say("<b style=color:#e5534b>" + (w + "x" + h)
      + ": the heading runs into the top box by "
      + Math.ceil(ty + 16*S - top.y) + "px. Shorten it.</b>");

  link(x, top, left, S); link(x, top, right, S); link(x, left, right, S);
  box(x, top, NODES[1], S);      /* 1841 on top */
  box(x, left, NODES[0], S);     /* 1740 lower left */
  box(x, right, NODES[2], S);    /* 1959 lower right */

  /* One short word in the middle. The sentence that used to sit under it ran
     wide enough to cross both diagonals, so it moved to the footer. */
  x.textAlign = "center";
  x.letterSpacing = (5*S) + "px";
  x.font = "500 " + (21*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.green;
  x.fillText("ECHOES", w/2, (top.y + top.h + rowY) / 2 + 7*S);
  x.textAlign = "left";

  /* Footer, two stacked lines. Side by side they overlapped. */
  x.strokeStyle = C.rule; x.lineWidth = 2*S;
  x.beginPath(); x.moveTo(M, fy); x.lineTo(w - M, fy); x.stroke();
  x.letterSpacing = (2*S) + "px";
  x.font = "400 " + (20*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.green;
  x.fillText("DASHED, AND NO ARROWHEAD. AN ECHO HAS NO DIRECTION.", M, fy + 34*S);
  x.font = "400 " + (19*S) + 'px "IBM Plex Mono"'; x.fillStyle = C.faint;
  x.fillText("shannon.engineeringcommunity.net/#finding-echo", M, fy + 64*S);
  return cv;
}

(async () => {
  await fonts();
  for (const [tag, [w, h]] of Object.entries(SIZES)) {
    const cv = await draw(w, h);
    document.getElementById("out").appendChild(cv);
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const res = await fetch("/save/echo-" + tag + ".png",
      { method:"POST", body: await blob.arrayBuffer() });
    say((await res.text()) + " <i>" + w + "x" + h + ", "
      + Math.round(blob.size/1024) + " kb</i>");
  }
  say("<b>done.</b>");
})();
</script>`;

http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/save/")) {
    const name = path.basename(decodeURIComponent(req.url.slice(6)));
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(path.join(OUT, name), buf);
      console.log("  wrote " + name + "  " + Math.round(buf.length / 1024) + " kb");
      res.end("wrote <b>" + name + "</b>");
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(page);
}).listen(PORT, () => {
  console.log("echo graphic: open http://localhost:" + PORT + "/");
  console.log("output: " + OUT);
});
