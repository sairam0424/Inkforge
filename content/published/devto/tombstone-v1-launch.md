---
slug: tombstone-v1-launch
title: "I Built Tombstone Because I Was Tired of 2am Flag Incidents"
platform: devto
status: draft-published
published_date: 2026-06-27
published_url: https://dev.to/sai_ram_0000/how-i-built-tombstone-a-self-hosted-feature-flag-intelligence-platform-to-prevent-the-next-knight-56ip-temp-slug-4254603
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-launch
tags: ["featureflags", "systemdesign", "opensource", "devops"]
cover_image: assets/tombstone-v1/cover.png
---

It's 2am. My lead is on the call. The dashboard is red. She asks the one question I can't answer: "Which flags are on right now?"

200+ flags across 12 services. No consolidated view. I dug through Slack, opened Confluence, made guesses. We eventually rolled everything back. The root cause was a flag reactivation — a key that had been used, deleted, and recreated six months later by a different team. The new flag inherited no context from the old one, but the evaluator had cached targeting rules that were never invalidated.

47 minutes wasted on investigation. An incident that should have been a 5-minute rollback.

That night I started building Tombstone.


---

## What Tombstone Is

Tombstone is a self-hosted production intelligence platform for feature flags at scale. It's not another feature flag SaaS. It's a system designed specifically for the failure modes that existing tooling ignores: flag key reuse, stale flags, and the "what changed?" investigation loop that costs you an hour every time production breaks.

### Five Patterns Feature Flags Enable

**Dark Launch** — ship code to production with the flag off. Deploy first, release when you decide.
**Canary Release** — roll out to 1% of users, monitor for 30 minutes, ramp up. Never bet 100% of users on an untested change.
**Kill Switch** — disable a broken feature in 10 seconds without a rollback deploy.

| Method | Time | Risk |
|--------|------|------|
| Kill switch (flag toggle) | ~10 seconds | Zero — broken code stays deployed but unreachable |
| Deploy rollback | 20+ minutes | Non-zero — rollback commits can introduce new bugs |

**A/B Testing** — show two versions, measure which converts better. Statistical confidence, not gut feeling.
**Access Control** — enable for beta users or specific teams only. Change targeting rules, not code.

**The stack:**
- 8 services: `flag-api` (Go :8081), `gateway` (Go :8080), `evaluator` (Go :8082), `intelligence` (Python :8083), `gitops-sync`, `ast-rewriter`, `marketplace`, `dashboard` (React 19 :3000)
- PostgreSQL 16 + pgvector, Redis 7, Kafka 7.6
- Runs with `make dev` — Docker Compose, 3-5 min first run

Let's get into what makes it different.

---

## Innovation 1: Tombstoning

The namesake feature is conceptually simple: once a flag key is deleted, it is permanently archived. It can never be reused.

This prevents what I think of as the Knight Capital pattern. In 2012, Knight Capital lost $440M in 45 minutes due in part to a reactivated stale feature flag that activated dead code paths. Their specific failure was operational, but the flag key reuse attack surface it exploited is common.

Tombstone's registry is append-only and Merkle-linked. Every key that ever existed is traceable — when it was created, by whom, when it was retired, and why. Any attempt to create a new flag with a retired key fails with a descriptive error:

```
Error: Flag key 'enable_new_checkout' is tombstoned.
Originally used by team: Checkout (2024-08-12 to 2025-02-03)
Reason retired: Feature fully shipped, code paths removed
Use a new unique key instead.
```

The Merkle linking means the archive can be externally verified. Nobody can silently edit out a tombstone entry — the chain breaks.

### Why this matters architecturally

Most systems treat flag keys as database primary keys. Deletion just marks a row. Tombstoning requires a separate immutable registry — a second table or store that receives retired keys and never allows deletions. Writes only, by design.

```sql
-- tombstones table: insert-only, no UPDATE or DELETE permitted
CREATE TABLE tombstones (
    key         TEXT PRIMARY KEY,
    team        TEXT NOT NULL,
    retired_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason      TEXT,
    audit_hash  TEXT NOT NULL  -- Merkle node hash
);
```

Application-level enforcement isn't enough — the database role used by the flag-api has no `UPDATE` or `DELETE` privileges on this table. The immutability is structural.

---

### The Flag Lifecycle: DRAFT → TOMBSTONED

Every flag moves through six stages. Miss any of them and you have a Knight Capital waiting to happen.

