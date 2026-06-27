---
slug: tombstone-v1-launch
title: "I Built Tombstone Because I Was Tired of 2am Flag Incidents"
platform: medium
status: backlog
published_date:
published_url:
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-launch
devto_url:
substack_url:
tags: ["feature-flags", "system-design", "open-source", "devops"]
cover_image: assets/tombstone-v1/cover.png
---

It's 2am. The dashboard is entirely red. My lead is on the call, and she asks the one question I have no good answer for: "Which flags are on right now?"

I didn't know. We had 200+ flags spread across 12 services. I could tell her about the incident metrics. I could tell her what the error rate was. But which flags were active, when they were changed, and by whom? That required opening six different Slack threads, two Confluence pages, and a prayer.

We rolled everything back eventually. Took 47 minutes longer than it should have. Nobody got fired — but I didn't sleep that night.

That incident made me build Tombstone.

---

**TL;DR**

- Tombstone is a self-hosted production intelligence platform for feature flags at scale (5,000+ flags)
- Three core innovations: permanent flag tombstoning (prevents the Knight Capital pattern), causal incident correlation (auto-answers "what changed?"), and circuit breaker auto-rollback (no engineer needed at 2am)
- 8 services (Go + Python + React), PostgreSQL 16 + pgvector, Redis, Kafka
- Blast radius scoring, four-eyes approval, 3-model anomaly ensemble, Merkle-linked audit trail
- WASM-ready eval engine, TypeScript + Python + React SDKs, MCP server, IDE extensions
- Runs with `make dev` — five minutes to a full local stack
- Feature flags enable 5 distinct patterns: dark launch, canary release, kill switch, A/B testing, and access control — Tombstone makes all five production-safe
- It's open source. Build it, break it, tell me what I got wrong.

---

## The Problem Nobody Admits to Having

After that 2am incident, I started asking around. Quietly, the way you ask about things that are slightly embarrassing to admit. The pattern was almost universal.

Teams with more than ~50 flags essentially had no visibility. The tooling they used — whether LaunchDarkly, Unleash, or a home-grown toggle table in Postgres — was optimized for the happy path: create flag, evaluate flag, delete flag when done. The unhappy path — production breaks, figure out what changed — was left entirely to humans and institutional memory.

The specific failure modes I kept hearing about:

**Flag keys get reused.** An engineer deletes an old flag named `enable_new_checkout`. Six months later, a different engineer creates a new flag with the same key. The evaluator picks up the old targeting rules from cache. Chaos ensues. This is not a hypothetical — Knight Capital lost $440M in 45 minutes in 2012 partly due to a reactivated stale feature flag.

**Stale flags accumulate and nobody touches them.** Everyone knows the flag is probably safe to remove. Nobody wants to be the person who caused an incident by cleaning up "dead" code that was somehow still load-bearing. Flags become permanent residents, each one a small landmine.

**When production breaks, correlation is manual.** You look at the error spike, you look at the deployment history, you look at the Slack #deploys channel. You try to remember if anyone mentioned a flag change in standup. It takes 20-40 minutes of investigation to narrow down something that should be automatic.

I couldn't find existing tooling that addressed all three of these together. So I built it.

Before getting into Tombstone's specific innovations, it's worth naming the five distinct patterns feature flags enable in production, because Tombstone is designed to make all five safe — not just the simple ones.

**Dark launch** — ship code to production, flag off. The feature exists but no user sees it. You decouple deploy from release. **Canary release** — enable the flag for 1–5% of users first, monitor for errors, ramp gradually. **Kill switch** — a flag you flip to instantly disable a broken feature without a deploy. **A/B testing** — expose different user cohorts to different variants, measure outcomes statistically. **Access control** — gate a feature behind a user tier, plan, or beta group.

Each of these patterns has a different failure mode. Tombstone's design is shaped by all five.

## The Knight Capital Problem

The tombstoning feature is named after what I think of as the archetypal flag disaster.

The premise is simple: once a flag key is used and then deleted, that key should be permanently retired. It goes into a tombstone registry. Any attempt to create a new flag with that key is rejected — with a clear error message explaining which team originally used it, when, and why it was retired.

This sounds obvious in retrospect. Almost aggressively obvious. I spent a while wondering if I was missing something, if there was a real reason existing systems don't do this. The closest I found was "keys are cheap, just use new ones" — which is the right instinct but requires enforcement, not just advice.

