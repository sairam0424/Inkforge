# cost-guard-mcp (Dev.to) — GIF Asset Plan

Article: "Why I Built cost-guard-mcp: Pre-Flight Cost Guardrails for AI Agents Talking to Data Warehouses"
Platform target: Dev.to (native markdown — embed with `![alt](url)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds)
Dev.to draft: https://dev.to/sai_ram_0000/why-i-built-cost-guard-mcp-pre-flight-cost-guardrails-for-ai-agents-talking-to-data-warehouses-4k9g-temp-slug-4595971 (`devto_id: 4643696`)

**5 GIFs for the article's 5 headings.** Sourced by 5 parallel agents, then audited as a whole set by a fit reviewer, then re-sourced/deduped where needed. All 31 GIF ids used across the six prior plans in this series were excluded up front — none of this article's picks collide with them or with the 6 picks sourced for the companion tracehub-mcp article in the same session.

**Independently re-verified before writing this file:** all 5 media URLs return HTTP 200 with real image bytes. No fabricated ids.

---

## GIF 1 — Hero / Opening (the query that shouldn't have run)

**Concept:** A trivially small, ordinary action — one plausible-looking SQL query — triggering a consequence wildly disproportionate to it, with no warning beforehand.

**Verified GIF:** "Art Topple" GIF by Ilka & Franz
- Page: https://giphy.com/gifs/9xctlfYe29DYG5lfhG
- Direct: `https://i.giphy.com/media/9xctlfYe29DYG5lfhG/giphy.gif` (0.28 MB)

**On screen (frame-verified, all 15 frames):** A hand flicks one domino with a single finger; a row of roughly 13 dominoes cascades to the far end in under a second, on a plain red/magenta backdrop. No watermark, no text, no brand mark.

**Placement:** Hero — directly under the article title, above the fold.

**Caption:**
> One query, one flick of a finger — and the warehouse does the rest.

**Alternate (verified, genuinely different mechanism):** a 3D render of one small domino toppling a series of progressively much larger dominoes/blocks — https://giphy.com/gifs/t6mIkG5RzUgJhfvg91

---

## GIF 2 — An estimate that tells you how much to trust itself

**Concept:** Every cost estimate carries a self-declared accuracy tier (`PRECISE` vs `UPPER_BOUND`) rather than shipping as one bare, falsely-confident number.

**Verified GIF:** "Measuring Home Improvement" GIF by REEKON Tools
- Page: https://giphy.com/gifs/bpI4GEpyDsvIlH5pZm
- Direct: `https://i.giphy.com/media/bpI4GEpyDsvIlH5pZm/giphy.gif` (2.91 MB — under budget but close; use `giphy-downsized.gif` if page load feels heavy)

**On screen (frame-verified):** A tape measure extended across a surface, tick marks and inch numbers visible on the blade, while the tool's own digital display simultaneously shows a precise fractional readout (e.g. "17 13/16", "18 7/8") as the tape moves. No movie/TV clip; the only mark is the REEKON Tools logo on the physical device itself.

**Placement:** Primary image for "An estimate that tells you how much to trust itself," after the three-tier explanation.

**Caption:**
> The tape gives you the tick mark and the exact fraction next to it — not one number you're supposed to just believe.

**Alternate (verified):** a person in a hard hat sighting a spirit level's bubble against its marked lines — https://giphy.com/gifs/QFQ0IvGNNGPNOAZm9b

---

## GIF 3 — Refusing is safer than guessing

**Concept:** Fail-closed design: the tool stops itself rather than proceeding on a guess when it cannot confidently cost a query.

**Verified GIF:** "Iris Lens" GIF by Kinter Media
- Page: https://giphy.com/gifs/kintermedia-media-kinter-SPnzYtfcTqy3XJGzJr
- Direct: `https://i.giphy.com/media/SPnzYtfcTqy3XJGzJr/giphy.gif`
- **Size caveat: 3.57 MB at full size — over the 3 MB budget.** Use `https://i.giphy.com/media/SPnzYtfcTqy3XJGzJr/giphy-downsized.gif` (1.36 MB) instead.

**On screen (frame-verified, ~9.6s loop):** Hands rotating a camera lens aperture ring; the iris blades narrow closed around the opening. Warm, deliberate, no text, no watermark, no faces, no violence.

**Placement:** Section hero image for "Refusing is safer than guessing," after the heading, before the `run_query_bounded` refusal-logic explanation.

**Caption:** *(none supplied by the workflow — write one before publishing; suggested: "It doesn't slam shut. It just doesn't open until it can see what's on the other side.")*

**Reviewer note — a real, worth-knowing catch:** the original primary here was a pin-tumbler lock GIF (`g9FBfdFszxcGY`), with the claim that its pins "visibly fail to align so the mechanism does not turn." The reviewer independently decoded all 39 frames and found the cylinder never attempts to rotate at any point in the loop — no turn, no failed turn, just a key sliding in and back out. That claim was corroborated as unconfirmable by a second, independent tell: the *same* Giphy id also showed up as **this article's own GIF 4 alternate**, where a different agent described the identical frames as pins *successfully* lifting to the shear line and resetting — the opposite read. Two independently "verified" descriptions of one file landing on opposite success/failure conclusions is proof the clip is ambiguous, not evidence either reading is correct. Swapped to the Iris Lens pick above, whose closing motion needs no contested interpretation.

---

## GIF 4 — Hardening the guardrail tool, immediately

**Concept:** Locking your own door the moment you move in, before anyone is even looking — the v0.1.1 security-hardening pass shipped one day after v0.1.0, before the project had a single star.

**Verified GIF:** "bolt" GIF
- Page: https://giphy.com/gifs/trPLWSBqmX2a4
- Direct: `https://i.giphy.com/media/trPLWSBqmX2a4/giphy.gif` (2.00 MB)

**On screen (frame-verified, 5 sampled frames across 200):** A clean 3D render of a hex nut threading onto a bolt, rotating slowly on a neutral grey studio background. No watermark, no text, no people, no brand — pure mechanical precision, looping smoothly.

**Placement:** Section hero image for "Hardening the guardrail tool, immediately," after the heading, before the Trusted Publishing / CodeQL / Scorecard list.

**Caption:** *(none supplied by the workflow — write one before publishing; suggested: "Every one of these was free for a public repo. They just hadn't been turned on yet.")*

**Note on how this pick was chosen:** this section's own sourcing agent independently picked the *same* contested lock GIF (`g9FBfdFszxcGY`) as its primary — a genuine, coincidental intra-run collision, not a review-stage rejection. The deterministic dedup step caught the collision automatically and fell through to this section's own backup (the bolt GIF) before the fit review even ran. Do **not** reach for that lock GIF as a fallback for this section either — it's the same ambiguous clip flagged in GIF 3 above, still listed as this section's alternate below only for the record.

**Alternate on file (ambiguous — do not use without re-verifying):** "Lock" GIF — https://giphy.com/gifs/g9FBfdFszxcGY

---

## GIF 5 — What this doesn't do yet, on purpose (close)

**Concept:** Stating known limitations plainly, as a confident boundary rather than an apology — Databricks unsupported, Cortex AI cost excluded, capacity-billed projects get no dollar figure.

**Verified GIF:** "GrandCanyonTV - foot danger edge" GIF
- Page: https://giphy.com/gifs/Tfj2jvOFJEFHKj9p9o
- Direct: `https://i.giphy.com/media/Tfj2jvOFJEFHKj9p9o/giphy.gif` (0.56 MB)

**On screen, corrected per the reviewer's own frame-check — read this before publishing:** the reviewer independently decoded this clip and found the motion is a **repeated leg-swing/dangle over the void**, not the "calm, resting/unhurried" framing the sourcing agent originally claimed. It is still silhouetted hiking boots at a rock ledge with the Grand Canyon dropping away into hazy distance beyond the edge — no watermark, no text, no recognizable film/TV clip — but the boots are swinging, not still. That's a minor description-accuracy correction, not a reason to swap: "here's exactly where solid ground ends" still reads correctly even with the boots in motion.

**Placement:** Primary image for the closing "known limitations" section.

**Caption:**
> Databricks, Cortex AI cost, capacity-billed projects — this is where the known ground ends. We're not guessing past it.

**Alternate (verified):** a highlighted single line on a printed page/document — https://giphy.com/gifs/Kyocera-DS-UTN6gKIOCk6BVapu06

---

## Notes

- **Dev.to embed:** `![alt text](https://i.giphy.com/media/<ID>/giphy.gif)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds it.
- **Two GIFs need a lighter variant** to comfortably clear Dev.to's ~3 MB budget: GIF 2 (2.91 MB, borderline — `giphy-downsized.gif` not strictly required but available) and GIF 3 (3.57 MB full-size, use `giphy-downsized.gif` at 1.36 MB).
- **Two captions are missing** (GIF 3 and GIF 4) — neither the original sourcing agent nor the swap/dedup process supplied one for the picks that ended up in those slots. Suggested drafts included above; write final versions before publishing.
- **Distinctness verified three ways:** against the 31 ids used across the six prior plans in this series (zero collisions), against the 6 ids sourced for the companion tracehub-mcp article in this same session (zero collisions), and among these 5 picks themselves (zero intra-article duplicates).
- **No section deliberately left without a GIF** — all 5 headings get one, matching the article's smaller scope.

### Conflicts caught and resolved during sourcing

- **A single ambiguous asset (`g9FBfdFszxcGY`, a pin-tumbler lock GIF) nearly landed in this article twice, for two different reasons.** First, two independent sourcing agents (GIF 3 and GIF 4's own agents) each picked it as their primary — a real intra-run coincidence, caught and resolved automatically by the deterministic dedup step, which is why GIF 4 ended up on its backup (the bolt GIF) before review even started. Second, the fit reviewer separately found that the *content itself* was misdescribed: one agent's write-up claimed the pins "fail to align," while the other (unaware they'd picked the same file) described the identical frames as pins "successfully lifting to the shear line" — opposite conclusions about one piece of footage. The reviewer treated that contradiction as proof of ambiguity rather than trusting either read, and GIF 3 was swapped to the Iris Lens pick instead.
- **GIF 5's on-screen motion was corrected, not swapped.** The reviewer's own frame-decode found the boots are swinging, not resting/still as originally claimed — flagged plainly in this file rather than left uncorrected, since the pick itself is otherwise clean and the metaphor holds regardless.
