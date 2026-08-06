# SHANNON oral history programme

The remarks wall is the only part of this archive that cannot be
reconstructed later. A claim can be re-verified from sources in fifty years.
A source can be found again. The person who fuelled an SR-71, or sat in the
F-117 cockpit, or was on the ground at Sioux City, cannot. That is the whole
argument for treating this as a programme rather than as comments we happen
to receive.

Started 2026-08-05 (v1.90).

## What changed on the site

**The wall stopped lying.** 31 covered plates were showing an Awaiting
consent stamp with grey redaction bars, on plates where nobody had ever
commented. The renderer fell back to one empty remark object when a plate
had no remarks, and that object rendered as a withheld comment. A reader saw
31 plates where a witness had apparently spoken and refused permission. Now
the stamp appears only where a real remark is genuinely waiting on its
author: 25 of those, all real. The other 31 carry an open call instead.

**Every plate asks something specific.** A wall that says tell us what you
saw collects praise. One that asks for the thing the paperwork never held
collects the record. 27 plates carry their own question; the rest fall back
to a sharpened line default. The wording is in the `ask` field on the plate,
next to `hook`.

## The asks, and why each one

The rule: ask something only a witness can answer, and that a document
cannot. Never ask anyone to perform their worst day.

- **Quebec Bridge.** Do you wear the Iron Ring? What were you told about
  this bridge on the day you received it? Every Canadian engineer receives
  the ring and a story with it, and the story varies. That variation is
  worth recording and nobody has collected it.
- **Tacoma Narrows.** Were you taught the resonance explanation, or the
  flutter one? Billah and Scanlan corrected it in 1991 and textbooks took
  decades to follow. The date the correction reached a given classroom is
  real data about how engineering knowledge actually propagates.
- **A-12.** The programme is declassified now. What did you work on for
  years without being able to name it? People who could not answer this in
  1975 can answer it today, and will not be able to for much longer.
- **C-130.** Seventy years and every kind of runway. Where did you put one
  down, and what did it survive that it had no business surviving? The
  largest living witness population in the archive.
- **AlexNet, EUV, RIVA, 1987 chip design.** The founders of this industry
  are mostly still working. This is the one line where we can collect the
  oral history before it is history.

On plates with fatalities the ask offers to listen and does not ask for a
story: United 232, the Hyatt Regency walkways, Ronan Point, Manchester 28M.
The wording states the toll plainly and then leaves it to the person.

## Priority, by how long we have

1. **A-12, SR-71, U-2, XB-70, B-52 early crews.** Programmes of the late
   1950s and 1960s. Anyone who worked them is 80 or older. This tier has a
   real deadline and everything else can wait.
2. **F-117, B-1, B-2 first generation, F-15, F-14, A-10.** 1970s and 1980s.
   Crews are 60 to 80.
3. **United 232, Manchester 28M, Boeing 747.** Living witnesses in numbers,
   including cabin crew and emergency services, not only engineers.
4. **The semiconductor line.** Founders still working, but this is the tier
   where waiting costs least.
5. **Everything taught rather than witnessed.** Lovelace, Boole, Shannon,
   the Vasa. No deadline, and teachers are easy to reach.

## Already asked, still waiting (25 remarks, 13 plates)

These are real comments whose authors have not answered a consent request.
They render as Awaiting consent with the length of the real text preserved.

| Plate | Waiting |
|---|---|
| B-52 | 3 |
| U-2 | 3 |
| B-1 | 3 |
| B-2 | 3 |
| SR-71 | 2 |
| A-10 | 2 |
| B-21 | 2 |
| P-38 | 2 |
| F-117 | 2 |
| XB-70 | 1 |
| F-15 | 1 |
| F-14 | 1 |

Named holdouts are listed in the privacy gate in `tools/check.js`, which
fails the build if any of them appear in `index.html`. Allen Crane was asked
and has not replied. Stephen Puryear is in conversation but has given no
yes or no. Cliff Hindman has only ever said I agree, which is not consent.

## The consent protocol

1. A remark renders only with `cleared:true`.
2. Consent is per comment, not per person. Ask about the specific comment,
   in the reply thread under that comment, so the scope is unambiguous. The
   Bill Platt case turned on exactly this: he left three comments and
   answered EC under one of them.
3. Conditions go in a `note` field on the remark and stay in the record.
   Brian Berthold consented on condition it is not used to train AI. Matias
   Soto asked to be credited as relaying rather than as the original source.
4. **A caveat that qualifies attribution goes in `credit` as well as
   `note`.** The note is for us; `credit` is a short line that renders on
   the plate and on the share card. Soto's is the only one so far:
   "Relaying, not the original source." Without it, a handsome card with
   his name over the quote presents him as the authority, which is the one
   thing he asked us not to do. A condition about usage, like Berthold's,
   stays in `note` and does not render.
5. **Ask for the card, not only for the site.** Remarks became shareable as
   images in v1.93. The eleven consents we already hold were given for
   featuring on the site, and a downloadable card that EC or a reader posts
   to a feed is wider distribution than that wording covers. Nobody is
   likely to object and the two conditional cases are handled above, but
   the ask should stop understating what happens next. New requests say:
   featured on the plate, and on a shareable card carrying your name, your
   title and a link back. Anyone who agreed under the old wording and would
   rather not appear on a card can be moved back with one field.
4. A name never appears anywhere public before consent, including in
   `graph.json` and `status.json`.
5. When someone consents, remove them from the privacy gate list in
   `tools/check.js` in the same commit that adds their remark.

## What to run

For each plate in priority order, on the post for that plate:

1. Read the comment thread. Identify comments that answer the plate ask, or
   that carry first hand experience of any kind.
2. Reply under that specific comment, naming what you would like to feature
   and where it would appear. Link the plate.
3. Log the reply. Do not chase twice.
4. Report back with: person, plate, the verbatim comment, the verbatim
   consent reply, and any condition attached.

Do not fetch or audit anyone's account beyond the comment threads on EC's
own posts.
