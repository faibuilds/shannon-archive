#!/usr/bin/env node
// SHANNON pre-commit verification gate. No dependencies, plain Node.
// Enforces the constitution's checks in CLAUDE.md. Exits nonzero on any
// failure. Each check prints PASS or FAIL with detail. Run before commit.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "site");
const INDEX = path.join(SITE, "index.html");
const GRAPH = path.join(SITE, "graph.json");
const STATUS = path.join(SITE, "status.json");

let failed = 0;
function pass(name, detail) {
  console.log("PASS  " + name + (detail ? "  " + detail : ""));
}
function fail(name, detail) {
  failed++;
  console.log("FAIL  " + name + (detail ? "  " + detail : ""));
}

// Skip binary assets: their raw bytes are not text characters.
const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".otf", ".pdf", ".zip",
]);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// Extract a balanced JS array/object literal starting at `start` (index of
// the opening bracket), respecting string literals and escapes. Returns the
// literal text including its brackets. Used to lift AIRCRAFT out of the page
// without executing the whole inline script.
function extractLiteral(src, start) {
  const open = src[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0, i = start, quote = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("unbalanced literal starting at " + start);
}

// ---------------------------------------------------------------------------
// Check 1: No em-dash (U+2014) anywhere under /site (text files only).
// ---------------------------------------------------------------------------
(function checkEmDash() {
  const name = "em-dash: no U+2014 under /site";
  const hits = [];
  for (const file of walk(SITE)) {
    if (BINARY_EXT.has(path.extname(file).toLowerCase())) continue;
    const text = fs.readFileSync(file, "utf8");
    const idx = text.indexOf("—");
    if (idx >= 0) {
      const line = text.slice(0, idx).split("\n").length;
      hits.push(path.relative(ROOT, file) + ":" + line);
    }
  }
  if (hits.length) fail(name, "found in " + hits.join(", "));
  else pass(name);
})();

// Read the primary page once for the remaining checks.
const html = fs.readFileSync(INDEX, "utf8");

// ---------------------------------------------------------------------------
// Check 2: Privacy gate. Named surnames and exact strings must not appear
// in index.html. Surnames match case-insensitively on word boundaries (so
// "Aven" does not trip on "Avenger"); exact strings match verbatim.
// ---------------------------------------------------------------------------
(function checkPrivacy() {
  const name = "privacy: no gated names in index.html";
  // Not-yet-consented names only. A person moves off this list when Fai
  // states they consented and their remark is unsealed with cleared:true.
  // Consented so far: Lee Hearn, Neil Wilkins, Roger Griffiths (07.2026).
  const surnames = [
    "Ferretti", "Hindman", "Aven", "Aiken",
    "Bolton", "Donahue", "Bourquin", "Palermo", "Pickard", "McNaught",
    "Swatman", "Donley", "Partain", "Lakshmi", "Markos",
  ];
  const exacts = [
    "Jim Roberts", "Les Hayes", "Colin Rose", "Kev Senior",
    "Greg Davis", "James Dyson", "Thomas Russell", "Andrew Cox",
    "Daniel Gear", "Allen Crane", "robert ley",
  ];
  const hits = [];
  for (const s of surnames) {
    const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp("\\b" + esc + "\\b", "i").test(html)) hits.push(s);
  }
  for (const s of exacts) {
    if (html.includes(s)) hits.push('"' + s + '"');
  }
  if (hits.length) fail(name, "leaked: " + hits.join(", "));
  else pass(name, "(" + (surnames.length + exacts.length) + " terms clear)");
})();

// ---------------------------------------------------------------------------
// Check 3: Every inline <script> block in index.html parses.
// ---------------------------------------------------------------------------
(function checkScripts() {
  const name = "scripts: every inline <script> parses";
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, total = 0, bad = [];
  while ((m = re.exec(html))) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs)) continue; // external, no inline body
    total++;
    try {
      new Function(m[2]);
    } catch (e) {
      const line = html.slice(0, m.index).split("\n").length;
      bad.push("block at line " + line + ": " + e.message);
    }
  }
  if (bad.length) fail(name, bad.join("; "));
  else pass(name, "(" + total + " inline block" + (total === 1 ? "" : "s") + ")");
})();

// ---------------------------------------------------------------------------
// Parse the AIRCRAFT array once for the plate-based checks.
// ---------------------------------------------------------------------------
let AIRCRAFT = null;
(function parseAircraft() {
  const marker = html.indexOf("const AIRCRAFT");
  if (marker < 0) { fail("aircraft: AIRCRAFT array present", "not found"); return; }
  const bracket = html.indexOf("[", marker);
  try {
    const literal = extractLiteral(html, bracket);
    AIRCRAFT = new Function("return " + literal + ";")();
  } catch (e) {
    fail("aircraft: AIRCRAFT array parses", e.message);
  }
})();

