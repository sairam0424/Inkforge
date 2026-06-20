---
slug: feature-flags-at-scale
title: "Feature Flags at Scale: The Complete Engineering Guide"
platform: hashnode
status: draft
published_date:
published_url:
canonical_url: https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system
article_path: content/articles/system-design/feature-flags-at-scale-distributed-control-system.md
hashnode_tags: [Feature Flags, System Design, Software Architecture, DevOps, Backend Development]
series: System Design at Scale
reading_time: 15
notes: "Hashnode public API decommissioned June 2026. Publish manually at hashnode.com. Set originalArticleURL in story settings."
---

# Hashnode Manual Publish Reference

**Publish at:** https://hashnode.com/new
**originalArticleURL:** https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system
**Series:** System Design at Scale
**Cover:** Upload cover-medium.png (1400×787px) — description: dark background, control plane / data plane split diagram, #38e1ff accent

---

## Article Body (Hashnode-ready — full markdown supported)

### Subtitle
*How Google, Meta, Netflix, and Uber treat feature flags as a distributed control plane — and why your system should too.*

---

In 2012, Knight Capital lost **$440 million in 45 minutes** because of a feature flag that was never deleted.

The SMARS "Power Peg" flag had been deprecated months earlier. No one cleaned it up. A new deployment reactivated it, routing live orders through dormant trading code. By the time the team understood what was happening, the losses were irreversible.

That incident is the canonical argument for treating feature flags as **first-class engineering infrastructure** — not config files, not booleans, but a distributed control plane for production behavior.

---

## The Core Constraint

One principle drives every architectural decision in a mature flag system:

> 💡 **Never make user traffic depend on a remote flag service call.**

A synchronous RPC per flag evaluation adds 10–50ms at p99 tail latency. At the request volumes Google, Meta, Netflix, and Uber operate at, that's a non-starter — it couples your request path to the availability and latency of an external system.

The solution is **local evaluation backed by async synchronization**: flag state lives in-process, in memory, always fresh within a propagation window. Evaluation is a pure function — no I/O, no locks, sub-millisecond.

---

## Non-Functional Requirements

Before architecting, the NFR table is where the real decisions live:

| Dimension | Requirement | Implication |
|---|---|---|
| Evaluation latency | Sub-millisecond P99 | Local evaluation only — no RPC |
| Availability | 99.99%+ | SDK survives flag service outage with cached snapshot |
| Consistency (control) | Strong | Spanner / Postgres for authoring writes |
| Consistency (data) | Eventual (30–60s window) | Intentional — local evaluation trades consistency for speed |
| Scale | Millions of evaluations/sec | In-process evaluation, O(1) key lookup |
| Safety | Per-flag fail policy | Fail-closed vs fail-open declared at creation, not at runtime |
| Observability | Exposure tracking | Structured event per evaluation — foundation for experiment analysis |

The consistency divergence between control and data planes is the architectural insight most designs get wrong by trying to make it uniform.

---

## Two-Plane Architecture

IMAGE_PLACEHOLDER_ARCHITECTURE: Full architecture diagram. Left side: Control Plane (Flag Authoring UI → Validation Engine → Strongly-Consistent Store → Distribution Service). Right side: Data Plane (SDK → Local Cache → Evaluation Engine → Result). Center: Distribution Service pushing diffs with persistent connections. Labels: "write-optimized, correctness-prioritized" on control side; "read-optimized, latency-prioritized" on data side.

### Control Plane (Slow, Safe, Strongly Consistent)

The flag authoring path:

```
Flag Change → Validation → Strongly-Consistent Store → Distribution Service
```

**Validation engine checks:**
- Rule schema correctness (valid predicate syntax, known attribute names)
- Kill-switch constraints (no user-context dependency)
- Mutual exclusion guardrails (overlapping targeting populations flagged)
- Dependency graph validation (explicit `depends_on` verified at write time)

**Storage:** Spanner for globally-serialized writes across regions; Postgres with LISTEN/NOTIFY for regional deployments.

Write latency of hundreds of milliseconds is acceptable. A misconfigured targeting rule crashing a canary population is not. This path is correctness-prioritized.

### Data Plane (Fast, Local, Eventually Consistent)

An embedded SDK in every service instance — JVM agent, Go library, Node.js module, or sidecar. It holds a complete in-memory snapshot of all flag configurations.

Evaluation is:
1. O(1) key lookup in the flag map
2. Sequential scan of a pre-compiled rule list (kill switch → targeting → rollout → default)
3. Per-request memoization (same flag, same context = same result within a request)
4. Structured exposure event emission

