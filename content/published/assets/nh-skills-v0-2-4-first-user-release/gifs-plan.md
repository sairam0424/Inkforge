# GIF plan: nh-skills v0.2.4 article, nh-chaos-monkey (selected 2026-11-25)

Four Giphy loops, one at the end of four sections, each embedded as a single markdown image line with a literal alt text and no caption. Total size of the four files: 5,639,797 bytes (5.64 MB, 5.38 MiB): 3,397,928 + 1,315,443 + 65,104 + 861,322. No GIF sits in "Install" or in "What was measured and what was not": the first is steps and commands, the second is the evidence, and a picture next to a number or a claim would only decorate it.

All four are stock illustrations. None shows nh-chaos-monkey, and the alt text says only what is on screen.

## Verification

Public endpoints and local tools only (no API key). Two search rounds: round one covered four slots (19 agents), round two re-searched the two slots that had no usable candidate (10 agents). Each candidate was verified by its own agent: direct media URL headers, the keyless Giphy oEmbed (author and title), `ffprobe` for size, frame rate, frame count and duration, frames extracted with `ffmpeg` and viewed, `tesseract` for text, and a per-frame brightness check for flashing. I then viewed contact sheets of the extracted frames for every pick and re-ran the header check on the four direct URLs: each returned HTTP 200, `content-type: image/gif` and the byte count below. Where a Giphy title and the frames disagree, the frames decide: each "What the frames show" line is written from the frames. Giphy serves `x-robots-tag: noai, noimageai` on these media files, so the article links the files and does not rehost them.

Rejection rules: not HTTP 200 image/gif, over 4 MB, readable text, logo or watermark, a recognisable face, flashing, a reaction meme or joke, anything suggesting a guarantee of safety.

Looked at and not used: a plastic-strip tensile test (`jPADUdzLMOEEzBMY3s`, 4.1 MB, over the cap), a thin strip snapping in a testing machine (`Gx7i4MrOZTmE4MvJKL`, almost still until its last frame), a fast clock time-lapse (`qk1lNVIlRgFGAXti93`, 3 hours in 7.5 s with a blurred second hand, so not calm), a pressure gauge whose needle barely moves (`7VIcGwvPFi8MrKgeQj`, not about time or cost), a pegboard of tools (`21RuDL8npBWGafpfi4`, no cleanup action).

### 1. How a run works

