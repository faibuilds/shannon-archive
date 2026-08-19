=== SHANNON BLOCK (ingestion record) ===
ARTIFACT id: sr-71 | name: SR-71 Blackbird
  Existing plate on KELLY L-01, covered since launch. This block adds claims
  to a plate that had none. Ingested 2026-08-18.

WHY THIS EXISTS. The SR-71 plate carried a published hook and nothing else:
  zero claim nodes in the graph. Merch built on it could print only literal
  substrings of that hook, which is why the shirts could not carry a single
  altitude figure. Fai asked for one. This block is the answer.

3 claims: 2 verified, 1 conflicting. 2 sources, 1 event.

WHAT WAS REFUSED FIRST. The obvious pairing, Mach 3.2 at 90,000 feet, was
  refused before this block existed. That figure is the A-12's, and it is
  already in this graph as c-a12-12, about a-12. Hanging it on the SR-71
  would have been exactly the drift this archive exists to catch.

THE MACH 3.2 QUESTION, RAISED AND CLOSED. A research pass suggested that
  Mach 3.2 belongs properly to the A-12 and that the SR-71 plate's own hook
  was therefore attributing one aircraft's number to another. It is not so.
  The Smithsonian states of the SR-71 directly that it could "cruise at
  speeds greater than Mach 3.2". The two aircraft share the figure because
  they share the engine and the airframe lineage. The hook stands unchanged
  and the shirts standing on it are sound. Recorded here because the next
  person to notice the coincidence will ask the same question.

THE RECORD, AND WHY IT IS TWO CLAIMS. 28 July 1976 produced two FAI records
  at Beale Air Force Base, and they were two flights by two crews:
    altitude in horizontal flight, 25,929 m, Helt and Elliott, FAI file 3496
    absolute speed, 3,529.56 km/h, Joersz and Fuller, FAI files 8865 / 8879
  They are recorded separately because they are separate flights. Only the
  altitude claim is what was asked for; the speed claim is here because you
  cannot read the source for one without reading it for the other, and
  leaving it out would have left a half-copied record.

THE CONFLICT, LOGGED NOT RESOLVED. The two sources disagree on whether one
  airframe or two flew those records. This Day in Aviation reproduces the
  FAI entries and has 61-7958 flying both. The Smithsonian says "another
  SR-71" set the speed record. c-sr71-03 is CONFLICTING and prints both
  versions. Nothing here picks a side.

  A second disagreement was found and is NOT ingested, because it is not
  this block's subject and it touches an existing verified claim: the number
  built is given as 32 by This Day in Aviation and by our own c-a12-13, and
  as 33 by the Smithsonian. Flagged for the editor, deliberately left alone.

ON THE FIGURE ITSELF. The FAI record is metric, 25,929 m. Every foot figure
  in circulation is a conversion of it, which is why they disagree in the
  decimals: 85,068 (This Day in Aviation), 85,069 (Smithsonian), 85,068.997
  (Wikipedia). The claim leads with the metre figure and gives the foot
  figure as approximate. Merch prints 85,069 FT, the Smithsonian's rounding.

  It is an altitude in HORIZONTAL FLIGHT record, sustained, not a zoom climb
  peak. Both sources give the record type. Neither says anything about zoom
  climbs, so neither does the claim.

SOURCES. Both read directly, in full, on 2026-08-18.
  src-sr71-tdia-19760728  This Day in Aviation, 28 July 1976. Reproduces the
    FAI record file entries verbatim, including file numbers, class, group,
    performance, date, location, claimant and engines.
  src-sr71-nasm-records   Smithsonian National Air and Space Museum, Setting
    Records with the SR-71 Blackbird.

  A third source was offered and is NOT cited: the National Museum of the
  USAF fact sheet. It refused to serve, twice, and this archive does not
  cite a page it has not read. The FAI database itself was tried and sits
  behind a bot check, which was not worked around.

NODES
  source  src-sr71-tdia-19760728
  source  src-sr71-nasm-records
  event   ev-sr71-records-1976   record, 1976-07-28, subject sr-71
  claim   c-sr71-01  verified     altitude record
  claim   c-sr71-02  verified     speed record
  claim   c-sr71-03  conflicting  one airframe or two

EDGES
  about     c-sr71-01, c-sr71-02, c-sr71-03  ->  sr-71
  cites     each of the three claims  ->  both sources
  event-of  ev-sr71-records-1976  ->  sr-71

WHAT THIS UNLOCKS. no-starter-back can now cite c-sr71-01 through verifyClaims
  alongside its hook facts, and print RECORD ALTITUDE 85,069 FT. Nothing else
  on the SR-71 plate changes.
