=== SHANNON BLOCK ===
ARTIFACT
  id: constellation
  name: Lockheed Constellation (L-049 / C-69)
  category: airframe (ingested as transport per graph vocabulary)
  origin: United States
  line: kelly
  NOTE: slots at first flight Jan 9, 1943, between the B-29 (Sep 1942) and
    the P-80 (Jan 1944). The line's only civil airliner, and the plate that
    carries a documented link to the Wright wind tunnel story via Orville
    Wright's last flight. Added 2026-07-22 (v1.33).
  EDITOR FLAG: the block called this "the EARLIEST plate on the KELLY line."
    That is not correct. The P-38 Lightning (first flight Jan 1939) predates
    it, and the sealed Me 262 and B-29 plates are 1942. The Constellation is
    the earliest CIVIL plate and predates the P-80. "Earliest plate" is not
    asserted anywhere in the graph or on the plate; flagged for Fai.

EVENTS
  - type: decision
    date: 1939
    label: TWA, driven by major stockholder Howard Hughes, asks Lockheed for
      a 40-passenger transcontinental airliner with about 3,500 mile range
  - type: first-flight
    date: 1943-01-09
    label: Constellation first flight
  - type: record
    date: 1944-04-17
    label: Hughes and TWA president Jack Frye fly Burbank to Washington in
      6 hours 57 minutes; on the return trip they later give Orville Wright
      his last flight at Wright Field

PEOPLE
  - name: Kelly Johnson
    role: led
    note: Chief research engineer on the design; the KELLY line's namesake.
      The Constellation predates every aircraft he is famous for, and is the
      only civil design among them.
  - name: Hall Hibbard
    role: led
    note: Lockheed chief engineer. On the stakes: the company had been
      "small-time guys" and now "had to be right and had to be good."
  - name: Howard Hughes
    role: commissioned
    note: TWA major stockholder; set the requirement that forced the design
      and later flew the record transcontinental leg.
  - name: Jack Frye
    role: commissioned
    note: TWA president; co-pilot on the April 1944 record flight.
  - name: Orville Wright
    role: witnessed
    note: Took his last flight aboard a Constellation at Wright Field in
      April 1944, and observed that its wingspan exceeded the distance of
      his own first flight.

CLAIMS (13 verified, c-constellation-14 unverifiable and NOT rendered)
  - c-constellation-01 (verified): Lockheed had worked since 1937 on the
    L-044 Excalibur; in 1939 TWA, at Hughes's instigation, requested a
    40-passenger transcontinental airliner with about 3,500 miles range,
    beyond the Excalibur's capability, producing the L-049 Constellation.
    src: USNI Naval History; Military Wiki; Grokipedia
  - c-constellation-02 (verified): team included president Robert Gross,
    chief engineer Hall Hibbard, chief research engineer Kelly Johnson.
    src: united-states-lines; Grokipedia; Military Wiki
  - c-constellation-03 (verified): a single fin tall enough for the required
    directional stability would not fit inside TWA's hangars, so Lockheed
    split the fin area into three shorter fins to keep height down.
    src: USNI Naval History; MiGFlug
  - c-constellation-04 (verified): the triple tail also sat high enough to
    clear the prop wash and added stability. src: united-states-lines
  - c-constellation-05 (verified): directional stability scales with fin area
    and moment arm rather than the height of any single fin, so three shorter
    fins of equal total area preserve authority while reducing height, at the
    cost of parts, joints, junction drag, and tail structure.
    src: standard aerodynamics; house explanation derived from -03 and -04
  - c-constellation-06 (verified): stood unusually tall because its very long
    propellers required ground clearance. src: united-states-lines
  - c-constellation-07 (verified): the fuselage sloped downward from the tail
    in the graceful dolphin curvature. src: united-states-lines; USNI;
    Military Wiki. The popular stretched-airfoil explanation is unverified
    and not used.
  - c-constellation-08 (verified): fully pressurized cabin, among the first
    on an airliner, allowing cruise above 20,000 feet, over the weather that
    afflicted the DC-3 and DC-4, at more than 300 mph. src: MiGFlug; Grokipedia
  - c-constellation-09 (verified): first flight January 9, 1943.
    src: Grokipedia; MiGFlug
  - c-constellation-10 (verified): on April 17, 1944, the second production
    C-69, piloted by Hughes and Frye, flew Burbank to Washington in 6h57m,
    about 2,300 miles at roughly 330 mph. src: Military Wiki
  - c-constellation-11 (verified): on the return trip the aircraft stopped at
    Wright Field and gave Orville Wright his last flight, more than 40 years
    after his first; he remarked the wingspan was longer than the distance of
    his first flight. Wright Field stop dated Apr 26, 1944; the Apr 17 record
    leg was outbound. src: Military Wiki
  - c-constellation-12 (verified): the L-049 wingspan of 123 ft exceeds the
    120 ft of the first powered flight. (123 ft 5 in is the later C-121
    stretch.) src: Grokipedia specs; Wright first-flight record (EC Wright
    wind tunnel VCL)
  - c-constellation-13 (verified): 856 built across many models, most powered
    by four 18-cylinder Wright R-3350 radials; served as Eisenhower's
    presidential aircraft and in the Berlin Airlift. src: Military Wiki
  - c-constellation-14 (UNVERIFIABLE, not used in copy): Willis Hawkins
    maintained the Excalibur program was purely a cover for the Constellation.
    src: Military Wiki (Hawkins); USNI hedges as "some aviation authorities
    contend"; the L-044 was a legitimate funded study predating Hughes, so
    the pure-cover framing is disputed. Texture only. Recorded in the graph
    as status unverifiable; never renders publicly.

SYNTHESIS EDGES
  - type: responded-to
    from: constellation
    to: concept-constellation-twa-req (TWA transcontinental requirement,
      Hughes, 1939)
    claim: c-constellation-01

STORY
  id: story-constellation
  title: The Shape of a Constraint
  hook (locked, rendered sentence case on the plate): "The most beautiful
    airliner ever built has three tails for one reason. A single tail tall
    enough would not fit in TWA's hangars."
  status: published
  links:
    linkedin: https://www.linkedin.com/feed/update/urn:li:activity:7485936513386500096
    instagram: none (LinkedIn-only per Fai)
    facebook: none (LinkedIn-only per Fai)
    newsletter: none (no newsletter per Fai)
  NOTE: post date Jul 22, 2026 (derived from the LinkedIn activity id).

CONNECTIONS TO EXISTING ARCHIVE
  KELLY line, earliest CIVIL plate (1943), ahead of the P-80. Carries a
  documented human link to the published Wright wind tunnel story: Orville
  Wright's last flight took place aboard this aircraft, and his remark about
  the wingspan versus his first-flight distance is recorded in
  c-constellation-11 and -12. That is a WITNESSED connection between two EC
  artifacts, not a causal one, so it is recorded in the claims but NOT
  asserted as a synthesis edge. Also thematically tied to the C-130 plate
  through Willis Hawkins, who worked on both programs and is the source of
  the Excalibur-as-cover claim (c-constellation-14). No art on the plate yet;
  watching for a public-domain 3-view (the triple tail is the whole point).
=== END BLOCK ===