- Giphy page: https://giphy.com/gifs/giatec-breaking-explode-3ov9jHhVmhvNAj26Dm
- Direct link: https://media0.giphy.com/media/3ov9jHhVmhvNAj26Dm/giphy.gif
- author_name (oEmbed title): Giatec Scientific ("Concrete Explode GIF by Giatec Scientific - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 3,397,928 bytes (3.24 MiB); 480x320; 15 fps; 60 frames; 3.99 s. Per-frame mean brightness flat at about 116 until 2.2 s, then one rise to about 135 when the dust cloud appears, then a slow decay; no repeated alternation. Tesseract found no text on frames 1, 8 and 12.
- What the frames show: fixed camera, real lab footage, no people or hands. A grey concrete cylinder with faint blue hand-drawn marks stands upright between a steel platen above and a yellow-painted steel base below. For about two seconds almost nothing moves. Then the cylinder bursts into a cloud of dust and flying fragments, and the dust settles to leave a heap of broken grey concrete with small stones visible in the cut faces.
- Honesty note: a concrete cylinder, not a metal bar or beam, and it fails by shattering suddenly. The first two seconds look almost static, so the build-up of load is not visible, and there is no gauge or force reading. The loop restarts with a hard cut from the rubble back to the intact cylinder. The uploader is a concrete-testing company, but nothing on screen names a brand or a test method. It shows a test to failure, not the loop's confirm-and-fix steps. At 3.4 MB it is the largest of the four.
- Alt text: A gray concrete cylinder stands under a steel press, then bursts into a dust cloud and falls apart into broken chunks.

### 2. Run it in a sandbox

- Giphy page: https://giphy.com/gifs/usnationalarchives-science-archivesgif-naid649442-TQFnBno49cL9k4dymy
- Direct link: https://media0.giphy.com/media/TQFnBno49cL9k4dymy/giphy.gif
- author_name (oEmbed title): U.S. National Archives ("Lab Chemistry GIF by U.S. National Archives - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 1,315,443 bytes (1.25 MiB); 472x360; 15 fps; 19 frames; 1.27 s. Mean brightness stays between 68.0 and 69.3 of 255 across all frames, no cut. Tesseract found no text on the frames checked.
- What the frames show: archival colour film, slightly grainy, fixed camera. A steel-framed glove box with a clear front panel. Behind the glass a person in a light-blue surgical cap, blue mask and white coat looks down at their work. Two heavy black rubber gloves reach in from the front; the left one moves toward a small metal funnel on a brass-coloured stand.
- Honesty note: a face is partly visible (eyes and brow above the mask, grainy archival film, an unnamed person), so the hands-only preference is not met; it is accepted because the face is masked and capped and the footage is public archive film. The film looks decades old, so it reads as a historical lab, not a software sandbox, and it shows containment hardware only: nothing about what is inside or any safety outcome. The section says the sandbox is what enforces the limits and that a prompt does not, so the picture sits after the probe paragraph, not after a safety claim. The clip is only 1.27 s and the left glove jumps slightly at the loop seam.
- Alt text: A technician in a blue cap and mask works through black gloves in a glass-fronted steel glove box.

### 3. Cost and time

- Giphy page: https://giphy.com/gifs/fjI4obbsgcvGNyg0F2
- Direct link: https://media0.giphy.com/media/fjI4obbsgcvGNyg0F2/giphy.gif
- author_name (oEmbed title): Pixelmotion4096 ("Timeglass GIF by Pixelmotion4096 - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 65,104 bytes (0.06 MiB); 240x480; 10 fps; 41 frames; 4.1 s. Mean brightness 194.4 to 198.7 of 255, largest step about 1.1; no flashing. Tesseract found no text on the frames checked.
- What the frames show: a flat-shaded illustration of a classic hourglass on a plain white background, fixed camera. Dark-red circular plates joined by two thin red posts, pale blue-white glass between them. Dark red sand runs from the top bulb through the neck into a growing mound in the bottom bulb until the top is nearly empty. No people, numbers, words, money symbols or logos.
- Honesty note: a stylised drawing, not a timer; the whole run takes about four seconds and the loop resets in a hard cut, so it reads as "run, reset, run". The sand is dark red, which can read as urgency, though it is not a warning sign. It says "time is passing" and nothing about cost or duration; the numbers in the section carry that. The tall 240x480 frame is narrow and looks soft if scaled. It is the smallest file.
- Alt text: A red-framed glass hourglass on a white background as dark red sand falls from the top bulb into the bottom bulb.

### 4. Cleanup and feedback

- Giphy page: https://giphy.com/gifs/shopoutofhand-LPwZuOv1KE5c51Wzkg
- Direct link: https://media0.giphy.com/media/LPwZuOv1KE5c51Wzkg/giphy.gif
- author_name (oEmbed title): Out of Hand ("Sweeping Up GIF by Out of Hand - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 861,322 bytes (0.82 MiB); 478x318; 15 fps; 50 frames; 3.34 s. Mean brightness 155 to 165 of 255 in small steps; no flashing. Tesseract found no text on the frames checked.
- What the frames show: fixed overhead camera on a plain pale pink-white surface. One hand holds a black dustpan tilted open; the other holds a wooden hand brush and sweeps loose pale-pink rose petals across the surface into the pan until it holds a heap. A few petals stay on the surface. Both hands are visible, a sleeve with a black heart pattern, no faces.
- Honesty note: the debris is rose petals on a plain tabletop, not crumbs or sawdust on a bench, so it has a soft decorative look that fits "calm and practical" only loosely. It shows the act of sweeping up, not deleting a worktree, branch or scratch directory; the section text carries that. The clip is 3.3 s, the sweep is not finished, and the loop jumps from a full pan back to scattered petals.
- Alt text: A wooden hand brush sweeps pink rose petals across a pale surface into a black dustpan held in the other hand.

## Placement

| Section | Giphy id | Alt text |
|---|---|---|
| How a run works | 3ov9jHhVmhvNAj26Dm | A gray concrete cylinder stands under a steel press, then bursts into a dust cloud and falls apart into broken chunks. |
| Run it in a sandbox | TQFnBno49cL9k4dymy | A technician in a blue cap and mask works through black gloves in a glass-fronted steel glove box. |
| Cost and time | fjI4obbsgcvGNyg0F2 | A red-framed glass hourglass on a white background as dark red sand falls from the top bulb into the bottom bulb. |
| Cleanup and feedback | LPwZuOv1KE5c51Wzkg | A wooden hand brush sweeps pink rose petals across a pale surface into a black dustpan held in the other hand. |

Each image sits on its own line at the end of its section, with no caption beneath it. To remove one, delete its image line from the article and from the Dev.to draft (id 5117242, edit with PUT /api/articles/5117242, never by re-running publish).