DRAFT → ACTIVE (dark launch) → ROLLING OUT → FULL ROLLOUT → CLEANUP → TOMBSTONED

The critical ramp pattern for canary releases:
1% (30 min monitor) → 10% (1 hour monitor) → 50% (2 hours) → 100%

The circuit breaker watches the whole way. At 5% errors over 100 requests, it auto-rolls back — no engineer needed.

The gap most teams miss: **FULL ROLLOUT → TOMBSTONED**. A flag hits 100%, everyone moves on, and six months later nobody knows what `dark_launch_v2` controls. Tombstone's flag-cleanup loop detects flags at 100% rollout for 30+ days and fires a cleanup signal automatically.

---

## Innovation 2: Causal Incident Correlation ("What Changed?")

This is the feature I wish every on-call engineer had.

When production breaks, the intelligence service automatically queries the audit log for all flag changes in the 30 minutes prior to the incident signal. Changes are ranked using an exponential recency decay function combined with the blast radius score of each flag.

```python
def rank_candidates(changes: list[FlagChange], incident_time: datetime) -> list[Candidate]:
    scored = []
    for change in changes:
        delta_minutes = (incident_time - change.timestamp).total_seconds() / 60
        recency_score = math.exp(-0.15 * delta_minutes)   # half-life ~4.6 min
        blast_multiplier = BLAST_WEIGHTS[change.blast_tier]
        final_score = recency_score * blast_multiplier
        scored.append(Candidate(change=change, score=final_score))
    return sorted(scored, key=lambda c: c.score, reverse=True)[:3]
```

The output is a ranked list of up to 3 candidates:

```json
{
  "incident_time": "2025-11-14T02:17:43Z",
  "correlation_window_minutes": 30,
  "candidates": [
    {
      "flag_key": "enable_new_checkout_v2",
      "changed_by": "alice@example.com",
      "delta_minutes": 3.2,
      "change": { "from": false, "to": true },
      "blast_tier": "HIGH",
      "score": 0.892,
      "rollback_url": "/api/flags/enable_new_checkout_v2/rollback?token=..."
    }
  ]
}
```

In validation against historical incidents, the true causal change ranked in the top 3 candidates 87% of the time.

### The 30-minute window

The correlation window is configurable but defaults to 30 minutes. This is intentionally wider than you might expect — slow-burn issues (connection pool exhaustion, memory leaks triggered by flag-gated behavior) can take 20-25 minutes to manifest as measurable error rate increase. A 10-minute window would miss them.

---

## Innovation 3: Circuit Breaker Auto-Rollback

The circuit breaker monitors error rates on flag-gated code paths. When a path's error rate exceeds a configurable threshold over a sliding window, it automatically rolls back the flag to its last known safe value. No human needed.

Default thresholds: 5% error rate over a minimum of 100 requests. Both are configurable per-flag.

```go
type CircuitBreakerConfig struct {
    ErrorRateThreshold float64       // default: 0.05
    MinRequestCount    int           // default: 100
    WindowDuration     time.Duration // default: 60s
    RollbackValue      interface{}   // "safe default" for this flag
}
```

Critical design decision: the rollback action is "return to last known safe value," not "disable flag." Disabling a flag can cause its own cascading failures when downstream services expect a flag to be truthy. Rolling back to the last stable configuration is almost always safer and is fully reversible.

When the circuit breaker trips, it immediately fires the incident correlation pipeline — so the on-call engineer waking up doesn't just see "circuit breaker tripped," they see the ranked causal candidates and the rollback that already happened.


---

## The Evaluation Pipeline

The evaluator implements a 5-step evaluation pipeline with LaunchDarkly-verified contract tests:

1. **Prerequisite resolution** — flags can depend on other flags; cycles are detected and rejected at write time
2. **Targeting rule matching** — user/context attributes matched against rules in priority order
3. **Variation assignment** — deterministic consistent hashing, same user always gets same variation
4. **Default fallback** — if no rules match, return the configured default
5. **Dependency cycle detection** — evaluated at flag save time, not evaluation time (zero evaluation overhead)

108 SDK contract tests verify this pipeline against the LaunchDarkly compatibility specification. The goal is evaluation parity — a flag that evaluates `true` in LaunchDarkly's evaluator evaluates `true` in Tombstone's evaluator given identical inputs and rules.

### WASM-Ready Evaluator

The `@tombstone/eval` package compiles the evaluation core to WebAssembly:

