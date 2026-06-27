# Tombstone v1 — GIF Asset Plan

Article: "I Built Tombstone After a 2am On-Call Incident Involving Feature Flags"
Platform targets: Medium, Dev.to, Hashnode, Substack

---

## GIF 1 — Hero / Article Open (emotional hook)

**Concept:** The gut-punch feeling of being woken up at 2am by a production alert. A red
dashboard flooding with alerts, or someone jolted awake by a phone buzzing — the visceral
panic of an on-call incident before you know what broke or why.

**Giphy search keywords:**
- `2am alert work tired`
- `production down monitoring dashboard red`
- `on call engineer panic laptop`
- `server down alert blinking red`
- `tired developer alarm night`

**Article placement:** Top of article, immediately after the opening hook paragraph
("It was 2:17am. My phone..."). Before any technical explanation.

**Caption text (Dev.to/Substack):**
> Every on-call engineer knows this feeling. Tombstone was born from this exact moment.

---

## GIF 2 — Tombstoning Concept (permanent flag archival)

**Concept:** Something being permanently buried, archived, or put to rest — a flag key
that can never be reused. A gravestone appearing, a door closing forever, a file being
locked away, or a dramatic "ARCHIVED" stamp landing on a document.

**Giphy search keywords:**
- `tombstone graveyard RIP`
- `archived permanently closed sealed`
- `locked vault closed forever`
- `stamp archived document`
- `rip grave buried`

**Article placement:** In the "Tombstoning" feature section, before the code example
showing how a key gets permanently archived.

**Caption text (Dev.to/Substack):**
> Tombstoned flag keys are permanently archived — the system refuses to re-create them,
> preventing the Knight Capital mistake of recycling a dangerous key.

---

## GIF 3 — Circuit Breaker Auto-Rollback (kill switch trips)

**Concept:** An automatic emergency stop — a circuit breaker physically tripping, a big
red button being slammed, a switch flipping to OFF, or a system going from green to red
with an automated response. The key feeling is "the system caught it and stopped it
automatically, without human intervention."

**Giphy search keywords:**
- `circuit breaker switch flip off`
- `emergency stop button red`
- `automatic rollback undo`
- `kill switch activated`
- `abort mission emergency`

**Article placement:** In the "Circuit Breaker Auto-Rollback" section, after the sentence
explaining that Tombstone rolls back automatically when the error rate crosses threshold.

**Caption text (Dev.to/Substack):**
> When error rates spike past threshold, Tombstone trips the circuit breaker and rolls back
> automatically — no human required at 2am.

---

## GIF 4 — Blast Radius Scoring (explosion / impact assessment)

**Concept:** An explosion radiating outward from a point, or a ripple effect showing how
far the impact of a change spreads. Should feel like "impact assessment" or "how much
of the system does this touch?" — a heat map expanding, concentric rings, or a shockwave.

**Giphy search keywords:**
- `explosion radius blast wave`
- `ripple effect impact`
- `shockwave expanding rings`
- `impact radius map`
- `nuclear explosion shockwave`

**Article placement:** In the "Blast Radius Gate" section, before the explanation of
how the scoring algorithm works (traffic %, criticality weight, rollout speed).

**Caption text (Dev.to/Substack):**
> Before a flag touches production, Tombstone scores its blast radius: how many users are
> affected, how critical the service is, and how fast you're rolling out.

---

## GIF 5 — Incident Correlation / "What Changed?" (detective work)

**Concept:** A detective piecing together clues, a timeline revealing a correlation, or
a "eureka" moment when the cause of an incident becomes clear. Could be a magnifying glass
zooming in, a timeline visualization snapping into place, or a detective at a whiteboard
connecting evidence with string.

**Giphy search keywords:**
- `detective clues investigation board`
- `sherlock holmes magnifying glass`
- `mystery solved aha moment`
- `timeline correlation finding`
- `conspiracy theory board connecting`

**Article placement:** In the "Causal Incident Correlation" / "What Changed?" section,
before the screenshot showing the correlation timeline UI.

**Caption text (Dev.to/Substack):**
> "What Changed?" scans flag mutation history against incident timelines and surfaces the
> most likely causal flags — the answer your on-call engineer is desperately searching for.

---

## Notes for Giphy selection

- Prefer looping GIFs (seamless loop)
- Aim for under 3MB per GIF for page load performance
- Prefer GIFs with transparent or dark backgrounds to match the article's ops/dark tone
- Avoid GIFs with text overlays that contradict the caption
- For Medium: paste the raw Giphy URL on its own line in the editor (auto-embeds)
- For Dev.to: use `![alt text](giphy_url)` markdown syntax
- For Hashnode: use the built-in media embed

## Giphy embed format reminder

Giphy direct GIF URL format: `https://media.giphy.com/media/[ID]/giphy.gif`
Giphy page URL format: `https://giphy.com/gifs/[slug]-[ID]`

For Medium, paste the giphy.com page URL on its own line — Medium auto-embeds it.
