# GIF Plan — MindForge v12.0.0 Launch Article (Adversarial Fit-Review)

Sourced by 4 parallel theming agents (audit/honesty, swarm/orchestration, guardrails/governance,
shipping/relief) across 17 raw candidates, then independently re-verified by a separate reviewer
who re-fetched every Giphy page, re-decoded frames via `ffmpeg`/`ffprobe`, and cross-checked
uploader/source metadata rather than trusting either the sourcing agents' or Giphy's own
title/tags. Excludes every generic, previously-overused agentic-tooling GIF trope from this
content series (spinning gears, robot handshake, glowing brain, hive-mind visuals).

## Verification method (independently re-run, not taken on trust)

For all 17 candidates the reviewer re-fetched the live `giphy.com/gifs/<id>` page (all 17
returned HTTP 200), isolated the embedded per-GIF JSON block (id-scoped, not page-wide —
page-wide greps pick up *related* GIFs' uploader fields and produce false attribution, which is
exactly the trap that burned a `"display_name":"Friends"` false lead during this review before
re-isolating it), pulled the direct `giphy.mp4` for every candidate, ran `ffprobe` to check
resolution/fps/frame-count/duration against each sourcing agent's stated numbers, and
`ffmpeg`-extracted 2-4 frames per GIF (including the specific frame indices some agents cited)
for direct visual inspection. Frame counts/resolutions/durations matched the sourcing agents'
claims almost exactly for 15 of 17 candidates. Two had claimed frame counts that didn't match the
mp4 (Blue Angels: claimed 110 vs actual 220; vintage bottling: claimed 46 vs actual 73) — benign,
consistent with GIF-vs-MP4 frame-rate downsampling, not a fabrication flag. `username`,
`source_post_url`, and `source_tld` were pulled for every candidate per the standing lesson to
check Giphy's own upload/source metadata rather than trust visual description alone.

## Selected GIFs (6, across 5 placeholders)

### 1. Placeholder: `GIF_PLACEHOLDER_WORKING_LOOP`
- Giphy: https://giphy.com/gifs/drawing-notes-scribble-hqqu3NvxUJ07boRjqP ("Working In The Zone" squirrel)
- Direct link: https://media4.giphy.com/media/hqqu3NvxUJ07boRjqP/giphy.gif
- Section: "What MindForge Is (And Isn't)" / plan→execute→verify→ship loop
- Why it fits: the loop section is about meticulous, escalating validation (five-level ladder, atomic XML plans) — a character hunched over squinting hard at its own notes is the cleanest available visual metaphor, with zero robot/AI cliché.
- Frame-decode confirmation: re-fetched (200 OK), decoded all 5 frames of the 480x338 mp4 — confirmed flat hand-drawn squirrel holding a paper close to its face, squinting, no text/logo in any frame. Correction to the sourcing agent's evidence: Giphy's own JSON shows this is NOT unattributed — uploader username is `GusAndSunny` (tags include "gus and sunny", "skwrluv") — a real, traceable illustrator account, not an orphaned rip.

### 2. Placeholder: `GIF_PLACEHOLDER_SWARM_FANOUT`
- Giphy: https://giphy.com/gifs/cmx1gjLskcGWytbLm6 (vintage bottling assembly line, US National Archives)
- Direct link: https://media1.giphy.com/media/cmx1gjLskcGWytbLm6/giphy.gif
- Section: "The Building Blocks" / dynamic workflows fan-out
- Why it fits: needs "many independent workers, one converging output" — a real archival assembly line of workers each doing one independent hand-task is exactly that, with no AI/robot imagery.
- Frame-decode confirmation: re-fetched (200 OK), mp4 480x270/24fps/73 frames/3.04s (matches claimed duration); decoded 3 frames — real black-and-white footage, women in period clothing capping/labeling bottles on a conveyor, motion confirmed frame-to-frame, zero logos/text overlay. Uploader confirmed `usnationalarchives` / "U.S. National Archives" — the lowest license-risk candidate across all 17, and watermark-free (unlike the 3 alternates for this theme: USRowing, Blue Angels, PBS — all rejected/excluded below).

### 3. Placeholder: `GIF_PLACEHOLDER_HOOK_BLOCK` (matched real/fake pair)
- Real stop — https://giphy.com/gifs/emiratesfacup-save-goalkeeper-schmeichel-4RU2qRC7QaeWhuVA0c
  - Direct link: https://media0.giphy.com/media/4RU2qRC7QaeWhuVA0c/giphy.gif
- Fake stop — https://giphy.com/gifs/cliftonvillefc-goal-cliftonville-jack-keaney-S8OcIF0t0iZJWmPcIR
  - Direct link: https://media1.giphy.com/media/S8OcIF0t0iZJWmPcIR/giphy.gif
- Section: "Advisory Context vs. Enforced Blocking"
- Why it fits: the section's point is "only 3 of 8 hooks are deny-class; everything else sails through unenforced" — a goalkeeper who actually catches the ball vs. an identical setup the ball sails straight past is a literal, wordless illustration of enforced-vs-advisory, placed exactly where the article draws that line.
- Frame-decode confirmation: both re-fetched (200 OK) and re-downloaded independently. FA Cup mp4 (480x480/15fps/94 frames/6.27s): decoded frames at t=4.0s/6.0s/6.2s/final — keeper fully gripping the ball, clear of the line; zero watermark across 4 checked timestamps, the cleanest "real stop" candidate offered. Cliftonville mp4 (480x270/10fps/49 frames/4.9s): decoded frame at t=3.0s — ball unambiguously inside the net, keeper sprawled having missed it. Correction: the sourcing agent's "no watermark" claim on the Cliftonville clip is wrong — every frame carries a persistent "SPORTS DIRECT PREMIERSHIP / nifl" broadcast bug (league/sponsor graphic, not the club's own branding). Kept anyway as official Cliftonville FC channel content and the only "fake stop" candidate on offer; disclosed here rather than repeated as fact.

