# trelix v2.11.0 -> v3.1.1 (Dev.to) — GIF Asset Plan

Article: "trelix v2.11.0 to v3.1.1: Six Feature Areas, Every One of Them Off By Default"
Platform target: Dev.to (native markdown — embed with `![alt](url)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds)
Dev.to draft: https://dev.to/sai_ram_0000/trelix-v2110-to-v311-six-feature-areas-every-one-of-them-off-by-default-26gf-temp-slug-2646138 (`devto_id: 4404473`)

**7 GIFs for the 7 substantive sections. The closing section ("What the 3.x line is for") deliberately gets none**, matching every prior plan in this series.

Sourced by 7 parallel agents (one per section, each blind to the others), then audited as a whole set by a fit reviewer, then re-sourced where the reviewer rejected a pick. Every agent went past the Giphy page text and **decoded the actual GIF frames** with ffmpeg to confirm what is literally animated on screen — Giphy pages carry titles and tags but almost never describe motion, which is how a prior round shipped a pick whose content was never confirmed. All 17 GIF ids used in the six earlier plans were excluded up front.

**Independently re-verified before writing this file:** all 7 media URLs return HTTP 200 with real image bytes (0.8–3.5 MB). No fabricated ids.

---

## GIF 1 — Hero / Opening (detection, not punishment)

**Concept:** A passive array that instantly and unanimously orients on the one thing that changed. `trelix audit verify` is not an alarm and not a punisher — it is a deterministic mechanism whose only job is to point at the exact entry that diverges. Nine independent lenses converging on one foreign object is that, physically.

**Verified GIF:** "Paper Airplane Security Camera GIF"
- Page: https://giphy.com/gifs/security-camera-paper-airplane-motion-detectors-3ohhwMfoVylB3HKL2E
- Direct: `https://i.giphy.com/media/3ohhwMfoVylB3HKL2E/giphy.gif`
- **Size caveat: 3.0 MB at full size — over the 3 MB budget.** Use `https://i.giphy.com/media/3ohhwMfoVylB3HKL2E/giphy-downsized.gif` (1.6 MB) instead.

**On screen (frame-verified, 84 frames):** A 3x3 grid of nine identical white bullet-style surveillance cameras mounted flat on a plain cream wall, shot head-on. They start pointed in mixed directions; a single white paper airplane glides in from the upper left and crosses diagonally. As it travels the cameras pivot on their mounts and track it — the nearest swing to aim directly at it, the rest rotate in sequence to follow — so the whole array converges on the one moving object and stays trained on it. Nothing is fired, dropped, broken or destroyed. No people, no watermark, no on-screen text.

**Placement:** Hero — directly under the title, above the first terminal block showing the hand-edited row and the nonzero `trelix audit verify` output. It sets the read, then the transcript pays it off.

**Caption:**
> Nine lenses, one object that should not be there — every camera turns and points at exactly it. That is all `trelix audit verify` does: touch one row by hand and it names that row's id.

**Alternate (verified):** industrial optical sorter ejecting unripe tomatoes from a red stream — https://giphy.com/gifs/58FMsG5fqiCU37uiiO (heavily motion-blurred, which is why it is the backup)

---

## GIF 2 — What the major bump actually is (present but dormant)

**Concept:** Six feature areas landed at once and every one ships switched off. The right visual is not darkness or absence — it is a physical switch that produces nothing until a hand reaches out and commits. The light was always in the object; the default orientation just was not ON. The glow arriving *after* the deliberate motion is the technical point.

**Verified GIF:** "Off And On Switch GIF"
- Page: https://giphy.com/gifs/perfect-loops-piO8R2DMyCXdalfXWQ
- Direct: `https://i.giphy.com/media/piO8R2DMyCXdalfXWQ/giphy.gif` (1.1 MB)

**On screen (frame-verified):** On a dark matte surface sits a chunky matte-white wedge-shaped block with "OFF" printed on one sloped face and "ON" on the other. A hand enters from the left and rocks the block onto its other face; the moment it tips to ON the block itself lights up and glows bright white. High contrast white-on-black, single continuous motion, clean loop.

**Placement:** Immediately after the sentence establishing that a default v3.0.0 install behaves byte-identically to v2.12.0 — before the enumerated list of the six feature areas. Lands the "present but dormant" claim; the list then explains what is dormant.

**Caption:**
> Everything in the release is already installed. None of it is running until you say so.

**Alternate (verified):** a labelled 12-button switch panel with its backlighting coming up — https://giphy.com/gifs/switchpros-sp9100-rcrforce12-htPWQupkncqPQ5IE9y (the literal "one switch per subsystem" read)

---

## GIF 3 — The audit trail (chained, and a gap is visible)

**Concept:** A weld bead is the closest physical analogue to a hash chain that is not crypto imagery. The torch lays one molten ripple at a time and each fuses into the one immediately before it — the bead only exists as a sequence, and a gap or a cut in it is instantly legible to the naked eye. That is precisely tamper-**evident** rather than tamper-proof: the evidence is visible, the change is not prevented. It also carries the honest limitation well — the bead is strong but it is still just metal in one place, same as the chain and its anchor living in the same SQLite file.

**Verified GIF:** "bead satisfying GIF"
- Page: https://giphy.com/gifs/satisfying-welding-bead-lvqGkwN1t77xK
- Direct: `https://i.giphy.com/media/lvqGkwN1t77xK/giphy.gif`
- **Size caveat: 3.3 MB at full size.** Use `https://i.giphy.com/media/lvqGkwN1t77xK/giphy-downsized.gif` (1.8 MB) instead.

**On screen (frame-verified, 51 frames, 400x400):** Extreme close-up of a weld in progress on a curved steel joint — a white-hot arc at the electrode tip, a glowing orange molten puddle, and trailing behind it a finished bead of evenly stacked overlapping ripples (the classic "stacked dimes" pattern) cooling from yellow to dark grey. The torch travels steadily along the seam, so every loop lays a new ripple on top of the previous one. Faint "CHECK OUT" text is visible in the blurred background of the source footage; no overlay banner or logo.

**Placement:** Immediately after the paragraph explaining that each row hashes the previous row plus its own canonical content, and **before** the paragraph introducing the anchor row. The GIF lands the chain mechanic; the prose then delivers the cut-tail problem the chain alone cannot catch.

**Caption:**
> Every row is fused to the one before it. That's the whole trick — and it's why a gap is the easiest thing in the file to spot.

**Alternate (verified):** hand-forged chain links — https://giphy.com/gifs/handmade-chains-anchor-GzbILQ3Hz2eCk

---

## GIF 4 — Thinking, and a model-aware budget (extend only as far as the job needs)

**Concept:** Both ideas in this section are the same discipline: measure the real thing, and only extend effort where it pays. A tape measure is exactly that instrument — it reaches out as far as the job needs and retracts to nothing when it does not. Both halves map onto it: the context budget stops assuming a fixed `12_000` and derives its ceiling from the actual context window of the model in front of it, and extended thinking is extended for the single caller that reads the reasoning while staying retracted at index time, where enabling it would multiply an indexing run's cost five to ten times to produce reasoning no retrieval path ever reads. Metrology, not inspiration — deliberately not a lightbulb.

**Verified GIF:** "dimensions measure GIF by Reuben Armstrong"
- Page: https://giphy.com/gifs/animation-stopmotion-workshop-xUA7bcTVvYq5oZUvSw
- Direct: `https://i.giphy.com/media/xUA7bcTVvYq5oZUvSw/giphy.gif` (0.96 MB)

**On screen (frame-verified):** Overhead stop-motion shot of a yellow-and-black Stanley tape measure on a scuffed dark wooden workbench. The yellow blade extends straight out across the bench, then retracts back into the case frame by frame until the case sits closed, and the case itself hops a short distance across the bench. Clean loop, no people, no text.

**Placement:** Immediately after the paragraph explaining that only `RetrievalSynthesizer` opts into thinking and that the index-time callers (`ContextualChunker`, `FileSummarizer`) deliberately do not — so the extend/retract read lands on the opt-in-per-call-site point, before the budget paragraph.

**Caption:**
> Extended thinking is a request parameter, not a model — you extend it for the one caller that needs the reasoning and retract it everywhere nobody reads the output.

**Alternate (verified):** archival footage of a scientist taking a caliper reading and recording it — https://giphy.com/gifs/usnationalarchives-archivesgif-caliper-usia-S8fTzgztm1r9pvfo6m

---

## GIF 5 — Compression that cannot cost you a result

**Concept:** The invariant here is geometric, not statistical. Wave 1 lays down the exact uncompressed pack; wave 2 is only allowed to drop compressed candidates into the gaps wave 1 could not fill. Nothing already placed is moved, substituted or evicted — which is why the compressed pack is a strict superset and quality cannot regress by construction. Interlocking pieces into leftover notches in a fixed frame is the literal picture of "append into the gaps, never evict." The obvious "compress" and "trash compactor" searches were deliberately avoided: they return hydraulic presses crushing things, which teaches the exact opposite of the invariant.

**Verified GIF:** "Loop Magic GIF by cintascotch"
- Page: https://giphy.com/gifs/loop-magic-tetris-DrZFpt5q7jeXC
- Direct: `https://i.giphy.com/media/DrZFpt5q7jeXC/giphy.gif` (1.8 MB)

**On screen (frame-verified, all 62 frames):** Live-action stop-motion against a plain warm-grey wall. A blue L-shaped block of painted wooden cubes drops in and settles at the bottom left. A yellow L-piece descends and rotates into place so it interlocks with the blue piece's notch, filling it flush. A red 2x2 square then drops, slides sideways across the top of the stack, and falls into the one remaining gap at the right, completing a solid interlocked bar of blue, yellow and red. **No piece is ever crushed, removed or cleared** — each new piece only occupies leftover negative space. The final frames flicker once between the completed stack and the empty wall as the loop resets.

**Placement:** Immediately after the paragraph stating the superset property — specifically after the sentence explaining that accepted compressed entries are appended and never substituted, and before any config detail. It should land as visual proof of the invariant, not as a section opener.

**Caption:**
> Wave two only gets the gaps wave one could not fill. Nothing already placed has to move.

**Alternate (verified):** https://giphy.com/gifs/cbc-M8vBiv9mgpHDGpqL9y (weaker fit — keep the Tetris pick unless it fails to load)

---

## GIF 6 — The editor surface, and one ranking flag

**Concept:** A mechanical coin sorter as the picture of ranking. The section's real point is that nothing was missing from the index — `Database.bm25_search` was already there at rank 34 of 90, sitting under sixteen test functions and four doc headings that merely mention the term. It was a placement problem, not a recall problem. A coin sorter is exactly that: every coin is already in the machine, riding the same channel, and the mechanism's only job is to drop each one into the slot its actual size earns. Graded deterministic placement — the opposite of shuffling, which the brief ruled out. It reads as "one flag changed where this lands," not "we found something new."

**Verified GIF:** "coin sorting GIF"
- Page: https://giphy.com/gifs/sorting-oddlysatisfying-coin-QaPkV29BJh3gI
- Direct: `https://i.giphy.com/media/QaPkV29BJh3gI/giphy.gif` (1.9 MB)

**On screen (frame-verified, 69 frames):** Overhead shot of a cream plastic mechanical coin sorter on a desk. Loose mixed-size silver and gold-coloured coins feed in and slide down a curved S-shaped channel at the top left, then run along a graded rail where each coin drops out through the first gap wide enough for it. Over the loop the sorted coins visibly stack up in the ranked slot columns along the bottom right while new coins keep flowing. Continuous single-direction motion, no cuts, no text or watermark. The machine fills the frame, so it stays legible at small size.

**Placement:** In the ranking half of the section, immediately after the rank-34-of-90 line and **before** the flag is named. It lands the diagnosis (bad placement, not bad recall) so the fix reads as a one-line consequence rather than a discovery.

**Caption:**
> Rank 34 of 90, behind sixteen tests that only mention the word. Nothing was missing from the index — it was falling into the wrong slot.

**Alternate (verified):** gold panning, material graded by density — https://giphy.com/gifs/discovery-gold-rush-goldrush-goldpan-FUkwnNhjAIInZm7dGh

---

## GIF 7 — Then three releases proving the surface was true

**Concept:** The technical point is the gap between "it ran" and "it was right": the off-by-one still resolved to a valid row, so every automated check said fine. Nothing burned down — someone had to go back over finished work and actually look at it up close. So the metaphor is deliberate close-range scrutiny of a machine you already built. It reads as follow-through and craft pride, not catastrophe: no smoke, no failure, just a person choosing to re-examine something that already appeared to work.

**Verified GIF:** "Look Inspect GIF by IFHT Films"
- Page: https://giphy.com/gifs/ifhtfilms-magnifying-glass-inspect-3SggeTHkfnN1cRseK3
- Direct: `https://i.giphy.com/media/3SggeTHkfnN1cRseK3/giphy.gif` (1.0 MB)

**On screen (frame-verified, 13 frames, 480x270):** One continuous shot, no cuts. A young man in a dark shirt stands in a bike workshop behind a bicycle frame tube crossing the foreground diagonally, shelves of shop bottles behind him. He raises a large round magnifying glass to his face and pushes it closer, so his eye and eyebrow balloon and warp through the lens as he peers at the frame. Loops cleanly, and the enlarged eye reads instantly at thumbnail size.

**Placement:** Immediately after the paragraph explaining the parser off-by-one — specifically after the line that a validity check passes while only a correctness check catches it — and before the rendering-bugs and unimplemented-safety-guarantee paragraphs.

**Caption:**
> A valid answer and a correct answer look identical from a distance. You only see the difference when you go back and put the work under glass.

**Alternate (verified):** the same US National Archives caliper clip listed under GIF 4 — https://giphy.com/gifs/usnationalarchives-archivesgif-caliper-usia-S8fTzgztm1r9pvfo6m (do not use in both sections)

---

## Notes

- **Dev.to embed:** `![alt text](https://i.giphy.com/media/<ID>/giphy.gif)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds it.
- **Two GIFs exceed the 3 MB budget at full size** — GIF 1 (3.0 MB) and GIF 3 (3.3 MB). Swap `giphy.gif` for `giphy-downsized.gif` on both; that halves them to 1.6 MB and 1.8 MB with no meaningful quality loss at article width. A `200w.gif` variant exists for each at ~0.8 MB if you want to go lighter still.
- **No GIF for the closing section** ("What the 3.x line is for"), matching every prior plan in this series.
- **Distinctness verified:** none of the 7 picks duplicates any of the 17 ids used across `trelix-v2-release`, `trelix-v2-9-release`, `trelix-v2-11-release` (both plans), `tombstone-v1` or `tombstone-v1-4-release`. No two sections within this article share an id or a metaphor.

### Conflicts caught and resolved during review

- **GIF 1 (hero) — first pick rejected outright, both primary and backup.** The original was a Homer Simpson polygraph clip. Frame inspection showed the machine erupting in flame and ejecting its paper spool on the answer "Yes," then sitting smoking and wrecked. The two-second read is not "instant unarguable detection" — it is *a false positive from an instrument that then destroys itself*, the exact inverse of what the section claims, and it would have put an exploding-equipment image at the top of an article whose editorial frame is calm follow-through. Its backup (a man holding a folded banknote at his face) read as sniffing cash rather than checking a note against the light, ended with no verdict, and carried two burned-in network watermarks. Re-sourced to the camera array.
- **GIF 4 — first pick rejected on two independent grounds.** Its "verified" description claimed a caliper reading an inside diameter; frame inspection found a micrometer taking a wall-thickness reading on a torn corroded duct, across three hard cuts — so the caption's central detail was wrong. That same asset was *also* section 7's listed backup, which flagged that sections 4 and 7 were mining the same inspection imagery. Re-sourced to the tape measure, which fits the extend/retract point better than any caliper would.
- The remaining five sections (2, 3, 5, 6, 7) passed review unchanged.
- **Stale-concept correction made by hand after the workflow:** section 4's concept prose still described the rejected caliper footage rather than the tape measure that replaced it, and its placement field came back empty. Both rewritten here. Worth remembering — when a repair stage swaps a pick, any prose field the *original* agent wrote about that pick becomes stale and needs re-checking, since the schema carries them independently.
