# GIF plan: mcpsmiths article run, 2026-11 (selected 2026-10-31)

## Verification method

Candidates were found with web search and giphy.com pages (no Giphy search API key was used). Each candidate was checked with only public endpoints and local tools: the keyless oEmbed endpoint (`https://giphy.com/services/oembed?url=<page_url>`) for author_name and title, `curl -sI` on the direct media URL for HTTP status, content-type and bytes, `curl` to download the file, `ffprobe` for width, height, fps, frame count and duration, and `ffmpeg` to extract frames that were then viewed (at most 8 frames per verifier run, 480 px wide). A Giphy page title or tag is NOT evidence of what the pixels show: where a title and the frames disagree, the frames win and the mismatch is noted below. Six sections were scouted and independently verified; this selector step picked one accepted GIF for five of them and dropped the weakest section (s5, "What is still unproven": a GIF there can read as flippant, and its best candidate had printed text on a box and was a jigsaw in progress, not an honest gap).

Files were downloaded under `scratch-pad/mcpsmiths-article-run-2026-11/gifs/<section>/<id>.gif`. After the selection I re-ran the header check on all five direct URLs (HTTP 200, content-type image/gif, byte counts unchanged) and viewed one frame of each myself.

Total download size of the five selected GIFs: 5,094,524 bytes (about 4.86 MiB). Individual sizes: 125,665 + 1,074,691 + 98,783 + 2,508,362 + 1,287,023.

## Selected GIFs

### 1. tracehub-mcp: what to set (section s1)

- Giphy page: https://giphy.com/gifs/jnJIFn9PX3uwwMLy3a
- Direct link: https://media0.giphy.com/media/jnJIFn9PX3uwwMLy3a/giphy.gif
- author_name: Camerussia (oEmbed title: "Шлагбаум GIF by Camerussia - Find & Share on GIPHY"; the Russian word means "boom barrier")
- Local file: `gifs/s1/jnJIFn9PX3uwwMLy3a.gif`
- Why it fits: a literal barrier arm that lifts and lowers is the plain picture of a gate that opens only when a setting is deliberately changed. It is calm, wordless, on a white background, and the lightest file in the set.
- Verification: HTTP 200, content-type image/gif, 125,665 bytes, 480x270, 10 fps, 28 frames, 9.7 s.
- What the frames show: a dark-grey square post with a green band and a yellow-orange hub holds a red-and-white striped barrier arm with an orange end cap on a plain white background. Frame 0: the arm is horizontal (closed). Frame 14: the arm is raised about 20 degrees. Frames 20, 24 and 27 (contact sheet): it lowers back to horizontal, so the loop ends closed. No burned-in text (tesseract OCR on frames 1, 2, 13 and 27 returned nothing) and no logo seen.
- Honesty note: the title is Russian and generic ("boom barrier"), and matches the pixels. The 9.7 s native length is over the 1 to 8 s guide, but 7.1 s of it is two held frames (2.0 s closed at the start, 5.1 s raised in the middle); the motion itself is 26 frames at 100 ms. Shortening those two delays brings it to about 5 s; do that at integration time if the 8 s guide is to be kept strictly. The arm shows the barrier opening rather than blocking.
- Alt text: A grey barrier post with a red-and-white striped arm that lifts, holds, then lowers back to horizontal on a white background.

### 2. cost-guard-mcp: what to set (section s2)

- Giphy page: https://giphy.com/gifs/ilvesmotors-car-miles-odometer-YhtiUrWWtpe7QpinHZ
- Direct link: https://media0.giphy.com/media/YhtiUrWWtpe7QpinHZ/giphy.gif
- author_name: Ilves Motors (oEmbed title: "Car Numbers GIF by Ilves Motors - Find & Share on GIPHY")
- Local file: `gifs/s2/YhtiUrWWtpe7QpinHZ.gif`
- Why it fits: a counter that only climbs is a literal picture of cumulative spend running up toward a cap you set.
- Verification: HTTP 200, content-type image/gif, 1,074,691 bytes, 480x254, 25 fps, 100 frames, 4.0 s.
- What the frames show: a close-up of a car instrument cluster, the lower part of a speedometer dial with numerals 40 to 170, and a dark circular display with a dot-matrix odometer. Frame 1 reads 207784 and frame 50 reads 213642, so the digits count upward. A change-region check over all 100 frames found that the only region that ever differs from frame 1 by more than 40 luma is the digit window (x175-374, y191-225), so no caption, logo or watermark appears anywhere else. No people.
- Honesty note: the odometer is a distance counter, so it stands in for spend rather than showing money; the title "Car Numbers" is generic and the pixels are an odometer. Only frames 1 and 50 were viewed; the last frame was not viewed, so the final value is unverified, and the loop restarts with a small digit jump (first-vs-last diff 6.5 on a 0-255 scale).
- Alt text: Car dashboard close-up: the digital odometer digits count rapidly upward beneath a speedometer dial.

