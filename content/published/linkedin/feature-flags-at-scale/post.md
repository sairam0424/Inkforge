---
slug: feature-flags-at-scale
title: "Feature Flags at Scale: LinkedIn Carousel"
platform: linkedin
status: draft
published_date:
published_url:
canonical_url: https://sairam.dev/notes/feature-flags-at-scale-distributed-control-system
article_devto: https://dev.to/sai_ram_0000/feature-flags-at-scale-designing-a-distributed-control-system-for-production-behavior-2p30
article_substack: https://open.substack.com/pub/sairam0000/p/feature-flags-at-scale-the-complete
carousel_slides: 13
carousel_pdf: slides/carousel.pdf
---

# How to Post on LinkedIn

## Step 1 — Upload the carousel as a Document post

1. Go to linkedin.com → Start a post
2. Click the **document icon** (📄) — NOT the image icon
3. Upload: `carousel.pdf` (0.8MB, 10 slides)
4. LinkedIn will show a slide preview — looks correct
5. Set document title: **Feature Flags at Scale**

## Step 2 — Paste the post caption

Copy from `post-text.txt` or from below and paste into the caption field:

---

One un-deleted feature flag cost Knight Capital $440 million in 45 minutes.

That is not a cautionary tale about feature flags. It is a cautionary tale about what happens when you treat feature flags as config files instead of what they actually are at scale: a distributed control system for production behavior.

I just published a deep-dive on how the companies that got this right — Google, Meta, Netflix, Uber — all converged on the same architecture independently.

Here is what that architecture looks like.

Two planes, not one. The Control Plane is slow and safe: it validates rules, stores state, handles conflicts. The Data Plane is fast and local: it runs entirely in-process, evaluates flags from a local cache, and never blocks user traffic on a remote call. This separation is non-negotiable at scale.

Kill switches come first. Before any percentage rollout, before any user targeting — the kill switch. No userId required, no context needed, just a boolean from local cache. Uber used this to kill surge pricing globally in under 30 seconds during a production incident.

Use hash(userId) % 100, never random(). Random gives different results on every evaluation. The same user gets different experiences on different servers. Deterministic hashing gives you sticky assignment, consistent UX, and reproducible experiments.

Auto-ramp is not a feature, it is a safety system. Meta Gatekeeper watches error rate, latency, and crash signals in real time and advances rollout percentage automatically when metrics stay green. A flag can go from 0.1% to 100% overnight with zero engineer involvement — and roll back instantly if anything degrades.

Flag debt kills on-call teams. Atlassian had 4,000+ active flags and engineers could no longer reason about live system state during incidents. Every flag needs an owner, a TTL, and a removal ticket from day one. The Knight Capital flag that caused the $440M loss was deprecated. It was just never deleted.

10 flags create 1,024 possible system states. 50 flags create more states than atoms in the observable universe. Your feature flag system is not a toggle board. It is the runtime nervous system of your product. Build it like one.

Full architecture breakdown with diagrams in the first comment.

#SystemDesign #FeatureFlags #DistributedSystems #SoftwareEngineering #ProductionEngineering

---

## Step 3 — Post

Click **Post**.

## Step 4 — Add first comment immediately after posting

Paste this as the FIRST comment (within 30 seconds of posting):

```
Full article with architecture diagrams, TypeScript SDK implementation, and production war stories from Google, Meta, Netflix, and Uber:

Dev.to: https://dev.to/sai_ram_0000/feature-flags-at-scale-designing-a-distributed-control-system-for-production-behavior-2p30

Substack: https://open.substack.com/pub/sairam0000/p/feature-flags-at-scale-the-complete
```

---

# Carousel Slide Map

| Slide | File | Type | Headline |
|---|---|---|---|
| 01 | slides/slide-01.png | Cover | Feature Flags at Scale |
| 02 | slides/slide-02.png | Stat | $440M — Knight Capital |
| 03 | slides/slide-03.png | List | This Is Not a Config File Problem |
| 04 | slides/slide-04.png | List | Two Planes, Two Contracts |
| 05 | slides/slide-05.png | Stat | <30s — Uber Kill Switch |
| 06 | slides/slide-06.png | Code | Never Use random() for Rollouts |
| 07 | slides/slide-07.png | List | Meta Gatekeeper Auto-Ramp |
| 08 | slides/slide-08.png | Stat | 125,899,906,842,... — Flag States |
| 09 | slides/slide-09.png | List | Flag Hygiene Rules |
| 10 | slides/slide-10.png | CTA | Build the Control Plane. Not Just the Config. |
| 11 | slides/slide-11.png | Case Study | Netflix Trebuchet — Kill Switches at the Edge |
| 12 | slides/slide-12.png | War Story | The $0 Bug That Cost 3 Days (Fintech Hash Seed) |
| 13 | slides/slide-13.png | All Companies | Every Major Tech Company Uses the Same Playbook |
