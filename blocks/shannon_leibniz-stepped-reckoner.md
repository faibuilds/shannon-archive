=== SHANNON BLOCK (ingestion record) ===
ARTIFACT id: leibniz-stepped-reckoner | name: Leibniz's Stepped Reckoner |
  category: instrument | origin: Germany | LINE: LOVELACE L-07. Plate 02 by
  year, between the Pascaline (1642) and the Notes (1843). LOVELACE goes
  4/5 to 5/6. Ingested 2026-08-07 (v1.96).

14 claims, all verified. Two are marked synthesis in their own source
  notes and stay marked that way: c-05, the carry-cascade mechanics carried
  over from the Pascaline plate, and c-08, the reading that Leibniz advanced
  capability while losing reliability. The block is explicit that the record
  does not say why his carry differed from Pascal's, only that it failed, so
  no claim is made that he ignored or rejected the sautoir.

SYNTHESIS, both artifact to artifact, both Pascaline to Reckoner:
  enabled  (c-08)  Pascal's machine established that arithmetic could be
    delegated to gears, and reading of it set Leibniz on the problem.
  corrects (c-05)  A deliberate directional inversion, and the block says
    so. The earlier artifact holds the solution the later one lacks:
    Pascal's sautoir takes the operator out of the carry, Leibniz's linkage
    does not, and it fails on cascades. Unlike the Hyatt block's self-loop,
    these arrived well formed and needed no re-pointing.

A ROLE CORRECTED, with evidence. Leibniz already sat on the Pascaline with
  role "opposed". His own note on that node said he tried to add automatic
  multiplication to it, so the label contradicted the record on the same
  node. It was flagged during the United 232 ingest and left as authored for
  want of evidence. This block supplies it: he learned of Pascal's machine
  and set out to extend the mechanism. Role is now "extended". His note also
  called the Reckoner the line's next candidate; it is a plate now, so the
  note says that instead.

PEOPLE: gottfried-leibniz and blaise-pascal already existed, so only the
  contributed edges were added and their nodes were left untouched.
  thomas-de-colmar is new. Pascal carries role "enabled" on this artifact,
  which is a new role name and honest: he did not build this machine, he
  made it thinkable.

EVENTS: two of the block's entries span a range, 1673 to 1694 for the
  failure and 1673 into the 1870s for the drum's adoption. The schema dates
  an event to a point, so each is dated where it starts and the span stays
  in the label rather than being invented into a field that does not exist.
  Five event types are new to the graph: development, demonstration, loss,
  recovery, adoption. Nothing validates eventType against a list, and the
  month-marker map ignores anything it does not know, so they are safe.
  Neither dated event falls in August, so no month flag appears.

THE LINE THESIS, rewritten. LOVELACE is not a survey of early calculators.
  It is the distance between a working device and a transferable idea. The
  Pascaline worked and its complement method is inside every processor
  running today. The Reckoner never worked properly and its stepped drum
  became the working element of mechanical calculation for two centuries.
  Neither machine's influence depended on the machine lasting.

A RENDERER BUG THIS FOUND, in two places. The plate was first written with
  a posts array, which is how KELLY and the shared renderLine take them. The
  LOVELACE renderer reads only a.post, so a covered plate with a posts array
  fell straight through to the sealed branch and rendered "Get the alert when
  it unseals" under a published story. WRIGHT was worse: it dereferences
  a.post.url with no guard at all, so the same plate would have thrown there
  and taken the whole line's render down. renderLine has normalized this
  since v1.70; the other two never did. All three now carry the same line.
  The plate itself uses the singular form, which is the convention on this
  line, and the Facebook URL lives in the story node.
  Self-inflicted on the way: the first pass rewrote a.post to post in the
  WRIGHT renderer without declaring it there, which would have been a
  ReferenceError at render. Caught before commit by counting the
  declarations against the renderers.

STORY: story-leibniz-stepped-reckoner, "The Machine Failed and the Part Ran
  for Two Hundred Years". LinkedIn and Facebook live, Instagram not posted.

CONNECTIONS, carried from the block and not drawn as edges because neither
  is claim-cited: to PETROSKI, the Hyatt Regency is the same question
  answered the other way, an information failure against a manufacturing
  failure, both asking what a design owes the world that has to build it.
  To CARNOT, Harrison turns on reproducibility as a condition of usefulness,
  demanded by a Board; here reproducibility arrives with nobody asking, and
  attaches to a component rather than a machine.
=== END BLOCK ===
