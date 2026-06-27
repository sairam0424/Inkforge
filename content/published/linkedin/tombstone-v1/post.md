---
slug: tombstone-v1
title: "Tombstone v1.0 — LinkedIn Carousel"
platform: linkedin
status: live
published_date: 2026-06-27
published_url:
canonical_url:
carousel_slides: 15
format_note: "Carousel/PDF = 7.00% engagement (best on LinkedIn). Upload as PDF document post."
---

# Tombstone v1.0 — LinkedIn Carousel Slide Spec

## How to Post

1. Go to linkedin.com → Start a post
2. Click the **document icon** (not the image icon)
3. Upload `carousel.pdf` (14 slides, ~2.7MB)
4. Set document title: **Tombstone v1.0 — Production Intelligence for Feature Flags**
5. Paste caption from `post-caption.txt`
6. Click **Post**

---

# Slide Map

| Slide | Type | Headline | Body summary |
|-------|------|----------|--------------|
| 01 | Cover | Tombstone v1.0 | "Production intelligence for 5,000+ feature flags" |
| 02 | Hook | It was 2am | Personal on-call story |
| 03 | Problem | 200 flags. Zero owners. | Flag accumulation disaster |
| 04 | Warning | $440M in 45 minutes | Knight Capital — the canonical horror story |
| 05 | Innovation 1 | Tombstoning | Permanent key archival |
| 06 | Innovation 2 | What Changed? | Automatic incident correlation |
| 07 | Innovation 3 | Auto-Rollback | Circuit breaker — no engineer needed |
| 08 | Feature | Blast Radius Gate | BLOCKED / HIGH / MEDIUM / LOW |
| 09 | Stat | 8 services. 5,000+ flags. | Architecture overview |
| 10 | Deep Dive | The ML Layer | 3-model ensemble |
| 11 | Deep Dive | The SDK Layer | TypeScript + Python + Edge + WASM |
| 12 | Story | Why "Tombstone"? | Name origin |
| 13 | CTA | v1.0.0. Self-hosted. | Open source, everything local |
| 14 | slide-14.png | Lifecycle | Every flag has a lifecycle. Most teams stop at FULL ROLLOUT. |
| 15 | slide-15.png | USP | Every competitor asks the wrong question. |

---

# Slide-by-Slide Content

---

## Slide 01 — Cover

**Type:** Cover

**Headline:**
Tombstone v1.0

**Body:**
Production intelligence for 5,000+ feature flags.
Built after a 2am on-call incident.

**Subline (smaller):**
By Sairam Uggé

