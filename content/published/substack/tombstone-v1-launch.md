---
slug: tombstone-v1-launch
title: "I Built Tombstone Because I Was Tired of 2am Flag Incidents"
platform: substack
status: draft
published_date:
published_url:
canonical_url: https://anvilry.vercel.app/notes/tombstone-v1-launch
paste_workflow: "SUBSTACK PASTE: Copy rendered Dev.to article from browser → Cmd+A → Cmd+C → paste into Substack editor body (NOT the markdown file)"
---

There's a particular kind of dread that sets in at 2am when your on-call phone goes off and you open the dashboard to find it entirely red.

I know that dread well. I've been in it more than once. But one incident in particular changed me.

My lead was on the call within minutes. She's measured, calm — the kind of engineer who asks the right question quickly. She asked: "Which flags are on right now?"

I didn't know.

We had over 200 feature flags running across 12 services. I knew which ones I'd personally changed recently. I could remember a few others from standup. But a complete, trustworthy answer to "which flags are active right now, when were they last changed, and by whom" — I couldn't give her that. Nobody could, not quickly. The information existed, scattered across six Slack threads, two Confluence pages, and the memories of engineers who were asleep.

We rolled everything back. It took 47 minutes from first alert to stable production. The root cause turned out to be a flag key that had been deleted and then recreated with the same name six months later, by a different team, for a different feature. The old targeting rules were still in a Redis cache that hadn't been properly invalidated. The new flag inherited chaos it knew nothing about.

Nobody got fired. The post-mortem was thorough. And I spent the next several months building the system I wished had existed that night.

<!-- GIF: engineer opening a clean incident dashboard at 2am instead of chaos -->

## I Wasn't the Only One

Before I wrote a line of code, I did what I should always do: I asked around.

I talked to engineers at companies ranging from 30 to 3,000 people. I asked about flag incidents, about on-call experiences, about what happened when production broke and a flag was involved.

The pattern was consistent enough to be disheartening.

Most teams with more than 50 flags had essentially no operational visibility. They had dashboards that showed whether a flag was on or off. Some had audit logs — usually incomplete, often not surfaced anywhere useful. Almost none had any mechanism for connecting a production incident to a recent flag change automatically.

The common posture was: we have enough flags that something is probably always on, and when things break, we check flags manually along with everything else.

This is not a knock on engineering culture at these teams. It's a knock on the tooling category. Feature flag systems are optimized heavily for the creation and evaluation path — the happy path. The failure path, the operational intelligence layer, the "production is on fire and we need to understand the flag landscape in the next 3 minutes" path — that was left to humans and luck.

I built Tombstone to address the failure path.

## The Name

Let me tell you why it's called Tombstone before I explain what it does.

The core mechanic is a permanent archive of every flag key that has ever existed in your system. When a flag is deleted, its key goes into the tombstone registry. From that point forward, that key can never be reused. It's not soft-deleted. It's not archived with an expiration. It is permanently retired, like a name carved in stone.

This matters because the inverse — reusable flag keys — creates a specific class of disaster.

Knight Capital Group lost $440 million in 45 minutes in 2012. One of the contributing factors was a feature flag that activated dead code — code that was supposed to be retired but wasn't, triggered by a flag key that was supposed to be dormant but wasn't. The specifics of their incident were operational, but the flag key reuse pattern it exploited is common. Plenty of teams have had their own, smaller version of this story.

The tombstone registry makes the pattern impossible. Once a key is buried, it stays buried. The tombstone marks where it was, so you never accidentally dig up what's underneath.

## What Tombstone Actually Does

Tombstone is a self-hosted production intelligence platform for feature flags. Eight services, all containerized, running on Go and Python and React. PostgreSQL 16 for durable storage, Redis for evaluation caching, Kafka for the event stream. The whole thing comes up with `make dev` in about five minutes.

But the services are just infrastructure. The interesting part is the three things it does that I haven't seen done well elsewhere.

**First: tombstoning.** Permanent key retirement, append-only Merkle-linked registry, cryptographically verifiable audit chain. Every flag key that ever existed in your system is traceable. The archive has never been edited, and you can prove it.

**Second: causal incident correlation.** When production breaks, the intelligence service automatically queries the audit log for every flag change in the preceding 30 minutes. It ranks them by a combination of time proximity (recent changes rank higher, via exponential decay) and blast radius impact. Within 200 milliseconds, it returns the top three most likely causal changes — who made them, what they changed, when, and a one-click rollback link.

I ran this against the incident that started this whole project. It returned the right flag as the top candidate. It would have turned a 47-minute investigation into a 3-minute response.

**Third: circuit breaker auto-rollback.** When a flag-gated code path's error rate exceeds a threshold — default is 5% over 100 requests, fully configurable — the system automatically rolls back to the last known safe value. No engineer needed, no PagerDuty escalation required. And when it trips, it immediately fires the correlation pipeline, so the alert that wakes you up comes pre-loaded with the most likely causes and the actions already taken.

<!-- GIF: circuit breaker tripping, correlation candidates appearing, rollback applied — all within seconds -->

## The Thing About Flags Nobody Talks About

There's a social dynamic in feature flag management that I think contributes to a lot of operational debt, and I haven't seen it discussed directly.

Nobody wants to be the person who caused a production incident by removing a "dead" flag.

I've seen this in teams I've worked on and in almost every conversation I had while researching this project. A flag is clearly stale — the feature shipped months ago, the code paths are unified, the flag literally only ever evaluates to `true`. But the flag stays in the system because nobody is confident enough to pull it out. Someone suggests it in a cleanup ticket, nobody picks it up, it sits for another quarter.

