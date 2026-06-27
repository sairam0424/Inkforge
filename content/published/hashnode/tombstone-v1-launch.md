---
slug: tombstone-v1-launch
title: "I Built Tombstone Because I Was Tired of 2am Flag Incidents"
platform: hashnode
status: draft
published_date:
published_url:
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-launch
publish_note: "HASHNODE: API decommissioned June 2026. Publish manually at hashnode.com. Set originalArticleURL in SEO settings."
series: "Production Engineering"
tags: ["feature-flags", "system-design", "open-source", "devops", "circuit-breaker"]
---

Two years ago I was on a 2am incident call. Dashboard red. Lead on the line asking one question I couldn't answer: "Which flags are on right now?"

200+ flags across 12 services. No consolidated answer. We eventually traced it to a flag key that had been deleted and recreated six months later by a different team — the old Redis-cached targeting rules were never invalidated. 47 minutes of investigation for what should have been a 5-minute rollback.

I built Tombstone to make that incident impossible.

## What Tombstone Is

Tombstone is a self-hosted production intelligence platform for feature flags at scale. It's designed specifically for the operational failure modes that existing tooling ignores: flag key reuse, stale flag accumulation, and the "what changed?" loop that costs you an hour every time production breaks.

**Architecture: 8 services**

| Service | Language | Port | Role |
|---|---|---|---|
| flag-api | Go | 8081 | CRUD, evaluation rules, tombstone registry |
| gateway | Go | 8080 | Auth, rate limiting, request routing |
| evaluator | Go | 8082 | High-throughput flag evaluation, SSE |
| intelligence | Python | 8083 | Anomaly detection, correlation, rollout advisor |
| gitops-sync | Go | — | Git-based flag management |
| ast-rewriter | Go | — | Static analysis for stale flag detection |
| marketplace | Go | — | Flag templates and sharing |
| dashboard | React 19 | 3000 | Governance UI |

**Infrastructure:** PostgreSQL 16 + pgvector, Redis 7, Kafka 7.6

**Quick start:**

```bash
git clone https://github.com/sairam/tombstone
cd tombstone
make dev
# First run: 3-5 min (image pulls)
# Dashboard: http://localhost:3000
# Flag API:  http://localhost:8081
```

## Core Innovation 1: Tombstoning

### The Problem

Flag keys get deleted and recreated. When a key is recycled, it can inherit stale cached state — targeting rules, evaluation history, rollout percentages — from a completely different feature that happened to use the same name. This is the Knight Capital pattern: a reactivated flag key activates unintended behavior.

Knight Capital lost $440M in 45 minutes in 2012. Feature flag reuse was a contributing factor. This failure mode has a fix that nobody implements: make key reuse structurally impossible.

### The Implementation

The tombstone registry is an append-only table. The database role used by flag-api has INSERT privileges only — no UPDATE, no DELETE.

```sql
-- tombstones: write-once, verifiable archive
CREATE TABLE tombstones (
    key             TEXT PRIMARY KEY,
    original_team   TEXT NOT NULL,
    original_purpose TEXT,
    created_at      TIMESTAMPTZ NOT NULL,
    retired_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    retired_by      TEXT NOT NULL,
    retirement_reason TEXT,
    audit_hash      TEXT NOT NULL  -- Merkle node hash
);

-- Role constraint enforced at database level, not application level
REVOKE UPDATE, DELETE ON tombstones FROM flagapi_role;
```

Any attempt to create a flag with a tombstoned key fails immediately:

```
Error: Flag key 'enable_new_checkout' is tombstoned.
Original owner: Checkout Team (created 2024-08-12, retired 2025-02-03)
Retirement reason: Feature shipped, code paths unified
Choose a new unique key such as 'enable_checkout_v3_redesign'
```

### Merkle-Linked Audit Chain

Every tombstone entry is linked into a Merkle chain. Each entry contains the hash of the previous entry, making the chain cryptographically verifiable. Any retroactive modification to the archive breaks the chain from that point forward.

```go
type TombstoneEntry struct {
    Key           string    `json:"key"`
    RetiredAt     time.Time `json:"retired_at"`
    RetiredBy     string    `json:"retired_by"`
    Reason        string    `json:"reason"`
    PreviousHash  string    `json:"previous_hash"`
    AuditHash     string    `json:"audit_hash"` // SHA-256(entry + previous_hash)
}

func (e *TombstoneEntry) ComputeHash() string {
    payload := fmt.Sprintf("%s|%s|%s|%s|%s",
        e.Key, e.RetiredAt.UTC().Format(time.RFC3339),
        e.RetiredBy, e.Reason, e.PreviousHash)
    sum := sha256.Sum256([]byte(payload))
    return hex.EncodeToString(sum[:])
}
```

