---
slug: tombstone-v1-2-release
title: "Tombstone v1.2: Production-Hardening a Feature Flag Intelligence Platform"
platform: hashnode
status: draft
series: "Building in Public"
originalArticleURL: https://anvilry.vercel.app/notes/tombstone-v1-2-release
tags: ["devops", "opensource", "go", "systemdesign", "engineering"]
---

Shipping v1.0 felt good. The blast radius gates worked. The circuit-breaker audit trail held. We wrote the article, merged to main, and called it done.

What we did not expect was what the next two weeks of real-world testing would surface: a kill switch that was silently returning HTTP 400 on every request, four-eyes approval endpoints that were wired up but never registered in the router, and a scheduler that could run the same flag change twice under load. None of these triggered an alert. They just quietly failed.

This is the story of what happened when we pressure-tested Tombstone against production reality — and what it took to make it actually reliable.

## Background: What Tombstone Does

Tombstone is a production intelligence layer for feature flags. The premise is simple: feature flags are everywhere in modern systems, but the tooling to manage them safely is mostly stuck at the CRUD layer. You can create a flag, toggle it, and watch a dashboard. What you cannot easily do is answer the questions that matter at 2am: which flags are responsible for this latency spike, what changed in the last 15 minutes, and can I roll back the entire environment atomically without touching anything that was already stable?

Tombstone answers those questions. Blast radius scoring tells you how many users a flag touches and what services depend on it before you change it. A Merkle-chained audit log makes every mutation tamper-evident — you can prove that what the log says happened is exactly what happened. The kill switch shuts down a feature in a single API call and writes an immutable record that the kill happened. The evaluator distributes flag state to your services in real time.

v1.0 proved the concept. v1.1 and v1.2 made it something you can trust at 2am.

The GitHub repository is at https://github.com/sairam0424/Tombstone. Everything described in this article is in the codebase.

## The v1.2.1 Bug Report

Let me be direct about this, because I think the engineering community undervalues honest post-mortems on pre-production bugs. We found two critical issues in the same audit pass. Both had been present since their respective features were merged. Both had passed review. Neither triggered a test failure.

**REG-001: The kill switch was broken in production.**

The Slack slash command integration sends kill-switch requests through a Slack bot handler. The handler was constructing the HTTP request like this:

```go
req, err := http.NewRequest("POST",
    fmt.Sprintf("%s/api/v1/kill-switch?environment=%s", apiBase, env),
    bytes.NewBuffer(body),
)
```

The environment was in the URL query parameter. The flag-api handler was reading it from the JSON body:

```go
var req KillSwitchRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "invalid request body", http.StatusBadRequest)
    return
}
// req.Environment was always empty
```

Every kill-switch call from Slack returned HTTP 400. The field validation was correct. The routing was correct. The one thing nobody caught was that the sender and the receiver had agreed on different transports for a single field. Unit tests mocked the HTTP layer, so the mismatch was invisible. Integration tests did not cover the Slack handler path specifically.

The fix was one line — move environment into the JSON body where it belonged. But the diagnosis took longer than the fix because the 400 response from the API looked, from the Slack side, like a permission error.

**REG-002: Four-eyes approval was a ghost.**

Four-eyes approval is the governance control that requires a second operator to confirm a flag change before it executes. The implementation is complete: the data model, the business logic, the HTTP handlers, the audit trail integration. It was reviewed, approved, and merged.

It was never reachable because nobody registered the routes in `cmd/main.go`.

```go
// This existed in the handler file:
func (h *ApprovalHandler) RegisterRoutes(r chi.Router) {
    r.Post("/api/v1/approvals", h.CreateApproval)
    r.Post("/api/v1/approvals/{id}/approve", h.Approve)
    r.Post("/api/v1/approvals/{id}/reject", h.Reject)
}

// This was missing from main.go:
approvalHandler.RegisterRoutes(router)
```

Every deployment since the feature was merged had been running without it. Any test that called the approval endpoints directly would have immediately caught this. We did not have one.