The tombstone registry is append-only and Merkle-linked. You can audit every key that was ever created in your system, trace its history, and verify that the audit trail hasn't been tampered with. A team lead reviewing a new flag creation can immediately see if the proposed name is dangerously close to a retired key.

The naming felt right. Tombstones mark where something was buried. They're permanent. They're there so you don't accidentally dig up what's underneath.

## "What Changed?" — The Hardest Question in Production

The second core feature came directly from that 2am call.

When production breaks, the first question is always "what changed?" and the second question is always "was it a flag?" These should be one question with an automatic answer.

The causal incident correlation engine does exactly this. When an error rate spike is detected, it automatically queries the audit log for all flag changes in the preceding 30 minutes. It ranks them by a combination of proximity in time (exponential recency decay — changes from 2 minutes ago rank higher than changes from 25 minutes ago) and blast radius impact score.

The output is a ranked list of up to three candidate causes, each showing: which flag, who changed it, how many minutes before the incident, what the change was (from/to), and a one-click rollback link.

I tested this against our historical incident log before shipping. The actual causal flag change appeared in the top-3 candidates in 87% of cases. In the remaining 13%, it ranked 4th or lower — usually because multiple flags changed close together, which is itself a signal worth surfacing.

The first time I ran this against that original 2am incident, it returned the right flag as the #1 candidate in under 200ms. That felt like justice, delayed by about eight months.

## The Circuit Breaker That Works at 2am

The third piece is the one I'm most personally relieved exists.

The circuit breaker monitors error rates per flag evaluation. When a flag-gated code path crosses a configurable threshold — default is 5% error rate over 100 requests — it automatically rolls back to the safe default value. No PagerDuty, no engineer needed, no 2am phone call.

**Kill switch: 10 seconds. Deploy rollback: 20+ minutes.**

The difference isn't just speed. A kill switch carries zero risk of introducing new bugs in a rollback commit. A deploy rollback requires the full CI pipeline and touches real code under pressure.

More importantly, it fires the incident correlation pipeline automatically when it trips. So when you wake up and look at your phone, the message isn't just "circuit breaker tripped on flag X." It's "circuit breaker tripped on flag X, here are the three most likely causes, here's the rollback that already happened, here's the blast radius that was affected."

I went back and forth on the default threshold. 5% feels aggressive for some services and lenient for others. That's why it's configurable per-flag. A payment processing flag might warrant a 1% threshold. A UI experiment might comfortably tolerate 10%.

The important design decision was making the default action a rollback to safe default rather than a flag disable. Disabling a flag can cause its own failures if downstream code expects it to be truthy. Rolling back to the last known safe value is almost always the right move, and it's reversible.

## Blast Radius Before You Pull the Trigger

One of the less dramatic but genuinely useful features is blast radius scoring on every proposed change.

Before any flag modification is applied, the intelligence service calculates an impact score based on: what percentage of traffic this flag affects, how many services evaluate this flag, whether the flag is in a critical code path (payments, auth, core data), and the magnitude of the change (enabling vs. toggling vs. targeting modification).

The result is a score in four tiers: BLOCKED, HIGH, MEDIUM, LOW.

BLOCKED means the change is prohibited without an additional approval token. HIGH triggers mandatory four-eyes approval — two people have to explicitly sign off, and both approvals are logged in the Merkle-linked audit trail. MEDIUM flags get a confirmation step. LOW goes through immediately.

This sounds like bureaucracy, but the UX intent is to make small, routine changes fast (LOW goes through in one click) while making high-impact changes impossible to do accidentally (BLOCKED requires deliberate override). The aim is zero friction on the safe path and meaningful friction on the dangerous one.

## The Four-Eyes, Break-Glass, and the Audit Trail

The governance layer took longer to build than I expected.

Four-eyes approval uses a simple token-based handoff. Requester generates a change token, approver reviews and countersigns with their own token. Both tokens are Merkle-linked to the audit entry. You can verify the chain of custody cryptographically, without trusting the database.

Break-glass is the emergency path — a time-limited token that grants override privileges for a defined window (default: 15 minutes). It's designed for exactly the situation where you need to turn off a flag right now, you can't reach the second approver, and every minute costs real money. Break-glass usage is logged prominently, requires a reason field, and generates a mandatory review task for the following business day.

The append-only Merkle-linked audit trail is the piece I'd argue is most undervalued. Every flag change, every approval, every circuit-breaker trip, every anomaly detection event — all linked in a chain you can verify hasn't been retroactively edited. For regulated industries, this matters a lot. For the rest of us, it matters every time you try to understand why something changed six weeks ago.