## Core Innovation 2: Causal Incident Correlation

### The "What Changed?" Problem

When production breaks, the first 20 minutes of every incident are spent asking the same questions: what deployed recently, which flags changed, who made the change. This is manual, slow, and error-prone at 2am.

The causal correlation engine automates this query. When an incident signal is detected, it automatically searches the 30-minute audit window and returns ranked candidates.

### Ranking Algorithm

```python
import math
from dataclasses import dataclass
from datetime import datetime

BLAST_WEIGHTS = {
    "BLOCKED": 2.0,
    "HIGH": 1.5,
    "MEDIUM": 1.0,
    "LOW": 0.6,
}

RECENCY_DECAY = 0.15  # ~4.6 minute half-life

@dataclass
class Candidate:
    change: FlagChange
    score: float
    rollback_url: str

def rank_candidates(
    changes: list[FlagChange],
    incident_time: datetime,
    top_n: int = 3
) -> list[Candidate]:
    scored = []
    for change in changes:
        delta_min = (incident_time - change.timestamp).total_seconds() / 60
        recency = math.exp(-RECENCY_DECAY * delta_min)
        blast = BLAST_WEIGHTS.get(change.blast_tier, 1.0)
        score = recency * blast
        rollback = f"/api/flags/{change.flag_key}/rollback?token={change.rollback_token}"
        scored.append(Candidate(change=change, score=score, rollback_url=rollback))

    scored.sort(key=lambda c: c.score, reverse=True)
    return scored[:top_n]
```

### Response Format

```json
{
  "incident_time": "2025-11-14T02:17:43Z",
  "correlation_window_minutes": 30,
  "query_time_ms": 187,
  "candidates": [
    {
      "rank": 1,
      "flag_key": "enable_new_checkout_v2",
      "changed_by": "alice@example.com",
      "delta_minutes": 3.2,
      "change": { "from": false, "to": true },
      "blast_tier": "HIGH",
      "score": 0.892,
      "rollback_url": "/api/flags/enable_new_checkout_v2/rollback?token=rtk_abc123"
    },
    {
      "rank": 2,
      "flag_key": "enable_checkout_analytics",
      "changed_by": "bob@example.com",
      "delta_minutes": 11.7,
      "change": { "from": 0.1, "to": 0.5 },
      "blast_tier": "MEDIUM",
      "score": 0.419,
      "rollback_url": "/api/flags/enable_checkout_analytics/rollback?token=rtk_def456"
    }
  ]
}
```

Validated against historical incidents: true causal change ranked in top 3 candidates in 87% of cases.

## Core Innovation 3: Circuit Breaker Auto-Rollback

### Design

The circuit breaker monitors error rates on flag-gated code paths. When a path exceeds the configured threshold, it automatically rolls back to the last known safe value.

Critical design decision: **roll back to last safe value, not disable flag.**

Disabling a flag asserts that the off/false state is safe. This is often true and sometimes catastrophically false — services that have been relying on a flag evaluating true for months can fail worse when it's suddenly disabled than if the original problem flag had never tripped. "Last known safe value" is a conservative, reversible, empirical choice. It doesn't assert anything about the flag's nature, only about its recent stable history.

```go
type CircuitBreakerConfig struct {
    ErrorRateThreshold float64       `yaml:"error_rate_threshold"` // default: 0.05
    MinRequestCount    int           `yaml:"min_request_count"`    // default: 100
    WindowDuration     time.Duration `yaml:"window_duration"`      // default: 60s
    SafeValue          interface{}   `yaml:"safe_value"`           // explicit or inferred
    AutoRollback       bool          `yaml:"auto_rollback"`        // default: true
    AlertOnTrip        bool          `yaml:"alert_on_trip"`        // default: true
}

// When circuit trips:
// 1. Apply rollback to SafeValue
// 2. Emit circuit_breaker_trip event to Kafka
// 3. Fire incident correlation pipeline (non-blocking)
// 4. Send notification with ranked candidates pre-loaded
```

### Per-Flag Configuration

