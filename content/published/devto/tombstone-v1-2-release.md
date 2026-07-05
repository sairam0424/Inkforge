---
slug: tombstone-v1-2-release
title: "We Shipped Tombstone v1.0. Then We Found Nine Bugs That Would Have Paged Us at 2am."
platform: devto
status: draft-published
published_url: https://dev.to/sai_ram_0000/we-shipped-tombstone-v10-then-we-found-nine-bugs-that-would-have-paged-us-at-2am-1d2g-temp-slug-1619338
devto_id: 4072974
tags: ["devops", "opensource", "systemdesign", "go"]
cover_image: assets/tombstone-v1/cover.png
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-2-release
---

Shipping v1.0 felt good. The blast radius gates worked. The circuit-breaker audit trail held. I wrote the article, merged to main, and called it done.

What I did not expect was what the next two weeks of real-world testing would surface.

A kill switch that was silently returning HTTP 400 on every single request. Four-eyes approval endpoints that were fully implemented, reviewed, merged — and wired to routes that were never registered anywhere. A scheduler that could run the same flag change twice if you hit it hard enough. None of these triggered an alert. They just quietly failed.

This is what happened when I pressure-tested [Tombstone](https://github.com/sairam0424/Tombstone) against production reality — and what it actually took to make the thing reliable.

## What Changed Since v1.0

The v1.0 article asked one question: which flags are on right now? I answered it with blast radius scoring, Merkle-chained audit logs, and a kill switch that could shut down a feature in one API call. That was the happy path. What I underestimated was the distance between "a system that works when everything is healthy" and "a system that works when Postgres is slow, Redis drops a message, and your on-call engineer is copy-pasting a Slack command at 2am."

Three releases followed in quick succession. v1.1.0 added the operational layer I should have shipped with v1.0: Slack slash commands with Block Kit UI, a governance loop that fires when health scores degrade, and Redis Streams replacing Kafka for flag delivery. v1.2.0 was the resilience pass — exponential backoff, distributed rate limiting, idempotency keys, a real readiness endpoint. And v1.2.1 was humbling. It was the patch release that fixed things that should never have shipped broken in the first place.

I am going to tell the story in reverse order, because that is the order that mattered.

## The Bugs That Would Have Burned Us

The most uncomfortable engineering truth I know is this: you do not find out your kill switch is broken until the moment you need it. By then, the incident is already escalating.

REG-001 was exactly that kind of bug. The Slack kill-switch integration in v1.1.0 was sending the `environment` field as a URL query parameter instead of a JSON body. The flag-api handler expected it in the body. Every request returned HTTP 400. The status codes were not surfaced anywhere meaningful. If you had triggered a kill switch from Slack during an incident, it would have appeared to accept your input — Block Kit confirmation dialog, the whole flow — and then silently done nothing. The flag would have stayed enabled. Your service would have kept degrading.

REG-002 is the one that bothered me more. Four-eyes approval is the entire governance story for high-blast-radius changes — the idea that certain flag modifications require a second human sign-off before execution. The implementation was complete. The handlers were written, tested, code-reviewed, and merged. What nobody caught was that `flag-api/cmd/main.go` never registered the routes. Three endpoints, fully built, completely unreachable in every deployment since the feature was introduced. If you had called `POST /flags/{id}/approvals`, you would have gotten 404. The four-eyes approval flow was dead on arrival.

I found both of these in the same audit pass. That audit pass only happened because I was writing this article and went looking for things to be proud of. I found things to fix instead.

The other v1.2.1 fixes were smaller but tell a similar story. `make migrate` only applied the baseline schema, so fresh deployments would crash immediately with "relation scheduled_changes does not exist." The Datadog auto kill-switch integration was sending no Authorization header, silently 401ing on every call. The `/readyz` health probe was not in the rate limiter's exempt paths, so Kubernetes probes were getting 429 responses under load — meaning the cluster thought your pods were unhealthy precisely when they were under stress. The audit log `actor` field was always logging as "unknown" because of a context key type mismatch introduced months earlier. CI tests were using `|| true` on test commands, which meant failures were not actually blocking merges.

None of these were exotic. They were the ordinary things that slip through when you are moving fast and your integration tests are testing whether a function was called rather than whether the system did what you intended.

The fix for REG-001 was a one-line body marshaling correction. The fix for REG-002 was three route registrations in main.go. The cost of not having them was every kill-switch invocation and every approval request silently failing in production.

## Resilience as a Feature, Not an Afterthought

Once the critical fixes were in, I turned to the harder architectural work: making Tombstone behave correctly under realistic failure conditions.

The v1.2.0 resilience pass touched every service. The through-line was a single observation: v1.0 assumed its dependencies would be available. It had no retry logic, no circuit breakers on outbound calls, no backpressure mechanism, and no way to tell Kubernetes whether it was actually ready to serve traffic. These are not edge cases in production. They are Tuesday.

The most impactful addition was idempotency keys on all mutation endpoints: `CreateFlag`, `UpdateEnvironment`, and `KillSwitch`. Every request can now include an `Idempotency-Key` header. The first call executes normally and persists the response. Any subsequent call with the same key, same actor, and same endpoint returns the stored response immediately with no side effects. No duplicate audit rows. No double-execution.

This matters most for kill switches. Network retries are real. If an on-call engineer's Slack client resends a failed request, or if your HTTP client retries on a 5xx, you need the system to behave as if the call happened exactly once. Before idempotency keys, a retried kill switch would write two audit entries and potentially trigger two downstream events. Now it writes one, returns the same response, and logs the deduplication. The key is scoped to the tuple of `(actor, idempotency_key, endpoint)` so keys do not collide across different callers or different operations.

The second major addition was dependency-aware `/readyz` endpoints across all six services. Kubernetes' readiness probe is only useful if it reflects actual readiness — whether Postgres is reachable, whether Redis responds, whether the service can actually do work. v1.0's readyz returned 200 unconditionally. v1.2.0's readyz checks both Postgres and Redis with a three-second timeout and returns a structured JSON response with per-dependency status. If either check fails, the pod reports not-ready and traffic stops routing to it.

There was one detail I got wrong in the first implementation: the readyz endpoint itself was subject to the rate limiter. Under load, Kubernetes probes were getting 429 responses, which caused pods to be marked unhealthy, which caused traffic to shed, which increased load on the remaining pods, which caused more 429s on probes. I caught this before it hit production, but barely. The fix was adding `/readyz` to the rate limiter's exempt path list, alongside `/metrics` and `/healthz`.

The distributed rate limiter itself was a meaningful upgrade. v1.0 used per-process in-memory counters. This is fine with one replica. With three replicas behind a load balancer, each process thinks it has seen one-third of the actual traffic. You can be three times over your intended rate limit and none of the three instances knows it. v1.2.0 replaces this with a Redis Lua script that runs atomically across replicas. The script increments a key, sets a TTL if it did not exist, and returns both the current count and the limit in one round trip. Because it is a single Lua script, Redis executes it atomically — no race between the read and the increment.

For the scheduler, I added `SELECT FOR UPDATE SKIP LOCKED` to the job-claim query. This is the standard pattern for preventing duplicate execution in a Postgres-backed queue: the first worker to claim a row locks it; any concurrent worker that tries to claim the same row gets an empty result set and moves on. The scheduler also now retries failed scheduled changes three times with one-minute, two-minute, and four-minute delays before marking the change as FAILED and alerting. Previously, a transient Postgres timeout would permanently orphan a scheduled flag change with no retry and no notification.

The Redis Streams dead-letter queue closed a class of silent data loss I had been ignoring since v1.1.0. When a message fails delivery three times, it moves to `<stream>:dlq` instead of being dropped. A single `POST /internal/dlq/{env}/replay` brings it back into the main stream. This turns invisible data loss into a recoverable operational event with a clear paper trail.

## Slack + Governance: The Operational Layer

v1.1.0 was the release that made Tombstone usable by someone who is not staring at a terminal. The core addition was a Slack interactive app: `/tombstone status`, `/tombstone list`, `/tombstone search`, and `/tombstone kill` — all with Block Kit UI, interactive buttons, and a confirmation dialog for destructive operations.

The kill-switch path from Slack is gated by `SLACK_KILL_SWITCH_ALLOWED_USERS`. Only engineers on that list can confirm a kill action from the Block Kit dialog. This is not a replacement for four-eyes approval — it is a separate operational guardrail for the people who have the authority to act in an emergency.

The governance loop was the other significant v1.1.0 addition. `scripts/loop-governance.sh` polls the health score endpoint on a configurable interval and fires a Slack alert when the health score drops below 0.80 or when stale flag count exceeds 50. This is the piece that closes the feedback loop: blast radius scoring and Merkle chains tell you the state of the system; the governance loop tells you when that state is drifting in a direction you need to act on.

Redis Streams replaced Kafka as the flag delivery mechanism. Kafka was operationally heavy for what Tombstone was doing with it. Redis Streams gives you consumer groups, delivery acknowledgment, and persistent history without the cluster overhead. The stream key is `tombstone:stream:{environment}`. Consumers use XREADGROUP for at-least-once delivery semantics, and unacknowledged messages surface in the DLQ after three failed attempts.

The v1.1.0 test additions are worth mentioning separately. Merkle chain integrity across a full flag lifecycle, blast radius tier classification with boundary values, SSE multi-client broadcast under concurrent connections, and mTLS PKI chain validation — these are the tests that found the Merkle formula mismatch in `scheduler.go` before it reached production. The formula had been wrong since v1.0, but it only surfaced when we added a cross-service integrity test that validated the scheduler's chain against the flag-api's canonical formula. They did not match. Two different implementations had drifted apart silently, and the audit trail was lying about integrity without knowing it.

## What I Got Wrong

The easiest mistake to identify is the one I made most visibly: I shipped REG-001 and REG-002. A kill switch that does nothing and an approval flow that is unreachable are not acceptable in a system whose entire value proposition is operational control under pressure.

But the deeper mistake was the assumption underneath them. I was validating the implementation — does the handler do the right thing when called? — not the integration — can the handler actually be reached? Unit tests for route handlers do not catch missing route registrations. Integration tests that mock the HTTP layer do not catch body-vs-URL-param serialization bugs. The test suite was passing because it was testing something slightly different from what production was doing.

The right fix is not "write more tests." The right fix is to run an end-to-end test against a real HTTP server on every CI run for every mutation endpoint. Not a handler test. Not a mock. A real `curl` against a real binary, asserting the response body, status code, and side effects. If I had that for the kill-switch endpoint, REG-001 would have been caught before the PR was opened.

The second thing I got wrong was treating resilience as a later concern. Exponential backoff and idempotency keys are not hard to add. The circuit breaker pattern with failsafe-go is well-understood. I knew all of this in v1.0. I deferred it because the happy path was working and the release was late. That is exactly the wrong trade-off to make in a system that people will rely on when things are already going wrong. The whole point of Tombstone is to be the thing you reach for when your feature flag is causing a 2am incident. If Tombstone itself has a silent failure mode in that moment, it is worse than not having it.

The third mistake was the governance loop being an external script rather than a first-class API. `loop-governance.sh` works, but it is a polling script that has to run somewhere. It is not instrumented, not recoverable, and not integrated with the same reliability guarantees as the services it monitors. The right architecture puts the governance loop inside a service with a proper job scheduler, persistent state, and a `/governance/status` endpoint. That is on the backlog.

## Upgrade Path

If you are running Tombstone v1.0 or v1.1.0:

```bash
git pull origin main
make migrate
make build
make dev
```

The migration in v1.2.0 adds the `idempotency_keys` table and the `scheduled_changes` table if it is missing. `make migrate` now applies all pending migrations in order rather than only the baseline.

If you are running v1.1.0, the Redis Streams consumer group will be created automatically on first connection. Existing Kafka configuration is still read if present but is no longer required. You can remove the Kafka broker from your Docker Compose file safely.

The `SLACK_KILL_SWITCH_ALLOWED_USERS` environment variable is new in v1.1.0 and required if you are using the Slack integration. The kill-switch confirmation button will reject requests from users not on the list.

The full changelog, open issues, and contribution guide are at [github.com/sairam0424/Tombstone](https://github.com/sairam0424/Tombstone).

## What Is Your Kill Switch Actually Doing?

I ask this not rhetorically. REG-001 existed in a deployed system for weeks. The kill switch appeared to work. The Slack flow was smooth. The confirmation dialog fired. And the flag never changed.

The question that came out of this for me: what is the most important thing your current feature-flag system does not do when a kill-switch call fails silently — and do you have a test that would catch it?

Not a unit test. Not a mock. A test that makes the actual call, checks the actual response, and verifies the actual side effect in the actual database.

If the answer is no, that is probably the most important thing you could build this week. Not because silent failures are exotic — but because they are the default when you are not explicitly testing for them. Production is not a test environment with a different URL. It is a different category of problem. And the only way to close the gap is to stop assuming your implementation matches your intent, and start verifying it.
