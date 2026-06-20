---
slug: feature-flags-at-scale
title: "Feature Flags at Scale: The Complete Engineering Guide"
platform: substack
status: draft
published_date:
published_url:
canonical_url: https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system
article_path: content/articles/system-design/feature-flags-at-scale-distributed-control-system.md
reading_time: 15
word_count: ~4200
---

<!--
  PUBLISHING INSTRUCTIONS
  ========================
  1. Go to substack.com → New Post
  2. Switch editor to "Markdown" mode (top right dropdown)
  3. Copy ONLY the content between the START and END markers below
  4. Paste into the Substack editor body
  5. Set title separately in the Title field (do not include it in the body)
  6. Add subtitle in the Subtitle field
  7. Set cover image
-->

<!-- =========================================================
     SUBSTACK TITLE (enter in Title field, not article body)
     Feature Flags at Scale: The Complete Engineering Guide
     
     SUBTITLE (enter in Subtitle field)
     How Google, Meta, Netflix, and Uber treat feature flags as a distributed control plane — and why your system should too.
     ========================================================= -->

<!-- ==================== PASTE START ==================== -->

In 2012, Knight Capital lost $440 million in 45 minutes. The root cause: a feature flag that was never deleted.

Not a trading algorithm bug. Not a network outage. A stale flag reactivated during deployment, routing live orders through dormant code. The blast radius was irreversible.

That's your hook into why feature flags at scale are not a trivial problem — and why the engineers at Google, Meta, Netflix, and Uber have all independently arrived at the same architecture to solve it.

**TL;DR**

- Feature flags at scale are a **distributed control plane**, not config files
- User traffic must **never block on a remote flag service call** — local evaluation only
- **Push-based distribution** — pull creates thundering herds at scale
- Kill switches evaluate **before any targeting rule** — no user context dependency
- **Flag lifecycle enforcement** (expiry dates, owners, auto-cleanup) is a correctness property, not housekeeping
- The same architecture emerges independently at Google, Meta, Netflix, and Uber

---

### The Core Constraint That Drives Everything

One principle underlies every architectural decision in a mature flag system:

> **Never make user traffic depend on a remote flag service call.**

A synchronous RPC per flag evaluation injects 10–50ms of tail latency at p99. Netflix competes on streaming start times measured in hundreds of milliseconds. Meta serves billions of requests per second. A remote flag call is a non-starter — it couples your request path to the availability and latency of an external system.

The solution: local evaluation backed by an async synchronization layer. The flag state lives in-process, in memory, always fresh within a propagation window. Evaluation is a pure function — no I/O, no locks. Sub-millisecond.

IMAGE_PLACEHOLDER_TWO_PLANES: Architecture diagram — Control Plane (authoring → validation → config store) on left, Data Plane (SDK → local cache → evaluation) on right, connected by Distribution Service with a PUSH arrow.

---

### Two Planes, Two Contracts

The most important architectural insight: the control plane and the data plane have **opposite optimization targets**.

**Control Plane — slow, safe, strongly consistent**

The flag authoring path flows: UI → validation engine → strongly-consistent store → distribution service.

Validation checks: rule schema correctness, kill-switch constraints (no user-context dependency), mutual-exclusion guardrails, dependency graph validation.

Write latency of hundreds of milliseconds is acceptable. A misconfigured targeting rule crashing a canary population is not. This path is correctness-prioritized.

**Data Plane — fast, local, eventually consistent**

An embedded SDK in every service instance. In-memory snapshot of all flag configurations. Pure evaluation function: no network I/O, no locks on the hot path.

The consistency divergence is intentional. Meta's Gatekeeper operates with a 30–60 second propagation window. That staleness is acceptable — it's the unavoidable cost of local evaluation. Staleness-during-outage is not acceptable, which is why every SDK maintains a snapshot that survives network partitions.

**Why push, not pull?**

> Flip a high-traffic flag and 10,000 service instances' poll timers fire within the same jitter window. Coordinated spike on your config store — a thundering herd — at exactly the moment the system is under change-induced stress.

Push-based distribution maintains persistent connections to subscribers and fans out diffs on change. Envoy xDS and Kubernetes controllers use the identical pattern. Convergence in seconds — not polling intervals.

---

### The 5 Mistakes Engineers Make With Feature Flags

> **Production pattern:** These failure modes appear repeatedly across organizations of every size.

**1. Treating flags as simple config**

When a flag returns `{"timeout_ms": 3000, "retry_count": 2}` you're no longer doing feature gating — you're doing remote configuration. The boundary between flags and dynamic config dissolves. Organizations that ignore this end up with correctness bugs that only surface during partial rollouts.

