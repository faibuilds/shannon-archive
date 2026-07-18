# LOVELACE LINE LAUNCH : handoff for Claude Code
Repo: faibuilds/shannon-archive (auto-deploys to Cloudflare on push)
Read CLAUDE.md first. Run `node tools/check.js` before every commit; it
exits nonzero on failure and that is a hard stop.

## Objective
Launch the archive's second line: **LOVELACE** (computing foundations),
with three lit plates and one sealed plate. Everything ships in one PR.

## 1. The line
- id: `lovelace`
- display name: LOVELACE
- field: computing foundations
- namesake: Ada Lovelace (1815–1852). One-line blurb for the line header:
  "Named for the woman who saw, in 1843, that a computing machine was
  never about numbers."
- ordering principle: publication date of the foundational document
  (KELLY orders by first flight; LOVELACE orders by publication).

## 2. Plates (in timeline order)
Source data: the four SHANNON block files shipped with this brief. Ingest
per shannon-graph@0.1. Every synthesis edge cites a verified claim id;
that invariant must hold after import (check.js enforces it).

1. **lovelace-notes-1843** : lit. Block: `shannon_ada-lovelace.md`
   (status published, LinkedIn link inside).
2. **boolean-algebra** (1854) : lit. Block: `shannon_george-boole.md`
   (status published, LinkedIn link inside; the old `unassigned` flag is
   resolved, line is now `lovelace`).
3. **TURING (1936)** : SEALED. No block yet, no hook, no details. Render
   as a sealed plate named TURING positioned at 1936. Note the deliberate
   effect: it sits BETWEEN the lit 1854 and 1937 plates, a visible dark
   slot inside the story. Do not add any copy beyond the name and sealed
   state.
4. **shannon-thesis-1937** : lit. Block: `shannon_shannon-thesis-1937.md`
   (new backfill; the Shannon story predates the emit step). Status
   published, LinkedIn link inside.

## 3. Graph specifics
- New nodes: line:lovelace, artifact:shannon-thesis-1937 (+ its events,
  people, claims per the block). boolean-algebra and lovelace-notes-1843
  nodes exist as banked; flip them to rendered on the new line.
- Edges to materialize (all claim-cited in the blocks):
  boolean-algebra → enabled → shannon-thesis-1937
  shannon-thesis-1937 → enabled → digital circuit design
  lovelace-notes-1843 → enabled → shannon-thesis-1937
  lovelace-notes-1843 → corrects → number-machine framing
  boolean-algebra → corrects → Aristotelian syllogistic logic
- Only claims with status `verified` render publicly. Conflicting and
  unverifiable claims import as non-rendering research memory (existing
  behavior; do not change it).
- Person node "Claude Shannon" now appears as both a line-plate author
  and the archive namesake; if the schema needs a disambiguation field,
  add it minimally and note it in the PR.

## 4. Site
- LOVELACE line page: same template as KELLY (timeline, lit/sealed
  plates, story links out to LinkedIn).
- Homepage: add LOVELACE beside KELLY; update status.json gauges (lines
  count, plates count) so the EC homepage gauges pick it up.
- If any placeholder/masked treatment existed for unassigned computing
  plates, remove it; these plates are now public on their line.
- KELLY untouched.

## 5. Sequencing and definition of done
1. Import blocks, build line, verify `node tools/check.js` passes.
2. Deploy (push to main; Cloudflare auto-deploys).
3. Confirm live: shannon.engineeringcommunity.net shows LOVELACE with
   three lit plates in order 1843 → 1854 → [sealed TURING 1936] → 1937,
   each lit plate linking to its LinkedIn post.
4. Report back the line URL; the Convergence Map newsletter's closing
   links to it and must not go out before the line is live.

## Do not
- Do not write a hook or any copy for the TURING plate.
- Do not add plates beyond these four.
- Do not touch KELLY ordering or the archive-level SHANNON branding.
