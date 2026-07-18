# SHANNON blocks

One file per published story, in the === SHANNON BLOCK === format. Blocks
are the ingestion record for site/graph.json; they are not deployed (only
/site ships to the Worker).

## Contents
- shannon_ada-lovelace.md, shannon_george-boole.md,
  shannon_shannon-thesis-1937.md: the LOVELACE line's data (ingested at
  the L-07 launch, v1.21).
- shannon_wright-wind-tunnel.md: published story, line unassigned
  (instrument, not a military airframe). Post URLs pending from Fai.
- shannon_p-38.skeleton.md, shannon_f-15.skeleton.md: skeleton backfills
  generated from graph data, pending editorial pass. Claims that were
  never ingested are noted, not invented.
- LOVELACE_line_handoff.md: the launch brief, kept for the record.

## Known gaps (backfill blocked, needs original VCLs)
Three published stories have no graph presence at all, so no skeleton can
be generated without inventing data, which the rules forbid:
- tacoma-narrows
- lancaster-manchester
- liberty-ships
Their VCLs live in the conversation archive and were never ingested at
site build. Skeletons can be emitted the day those VCLs are supplied.
