# SHANNON web (Next.js port)

Next.js 15 port of `/site/index.html`, same data, same visualizations, same
constitution. Static export: `next build` emits a plain file tree a
Cloudflare Worker serves exactly like `/site` today.

## Layout

- `src/data/*.json` holds the plate arrays, findings, and decade theses,
  byte for byte from the deployed site (only art image paths were made
  absolute). `src/data/index.ts` types them and derives every count: the
  gauge, hero stats, sealed totals, and GAUGE_LINES all come from these
  arrays, so numbers cannot drift.
- `src/components/` one component per instrument: Hero (count-ups, coverage
  gauge), FiltersBar (scroll-spy line jumps + KELLY status/role filters),
  KellyTimeline (decades + lit runway rail), LineSection (the other ten
  lines through one shared plate card), Findings (claim-cited diagrams),
  Board (the graph board, computed from graph.json at load), plus the
  alerts, bench, lore, support, footer bands and the preview modal / toast.
- `public/` carries graph.json, status.json, art, and brand assets copied
  from `/site` by `scripts/sync-public.mjs` (runs automatically before
  dev and build). `/site` stays canonical while both builds exist.
- `src/lib/board-model.ts` reads graph.json into a layout (lanes, years,
  traces, statistics); `src/lib/board-data.tsx` fetches it once and hands
  the same model to the board and the minimap.

## The minimap (new, not in /site)

`src/components/Minimap.tsx` is the one feature the single-file site does
not have. Once you scroll past the full board and into the lines, a mini
board docks in the bottom right and follows your reading: a dashed
playhead on the time axis, a lit band on the lane of the line you are in,
the current component ringed, and the traces it is part of drawn in green.
The caption names the plate. Clicking any component jumps to its plate,
the header returns to the full board, and the close button retires it for
the page visit.

It obeys the same rules as everything else: a sealed plate with a masked
name reads "Sealed", never the name, and sealed plates carry a dashed
Sealed tag. It hides on touch devices and below 940px, where it would sit
on top of the plate you are reading, and it uses the shared board model so
a component sits at the same year and lane in both views.

## Commands

- `npm run dev` local dev at http://localhost:3000
- `npm run build` static export to `out/`, then runs the constitution gate
- `npm run check` the gate alone: em-dash scan, privacy gate, remark
  consent gate, status.json consistency, sealed/art integrity, graph
  schema, findings-vs-graph verification, version stamp, derived coverage

## Cutover to production

1. `cd web && npm ci && npm run build` (sync + export + checks)
2. Point the Worker at the export: in `wrangler.jsonc` set
   `"assets": { "directory": "./web/out" }` and
   `"build": { "command": "cd web && npm ci && npm run build" }`
3. Bump the version stamp in `src/components/Lower.tsx` (footer) on every
   user-visible change, same rule as before.

## Deliberate differences from /site

- The board-foot trace legend glyph is a small inline SVG line instead of
  an em-dash HTML entity (same look, keeps U+2014 out of the page).
- Fonts are self-hosted through next/font instead of the Google Fonts CDN.
- The filter strip's slide-away trigger is the last line section in the
  DOM (ROEBLING), where the old page still pointed at NOYCE.

## Known /site defect, reproduced here for parity

The original renderLine reads `plate.post`, but ROEBLING stores `posts[]`,
so its three published stories show "Get the alert when it unseals"
instead of "Read the story". The port reproduces that behavior so the two
builds render identically. To fix it in the port once /site is fixed (or
retired), pass `primary={a.post || a.posts?.[0]}` in
`src/components/LineSection.tsx`.