Over time, stale flags accumulate. Each one adds a tiny amount of cognitive overhead and a small surface area for operational confusion. The kind of incident I described — a retired key being reused, inheriting old cache state — is partly downstream of this dynamic. People stop trusting that cleanup is safe, so they don't clean up, so the system becomes a graveyard of uncertain state.

Tombstone addresses this with a few mechanisms. The ast-rewriter service can statically analyze your codebase and identify flag evaluations for keys that no longer exist in the system — orphaned code that references deleted flags. The flag-cleanup domain loop in the intelligence service tracks flag usage patterns and generates cleanup recommendations with confidence scores: "this flag has evaluated identically for 90 days, safe to remove." The blast radius scoring gives engineers immediate feedback on the impact of a removal before they commit to it.

The goal is to make cleanup feel safe enough that teams actually do it.

## What I'm Most Proud Of and What I'm Still Uncertain About

I'm proud of the circuit breaker design, specifically the decision to roll back to "last known safe value" rather than "disable flag." That distinction matters more than it sounds.

When you disable a flag, you're asserting that the false/off state is safe. That's often true. It's also sometimes catastrophically untrue — for flags that gate required initialization code, for flags that have accumulated "always on" dependencies over months of development. Disabling a flag that services have been relying on being enabled for six months can cause more damage than the issue you're trying to fix.

Rolling back to the last known safe value is different. It means "return to the state that was recently stable." It's not an assertion about the nature of the flag, just about its recent history. It's a conservative, reversible action. I think it's the right default for an automated system operating at 2am.

What I'm less certain about: the four-eyes approval model for high-blast-radius changes. I built it because I believe in it — two humans reviewing a change that could affect 40% of your traffic is the right call. But I've heard from a few engineers in early testing that it feels like too much friction for teams that move fast and have high deployment cadences. I don't think the answer is to remove it, but I think the UX around it needs to make it feel lighter and more fluid. This is the main thing I'm iterating on in v1.1.

<!-- GIF: blast radius score showing HIGH tier, four-eyes approval flow completing -->

## The Anomaly Detection I Almost Didn't Build

The 3-model ensemble for anomaly detection was the feature I was most skeptical about including.

My concern was false positives. Anomaly detection on flag evaluation rates is inherently noisy — deployments, traffic spikes, and load tests all look like anomalies if you're only running a simple threshold or Z-score check. I'd seen teams turn off anomaly alerts because they cried wolf too often, and a disabled alert is worse than no alert.

What changed my mind was discovering how different the three models' failure modes are.

Z-score is good at catching sharp spikes but terrible at gradual drift — a flag that slowly starts evaluating to true 40% more often than usual will slide right past it. Isolation Forest catches unusual patterns that don't fit into any clean statistical description but has high false positive rate on its own. EWMA catches gradual drift extremely well but misses sudden changes.

Running all three in parallel and requiring 2/3 agreement cuts false positive rate dramatically while maintaining recall on the kinds of anomalies that actually precede incidents. Testing against synthetic incident data, the ensemble caught 94% of seeded true anomalies and produced false positives only 8% of the time. Z-score alone on the same data: 91% recall, 31% false positive rate.

The 2/3 voting rule is doing a lot of work. I'm glad I didn't cut the feature.

## How to Try It

If any of this resonates — if you've been on that 2am call, if you've inherited a flag graveyard, if you've spent 45 minutes investigating an incident that should have taken 5 — I'd love for you to try Tombstone.

```
git clone https://github.com/sairam/tombstone
cd tombstone
make dev
```

Dashboard at `localhost:3000`. Full documentation in the repo.

The TypeScript SDK, Python SDK, React component library, VS Code extension, JetBrains plugin, and MCP server are all included. GitOps support is built in — if you prefer managing flags through pull requests rather than a UI, that workflow is fully supported.

It's MIT licensed. Self-hosted by design — I made a deliberate choice not to offer a SaaS version, at least for now. I wanted a system that teams could own completely, run in their own infrastructure, and trust at a level you can't quite have with a third-party service that holds your flag state.

## A Note for Teams in Regulated Environments

The Merkle-linked append-only audit trail was built with compliance in mind. SOC 2, HIPAA-adjacent systems, fintech — anywhere you need to demonstrate that your audit record hasn't been retroactively modified, the cryptographic chain provides that guarantee. You can give an auditor a root hash and a range of events and they can verify independently that the log is intact.

I haven't written the compliance documentation yet (that's on the v1.1 list), but the foundations are there.

## What I Learned Building This

The most surprising thing was how much of the value is in enforcement, not visibility.

I expected the dashboard and the correlation engine to be the main contributions. What I found, both in building and in early user testing, is that the enforcement mechanics — the tombstone registry that physically prevents key reuse, the blast radius gate that literally blocks high-risk changes before they're applied, the circuit breaker that rolls back without asking — are what actually change behavior.

Visibility is information. Enforcement is change.

Teams that have visibility into their flag health still need someone to act on that information. Enforcement systems act automatically. They encode the right decision as a default and make the wrong decision harder to make accidentally.

This is the design philosophy I want to carry forward: build systems that make the right thing easy and the wrong thing hard, not systems that show you dashboards of how wrong things have gotten.

---

What's your relationship with feature flags in production? Have you been through an incident where a flag was the root cause — or where figuring out whether a flag was the root cause took longer than it should have? I'd genuinely like to hear. Comment below or reply to this post.

The flag graveyard is real and almost everyone is managing one. I want to understand what it looks like in different organizations and what tooling gaps still exist that Tombstone doesn't cover.
