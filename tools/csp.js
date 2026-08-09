/* SHANNON: regenerate the script-src hashes in site/_headers.
 *
 * The whole site is one inline <script>, so the CSP had to allow
 * 'unsafe-inline', which is the same as having no script CSP at all: any
 * markup that got injected would run. Hashing the block instead pins the
 * policy to the exact bytes we shipped, and anything injected later does not
 * match and does not run.
 *
 * The cost is that the hash changes every time index.html changes. That is
 * automated here and enforced in tools/check.js, which fails on a stale hash.
 * wrangler runs check.js before it uploads, so a stale hash aborts the deploy
 * rather than shipping a site with no working JavaScript.
 *
 * Run after any edit to index.html:   node tools/csp.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SITE = path.join(__dirname, "..", "site");
const HTML = path.join(SITE, "index.html");
const HEADERS = path.join(SITE, "_headers");

/* Every inline block, in document order: the ld+json data block and the one
   JavaScript block. The data block is not executed, so a browser should not
   demand a hash for it, but including it costs one token and removes the
   question. */
function hashes() {
  const html = fs.readFileSync(HTML, "utf8");
  const RE = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const out = [];
  let m;
  while ((m = RE.exec(html))) {
    out.push("'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'");
  }
  return out;
}

function scriptSrc() {
  return "script-src 'self' " + hashes().join(" ") +
    " https://tally.so https://static.cloudflareinsights.com";
}

if (require.main === module) {
  const before = fs.readFileSync(HEADERS, "utf8");
  const after = before.replace(/script-src [^;]+/, scriptSrc());
  if (after === before) {
    console.log("_headers already current (" + hashes().length + " inline block(s))");
  } else {
    fs.writeFileSync(HEADERS, after);
    console.log("_headers updated:");
    hashes().forEach(h => console.log("  " + h));
  }
}

module.exports = { hashes, scriptSrc };