```bash
npm install @tombstone/eval
```

```typescript
import { createEvaluator } from '@tombstone/eval';

const evaluator = await createEvaluator();
const result = evaluator.evaluate({
  flagKey: 'my-flag',
  context: { userId: 'user-123', plan: 'pro' },
  flagRules: flagConfig,  // loaded from your flag-api
});
```

This runs in Cloudflare Workers, browsers, Node.js, and any other WASM runtime. Making it WASM-compatible required the evaluation pipeline to be fully deterministic with no I/O — which is a good design constraint regardless of WASM.

---

## Quick Start

```bash
git clone https://github.com/sairam0424/Tombstone
cd Tombstone
make dev
# Dashboard:  http://localhost:3000
# Flag API:   http://localhost:8081
# Intel svc:  http://localhost:8083
```

### TypeScript SDK

```bash
npm install @tombstone/core
```

```typescript
import { TombstoneClient } from '@tombstone/core';

const client = new TombstoneClient({
  host: 'http://localhost:8081',
  sdkKey: process.env.TOMBSTONE_SDK_KEY,
});

// Basic evaluation
const enabled = await client.isEnabled('my-flag', {
  userId: 'user-123',
  plan: 'pro',
  region: 'us-east',
});

// Variation (multi-variant flags)
const variant = await client.variation('checkout-flow', context, 'control');

// SSE streaming — flag updates pushed in milliseconds
client.onFlagChange('my-flag', (newValue) => {
  console.log('Flag updated:', newValue);
});
```

### Python SDK

```python
from tombstone import TombstoneClient

client = TombstoneClient(host="http://localhost:8081", sdk_key=os.environ["TOMBSTONE_SDK_KEY"])

enabled = client.is_enabled("my-flag", context={"user_id": "user-123"})
variant = client.variation("checkout-flow", context, default="control")
```

---

### Testing Flags Without Flaky Tests

One underrated pain point with feature flags: they make tests flaky. If your unit test calls a real flag-api, its result changes when someone changes a flag in production. `TombstoneTestClient` solves this — it implements the same interface as the real client but never makes network calls. Every flag returns exactly what you tell it to. Three test cases are mandatory for any flag-gated code: flag on, flag off, and flag missing (safe default).

```typescript
// Never connect unit tests to a real flag-api — tests must be deterministic
import { TombstoneTestClient } from "@tombstone/core/testing";

describe("Checkout rendering", () => {
  let testClient: TombstoneTestClient;

  beforeEach(() => {
    testClient = new TombstoneTestClient();
    setTombstoneClient(testClient); // inject via your DI pattern
  });

  it("renders new checkout when flag is on", async () => {
    testClient.setFlag("checkout-v2", true);
    expect(renderCheckout(mockCart)).toContain("NewCheckout");
  });

  it("renders old checkout when flag is off", async () => {
    testClient.setFlag("checkout-v2", false);
    expect(renderCheckout(mockCart)).toContain("OldCheckout");
  });

  it("falls back to safe default when flag is missing", async () => {
    // TombstoneTestClient returns safe default (false) for unset flags
    expect(renderCheckout(mockCart)).toContain("OldCheckout");
  });
});
```

---

## Blast Radius Scoring

Every flag change request triggers a pre-computation blast radius score before the change is applied.

```
BLOCKED  →  Change requires explicit admin override token
HIGH     →  Four-eyes approval mandatory (2 approvers, Merkle-linked)
MEDIUM   →  Confirmation step required
LOW      →  Applies immediately
```

The blast radius computation weighs: percentage of active traffic the flag affects, number of services that evaluate the flag, presence of the flag in critical code paths (auth/payments/data), and magnitude of the change (enable from off vs. targeting modification).

The intent is zero friction on safe changes, meaningful friction on dangerous ones. LOW tier changes happen in one click. BLOCKED tier changes require deliberate override — and that override is logged, attributed, and Merkle-linked.

---

## Anomaly Detection: The 3-Model Ensemble

The intelligence service runs three anomaly detection algorithms in parallel on flag evaluation streams:

| Model | What it catches |
|---|---|
| Z-score | Sharp spikes in evaluation rate |
| Isolation Forest | Unusual patterns that don't look like spikes |
| EWMA | Gradual drift that Z-score misses |

