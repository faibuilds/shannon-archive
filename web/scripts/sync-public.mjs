#!/usr/bin/env node
// The deployed data files and art stay canonical in /site while both builds
// exist. This copies them into web/public so the Next build serves byte
// identical graph.json, status.json, art, and brand assets at the same URLs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, "../../site");
const PUB = path.resolve(here, "../public");

const FILES = ["graph.json", "status.json", "favicon.png", "og.png", "robots.txt", "sitemap.xml", "_headers"];

fs.mkdirSync(PUB, { recursive: true });
for (const f of FILES) {
  const src = path.join(SITE, f);
  if (!fs.existsSync(src)) {
    console.warn(`sync-public: missing ${src}, skipped`);
    continue;
  }
  fs.copyFileSync(src, path.join(PUB, f));
}
fs.cpSync(path.join(SITE, "art"), path.join(PUB, "art"), { recursive: true });
console.log("sync-public: copied data, art and brand assets from /site");
