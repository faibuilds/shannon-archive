=== SHANNON BLOCK ===
STATUS: LIVE since 2026-07-25 (v1.52) on L-05 TIPPER. The line is public now; any "pending Fai" or "not a live public line" notes below are historical.
NOTE: retroactive VCL backfill. The story published 2026-06 before the
  emit SOP existed and Fai could not locate the original VCL, so this one
  was rebuilt from the published post text with every claim re-verified
  against sources (research pass 2026-07-18). One published claim failed
  verification; see c-liberty-ships-08 and the correction in c-12.

ARTIFACT
  id: liberty-ships
  name: Liberty ship program (wartime welded fleet)
  category: process
  origin: United States
  line: tipper (masked; the public graph carries lineId undisclosed until
    the line launches)

EVENTS
  - type: failure
    date: 1943, January
    label: T2 tanker SS Schenectady fractures almost in half at her
      fitting dock in calm weather, 16 January 1943
  - type: record
    date: 1949
    label: Constance Tipper appointed Reader, the first and only full-time
      woman member of the Cambridge engineering faculty

PEOPLE
  - name: Constance Tipper
    role: pioneered
    note: Cambridge metallurgist who showed the wartime hull fractures
      started in the steel, not the welds; the Tipper test for the
      ductile-to-brittle transition temperature carries her name.

CLAIMS
  - id: c-liberty-ships-01
    text: The US Liberty ship program built more than 2,700 vessels, welded
      rather than riveted, sometimes launching a ship within days of laying
      the keel, to counter U-boat sinkings of Atlantic cargo.
    status: verified
    source: Wikipedia (Liberty ship); Mariners' Museum (2,710 built; record
      launch 4 days 15.5 hours, average build 42 days)
  - id: c-liberty-ships-02
    text: Across the wartime welded fleet there were roughly 1,500 serious
      brittle-fracture incidents.
    status: verified
    source: Liberty ship literature; MDPI Challenges paper; 1946 survey
      counted 1,441 damage cases on 970 vessels
  - id: c-liberty-ships-03
    text: A small number of the ships broke completely in two.
    status: verified
    source: Wikipedia (Liberty ship); Mariners' Museum (twelve ships,
      including three Liberty ships, e.g. SS John P. Gaines, Nov 1943)
  - id: c-liberty-ships-04
    text: The tanker SS Schenectady, a welded wartime T2 sister type, split
      nearly in half at her dock on 16 January 1943 in calm weather shortly
      after sea trials, with a report heard about a mile away, the bow and
      stern sagging as the midsection rose.
    status: verified
    source: Wikipedia (SS Schenectady); bottom plates held, so nearly in
      half is the precise phrasing
  - id: c-liberty-ships-05
    text: Blame initially fell on the shipyards, fast work by inexperienced
      crews using still-new welding techniques.
    status: verified
    source: Wikipedia (SS Schenectady); Mariners' Museum
  - id: c-liberty-ships-06
    text: Constance Tipper, a metallurgist at Cambridge, showed the cracks
      did not initiate in the welds; the steel itself was the underlying
      problem.
    status: verified
    source: Cambridge Engineering Department; Wikipedia (Constance Tipper);
      IMechE archive
  - id: c-liberty-ships-07
    text: The mechanism is the ductile-to-brittle transition; below a
      transition temperature the steel behaves in a brittle manner, and
      North Atlantic winter temperatures were low enough to cross that line.
    status: verified
    source: Cambridge Engineering Department; Wikipedia (Constance Tipper)
  - id: c-liberty-ships-08
    text: Tipper was one of the first women to take the Natural Sciences
      Tripos at Cambridge. (AS PUBLISHED IN THE POST.)
    status: false
    source: Cambridge and Newnham history; the Tripos opened to women in
      1881, over thirty years before Tipper sat it (1912-1915). The error
      circulates in secondary pages, including a Cambridge Engineering
      anniversary page. Correction recorded as c-liberty-ships-12.
      Editorial follow-up flagged to Fai.
  - id: c-liberty-ships-09
    text: In the 1940s the ductile-to-brittle transition was not widely
      understood by ship designers, which is why blame first fell on the
      welding.
    status: verified
    source: Wikipedia (Liberty ship); Mariners' Museum
  - id: c-liberty-ships-10
    text: A riveted hull tends to arrest a running crack at plate
      boundaries; a continuous welded hull lets a crack propagate, and the
      square corners of deck hatches acted as initiation points.
    status: verified
    source: Wikipedia (Liberty ship, SS Schenectady); later fixed with
      reinforcements and crack arrestors
  - id: c-liberty-ships-11
    text: Tipper's work contributed to a standard test for the temperature
      at which steel turns brittle, and steel selection for cold toughness
      in ships, bridges, and pipelines descends from this understanding.
    status: verified
    source: Cambridge Engineering Department; Wikipedia (Constance Tipper);
      IMechE archive
  - id: c-liberty-ships-12
    text: Tipper's actual distinction at Cambridge: appointed Reader in
      1949, she was the first and only full-time woman member of the
      Cambridge engineering faculty. (CORRECTION of c-08; not in the
      published post.)
    status: verified
    source: Wikipedia (Constance Tipper); Cambridge Engineering Department

SYNTHESIS EDGES
  - type: corrects
    from: liberty-ships
    to: the workmanship explanation of the wartime hull fractures
    claim: c-liberty-ships-06
  - type: enabled
    from: liberty-ships
    to: notch-tough steel selection for cold service (the Tipper test)
    claim: c-liberty-ships-11

STORY
  id: story-liberty-ships
  title: Liberty Ships Cracked Under Pressure
  status: published
  links:
    linkedin: https://www.linkedin.com/feed/update/urn:li:activity:7473840985081372672
    instagram: none
    facebook: none
    newsletter: none

CONNECTIONS TO EXISTING ARCHIVE
  Sister story to the Kevlar plate on the same masked line (materials).
  Myth-versus-reality synthesis per SOP V5: the famous blame (workmanship)
  was the wrong reason; the steel was the problem.
=== END BLOCK ===
