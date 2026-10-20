# GIF Plan — prompt-lift v0.4.0 article (`/tmp/pl-wf-out/primary-final.md`)

Five `GIF_PLACEHOLDER_*` lines, five picks, one per placeholder. Every candidate in this document was found, resolved, fetched and frame-decoded by this curator on 2026-10-20 (IST, finished 22:28); nothing is carried on trust from an earlier plan, and no URL below was typed from memory. Giphy did not block any request: all 75 search pages returned `HTTP 200`, and `https://giphy.com/services/oembed` resolved every candidate page that was tried.

The five placeholders and the beat each HTML comment asks for (line numbers in `primary-final.md`):

| Line | Placeholder | Section (`##`) | Beat in the comment |
|---|---|---|---|
| 73 | `GIF_PLACEHOLDER_ENHANCE_PRESS_REWRITE` | `## One press, end to end` | the full press: type "fix the login bug", press Enhance, Cancel row + "Enhancing with fable…", rewrite lands with inserted words underlined, done row shows model, tokens, dollars |
| 99 | `GIF_PLACEHOLDER_GUARD_REFUSAL_TOAST` | `## The guards, and what they refuse` | a refusal: a rewrite that invented a path is thrown away, toast "named a file that does not exist, kept your prompt" with the call's cost, draft untouched |
| 112 | `GIF_PLACEHOLDER_UNDO_REDO_SWAP` | `## Undo, Redo, Send and Enter` | press u: "restored your draft", original words back; press u again: "re-applied the enhanced prompt", highlights return |
| 149 | `GIF_PLACEHOLDER_PREVIEW_DYNAMIC_BLOCK` | `## The conversation tail, preview, and the other sub-commands` | `/prompt-lift preview write a commit` prints the dynamic block and the static-block size/hash line; no toast, no cost |
| 198 | `GIF_PLACEHOLDER_PROBE_FIRST_RUN` | `## Install and first run` | first run: `/reload-plugins`, `/prompt-lift probe` prints one `ok` per rung, the idle band row appears above the prompt |

Every placeholder sits at the end of its section, immediately after the HTML comment and before the next `##` heading; each embed line replaces the placeholder line in place.

## Verification method

1. **Search**: `curl -sL` with a desktop Chrome user agent against `https://giphy.com/search/<terms>` (75 terms across the five beats, e.g. `pencil-sharpener`, `wastepaper-basket`, `eraser-erasing`, `magnifying-glass-animation`, `radar-sweep`), then `grep -o 'giphy.com/gifs/[A-Za-z0-9_-]*'` on the returned HTML to list candidate page URLs. Search HTML saved under `/tmp/pl-wf-out/gifs/html/`.
2. **Resolve**: each page URL through `https://giphy.com/services/oembed?url=<encoded page URL>`, reading `url` (canonical direct media URL, host `mediaN.giphy.com`), `author_name`, `title`, `width`, `height` from the JSON.
3. **HEAD**: `curl -sI` on the direct URL; required `HTTP/2 200` and `content-type: image/gif`; `content-length` recorded.
4. **Fetch and probe**: downloaded to `/tmp/pl-wf-out/gifs/dl/<id>.gif` (111 GIFs in total), `file` to confirm `GIF image data, version 89a`, `ffprobe -count_frames` for width, height, frame rate, frame count and duration.
5. **Look**: `ffmpeg` decoded the middle frame (`select=eq(n,N/2)`) and a 6-frame contact strip per GIF; the six front-runners got a 12-frame dense strip as well, and the five picks were re-read at full resolution. Every frame strip was inspected for burned-in captions, logos, corner watermarks, meme faces and people being mocked. Alt text below is written from those pixels, not from the Giphy title (three picks are titled generically or sit on the bare `GIPHY` account).
6. **Re-check**: at 22:28 IST on 2026-10-20 the five chosen direct URLs were HEAD-requested again in one batch; all returned `HTTP/2 200`, `content-type: image/gif`, and a `content-length` byte-identical to the downloaded file (3,123,136 / 988,703 / 413,429 / 1,138,278 / 41,529).

Size rule applied: under 4,000,000 bytes. Anything over was HEAD-checked only and is listed as rejected, never fetched for a slot.

## Selected GIFs (5, one per placeholder)