**2. Non-deterministic percentage rollouts**

Percentage rollouts must use `hash(user_id) % 100` — not `random()`. At a fintech, two SDK versions in parallel deployment used different hash seeds. Same `user_id`, different buckets, alternating UI states on page refresh. Three days to diagnose. One-line fix. Uninterpretable A/B data for the entire rollout window.

**3. Conflating fail-open and fail-closed**

These are per-flag contracts, not a system-wide default. A kill switch for fraud detection should fail-closed. A UI experiment should fail-open. Conflating them produces either unnecessary outages or security incidents. The policy belongs in the flag definition, validated at creation time.

**4. No lifecycle enforcement**

Ten independent flags: 1,024 possible system states. Fifty flags: more states than atoms in the observable universe. Atlassian hit 4,000+ flags and found their on-call rotation couldn't reason about which ones were safe to flip during active incidents. Their fix: mandatory 90-day expiry, automated cleanup tickets.

**5. Missing flag exposure tracking**

Every evaluation should emit a structured event: `{flag_key, variant, user_id, context_hash, sdk_version, timestamp}`. This isn't optional logging — it's the foundational data primitive for experiment analysis. Google's exposure events feed directly into ABACUS, their experimentation platform. Without them, causal inference between flag variants and user outcomes is impossible.

---

### Kill Switches: The Pattern That Makes Them Work

Kill switches are evaluated *before any targeting predicate* — before user lookups, before region checks, before anything that requires a valid context object.

IMAGE_PLACEHOLDER_KILL_SWITCH: Flowchart — Request → Kill switch check → (match: return override, STOP) → Targeting rules → Rollout bucket → Default.

**Uber's surge pricing kill switch** demonstrates the pattern under real production conditions.

During a major incident, on-call engineers disabled surge pricing globally in under 30 seconds across all regions. That response window requires three things simultaneously:

- No network call per evaluation — state is in local process cache
- Push-based propagation — all instances notified within seconds of the flip
- Kill switch check is first — before any business logic executes

Miss any one of those three, and 30 seconds becomes minutes becomes executive escalation.

---

### Flag Debt: The Slow-Moving Disaster

> Knight Capital's $440M loss in 2012 remains the canonical cautionary tale for flag lifecycle failure. The SMARS "Power Peg" flag was deprecated but never cleaned up. A new deployment accidentally reactivated it.

The combinatorial state explosion is the less dramatic but equally dangerous version of this.

| Flag count | Possible system states |
|---|---|
| 10 | 1,024 |
| 20 | 1,048,576 |
| 50 | ~1 quadrillion |

You cannot test that. You cannot reason about it at 2am.

IMAGE_PLACEHOLDER_FLAG_DEBT: Graph showing flag count growing over time with a red threshold line labeled "on-call reasoning breaks down." Second line showing flags deleted after lifecycle enforcement kicks in.

Every flag needs three things enforced by automation:

- **Owner** — team, not individual (people leave)
- **Expiry date** — or explicit waiver with documented justification
- **Cleanup automation** — PR opened automatically when flag hits 100% stable rollout

Atlassian's rule: if the flag has been at 100% for 30 days with no incidents, it's dead code. Automation opens the PR. Engineers approve or extend with justification. The flag doesn't survive on inertia.

---

### Big Tech Patterns Side-by-Side

| Company | System | Key Architecture Decision |
|---|---|---|
| Netflix | Trebuchet | Gateway-layer evaluation — kill switches fire before app logic |
| Meta | Gatekeeper | Auto-ramp with metric feedback — 0→100% overnight, zero engineer involvement |
| Google | Internal | Exposure events → ABACUS experimentation — every evaluation tracked |
| Uber | Flipr | Region-aware kill switches — 30-second global response SLA |

The convergence is striking. These teams never coordinated. They arrived at local evaluation, push-based distribution, kill-switch priority, and lifecycle enforcement independently — because those are the only design choices that survive at scale.

---

### What You Should Build

The architecture is settled. The principles are battle-tested. What remains is enforcement.

**Non-negotiables:**

- Local evaluation — no RPC on request path
- Push-based distribution — not pull
- Per-flag fail-open / fail-closed policy declared at creation
- Expiry dates enforced by automation
- Exposure tracking as structured events from day one

**The test:** Can your on-call engineer disable a production feature globally in under 60 seconds without touching code or config files? If not, your kill switch isn't a kill switch.

---

*Originally published at [sairam.dev](https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system)*

*If this was useful, forward it to one engineer on your team who owns feature flags infrastructure — or who should.*

<!-- ==================== PASTE END ==================== -->