Both bugs were found in the same session when we went looking for things to be proud of for this release article. That is the wrong way to find critical path failures.

The third fix in v1.2.1 was subtler but had the same character. `make migrate` only applied the baseline schema. A fresh deployment would start, connect to the database, and crash with `relation scheduled_changes does not exist` because the migration runner was not applying incremental migrations. This was masked in development because developers had long-running databases with all migrations already applied. A new deployment — exactly the scenario that matters most during an incident — would have failed immediately.

## Distributed Resilience: What v1.2.0 Added

Before the patch fixes, we had already done substantial resilience work in v1.2.0. The two efforts are related: the resilience additions forced us to look at the system more carefully, which is how we found the bugs.

The core addition is a resilient HTTP client built on `failsafe-go`. Every inter-service call in the system now goes through a client configured with exponential backoff, jitter, and a per-client circuit breaker.

```go
retryPolicy := failsafe.NewRetryPolicy[*http.Response]().
    WithBackoff(100*time.Millisecond, 10*time.Second).
    WithJitter(0.2).
    WithMaxRetries(3).
    HandleIf(func(resp *http.Response, err error) bool {
        return err != nil || resp.StatusCode >= 500
    })

circuitBreaker := failsafe.NewCircuitBreaker[*http.Response]().
    WithFailureThreshold(5, 10).
    WithSuccessThreshold(2).
    WithDelay(30 * time.Second)

executor := failsafe.NewExecutor[*http.Response](retryPolicy, circuitBreaker)
```

The jitter coefficient matters here. Without it, every client in a fleet that experiences the same downstream failure retries at the same interval, creating a thundering herd that compounds the original problem. A 20% jitter spreads retries across a window, which is the difference between a recovered service and a service that gets knocked down again as soon as it comes back up.

The scheduler was a specific resilience gap. Tombstone supports scheduled flag changes — you can say "enable this flag at 09:00 on Monday and disable it at 17:00." The v1.0 scheduler would attempt the change once. If it failed because Postgres was slow, the change was lost. v1.2.0 adds retry logic with a 1→2→4 minute backoff and marks the change FAILED after three unsuccessful attempts, which at least makes the failure visible in the audit log rather than invisible.

```sql
SELECT * FROM scheduled_changes
WHERE scheduled_at <= NOW()
  AND status = 'pending'
FOR UPDATE SKIP LOCKED
```

The `SKIP LOCKED` clause prevents duplicate execution under load. Without it, two scheduler instances running simultaneously would both acquire the same row, both execute the change, and both write audit log entries. The audit log would show the flag being toggled twice. The Merkle chain would still be valid — both entries would be legitimate mutations — but the operational reality would be confusing. `SKIP LOCKED` means only one scheduler wins the row.

The adaptive load shedding addition is worth explaining because it changes the failure mode of the system. Without it, a saturated flag-api responds slowly to everything — health checks, administrative requests, and production traffic all compete equally for resources. With an adaptive limiter, the API starts returning 503 with a `Retry-After` header when it detects saturation. This is a better failure mode: your load balancer can route around the saturated instance, your monitoring sees 503s instead of timeouts, and the system gives you a specific signal about what to do rather than a vague signal that something is slow.

## Idempotency Keys: Why They Matter for Flag Operations

The idempotency key implementation is the change I am most confident will save someone's night eventually.

The scenario it prevents: your on-call engineer sends a kill-switch request at 2am. The network is flaky. The request reaches flag-api, the kill-switch executes, the audit log is written — and then the response gets dropped on the return path. The Slack bot times out and retries. The kill-switch executes again. Now you have two audit log entries for the same kill operation, the Merkle chain has an extra link, and your post-incident timeline is wrong.

Idempotency keys close this. The client generates a key, includes it in the request header, and the server uses it to deduplicate:

```go
type IdempotencyRecord struct {
    Key        string
    Actor      string
    Endpoint   string
    Response   []byte
    StatusCode int
    CreatedAt  time.Time
}

func (s *Service) ExecuteIdempotent(
    ctx context.Context,
    actor, key, endpoint string,
    fn func() (interface{}, error),
) (interface{}, bool, error) {
    existing, err := s.store.Get(ctx, actor, key, endpoint)
    if err == nil {
        // Return stored response, skip execution
        return existing.Response, true, nil
    }

    result, err := fn()
    if err != nil {
        return nil, false, err
    }

    s.store.Set(ctx, IdempotencyRecord{
        Key: key, Actor: actor, Endpoint: endpoint,
        Response: marshal(result), StatusCode: 200,
    })
    return result, false, nil
}
```

The scope is `(actor, idempotency_key, endpoint)`. The same key used for a CreateFlag call does not collide with the same key used for a KillSwitch call from the same actor. Keys expire after 24 hours, which is long enough to cover any realistic retry window and short enough that the deduplication table does not grow unbounded.

The practical implication: the Slack bot can retry kill-switch calls aggressively without the risk of double-writing the audit log. The kill switch either fires once and returns the stored response on replay, or it fires once and the retry confirms it.

## Redis Streams DLQ and Poison Message Handling

v1.1.0 replaced Kafka with Redis Streams for flag delivery. The motivation was operational: Redis is already a dependency for rate limiting and pub/sub. Adding Kafka for flag delivery to a platform that is designed to reduce operational complexity was the wrong trade-off.

```
XREADGROUP GROUP flag-consumers consumer-1
    COUNT 10 BLOCK 5000
    STREAMS tombstone:stream:production >
```

The consumer group model gives us at-least-once delivery with consumer acknowledgment. A flag state change is not removed from the stream until a consumer explicitly ACKs it. If the consumer crashes before ACKing, the message stays pending and another consumer picks it up.

The problem we needed to solve for v1.2.0 was poison messages — messages that cause consumer processing to fail consistently. Without a DLQ, a poison message cycles through the retry logic, blocks the consumer, and eventually causes every subsequent message to back up behind it. The stream backs up. Flag state stops propagating. You get paged, but the alert says "flag delivery latency high" rather than "there is a broken message in the stream," which is not actionable.

The DLQ implementation moves a message to `tombstone:stream:{env}:dlq` after three delivery failures:

```go
func (c *Consumer) handlePoisonMessage(ctx context.Context, msg redis.XMessage) error {
    dlqKey := fmt.Sprintf("tombstone:stream:%s:dlq", c.env)
    
    _, err := c.redis.XAdd(ctx, &redis.XAddArgs{
        Stream: dlqKey,
        Values: map[string]interface{}{
            "original_id": msg.ID,
            "payload":     msg.Values["payload"],
            "error":       c.lastError(msg.ID),
            "attempts":    3,
        },
    }).Result()
    
    return err
}
```

Manual replay is a single API call:

```
POST /internal/dlq/{env}/replay
```

This re-enqueues all messages in the DLQ back into the main stream. The design is intentional: we do not auto-replay, because a poison message is often caused by a schema mismatch or a downstream service bug, and auto-replay would just re-poison the stream. Manual replay means an operator has acknowledged that the underlying issue is resolved before messages are retried.

The observable shift here is the failure mode. Before: flag state stops propagating, alert fires eventually when staleness crosses a threshold, root cause is unclear. After: poison message goes to DLQ, flag state continues propagating for all other messages, DLQ depth is a metric, root cause is visible in the DLQ entry.

## The Slack + Governance Layer

v1.1.0 was the observability release. The headline feature is a Slack interactive app with slash commands:

```
/tombstone status production
/tombstone list production --tag checkout
/tombstone kill payment-v2 production
```

The kill-switch command surfaces a Block Kit confirmation button before executing — which is the right UX for a destructive operation that your on-call engineer might be running at 2am with one eye open. The confirmation step adds maybe 3 seconds to the workflow. The alternative — a single slash command that kills a flag immediately — has a meaningful risk of misfire.

