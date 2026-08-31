# Tombstone v1.3–v1.4 (Dev.to) — GIF Asset Plan

Article: "Tombstone v1.3-v1.4: Resilience Was the Easy Layer"
Platform target: Dev.to (native markdown, embed via `![alt text](giphy_url)` on its own line)

---

## GIF 1 — Hero / Article Open (removing the safety net, CI goes red)

**Concept:** Pulling something out and immediately triggering a cascade of alarms/red lights — a Jenga-style "pull the wrong piece" moment, or a domino chain reaction of failures.

**Giphy search keywords:**
- `jenga pulling piece everything falls`
- `domino effect chain reaction`
- `alarm going off red lights everywhere`
- `pull the lever everything breaks`
- `removing piece cascade failure`

**Article placement:** Top of article, immediately after the opening paragraph about removing four `|| true` statements and watching CI go red four different ways.

**Caption text:**
> Pull one safety net out and four different things immediately fall through it at once.

---

## GIF 2 — Helm Chart Gap (half-finished, missing pieces)

**Concept:** Something that's clearly incomplete — half a puzzle assembled, a building with scaffolding on only part of it, an outline waiting to be filled in.

**Giphy search keywords:**
- `half finished puzzle missing pieces`
- `incomplete building under construction`
- `unfinished work in progress`
- `missing puzzle piece gap`
- `half done half empty`

**Article placement:** In "The Helm chart was only deploying two of five services," right after the sentence noting the chart only had Deployment templates for two of five services.

**Caption text:**
> Two of five services deployed by default — and it was written down as a "Known Gap," not hidden.

---

## GIF 3 — SDK Parity (two answers, same question)

**Concept:** Two people or systems giving different answers to the exact same question — a split-screen disagreement, or a "wait, that's not what I got" double-take.

**Giphy search keywords:**
- `two different answers confused`
- `wait thats not what i got`
- `disagreement double take confused`
- `split screen different results`
- `same question different answer`

**Article placement:** In "SDK parity is a correctness bug, not a feature request," right after the sentence about a flag evaluating to `true` in Node and silently falling through to default in Python for the same input.

**Caption text:**
> Same flag, same user, two SDKs, two different answers — that's not a targeting bug, that's a parity bug.

---

## GIF 4 — Redoc / API Docs (finally visible)

**Concept:** A light turning on in a dark room, a curtain being pulled back to reveal something, or a spotlight suddenly illuminating what was there all along.

**Giphy search keywords:**
- `light turning on dark room reveal`
- `curtain pulled back reveal`
- `spotlight illuminating reveal`
- `finally visible lights on`
- `unveiling reveal spotlight`

**Article placement:** In "Making the API impossible to not find," right after the sentence noting the OpenAPI spec existed but nobody was looking at it because there was nowhere convenient to look.

**Caption text:**
> The API surface was always documented. It just didn't have a door anyone would think to open.

---

## GIF 5 — GitOps Ordering (dominoes falling in the right order, on purpose)

**Concept:** A precise, deliberate sequence happening correctly — dominoes falling in a controlled chain, gears meshing in sync, or a relay handoff executed cleanly.

**Giphy search keywords:**
- `dominoes falling perfect sequence`
- `gears turning in sync mechanism`
- `relay race perfect handoff`
- `clockwork precise timing`
- `synchronized sequence perfect`

**Article placement:** In "GitOps: ordering discipline, then a second controller on purpose," right after the paragraph explaining `dependsOn` + `healthChecks` guaranteeing CRDs exist before the CRs that need them.

**Caption text:**
> `dependsOn` alone just waits for "applied." Pairing it with `healthChecks` is what actually waits for "ready."

---

## GIF 6 — Blast Radius as a Deployment Gate (the same guard, one level up)

**Concept:** A checkpoint or gate that stops something from passing until it's verified safe — a security checkpoint, a bouncer checking IDs, or a traffic gate that only lifts when the light turns green.

**Giphy search keywords:**
- `checkpoint gate stopping traffic`
- `bouncer checking id door`
- `security gate access denied`
- `traffic light gate lifting`
- `security checkpoint pass`

**Article placement:** In "Blast radius, but as a deployment gate now," right after the sentence about the canary step promoting only on LOW/MEDIUM and aborting on HIGH/BLOCKED.

**Caption text:**
> The same blast-radius score that used to gate a flag rollout now gates the Kubernetes deployment itself.

---

## GIF 7 — CTA / Close (the honest caveat, still in progress)

**Concept:** Something that's clearly ready and waiting, but not yet deployed to its final destination — a rocket fueled and on the pad but not yet launched, or a package packed and labeled but still sitting by the door.

**Giphy search keywords:**
- `rocket ready launch pad waiting`
- `packed and ready waiting`
- `standing by ready to go`
- `almost there not quite`
- `ready and waiting patiently`

**Article placement:** Near the end, in "Supply chain and the honest caveat," right after the sentence noting production OKE is still pending an Oracle Cloud signup.

**Caption text:**
> Validated on local k3d. The operator chart is already published and waiting. The cluster itself is the one piece still pending.

---

## Notes for Giphy selection

- Prefer looping GIFs (seamless loop), under 3MB for Dev.to page load performance
- Dev.to markdown: `![alt text](https://media.giphy.com/media/[ID]/giphy.gif)` on its own line
- Prefer dark-background or transparent GIFs matching Tombstone's ops/incident tone (see cover-spec.md palette: charcoal `#0d1117`, red `#e53e3e`, green `#38a169`) — avoid bright, cartoonish options
- Avoid GIFs with text overlays that would clash with the caption text above
- Giphy direct GIF URL format: `https://media.giphy.com/media/[ID]/giphy.gif`
