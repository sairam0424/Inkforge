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
  !! STOP — DO NOT PASTE THE .md FILE INTO SUBSTACK !!
  =====================================================
  Substack does NOT accept Markdown. Asterisks and # symbols paste as
  literal characters. This is confirmed by 102-agent deep research (June 2026).

  USE THE HTML FILE INSTEAD:
    content/published/substack/feature-flags-at-scale.html

  Workflow:
  1. Open feature-flags-at-scale.html in your browser (double-click it)
  2. Cmd+A → Cmd+C (select all, copy)
  3. In Substack editor body: Cmd+V (paste)
  4. All formatting will render correctly (HTML clipboard = TipTap-compatible)

  This .md file is kept as a reference only.
-->

<!-- =========================================================
     SUBSTACK TITLE (enter in Title field, not article body)
     Feature Flags at Scale: The Complete Engineering Guide
     
     SUBTITLE (enter in Subtitle field)
     How Google, Meta, Netflix, and Uber treat feature flags as a distributed control plane — and why your system should too.
     ========================================================= -->

<!--
  HOW TO PASTE INTO SUBSTACK (important — read first)
  =====================================================
  Substack's Markdown mode is unreliable. Use the DEFAULT rich text editor instead:
  1. Go to your post → make sure editor is in default (NOT Markdown) mode
  2. Copy ONLY the content between PASTE START and PASTE END below
  3. Paste into the body — it will paste as clean plain text
  4. Manually bold section titles: select the ALL-CAPS heading → click Bold button
  5. Bullet points use the • character — they paste as visual bullets automatically
  
  DO NOT switch to Markdown mode. It breaks bold, dashes, and horizontal lines.
-->

<!-- ==================== PASTE START ==================== -->

In 2012, Knight Capital lost $440 million in 45 minutes. The root cause: a feature flag that was never deleted.

Not a trading algorithm bug. Not a network outage. A stale flag reactivated during deployment, routing live orders through dormant code. The blast radius was irreversible.

That's your hook into why feature flags at scale are not a trivial problem — and why the engineers at Google, Meta, Netflix, and Uber have all independently arrived at the same architecture to solve it.


TL;DR

• Feature flags at scale are a distributed control plane, not config files
• User traffic must never block on a remote flag service call — local evaluation only
• Push-based distribution — pull creates thundering herds at scale
• Kill switches evaluate before any targeting rule — no user context dependency
• Flag lifecycle enforcement (expiry dates, owners, auto-cleanup) is a correctness property, not housekeeping
• The same architecture emerges independently at Google, Meta, Netflix, and Uber


THE CORE CONSTRAINT THAT DRIVES EVERYTHING

One principle underlies every architectural decision in a mature flag system:

"Never make user traffic depend on a remote flag service call."

A synchronous RPC per flag evaluation injects 10–50ms of tail latency at p99. Netflix competes on streaming start times measured in hundreds of milliseconds. Meta serves billions of requests per second. A remote flag call is a non-starter — it couples your request path to the availability and latency of an external system.

The solution: local evaluation backed by an async synchronization layer. The flag state lives in-process, in memory, always fresh within a propagation window. Evaluation is a pure function — no I/O, no locks. Sub-millisecond.

[IMAGE: Control plane / data plane architecture — two boxes connected by a PUSH arrow via Distribution Service]


TWO PLANES, TWO CONTRACTS

The most important architectural insight: the control plane and the data plane have opposite optimization targets.

Control Plane — slow, safe, strongly consistent

The flag authoring path flows: UI → validation engine → strongly-consistent store → distribution service. Write latency of hundreds of milliseconds is acceptable. A misconfigured targeting rule crashing a canary population is not. This path is correctness-prioritized.

Data Plane — fast, local, eventually consistent

An embedded SDK in every service instance. In-memory snapshot of all flag configurations. Pure evaluation function: no network I/O, no locks on the hot path.

The consistency divergence is intentional. Meta's Gatekeeper operates with a 30–60 second propagation window. That staleness is acceptable — it's the unavoidable cost of local evaluation. Staleness-during-outage is not acceptable, which is why every SDK maintains a snapshot that survives network partitions.

Why push, not pull?

Flip a high-traffic flag and 10,000 service instances' poll timers fire within the same jitter window. You've created a coordinated spike against your config store at exactly the moment the system is under change-induced stress. Push-based distribution maintains persistent connections and fans out diffs on change. Convergence in seconds — not polling intervals.


THE 5 MISTAKES ENGINEERS MAKE WITH FEATURE FLAGS

