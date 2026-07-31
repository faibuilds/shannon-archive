#!/usr/bin/env node
// SHANNON constitution gate for the Next.js port. Mirrors tools/check.js:
// same rules, adapted to a data-module app. Exits nonzero on any failure.
// Run after `next build`; it inspects the sources, the data modules, and
// the exported out/index.html.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(here, "..");
const SRC = path.join(WEB, "src");
const OUT = path.join(WEB, "out");
const DATA = path.join(SRC, "data");

let failed = 0;
const pass = (name, detail) => console.log("PASS  " + name + (detail ? "  " + detail : ""));
const fail = (name, detail) => { failed++; console.log("FAIL  " + name + (detail ? "  " + detail : "")); };

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

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const kelly = readJson(path.join(DATA, "kelly.json"));
const lines = readJson(path.join(DATA, "lines.json"));
const findings = readJson(path.join(DATA, "findings.json"));
const status = readJson(path.join(WEB, "public", "status.json"));
const graph = readJson(path.join(WEB, "public", "graph.json"));
const everyPlate = [kelly, ...Object.values(lines)].flat();

const outIndex = path.join(OUT, "index.html");
const builtHtml = fs.existsSync(outIndex) ? fs.readFileSync(outIndex, "utf8") : null;
// The visible document: script bodies (the RSC flight payload repeats every
// string) and React's text-boundary comments stripped out.
const builtDom = builtHtml
  ? builtHtml.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "")
  : null;

// ---------------------------------------------------------------------------
// Check 1: No em-dash (U+2014) in web sources, public text, or built html.
// The one U+2014 the build may emit is none: copy uses periods and commas.
// ---------------------------------------------------------------------------
(function checkEmDash() {
  const name = "em-dash: no U+2014 in web sources or built page";
  const EMDASH = "\u2014"; // written as an escape so this file passes itself
  const hits = [];
  const roots = [SRC, path.join(WEB, "public"), path.join(WEB, "scripts")];
  for (const root of roots) {
    for (const file of walk(root)) {
      if (BINARY_EXT.has(path.extname(file).toLowerCase())) continue;
      const text = fs.readFileSync(file, "utf8");
      const idx = text.indexOf(EMDASH);
      if (idx >= 0) hits.push(path.relative(WEB, file) + ":" + text.slice(0, idx).split("\n").length);
    }
  }
  if (builtHtml && builtHtml.includes(EMDASH)) hits.push("out/index.html");
  if (hits.length) fail(name, "found in " + hits.join(", "));
  else pass(name);
})();

// ---------------------------------------------------------------------------
// Check 2: Privacy gate. Consent-gated names must not appear in the built
// page or anywhere in src. Same list as tools/check.js.
// ---------------------------------------------------------------------------
(function checkPrivacy() {
  const name = "privacy: no gated names in built page or src";
  const surnames = [
    "Ferretti", "Hindman", "Aven", "Aiken",
    "Bolton", "Donahue", "Bourquin", "Palermo", "Pickard",
    "Swatman", "Donley", "Partain", "Markos",
  ];
  const exacts = [
    "Jim Roberts", "Les Hayes", "Colin Rose", "Kev Senior",
    "Greg Davis", "James Dyson", "Thomas Russell", "Andrew Cox",
    "Daniel Gear", "Allen Crane", "robert ley",
  ];
  const texts = [["out/index.html", builtHtml || ""]];
  for (const file of walk(SRC)) texts.push([path.relative(WEB, file), fs.readFileSync(file, "utf8")]);
  const hits = new Set();
  for (const [label, text] of texts) {
    for (const s of surnames) {
      const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp("\\b" + esc + "\\b", "i").test(text)) hits.add(s + " in " + label);
    }
    for (const s of exacts) if (text.includes(s)) hits.add('"' + s + '" in ' + label);
  }
  if (hits.size) fail(name, "leaked: " + [...hits].join(", "));
  else pass(name, "(" + (surnames.length + exacts.length) + " terms clear)");
})();

// ---------------------------------------------------------------------------
// Check 3: Remark gate. Only cleared:true remarks may carry a name or text.
// ---------------------------------------------------------------------------
(function checkRemarks() {
  const name = "remarks: name/text only on cleared:true";
  const leaks = [];
  for (const p of everyPlate) {
    for (const r of p.remarks || []) {
      if (!r.cleared && (r.name || r.text || r.title)) leaks.push(p.id);
    }
  }
  if (leaks.length) fail(name, "uncleared remark with content on: " + leaks.join(", "));
  else pass(name);
})();