A flag evaluation stream is classified as anomalous when 2 of 3 models agree (2/3 voting). Single-model detection produced too many false positives during load tests and planned deployments. The ensemble approach cut false positive rate by ~60% while maintaining recall on seeded anomalies.

The contextual bandit rollout advisor (LinUCB algorithm) uses this anomaly data to make percentage-based rollout recommendations — "expand from 10% to 25%, here's the expected error budget impact" — based on current traffic patterns and historical rollout success rates.

---

## Four-Eyes Approval and Break-Glass

### Four-Eyes

HIGH and BLOCKED tier changes require two named approvers. Each approver generates a signed token; both tokens must be present before the change is applied. Both tokens, the change specification, and the final application event are Merkle-linked.

```bash
# Requester generates change token
tombstone flag stage --key enable_payment_v2 --enable --reason "Q3 launch"
# Returns: stage_token=stg_abc123...

# Approver 1 reviews and countersigns
tombstone flag approve stg_abc123 --approver alice@example.com
# Returns: approval_token_1=apr_xyz789...

# Approver 2 countersigns  
tombstone flag approve stg_abc123 --approver bob@example.com
# Returns: approval_token_2=apr_def456...

# Apply (requires both approval tokens)
tombstone flag apply stg_abc123 --approval-1 apr_xyz789 --approval-2 apr_def456
```

### Break-Glass

For genuine production emergencies where you can't wait for approvals:

```bash
tombstone emergency override \
  --flag enable_payment_v2 \
  --value false \
  --duration 15m \
  --reason "P0: payment errors 12%, rolling back"
```

This generates a time-limited emergency token, applies the change immediately, logs everything with EMERGENCY_OVERRIDE tagging, and creates a mandatory post-incident review task. The token expires after the specified duration and the change is not automatically reversed (intentional — auto-reversal is too dangerous). Break-glass usage is prominently surfaced in the governance dashboard.

---

## The Numbers

- **8 services**, fully containerized
- **5,000+ flags** supported scale
- **40% throughput improvement** at 10k concurrent connections vs naive lookup
- **3-model ensemble** anomaly detection, 2/3 voting
- **108 SDK contract tests** (LaunchDarkly compatibility)
- **41 evaluation unit tests**
- **30-minute** correlation window
- **5% / 100 requests** default circuit breaker threshold
- **Sub-200ms** correlation query response time

---

## GitOps Integration

Every flag configuration is representable as YAML and can be managed through a git workflow:

```yaml
# flags/enable_new_checkout.yaml
key: enable_new_checkout_v2
name: "New Checkout Flow"
description: "Redesigned 3-step checkout"
owner: checkout-team
tags: [checkout, payments, critical]
default_value: false
rules:
  - name: internal-users
    priority: 1
    conditions:
      - attribute: email
        operator: ends_with
        value: "@example.com"
    value: true
  - name: beta-rollout
    priority: 2
    conditions:
      - attribute: cohort
        operator: in
        value: ["beta-users"]
    value: true
circuit_breaker:
  error_rate_threshold: 0.02  # 2% for payment-critical flag
  min_request_count: 50
blast_config:
  critical_path: true         # forces HIGH tier minimum
```

The `gitops-sync` service watches a configured git repository and applies changes automatically. Pull requests become the approval workflow for flag changes in teams that prefer that model.

---

## What I'd Build Differently

A few honest notes from v1:

The Kafka dependency is heavy for a fresh install. I originally wanted Kafka for the event stream that powers anomaly detection, audit logging, and SSE. In retrospect, NATS would have been a better choice for teams that don't already have Kafka — lighter, easier to operate. Kafka stays as the default for now but NATS support is on the roadmap.

The Python intelligence service is slower to start than I'd like (SQLAlchemy model loading + ML model initialization). At real scale this doesn't matter — you're running it as a long-lived container. But for the `make dev` experience, the 8-10 second startup on cold containers is annoying. I'm looking at precompiling the model initialization.

The dashboard UI needs work. It's functional React 19 but the UX isn't where I want it for the governance workflows — the blast radius review and four-eyes approval flows feel clunky. This is next.

---

## Get Involved

The repo is at [github.com/sairam0424/Tombstone](https://github.com/sairam0424/Tombstone). It's MIT licensed.

Issues, PRs, and honest feedback all welcome. Especially feedback from teams that have been through flag incidents — I'm interested in failure modes that Tombstone doesn't yet cover.

If you've ever been on a 2am call trying to answer "which flags are on?", you know exactly why this exists.
