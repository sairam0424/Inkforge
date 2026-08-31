---
slug: tombstone-v1-2-release
title: "We Shipped Tombstone v1.0. Then We Found Nine Bugs That Would Have Paged Us at 2am."
platform: substack
status: draft
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-2-release
paste_workflow: "SUBSTACK PASTE: Run python3 /tmp/render-substack-tombstone-v12.py"
---

Shipping v1.0 felt good. The blast radius gates worked. The circuit-breaker audit trail held. We wrote the article, merged to main, and called it done.

What we did not expect was what the next two weeks of real-world testing would surface.

A kill switch that was silently returning HTTP 400 on every request. Four-eyes approval endpoints that were wired up, reviewed, merged — and never registered in the router, making them completely unreachable. A scheduler that could run the same flag change twice under load. An audit log that was stamping every actor as "unknown" because of a context key type mismatch nobody caught in code review.

None of these triggered an alert. They just quietly failed.

This is the story of what happened when we pressure-tested Tombstone against production reality — and what it took to make it actually reliable. v1.1 brought observability and Slack-native operations. v1.2 and v1.2.1 forced a harder conversation about the gap between a system that works and a system that works when things go wrong.

---

## What Broke After v1.0

The v1.0 article asked a single question: which flags are on right now? We answered it with blast radius scoring, Merkle-chained audit logs, and a kill switch that could shut down a feature in one API call. That felt complete. It was not.

The first thing we found was the Slack integration. v1.1 shipped `/tombstone status`, `kill`, `list`, and `search` as Slack slash commands with Block Kit UI — a real operational interface, not just an API. The kill switch confirm button was gated by `SLACK_KILL_SWITCH_ALLOWED_USERS`. It looked correct. It was broken. The Slack kill switch was sending the environment as a URL parameter instead of a JSON body, which meant every kill-switch call from Slack returned HTTP 400. Silently. No error surfaced in the logs in a way that made this obvious. The primary on-call path — the one your engineer reaches for at 2am — was broken from the first day it was deployed.

That is REG-001. We will get to REG-002 in a moment.

The second thing we found was Kafka. v1.0 used Kafka for flag delivery to the gateway. Under the conditions where Tombstone actually matters — network partitions, broker restarts, the infrastructure hiccups that happen on the same nights as your incidents — Kafka was a liability we did not need. v1.1 replaced it with Redis Streams using a consumer group model. Stream key: `tombstone:stream:{environment}`. Kafka became optional. This also meant flag delivery could run without a separate broker dependency, which simplified the deployment story considerably.

The third thing we found was the scheduler. It had no retry logic, because we assumed scheduled changes would always succeed. That assumption is fine in a demo. In production, Postgres is occasionally slow, Redis occasionally drops a connection, and your scheduled flag change from 11pm needs to actually fire. More concerning: under load, the scheduler could pick up the same row twice. There was no `SELECT FOR UPDATE SKIP LOCKED`. A flag that was supposed to go from 20% rollout to 100% at midnight could do it twice, writing two audit rows, creating a confusing history that would take an engineer several minutes to untangle at 2am when the alert fired.

These are not exotic edge cases. They are the ordinary things that slip through when you are moving fast and the happy path always works in CI.

---

## The Three Things v1.2 Fixed

When we sat down to write the v1.2 release notes, we did an audit pass first. We went looking for things to be proud of. We found things to fix instead. Here are the three that mattered most.

**Idempotency keys on all mutation endpoints.** CreateFlag, UpdateEnvironment, and KillSwitch now accept an `Idempotency-Key` header. A replayed request returns the stored response with no duplicate audit rows, scoped to `(actor, idempotency_key, endpoint)`. The implementation is straightforward — you hash the key and endpoint, look it up in a small idempotency table, return the cached response if it exists, otherwise execute and cache. What it gives you operationally is significant: a kill-switch retried under a flaky network does exactly what you intended, once. No double audit rows. No ambiguous history. No engineer at 2am wondering whether the flag is actually off or whether the system just said it was.

```
POST /api/flags/kill-switch
Idempotency-Key: kill-payment-rollout-2026-07-05T02:14:00Z
Authorization: Bearer ...

{"flag_key": "payment_v2_rollout", "environment": "production"}
```

Replay that request ten times on a flaky connection. You get the same response. One audit row.

**Dependency-aware `/readyz` across all six services.** The old health endpoint told Kubernetes the process was alive. It said nothing about whether the process could actually do anything useful. v1.2 adds a real readiness check: Postgres and Redis are checked with a 3-second timeout. If either is unreachable, the pod reports not ready. Kubernetes stops routing traffic to it. This is how you prevent a pod that is connected to nothing from accepting requests and returning confusing errors.

There was a small embarrassment in the original implementation: the `/readyz` endpoint itself was not in the rate-limiter exempt paths. So under load, Kubernetes readiness probes were getting 429 or 503 responses, marking pods as not ready, pulling them from rotation — which increased load on the remaining pods, which caused more 429s, which pulled more pods. A cascading failure triggered by health checks. The v1.2.1 patch adds `/readyz` to the exempt list.