### 3. What the live gate caught in cost-guard 0.6.0 (section s3)

- Giphy page: https://giphy.com/gifs/libertarian-OcrzJh9cKnyJG
- Direct link: https://media4.giphy.com/media/OcrzJh9cKnyJG/giphy.gif
- author_name: GIPHY (oEmbed title: "Siren GIF - Find & Share on GIPHY"; the page slug carries an unrelated "libertarian" tag that is not visible in the pixels and is not used)
- Local file: `gifs/s3/OcrzJh9cKnyJG.gif`
- Why it fits: a warning beacon that pulses is the literal "the gate raised an alarm" picture, calm and wordless on white.
- Verification: HTTP 200, content-type image/gif, 98,783 bytes, 400x312, 10 fps, 12 frames, 1.2 s.
- What the frames show: a red dome beacon with a pink glow on a grey base, mounted on a dark angled plate on a post, with a grey horn speaker on the left. The horn shifts and blurs between frames while the beacon glow pulses on a 0.6 s cycle, on a white background. No text, logo or watermark seen in the viewed frames; OCR on 5 frames found only noise.
- Honesty note: the concept is "alarm", not "defect detection". The title is a plain "Siren", which matches the pixels. The pulse is gentle (no hard flashing), but the loop is short at 1.2 s.
- Alt text: A red warning beacon glows and pulses next to a grey horn speaker mounted on a post, with the horn shaking.

### 4. How the audit and the fixes were checked (section s4)

- Giphy page: https://giphy.com/gifs/SafranGroup-laser-factory-safran-uJt3dHkMseCkSx0cmQ
- Direct link: https://media4.giphy.com/media/uJt3dHkMseCkSx0cmQ/giphy.gif
- author_name: Safran (oEmbed title: "Laser Factory GIF by Safran - Find & Share on GIPHY")
- Local file: `gifs/s4/uJt3dHkMseCkSx0cmQ.gif`
- Why it fits: a robot arm carrying a camera and scanner head over a metal part is an independent instrument inspecting a finished piece, which maps to checking the audit and the fixes separately from whoever made them. Pale background, slow motion.
- Verification: HTTP 200, content-type image/gif, 2,508,362 bytes (2.39 MiB), 480x270, 15 fps, 98 frames, 6.54 s.
- What the frames show: frames 1 (0 s) and 2 (3.27 s): an articulated robot arm carries a boxed scanner head with two small fans, a camera and cables over a bladed metal impeller on a round stand, against a plain light grey background. The arm moves slightly between the two frames. No burned-in text seen; corner luma is stable across all 98 frames and no scene cut was detected. A small yellow warning triangle with a radiation-style symbol is printed on the equipment itself.
- Honesty note: the title says "Laser Factory", which fits the scanner head but is a brand-channel title (Safran is an aerospace company); no logo was seen in the viewed frames. The file is 2,508,362 bytes, marginally over the 2.5 MB preference (decimal) though under the 5 MB cap; it is the largest of the five. Only two frames were viewed.
- Alt text: A robot arm with a camera and scanner head moves slowly over a bladed metal turbine impeller on a pale background.

### 5. The provenance block I promised (section s6)