These failure modes appear repeatedly across organizations of every size.

1. Treating flags as simple config

When a flag returns {"timeout_ms": 3000} you're no longer doing feature gating — you're doing remote configuration. The boundary dissolves, and correctness bugs only surface during partial rollouts.

2. Non-deterministic percentage rollouts

Rollouts must use hash(user_id) % 100 — not random(). At a fintech, two SDK versions in parallel deployment used different hash seeds. Same user_id, different buckets, alternating UI states on page refresh. Three days to diagnose. One-line fix. Uninterpretable A/B data for the entire window.

3. Conflating fail-open and fail-closed

These are per-flag contracts, not a system default. A kill switch for fraud detection should fail-closed. A UI experiment should fail-open. Conflating them produces either unnecessary outages or security incidents. The policy belongs in the flag definition, validated at creation time.

4. No lifecycle enforcement

Ten independent flags: 1,024 possible system states. Fifty flags: more states than atoms in the observable universe. Atlassian hit 4,000+ flags and found on-call engineers couldn't reason about which ones were safe to flip during active incidents. Fix: mandatory 90-day expiry, automated cleanup tickets.

5. Missing flag exposure tracking

Every evaluation should emit a structured event: flag_key, variant, user_id, context_hash, sdk_version, timestamp. This is the foundational data primitive for experiment analysis. Google's exposure events feed directly into ABACUS, their experimentation platform. Without them, causal inference between flag variants and user outcomes is impossible.


KILL SWITCHES: THE PATTERN THAT MAKES THEM WORK

Kill switches are evaluated before any targeting predicate — before user lookups, before region checks, before anything that requires a valid context object.

[IMAGE: Evaluation flowchart — kill switch check fires first, before targeting rules and rollout bucket]

Uber's surge pricing kill switch under real production conditions: during a major incident, on-call engineers disabled surge pricing globally in under 30 seconds across all regions. That response window requires three things simultaneously:

• No network call per evaluation — state is in local process cache
• Push-based propagation — all instances notified within seconds of the flip
• Kill switch check is first — before any business logic executes

Miss any one of those three, and 30 seconds becomes minutes becomes executive escalation.


FLAG DEBT: THE SLOW-MOVING DISASTER

Knight Capital's $440M loss in 2012 is the canonical cautionary tale. The SMARS "Power Peg" flag was deprecated but never cleaned up. A new deployment reactivated it.

The combinatorial state explosion is the less dramatic but equally dangerous version:

10 flags = 1,024 possible system states
50 flags = more states than atoms in the observable universe

You cannot test that. You cannot reason about it at 2am.

[IMAGE: Flag count growth graph with red threshold line labeled "on-call reasoning breaks down"]

Every flag needs three things enforced by automation, not convention:

• Owner — team, not individual (people leave)
• Expiry date — or explicit waiver with documented justification
• Cleanup automation — PR opened automatically when flag hits 100% stable rollout

Atlassian's rule: if the flag has been at 100% for 30 days with no incidents, it's dead code. Automation opens the PR. Engineers approve or extend with justification. The flag doesn't survive on inertia.


BIG TECH PATTERNS SIDE-BY-SIDE

Netflix — Trebuchet: gateway-layer evaluation, kill switches fire before application logic reaches execution.

Meta — Gatekeeper: auto-ramp with metric feedback, 0→100% overnight with zero engineer involvement. 30–60 second propagation window is intentional.

Google — Internal systems: exposure events feed ABACUS experimentation platform. Every evaluation tracked. Without exposure events, experiment data is uninterpretable.

Uber — Flipr: region-aware kill switches with a 30-second global response SLA. Driver matching, surge pricing, dispatch logic all gated.

The convergence is striking. These teams never coordinated. They arrived at the same architecture independently — because those are the only design choices that survive at scale.


WHAT YOU SHOULD BUILD

The architecture is settled. The principles are battle-tested. What remains is enforcement.

Non-negotiables:
• Local evaluation — no RPC on request path
• Push-based distribution — not pull
• Per-flag fail-open / fail-closed policy declared at creation
• Expiry dates enforced by automation
• Exposure tracking as structured events from day one

The test: can your on-call engineer disable a production feature globally in under 60 seconds without touching code or config files? If not, your kill switch isn't a kill switch.


Originally published at sairam.dev/notes/feature-flags-at-scale-distributed-control-system

If this was useful, forward it to one engineer on your team who owns feature flags infrastructure — or who should.

<!-- ==================== PASTE END ==================== -->