No network I/O. No locks on the hot path. Sub-millisecond.

### Push-Based Distribution (Not Pull)

> 💡 **Why push? A thundering herd argument.**

Flip a high-traffic flag and 10,000 service instances' poll timers fire within the same jitter window. You've created a coordinated spike against your config store at exactly the moment the system is under change-induced stress.

Push-based distribution maintains persistent connections to subscribers (SSE, gRPC streaming) and fans out diffs on change. Envoy xDS and Kubernetes controllers use the identical pattern. Convergence in seconds — not polling intervals.

---

## The Flag Data Model: Beyond Boolean

A production flag is a **versioned rule tree**:

```json
{
  "flag": "new_checkout_v2",
  "version": 14,
  "type": "boolean",
  "owner": "payments-team",
  "expires_at": "2024-09-01T00:00:00Z",
  "fail_policy": "open",
  "depends_on": [],
  "rules": [
    { "if": "region == EU", "value": false },
    { "if": "user_percent < 5", "value": true }
  ],
  "default": false
}
```

Rule evaluation order is **load-bearing**. Kill switches first. Explicit targeting rules next. Percentage rollout after that. Global default last.

The EU rule precedes the rollout rule deliberately — GDPR compliance is a hard override. Reversing that order silently ships non-compliant behavior to a subset of European users. The flag validated correctly in staging. The production incident was a compliance violation.

---

## Kill Switches

Kill switches evaluate **before any targeting predicate** — before user lookups, before region checks, before anything that requires a valid context object.

IMAGE_PLACEHOLDER_KILL_SWITCH: Flowchart: Request enters SDK → Kill switch check → (match: return override value, done) → Targeting rules → (match: return rule value) → Rollout bucket → (in bucket: return rollout value) → Default value. Kill switch branch highlighted in red with label "evaluated first, no context required."

**The Uber surge pricing scenario (reconstructed from public incident reports):**

During a major incident, the on-call team needed to disable surge pricing globally across all regions within the incident response SLA. The response window was under 30 seconds. That's only achievable when:

1. Flag evaluation is local — no network call per request
2. Distribution is push-based — all instances notified within seconds of the flip
3. Kill switch evaluates first — before any pricing logic executes

Miss any one of these, and 30 seconds becomes minutes.

---

## Progressive Rollouts and Canaries

```
0.1% → 1% → 5% → 20% → 50% → 100%
```

The hash function for percentage rollouts must be **deterministic and stable**:

```typescript
// Stable across restarts, SDK versions, and service instances
function inRolloutBucket(userId: string, flagKey: string, pct: number): boolean {
  return murmurhash3_32(`${flagKey}:${userId}`) % 100 < pct;
}
```

This is not an implementation detail. At a fintech running a gradual checkout rollout, two SDK versions in parallel deployment used different hash seeds. Same `user_id` evaluated into different buckets. Alternating UI states on page refresh. Three days to diagnose.

**Meta's auto-ramp pattern (Gatekeeper):**

Start at 0.1%. Automatically increment by 0.1% every 30 minutes if no metric regression is detected — error rates, p99 latency, business KPIs. Regression detected at 5%? Automatic rollback, on-call page. A complete 0→100% ramp can run overnight with zero engineer involvement.

IMAGE_PLACEHOLDER_ROLLOUT: Animated-style diagram showing percentage ramp: 0.1% → 1% → 5% → 20% → 50% → 100%. A branch at 5% showing automatic rollback path with red arrow. Labels: "metric feedback loop" connecting rollout to monitoring.

---

## Platform Comparison: Build vs. Buy

| Feature | LaunchDarkly | Split | Unleash (OSS) | Flagsmith (OSS) | Home-built |
|---|---|---|---|---|---|
| Local evaluation SDK | ✅ | ✅ | ✅ | ✅ | Build it |
| Push distribution | ✅ | ✅ | Polling (configurable) | Polling | Build it |
| Auto-ramp with metrics | ✅ | ✅ | ❌ | ❌ | Build it |
| Exposure tracking | ✅ | ✅ | Basic | Basic | Build it |
| Lifecycle enforcement | Basic | Basic | ❌ | ❌ | Define it |
| Pricing | Per-seat SaaS | Per-seat SaaS | Free (self-hosted) | Free tier + paid | Engineering cost |
| Data residency | Cloud (configurable) | Cloud | Self-hosted | Self-hosted | Full control |

