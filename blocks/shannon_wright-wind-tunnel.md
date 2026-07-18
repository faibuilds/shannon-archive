=== SHANNON BLOCK ===
ARTIFACT
  id: wright-wind-tunnel
  name: Wright brothers' 1901 wind tunnel
  category: other
  origin: United States
  line: unassigned
  FLAG: an instrument, not a military airframe, so no KELLY placement
    despite the aviation subject. Candidate for a future
    instruments/measurement or early-aviation line; flagged to Fai.

EVENTS
  - type: failure
    date: 1901, August
    label: The 1901 glider season ends with roughly one third of predicted
      lift and repeated nose-dives
  - type: decision
    date: 1901, autumn
    label: The Wrights resolve to measure lift and drag themselves,
      beginning with the bicycle-wheel apparatus
  - type: record
    date: 1901, December
    label: Verdict reached: Lilienthal's tables largely correct, Smeaton's
      coefficient wrong; corrected value 0.0033

PEOPLE
  - name: Wilbur Wright
    role: pioneered
    note: Co-designed the tunnel, balances, and parametric method; flew the
      gliders the data corrected.
  - name: Orville Wright
    role: pioneered
    note: Co-designed the tunnel and balances; co-ran the roughly 200-shape
      test program.
  - name: Otto Lilienthal
    role: corrected
    note: His coefficient tables, blamed by the field, were found largely
      correct by the Wrights' measurements; his camber was inefficient. Died
      in a 1896 glider crash.

CLAIMS
  - id: c-wright-wind-tunnel-01
    text: The Wrights designed their 1900 and 1901 gliders using the
      standard lift equation, Lilienthal's tables, and Smeaton's
      coefficient of 0.005, in use since the 1700s.
    status: verified
    source: NASA Glenn Research Center; Smithsonian NASM
  - id: c-wright-wind-tunnel-02
    text: The 1901 glider developed roughly one third of predicted lift,
      with glides up to 300 feet.
    status: verified
    source: NASA Glenn Research Center
  - id: c-wright-wind-tunnel-03
    text: The 1901 glider nose-dived repeatedly and once only the front
      elevator saved Wilbur's life.
    status: verified
    source: National Park Service
  - id: c-wright-wind-tunnel-04
    text: The Wrights first tested the inherited data with a bicycle
      carrying a free-spinning horizontal wheel holding a model wing and a
      flat plate; the wing required an angle more than three times greater
      than Lilienthal's data predicted.
    status: verified
    source: Smithsonian NASM; NASA Glenn Research Center
  - id: c-wright-wind-tunnel-05
    text: In fall 1901 they built a six-foot wooden wind tunnel in their
      bicycle shop, single-speed, fan-driven, read through a viewing window
      as balance dial angles.
    status: verified
    source: NASA Glenn Research Center
  - id: c-wright-wind-tunnel-06
    text: The balances measured the ratio of a model wing's lift to a flat
      plate's drag in the same airflow, canceling air density, speed, and
      Smeaton's constant from the measurement.
    status: verified
    source: NASA Glenn Research Center
  - id: c-wright-wind-tunnel-07
    text: They tested as many as 200 wing shapes made from 20-gauge steel
      strips, with detailed data recorded on dozens.
    status: verified
    source: NASA Glenn Research Center; Smithsonian NASM
  - id: c-wright-wind-tunnel-08
    text: The number of shapes formally recorded is reported as about 30 by
      NASA and nearly 50 by the Smithsonian.
    status: conflicting
    source: NASA Glenn Research Center; Smithsonian NASM
  - id: c-wright-wind-tunnel-09
    text: In the formal series they changed one design variable at a time,
      isolating the effect of camber, aspect ratio, and tip shape.
    status: verified
    source: NASA Glenn Research Center
  - id: c-wright-wind-tunnel-10
    text: By mid-December 1901 the verdict was that Lilienthal's tables
      were largely correct and Smeaton's coefficient was wrong, with
      Lilienthal's camber inefficient.
    status: verified
    source: National Park Service
  - id: c-wright-wind-tunnel-11
    text: The Wrights' measured Smeaton value was 0.0033 against the
      accepted 0.005; the modern accepted value is 0.00326, within about
      one percent of their figure.
    status: verified
    source: NASA Glenn Research Center; Smithsonian NASM
  - id: c-wright-wind-tunnel-12
    text: The inherited 0.005 overstated the pressure by about fifty
      percent relative to the corrected value.
    status: verified
    source: arithmetic on c-11; EC VCL
  - id: c-wright-wind-tunnel-13
    text: The 1902 glider, designed from the corrected data with longer,
      narrower wings and corrected camber, performed as calculated, with
      700 or more glides that autumn, some over 600 feet.
    status: verified
    source: MiGFlug; National Park Service; wright-house
  - id: c-wright-wind-tunnel-14
    text: The longest 1902 glide distance is reported variously as 622.5
      and 662 feet.
    status: conflicting
    source: wright-house; standard accounts
  - id: c-wright-wind-tunnel-15
    text: By December 1901 the Wrights had the aerodynamic data needed for
      a successful flying machine, and the 1903 propellers were designed as
      rotating wings from the same data.
    status: verified
    source: Smithsonian NASM; standard accounts (propeller phrasing on
      audit watch)
  - id: c-wright-wind-tunnel-16
    text: Otto Lilienthal died in a glider crash in 1896.
    status: verified
    source: standard record
  - id: c-wright-wind-tunnel-17
    text: Wilbur's despair remark after the 1901 season exists in
      conflicting variants (fifty years and a thousand years) and was not
      anchored in this pass.
    status: unverifiable
    source: EC VCL (research memory; open question)
  - id: c-wright-wind-tunnel-18
    text: The claim that the balances were made from bicycle spokes and
      hacksaw blades is widely retold but the material specifics were not
      anchored in this pass.
    status: unverifiable
    source: EC VCL (research memory; open question)

SYNTHESIS EDGES
  - type: corrects
    from: wright-wind-tunnel
    to: Smeaton's coefficient (accepted aeronautical constant, 0.005)
    claim: c-wright-wind-tunnel-11
  - type: enabled
    from: wright-wind-tunnel
    to: Wright 1902 glider and 1903 Flyer
    claim: c-wright-wind-tunnel-13

STORY
  id: story-wright-wind-tunnel
  title: They Checked the Number
  hook: IN 1901, EVERY LIFT CALCULATION ON EARTH USED A CONSTANT FROM THE
    1700S. TWO BICYCLE MECHANICS CHECKED IT. IT WAS OFF BY FIFTY PERCENT.
  status: published
  links:
    linkedin: https://www.linkedin.com/posts/engineeringcommunity_when-we-told-the-story-of-the-wrights-and-activity-7483680998392549376-lpPZ
    instagram: none (not posted there per current flow)
    facebook: PENDING-FROM-FAI (post is live; URL not yet supplied)
    newsletter: none

CONNECTIONS TO EXISTING ARCHIVE
  Direct refinement of our published Langley/Wrights story (that post said
  the era's tables were wrong; this one delivers the precise verdict,
  c-10). Wind-tunnel method threads forward to the NACA tunnel work in the
  published P-38 story (thematic; no claim-backed edge asserted). No KELLY
  placement (instrument, not military airframe).
=== END BLOCK ===
