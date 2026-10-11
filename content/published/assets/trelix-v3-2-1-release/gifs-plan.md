# trelix v3.1.2 to v3.2.1 (Dev.to) — GIF Asset Plan

Article: "trelix v3.1.2 to v3.2.1: The Tests That Passed Without Testing Anything"
Platform target: Dev.to (native markdown — embed with `![alt](url)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds)
Dev.to draft: https://dev.to/sai_ram_0000/trelix-v312-to-v321-the-tests-that-passed-without-testing-anything-84i-temp-slug-4317591 (`devto_id: 4494555`)

**7 GIFs for the article's 7 substantive headings.** Sourced by 6 parallel agents (one per planned slot), then audited as a whole set by a fit reviewer, then re-sourced where rejected. All 17 GIF ids used in the six prior plans in this series were excluded up front. Every agent decoded actual GIF frames via ffmpeg rather than trusting Giphy page text/tags — Giphy pages almost never describe motion, which is how earlier rounds shipped unconfirmed picks.

**Editorial change made after the workflow, by hand:** the workflow's own brief merged `intent_hint` and `search-all` into one shared GIF slot to hold the count near the series' usual 6-7. But the article has these as two separate `##` headings, and the repaired pick for that slot (a zipper) only speaks to `intent_hint` — its own concept note explicitly earmarked a *second* image (a warehouse sortation conveyor) for `search-all`, which had been demoted to "alternate." Rather than let one bug go without a visual, split the slot: the zipper stays with `intent_hint`, the conveyor is promoted to its own placement under `search-all`. Both were independently frame-verified before the split, so no new sourcing was needed — this is a placement decision, not a re-source.

**Independently re-verified before writing this file:** all 7 final media URLs return HTTP 200 with real image bytes. No fabricated ids. One stray leaked XML-like tag (`</concept></invoke>`) was found in the workflow's raw output for GIF 7's internal concept notes — stripped; it never reached any caption or visual field, so nothing here carries it.

---

## GIF 1 — Hero / Opening (many queries collapse into one vector)

**Concept:** The article opens on a measured, almost clinical finding — pooling a causal decoder at position 0 means every query embedding a provider produced was identical to every other one. The visual needs to read as convergence, not catastrophe: many distinct things narrowing into one indistinguishable thing.

**Verified GIF:** "Absorb Black Hole" GIF by xponentialdesign
- Page: https://giphy.com/gifs/OEd8FEjdsWo9Q8nmwM
- Direct: `https://i.giphy.com/media/OEd8FEjdsWo9Q8nmwM/giphy.gif`
- **Size caveat: 12.8 MB at full size — far over the 3 MB budget.** Use `https://i.giphy.com/media/OEd8FEjdsWo9Q8nmwM/giphy-downsized.gif` (1.5 MB) instead.

**On screen (frame-verified, 130 frames / 5.2s loop):** Black-on-white generative art. Many individual dotted and dashed curved threads, each marked with small distinct dots, continuously rotate together and spiral inward, converging and disappearing into one solid dark point at the exact center. Smooth, consistent rotation throughout — no scatter, no outward burst, purely an inward, ever-tightening funnel.

**Placement:** Hero — top of article, before the cold-open paragraph about the pooling measurement.

**Caption:**
> Feed it a thousand different queries and the pooling method hands back the same vector every time — that's what reading position zero on a causal decoder actually does to an embedding space.

**Alternate (verified, genuinely different medium):** a 3D zipper — two colored tooth-chains feeding into one interlocked track — https://giphy.com/gifs/D0WOL0ogZIoG4 (not used here; promoted to GIF 4 below instead)

---

## GIF 2 — The pattern (a green suite that never touched the defect)

**Concept:** The article's central thesis: a test can pass, release after release, without ever exercising the behavior it claims to cover. The visual should be a false all-clear — a signal reporting "fine" while never actually contacting the thing it's supposed to verify.

**Verified GIF:** "tick check mark" GIF
- Page: https://giphy.com/gifs/bpv34afu6bbcFFIXtX
- Direct: `https://i.giphy.com/media/bpv34afu6bbcFFIXtX/giphy.gif` (0.16 MB)

**On screen (frame-verified, all 12 frames):** A glossy green circular badge with a bold white checkmark, on a black/transparent background, performing a continuous subtle 3D wobble in place. The checkmark shape never changes — only the glossy highlight sweeps across the sphere as it turns slightly. All shine, no substance underneath.

**Placement:** Immediately after "The pattern: a green suite that never touched the defect" heading, before the four-instance breakdown begins.

**Caption:**
> Green. Every time. The suite never once touched the line that was actually broken.

**Alternate (verified):** an analog VU meter, needle swinging across the dial — https://giphy.com/gifs/004VBlYVe09kvWZrow

---

## GIF 3 — The sparse leg (clean queries scored against contaminated documents)

**Concept:** Batch padding leaked real MLM-head logits into stored document vectors — 22% of a persisted vector became phantom terms. Queries stayed clean (batch of one, no padding), but were scored against permanently contaminated storage. The visual needs a clean substance meeting a contaminant *at a boundary*, where the contamination is retained in something kept, not a fleeting splash.

**Verified GIF:** "Steeping Tea Time" GIF by Julie Smith Schneider
- Page: https://giphy.com/gifs/hTrDq4y1iSONIUD2tj
- Direct: `https://i.giphy.com/media/hTrDq4y1iSONIUD2tj/giphy.gif` (0.18 MB)

**On screen (frame-verified, all 14 frames):** A flat-illustration teacup and saucer, teabag string hanging in. The cup and saucer never move — only the liquid's color changes: clear/white water (frame 1) darkens progressively through tan into solid opaque brown by the midpoint (frame 7), and holds that steeped color through the final frames before the loop resets. One-way, permanent color change within each cycle — not a splash.

**Placement:** Primary image for "The sparse leg" section, after the paragraph establishing the clean-query-vs-contaminated-document asymmetry.

**Caption:**
> The padding leaked into the stored vector once, at write time — every clean query since has just been steeping against it.

**Alternate (verified):** a hand-drawn ink-sketch mug with the same steeping-color mechanic — https://giphy.com/gifs/tea-mug-cup-DQe1nmWYiQmKIgPfxN

---

## GIF 4 — intent_hint (eight intents, one shortcut)

**Concept:** Every one of the eight recognized intent values silently took the same "direct answer" shortcut regardless of which was actually requested. The visual: two or more distinct incoming things, both forced by a single mechanism into one identical outgoing track — a structural defect, not sabotage.

**Verified GIF:** 3D zipper-merge animation
- Page: https://giphy.com/gifs/D0WOL0ogZIoG4
- Direct: `https://i.giphy.com/media/D0WOL0ogZIoG4/giphy.gif` (0.35 MB)
- **Metadata caveat:** Giphy's own page title/tags read "merge GIF" / #highway #merge #lane — reused or mislabeled metadata from an unrelated highway-merge meme. The actual decoded pixels are unambiguously the zipper animation described below, confirmed on two independent downloads. Ignore the page's own tags.

**On screen (frame-verified):** A rendered 3D zipper on a dark-blue background. A red-toothed strand descends from the upper-left and a green-toothed strand from the upper-right; both feed into a single gold zipper-slider that locks every tooth, regardless of origin, into one continuous interlocked track running down the center. Seamless loop, no text, no characters.

**Placement:** Section hero image for "intent_hint: a test that asserted the bug as the spec" — place after the heading, before the eight-intents measurement.

**Caption:**
> Whichever strand feeds in, the slider locks every tooth into the same single track — eight different intents, one shortcut.

**Reviewer note:** this slot's first two candidates were both rejected. The original "funnel" pick carried a visible artist watermark and Giphy tags of #meme/#goofy/#punk — a tone violation. Its own listed alternate (a water-park glass-door/trapdoor clip) was independently re-checked frame-by-frame and rejected too: the actual "drop" moment never appears on screen, and the visible footage shows a person being boxed in by someone else's hand — read as a prank being played on someone, which violates this section's own "structural defect, not sabotage" framing. This zipper pick is the third search, not the first.

---

## GIF 5 — search-all (an entire repo silently vanishes)

**Concept:** Federated search deduped on a per-database row id that restarts at 1 for every repository, so two repositories' entries collide and an entire repository's results silently disappear from the merged output while the response reports nothing was skipped. The visual: a routing/sortation mechanism where an entire batch can vanish downstream without anyone noticing — professional, mechanical, no characters.

**Verified GIF:** "Conveyors" GIF by Daifuku Wynright
- Page: https://giphy.com/gifs/uRTC2OQRMC2U1NS5Wj
- Direct: `https://i.giphy.com/media/uRTC2OQRMC2U1NS5Wj/giphy.gif`
- **Size caveat: 5.7 MB at full size — over the 3 MB budget.** Use `https://i.giphy.com/media/uRTC2OQRMC2U1NS5Wj/giphy-downsized.gif` (1.6 MB) instead.

**On screen (frame-verified, full loop):** A clean isometric corporate illustration of an industrial warehouse sortation system — multiple parallel conveyor belts running at different levels and diagonal directions, identical cardboard boxes gliding along them continuously. No characters, no text overlay, real material-handling-company branding (Daifuku/Wynright), safe and professional.

**Placement:** Section hero image for "search-all: a test that used the one distribution that can't fail" — place after the heading, before the row-id-collision explanation.

**Caption:**
> One lane's collision, and a whole shipment stops arriving — the response still says nothing was skipped.

*(This GIF was originally sourced as the "backup" half of a shared slot covering both `intent_hint` and `search-all`. Since the article gives each its own heading, it is promoted here to its own placement rather than left unused — see the note at the top of this file.)*

---

## GIF 6 — How do you know your check actually checks (the audit trail and the self-audit)

**Concept:** The sharpest form of the article's thesis, applied to a security feature: the audit-trail read commands shared the writer's constructor, so pointing them at a non-audit file silently created the schema and then reported "chain intact" — a check that can pass on input it was never built to accept. The visual: a rubber stamp imprinting "APPROVED" on whatever's underneath, regardless of what it actually is.

**Verified GIF:** "Approved" stamp GIF
- Page: https://giphy.com/gifs/3kuSo744UIPJjcJUEn
- Direct: `https://i.giphy.com/media/3kuSo744UIPJjcJUEn/giphy.gif` (0.26 MB)

**Verification caveat, stated plainly:** this pick was confirmed only via the Giphy page's own text description (a hand stamping "APPROVED" onto a white background) and a successful HTTP 200 / `image/gif` content-type check on the direct media URL — **not** by decoding and inspecting the actual frames, unlike every other pick in this plan. The description is specific enough to trust, but eyeball it once before publishing, same caveat as a similar case in the v3.1.1 plan.

**Placement:** After the paragraph describing the audit-store bug (8 KB/one table → 32 KB/five tables from being merely read), before the v3.1.2 self-audit material.

**Caption:**
> The audit-trail reader didn't check the chain — it just stamped one.

**Alternate (verified via the same page-description method — carries the identical caveat):** a person walking into wet cement, leaving a permanent footprint — https://giphy.com/gifs/jncaU9JR7nqAq2zamh

---

## GIF 7 — The fix (mutation testing that measures whether a test can fail)

**Concept:** Coverage only proves a line executed; mutation testing proves a test would notice if that line broke. The visual: a controlled, deliberate provocation used to verify a response — pressing a test button to check the bell rings — not real chaos or destruction.

**Verified GIF:** "Red Button" GIF
- Page: https://giphy.com/gifs/button-ugo-ugolize-2eV7JJr1HXqseV5vo7
- Direct: `https://i.giphy.com/media/2eV7JJr1HXqseV5vo7/giphy.gif` (0.12 MB)

**On screen (frame-verified):** A small toy figure stands next to a wooden pedestal with a big red push-button on top and a bell-like brass housing underneath; its arm is animated reaching out to press the button — the classic "push to test" gesture, not a static button graphic.

**Placement:** Lead image for "The fix: mutation testing that measures whether a test can fail" — right after introducing mutation testing as deliberately introducing small bugs to check whether tests catch them.

**Caption:**
> Coverage tells you the wire is connected. Mutation testing is the part where you actually press the button and watch for the bell.

**Alternate (verified):** a crash-test dummy in a just-completed instrumented impact, windshield cracked, not chaotic wreckage — https://giphy.com/gifs/crash-test-dummy-MgBJ3UifivIY

---

## Notes

- **Dev.to embed:** `![alt text](https://i.giphy.com/media/<ID>/giphy.gif)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds it.
- **Two GIFs exceed the 3 MB budget at full size** — GIF 1 (12.8 MB, use `giphy-downsized.gif` at 1.5 MB) and GIF 5 (5.7 MB, use `giphy-downsized.gif` at 1.6 MB). Both downsized variants are confirmed to resolve.
- **No section deliberately left without a GIF** this round — unlike prior plans in this series, the article's closing section ("The fix") is the actual payoff/resolution rather than a generic wrap-up, so it gets GIF 7 rather than being left quiet.
- **Distinctness verified twice:** against the 17 ids used across the six prior plans in this series (zero collisions), and among these 7 picks themselves (zero intra-article duplicates).
- **Two picks (GIF 6 and its alternate) carry a verification caveat** — confirmed only by page description and an HTTP/content-type check, not by decoding actual frames like the other five. Worth a manual glance before publishing.

### Conflicts caught and resolved during sourcing

- **The `intent_hint`/`search-all` slot was originally planned as one shared GIF, not two.** The workflow brief merged them to hold the total near the series' usual 6-7 picks. The repaired result's own concept notes explicitly earmarked a second image for `search-all`, which had been left as an unused "alternate." Rather than let one of the two bugs go without a visual, split the slot after the workflow completed — no new sourcing needed, since both images were already independently frame-verified. This is why the plan has 7 GIFs instead of 6.
- **The original `intent_hint`/`search-all` primary candidate was rejected outright, and so was its own listed alternate.** The first pick — an abstract "funnel" illustration — carried a visible artist watermark and Giphy tags of #meme/#goofy/#punk, a clear tone violation. Its alternate (a water-park glass-door clip) was independently re-checked frame-by-frame during repair and rejected too: the actual "drop" moment never appears on screen, and the visible footage reads as a prank being played on a person, violating the section's own "structural defect, not sabotage" framing. The repair agent had to run a third search to land on the zipper GIF now used.
- **One stray leaked XML-like tag** (`</concept></invoke>`) was found in the raw workflow output, confined to an internal concept-reasoning field for GIF 7. It never reached any caption, visual description, or URL — stripped before this file was written; nothing here carries it.
