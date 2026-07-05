---
slug: tombstone-v1-2-release
title: "I Shipped a Feature Flag Platform, Then Found 9 Bugs That Would Have Caused Incidents"
platform: medium
status: draft
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-2-release
tags: ["DevOps", "Open Source", "Software Engineering", "Programming", "Technology"]
cover_image: assets/tombstone-v1/cover.png
---

Shipping v1.0 felt good. The blast radius gates worked. The circuit-breaker audit trail held. I wrote the article, merged to main, and called it done. What I did not expect was what the next two weeks of real-world testing would surface: a kill switch that was silently returning HTTP 400 on every request, four-eyes approval endpoints that were wired up and reviewed and merged — and completely unreachable because nobody registered them in the router. A scheduler that could run the same flag change twice under load. None of these triggered an alert. They just quietly failed. This is the story of what happened when I pressure-tested Tombstone against production reality, and what it took to make it actually reliable.

## A Quick Refresher on What Tombstone Is

Tombstone is a production intelligence layer for feature flags — the part of the stack that answers the question you ask at 2am when something breaks: which flags are on right now, what changed in the last ten minutes, and can I shut it down in one command without waking anyone else up?

The v1.0 release shipped blast radius scoring (a numeric estimate of how many users a flag change could affect), Merkle-chained audit logs that make tampering detectable, a kill switch that could take down a feature in a single API call, and a circuit-breaker that would auto-rollback when error rates crossed a threshold. The architecture is six services: flag-api, gateway, evaluator, intelligence (Python), dashboard (React), and CLI. The GitHub repository is at [github.com/sairam0424/Tombstone](https://github.com/sairam0424/Tombstone).

The pitch was honest: if the Knight Capital incident taught the industry anything, it was that a stale flag evaluated on the wrong server at the wrong moment can cost you $440 million in 45 minutes. Tombstone was designed to make that scenario visible and stoppable. What I underestimated was the gap between a system that works when everything is healthy and a system that works when Postgres is slow, Redis drops a message, and your on-call engineer is pasting a Slack command at 2am.

## The Post-Launch Reality Check

Two weeks after the v1.0 article went up, I started writing integration tests that crossed service boundaries. The kind of tests that ask: if I trigger a kill switch via Slack, does the audit log actually record it? If the scheduler fires a flag change and the database is under load, does it run once or twice?

The Slack kill switch test failed immediately. Not with an assertion error — with an HTTP 400. I dug in. The Slack app was sending the environment as a URL parameter (`?environment=production`) instead of in the JSON request body. The kill switch handler expected a JSON body. Every single Slack-initiated kill switch had been silently returning 400 since the integration launched. The primary on-call path — the one where an engineer types `/tombstone kill my-flag production` at 2am — was broken. It had been broken in every environment since deployment.

I found REG-002 in the same audit pass. Four-eyes approval is the feature that requires two distinct engineers to approve a high-blast-radius flag change before it goes live. I had implemented it, written tests for it, reviewed it, and merged it. What I had not done was register the three approval endpoints in `flag-api/cmd/main.go`. They were never mounted on the router. Every call to approve or reject a flag change had been returning 404 in production since day one. The entire approval flow was dead on arrival in every deployment.

These are not exotic race conditions. These are not timing bugs that appear under specific load profiles. These are the ordinary things that slip through when you are moving fast and your integration tests are testing whether a function was called rather than whether the HTTP endpoint it lives behind actually works.

## What v1.2.1 Actually Fixed

The v1.2.1 patch addressed five critical issues, and I want to be direct about each one because I think burying them in a changelog does nobody any good.

REG-001 and REG-002 I described above. Both are fixed: the Slack kill switch now sends environment in the JSON body, and the four-eyes approval endpoints are registered. The fix for REG-001 is three lines. The fix for REG-002 is six lines. The damage they could have caused is unbounded.

The third issue was in the migration runner. `make migrate` was only applying the baseline schema. Fresh deployments were crashing with "relation scheduled_changes does not exist" because the migration that creates the scheduled changes table was never running. Anyone who stood up a fresh Tombstone instance from the v1.0 or v1.1 source had a broken scheduler from day one.

The fourth was the Datadog auto kill-switch integration — the feature that lets Tombstone watch a Datadog monitor and automatically roll back a flag when error rates spike. It was sending HTTP requests with no Authorization header. Silently getting 401. Silently doing nothing. The auto-rollback path you would rely on at 3am was inert.

The fifth was the Kubernetes readiness probe. The `/readyz` endpoint I had added in v1.2.0 to tell Kubernetes whether a pod was ready to receive traffic — it was not in the rate limiter's exempt paths. Under load, Kubernetes probes were hitting the rate limiter and getting 429. Kubernetes was marking healthy pods as unready and pulling them from rotation. The health check was causing the service to look sick.

I also fixed an audit log bug where the actor field was recording "unknown" on every entry. The context key had a type mismatch — the middleware was setting the actor with a string key, the handler was reading it with a typed key, and Go's context package treats those as different keys. Every audit record in every v1.0 and v1.1 deployment has "unknown" as the actor. That audit trail you were relying on to answer "who changed this flag" was not answering the question.

## Making the Platform Production-Grade

The v1.2.0 release, which shipped the same day as v1.2.1, was a different kind of work. Not bug fixes — architectural additions that I had convinced myself were premature optimization in v1.0.

The most consequential was idempotency keys. Every mutation endpoint — CreateFlag, UpdateEnvironment, KillSwitch — now accepts an `Idempotency-Key` header. The key is scoped to the tuple of actor, key value, and endpoint. If you replay a request with the same key, you get back the stored response and no duplicate side effects. No duplicate audit rows. No double flag creation. The stored response includes the HTTP status code and body from the original call.

This matters most for the kill switch. In a real incident, engineers paste commands, retry failed requests, and operate under time pressure. Without idempotency, a kill switch retried under a flaky network could write two audit rows, trigger two Slack notifications, and confuse the blast radius calculator about the current state. With idempotency keys, the second call returns the stored result from the first — the flag is killed exactly once, the audit log has exactly one entry, and the Merkle chain stays clean.

The resilience additions followed a similar logic. All inter-service HTTP calls now go through a failsafe-go client with exponential backoff, jitter, and a per-client circuit breaker. The scheduler retries scheduled changes up to three times (at one, two, and four minutes) before marking them FAILED. `SELECT FOR UPDATE SKIP LOCKED` prevents two scheduler workers from picking up the same job simultaneously under load. Every reconnect loop — Redis pub/sub, Redis Streams, SSE relay — now applies ±20% jitter to avoid thundering herd on restart.

I added a snapshot reconciliation loop to the gateway: every five minutes, it polls the flag-api for a full snapshot and broadcasts deltas to connected clients. This closes a gap I had acknowledged but deferred in v1.0: if the gateway misses a flag update event (Redis blip, network partition, pod restart), connected clients could hold stale flag state indefinitely. The reconciliation loop makes stale state self-healing with a bounded recovery window.

The Redis Streams consumer group now has a dead-letter queue. Messages that fail three delivery attempts go to `<stream>:dlq` instead of disappearing. A POST to `/internal/dlq/{env}/replay` brings them back. This turns a class of invisible data loss — poison messages silently dropped — into a recoverable operational event you can see and act on.

## The Operational Layer I Skipped in v1.0

V1.1 was where I admitted that Tombstone needed an operational surface that engineers could actually use when things went wrong — not just an API, but a channel.

The Slack integration ships three slash commands: `/tombstone status` shows current health scores and stale flag counts, `/tombstone kill <flag> <environment>` fires the kill switch with a Block Kit confirmation button (and is gated by `SLACK_KILL_SWITCH_ALLOWED_USERS`), and `/tombstone list` returns the top flags by blast radius. The commands are interactive. The kill switch requires an explicit confirm click before it does anything. The confirmation message includes the blast radius score and the number of affected users so the engineer can make an informed decision under pressure.

The governance loop runs as a shell script you can schedule via cron or a systemd timer. It calls the Tombstone health API, and if the health score drops below 0.80 or the stale flag count exceeds 50, it fires a Slack alert with a direct link to the dashboard. The script is deliberately minimal — thirty lines of bash, no dependencies beyond curl and jq. I made it a shell script rather than a service because I wanted it to be something you could read and modify in five minutes without understanding the rest of the codebase.

I also replaced Kafka with Redis Streams as the default flag delivery transport. Kafka is operationally heavy for a team running five or six services. Redis Streams gives you consumer groups, delivery acknowledgment, and persistent message history with a much lower operational burden. Kafka remains supported as an opt-in, but the default out-of-the-box experience no longer requires a Kafka cluster.

V1.1 also extended the test suite in ways that v1.0 had deferred. Merkle chain integrity tests now verify the cross-service chain consistency — the same hash formula must produce the same result in the scheduler, the flag-api, and the audit service. The Merkle chain formula mismatch I mentioned earlier (where `scheduler.go` was using a different formula than `flags.go`) was present since v1.0. It only surfaced when I wrote a test that compared hash values across the service boundary.

## What Surprised Me

The kill switch bug surprised me the most, and not for the obvious reason.

The obvious reason is that the primary on-call path was broken. That is bad. But what surprised me was how it got through. The unit tests for the kill switch handler passed. The function was called correctly in isolation. The integration test for the Slack app tested that the Slack event was received and dispatched. What the tests were not testing was whether the HTTP call from the Slack handler to the flag-api actually used the right request format.

This is the gap between "we have tests" and "we have tests that would catch the failure mode that matters." A kill switch that works in unit tests and fails in production is not a test coverage percentage problem — it is a test design problem. The test was asserting that a function was called. The thing that needed to be asserted was that an HTTP request was sent with a JSON body containing the environment field.

The four-eyes approval issue surprised me in a different way. The code was reviewed. Multiple people looked at the implementation. Nobody caught that the routes were not registered because the review was scoped to the handler logic, not to the startup sequence. Route registration lives in `main.go`, which is often treated as boilerplate. It is not boilerplate. It is the wiring. A perfectly implemented handler connected to nothing is the same as no handler.

The secondary surprise was how many of the v1.2.0 resilience additions exposed assumptions that were baked into v1.0. The scheduler had no retry logic because I had assumed scheduled changes would succeed on the first attempt. The Merkle chain formula mismatch had been present since the beginning because I had not written a test that compared hash values across services. The audit log actor mismatch had been present since the beginning because I had not written an end-to-end test that verified what was actually stored in the database after a real HTTP request.

Production is not a test environment with a different URL. It is a different category of problem. The tests you write tell you what you thought about. Production tells you what you forgot to think about.

## How to Upgrade

If you are running v1.0 or v1.1, the upgrade path is straightforward. Pull the latest code, run `make migrate` (which now correctly applies all pending migrations including the scheduled_changes table), and restart the services.

If you have fresh deployments from earlier versions, check whether your audit logs have "unknown" in the actor field. If they do, the fix is in place in v1.2.1 — new entries will record the correct actor. Existing "unknown" entries reflect genuine data loss; there is no backfill.

If you are using the Slack kill switch integration, update your Slack app's event subscriptions and redeploy. The fix is in the handler — no client-side changes needed.

If you are using four-eyes approval, note that the endpoints were never accessible before v1.2.1. They are now registered and functional. Test the flow in a staging environment before relying on it in production.

If you are using the Datadog auto kill-switch, you need to set `DATADOG_API_KEY` and `DATADOG_APP_KEY` in your flag-api environment. The integration was sending requests without credentials. It will now authenticate correctly.

For Kubernetes operators: the `/readyz` endpoint is now exempt from rate limiting. Update your readiness probe path to `/readyz` if you have not already. The endpoint checks Postgres and Redis with a three-second timeout and returns a structured JSON response with the status of each dependency.

## What is the most important thing your feature-flag system does not do when a kill-switch call fails silently — and do you have a test that would catch it?

I spent two weeks building Tombstone v1.0 to answer the question of which flags are on right now. I spent the following two weeks discovering that a significant portion of the answer I built was unreachable, wrong, or silent. The bugs were not subtle. They were in the most critical paths: the kill switch, the approval flow, the audit trail, the health check.

The work in v1.1 and v1.2 makes Tombstone something I would feel comfortable running in a real production environment. The Slack integration means your on-call engineer has a channel they can use without navigating a dashboard at 2am. The idempotency keys mean a retried kill switch does exactly what you intended, once. The DLQ means a dropped message becomes a recoverable event instead of invisible data loss. The `/readyz` endpoint means Kubernetes can make informed routing decisions rather than guessing.

But the most useful thing I did was the audit pass I ran because I was writing this article and went looking for things to be proud of — and found things to fix instead. If you are running any feature-flag system, internal or external, the question I would ask is the one at the top of this section. What happens when the kill-switch call fails silently? Is there an alert? Is there a log entry? Is there a test? The answer to that question will tell you more about your operational posture than any dashboard metric.

Then confirm the file was written successfully.