// ---------------------------------------------------------------------------
// Check 4: Consistency with status.json (same rules as tools/check.js).
// ---------------------------------------------------------------------------
(function checkConsistency() {
  const name = "consistency: status.json matches plate data";
  const problems = [];
  const cellSum = status.cells.reduce((a, b) => a + b, 0);
  const covered = kelly.filter((p) => p.status === "covered").length;
  if (status.lit !== cellSum) problems.push(`lit=${status.lit} but sum(cells)=${cellSum}`);
  if (status.lit !== covered) problems.push(`lit=${status.lit} but covered plates=${covered}`);
  if (status.total !== status.cells.length) problems.push(`total=${status.total} but cells.length=${status.cells.length}`);
  const k = status.lines.find((l) => l.id === "kelly");
  if (!k || k.lit !== status.lit || k.total !== status.total) problems.push("status.lines kelly disagrees");
  for (const [lineId, arr] of Object.entries(lines)) {
    const entry = status.lines.find((l) => l.id === lineId);
    const cov = arr.filter((p) => p.status === "covered").length;
    if (!entry) { problems.push(lineId + " missing from status.lines"); continue; }
    if (entry.lit !== cov) problems.push(`status.lines ${lineId} lit=${entry.lit} but covered=${cov}`);
    if (entry.total !== arr.length) problems.push(`status.lines ${lineId} total=${entry.total} but plates=${arr.length}`);
  }
  if (status.linesLive !== status.lines.length) problems.push("linesLive mismatch");
  if (problems.length) fail(name, problems.join("; "));
  else pass(name, `(kelly ${status.lit}/${status.total}, ${status.lines.length} lines)`);
})();

// ---------------------------------------------------------------------------
// Check 5: Sealed integrity. No status:soon plate carries a hook.
// ---------------------------------------------------------------------------
(function checkSealed() {
  const name = "sealed: no status:soon plate has a hook";
  const leaks = everyPlate.filter((p) => p.status === "soon" && "hook" in p).map((p) => p.id);
  if (leaks.length) fail(name, "sealed plates with hook: " + leaks.join(", "));
  else pass(name, `(${everyPlate.length} plates checked)`);
})();

// ---------------------------------------------------------------------------
// Check 6: Art integrity. Art on covered plates only, always credited.
// ---------------------------------------------------------------------------
(function checkArt() {
  const name = "art: only covered plates carry art, always credited";
  const problems = [];
  for (const p of everyPlate) {
    if (p.status !== "covered" && ("art" in p || "artCredit" in p))
      problems.push(`${p.id} has status ${p.status} but carries art fields`);
    if ("art" in p && !("artCredit" in p)) problems.push(`${p.id} has art without artCredit`);
  }
  const withArt = everyPlate.filter((p) => "art" in p).length;
  if (problems.length) fail(name, problems.join("; "));
  else pass(name, `(${withArt} plate(s) with art)`);
})();

// ---------------------------------------------------------------------------
// Check 7: graph.json schema (identical rules to tools/check.js).
// ---------------------------------------------------------------------------
(function checkGraph() {
  const name = "graph: schema (ids, edges, dates, cites, contributed, synthesis)";
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const problems = [];
  const byId = new Map();
  const dupes = new Set();
  for (const n of nodes) { if (byId.has(n.id)) dupes.add(n.id); byId.set(n.id, n); }
  if (dupes.size) problems.push("duplicate node ids: " + [...dupes].join(", "));
  const missing = [];
  for (const e of edges) {
    if (!byId.has(e.from)) missing.push(e.from);
    if (!byId.has(e.to)) missing.push(e.to);
  }
  if (missing.length) problems.push("edge endpoints not found: " + missing.join(", "));
  const badDate = nodes.filter((n) => n.date !== undefined && n.type !== "event").map((n) => n.id);
  if (badDate.length) problems.push("non-event nodes with date: " + badDate.join(", "));
  const badCites = edges.filter((e) => e.type === "cites")
    .filter((e) => { const t = byId.get(e.to); return !t || t.type !== "source"; });
  if (badCites.length) problems.push("cites not pointing at a source: " + badCites.length);
  const badRole = edges.filter((e) => e.type === "contributed")
    .filter((e) => !e.role || String(e.role).trim() === "");
  if (badRole.length) problems.push("contributed without role: " + badRole.length);
  const SYNTH = new Set(["enabled", "forced", "responded-to", "corrects"]);
  const badSynth = [];
  for (const e of edges) {
    if (!SYNTH.has(e.type)) continue;
    if (!e.claimId) { badSynth.push(`${e.from}->${e.to} (no claimId)`); continue; }
    const c = byId.get(e.claimId);
    if (!c) badSynth.push(`${e.from}->${e.to} (claimId missing)`);
    else if (c.type !== "claim") badSynth.push(`${e.from}->${e.to} (claimId not a claim)`);
    else if (c.status !== "verified") badSynth.push(`${e.from}->${e.to} (claim ${c.status})`);
    else if (!(c.aboutIds || []).includes(e.from) && !(c.aboutIds || []).includes(e.to))
      badSynth.push(`${e.from}->${e.to} (claim about neither endpoint)`);
  }
  if (badSynth.length) problems.push("synthesis edge claim issues: " + badSynth.join(", "));
  if (problems.length) fail(name, problems.join(" | "));
  else pass(name, `(${nodes.length} nodes, ${edges.length} edges)`);
})();