// ---------------------------------------------------------------------------
// Check 4: Consistency. status.json lit == sum(cells) == covered plates,
// and total == cells.length.
// ---------------------------------------------------------------------------
(function checkConsistency() {
  const name = "consistency: lit == sum(cells) == covered plates; total == cells.length";
  let status;
  try { status = JSON.parse(fs.readFileSync(STATUS, "utf8")); }
  catch (e) { fail(name, "status.json unreadable: " + e.message); return; }
  if (!AIRCRAFT) { fail(name, "AIRCRAFT unavailable"); return; }
  const cellSum = status.cells.reduce((a, b) => a + b, 0);
  const covered = AIRCRAFT.filter((p) => p.status === "covered").length;
  const problems = [];
  if (status.lit !== cellSum) problems.push("lit=" + status.lit + " but sum(cells)=" + cellSum);
  if (status.lit !== covered) problems.push("lit=" + status.lit + " but covered plates=" + covered);
  if (status.total !== status.cells.length) problems.push("total=" + status.total + " but cells.length=" + status.cells.length);
  if (problems.length) fail(name, problems.join("; "));
  else pass(name, "(lit=" + status.lit + ", total=" + status.total + ")");
})();

// ---------------------------------------------------------------------------
// Check 5: Sealed integrity. No plate with status "soon" carries a hook.
// ---------------------------------------------------------------------------
(function checkSealed() {
  const name = "sealed: no status:soon plate has a hook";
  if (!AIRCRAFT) { fail(name, "AIRCRAFT unavailable"); return; }
  const leaks = AIRCRAFT.filter((p) => p.status === "soon" && "hook" in p).map((p) => p.id || p.name);
  if (leaks.length) fail(name, "sealed plates with hook: " + leaks.join(", "));
  else pass(name);
})();

// ---------------------------------------------------------------------------
// Check 6: Art integrity. art and artCredit belong to covered plates only,
// and art never ships without a credit.
// ---------------------------------------------------------------------------
(function checkArt() {
  const name = "art: only covered plates carry art, always credited";
  if (!AIRCRAFT) { fail(name, "AIRCRAFT unavailable"); return; }
  const problems = [];
  for (const p of AIRCRAFT) {
    if (p.status !== "covered" && ("art" in p || "artCredit" in p)) {
      problems.push(p.id + " has status " + p.status + " but carries art fields");
    }
    if ("art" in p && !("artCredit" in p)) {
      problems.push(p.id + " has art without artCredit");
    }
  }
  const withArt = AIRCRAFT.filter((p) => "art" in p).length;
  if (problems.length) fail(name, problems.join("; "));
  else pass(name, "(" + withArt + " plate(s) with art)");
})();

// ---------------------------------------------------------------------------
// Check 7: Coverage literals. index.html must derive coverage counts from
// the AIRCRAFT array at page init, never hardcode them. Fails on literal
// "N / M airframes" or "N lit" strings, on non-empty static content in the
// derived elements, and on a coverage data-count that disagrees with the
// covered-plate count.
// ---------------------------------------------------------------------------
(function checkCoverageLiterals() {
  const name = "coverage: no hardcoded coverage counts in index.html";
  if (!AIRCRAFT) { fail(name, "AIRCRAFT unavailable"); return; }
  const covered = AIRCRAFT.filter((p) => p.status === "covered").length;
  const total = AIRCRAFT.length;
  const problems = [];

  // Literal "N / M airframes" anywhere in the file.
  const frac = html.match(/\b\d+\s*\/\s*\d+\s+airframes/g);
  if (frac) problems.push("literal gauge text: " + frac.join(", "));

  // Literal digits directly before "lit" (e.g. "13 lit" or "13&nbsp;lit").
  const litStr = html.match(/\b\d+(?:&nbsp;|\s)+lit\b/gi);
  if (litStr) problems.push("literal lit count: " + litStr.join(", "));

  // Elements JS fills from AIRCRAFT must be empty in the static HTML.
  for (const id of ["gauge-count", "gauge-last", "visible-count"]) {
    const m = html.match(new RegExp('id="' + id + '"[^>]*>([^<]*)<'));
    if (!m) problems.push("element #" + id + " not found");
    else if (/\S/.test(m[1])) problems.push("#" + id + ' holds literal "' + m[1].trim() + '"');
  }

  // Coverage stat elements: a literal data-count must agree with plate data.
  for (const [stat, want] of [["lit", covered], ["total", total]]) {
    const tag = html.match(new RegExp('<[^>]*data-stat="' + stat + '"[^>]*>'));
    if (!tag) { problems.push('data-stat="' + stat + '" element not found'); continue; }
    const dc = tag[0].match(/data-count="(\d+)"/);
    if (dc && Number(dc[1]) !== want) {
      problems.push('data-stat="' + stat + '" hardcodes ' + dc[1] + ", plates say " + want);
    }
  }

  if (problems.length) fail(name, problems.join("; "));
  else pass(name, "(covered=" + covered + ", total=" + total + " derived at init)");
})();

