=== SHANNON BLOCK ===
ARTIFACT
  id: shannon-thesis-1937
  name: A Symbolic Analysis of Relay and Switching Circuits
  category: process
  origin: United States
  line: lovelace
  NOTE: backfilled block. The Claude Shannon story published before the
    SHANNON emit step existed; this block is reconstructed from the EC
    Shannon package VCL so the LOVELACE line's third plate has its record.

EVENTS
  - type: publication
    date: 1937
    label: Shannon completes the MIT master's thesis applying Boolean
      algebra to relay and switching circuits
  - type: publication
    date: 1938
    label: The thesis is published as a paper in the AIEE Transactions

PEOPLE
  - name: Claude Shannon
    role: pioneered
    note: At 21, proved the two-way correspondence between Boolean algebra
      and switching circuits, founding digital circuit design; later
      founded information theory (1948), the archive's namesake.
  - name: Vannevar Bush
    role: led
    note: Shannon tended Bush's Differential Analyzer at MIT, the analog
      computer whose relay circuits prompted the insight.

CLAIMS
  - id: c-shannon-thesis-1937-01
    text: In 1937, 21-year-old Claude Shannon, tending the relay circuits
      of Vannevar Bush's Differential Analyzer at MIT, wrote a master's
      thesis showing that George Boole's two-valued algebra maps onto
      switching circuits.
    status: verified
    source: EC Shannon package VCL (Smithsonian, Britannica, MIT accounts)
  - id: c-shannon-thesis-1937-02
    text: The correspondence runs both ways, circuits can be designed and
      simplified by algebra, and circuits can perform logic, so switches
      can compute.
    status: verified
    source: EC Shannon package VCL
  - id: c-shannon-thesis-1937-03
    text: The thesis is routinely called the most important master's thesis
      ever written; Goldstine called it one of the most important.
    status: verified
    source: EC Shannon package VCL (consensus phrasing; Goldstine quoted
      as "one of the most important")
  - id: c-shannon-thesis-1937-04
    text: Shannon knowingly used Boole's algebra, citing it in the thesis;
      there is no sign he knew of Lovelace's 1843 vision he was completing.
    status: verified
    source: the thesis itself (Boole cited); Convergence Map audit round
      (the hedged second half)
  - id: c-shannon-thesis-1937-05
    text: Eleven years later at Bell Labs, Shannon published A Mathematical
      Theory of Communication (1948), founding information theory.
    status: verified
    source: EC Shannon package VCL
  - id: c-shannon-thesis-1937-06
    text: Shannon lived to 2001, the only member of the Lovelace-Boole-
      Shannon arc who lived to see the digital age.
    status: verified
    source: standard record; Convergence Map audit round

SYNTHESIS EDGES
  - type: enabled
    from: boolean-algebra
    to: shannon-thesis-1937
    claim: c-shannon-thesis-1937-01
  - type: enabled
    from: shannon-thesis-1937
    to: digital circuit design (logic gates, every processor since)
    claim: c-shannon-thesis-1937-02

STORY
  id: story-shannon-thesis-1937
  title: The Most Important Master's Thesis Ever Written
  hook: IN 1937, A 21-YEAR-OLD'S MIT MASTER'S THESIS SHOWED HOW ELECTRICAL
    SWITCHES COULD PERFORM LOGIC. EVERY DIGITAL DEVICE SINCE RUNS ON THAT
    IDEA.
  status: published
  links:
    linkedin: https://www.linkedin.com/feed/update/urn:li:activity:7481004009353515009
    instagram: none (LinkedIn-only per Fai)
    facebook: none (LinkedIn-only per Fai)
    newsletter: published (the Shannon information-theory issue)

CONNECTIONS TO EXISTING ARCHIVE
  Third plate of the LOVELACE line, joining boolean-algebra (published
  story) and lovelace-notes-1843 (published story). The archive itself is
  named for this artifact's author: lines carry engineers who defined a
  field; the whole archive carries Shannon. Incoming edge from
  boolean-algebra (also recorded in that block); the Lovelace block's
  enabled edge points here via the program-versus-data claim.
=== END BLOCK ===