// ---------------------------------------------------------------------------
// Check 8: Findings integrity. Every drawn edge exists in graph.json as a
// synthesis edge citing that exact verified claim; stats match the graph.
// ---------------------------------------------------------------------------
(function checkFindings() {
  const name = "findings: every drawn connection is backed by the graph";
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const SYNTH = new Set(["enabled", "forced", "responded-to", "corrects"]);
  const problems = [];
  let drawn = 0;
  findings.findings.forEach((f, fi) => {
    f.edges.forEach((e) => {
      drawn++;
      const a = f.nodes[e.from], b = f.nodes[e.to];
      const where = `finding ${fi + 1} ${a && a.label} -> ${b && b.label}`;
      if (!a || !b) { problems.push(where + ": node index out of range"); return; }
      const match = graph.edges.find((ge) =>
        SYNTH.has(ge.type) && ge.type === e.type && ge.claimId === e.claim &&
        ge.from === a.id && (b.id ? ge.to === b.id : true));
      if (!match) { problems.push(`${where}: no ${e.type} edge citing ${e.claim}`); return; }
      const claim = byId.get(e.claim);
      if (!claim) problems.push(`${where}: claim ${e.claim} missing`);
      else if (claim.status !== "verified") problems.push(`${where}: claim ${e.claim} is ${claim.status}`);
    });
    f.nodes.forEach((n) => {
      if (n.id && !byId.has(n.id)) problems.push(`finding ${fi + 1}: node id ${n.id} not in graph`);
    });
  });
  const claims = graph.nodes.filter((n) => n.type === "claim");
  const actual = {
    claims: claims.length,
    verified: claims.filter((c) => c.status === "verified").length,
    sources: graph.nodes.filter((n) => n.type === "source").length,
    artifacts: graph.nodes.filter((n) => n.type === "artifact").length,
    edges: graph.edges.filter((e) => SYNTH.has(e.type)).length,
  };
  for (const k of Object.keys(actual)) {
    if (findings.stats[k] !== actual[k])
      problems.push(`method line says ${k}=${findings.stats[k]} but graph has ${actual[k]}`);
  }
  if (problems.length) fail(name, problems.join("; "));
  else pass(name, `(${findings.findings.length} findings, ${drawn} edges verified)`);
})();

// ---------------------------------------------------------------------------
// Check 9: Version stamp. Exactly one "SHANNON vX.Y / BUILT" in the built page.
// ---------------------------------------------------------------------------
(function checkStamp() {
  const name = "version: exactly one SHANNON vX.Y / BUILT stamp in out/index.html";
  if (!builtDom) { fail(name, "out/index.html not found; run next build first"); return; }
  const matches = builtDom.match(/SHANNON v\d+\.\d+ \/ BUILT/g) || [];
  if (matches.length === 1) pass(name, "(" + matches[0] + ")");
  else fail(name, "found " + matches.length + " stamp(s)");
})();

// ---------------------------------------------------------------------------
// Check 10: Built page carries the derived coverage numbers (they cannot
// drift: the same data modules produce both the page and this check).
// ---------------------------------------------------------------------------
(function checkCoverage() {
  const name = "coverage: built page shows derived lit/total";
  if (!builtDom) { fail(name, "out/index.html not found"); return; }
  const lit = everyPlate.filter((p) => p.status === "covered").length;
  const total = everyPlate.length;
  if (builtDom.includes(`${lit} / ${total} lit`)) pass(name, `(${lit} / ${total} lit)`);
  else fail(name, `expected "${lit} / ${total} lit" in built page`);
})();

console.log("");
if (failed) {
  console.log(failed + " check(s) FAILED. Do not commit.");
  process.exit(1);
} else {
  console.log("All checks PASSED.");
  process.exit(0);
}
