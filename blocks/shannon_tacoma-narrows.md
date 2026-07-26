=== SHANNON BLOCK ===
STATUS: LIVE since 2026-07-25 (v1.52) on L-02 PETROSKI. The line is public now; any "pending Fai" or "not a live public line" notes below are historical.
NOTE: retroactive VCL backfill. The story published 2026-07 before the
  emit SOP existed and the original VCL could not be located, so this one
  was rebuilt from the published post text with every claim re-verified
  against fetched sources (research pass 2026-07-18). All 16 claims
  verified; no corrections required.

ARTIFACT
  id: tacoma-narrows
  name: Tacoma Narrows Bridge (1940)
  category: other
  origin: United States
  line: roebling (masked; the public graph carries lineId undisclosed
    until the line launches)

EVENTS
  - type: record
    date: 1940, July
    label: Opens 1 July 1940 as the third-longest suspension span in the
      world
  - type: failure
    date: 1940, November
    label: Deck tears apart in torsional flutter on 7 November 1940 and
      falls into Puget Sound
  - type: publication
    date: 1991
    label: Billah and Scanlan publish the correction identifying
      aeroelastic flutter, not forced resonance

PEOPLE
  - name: Leon Moisseiff
    role: designed
    note: Deflection theory advocate; had worked on the Manhattan Bridge
      and the Golden Gate. The collapse effectively ended his career;
      colleagues formally exonerated him. Died 1943.
  - name: F. Bert Farquharson
    role: investigated
    note: University of Washington professor whose wind-tunnel study
      reached its fix five days before the collapse; went onto the
      twisting span to try to rescue the dog Tubby and was bitten.
  - name: Kurt Billah
    role: corrected
    note: Co-author of the 1991 paper correcting the resonance story.
  - name: Robert Scanlan
    role: corrected
    note: Co-author of the 1991 paper correcting the resonance story.

CLAIMS
  - id: c-tacoma-narrows-01
    text: The Tacoma Narrows Bridge opened on 1 July 1940 as the
      third-longest suspension span in the world.
    status: verified
    source: WSDOT TNB history; Wikipedia (behind Golden Gate and George
      Washington)
  - id: c-tacoma-narrows-02
    text: Its designer Leon Moisseiff had worked on the Manhattan Bridge
      and the Golden Gate Bridge.
    status: verified
    source: Moisseiff biographies (Wikipedia, PBS, Linda Hall); WSDOT
  - id: c-tacoma-narrows-03
    text: Moisseiff's deflection theory held that a long span could be far
      lighter and more flexible than tradition demanded.
    status: verified
    source: WSDOT 1940-bridge and stories pages
  - id: c-tacoma-narrows-04
    text: The bridge used solid plate girders 8 feet deep in place of the
      25-foot open stiffening trusses of the original state proposal.
    status: verified
    source: WSDOT 1940-bridge page; Wikipedia
  - id: c-tacoma-narrows-05
    text: Construction workers nicknamed it Galloping Gertie because the
      deck rose and fell several feet in mild winds before the bridge
      opened.
    status: verified
    source: WSDOT stories page; Wikipedia (roadway crews, May 1940)
  - id: c-tacoma-narrows-06
    text: Tie-down cables and hydraulic buffers were tried and did not stop
      the motion.
    status: verified
    source: Wikipedia; WSDOT (cables snapped; buffer seals damaged during
      sandblasting)
  - id: c-tacoma-narrows-07
    text: Professor F. Bert Farquharson of the University of Washington
      studied the bridge with wind-tunnel models and by 2 November 1940 had
      proposed a fix, deflectors to alter the airflow, unimplemented when
      the bridge fell five days later.
    status: verified
    source: Wikipedia; Live Science; WSDOT
  - id: c-tacoma-narrows-08
    text: The bridge collapsed on 7 November 1940 in a wind of about 40
      mph, the deck twisting up to 45 degrees in a growing alternating
      motion, and fell into Puget Sound.
    status: verified
    source: WSDOT collapse page; Wikipedia; APS News (some accounts say 42
      mph; about 40 is safe)
  - id: c-tacoma-narrows-09
    text: The long-taught forced-resonance explanation is wrong; the wind
      was steady, with no rhythmic pulse matching a bridge frequency.
    status: verified
    source: Billah and Scanlan 1991, Am. J. Phys. 59:118-124; WSDOT
      lessons page
  - id: c-tacoma-narrows-10
    text: In 1991 Billah and Scanlan published the correction identifying
      aeroelastic flutter, a self-excited negative-damping phenomenon, as
      the mechanism.
    status: verified
    source: Billah and Scanlan 1991 (AIP, ADS)
  - id: c-tacoma-narrows-11
    text: In flutter the twisting deck reshapes the airflow so the
      aerodynamic force acts in the direction of the motion, adding energy
      each cycle.
    status: verified
    source: Billah and Scanlan 1991; WSDOT bridges-failure page
  - id: c-tacoma-narrows-12
    text: One car remained on the deck; News Tribune editor Leonard
      Coatsworth crawled off largely on hands and knees, leaving his
      daughter's dog Tubby in the car.
    status: verified
    source: WSDOT Tubby trivia page; HistoryLink; Wikipedia (about 500
      yards to the tower)
  - id: c-tacoma-narrows-13
    text: Farquharson went onto the twisting span to try to rescue Tubby
      and was bitten for the attempt.
    status: verified
    source: WSDOT Tubby trivia page; ASCE Civil Engineering Source
      (photographer Howard Clifford also attempted a rescue; the
      Farquharson account stands as written)
  - id: c-tacoma-narrows-14
    text: Tubby was the only life lost in the collapse.
    status: verified
    source: WSDOT; Wikipedia; HistoryLink
  - id: c-tacoma-narrows-15
    text: The collapse effectively ended Moisseiff's career and the era of
      ever lighter, narrower, more flexible spans.
    status: verified
    source: Wikipedia (Moisseiff); SF Examiner; WSDOT (colleagues formally
      exonerated him; he died in 1943)
  - id: c-tacoma-narrows-16
    text: Since the collapse, wind-tunnel aerodynamic testing became
      standard practice for long-span suspension bridge design.
    status: verified
    source: WSDOT bridges-failure page; Wikipedia

SYNTHESIS EDGES
  - type: corrects
    from: tacoma-narrows
    to: the forced-resonance textbook explanation of the collapse
    claim: c-tacoma-narrows-10
  - type: forced
    from: tacoma-narrows
    to: wind-tunnel testing as standard practice for long spans
    claim: c-tacoma-narrows-16

STORY
  id: story-tacoma-narrows
  title: Tacoma Narrows Bridge Collapse Due to Aeroelastic Flutter
  status: published
  links:
    linkedin: https://www.linkedin.com/feed/update/urn:li:activity:7478593943018819584
    instagram: none
    facebook: none
    newsletter: referenced (the 747 flutter newsletter is cross-linked in
      the post close)

CONNECTIONS TO EXISTING ARCHIVE
  Myth-versus-reality synthesis per SOP V5: the famous resonance
  explanation is the wrong reason. Flutter also appears in the published
  P-38 compressibility material and the 747 newsletter, cross-referenced
  in the post. Structures line candidate (masked).
=== END BLOCK ===