Kill-switch access is gated by `SLACK_KILL_SWITCH_ALLOWED_USERS`. This is not sophisticated RBAC, but it is the right scope for v1.1. The enforcement is: if your Slack user ID is not in the list, the handler returns an ephemeral message telling you so. The audit log records who attempted the call regardless.

The governance loop is a shell script that runs on a cron and checks two conditions:

```bash
HEALTH=$(curl -s "$API/api/v1/health" | jq '.health_score')
STALE=$(curl -s "$API/api/v1/flags?stale=true" | jq '.total')

if (( $(echo "$HEALTH < 0.80" | bc -l) )); then
    send_slack_alert "Health score dropped to $HEALTH"
fi

if [ "$STALE" -gt 50 ]; then
    send_slack_alert "$STALE stale flags detected — review recommended"
fi
```

The threshold values are intentionally conservative and configurable. A health score below 0.80 means the blast radius model is seeing conditions it considers risky. More than 50 stale flags means your flag inventory has drifted into the state that every feature-flag system eventually reaches if nobody is paying attention — a graveyard of toggles that nobody is confident enough to remove. The governance loop makes both conditions visible in Slack rather than in a dashboard that nobody has open.

The fix in v1.1.0 that we do not want to bury: the original Slack kill-switch handler was not sending an `Authorization: Bearer` header. Every Slack-initiated kill-switch call was returning 401. The Slack bot was reporting a success to the user because it was not checking the response code from the API. This was a compounding failure — wrong behavior in the sender, silent failure in the response handling, no test that covered the full path.

## Upgrade Path

If you are running v1.0, the upgrade to v1.2.1 is primarily additive. The migration changes are the part that requires care.

v1.2.0 adds two tables and an index that the scheduler and idempotency systems depend on. v1.2.1 fixes `make migrate` to apply all incremental migrations rather than just the baseline schema. If you have been running with a long-lived database, your schema is likely already correct. If you are deploying fresh — a new environment, a DR test, a staging rebuild — apply migrations explicitly before starting services:

```bash
make migrate ENV=production
```

Verify that `scheduled_changes` and `idempotency_records` exist in your schema before rolling services.

The Redis Streams consumer group needs to be created before the first consumer starts. The `tombstone:stream:{environment}` stream is created on first write, but the consumer group is not. If you are upgrading from a Kafka-based v1.0 deployment, run:

```bash
redis-cli XGROUP CREATE tombstone:stream:production flag-consumers $ MKSTREAM
```

The `MKSTREAM` flag creates the stream if it does not exist. The `$` offset means the group starts consuming from new messages rather than replaying historical state.

Idempotency keys are opt-in at the call site. Existing integrations continue to work without modification. To enable deduplication on kill-switch calls, add the header:

```
Idempotency-Key: <uuid-v4>
POST /api/v1/kill-switch
```

The key should be stable across retries of the same logical operation and unique across distinct operations. A UUID generated once per user intent and held in the retry loop is the correct pattern.

## Closing

The hardest part of this release was not the resilience engineering. Circuit breakers and retry policies are well-understood patterns. The hardest part was accepting that REG-001 and REG-002 existed at all — that the kill switch, the most critical path in the entire system, was silently broken, and that four-eyes approval, which we reviewed and merged, was unreachable in every deployment since it was written.

We found both bugs because we were writing this article and went looking for things to be proud of. That is not a process. The lesson we are taking forward is that the integration test matrix needs to cover the Slack handler path and a clean-deployment scenario explicitly. A unit test that mocks the HTTP layer cannot catch a field being sent in the wrong place. A test that assumes a pre-existing database cannot catch a migration that only applies baseline schema.

Production is not a test environment with a different URL. It is a different category of problem — slower networks, partial failures, retried requests, operators who are tired. The v1.2 resilience work builds a system that assumes those conditions rather than hoping they do not occur. The v1.2.1 fixes build a system where the critical path is actually wired up.

What is the most important thing your current feature-flag system does not do when a kill-switch call fails silently — and do you have a test that would catch it?