```yaml
# flags/enable_payment_v2.yaml
key: enable_payment_v2
circuit_breaker:
  error_rate_threshold: 0.01   # 1% — payment-critical
  min_request_count: 50
  window_duration: 30s
  safe_value: false
  auto_rollback: true
```

## The 5-Step Evaluation Pipeline

The evaluator implements a deterministic 5-step pipeline with 108 LaunchDarkly-compatible contract tests.

### Steps

**1. Prerequisite resolution**

Flags can depend on other flags. Dependencies are resolved in topological order. Circular dependencies are rejected at write time — zero evaluation overhead.

```go
func (e *Evaluator) resolvePrerequisites(flag *Flag, ctx EvalContext) (bool, error) {
    for _, prereq := range flag.Prerequisites {
        result, err := e.Evaluate(prereq.FlagKey, ctx)
        if err != nil {
            return false, fmt.Errorf("prerequisite %s failed: %w", prereq.FlagKey, err)
        }
        if result.Value != prereq.RequiredValue {
            return false, nil  // prerequisite not met, skip remaining rules
        }
    }
    return true, nil
}
```

**2. Targeting rule matching**

Rules evaluated in priority order. First match wins.

**3. Variation assignment**

Deterministic consistent hashing — same user + flag key + salt always produces same variation.

```go
func assignVariation(userKey, flagKey, salt string, variations []Variation) Variation {
    hash := fnv.New32a()
    hash.Write([]byte(userKey + "." + flagKey + "." + salt))
    bucket := int(hash.Sum32() % 10000)  // 0-9999
    
    cursor := 0
    for _, v := range variations {
        cursor += v.Weight  // weights sum to 10000
        if bucket < cursor {
            return v
        }
    }
    return variations[len(variations)-1]
}
```

**4. Default fallback**

If no rules match and no targeting applies, return the flag's default value.

**5. Dependency cycle detection**

Detected and rejected at flag save time. The evaluation path never encounters a cycle.

### WASM Evaluator

The evaluation core compiles to WebAssembly for edge/browser deployment:

```typescript
import { createEvaluator } from '@tombstone/eval';

// Runs in Cloudflare Workers, browsers, Node.js, Deno
const evaluator = await createEvaluator();

const result = evaluator.evaluate({
  flagKey: 'my-flag',
  context: { userId: 'user-123', plan: 'pro', region: 'us-east' },
  rules: flagConfig.rules,
  defaultValue: false,
});

console.log(result.value);    // true/false
console.log(result.reason);   // "TARGETING_MATCH: rule='beta-users'"
console.log(result.variationKey); // "treatment-a"
```

The WASM constraint forced the evaluation pipeline to be fully deterministic with no I/O. This is good design regardless of WASM — deterministic evaluation is testable, reproducible, and debuggable.

## Blast Radius Scoring

Every flag change request triggers pre-computation blast radius scoring before the change is applied.

### Tiers and Enforcement

| Tier | Threshold | Enforcement |
|---|---|---|
| BLOCKED | Critical system flag + full traffic | Requires admin override token + mandatory review |
| HIGH | >40% traffic OR critical code path | Four-eyes approval required (2 approvers, Merkle-linked) |
| MEDIUM | 10-40% traffic | Confirmation step required |
| LOW | <10% traffic, non-critical | Applies immediately |

```python
def compute_blast_radius(flag: Flag, proposed_change: Change) -> BlastTier:
    traffic_pct = estimate_traffic_percentage(flag)
    service_count = count_evaluating_services(flag.key)
    is_critical_path = flag.tags.intersects({"payments", "auth", "data-integrity"})
    change_magnitude = classify_change_magnitude(proposed_change)

    score = 0
    score += traffic_pct * 40          # 0-40 pts
    score += min(service_count * 5, 20) # 0-20 pts (capped)
    score += 25 if is_critical_path else 0
    score += change_magnitude.score     # 0-15 pts

    if score >= 80: return BlastTier.BLOCKED
    if score >= 55: return BlastTier.HIGH
    if score >= 30: return BlastTier.MEDIUM
    return BlastTier.LOW
```

## Anomaly Detection: 3-Model Ensemble

The intelligence service runs three anomaly algorithms in parallel on flag evaluation event streams.

### The Models

**Z-score** — detects sharp spikes in evaluation rate relative to rolling mean and standard deviation. Fast, interpretable, but misses gradual drift.

