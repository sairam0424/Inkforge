# tracehub-mcp (Dev.to) — GIF Asset Plan

Article: "tracehub-mcp: Giving AI Assistants a Real Query Interface Into Your LLM Traces"
Platform target: Dev.to (native markdown — embed with `![alt](url)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds)
Dev.to draft: https://dev.to/sai_ram_0000/tracehub-mcp-giving-ai-assistants-a-real-query-interface-into-your-llm-traces-26o5-temp-slug-8240834 (`devto_id: 4643697`)

**6 GIFs for the article's 6 headings.** Sourced by 6 parallel agents, then audited as a whole set by a fit reviewer, then re-sourced where rejected. All 31 GIF ids used across the six prior plans in this series were excluded up front — none of this article's picks collide with them or with the 5 picks sourced for the companion cost-guard-mcp article in the same session.

**Independently re-verified before writing this file:** all 6 media URLs return HTTP 200 with real image bytes. No fabricated ids.

---

## GIF 1 — Hero / Opening (the copy-paste problem)

**Concept:** The tedium of manually relaying data between two systems that should talk directly — copying a trace JSON blob out of a backend UI and pasting it into a chat window, one trace at a time.

**Verified GIF:** "usb at the office" GIF by Adam J. Kurtz
- Page: https://giphy.com/gifs/usb-3ov9k0ZmL8IDserENW
- Direct: `https://i.giphy.com/media/3ov9k0ZmL8IDserENW/giphy.gif` (0.31 MB)

**On screen (frame-verified, all 16 frames):** A simple hand-drawn illustration of a pink/gray USB stick against a white background, with a confirmed real (non-static) wobble — pixel-diffed between frames to confirm actual motion, not a still. No text beyond the "USB" label drawn on the stick, no watermark, no brand logo.

**Placement:** Hero — top of article, before the copy-paste-JSON paragraph.

**Caption:**
> Every trace still has to be carried over by hand — there's no cable running between the two.

**Reviewer note — the sharpest catch of this whole session:** the original primary pick here was a "silent-era archival typewriter close-up" GIF, cleared by its sourcing agent for having no baked-in text, no faces, and no watermark. The reviewer went one step further and checked the Giphy page's own title and tags directly: the upload is titled "harold lloyd type writer GIF by Maudit" with the tag `#bumping into broadway`. Cross-referenced against Wikipedia, *Bumping Into Broadway* is a real, named 1919 Harold Lloyd short comedy — his first two-reel film as the "glasses" character, with a print held at the UCLA Film and TV Archive. That's a clip from a specific commercial theatrical release, not generic unbranded stock footage — exactly the licensed-film risk this series has already been burned by once (the *Elf* elevator scene) and had explicitly been told to watch for this round. The frame-level check (no text, no faces, no watermark) was necessary but not sufficient; the metadata check is what actually caught it. Swapped to the USB-stick illustration above.

**Alternate on file (licensed film — do not use):** "Harold Lloyd type writer GIF by Maudit" — https://giphy.com/gifs/typewriter-Nc1d6apaHowmY (confirmed sourced from *Bumping Into Broadway*, 1919)

---

## GIF 2 — From three backends to five, and what "full implementation" means

**Concept:** Expansion where every new piece is built to the same full standard as what came before it — a set growing by genuinely matching pieces, not a thinner bolt-on.

**Verified GIF:** "Puzzle Piece" GIF by UQ Sport
- Page: https://giphy.com/gifs/RIqh9nbpblgvWvd6ZK
- Direct: `https://i.giphy.com/media/RIqh9nbpblgvWvd6ZK/giphy.gif` (0.14 MB)

**On screen (frame-verified, ~28 sampled frames across 83):** Four equal-sized jigsaw pieces (yellow, purple, orange, white) continuously interlock into one complete square, then reshuffle and repeat. Flat vector style, solid magenta background, no text, no logo, no watermark.

**Placement:** Primary image for "From three backends to five," after the heading.

**Caption:**
> The two new backends aren't smaller pieces cut to fit around the original three — they're built to the same shape.

**Alternate (verified):** a single isometric cube fracturing into smaller matching cubes, then reassembling into the identical shape — https://giphy.com/gifs/8rEFo5ZrPaeBolyIah

---

## GIF 3 — The decision not to touch Jaeger, Tempo, or Traceloop

**Concept:** An honest, visible boundary between what's covered and what isn't, stated openly rather than fogged over — the explicit choice not to retrofit the new security bar onto the three inherited backends.

**Verified GIF:** "gxrethclarke giphyupload art painting diy" GIF
- Page: https://giphy.com/gifs/iEw1RZrUxNgQLdG38g
- Direct: `https://i.giphy.com/media/iEw1RZrUxNgQLdG38g/giphy.gif` (0.42 MB)

**On screen (frame-verified):** A flat-design paint roller moves down a wall, repeatedly rolling one clean vertical teal stripe while the rest of the wall stays untouched white. Every frame, including the loop point, shows a crisp, deliberate seam between the painted column and the unpainted rest — no gradient, no fog, just a stated line. Creator-attributed (Gareth Clarke), no watermark, no licensed footage.

**Placement:** Primary image for "The decision not to touch Jaeger, Tempo, or Traceloop," after the heading.

**Caption:**
> We painted our own column and said so — Jaeger, Tempo, and Traceloop are still the unpainted wall, right there in the README.

**Alternate (verified, real footage):** a field-marking machine laying a precise straight white line on grass — https://giphy.com/gifs/haoBknLXjcZKMSl0Uh

---

## GIF 4 — The bugs that taught me the hard way (finish_reasons vanishing)

**Concept:** A real thing disappearing on its own with nothing announcing the loss — not a magic trick, not a jump-scare, just present, then gone. Any LLM span carrying a `finish_reasons` value was silently vanishing from Jaeger/Tempo query results.

**Verified GIF:** "fire candle black background little fire" GIF (uploader pkkumar391)
- Page: https://giphy.com/gifs/4n1kDOsXgfrhMXn5LL
- Direct: `https://i.giphy.com/media/4n1kDOsXgfrhMXn5LL/giphy.gif` (0.44 MB)

**On screen (frame-verified, all 75 frames):** A single candle flame burns steadily against pure black (frames 10-40); by frame 60 it has shrunk to a faint point; by frame 75 the frame is entirely black — the flame is simply gone, no cut, no flare, no watermark anywhere.

**Placement:** In the "Bugs / silent-data-loss" section, at the point the `finish_reasons` bug is introduced.

**Caption:**
> No exception, no log line — the span was just gone, and the query moved on like nothing had happened.

**Alternate (verified):** a hand steadily erasing a pencil sketch from a notebook — https://giphy.com/gifs/pa5dRTGPw3YPK (small corner creator-credit text, no brand watermark)

---

## GIF 5 — The fork, the pivot, and a changelog anomaly

**Concept:** An honest, visible seam rather than a hidden one — the fork from upstream (attribution intact), the org rename, and the version-counter reset that left a genuinely confusing but disclosed changelog jump. Deliberately a literal, open join being made — sparks at the exact point two things become one — never a slick dissolve/reassemble effect that could read as history quietly smoothing itself over.

**Verified GIF:** "Weld welding" GIF (uploader FlamesVLC)
- Page: https://giphy.com/gifs/9XXMMgyGqACsLc58lq
- Direct: `https://i.giphy.com/media/9XXMMgyGqACsLc58lq/giphy.gif` (1.74 MB)

**On screen (frame-verified):** Real, non-meme footage — a gloved hand fusing two pieces of metal on a circular workpiece, sparks flying openly at the exact joint. No text overlay, no cartoon elements, no visible brand watermark.

**Placement:** Mid-section, right after describing the fork + rename + version-reset, before or alongside the line about disclosing the changelog anomaly rather than rewriting it away.

**Caption:**
> We didn't grind this seam smooth. The join between the fork and the renamed org is still visible in the changelog, right where the version numbers reset — on purpose.

**Alternate (verified, real lab footage):** hands soldering a circuit board and connecting cables on an optics bench — https://giphy.com/gifs/dZRIKBQ1MoRAGqKPTF (Nokia Bell Labs)

---

## GIF 6 — What this actually is (close)

**Concept:** A precise, checkable claim stated with quiet confidence — not modesty, not hype. Every number in the close is one the author measured personally.

**Verified GIF:** "Geometry Measuring" GIF by Respective
- Page: https://giphy.com/gifs/dAbYDcASdfNd62erv3
- Direct: `https://i.giphy.com/media/dAbYDcASdfNd62erv3/giphy.gif`
- **Size caveat: 3.31 MB at full size — over the 3 MB budget.** Use `https://i.giphy.com/media/dAbYDcASdfNd62erv3/giphy-downsized.gif` (0.31 MB) instead.

**On screen (frame-verified):** A close-up of hands holding a wooden dowel, marking it with a small steel machinist's square and a fine-tip pen — a ruler placed flush against the wood, a short exact tick mark drawn at the measurement, then a precise diagonal reference line scored across the end grain using the ruler's edge as a straightedge. No text, logo, watermark, or face — just a steady hand making an exact, checkable mark.

**Placement:** Closing section, "What This Actually Is."

**Caption:**
> Every number in this piece is one I measured myself and can show you how — not a bigger claim rounded up to sound better.

**Alternate (verified):** an overhead shot of two hands assembling a wooden jigsaw puzzle outdoors, piece by piece — https://giphy.com/gifs/satisfying-puzzle-piece-8ABTio3LGeNlm

---

## Notes

- **Dev.to embed:** `![alt text](https://i.giphy.com/media/<ID>/giphy.gif)` on its own line, or paste the `giphy.com/gifs/...` page URL on its own line and Dev.to auto-embeds it.
- **One GIF exceeds the 3 MB budget at full size** — GIF 6 (3.31 MB). Use `giphy-downsized.gif` at 0.31 MB instead.
- **Distinctness verified three ways:** against the 31 ids used across the six prior plans in this series (zero collisions), against the 5 ids sourced for the companion cost-guard-mcp article in this same session (zero collisions), and among these 6 picks themselves (zero intra-article duplicates).
- **No section deliberately left without a GIF** — all 6 headings get one.
- **Every caption in this plan was supplied by the workflow itself** — unlike the companion cost-guard-mcp plan, no gaps needed filling in by hand this round.

### Conflicts caught and resolved during sourcing

- **GIF 1 — the one real problem in an otherwise clean set, and the sharpest catch across both GIF-sourcing sessions today.** The original primary was a clip from a specific, named 1919 Harold Lloyd film (*Bumping Into Broadway*), confirmed via the Giphy page's own title/tags and a Wikipedia cross-reference — a class of failure a pure frame-level check (no text, no faces, no watermark) cannot catch, since the frames themselves were genuinely clean. This is exactly why the review-stage brief explicitly said to check for licensed content "even if the sourcing agent claims to have checked" — the sourcing agent had checked, thoroughly, just not the one signal (upload metadata) that actually revealed the problem.
- Every other pick in the set was independently re-verified by the reviewer via direct frame decoding of both the primary and the listed alternate for all 6 sections (12 files total) and confirmed accurate, with no watermarks, no other licensed content, no visual collisions, and no description-only captions.