### 1. Placeholder: `GIF_PLACEHOLDER_ENHANCE_PRESS_REWRITE`
- Giphy: https://giphy.com/gifs/pencil-stopmotion-sharpener-3oEduIMgzI1StP2UaQ
- Direct link: https://media4.giphy.com/media/3oEduIMgzI1StP2UaQ/giphy.gif
- author_name: Dropbear (oEmbed title "Pencil Sharpener GIF by Dropbear")
- Section: `## One press, end to end` (replace line 73, directly after the `<!-- GIF: the full press in one take … -->` comment, before `## The guards, and what they refuse`)
- Why it fits: a blunt pencil is pushed up into a sharpener and the only thing that comes out is a mound of shavings — the section's whole arc is "one press turns a vague draft into a sharper one, and here is what the press costs". The shavings growing frame by frame are the visible by-product of the press (the `+N words`, the tokens, the dollars on the done row), and the pencil never leaves the frame, like the draft that stays in the box. Stop-motion, no face, no text; the only candidate in the Enhance theme where the sharpening itself is the on-screen action rather than a tool sitting still.
- Verification: oEmbed resolved (`author_name: "Dropbear"`, 480x480); `curl -sI` → `HTTP/2 200`, `content-type: image/gif`, 3,123,136 bytes (re-checked 22:28 IST, identical); downloaded, `file` = GIF 89a 480x480; `ffprobe` 480x480, 61 frames, 15 fps, 4.07 s. Mid frame 30: an off-white wall; a red-orange pencil stands vertically from the bottom edge with its tip inside a small white wall-mounted sharpener block at centre; a burst of pale wood shavings with red-brown edges fans out above and around the block. Over the strip: frame 0 is the bare wall, the sharpener and pencil appear by frame 10, and the shavings grow from a few curls to a large mound with red specks falling by frame 50. No caption, no logo, no corner watermark in any sampled frame.
- Honesty note: at 3.12 MB this is the heaviest pick. If weight matters more than drama, swap in the shawy animation hand-crank sharpener (first alternate below, 217 KB).
- Embed line: `![A pencil pushed up into a small wall-mounted sharpener while a growing mound of wood shavings bursts out above it](https://media4.giphy.com/media/3oEduIMgzI1StP2UaQ/giphy.gif)`

### 2. Placeholder: `GIF_PLACEHOLDER_GUARD_REFUSAL_TOAST`
- Giphy: https://giphy.com/gifs/Feathersonabstract-trash-bin-rubbish-xgVhtt0ewR0SRCGq82
- Direct link: https://media4.giphy.com/media/xgVhtt0ewR0SRCGq82/giphy.gif
- author_name: Feathers (oEmbed title "Trash Can GIF by Feathers")
- Section: `## The guards, and what they refuse` (replace line 99, after the `<!-- GIF: a refusal beat … -->` comment, before `## Undo, Redo, Send and Enter`)
- Why it fits: a cartoon penguin walks up to a bin, lifts the lid, drops a knotted rubbish bag in, closes the lid and walks away — the bin is still standing, the bag is gone. That is the refusal path exactly: the paid rewrite that named a file which does not exist goes in the bin, the lid closes (`kept your prompt`), and the composer is left as it was. Wordless, deliberate, no human face, and the penguin's matter-of-fact pace matches a guard that does its job without fuss. 8.9 s, so the whole beat plays before the loop.
- Verification: oEmbed resolved (`author_name: "Feathers"`, 480x480); `curl -sI` → `HTTP/2 200`, `content-type: image/gif`, 988,703 bytes (re-checked 22:28 IST, identical); downloaded, GIF 89a; `ffprobe` 480x480, 156 frames, 25 fps, 8.92 s. Mid frame 78: cream background; a cartoon penguin (black body, white belly, orange beak and feet) stands left of a grey ribbed metal bin, facing right, both flippers on the bin's rim, the bag no longer visible. Across the 12-frame dense strip: frames 0-13 show a black knotted bag beside the bin; the penguin enters from the left, picks the bag up (frames 39-65), lifts the lid and drops it in (65-78), then turns and walks off right (91-143), leaving the lidded bin alone. No text, no watermark in any frame.
- Embed line: `![A cartoon penguin lifting the lid of a grey metal bin and dropping a black rubbish bag inside](https://media4.giphy.com/media/xgVhtt0ewR0SRCGq82/giphy.gif)`