**Redis Streams DLQ with manual replay.** This one is quiet, but it is the difference between "something went wrong and we have no idea what" and "something went wrong and we have a recoverable queue of exactly what failed." Poison messages — events that fail three delivery attempts — now go to `<stream>:dlq` instead of disappearing. A single API call brings them back:

```
POST /internal/dlq/production/replay
```

That turns a class of invisible data loss into a recoverable operational event. Before this, if a flag delivery failed three times, it was gone. You might notice the flag was not propagating to some environments. You would have no record of what failed or when. Now you have a dead-letter queue you can inspect, replay, or discard deliberately.

---

## The Operational Layer We Should Have Had on Day One

The honest version of this section is: v1.1 and v1.2 built the operational layer that v1.0 should have shipped with.

The governance loop is the clearest example. `scripts/loop-governance.sh` runs on a schedule and sends Slack alerts when the health score drops below 0.80 or the stale flag count exceeds 50. This is a script. It is not sophisticated. But it means a flag health degradation that previously would surface as a 2am page — because something downstream behaved oddly due to a stale flag — now surfaces as a Slack alert the afternoon before. That shift from reactive to proactive is worth more than most features.

The resilient HTTP client is the second example. Every inter-service call in Tombstone now goes through `failsafe-go` with exponential backoff, jitter, and a per-client circuit breaker. The flag-api and evaluator have adaptive load shedding — when they are saturated, they return 503 with a `Retry-After` header instead of accepting requests they cannot honor. Reconnect loops (Redis pub/sub, Streams, SSE relay) add ±20% jitter so that after a Redis restart, all services do not reconnect simultaneously and immediately saturate the connection pool.

None of this is novel. Retry with jitter, circuit breakers, load shedding — these patterns have been documented for years. What is notable is how easy it is to ship a v1.0 without them, because on the happy path they make no difference. Your CI passes. Your integration tests pass. Your demo works. It is only under the conditions that actually matter — Postgres slow, Redis restarting, on-call engineer typing fast — that the absence of these patterns becomes visible.

The Merkle chain formula mismatch in `scheduler.go` is a concrete example of this. The formula for computing the Merkle chain hash had been wrong in the scheduler since the beginning. It diverged silently from the canonical formula in `flags.go`. Every audit entry written by the scheduler had an incorrect chain link. This would only surface if you ran a cross-service integrity audit — which nobody did, because the system appeared to work. v1.2 fixed the formula. We wrote a cross-service integrity test that will catch this class of divergence going forward.

REG-002, the four-eyes approval routing bug, is the most humbling entry in this changelog. The entire approval flow — dual-approval requirement for high-blast-radius flags, the endpoint to submit approval, the endpoint to query pending approvals — was implemented, reviewed, merged, and deployed. It was also completely unreachable, because none of the three routes were registered in `flag-api/cmd/main.go`. Every deployment since the PR merged had been running without the approval flow. We found it in the same audit pass that found REG-001.

The lesson is not "register your routes" — that is obvious in retrospect. The lesson is that code review and CI cannot catch the gap between "this code is correct" and "this code is connected." That gap lives in integration tests and in audit passes like the one that found both bugs in an afternoon.

---

## How to Upgrade

If you are running v1.0 or v1.1, the v1.2.1 upgrade is straightforward. Pull the latest image, apply migrations, restart services.

```
git pull origin main
make migrate
make dev
```

The `make migrate` fix in v1.2.1 is important: the v1.0 and v1.1 migrate target only applied the baseline schema. Fresh deployments on v1.2 before the patch would crash with "relation scheduled_changes does not exist." The patch applies all migration files in sequence. If you are upgrading an existing deployment rather than doing a fresh install, your schema is already correct and the fix is a no-op.

Two configuration additions for v1.2:

```
# Idempotency table (applied via make migrate automatically)
# No manual steps required

# Readyz exempt paths — already patched in v1.2.1
# /readyz, /healthz, /metrics are exempt from rate limiting

# Redis DLQ stream key convention
# <stream>:dlq — no configuration required, automatic
```

The `pyod>=0.9.0` dependency that was blocking `uv sync` on Python 3.12 is removed. If you were seeing install failures in the intelligence service, that is resolved.

Full changelog and migration notes: [github.com/sairam0424/Tombstone](https://github.com/sairam0424/Tombstone)

---

## Closing Question

The v1.0 article ended by asking which flags are on right now. v1.2 asks a harder question.

The kill switch we shipped in v1.0 worked in unit tests, passed CI, and was broken in production because it was sending the environment in the wrong field of the request. The approval flow worked in unit tests, passed code review, and was inaccessible because nobody registered the routes. Both bugs lived in production from the day they were deployed until an audit pass found them two weeks later.

We found them because we were writing this article and went looking for things to be proud of.

Production is not a test environment with a different URL. It is a different category of problem. The systems you rely on at 2am are not the systems you tested at 2pm. They are the same code running under different conditions — slower dependencies, retried requests, Kubernetes probes hitting a rate-limited endpoint, a scheduler racing itself under load.

So here is the question I am leaving with you:

**What is the most important thing your current feature-flag system does not do when a kill-switch call fails silently — and do you have a test that would catch it before it pages you at 2am?**