**Isolation Forest** — unsupervised ML, detects unusual patterns that don't fit clean statistical descriptions. Effective on multi-dimensional evaluation patterns (rate + variation distribution + context attributes). Higher false positive rate in isolation.

**EWMA (Exponentially Weighted Moving Average)** — specifically designed for gradual drift detection. Where Z-score misses a flag that slowly starts evaluating true 40% more often, EWMA catches it.

### 2/3 Voting Rule

```python
def classify_stream(
    flag_key: str,
    window: EvaluationWindow,
    models: tuple[ZScoreModel, IsolationForestModel, EWMAModel]
) -> AnomalyResult:
    z_score_alert = models[0].classify(window)
    iso_forest_alert = models[1].classify(window)
    ewma_alert = models[2].classify(window)

    votes = sum([z_score_alert, iso_forest_alert, ewma_alert])
    is_anomalous = votes >= 2  # 2/3 majority required

    return AnomalyResult(
        flag_key=flag_key,
        is_anomalous=is_anomalous,
        votes=votes,
        signals={
            "z_score": z_score_alert,
            "isolation_forest": iso_forest_alert,
            "ewma": ewma_alert,
        }
    )
```

Single-model detection on the same test data: Z-score alone produced 31% false positive rate. The 2/3 ensemble: 8% false positive rate, 94% recall on seeded anomalies.

### Rollout Advisor (LinUCB Contextual Bandit)

The anomaly signals feed a LinUCB contextual bandit that generates rollout recommendations:

```json
{
  "flag_key": "enable_new_checkout_v2",
  "current_rollout_pct": 10,
  "recommendation": {
    "action": "EXPAND",
    "target_pct": 25,
    "confidence": 0.83,
    "expected_error_budget_impact": "0.02%",
    "reasoning": "10% cohort stable for 72h, anomaly models all green, error rate 0.1% below baseline"
  }
}
```

## Four-Eyes Approval and Break-Glass

### Four-Eyes Workflow

HIGH and BLOCKED tier changes require two named approvers. Each approver signs independently; both signatures are Merkle-linked to the change event.

```bash
# 1. Stage the change (requester)
tombstone flag stage \
  --key enable_payment_v2 \
  --enable \
  --reason "Q3 launch: new payment flow after 3-week beta"

# Returns: stage_token=stg_abc123

# 2. First approver reviews and signs
tombstone flag approve stg_abc123 \
  --approver alice@example.com \
  --note "Reviewed blast radius, payment error budget at 0.3%"

# Returns: approval_1=apr_xyz789

# 3. Second approver signs
tombstone flag approve stg_abc123 \
  --approver bob@example.com

# Returns: approval_2=apr_def456

# 4. Apply (requires both tokens)
tombstone flag apply stg_abc123 \
  --approval-1 apr_xyz789 \
  --approval-2 apr_def456
```

### Break-Glass Emergency Override

```bash
tombstone emergency override \
  --flag enable_payment_v2 \
  --value false \
  --duration 15m \
  --reason "P0: payment errors at 12%, rolling back"
```

Break-glass usage is:
- Logged with `EMERGENCY_OVERRIDE` event type
- Prominently surfaced in governance dashboard
- Auto-creates a mandatory post-incident review task
- Notifies all flag owners and team leads
- Token expires after specified duration (change NOT automatically reversed)

## SSE Streaming Architecture

Flag updates reach connected SDKs in milliseconds via Server-Sent Events.

```
flag-api writes change
    → Kafka topic: flag.changes
        → evaluator consumes
            → invalidates Redis cache for flag key
            → broadcasts via SSE to connected SDK clients
                → SDK updates local flag cache
                    → next evaluation uses new value
```

End-to-end propagation latency: typically 15-50ms under normal load.

```typescript
// SDK auto-reconnects on connection loss
const client = new TombstoneClient({ host: 'http://localhost:8081' });

// Subscribe to specific flag changes
client.onFlagChange('enable_new_checkout_v2', (update) => {
  console.log('Flag changed:', update.newValue, 'by:', update.changedBy);
  // React state, feature gates, etc updated here
});

// Or subscribe to all changes
client.onAnyFlagChange((update) => {
  flagCache.set(update.flagKey, update.newValue);
});
```

## GitOps: Flag-as-Code

Full flag configuration as YAML, managed through git pull requests:

```yaml
# flags/enable_checkout_v2.yaml
key: enable_checkout_v2
name: "Redesigned Checkout Flow"
description: "3-step checkout replacing legacy 5-step flow"
owner: checkout-team
tags: [checkout, payments, critical]
default_value: false

rules:
  - name: internal-testing
    priority: 1
    conditions:
      - attribute: email
        operator: ends_with
        value: "@example.com"
    value: true

  - name: beta-cohort
    priority: 2
    conditions:
      - attribute: cohort
        operator: in
        value: ["beta-q3-2025"]
    value: true

circuit_breaker:
  error_rate_threshold: 0.02  # 2% — payment path
  min_request_count: 50
  safe_value: false

blast_config:
  critical_path: true  # forces HIGH tier minimum
  additional_approvers: ["payments-lead@example.com"]
```

The `gitops-sync` service watches a configured repository. A flag change PR merging to main applies the change through the same blast radius + approval pipeline as UI-driven changes.

## Performance: 40% Throughput at 10k Connections

The evaluator achieves 40% higher throughput at 10,000 concurrent connections compared to direct database evaluation through two mechanisms:

**1. Tiered caching in Redis**

```go
type EvaluationCache struct {
    // L1: in-process LRU, ~1ms hit
    local *lru.Cache

    // L2: Redis with TTL calibrated to flag volatility
    redis *redis.Client
}

func (c *EvaluationCache) ttlForFlag(flag *Flag) time.Duration {
    switch flag.VolatilityTier {
    case "stable":    return 5 * time.Minute
    case "moderate":  return 30 * time.Second
    case "volatile":  return 5 * time.Second
    default:          return 15 * time.Second
    }
}
```

**2. SSE-based cache invalidation**

Rather than polling for changes, connected SDK clients receive push updates via SSE. Cache invalidation is event-driven — the cache entry for a flag is marked stale immediately when a change event is received, not on the next polling cycle.

## AST Rewriter: Static Analysis for Stale Flags

The `ast-rewriter` service performs static analysis across connected repositories:

```json
{
  "analysis_type": "stale_flag_detection",
  "repository": "github.com/example/checkout-service",
  "findings": [
    {
      "flag_key": "enable_old_checkout",
      "status": "TOMBSTONED",
      "references": [
        { "file": "src/checkout/handler.go", "line": 47, "context": "if flags.IsEnabled(\"enable_old_checkout\") {" },
        { "file": "src/checkout/handler.go", "line": 52, "context": "}" }
      ],
      "recommendation": "Dead code — flag tombstoned 2025-02-03. Safe to remove lines 47-52.",
      "confidence": 0.97
    }
  ]
}
```

The flag-cleanup domain loop uses this analysis to generate cleanup tickets with code diffs, so engineers can review and merge flag removal PRs with one click.

## By the Numbers

- **8 services**, fully containerized, Docker Compose managed
- **5,000+ flags** supported operational scale
- **40% throughput improvement** at 10k concurrent connections
- **3-model ensemble** with 2/3 voting: 94% recall, 8% false positive rate
- **108 SDK contract tests** (LaunchDarkly evaluation compatibility)
- **41 evaluation unit tests**
- **30-minute** correlation window (configurable)
- **5% / 100 requests** default circuit breaker threshold
- **Sub-200ms** correlation query response time
- **15-50ms** SSE flag propagation latency

## What's Next

**v1.1 priorities:**

- Four-eyes UX overhaul — the current approval flow is functionally correct but feels heavier than it should. The goal is a workflow that feels as fast as a Slack approval thread.
- NATS support as a Kafka alternative — lighter for teams without existing Kafka infrastructure.
- Compliance documentation — SOC 2 and HIPAA guidance for teams in regulated environments.
- Dashboard V2 — the React 19 frontend needs a significant UX pass, particularly the governance views.

**On the roadmap:**

- Multi-tenant support for platform teams managing flags for internal product teams
- Flag cost attribution — correlate flag evaluation volume to compute costs
- OpenFeature adapter (full compliance with the OpenFeature specification)

## Get Involved

Repository: [github.com/sairam/tombstone](https://github.com/sairam/tombstone) — MIT licensed.

Issues and PRs welcome. Especially interested in:
- Teams managing 1,000+ flags in production — what does your operational tooling look like?
- Flag incident post-mortems — what failure modes have you encountered that Tombstone doesn't cover?
- Integration requirements — what existing systems does it need to plug into for your stack?

The failure modes that led to Tombstone are not edge cases. They're common. If you've been on a 2am call trying to answer "which flags are on right now?" — this was built for exactly that moment.
