# trelix v3.2.2 to v3.2.5 (Dev.to) — GIF Asset Plan

Article: "trelix v3.2.2 to v3.2.5: The Source Tree Was Fine. The Published Package Wasn't."
Platform target: Dev.to (native markdown — embed with `![alt](url)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds)
Dev.to draft: https://dev.to/sai_ram_0000/trelix-v322-to-v325-the-source-tree-was-fine-the-published-package-wasnt-2adj-temp-slug-1203379 (`devto_id: 4587467`)

**6 GIFs for the article's 5 headings plus a hero.** Sourced by 6 parallel agents (one per planned slot), then audited as a whole set by a fit reviewer, then re-sourced/swapped where rejected. All 24 GIF ids used in the six prior plans in this series were excluded up front. Every agent decoded actual GIF frames via ffmpeg rather than trusting Giphy page text/tags.

**Editorial swap made after the workflow, by hand:** the reviewer correctly rejected an Elf movie clip for section 2 as licensed-film meme-slop, but missed the identical problem in its own kept pick for section 5 — a Harry Potter wizard's-chess scene, an equally recognizable licensed film clip. Swapped section 5 to its own already-vetted alternate (a real DHL package-sortation-conveyor clip) instead of letting it stand on the reviewer's inconsistency. This is a placement/swap decision, not a re-source — the alternate was already independently frame-verified during the workflow.

**Independently re-verified before writing this file:** all 6 final media URLs return HTTP 200 with real image bytes. No fabricated ids.

---

## GIF 1 — Hero / Opening (reaching for something that isn't there)

**Concept:** The article opens on a real, reproducible command failing with exit 127 — the console script simply isn't in the published image, while every unit test stayed green. The visual needs to read as a quiet, clean absence, not a crash: reaching for something and finding nothing.

**Verified GIF:** "Hand Reaching Out" GIF by erica shires
- Page: https://giphy.com/gifs/hand-arm-surrealism-zfXHYMMDzkfNs4ghX3
- Direct: `https://i.giphy.com/media/zfXHYMMDzkfNs4ghX3/giphy.gif` (1.1 MB)

**On screen (frame-verified, 13 frames):** Black-and-white photographic footage of a bare forearm and hand extended into an open, cloudy sky. Across the loop the fingers curl inward as if closing around something, then relax, in a slow grasping motion — but the frame contains nothing except sky and cloud. The hand closes on empty air every time. No other body, face, or object in frame.

**Placement:** Hero — directly under the headline, before the `docker run` command block.

**Caption:**
> `docker run --entrypoint trelix-mcp ghcr.io/sairam0424/trelix:3.2.1 --version` exits 127. Every unit test was green. The thing the tests exercised was never in the image that shipped.

**Alternate (verified, different medium):** a flat cartoon figure turning both pockets fully inside-out to show they're empty — https://giphy.com/gifs/RLo3AazZVeBBfWqmCB

---

## GIF 2 — The Docker image that shipped without its own server

**Concept:** Two independent, unrelated defects stacked in the same artifact — the Dockerfile's `COPY` step and `.dockerignore`'s exclusion both independently omitted `packages/trelix-mcp`, and separately, `trelix-mcp --help` silently launched the live server instead of printing usage because `main()` never branched on `sys.argv` at all. The visual: a wary, uncertain reach toward a switch whose result isn't clear — the "which layer is actually going to work" feeling, and a help flag that does the opposite of what it promises.

**Verified GIF:** "light switch" GIF by Amanita Design
- Page: https://giphy.com/gifs/amanita-design-light-switch-xUOxf8CjPe3tRx3N8Q
- Direct: `https://i.giphy.com/media/xUOxf8CjPe3tRx3N8Q/giphy.gif` (2.0 MB)

**On screen (frame-verified, 19 sampled frames):** A small black hand-illustrated creature with a cone-shaped orange hat reaches one long stretchy arm toward a wall-mounted panel to flip a switch. The vignette repeats across several color/scene changes (an orange panel on white, then a teal switch against an underwater scene with fish swimming past), but the pose is consistent every time — a wary, uncertain reach toward a switch whose result the creature clearly isn't sure about. No text, no UI chrome, no padlock/security imagery.

**Placement:** Immediately after "The Docker image that shipped without its own server" heading, before the two-independent-gaps explanation.

**Caption:** *(none supplied by the workflow — write one before publishing; suggested: "Fix the Dockerfile alone, or `.dockerignore` alone, and the binary is still missing. Both had to give at once.")*

**Reviewer note:** the original pick here was the elevator scene from the movie *Elf* — Buddy in full costume mashing a button panel. Rejected outright: "an unmistakable, universally-recognized comedy-movie clip... reads as pure meme-slop against a plainly-written engineering incident narrative," and weaker on the concept than claimed (the panel was already lit before Buddy started pressing). Swapped to this alternate.

---

## GIF 3 — The wildcard leak and the response that mattered more than the fix

**Concept:** No in-process, in-memory mock can ever cross the real OS-process boundary the way a genuine child process does. The visual: a boundary that was always fake/contained becoming a real, physical crossing for the first time — deliberately not a literal wildcard/joker card (Giphy's own "wildcard" results are dominated by off-tone NFL/gambling GIFs) and not hacking/breach imagery.

**Verified GIF:** slow-motion resurrection-plant GIF (BBC Africa)
- Page: https://giphy.com/gifs/IaqlNUXfacG52
- Direct: `https://i.giphy.com/media/IaqlNUXfacG52/giphy.gif` (0.9 MB)

**On screen (frame-verified, full 5.4s clip):** A small yellow-green seedling shoot pushes up out of dark, pebbly real soil, unfurling slightly wider in each successive frame as it breaks the surface into open air. No text, no card/joker imagery, no hacking/breach visuals, no gambling context.

**Placement:** After the SQL LIKE wildcard explanation, before or alongside the real-subprocess E2E suite paragraph.

**Caption:**
> No in-memory mock ever has to push up through real soil. The fix did: an actual child process, spawned for real, breathing through real stdio — the only place this bug could ever have been seen.

---

## GIF 4 — Automating the verification instead of re-typing it

**Concept:** A manual, human-in-the-loop step (watch two CI runs finish, then hand-run a script) replaced by a workflow that waits for the right condition and completes itself — "trigger met, the rest happens without anyone standing by," not a robot replacing a human and not surveillance.

**Verified GIF:** "domino satisfying" GIF
- Page: https://giphy.com/gifs/PNut3rKlJyfTvhNkuu
- Direct: `https://i.giphy.com/media/PNut3rKlJyfTvhNkuu/giphy.gif` (1.2 MB)

**On screen (frame-verified, 37 frames sampled at n=0,8,16,24,32):** An aerial CG shot of a vast grid of mustard-yellow dominoes with a wave of them toppling in a smooth curved front that sweeps across the field on its own. No human hands, no text overlay, no surveillance framing. High-contrast, reads clearly even small.

**Placement:** Section hero image for "Automating the verification instead of re-typing it," after the heading, before the `workflow_run` mechanism explanation.

**Caption:**
> Trip the one condition that matters and the rest of the check completes itself — nobody has to nudge each step by hand anymore.

**Verification caveat:** the reviewer's own pass flagged a small "cmdrkitten" creator-credit watermark in one corner, not disclosed by the sourcing agent. Judged minor enough to keep (a small creator credit, not a brand overlay obscuring content) rather than swap to a blander alternate — eyeball it once before publishing.

---

## GIF 5 — The other audit: when a symbol's nickname collides with someone else's

**Concept:** The unifying image across the qualified-name-collision audit: two distinct things reduced to the same short label, occupying the same lookup slot, and the system can only keep one — mechanical routing-by-label, not identity theft or twins/doppelganger cliché.

**Verified GIF:** "Rollercoaster Logistics" GIF by DHL
- Page: https://giphy.com/gifs/7XoOjhEAiSwIItCo3P
- Direct: `https://i.giphy.com/media/7XoOjhEAiSwIItCo3P/giphy.gif`
- **Size caveat: 9.6 MB at full size — far over the 3 MB budget.** Use `https://i.giphy.com/media/7XoOjhEAiSwIItCo3P/giphy-downsized.gif` (1.9 MB) instead.

**On screen (frame-verified, full 8s clip):** A first-person GoPro-style ride along a real high-speed automated package-sortation conveyor, with belts diverting packages at junctions based on their labels. No people, no meme framing, no identity-theft undertone — purely mechanical routing-by-label.

**Placement:** Section hero image for "The other audit: when a symbol's nickname collides with someone else's," after the heading, before the Java/Rust examples.

**Caption:** *(none supplied — write one before publishing; suggested: "Every package on this belt gets routed by its label. Give two packages the same label and the belt just picks one.")*

**Editorial note:** this section's original pick was the Harry Potter wizard's-chess capture scene — a licensed film clip, the same category of problem the reviewer explicitly rejected for GIF 2 (the *Elf* elevator scene) but missed here. Swapped to this already-vetted alternate by hand after the workflow completed, rather than let the reviewer's inconsistency stand.

---

## GIF 6 — A short coda: the binary that gave advice it couldn't act on

**Concept:** The frozen binary printed `pip install X` to fix a missing dependency — advice with zero possible effect, since a frozen binary never touches the host's Python environment. The joke is on the mismatch between the advice and the mechanism that would have to act on it, not on a person.

**Verified GIF:** "Listen To Me Brick Wall" GIF by Respective
- Page: https://giphy.com/gifs/xDQ0gmS66CJ971f0JF
- Direct: `https://i.giphy.com/media/xDQ0gmS66CJ971f0JF/giphy.gif` (2.4 MB)

**On screen (frame-verified, 41 frames):** A man in a black t-shirt stands close to a red brick wall, gesturing with both hands and turning his head as if explaining or arguing something directly at the wall itself. No mockery of a person failing at a task — the visual gag is entirely about the wall being the wrong target for the message. Loops cleanly on the gesture.

**Placement:** Lead image for "A short coda: the binary that gave advice it couldn't act on."

**Caption:**
> Telling a frozen binary to `pip install` is like explaining yourself to a brick wall — delivered clearly, received by nothing that can act on it.

**Reviewer note:** the original pick was a "NO SIGNAL" broadcast-static GIF — thematically apt, but rejected because every single frame carried a bold, legible "enchanted.media" brand watermark directly under the glitch text, the same visible-watermark thematic-misfire class this series has already been burned by once before. Swapped to this alternate.

---

## Notes

- **Dev.to embed:** `![alt text](https://i.giphy.com/media/<ID>/giphy.gif)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds it.
- **One GIF exceeds the 3 MB budget at full size** — GIF 5 (9.6 MB). Use `giphy-downsized.gif` at 1.9 MB instead.
- **Two captions are missing** (GIF 2 and GIF 5) — the repair/swap agents didn't supply new ones for their promoted alternates. Suggested drafts included above; write final versions before publishing.
- **Distinctness verified twice:** against the 24 ids used across the six prior plans in this series (zero collisions), and among these 6 picks themselves (zero intra-article duplicates).
- **No section deliberately left without a GIF** — the article's 5 headings plus the hero all get one, matching the smaller scope of this 4-release article.

### Conflicts caught and resolved during sourcing

- **GIF 2 — rejected outright.** The original pick was the elevator scene from *Elf* (Buddy the Elf mashing a button panel). The reviewer correctly flagged it as an unmistakable licensed-film comedy clip — pure meme-slop against a plainly-written engineering narrative — and noted the concept was weaker than claimed (the panel was already lit before the mashing started). Swapped to the light-switch creature alternate.
- **GIF 5 — reviewer inconsistency caught by hand, after the workflow.** The reviewer's own pass rejected GIF 2 for being a licensed film clip but kept a Harry Potter wizard's-chess scene for GIF 5 — an equally recognizable licensed film clip, by the reviewer's own stated standard. Not caught during the workflow; caught and swapped by hand afterward to the DHL sortation-conveyor alternate, which was already independently frame-verified.
- **GIF 6 — rejected outright.** The original pick was a "NO SIGNAL" static GIF with a bold, legible "enchanted.media" brand watermark baked into every frame — the same visible-watermark thematic-misfire pattern flagged once before in this series (the funnel GIF from an earlier round). Swapped to the brick-wall alternate.
- **GIF 4 — kept with a disclosed caveat, not swapped.** A small creator-credit watermark ("cmdrkitten") in one corner was flagged by the reviewer but judged minor enough to keep rather than trade for a blander corporate alternate. Worth a manual glance before publishing.