### 4. Placeholder: `GIF_PLACEHOLDER_AUDIT_CHAIN`
- Giphy: https://giphy.com/gifs/chuber-user-error-l2R06FEpVRk6IroNq ("User Error")
- Direct link: https://media3.giphy.com/media/l2R06FEpVRk6IroNq/giphy.gif
- Section: "The Audit Chain and Why This Release Is Different"
- Why it fits: the section is literally about MindForge catching its own mistakes (a live jailbreak skill, a structurally-unfailable check, a PQAS overclaim, and — added post-workflow — a fabricated install banner caught again in v12.0.0) — "the bug wasn't the system, it was you" is the exact tone of a team disclosing its own screwups rather than a generic checkmark graphic.
- Frame-decode confirmation: re-fetched (200 OK), mp4 480x300/10fps/22 frames/2.2s (exact match to claimed spec); decoded frame 4/t=0.4s — clean "well, that one's on me" smirk with bold green-outlined "USER ERROR" text burned into every sampled frame, no logo/watermark. Uploader confirmed `chuber` ("chuber channel," Cheezburger's in-house GIF-comedy studio) — original sketch content, not a film/TV clip.

### 5. Placeholder: `GIF_PLACEHOLDER_INSTALL_QUICKSTART`
- Giphy: https://giphy.com/gifs/safe-i-made-it-finally-here-CtXgzu7MRnivxPrL7v ("I Made It" — Nope Cat)
- Direct link: https://media1.giphy.com/media/CtXgzu7MRnivxPrL7v/giphy.gif
- Section: "Installing MindForge"
- Why it fits: right before the install command, a character who stumbled through the door exhausted-but-arrived pairs well with "you've made it to the easy part — go run the install command."
- Frame-decode confirmation: re-fetched (200 OK), mp4 480x480/10fps/29 frames/2.9s (exact match); decoded frame at t=2.7s — the recurring "Nope Cat" illustrated character (uploader `thenopecat`), sweat droplets, bold "I MADE IT" caption, zero logos/watermarks. Original character IP via a known Giphy meme account, not a TV/film source.

## Rejected / excluded (11)

**Hard rejects (unverifiable rights chain, confirmed on re-decode):**

1. `https://giphy.com/gifs/computer-malfunction-error-Nrzs481LzLEdy` — static "COMPUTER MALFUNCTION" title card, telecined-film/broadcast-insert look; blank uploader, `source_post_url` a 2013 Tumblr reblog. No verifiable rights chain.
2. `https://giphy.com/gifs/JMV7IKoqzxlrW` — professionally shot soundstage/sitcom scene (blurred brand emblem in shot); blank uploader, `source_post_url` an unrelated 2016 Reddit repost. No traceable rights chain. Note: the sourcing agent's claim that Giphy's related-tags name specific actresses could not be confirmed on re-check (this GIF's own tags are generic: giphyreactions/relief/phew/relieved/whew) — not repeated as fact here.

**Excluded as redundant alternates (accurate, but a cleaner pick already covers the same placeholder):**

3. `https://giphy.com/gifs/chuber-qa-quality-assurance-l0K4n42JVSqqUvAQg` — real chuber-channel GIF, but a real Apple logo is visible on the laptop lid in every frame; weaker than the two lower-risk audit-honesty picks chosen.
4. `https://giphy.com/gifs/AuroraConsulting-bad-idea-thats-a-you-may-want-to-rethink-that-6fX9WkD72bonoGR2d4` — accurate, but features a real identifiable person on a commercial small-business promo account (higher brand-association profile than the picks chosen).
5. `https://giphy.com/gifs/GcmjHKOU5Hj60izwz3` — accurate, but carries a persistent "ViralHog" (for-profit clip-licensing aggregator) watermark; redundant with the watermark-free US National Archives pick for the same swarm-orchestration placeholder.
6. `https://giphy.com/gifs/qQ2A4OfLBbuonzt3l0` — accurate (real PBS Great Performances Vienna Philharmonic broadcast), but carries a persistent "PBS | Great Performances" watermark; redundant with the watermark-free vintage-bottling pick.
7. `https://giphy.com/gifs/hqOBpMMFKJ2F0FSbDD` — official USRowing channel, clean and watermark-free; redundant backup for the swarm-orchestration placeholder if a second image is ever wanted there. (Minor correction: rowers' eyewear reads blue/mirrored on decode, not red as originally described — immaterial to fit.)
8. `https://giphy.com/gifs/LutonTown-save-unbelievable-wembley-hqLQ87MMXzJPYlEkfU` — genuine save at Wembley, but carries a persistent "LTFC ORIGINALS" bug across every frame; the FA Cup clip chosen for HOOK_BLOCK is watermark-free across 4 checked timestamps and is the cleaner pick.
9-11. Additional redundant "real save" / theme-overlap backups from the guardrails-governance and shipping-relief sourcing passes, confirmed accurate on re-decode but not selected — see workflow journal (`agent-*.jsonl` under the run's transcript dir) for the full per-candidate breakdown if a 7th+ GIF is ever wanted.
