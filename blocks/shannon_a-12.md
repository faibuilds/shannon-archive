=== SHANNON BLOCK ===
ARTIFACT
  id: a-12
  name: Lockheed A-12 (OXCART)
  category: airframe (ingested as recon per graph vocabulary)
  origin: United States
  line: kelly
  NOTE: slots at first flight April 1962, between the U-2 (Aug 1955) and the
    SR-71 (Dec 1964). Records that the famous shape was reached by iteration:
    the A-12 is Archangel-12, the twelfth design. Added 2026-07-23 (v1.37).
  EDITOR FLAG: the block called this "the LATEST plate on the KELLY line."
    That is not correct. April 1962 sits mid-line, and the line runs to the
    B-21 Raider (Nov 2023). It IS the latest Kelly Johnson design on the
    line, which is what makes the "1943 to 1962 under one designer" framing
    in CONNECTIONS hold (Constellation at one end, A-12 at the other).
    "Latest plate" is not asserted anywhere in the graph or on the plate.

EVENTS
  - type: decision
    date: 1956-08-16
    label: Bissell convenes the first meeting on reducing the U-2's radar
      cross section, becoming Project RAINBOW, which fails
  - type: decision
    date: 1958-04-21
    label: Kelly Johnson makes his first notes on a Mach 3 aircraft,
      initially U-3, evolving into Archangel I
  - type: decision
    date: 1958-11
    label: Land Panel provisionally selects Convair's FISH over Lockheed's A-3
  - type: decision
    date: 1959-06
    label: Panel provisionally selects Lockheed's A-11 over FISH and orders
      both companies to redesign
  - type: decision
    date: 1959-09-14
    label: CIA selects the A-12 over Convair's KINGFISH; Project OXCART
      established
  - type: first-flight
    date: 1962-04
    label: A-12 first flight at Groom Lake
  - type: record
    date: 1965
    label: Declared fully operational at design specifications, sustained
      Mach 3.2 at 90,000 feet

PEOPLE
  - name: Kelly Johnson
    role: led
    note: The KELLY line's namesake. Reached the definitive Mach 3 shape on
      the twelfth design after eleven rejected predecessors and two years of
      competitive review.
  - name: Richard Bissell
    role: commissioned
    note: CIA Deputy Director for Plans; convened the RCS work that became
      RAINBOW and drove the U-2 successor program.
  - name: Edwin Land
    role: reviewed
    note: Chaired the review panel that twice declined to select Lockheed's
      design before the A-12 won.
  - name: Francis Gary Powers
    role: witnessed
    note: His U-2 was shot down over the Soviet Union in May 1960, during
      A-12 development, confirming the threat the program answered.

CLAIMS (all 14 verified)
  - c-a12-01: Bissell convened the first RCS meeting Aug 16, 1956; Project
    RAINBOW failed to reduce RCS enough. src: Skytamer; Wikipedia; CIA/Robarge
  - c-a12-02: Apr 21, 1958 Johnson's first notes on a Mach 3 aircraft, first
    called U-3, evolving into Archangel I. src: Skytamer
  - c-a12-03: Johnson and Bissell agreed on one more round before satellites
    made aircraft reconnaissance obsolete for covert work.
    src: Johnson quoted in Wikipedia; CIA/Robarge
  - c-a12-04: U-2 was ANGEL, so successors were ARCHANGEL, A-1 through A-11;
    the A-12 was the twelfth internal design effort.
    src: Wikipedia; The Aviationist; National Interest
  - c-a12-05: Nov 1958 Land Panel picked Convair's FISH over the A-3; June
    1959 it picked the A-11 over FISH and ordered both to redesign. src: Skytamer
  - c-a12-06: Sept 14, 1959 the CIA selected the A-12 over KINGFISH and
    established OXCART. src: Skytamer; Wikipedia
  - c-a12-07: CIA reps initially favoured Convair for smaller RCS; the A-12
    won on slightly better specs, much lower projected cost, and track record
    (B-58 late and over budget; U-2 on time and under budget).
    src: Wikipedia (explicit)
  - c-a12-08: Sustained Mach 3.2 heats the airframe past 250 C, beyond
    aluminium's tolerance, so it was built overwhelmingly from titanium.
    src: MiGFlug; CIA/Robarge
  - c-a12-09: Titanium forced new tools, welding, and inspection. Titanium
    conducts heat poorly so cutting heat destroys conventional tooling; hot
    titanium absorbs oxygen and nitrogen and embrittles, requiring inert-gas
    shielded welding. src: MiGFlug; CIA.gov OXCART; standard materials engineering
  - c-a12-10: Much of the titanium was reportedly acquired covertly through
    shell companies from Soviet-controlled sources. src: declassified CIA
    documents and Ben Rich's memoir. Copy carries attribution and the "much
    of" hedge.
  - c-a12-11: Testing from Groom Lake, a dry lakebed in Nevada.
    src: 19FortyFive; standard record
  - c-a12-12: 1965 declared fully operational at design specifications,
    sustained Mach 3.2 at 90,000 ft, after hundreds of hours flown at high
    personal risk by CIA and Lockheed pilots. src: CIA.gov OXCART (official)
  - c-a12-13: Fifteen A-12s built (12 recon, 1 trainer, 2 M-21 drone
    carriers; the 32 SR-71s and 3 YF-12s are separate programs); retired
    1968; the SR-71 became far better known.
    src: The Aviationist; MiGFlug; standard record
  - c-a12-14: Titanium reactivity caused shop failures: cadmium from plated
    wrenches produced galvanic corrosion and bolt failure at temperature, and
    spot welds failed seasonally because Burbank raised summer chlorine
    against algae. src: Ben Rich. BANKED, held out of the post for length,
    cleared for comment-thread use.

SYNTHESIS EDGES
  - type: responded-to
    from: a-12
    to: concept-u2-vulnerability (U-2 vulnerability to Soviet air defences)
    claim: c-a12-01
  - type: enabled
    from: a-12
    to: sr-71 (the SR-71 Blackbird ARTIFACT, not a concept)
    claim: c-a12-13
    NOTE: this is the archive's first claim-cited artifact-to-artifact edge
    between two KELLY plates, so it draws as a real trace on the board.

STORY
  id: story-a-12
  title: Eleven Drafts to Archangel
  hook (rendered sentence case on the plate): "The SR-71's shape came from an
    aircraft called the A-12. The A stands for Archangel. The 12 means eleven
    designs came first and failed."
  status: published
  links:
    linkedin: https://www.linkedin.com/posts/engineeringcommunity_by-1956-the-u-2-was-already-living-on-borrowed-activity-7486167263507566592-soPs
    instagram: published, URL PENDING FROM FAI
    facebook: published, URL PENDING FROM FAI
    newsletter: none (no newsletter per Fai)
  NOTE: post date Jul 23, 2026 (derived from the LinkedIn activity id). This
    is the first story published beyond LinkedIn; the plate links LinkedIn
    only until the Instagram and Facebook URLs arrive.

CONNECTIONS TO EXISTING ARCHIVE
  KELLY line, between the U-2 and the SR-71. Three ties to published EC
  stories: the U-2 post (the A-12 exists because the U-2 was becoming
  reachable, and the Powers shootdown during development proved it), the
  SR-71 post (the A-12 is its direct parent, recorded as a claim-cited
  enabled edge and now visible on the board), and the P-80 post (the delivery
  record that won this contract was built by the 143-day tent program;
  contextual, not claim-backed, so no edge is asserted). Together with the
  Constellation plate, the line now spans 1943 to 1962 under one designer.
=== END BLOCK ===