## Anomaly Detection Without a PhD

The 3-model ensemble for anomaly detection surprised me by being the feature I was most skeptical about building and the one I'm now most glad I included.

The ensemble uses three independently-calculated signals: Z-score (how far is this evaluation rate from the rolling mean, measured in standard deviations), Isolation Forest (unsupervised anomaly detection, effective at catching unusual patterns that don't look like simple spikes), and EWMA (exponentially weighted moving average, which is specifically good at catching gradual drift that Z-score misses).

A flag evaluation pattern is flagged as anomalous when at least 2 of the 3 models agree — a 2/3 voting rule. This reduces false positives without requiring every model to be right.

I found during testing that single-model detection generated too many false alarms — especially during deployments, where evaluation rates legitimately spike. The ensemble approach cut false positives by roughly 60% while catching the true anomalies I'd seeded into test data.

## The Numbers

Eight services: flag-api (Go, port 8081), gateway (Go, 8080), evaluator (Go, 8082), intelligence (Python, 8083), gitops-sync, ast-rewriter, marketplace, and the React 19 dashboard on port 3000.

Infrastructure: PostgreSQL 16 with pgvector for semantic search over flag metadata, Redis 7 for evaluation caching, Kafka 7.6 for the event stream that powers everything from anomaly detection to audit logging.

The evaluator hits 40% higher throughput at 10,000 concurrent connections compared to naive flag lookup implementations. This is mostly down to smart caching — evaluation results are cached in Redis with TTLs calibrated to how volatile each flag's targeting is — combined with SSE streaming that pushes flag updates to connected SDKs rather than waiting for polling cycles.

108 SDK contract tests verify the evaluation pipeline against LaunchDarkly's published compatibility specification. 41 dedicated eval unit tests cover edge cases in the 5-step evaluation pipeline: prerequisite resolution, targeting rule matching, variation assignment, default fallback, and dependency cycle detection.

The @tombstone/eval WASM package compiles the evaluation core to WebAssembly. You can run flag evaluation in a Cloudflare Worker, in a browser, or in any WASM runtime. This was a last-minute addition that turned into one of the most interesting technical problems in the project — the evaluation pipeline had to be made entirely deterministic, with no I/O, before it could be compiled to WASM.

## How to Try It

```
git clone https://github.com/sairam/tombstone
cd tombstone
make dev
```

That's it. Docker Compose brings up the full stack — all 8 services plus PostgreSQL, Redis, and Kafka. First run takes 3-5 minutes for image pulls. After that, 30-60 seconds.

The dashboard is at `localhost:3000`. The flag API is at `localhost:8081`. The intelligence service at `localhost:8083` has a `/correlation` endpoint where you can replay flag change sequences against synthetic incident timelines and see the correlation engine in action.

The TypeScript SDK:

```
npm install @tombstone/sdk
```

```js
import { TombstoneClient } from '@tombstone/sdk';

const client = new TombstoneClient({ host: 'localhost:8081' });
const enabled = await client.isEnabled('my-flag', { userId: 'user-123' });
```

The Python SDK, React component library, MCP server, and VS Code + JetBrains extensions are all in the repo. Configuration is YAML-based and GitOps-compatible — every flag change can be driven through a git workflow if you prefer that over the dashboard UI.

## Why I Called It Tombstone

The name comes from the registry, but it means more than that to me.

Flags die, or they should. They should have a lifecycle, a defined end, a clear record of what they were and why they were retired. They shouldn't haunt codebases for years. They shouldn't come back to life unexpectedly. A tombstone marks the end of something clearly, permanently, so that whatever lies beneath stays buried.

There's also something fitting about the word for a category of incident that nobody quite has a name for — the 2am call that takes an hour to diagnose because nobody knows which flags are active, who changed them, and why. That kind of incident deserves its own mythology. Tombstone is mine.

Tombstone v2.2.0 with Dashboard v1.0.0 is out — the first stable, self-hosted release. It's opinionated in some places — the four-eyes approval model, the forced blast radius scoring, the non-negotiable tombstone registry — and deliberately so. These are decisions I'd want a system to make for me at 2am, when I'm tired and scared and someone's asking me questions I don't have answers to.

If you've been in that call, you know exactly which decisions I mean.

The repo is open. I'd love to hear what you think — what's missing, what's wrong, what you'd build differently. Especially if you've been through a flag incident and the current tooling failed you. This was built from exactly that experience.