### 3. Placeholder: `GIF_PLACEHOLDER_UNDO_REDO_SWAP`
- Giphy: https://giphy.com/gifs/erase-83eQIMgNvkiY
- Direct link: https://media4.giphy.com/media/83eQIMgNvkiY/giphy.gif
- author_name: GIPHY (bare account; oEmbed title "Circle Erase GIF")
- Section: `## Undo, Redo, Send and Enter` (replace line 112, after the `<!-- GIF: Undo and Redo … -->` comment, before `## What a press costs, and how the cache keeps it down`)
- Why it fits: a pencil draws a circle, runs its eraser end round the line until only crumbs are left, and the loop restarts with the circle drawn again. Apply, undo, redo, in one object: the circle is the enhanced text, the eraser pass is `restored your draft`, the redraw is `re-applied the enhanced prompt`. Nothing else is in frame, so it reads at thumbnail size.
- Verification: oEmbed resolved (`author_name: "GIPHY"`, 377x480); `curl -sI` → `HTTP/2 200`, `content-type: image/gif`, 413,429 bytes (re-checked 22:28 IST, identical); downloaded, GIF 89a; `ffprobe` 377x480, 60 frames, 10 fps, 6.1 s. Mid frame 30: pale-yellow background; an orange wooden pencil with a silver ferrule and dark-red eraser lies diagonally across the centre, tip to the upper right; a hand-drawn dark circle about three-quarters complete arcs around it; fine grey eraser crumbs are scattered along the outside of the ring. Dense strip: frame 0 is the pencil alone with no circle, frames 5-15 draw the arc, frames 20-25 show the eraser end at the ring with crumbs appearing, frames 30-55 show the ring complete with crumbs around it before the loop returns to the bare pencil. No text, no watermark.
- Honesty note: the uploader is the bare `GIPHY` account, so the original artist is not credited by the oEmbed data.
- Embed line: `![A pencil drawing a circle, rubbing it out with its eraser end, and drawing it again](https://media4.giphy.com/media/83eQIMgNvkiY/giphy.gif)`

### 4. Placeholder: `GIF_PLACEHOLDER_PREVIEW_DYNAMIC_BLOCK`
- Giphy: https://giphy.com/gifs/analytics-pixelmonkeys-tony-babel-l46Cy1rHbQ92uuLXa
- Direct link: https://media2.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif
- author_name: Tony Babel (oEmbed title "Animation Illustration GIF by Tony Babel")
- Section: `## The conversation tail, preview, and the other sub-commands` (replace line 149, after the `<!-- GIF: /prompt-lift preview … -->` comment, before `## Install and first run`)
- Why it fits: a hand holds a magnifying glass over a laptop screen and the chart under the lens is enlarged — looking closely at what is on the screen without touching it. `preview` does exactly that: same pre-guards, same blocks, printed and inspected, no model call, no state write. Flat illustration, no labels on the chart, no text anywhere, the laptop is the only prop.
- Verification: oEmbed resolved (`author_name: "Tony Babel"`, 480x360); `curl -sI` → `HTTP/2 200`, `content-type: image/gif`, 1,138,278 bytes (re-checked 22:28 IST, identical); downloaded, GIF 89a; `ffprobe` 480x360, 180 frames, 33.3 fps, 5.43 s. Frames 15 and 165: a violet background; a flat laptop with a dark-blue outline and pale-lavender screen; the screen shows a rising line chart with dots and a row of bar-chart columns; a white cartoon hand holds a round magnifying glass over the right side of the screen, enlarging the chart under it. Mid frame 90 is the between-cycles state: the laptop alone with a blank screen, the hand withdrawn; the chart redraws from frame ~100 and the hand returns by ~135. No text, no watermark in any of the 12 sampled frames.
- Honesty note: the loop has a blank-screen beat of roughly 1.5 s in the middle; the magnifier is on screen for about two thirds of the cycle.
- Embed line: `![A hand holding a magnifying glass over a laptop screen showing a line chart and bar chart](https://media2.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif)`

