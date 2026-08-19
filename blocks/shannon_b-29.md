=== SHANNON BLOCK (ingestion record) ===
ARTIFACT id: b-29 | name: B-29 Superfortress
  KELLY L-01, plate 3 of 27 in board order. UNSEALED, not created. Ingested
  2026-08-19 (v2.26). 27 claims, 9 sources, 1 story, 62 edges.

THIS WAS AN UNSEAL AND THE BLOCK DID NOT SAY SO. The B-29 was already in the
  graph as sealed-1942b with a first flight event of Sep 1942, one of seven
  sealed KELLY plates. The id was renamed to b-29 because a covered plate's id
  becomes its public URL fragment and no covered plate in this archive carries
  a sealed-* id. The rename moved the artifact, the first flight event and
  every edge that touched either.

THE HOLD, AND WHY IT LIFTED. The block instructed: if the live posts still
  carry "and they worked", edit them or hold. They did, so it was held.
  Read on 2026-08-19, from the live captions and not from any build file:
    LinkedIn  already corrected. Leads with the tail gunner, grade A.
    Facebook  still carried the sentence, verbatim.
    Instagram could not be read. Never verified either way.
  The Facebook caption was corrected by the editor and re-read here before
  this block was merged. The paragraph now leads with the tail gunner and
  frames Project S68 as a hedge, matching LinkedIn. Both editions agree.

THE THREE FACEBOOK LINKS ARE ONE POST. The block flagged two share URLs and a
  third arrived with the fix. All resolve to the same canonical permalink,
  pfbid05pXTd8p... The plate stores the canonical permalink rather than a
  share shortlink, because a shortlink is a redirect the platform regenerates
  and the archive should point at the post itself.

THE HOOK WAS CONFIRMED, NOT ASSUMED. Per D28 the hook was checked against the
  published creative rather than the build file. Facebook's own image OCR
  returns the overlay text, and it matches the block.

YEAR 1942, NOT 1944, AND THIS IS A DELIBERATE DEPARTURE FROM THE BLOCK.
  The card head asked for Year 1944. CLAUDE.md says year by first flight, and
  all 21 plates on the site carrying a first flight date have year equal to
  that year, with zero exceptions. The B-29 first flew Sep 1942. Setting 1944
  would have been the first violation of a rule that currently holds
  everywhere. The story year is 1944 and the plate year is 1942, and that gap
  is the same A5 question the block raises about the temporal strip. Flagged
  for the editor, not silently resolved.

TITLE HAS NOWHERE TO GO. The block picks THE EMPTY TURRET. The plate schema
  carries name and hook and no story title, and every other KELLY plate is
  named for the aircraft. The plate is named B-29 Superfortress and the title
  is recorded here. If the board should carry story titles, that is a schema
  change and not a per-plate decision.

CLAIMS. All 27 ingested, ids c-b29-01 to c-b29-27, all verified. The [I]
  inferences, 7, 12 and 23, and the [D] derivation, 10, are marked as ours in
  their source notes, following the OLLEY precedent for derived claims.
  Claim 6 states in its own body that no source describes how the manned
  installation performed and none states the aircraft flew armed, so
  do-not-print 13 is enforced by the claim text and not only by the ledger.

SOURCES, 9. The four primary manuals, NMUSAF, the Smithsonian, the reference
  literature as a single named bundle for claim 6, the surviving unit for
  claim 15, and an EC VCL entry carrying the claims that rest on two or more
  agreeing secondaries. The VCL pattern follows src-c130-vcl.

EDGES. 27 about, 33 cites, 1 covers, and 2 echoes from Part 6:
    flat-ride -> b-29 on c-b29-10. A correction depending on a quantity the
      operator cannot perceive.
    wright-wind-tunnel -> b-29 on c-b29-17. An instrument replacing guessing
      with number, and the limit: the computer took the arithmetic and left
      the measurement to a man judging a wingspan.
  The Petroski edge was NOT made. The block names the theme, failures, but no
  artifact endpoints, and edges join artifacts. The Bell Labs M-9 edge was not
  made either: the M-9 is not in the archive yet and the block itself calls it
  a plate of its own.

THE ART, AND THE ONE THAT DID NOT WORK. The first candidate was GIF 2-2,
  Sight and Turret Identification Chart, from the Gunner's Information File,
  which is the diagram the published creative credits and is claim 19 made
  visible. It was refused: the only reachable scan is 640 pixels wide and
  halftoned, and tools/plate-art.js is built to invert black line work on
  white paper. Fed a halftone photograph of a printed page it returns a slab.
  The search for a clean scan of GIF 2-2 stays open.

  What shipped is the editor's find: MLWatts' B-29 3-view from Wikimedia
  Commons, CC0. The archive already carries this artist under this licence on
  the P-38 plate, with the same credit string, so the B-29 mirrors it.

  It is vector, which is a first here. Every other plate figure is a raster
  scan. Two consequences. plate-art.js could not process it at all: the file
  is outline strokes on a transparent ground, so inverting and keying the
  paper treated the whole canvas as ink and returned a steel rectangle. The
  correct transform for a vector source is a recolour and nothing else, and
  329 black stroke values were moved to the archive steel. And because it is
  vector it is sharp at any size, so merch/art-print/b-29.svg is kept beside
  the site raster and this plate will never need tracing for print.

  plate-art.js was also fixed while here: it served every source as image/png,
  so a vector handed to it failed to decode and looked like an empty crop
  rather than a wrong content type.

  NO SPAN CALLOUT. The P-38 and SR-71 plates carry a measured span arrow. The
  B-29 does not, because its span is not among the 27 claims, and a plate
  whose whole finding is about four unsourced words is not the place to add a
  number nobody asked for.

OPEN, CARRIED OUT OF THIS PLATE
  - Instagram caption never verified.
  - The three open questions in Part 2 are not claims and are not ingested.
  - Part 7 newsletter and comment bank items are not archive work.