**Visual note:**
Deep charcoal background (#0f1117). Bold teal accent (#00d4aa) on "Tombstone". Tombstone/grave icon rendered in teal. Clean, ops-tool aesthetic — not startup-playful.

---

## Slide 02 — Hook (Personal Story)

**Type:** Story / Hook

**Headline:**
It was 2am. Everything was red.

**Body:**
My lead asked one question:

"Which flags are on right now?"

I had no idea.
Neither did anyone else.
That silence was the real incident.

**Visual note:**
Dark background. Red accent (#ef4444) on the dashboard stat numbers. Quote formatted in large italic type. Minimal — the emptiness should feel uncomfortable.

---

## Slide 03 — Problem

**Type:** Problem Statement

**Headline:**
200 flags. Zero owners. One incident.

**Body:**
Feature flags accumulate fast.

You add one for a safe rollout.
Then a hundred more.
No audit trail.
No expiry dates.
No way to know what's live.

When production breaks, you're debugging
a system nobody fully understands anymore.

**Visual note:**
Dark background. Amber accent (#f59e0b). Use a simple two-column list: "What you think" vs "What actually happens" — or just the text as written. Keep it raw.

---

## Slide 04 — The Knight Capital Warning

**Type:** Stat / Warning

**Headline:**
$440,000,000
in 45 minutes.

**Body:**
One feature flag.
Never properly archived.
Reused 8 years later by a new deployment.

Knight Capital, 2012.

The flag key was never deleted.
It was just forgotten.

**Visual note:**
Full-bleed dark background. "$440,000,000" in huge type (60–72px), red (#ef4444). "45 minutes" on the next line in amber. The rest in small body type. This is the slide people screenshot.

---

## Slide 05 — Innovation 1: Tombstoning

**Type:** Innovation / Feature

**Headline:**
Tombstoning: flags that can never come back.

**Body:**
When you retire a flag in Tombstone,
the key is permanently archived.

It cannot be re-registered.
It cannot be reassigned.
It cannot be reused — ever.

The Knight Capital failure mode,
closed by design.

**Subline:**
`TOMBSTONED` status is immutable.

**Visual note:**
Teal accent (#00d4aa). Show a tiny mock UI element or status badge: `TOMBSTONED | retired 2026-03-14 | key: dark_launch_v2 | LOCKED`. Monospaced font for the badge (JetBrains Mono). Rest in Inter.

---

## Slide 06 — Innovation 2: What Changed?

**Type:** Innovation / Feature

**Headline:**
What Changed?
Tombstone tells you automatically.

**Body:**
Production breaks at 3am.
You open the incident board.
Tombstone has already run the correlation.

30-minute window.
Exponential recency decay.
Top 3 flag changes ranked by suspicion score.
Each one has a one-click rollback link.

No Slack thread archaeology.
No spreadsheet of recent deploys.
Just: here are your suspects.

**Visual note:**
Amber accent (#f59e0b). Mock the output: three ranked items with scores, e.g. `1. dark_mode_v3 — score: 0.94 [ROLLBACK]`. JetBrains Mono for the mock output. Dramatic but readable.

---

## Slide 07 — Innovation 3: Circuit Breaker Auto-Rollback

**Type:** Innovation / Feature

**Headline:**
5% errors over 100 requests.
Rollback. Automatic.

**Body:**
When a flag is live and error rate spikes,
Tombstone's circuit breaker fires.

The flag rolls back.
The incident stops.
No engineer needed.
No PagerDuty escalation at 3am.

You wake up to: "Auto-rollback triggered — see report."

**Subline:**
Threshold configurable. Per-flag or global.

**Visual note:**
Red accent (#ef4444) for the "5% / 100 requests" threshold. Show a simple state machine: CLOSED → OPEN → HALF_OPEN in teal/red/amber. Clean, diagrammatic.

---

## Slide 08 — Blast Radius Gate

**Type:** Feature

**Headline:**
Before any change: blast radius computed.

**Body:**
Every flag change goes through a gate:

BLOCKED — cannot proceed, safety violation
HIGH — requires four-eyes approval
MEDIUM — change logged, monitoring active
LOW — auto-approved, proceed

Blast radius is scored from traffic exposure,
flag age, rollout %, and historical incident rate.

Four-eyes approval + break-glass for emergencies.

**Visual note:**
Four color-coded badges stacked vertically: BLOCKED (red), HIGH (amber), MEDIUM (yellow), LOW (teal/green). Clean pill UI style. Dark background.

---

## Slide 09 — Architecture Stat

**Type:** Stat / Architecture

**Headline:**
8 services.
5,000+ flags.
`make dev` to start everything.

**Body:**
flag-api — Go 1.22
gateway — Go 1.22
evaluator — Go 1.22
intelligence — Python 3.12
TypeScript SDK, React dashboard, CLI
PostgreSQL 16 + pgvector, Redis, Kafka

Docker Compose. One command.
Everything runs locally.

**Visual note:**
Teal accent. Show the service list in JetBrains Mono. `make dev` in a mock terminal block. Dark background with a subtle grid/dot texture to hint at architecture complexity.

---

## Slide 10 — The ML Layer

**Type:** Deep Dive

**Headline:**
The ML layer:
3 models vote. 2/3 wins.

**Body:**
Z-score anomaly detection.
Isolation Forest.
EWMA drift detector.

All three run on every flag change.
Majority vote determines the verdict.

Plus: a LinUCB rollout advisor
that learns from your production history
and recommends the next safe rollout %.

**Visual note:**
Amber accent (#f59e0b). Simple 3-node vote diagram: Z-score | Isolation Forest | EWMA → [2/3 VOTE] → VERDICT. Keep it visual, not text-heavy. JetBrains Mono for model names.

---

## Slide 11 — The SDK Ecosystem

**Type:** Feature / Ecosystem

**Headline:**
Use it anywhere.
Evaluate at the edge.

**Body:**
TypeScript SDK — Node.js and browser
Python SDK — async-first
React hooks — `useTombstone(flagKey)`
Edge runtime — Vercel/Cloudflare Workers
WASM — evaluate offline, no network call
MCP server — AI agents can query flag state
VS Code extension — flag status in your editor

**Visual note:**
Teal accent. Icon grid of platforms (TypeScript / Python / React / Edge / WASM / VS Code). 2×3 or 2×4 grid layout. Dark background.

---

## Slide 12 — Name Origin

**Type:** Story / Name

**Headline:**
Why "Tombstone"?

**Body:**
Knight Capital gave stale flags a bad ending.
No marker. No record. Just a ghost in the system.

Tombstone gives retired flags a proper resting place.

A permanent record.
A date of death.
A key that can never haunt production again.

Every flag that gets tombstoned gets a name, a history, and a grave.
That's the point.

**Visual note:**
Charcoal background, minimal. Subtle gravestone icon (simple geometric, not cartoonish) in teal. Text-focused slide. Slightly more poetic typesetting — generous line spacing.

---

## Slide 13 — CTA

**Type:** CTA / Close

**Headline:**
v1.0.0.
Self-hosted. Open source.
Everything runs locally.

**Body:**
`git clone`
`make dev`
Done.

No vendor lock-in.
No SaaS dependency.
No 2am incident where nobody knows what's live.

Full article with architecture deep-dive:
[ARTICLE_LINK]

**Visual note:**
Teal on dark. `make dev` in a large JetBrains Mono code block — this is the terminal moment. Keep it clean, confident. No fuss.

---

## Slide 14 — Flag Lifecycle

**Type:** Education / Lifecycle

**Headline:**
Every flag has a lifecycle.
Most teams stop here. ↓

**Body:**
DRAFT
→ ACTIVE (dark launch)
→ ROLLING OUT
→ FULL ROLLOUT  ← most teams stop
→ CLEANUP
→ TOMBSTONED ✓

The gap between FULL ROLLOUT and TOMBSTONED
is how Knight Capital happened.

**Visual note:**
Amber (#f59e0b) arrow/marker at FULL ROLLOUT warning. TOMBSTONED stage glows teal (#00d4aa). Vertical flow of stage pills. Clean, minimal.
