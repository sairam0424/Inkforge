# GIF plan: memory-arborist 0.1.2 article (selected 2026-11-20)

Five Giphy loops, one at the end of five sections, each embedded as a single markdown image line with a literal alt text and no caption. Total size of the five files: 8,064,882 bytes (8.06 MB, 7.69 MiB). Each file is under the 2.5 MB preference: 1,573,132 + 2,295,584 + 1,833,661 + 802,613 + 1,559,892.

## Verification

Public endpoints and local tools only (no API key). Each direct media URL returned HTTP 200 with `content-type: image/gif` and the byte count below; the keyless Giphy oEmbed gave the author name and title; `ffprobe` gave size, frame rate, frame count and duration; frames were extracted and viewed, and `tesseract` found only noise characters on every pick. Where a Giphy title and the frames disagree, the frames decide: each "What the frames show" line is written from the frames. Giphy serves `x-robots-tag: noai, noimageai` on its media files, so the article links the files and does not rehost them.

### 1. Auto memory and how it goes stale

- Giphy page: https://giphy.com/gifs/usnationalarchives-archives-archivesgif-naid12065-FovhbDkjBtYs5SxJyS
- Direct link: https://media0.giphy.com/media/FovhbDkjBtYs5SxJyS/giphy.gif
- author_name (oEmbed title): U.S. National Archives ("Box Shelve GIF by US National Archives - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 1,573,132 bytes; 480x362; 15 fps nominal (average 16.7 from variable frame delays); 52 frames; 3.47 s. Mean luma 57.2 to 78.1 of 255, largest step 4.05. Last-to-first PSNR 19.5 dB against 18.7 to 45.1 dB (mean 32.5) between neighbours.
- What the frames show: dark slate-grey archive storage boxes with ring-edged corners on a metal shelf in dim light. At the start one box stands at the right with a small white label. A box swings into view and a bare hand with a wristwatch and a white shirt cuff reaches in from the right and presses on its front. By the end two labelled boxes stand side by side.
- Honesty note: vintage film footage from the U.S. National Archives with an old-film colour cast. The two white box labels carry several lines of tiny print that cannot be read at 480 px (checked on a native-size frame and on 3x upscaled frames; tesseract returned only noise). That is a printed mark on a physical object, not a caption. It is a trimmed piece of film, not a seamless loop: the restart jumps from two boxes back to one. It shows storage growing, not paper ageing or labels peeling, so the caption has to carry the staleness point.
- Alt text: A hand presses a dark grey archive box onto a metal shelf beside another box.

### 2. One pass, step by step

- Giphy page: https://giphy.com/gifs/arg-xT5LMQcN29TwKWnDIk
- Direct link: https://media0.giphy.com/media/xT5LMQcN29TwKWnDIk/giphy.gif
- author_name (oEmbed title): Amanda Grant ("Bottling Line GIF by Amanda Grant - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 2,295,584 bytes (2.19 MiB); 480x270; 15 fps nominal (average 16.7 from variable delays); 30 frames; 1.99 s. Largest scene score 0.148 (no cut). Mean luma 84.4 to 86.9, largest step 1.41. Last-to-first PSNR 16.6 dB against 18.9 to 22.2 dB between neighbours.
- What the frames show: real footage, side-on, of a row of plain green glass bottles standing under a row of silver filling nozzles on a rotary bottling machine, in front of brushed steel with vertical reflections and a steel ledge along the bottom. The bottles drift sideways across the frame at a steady pace, with slight motion blur at the left edge. No people.
- Honesty note: it shows one station (the filler), not several stations in sequence, and there is no conveyor, sensor or camera, so it matches "process with stations" only loosely. It is photo-real footage, not a diagram. The motion is steady but brisk, so "calm" is in tone more than in speed. The loop seam is a small positional jump, not a cut. It is the largest of the five files at 2.2 MB.
- Alt text: Green glass bottles move in a row under silver filling nozzles on a bottling machine.

### 3. What the code enforces and what rests on you

- Giphy page: https://giphy.com/gifs/how-works-lock-QnwqzRz2FHtT2
- Direct link: https://media0.giphy.com/media/QnwqzRz2FHtT2/giphy.gif
- author_name (oEmbed title): GIPHY, no individual creator ("Lock Satisfying GIF - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 1,833,661 bytes (1.75 MiB); 640x360; 10 fps; 51 frames; 5.10 s. Largest scene score 0.020 (no cut). Mean luma 103.1 to 114.3, largest step 1.47. Last-to-first PSNR 20.3 dB against 24.0 to 36.6 dB (mean 27.4) between neighbours.
- What the frames show: a 3D render in soft warm light. A cut-away brass lock cylinder shows a row of spring pins. A plain metal key with a round hole in its head slides in from the left; the pins rise and level out as the key seats, and in the last frames the key and the cylinder core turn.
- Honesty note: It is a render, not footage. A lock can read as "secure", which the section says it is not (the hook is a seat belt, not a sandbox), so it sits after a technical paragraph, not after a safety claim. The key and cylinder carry no stamping visible in the frames or found by OCR. The restart jumps from the turned cylinder back to an empty one. The Giphy title says "Satisfying", which is only a category label.
- Alt text: A key slides into a cut-away brass lock, the spring pins line up, and the key turns the cylinder.

### 4. What broke on the way

- Giphy page: https://giphy.com/gifs/hY2reRurgUNekafQ45
- Direct link: https://media0.giphy.com/media/hY2reRurgUNekafQ45/giphy.gif
- author_name (oEmbed title): Meca24 ("Diy Tighten GIF by Meca24 - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 802,613 bytes (0.77 MiB); 480x480; 25 fps; 92 frames; 3.84 s. Largest scene score 0.034 (no cut). Largest luma step 0.26. Last-to-first PSNR 16.7 dB against 17.6 to 36.8 dB (mean 23.0) between neighbours.
- What the frames show: a flat vector-style grey open-end wrench and a small grey hex nut on a plain teal background that never changes colour. The wrench slides onto the nut, swings round to turn it, lifts off, swings back and fits over it again, then the loop repeats. At one point the wrench handle runs past the right edge of the picture.
- Honesty note: it is an illustration, not footage of hands, and it shows tightening, not mending something that broke. The wrench swings briskly and is clipped by the frame edge, so "calm" is moderate. The wrap-around has a small jump (the seam score is below every neighbouring pair). Tesseract found no words on the frames checked.
- Alt text: A grey wrench fits over a hex nut on a teal background, turns it, lifts off and fits again.

### 5. Try it

- Giphy page: https://giphy.com/gifs/perfectly-charger-fits-mvc9J2LujA3kc
- Direct link: https://media0.giphy.com/media/mvc9J2LujA3kc/giphy.gif
- author_name (oEmbed title): GIPHY, no individual creator ("Charger Satisfying GIF - Find & Share on GIPHY")
- Verification: HTTP/2 200, image/gif, 1,559,892 bytes (1.49 MiB); 320x320; 10 fps; 48 frames; 4.80 s. Largest scene score 0.055 (no cut). Mean luma 82.2 to 103.0, largest step 4.35 (a hand entering the frame, not a flash). Last-to-first PSNR 13.4 dB against 19.5 to 33.8 dB (mean 25.2) between neighbours.
- What the frames show: a black power adapter with a thick coil of black cord beside a speckled brass wall plate with two outlets, a small jack and two round metal connectors. A hand, fingers and palm only, comes in from the top right, a fingertip reaches toward the plate, then the hand presses the adapter into the lower outlet and withdraws. The last frames show the adapter seated flat against the plate.
- Honesty note: the Giphy title says "Satisfying" but the frames are plain and literal. The author is the generic GIPHY account, so there is no creator to credit by name. The footage is handheld and the plate drifts sideways during the clip. The loop does not close: the last frame (adapter seated) jumps back to the first (adapter held off the plate), the sharpest restart of the five. The hand is cropped at the top edge. Nothing on the plate is legible. It shows a plug, not a command or a screen.
- Alt text: A hand pushes a black power adapter into a brass wall plate until it sits flat.

## Placement

| Section | Giphy id | Alt text |
|---|---|---|
| Auto memory and how it goes stale | FovhbDkjBtYs5SxJyS | A hand presses a dark grey archive box onto a metal shelf beside another box. |
| One pass, step by step | xT5LMQcN29TwKWnDIk | Green glass bottles move in a row under silver filling nozzles on a bottling machine. |
| What the code enforces and what rests on you | QnwqzRz2FHtT2 | A key slides into a cut-away brass lock, the spring pins line up, and the key turns the cylinder. |
| What broke on the way | hY2reRurgUNekafQ45 | A grey wrench fits over a hex nut on a teal background, turns it, lifts off and fits again. |
| Remove it, and what to report | mvc9J2LujA3kc | A hand pushes a black power adapter into a brass wall plate until it sits flat. |