### 5. Placeholder: `GIF_PLACEHOLDER_PROBE_FIRST_RUN`
- Giphy: https://giphy.com/gifs/illustration-pixel-art-radar-l3V0rsh4fuE5GVcHK
- Direct link: https://media4.giphy.com/media/l3V0rsh4fuE5GVcHK/giphy.gif
- author_name: Walter Newton (oEmbed title "Illustration Loop GIF by Walter Newton")
- Section: `## Install and first run` (replace line 198, after the `<!-- GIF: first run … -->` comment, before `## Configuration essentials`)
- Why it fits: a radar sweep going round once and coming back is the plainest picture of `probe`: a `ping` sent to each rung in turn, 8 tokens max, one `ok` or `refused` line per model. Pixel art on a grey halftone field matches a terminal-first mod, and at 41 KB it is the lightest GIF in the article.
- Verification: oEmbed resolved (`author_name: "Walter Newton"`, 500x500); `curl -sI` → `HTTP/2 200`, `content-type: image/gif`, 41,529 bytes (re-checked 22:28 IST, identical); downloaded, GIF 89a; `ffprobe` 500x500, 20 frames, 12.5 fps, 1.6 s. Mid frame 10: a round pixel-art radar screen with a light-grey pixel bezel on a grey halftone-dot background; the black dial carries concentric bright-green rings and a centre dot; a bright-green sweep wedge points straight down with a fading trail behind it. Across all 20 frames the wedge rotates one full turn clockwise. No text, no watermark.
- Honesty note: 1.6 s is a quick loop; the rotation is smooth, so it does not flicker.
- Embed line: `![A pixel-art radar screen with a bright green sweep rotating over concentric rings](https://media4.giphy.com/media/l3V0rsh4fuE5GVcHK/giphy.gif)`

## Ready-to-paste embed lines (one per placeholder, in article order)

