# SHANNON Archive, Constitution

You are working on SHANNON, Engineering Community's public story archive,
live at shannon.engineeringcommunity.net. Fai is the editor-in-chief; you
are the hands. Read this file fully before any task.

## What this repo is
- `/site` is the deployed website (Cloudflare Worker `shannon-site`,
  static assets). Everything in /site is PUBLIC the moment it deploys.
- `/site/index.html` is the entire site: one file, inline CSS/JS, aircraft
  data in the AIRCRAFT array inside the script.
- `/site/graph.json` is the knowledge graph (schema shannon-graph@0.1).
- `/site/status.json` is the line summary the EC homepage reads live.
  cells = 22 chronological plates, 1 lit / 0 sealed. Keep lit count,
  cells, and the site's plate data consistent in every commit.

## Absolute rules
1. NO EM-DASHES anywhere, ever: not in copy, captions, code comments, or
   commit messages. Use periods, commas, or sentence breaks.
2. Sealed plates and unlaunched lines never reveal their content. Never
   write a sealed story's hook anywhere public. Unlaunched line names
   (petroski, hammurabi, barenyi, tipper, roebling, and any computing
   line) appear on the site only in masked form (T▮PP▮R style).
3. Crew remarks are consent-gated. A remark renders only if cleared:true.
   Never add a person's name, title, or remark text without Fai stating
   that person consented. The deployed file currently holds blanked
   remark objects; real data is re-added one person at a time on consent.
4. Only verified claims may render publicly. conflicting renders with
   both versions if ever surfaced; unverifiable and false never render.
5. Graph rules: only event nodes carry dates; claims cite sources, never
   claims; sources are leaves; contributed edges require a role; synthesis
   edges (enabled, forced, responded-to) require claimId pointing at a
   verified claim. Validate before committing (see checks).

## Routine tasks
- MERGE A SHANNON BLOCK: Fai pastes a block (=== SHANNON BLOCK === format).
  Convert to nodes/edges per schema, merge into /site/graph.json, dedupe
  ids, validate. If the story is published on the kelly line, also update
  the AIRCRAFT array (unseal or add plate: name, year by first flight,
  hook as plate line in sentence case, posts links) and /site/status.json.
- UNSEAL A REMARK: Fai gives a name and the remark data; set the remark
  object with cleared:true on the right plate.
- Bump the version stamp (SHANNON vX.Y / BUILT MM.YYYY) in index.html on
  every user-visible change.

## Checks before every commit
Run `node tools/check.js` and commit only on a clean pass (exit 0, every
line PASS). It enforces the constitution automatically:
- No em-dash character (U+2014) anywhere in /site.
- Privacy gate: no consent-gated names appear in index.html.
- Every inline <script> in index.html parses.
- status.json lit == sum(cells) == covered plates, total == cells length.
- No sealed plate (status "soon") carries a hook.
- graph.json schema: unique ids, valid edge endpoints, dates only on
  events, cites point at sources, contributed edges carry a role,
  synthesis edges cite a verified claim.
- Exactly one "SHANNON vX.Y / BUILT" version stamp in index.html.
If check.js exits nonzero, fix the FAIL lines before committing.

## Voice
Engineering Community: precise, sober, warm. Short sentences. Specific
numbers. Named people. No hype, no motivational tone, no "delve".
