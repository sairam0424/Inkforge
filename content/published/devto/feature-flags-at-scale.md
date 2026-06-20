---
slug: feature-flags-at-scale
title: "Feature Flags at Scale: The Complete Engineering Guide"
platform: devto
status: draft
published_date: 2026-06-20
published_url: https://dev.to/sai_ram_0000/feature-flags-at-scale-designing-a-distributed-control-system-for-production-behavior-36j4-temp-slug-5932739
canonical_url: https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system
article_path: content/articles/system-design/feature-flags-at-scale-distributed-control-system.md
devto_tags: [featureflags, systemdesign, devops, distributedsystems]
reading_time: 13
---

# Dev.to Version

## Dev.to Frontmatter (paste at top of Dev.to editor)

```
---
title: "Feature Flags at Scale: The Complete Engineering Guide"
published: false
description: "How Google, Meta, Netflix, and Uber use feature flags as a distributed control plane — architecture, failure modes, and production war stories including Knight Capital's $440M incident."
tags: featureflags, systemdesign, devops, distributedsystems
canonical_url: https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system
cover_image:
series: System Design at Scale
---
```

---

## Article Body (Dev.to-ready)

In 2012, Knight Capital lost **$440 million in 45 minutes** because of a feature flag that was never deleted. Not a trading bug. Not an infrastructure failure. A stale flag, a deployment, and dormant code that reactivated. The blast radius was irreversible.

That incident is the most expensive argument ever made for treating feature flags as first-class engineering infrastructure.

## What Most Engineers Get Wrong

The mental model of a flag as a key-value boolean works fine at low scale. At millions of requests per second, it becomes dangerous.

At scale, feature flags are a **distributed control plane for production behavior** — not config files. That distinction has real architectural consequences.

One constraint drives every decision: **user traffic must never block on a remote flag service call.** A synchronous RPC per evaluation adds 10–50ms of tail latency at p99. Netflix, Google, Meta, and Uber all enforce local evaluation against an in-memory cache. Evaluation is a pure function — no I/O, no locks, sub-millisecond.

## Architecture: Two Planes, Two Contracts

The control plane and data plane have opposite optimization targets:

IMAGE_PLACEHOLDER_ARCHITECTURE: Two-box diagram showing Control Plane (authoring UI → validation → strongly-consistent store) on left, Data Plane (SDK → local cache → evaluation) on right, connected by Distribution Service with PUSH arrow.

### Control Plane (slow, safe)

- Flag authoring UI / API
- Validation engine — rule schema checks, kill-switch constraints
- Strongly-consistent store (Spanner for global, Postgres for regional)
- Audit logs and versioning

Write latency of hundreds of milliseconds is acceptable. A misconfigured rule crashing a canary is not.

### Data Plane (fast, local)

- SDK embedded in every service
- In-memory snapshot of all flag configurations
- Pure evaluation function — no network I/O, no locks on hot path

**Why push-based distribution?**

Pull-based polling creates a thundering herd: 10,000 service instances fire their poll timers within the same jitter window when a flag updates — a coordinated spike on your config store at exactly the wrong moment. Envoy xDS and Kubernetes controllers solve this identically: push diffs on change.

## The Flag Data Model

A production flag is a versioned rule tree, not a boolean:

```json
{
  "flag": "new_checkout_v2",
  "version": 14,
  "type": "boolean",
  "owner": "payments-team",
  "expires_at": "2024-09-01T00:00:00Z",
  "rules": [
    { "if": "region == EU", "value": false },
    { "if": "user_percent < 5", "value": true }
  ],
  "default": false
}
```

Rule evaluation order is load-bearing. Kill switches first. Then explicit targeting. Then percentage rollout. Then global default.

The EU rule precedes the rollout rule deliberately — GDPR compliance is a hard override. Reversing that order silently ships non-compliant behavior to European users. The flag validated correctly in testing. The production incident was a compliance violation.

## Percentage Rollouts: The Hash Function Matters

```typescript
// CORRECT — deterministic per user, stable across restarts
function inRolloutBucket(userId: string, flagKey: string, percentage: number): boolean {
  const hash = murmurhash3(`${flagKey}:${userId}`) % 100;
  return hash < percentage;
}

// WRONG — non-deterministic, same user sees different variants per request
function inRolloutBucketBad(percentage: number): boolean {
  return Math.random() * 100 < percentage; // Never do this
}
```

At a fintech running a gradual checkout rollout, two SDK versions in parallel deployment used different hash seeds. Same `user_id`, different buckets, alternating UI states on page refresh. Three days to diagnose. One-line fix. Uninterpretable A/B data for the entire window.

## Kill Switches

Kill switches are evaluated **before any targeting predicate**. They cannot depend on user context — at the moment you need one, you may not have a valid user object, working auth, or functioning database.

```typescript
function evaluateFlag(flagKey: string, context: EvaluationContext): FlagVariant {
  const flag = localCache.get(flagKey);
  if (!flag) return getDefault(flagKey);

  // Kill switch evaluated FIRST — no context dependency
  if (flag.killSwitch !== undefined) {
    return flag.killSwitch;
  }

  // Targeting rules
  for (const rule of flag.rules) {
    if (evaluateRule(rule, context)) {
      return rule.value;
    }
  }

  // Percentage rollout
  if (flag.rolloutPercentage !== undefined) {
    if (inRolloutBucket(context.userId, flagKey, flag.rolloutPercentage)) {
      return flag.rolloutValue;
    }
  }

  return flag.default;
}
```