![A pencil pushed up into a small wall-mounted sharpener while a growing mound of wood shavings bursts out above it](https://media4.giphy.com/media/3oEduIMgzI1StP2UaQ/giphy.gif)

![A cartoon penguin lifting the lid of a grey metal bin and dropping a black rubbish bag inside](https://media4.giphy.com/media/xgVhtt0ewR0SRCGq82/giphy.gif)

![A pencil drawing a circle, rubbing it out with its eraser end, and drawing it again](https://media4.giphy.com/media/83eQIMgNvkiY/giphy.gif)

![A hand holding a magnifying glass over a laptop screen showing a line chart and bar chart](https://media2.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif)

![A pixel-art radar screen with a bright green sweep rotating over concentric rings](https://media4.giphy.com/media/l3V0rsh4fuE5GVcHK/giphy.gif)

## Also considered, not selected for a slot

Every alternate below passed oEmbed and `curl -sI` (`HTTP/2 200`, `content-type: image/gif`) and, unless marked "HEAD only", was downloaded and frame-decoded on 2026-10-20. Byte counts are the `content-length` values returned today.

### Enhance-press theme (slot 1)
- **shawy animation hand-crank sharpener** (`J5XsxWmwyy4NOdKb5Z`, https://media2.giphy.com/media/J5XsxWmwyy4NOdKb5Z/giphy.gif, 217,460 bytes, 480x318, 10 frames, 1.0 s) — a chrome desk sharpener on a grey surface, yellow pencil inserted, crank turning; stop-motion, clean in all 10 frames. The swap if 3.1 MB is too heavy; the pencil's tip never shows a before/after, which is why it lost the slot.
- **Framesequence cartoon pencil and sharpener** (`e619qGk1lRglcvFuzP`, https://media3.giphy.com/media/e619qGk1lRglcvFuzP/giphy.gif, 619,589 bytes, 480x480, 149 frames, 9.9 s) — an anthropomorphic orange pencil wriggles while a blue sharpener with a face sharpens it; clean, playful; the faces make it a tone choice rather than a literal one.
- **PES two-ended pencil** (`GqNN0W71T1Yh5N18NZ`, https://media3.giphy.com/media/GqNN0W71T1Yh5N18NZ/giphy.gif, 943,418 bytes, 480x320, 23 frames) — a horizontal pencil sharpened from both ends until the tips meet; clean, but reads as "a pencil shrinking".
- **Trixie The Pixie red pencil line** (`Qr7hCYwylJY1SR0cvE`, https://media0.giphy.com/media/Qr7hCYwylJY1SR0cvE/giphy.gif, 660,779 bytes, 480x480, 96 frames) — a cartoon hand draws a red line across a sheet with a green pencil while a face watches from a window; clean, but "a line drawn" is a weaker read than "sharpened".
- **CATC nib pen stroke** (`EC9dg7IxhEB2mHmYN0`, https://media4.giphy.com/media/EC9dg7IxhEB2mHmYN0/giphy.gif, 83,463 bytes, 480x480, 22 frames) — a black nib pen draws a wavy stroke on white; clean and tiny, no rewrite read.
- Rejected after decoding: Alex Boya sketches (`BqZ7zs47jK1tmGKxfS`, `k7PZqKDQu4vojYcpFt`) carry an "alexboya" corner signature; Great Pottery Throw Down coil (`2dBQncf13MpOXl7rH3`) has the show logo top-left; TRACER marker and pencil (`bxz74fYaBEsZ8V54a8`, `Tv173OrVstVJEwZdJc`) are product shots with brand text; "Back to School" PES (`TCQDc50QwTJ1vteYcQ`) has a caption; OHMAGIF/Discovery watermarks (`Xe8UNYh7ehT1K`, `E9QwcrZUH5nqg`); Josie Norton (`2igoqBTKR7kYJjChnn`) is 2 frames with a signature; calligraphy and handwriting footage shows legible words (`YqK4o9txKgn6M`, `l49JRQC9RNa5j35a8`, `FLwQvAdjWmvvO`, `j4h4FTCSkdfry`); Flocksy (`NsevjOZFioDKn33pL7`) is a text reel; the pen-chewing self-portrait (`LrLWYpxQEgRwDCTpbL`) and the abstract pencil lines (`TKRYqi4hArzsDkaVPj`) are clean but off-beat; the pink highlighter (`TfGQGBHqn9pY32wp9L`) only tilts.
- Over the size cap (HEAD only): circlelineartschool drawing (`Eb9Tr0gC4LvenSFWEp`, 7,627,706), Alex Boya undercam (`m5scQQCVusP6RfIizx`, 6,340,315), Alex Boya text people (`eX3cuI26vtfkYRfByw`, 6,668,440).

### Refusal theme (slot 2)
- **Line-art "Trash Bullseye"** (`h2CLfvYJ6BbdoGRXGG`, https://media0.giphy.com/media/h2CLfvYJ6BbdoGRXGG/giphy.gif, author GIPHY, 47,562 bytes, 480x480, 11 frames, 0.56 s) — a black-ink wire wastebasket on white, a crumpled paper ball arcs in from the top right and lands inside. The most literal and the lightest refusal image; all 11 frames clean. Lost the slot to an abrupt half-second loop.
- **Make it Move bouncer** (`3og0IUslmf25k8Ea7C`, https://media3.giphy.com/media/3og0IUslmf25k8Ea7C/giphy.gif, 412,068 bytes, 800x600, 79 frames, 7.68 s) — re-verified today, byte-identical to the tracehub/cost-guard plan. Still clean and still apt, demoted only because it already carried the refusal beat in the previous article of this series.
- **PES junk fish into a recycling bag** (`qt00p0VTORSuP5SIVx`, https://media3.giphy.com/media/qt00p0VTORSuP5SIVx/giphy.gif, 2,084,355 bytes, 307x480, 33 frames) — a hand holds a fish assembled from plastic forks and packaging against a blue sky and drops it into a blue woven recycling bag; clean (the recycle symbol is on the bag), portrait, reads as "junk out".
- **Teal wastebasket with missing paper balls** (`3o6ozoYK3XGNlaLNqE`, https://media3.giphy.com/media/3o6ozoYK3XGNlaLNqE/giphy.gif, author GIPHY, 52,023 bytes, 400x400, 59 frames) — flat cream basket on teal, paper balls bounce off the rim and land around it; clean but the balls miss, which reads as "failed throw", not "refused".
- **Jef Caine person-to-paper-ball** (`GPEoODhpnGtWY3NgQt`, https://media2.giphy.com/media/GPEoODhpnGtWY3NgQt/giphy.gif, 1,278,165 bytes, 270x480, 48 frames) — a man standing against a white wall is crumpled into a paper ball that bounces away; clean, but it crumples a person, not a page.
- **A. L. Crego mesh basket loop** (`yoJC2IoPD8vmxx37gI`, https://media3.giphy.com/media/yoJC2IoPD8vmxx37gI/giphy.gif, 252,117 bytes, 480x270, 37 frames) — dim real footage of a mesh basket with papers on the floor; clean but gloomy.
- Rejected after decoding: burned-in "STOP!!", "NOPE!", "NO", "NOPE" (`CY1LbKJeKr9LT14A3L`, `l0MYICK7vFjhxwxhK`, `9cwkCT37bII3GNFIz3`, `fCeppm7eaefOrQoIvm`); goalkeeper drawing with an "@stebore91" watermark (`cm0JWb1nsCyf4khp5W`); letterboxed Jimmy Arca toss with in-scene lettering (`yBhsUYvDhKGJUF3MAK`); Breather shredder ends on "SHRED IT" (`3ov9k3Hmuq23AYU6aY`); referee red card is a single frame (`hC23fYScpFs9XKjD06`); Das Örtliche referee with adidas and sponsor logos (`zmyLJHYiE7KYCgGysZ`); Univision broadcast footage (`3o7qE0gOGwzPbH81Qk`); "@just_daren_for_now" watermark (`E8qWR56HjggzQLvwrh`); "I HAVE NOTHING TO WEAR" (`l0ExvNshoRarlEcla`); "LET ME COOK" meme (`o6LVSe1QGaro4bkM0O`); Learner Circle caption (`fAilxwUbfotdEhRHDA`); MASHED logo (`bnBKCPRWvcT6lLTZzG`); Snapple carton plus caption (`BoItAhslMUjZvC0SVv`); heart dropped in a bin (`xUn3Cuayeo8RTX23sI`) and a girl diving into a bin (`h2dzHZXZUUBoxR0pC4`) are the wrong subject; four real bin-dumping clips (`43hKsYFGJIbKRyZcgH`, `fwISAtUfiUwK5PtwIM`, `ORDbBHQ2jcnRiuQZU1`, `YoaHFYBp2H0DbTrW0P`) are grimy; burning wheelie bin (`jTquvReTkJ32zbZk5o`); brain tossed into a bin by a real person (`RggtJdCTUS7s05wVUS`); MikelMats flipbook "Fail" (`S2vc8XI0eeBajDSO4a`); anime shield (`etBKy4Nog4MvI6JXxf`); "LET'S SORT IT!" (`iYNwNwXiTMVK53nH76`).
- Over the size cap (HEAD only): "So Close Football" goalkeeper (`zAUS3lEtBHYVp8K6VA`, 8,257,656), Best Facilities shredder (`HjixjuoxwWmYMtHU83`, 7,816,685), bureaucratic waste loop (`M6tgf1DPuMw5a`, 4,843,647), Inazuma Eleven goalkeeper (`QpKligF3rMYXtIE5tf`, 5,951,745, also anime IP), xponentialdesign tin foil (`tHyYVcQPXYF8c2eYjR`, 13,804,789).

### Undo/Redo theme (slot 3)
- **Lusi cassette rewound with a pencil** (`6pH1jBiTMnuzHhA3G0`, https://media1.giphy.com/media/6pH1jBiTMnuzHhA3G0/giphy.gif, 552,640 bytes, 480x384, 126 frames, 8.39 s) — an illustrated cassette on dark green; yellow tape spills out of it, a pencil is pushed into the reel and winds the tape back in. The best pure "rewind" image and the strongest swap if the circle is judged too abstract; it only shows undo, not redo.
- **Todd Rocheford cartoon erase** (`KD7Ud1YX1nYRkb2r29`, https://media3.giphy.com/media/KD7Ud1YX1nYRkb2r29/giphy.gif, 687,423 bytes, 480x480, 91 frames, 6.47 s) — a flat yellow pencil draws a line on royal blue, flips, erases, repeats; clean; the pencil is off-screen for stretches (mid frame 45 is solid blue).
- **U.S. National Archives tape drive** (`3oz8y0fIoBvzUEv88E`, https://media1.giphy.com/media/3oz8y0fIoBvzUEv88E/giphy.gif, 361,513 bytes, 400x300, 11 frames) — colour archive footage of a mainframe tape unit, one grey and one red reel spinning; small diegetic panel lettering; abrupt 11-frame loop.
- **Jerology reel-to-reel cinemagraph** (`BM5n8rgwmHVra`, https://media0.giphy.com/media/BM5n8rgwmHVra/giphy.gif, 79,257 bytes, 480x270, 49 frames) — reels turning on a vintage deck beside a lamp; clean and light; a mood image rather than an action.
- **Primer flat reels** (`3o85xCV3NjTFuLRa6s`, https://media2.giphy.com/media/3o85xCV3NjTFuLRa6s/giphy.gif, 86,282 bytes, 480x294, 12 frames at 2 fps) — two yellow-and-white reels on mustard; jerky.
- **Eric Xue swing pendulum** (`2aoIrU8tABkc4YfJqf`, https://media4.giphy.com/media/2aoIrU8tABkc4YfJqf/giphy.gif, 1,736,427 bytes, 480x480, 61 frames) — a red 3D swing seat rocking among pink spheres; clean, abstract back-and-forth.
- **CAPITALWASTE stylised deck** (`fBO3Gm4OWTrMbhjqmY`, https://media2.giphy.com/media/fBO3Gm4OWTrMbhjqmY/giphy.gif, 2,508,643 bytes, 800x600, 38 frames) — teal and red illustrated reel deck; small diegetic panel lettering.
- Rejected after decoding: Newton's cradle (`gS0rng73xPCU`) has a "make gifs at Gifsforum.com" watermark bottom-right; "AUTO REVERSE" cassette deck (`WtgDvFNn7fjOydBcxW`) is dominated by that lettering; REWIND/PLAY/FFW T-shirts (`PWXrDPKE1ucsjF2zKQ`); CTRL Z keys with a "PRZETWOR" watermark (`V7XTwbE7Dm3AWHwAdG`); 2-frame "Z" (`xUPGcMbSZAxhXsBtHG`); three real cats turning their heads (`wzF9L6ENj1pHG`, meme read); VHS Hi-Fi label and hands (`pWsz9pgd1X1Re`); Spacebomb deck (`KD8YfiTAxNZJr3utxo`) letterboxed and dark; tiny swinging figure (`vx2rjDClkcjlgmO6Fe`) illegible at thumbnail size.
- HEAD only: Memorex 90s (`RtIMLBSGzkOZy`, 808,620, brand), 1X robot backpedal (`ZhQ7VWqRMqaN2J5nOd`, 4,721,606, over cap), Nova Sound DJ (`HKqsyIaNhGEHjwALHq`, 3,771,738, person at decks).

### Preview theme (slot 4)
- **erma fiend three magnifiers over an egg** (`3oz8xISbgQLUmhpR4I`, https://media3.giphy.com/media/3oz8xISbgQLUmhpR4I/giphy.gif, 246,871 bytes, 480x406, 28 frames) — purple, red and yellow magnifying glasses on white; the egg under each lens shows a different stage (whole, cracked, fried, chick); clean, charming. The swap if the section wants "see what is inside before it happens" rather than "inspect the screen".
- **madebydot letter R with circuitry** (`26FPC5oAdfeFPkQQE`, https://media3.giphy.com/media/26FPC5oAdfeFPkQQE/giphy.gif, author Anomaly, 593,451 bytes, 480x360, 133 frames) — a magnifier moves over a large dark "R" revealing coloured circuit traces inside; a single glyph is on screen, so it is not strictly text-free.
- **Alan X-ray skeleton** (`alubZE7KFjOn8fs0dR`, https://media4.giphy.com/media/alubZE7KFjOn8fs0dR/giphy.gif, 482,238 bytes, 480x242, 16 frames) — a flat blue skeleton raising an arm inside a white circle; clean, no logo in any frame although the account is a health insurer.
- **Reuben Armstrong morphing icons** (`0vhQ3oQGBt8lRJ9LZr`, https://media4.giphy.com/media/0vhQ3oQGBt8lRJ9LZr/giphy.gif, 237,002 bytes, 1080x1080, 64 frames) — a red icon morphs magnifier → target → star → burst → gear; clean, but only briefly a magnifier.
- Rejected after decoding: IFHT Films (`3SggeTHkfnN1cRseK3`) letterboxed real-face gag; Ben Franklin costume (`2idRkrRqgHOUkPOv9h`) and Last Talk Show (`2YIPuYxwKRRevdD8g3`) costume gags; NESSTOY child with binoculars (`0nVkZasX89up3aZfwA`, a child); scorpion scan (`5Ydk6MmwIeEotSZJ1D`) burned-in coordinate text; bigfoot (`UcGZJB4wtp0XK`) faint repeated FOX watermark; anime detective (`26FffmVOwnz3uRnaw`); BADCODEC blueprint (`l41lVyCmpkg87cbAc`) watermark; Explainer Studio X-rays (`M1HhBMeLDhjP5Ct6yB`, `WmnyCFTla8Z9tQjZaE`) logo bottom-centre; CubiCasa "LOADING THE FLOOR PLAN" (`hkxnlP6owN3XFT8NaF`).
- HEAD only: Goat Girl detective (`fUKitKfhS32bPn1cpp`, 4,154,030, over cap), Jake discovery (`3o85xtecsBbIhtyKFW`, 4,199,676, over cap), tibber detective (`AKDe3pwcVj1UsvBufJ`, 5,203,525), Great Mouse Detective (`QveCA2Kt0q4ErjBXJL`, Disney IP), Lehigh binoculars (`XaAP9zx24kELOIFW93`, 3,011,514, university brand).

### Probe theme (slot 5)
- **Sonar from ship to submarine** (`4xGCaTMCO59le`, https://media4.giphy.com/media/4xGCaTMCO59le/giphy.gif, author GIPHY, 645,034 bytes, 500x372, 30 frames at 5 fps) — black-and-white educational animation: arcs of sound travel down from a surface ship and reach a submarine. The most literal "ping" image; a wartime subject and a 5 fps cadence kept it out of the slot.
- **Night lighthouse with sweeping beam** (`qp7vRr7VqgfZXQc20a`, https://media2.giphy.com/media/qp7vRr7VqgfZXQc20a/giphy.gif, author GIPHY, 330,246 bytes, 448x480, 8 frames) — an illustrated red-and-white lighthouse sweeps a yellow beam over rocks and a small boat; clean; 8-frame loop.
- **Pierre-Julien Fieux ink lighthouse** (`IB41n645B0YPPD8t3B`, https://media4.giphy.com/media/IB41n645B0YPPD8t3B/giphy.gif, 358,120 bytes, 480x480, 6 frames) — monochrome ink-wash lighthouse with rotating beams; 6-frame loop.
- **Radar over a coastline map** (`ki1rmMhjvLlm`, https://media1.giphy.com/media/ki1rmMhjvLlm/giphy.gif, author GIPHY, 287,106 bytes, 300x300, 32 frames) — a green sweep over a chart with small place-name labels (diegetic text).
- **Blinking striped lighthouse** (`Cd9XcHdZEIcaA`, https://media3.giphy.com/media/Cd9XcHdZEIcaA/giphy.gif, 2,394,303 bytes, 480x360, 168 frames) — red-and-white lighthouse flashing on a starry sea, one full-white flash frame.
- Rejected after decoding: TEAM AF "SCANNING" and "UPTIME 100%" (`gR9rgtGxSw2HMj88nF`, `D24tVN39jEf7Z62u0I`); "Pixelstrich" watermark (`v1HyIOR08GY6I`); Mic swimmer caption (`C6YP5C78ajOLe`); "POWERED UP!" (`kGaL4fFNLZYWOADqKa`); Chris Cunningham dark room (`3QegDkfeLfRUA`, mostly black); Jake 3D UI (`xTiTnBHZGDu75XXUd2`, tiny labels); "YES?" door (`7Rqk0I8KlkFIBKqLc1`); knocking hands (`l1J3CS4IceXSLudMI`, weak read); cartoon submarine with hull number (`HS0DVKgO7oehW`); periscope view (`ylG3QPf0MoCc0`); Jaws clip (`26ufpejUEP8jQ0nCg`, film IP).
- HEAD only: Psyklon neon radar (`P9dcQTpWe2mxihXvS3`, 8,222,246) and IndieRocktopus scifi loop (`l1JoicC9lDglR3cbe`, 7,378,298) over cap; radar `VuehuL4fMHLgs` (2,749,908) not decoded after two cleaner radars were in hand; Teesside knocking (`enh8robzWZaLPveTe7`, 4,330,946) over cap; Lighthouse Agency (`iOVckTpMb691E2SePd`) and Disney vintage lighthouse (`ULwswKmpc5wze`) brand/IP.

## Working files

Search HTML, downloads, mid frames and contact strips are under `/tmp/pl-wf-out/gifs/` (`html/`, `dl/`, `frames/`); helper scripts under `/tmp/pl-wf-out/gifs/bin/` (`gsearch.sh`, `goembed.sh`, `gprobe.sh`, `montage.py`). All are scratch and can be deleted after the embeds are pasted.