// ---------------------------------------------------------------------------
// Check 8: graph.json schema.
// ---------------------------------------------------------------------------
(function checkGraph() {
  const name = "graph: schema (ids, edges, dates, cites, contributed, synthesis)";
  let g;
  try { g = JSON.parse(fs.readFileSync(GRAPH, "utf8")); }
  catch (e) { fail(name, "graph.json unreadable: " + e.message); return; }

  const nodes = g.nodes || [];
  const edges = g.edges || [];
  const problems = [];

  // Unique node ids.
  const byId = new Map();
  const dupes = new Set();
  for (const n of nodes) {
    if (byId.has(n.id)) dupes.add(n.id);
    byId.set(n.id, n);
  }
  if (dupes.size) problems.push("duplicate node ids: " + [...dupes].join(", "));

  // Every edge endpoint exists.
  const missing = [];
  for (const e of edges) {
    if (!byId.has(e.from)) missing.push(e.from + " (from, " + e.type + ")");
    if (!byId.has(e.to)) missing.push(e.to + " (to, " + e.type + ")");
  }
  if (missing.length) problems.push("edge endpoints not found: " + missing.join(", "));

  // Only event nodes carry a date.
  const badDate = nodes.filter((n) => n.date !== undefined && n.type !== "event").map((n) => n.id);
  if (badDate.length) problems.push("non-event nodes with date: " + badDate.join(", "));

  // cites edges point at source nodes.
  const badCites = edges
    .filter((e) => e.type === "cites")
    .filter((e) => { const t = byId.get(e.to); return !t || t.type !== "source"; })
    .map((e) => e.from + "->" + e.to);
  if (badCites.length) problems.push("cites not pointing at a source: " + badCites.join(", "));

  // contributed edges carry a role.
  const badRole = edges
    .filter((e) => e.type === "contributed")
    .filter((e) => !e.role || String(e.role).trim() === "")
    .map((e) => e.from + "->" + e.to);
  if (badRole.length) problems.push("contributed without role: " + badRole.join(", "));

  // Synthesis edges carry a claimId whose claim is verified.
  const SYNTH = new Set(["enabled", "forced", "responded-to"]);
  const badSynth = [];
  for (const e of edges) {
    if (!SYNTH.has(e.type)) continue;
    if (!e.claimId) { badSynth.push(e.from + "->" + e.to + " (no claimId)"); continue; }
    const c = byId.get(e.claimId);
    if (!c) badSynth.push(e.from + "->" + e.to + " (claimId " + e.claimId + " missing)");
    else if (c.type !== "claim") badSynth.push(e.from + "->" + e.to + " (claimId " + e.claimId + " not a claim)");
    else if (c.status !== "verified") badSynth.push(e.from + "->" + e.to + " (claim " + e.claimId + " status=" + c.status + ")");
  }
  if (badSynth.length) problems.push("synthesis edge claim issues: " + badSynth.join(", "));

  if (problems.length) fail(name, problems.join(" | "));
  else pass(name, "(" + nodes.length + " nodes, " + edges.length + " edges)");
})();

// ---------------------------------------------------------------------------
// Check 9: Version stamp. Exactly one "SHANNON vX.Y / BUILT" in index.html.
// ---------------------------------------------------------------------------
(function checkStamp() {
  const name = "version: exactly one SHANNON vX.Y / BUILT stamp";
  const matches = html.match(/SHANNON v\d+\.\d+ \/ BUILT/g) || [];
  if (matches.length === 1) pass(name, "(" + matches[0] + ")");
  else fail(name, "found " + matches.length + " stamp(s)");
})();

// ---------------------------------------------------------------------------
console.log("");
if (failed) {
  console.log(failed + " check(s) FAILED. Do not commit.");
  process.exit(1);
} else {
  console.log("All checks PASSED.");
  process.exit(0);
}