- Giphy page: https://giphy.com/gifs/notary-public-stamp-ibeDch0qflnPhb7CXm
- Direct link: https://media1.giphy.com/media/ibeDch0qflnPhb7CXm/giphy.gif
- author_name: National Notary Association (oEmbed title: "National Notary Association GIF - Find & Share on GIPHY")
- Local file: `gifs/s6/ibeDch0qflnPhb7CXm.gif`
- Why it fits: pressing a stamp onto a form is the literal picture of attaching a mark of origin to a document, which is what a provenance block does. Warm, light, live-action, so it differs in look from the four others.
- Verification: HTTP 200, content-type image/gif, 1,287,023 bytes, 480x270, 15 fps, 51 frames, 3.39 s.
- What the frames show: frame 1: a black self-inking stamp resting on a printed form on a light wood-grain table, a fingertip at the top edge. Frame 2 (about 1.7 s): two hands grip the stamp and press it down onto the form. No caption or channel overlay and no corner watermark seen in the 2 viewed frames.
- Honesty note: the stamp body carries a printed "trodat" wordmark and a seal emblem with the word ASSOCIATION; these are printed on the physical tool, not overlaid on the image, and were judged tolerable under the rule on tiny official marks. Only frames at 0 s and about 1.7 s were viewed; the rest of the loop was not looked at. Hands only, no identifiable face.
- Alt text: Two hands press a black self-inking stamp down onto a printed form on a table, then lift it away.

## Rejected alternates

Section s1 (tracehub-mcp)
- 8DzZM2z3lEwDJo38l4 (backup, accepted by the verifier, not chosen): a hand pushing a brass door latch toward its keeper beside a stained-glass panel; 976,528 bytes, 1.39 s loop, 480x270. Passes the rules for the 2 frames viewed, but the frames are dim and warm and look like film footage, the title ("Loop Satisfying GIF by Cian Ducrot") suggests a music-video clip, and the final frame was not viewed. Kept as the fallback if the barrier's length is a problem.
- LpjgVhaQ8U1IMwxHGT: does not show a clean close. The camera moves during the loop; frame 0 is a top-down view of the open gate leaves, frame 25 an oblique view of them shut, and later frames appear to swing a leaf open again. Could not confirm the loop ends closed; dark and murky. 1,106,890 bytes.
- vNi0GdJp1B5uw: 32,266,868 bytes (over the 5 MB cap), 782 frames, 54.7 s; small text-like marks at bottom-left of the viewed frame; a person at the wheel in a furnished room, not a calm wordless object.

Section s2 (cost-guard-mcp)
- uozBSFuz99USA (backup, accepted by the verifier, not chosen): a fuel gauge needle sweeping up from 0 toward 1; 3,583,522 bytes (over the 2.5 MB preference), 6.75 s, dark grainy handheld footage with a blurred tachometer needle, and the loop jumps from full back to empty; the camera moves, so an overlay could not be ruled out in the 133 frames not viewed.
- 1nHvfJdtdCPHa: a jittery audio VU meter (the dial prints "vu"); the needle swings back and forth about three times in 2.13 s and moves the wrong way for a rising total; fails "calm and precise" and the concept.
- jnJIFn9PX3uwwMLy3a: rejected for s2 on duration (9.7 s) and because it shows a barrier opening; it is the s1 pick.

Section s3 (what the live gate caught)
- 2LV8F7cqGunUA (backup, accepted by the verifier, not chosen): a pale 3D conveyor belt with small red and blue items; 1,882,740 bytes, 4.9 s. Calm and clean, but no fault detection or rejection was seen, so the concept fit is weak.
- RFrX1BTc2BidKAHZRH: not calm; mean luma swings from about 8 to about 195 and there are about 10 hard cuts between 3.67 s and 5.6 s (photosensitivity risk); later frames were not checked for a vendor mark.
- e5KPk6KIxlgbGQyZiq: near-black image (mean luma 6 to 20) with a small amber strobe bar, heavy on a light article page, strobe-like luma jumps; a vendor product clip.

Section s4 (how it was checked)
- rEAUdoYE5bGY4EN3Tp (backup, accepted by the verifier, not chosen): a fixed code reader with two green lights beside a conveyor carrying a labelled bottle and a box; 1,041,363 bytes, 5.07 s. Dark CGI product clip, only a loose fit for inspection.
- 9fXloDdKyXScKQLHLx (accepted by the verifier, ranked third): a person with a lit torch inside a large ribbed metal structure in a dim factory; 3,781,196 bytes (over the preference), nearly static, dark.
- hlaqAW0tYHZ5QOYYSL: blurry blue macro of a circuit board; no probe, no inspector, no checking action; 3,272,838 bytes.