IMAGE_PLACEHOLDER_KILL_SWITCH: Evaluation flowchart: Request enters SDK → kill switch check (match? return override immediately) → targeting rules → rollout bucket → default.

**Uber's surge pricing kill switch** disabled surge globally in under 30 seconds during major incidents — because evaluation required no network call and propagation used push-based fan-out.

## SDK Implementation: Simplified but Real

```typescript
class FeatureFlagSDK {
  private cache = new Map<string, CompiledFlag>();
  private requestMemo = new Map<string, FlagVariant>();

  initialize(connection: FlagServiceConnection): void {
    // Load initial snapshot — block until received (cold start safety)
    const snapshot = connection.fetchSnapshot();
    this.applySnapshot(snapshot);

    // Subscribe to incremental pushes
    connection.onUpdate((diff) => {
      this.applyDiff(diff);
    });
  }

  evaluate(flagKey: string, context: EvaluationContext): FlagVariant {
    // Per-request memoization — same flag evaluated multiple times in one request
    const memoKey = `${flagKey}:${hashContext(context)}`;
    const cached = this.requestMemo.get(memoKey);
    if (cached !== undefined) return cached;

    const result = this.evaluateFlag(flagKey, context);
    this.requestMemo.set(memoKey, result);

    // Emit exposure event — critical for experiment analysis
    this.emitExposure({ flagKey, variant: result, userId: context.userId });

    return result;
  }

  clearRequestMemo(): void {
    // Call at request boundary — never leak memo across requests
    this.requestMemo.clear();
  }
}
```

GIST_PLACEHOLDER_FULL_SDK: Complete TypeScript SDK with rule compilation, targeting engine, percentage rollout, and exposure tracking — ~150 lines.

## Flag Lifecycle: The Failure Mode Nobody Plans For

10 independent boolean flags = 1,024 possible system states.
50 flags = more states than atoms in the observable universe.

You cannot test that combination space. You cannot reason about it at 2am.

IMAGE_PLACEHOLDER_LIFECYCLE: Diagram: Create → Rollout → Stable → Delete. Below: flag count growth graph showing accumulation without enforcement, with red threshold line.

**Atlassian hit 4,000+ flags.** On-call engineers couldn't reason about which ones were safe to flip during incidents. Fix: mandatory 90-day expiry, automated cleanup tickets, automated PRs when flags hit 100% rollout.

**Knight Capital's $440M** wasn't a trading algorithm failure. It was flag lifecycle failure. The SMARS "Power Peg" flag was deprecated but never deleted. A new deployment reactivated it.

Rules that need automation, not convention:

```typescript
interface FlagDefinition {
  key: string;
  owner: string;           // required — team, not individual
  createdAt: string;       // ISO timestamp — set automatically
  expiresAt: string;       // required — no waiver without documented justification
  dependsOn?: string[];    // explicit flag dependencies — validated at write time
  failPolicy: 'closed' | 'open'; // per-flag, not system default
}
```

## Big Tech Patterns

| System | Company | Key Decision |
|---|---|---|
| Trebuchet | Netflix | Gateway-layer evaluation — kill switches fire before application logic |
| Gatekeeper | Meta | Auto-ramp with metric feedback — 30-60s propagation window is intentional |
| Internal | Google | Exposure events feed ABACUS — causal inference between variants and outcomes |
| Flipr | Uber | Region-aware kill switches — 30-second global response window |

The convergence is not coincidence. These teams arrived at local evaluation, push-based distribution, kill-switch priority, and lifecycle enforcement **independently** — because those are the only design choices that survive at scale.

## Implementation Checklist

```
✅ Local evaluation — no RPC on request path
✅ Push-based distribution — not polling
✅ Kill switches: evaluated first, no user context dependency
✅ Per-flag fail-open / fail-closed in the flag schema
✅ Deterministic hash for percentage rollouts — same seed everywhere
✅ Per-request memoization — clear at request boundary
✅ Exposure event emission — structured, at every evaluation
✅ Owner + expiry date required at creation time
✅ Automated cleanup PRs when flag reaches 100% stable
✅ Explicit flag dependency graph — no implicit dependencies
```

## References

- [LaunchDarkly SDK Architecture](https://docs.launchdarkly.com/sdk/concepts/evaluation-reasons)
- [Envoy xDS Protocol](https://www.envoyproxy.io/docs/envoy/latest/api-docs/xds_protocol)
- [AWS AppConfig Bake Times](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-deployment-strategy.html)
- Knight Capital Group SEC Filing, 2012
- [Martin Fowler — Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)

---

*Part of my [System Design at Scale](#) series.*
*Originally published at [sairam.dev](https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system)*

---

## Image & Gist Slots

| Slot | Description |
|---|---|
| IMAGE_PLACEHOLDER_ARCHITECTURE | Two-plane architecture with push distribution |
| IMAGE_PLACEHOLDER_KILL_SWITCH | Evaluation flowchart with kill switch first |
| IMAGE_PLACEHOLDER_LIFECYCLE | Create→Delete flow + flag debt growth graph |
| GIST_PLACEHOLDER_FULL_SDK | Full TypeScript SDK ~150 lines |