> 💡 **Recommendation:** For most teams, LaunchDarkly or Split removes the infrastructure burden. If data residency, cost at scale, or deep customization matters, Unleash self-hosted + a custom distribution layer is the most common enterprise path.

---

## Flag Lifecycle: The Debt That Bites Later

IMAGE_PLACEHOLDER_LIFECYCLE: Two-panel diagram. Panel 1: flag count growth curve (months on x-axis, flag count on y-axis) with no enforcement — curve bends upward. Panel 2: same curve with lifecycle enforcement kicks in — curve stabilizes. Red zone labeled "operational reasoning breaks down" above threshold.

**The combinatorial state explosion:**

| Flag count | Possible system states |
|---|---|
| 10 | 1,024 |
| 20 | 1,048,576 |
| 50 | ~1 quadrillion |
| 100 | More than atoms in observable universe |

You cannot test that. You cannot reason about it at 2am.

**Atlassian's response to 4,000+ flags:** Mandatory 90-day expiry on every flag. Automated JIRA ticket when expiry approaches. Automated PR to remove call sites when flag reaches 100% stable rollout for 30 days.

**The Knight Capital reminder:** $440M in 45 minutes because a deprecated flag was never deleted.

Three things required at flag creation — enforced by automation, not convention:

1. **Owner** (team, not individual — people leave)
2. **Expiry date** (or explicit waiver with documented justification)
3. **Cleanup automation** (PR opened when flag hits 100% stable)

---

## Big Tech Patterns

### Netflix — Trebuchet

Evaluates flags at the **API gateway layer** for homepage A/B testing. Attaches variant assignments to the request context. Propagates through all downstream services. Kill switches stop traffic before application logic. Tens of millions of users in simultaneous experiments.

### Meta — Gatekeeper

30–60 second propagation window is intentional. Staleness is acceptable. Staleness-during-outage is not. Auto-ramp with business metric feedback. Thousands of simultaneous experiments. Gatekeeper evaluates flags across 3+ billion monthly active users.

### Google — Internal Flag Systems

Flag exposure events feed directly into **ABACUS**, their experimentation platform. Exposure events are the join key between user actions and flag variants — without them, causal inference between flag changes and user outcomes is impossible. Every evaluation emits `{flag_key, variant, user_id, context_hash, sdk_version, timestamp}`.

### Uber — Flipr

Region-aware kill switches operable within a 30-second global response window. Driver matching, surge pricing, dispatch logic, routing algorithms — all gated. Typical incident playbook includes a named flag for every critical subsystem.

---

## Observability: What You Must Track

Every evaluation emits a structured event — this isn't optional logging:

```typescript
interface FlagExposureEvent {
  flagKey: string;
  variant: FlagVariant;
  userId: string;
  contextHash: string;    // hash of full evaluation context
  sdkVersion: string;
  timestamp: string;      // ISO
  flagVersion: number;    // which flag version was evaluated
}
```

This is the foundational data primitive for:
- Experiment analysis (join on `userId + flagKey` to correlate with user actions)
- Regression detection (spike in error rate correlated with flag rollout)
- Audit compliance (who saw what, when, under which flag version)
- Debugging (reproduce the exact flag state a user experienced)

---

## Implementation Checklist

```
✅ Local evaluation SDK — no RPC on request path
✅ Push-based distribution — SSE or gRPC streaming, not polling
✅ Kill switches: evaluated first, no user-context dependency
✅ Per-flag fail_policy: "open" | "closed" declared at creation
✅ Deterministic hash for rollouts — seed normalized across SDK versions
✅ Per-request memoization — clear at request boundary
✅ Structured exposure event at every evaluation
✅ Owner + expiry date required fields at creation
✅ Monotonic version counter — never apply partial diffs
✅ Cold start safety — block traffic until initial snapshot loaded
✅ Automated cleanup PRs at 100% stable
✅ Explicit depends_on validated at write time
```

---

*Part of the [System Design at Scale](#) series on Hashnode.*
*Originally published at [sairam.dev](https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system)*

---

## Image Slots

| Slot | Description |
|---|---|
| IMAGE_PLACEHOLDER_ARCHITECTURE | Full two-plane architecture with distribution service |
| IMAGE_PLACEHOLDER_KILL_SWITCH | Evaluation flowchart, kill switch first |
| IMAGE_PLACEHOLDER_ROLLOUT | Progressive ramp with auto-rollback branch |
| IMAGE_PLACEHOLDER_LIFECYCLE | Flag debt growth curve, two panels |