Section s6 (provenance)
- l1KVcMHxSH2AUQr96: the two viewed frames were identical, dark blurry black-and-white shots of a hand on papers, with no stamp visible; 2,674,400 bytes; archival footage.
- hrG5zCqWx4yTdvzsyU: visible ImpressArt brand mark ("IA" monogram on the disc and a branded tray) and jewellery crafting, off-concept; 2,291,775 bytes.
- OqHIq2F69D706RpDpa: neither viewed frame showed a document or an imprint, only a hand holding a dark rectangular stamp; the final imprint text (reported by the scout as burned-in) was not viewed, so it is unverified.

## Also considered

- Section s5, "What is still unproven": dropped as the weakest section. Its best candidate 7BB1UpQKNleM0 (https://giphy.com/gifs/doing-puzzle-jigsaw-7BB1UpQKNleM0, author GIPHY, oEmbed title "Puzzle Doing GIF - Find & Share on GIPHY") was accepted by its verifier (HTTP 200, image/gif, 1,211,434 bytes, 487x274, 10 fps, 24 frames, 2.4 s; an overhead jigsaw in progress with loose pieces on an orange table). It was not selected because the puzzle box in frame 1 carries incidental printed text ("500 PIECES" and a brand line), it shows a puzzle being assembled rather than an honest gap, and a GIF in a section about open uncertainty can read as flippant. If the user wants a sixth GIF, this is the one to use; the other candidates were jds5Lfam0b8WjFeF7l (battery fill, 19,811 bytes, ends full so reads as "complete"), 4K1Nalbz0cVc5HRl1g (rejected: 9.1 s, 2.68 MB, Chinese-character banners) and UPPSnAXzSc3rY7jN85 (rejected: surreal train carriages, pillarboxed).
- Look variety across the five: two white-background 3D renders (barrier, beacon), one dark-ish live-action instrument close-up (odometer), one pale-grey robotics shot (impeller scan) and one warm live-action hand shot (stamp). No two share a subject; only the odometer is dark.
- None of the Giphy ids on the banned list was used.


## Placement and status (added 2026-10-31, 23:47 IST)

Embedded as a single markdown image line with a literal alt text and no caption, as its own paragraph at the END of the section, in the primary article, the Dev.to tracking file, the Substack file and the Medium file (identical lines in all four):

| After the section | Image id | Alt text |
|---|---|---|
| tracehub-mcp: what to set | jnJIFn9PX3uwwMLy3a (barrier arm) | A grey barrier post with a red-and-white striped arm that lifts, holds, then lowers back to horizontal on a white background. |
| cost-guard-mcp: what to set | YhtiUrWWtpe7QpinHZ (odometer) | Car dashboard close-up: the digital odometer digits count rapidly upward beneath a speedometer dial. |
| What the live gate caught in cost-guard 0.6.0 | OcrzJh9cKnyJG (warning beacon) | A red warning beacon glows and pulses next to a grey horn speaker mounted on a post, with the horn shaking. |
| How the audit and the fixes were checked | uJt3dHkMseCkSx0cmQ (robot arm scanning an impeller) | A robot arm with a camera and scanner head moves slowly over a bladed metal turbine impeller on a pale background. |
| The provenance block I promised (before the closing ask) | ibeDch0qflnPhb7CXm (stamp) | Two hands press a black self-inking stamp down onto a printed form on a table, then lift it away. |

Not used: "What is still unproven". A GIF on a section about open uncertainty reads as flippant.

Notes for the owner:
- The barrier clip is 9.7 s because it holds the closed frame for 2.0 s and the raised frame for 5.1 s. It is 125,665 bytes, so the length costs nothing in page weight.
- The robot-arm clip is 2.5 MB, the heaviest of the five; the total is 5.09 MB (about 4.86 MiB).
- The Giphy page for the beacon has an unrelated tag in its slug (libertarian). The frames show a plain beacon and horn with no text, which decides it.
- The stamp tool carries a small printed "trodat" wordmark on its body. It is part of the physical object, not an overlay.
- Live on Dev.to since the edit at 2026-10-31T18:16:39Z (post id 4954041, https://dev.to/sai_ram_0000/upgrading-tracehub-mcp-013-and-cost-guard-mcp-06-the-defaults-i-changed-and-what-to-set-39bb). The edit sent only the body, so the title, tags, canonical URL and publish time were unchanged. Substack and Medium were not posted, so their files already carry the images.
