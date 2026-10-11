---
slug: how-dns-works
title: "How DNS Actually Works: Resolution Hierarchy, Caching, and Production Failure Modes"
platform: linkedin
status: draft
carousel_slides: 0
article_url: https://dev.to/sai_ram_0000/how-dns-actually-works-resolution-hierarchy-caching-and-production-failure-modes-195h
---

Every time you type a URL, 8 separate systems race to answer you before you notice. Most engineers have shipped DNS-dependent features without knowing what happens between the keystroke and the response.

Here's what actually happens — and the failure modes that will eventually bite you in production.

Your query starts in the browser's own DNS cache (0ms if it's a hit). Miss that, and it falls to your OS resolver, which checks `/etc/hosts` before touching the network. Still a miss? It hits the recursive resolver — Cloudflare 1.1.1.1, Google 8.8.8.8, or your ISP's — which likely has the answer cached and never leaves its own memory.

Only a true cache miss kicks off the full journey: root server → TLD server → authoritative nameserver. This happens far less often than engineers think. The root servers that anchor the entire global DNS hierarchy handle a vanishingly small fraction of total query volume.

The part that trips people up most in production: **TTL is a lease, not a cache expiry signal.** When you lower your TTL to 60 seconds and update your A record at the same time, half the internet is already caching the old IP — with a full hour left on their TTL clock. That change is invisible to them.

Pre-lower TTLs 24–48 hours before any migration. Let the short TTL propagate first. Then flip the record. Then restore the long TTL. This sequence is the entire mitigation.

Two more things that surprise engineers the first time:

Negative caching means NXDOMAIN responses are also cached — delete and recreate a record during debugging and resolvers will serve "doesn't exist" for up to an hour regardless of what you've done.

DNSSEC failure is not graceful degradation. When it breaks — expired signatures, failed key rollovers — validating resolvers return hard SERVFAIL for the entire zone. The domain disappears.

Full deep-dive on record types, anycast/GeoDNS internals, Kubernetes service discovery, and the Fastly/GoDaddy failure case studies: https://dev.to/sai_ram_0000/how-dns-actually-works-resolution-hierarchy-caching-and-production-failure-modes-195h

What DNS failure mode has cost you the most debugging time?

#SystemDesign #DNS #SoftwareEngineering #BackendDevelopment
