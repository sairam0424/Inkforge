---
slug: how-dns-works
title: "How DNS Actually Works: Resolution Hierarchy, Caching, and Production Failure Modes"
platform: substack
status: draft
paste_workflow: "Copy from rendered Dev.to page → paste into Substack editor"
devto_url: https://dev.to/sai_ram_0000/how-dns-actually-works-resolution-hierarchy-caching-and-production-failure-modes-195h
canonical_url: https://anvilry.vercel.app/notes/how-dns-works
---

# How DNS Actually Works: Resolution Hierarchy, Caching, and Production Failure Modes

I've been burned by DNS more times than I'd like to admit.

The most memorable one: it was 11pm, we were mid-migration moving our primary database off a cloud provider, and despite doing everything right — cutting TTLs, updating A records, verifying propagation from three different vantage points — a subset of users were still hitting the old server six hours later. Turns out an ISP resolver in Southeast Asia had decided our 60-second TTL was a suggestion, not a directive.

That night forced me to actually understand DNS at the mechanism level rather than the "update a record and wait" level. What I found was surprising: DNS isn't slow infrastructure with an occasional luck problem. It's an elegantly designed distributed system that most engineers dramatically underuse — and occasionally catastrophically misuse.

Let me walk you through what I wish I'd understood earlier.

---

## The "Phonebook" Metaphor Is Actively Misleading

Everyone reaches for the phonebook comparison. I did too. But a phonebook is a static mapping: you look up a name, you get a number, done. DNS is something fundamentally different — it's a **decoupling mechanism** that separates stable human-readable identifiers from the volatile, ephemeral IP addresses underneath them.

When Google migrates a backend cluster from one datacenter to another, no client breaks. No user re-bookmarks anything. No integration requires a config change. The domain `google.com` stays fixed while the IP reality beneath it shifts completely. The name is the contract; the address is an implementation detail.

Every piece of major internet infrastructure is built on this indirection. CDN edge nodes, anycast load balancers, blue-green deployment targets, multi-cloud failover — none of these work without DNS as a transparent redirection layer.

<!-- GIF_SLOT_1: DNS resolution journey — animated diagram showing a browser query cascading down through resolver → root → TLD → authoritative → back up the chain. Concept: "the journey of a single DNS query." Search Giphy: "dns resolution" or "internet request journey" -->

Here's the counterintuitive part: DNS isn't slow because it's distributed. It's *fast* because of that distribution. Aggressive caching at every layer combined with anycast routing means most queries never travel far. The latency you occasionally see in DNS is almost always a cache miss penalty, not a property of the system in steady state.

---

## What Actually Happens When You Type a URL

The resolution hierarchy is a layered fallback chain. Each layer is a cache hit opportunity that short-circuits everything below it:

```
Keystroke → Browser cache (0ms)
          → OS stub resolver + /etc/hosts (~1ms)
          → Recursive resolver cache (~5ms)
          → Root nameserver (cache miss, ~20–100ms full round-trip)
          → TLD nameserver
          → Authoritative nameserver
          → Response propagates back up
```

The overwhelming majority of DNS queries never leave the recursive resolver's cache. The root servers — the 13 logical anchors of the entire DNS hierarchy — handle a vanishingly small fraction of total query volume. Cloudflare's 1.1.1.1 resolver fields billions of queries daily, and nearly all of them are served from memory.

The browser maintains its own DNS cache with independent TTL tracking — Chrome exposes this at `chrome://net-internals/#dns`. A cache hit here costs nothing measurable. Miss, and the query drops to the OS stub resolver, which checks `/etc/hosts` before consulting the configured recursive resolver.

One thing I didn't appreciate until I worked on Kubernetes clusters: the `/etc/hosts` file is evaluated *before* any network query. Local dev environments exploit this constantly, mapping `api.myapp.local` to `127.0.0.1` without touching DNS infrastructure. Kubernetes uses the same principle — each pod's `/etc/resolv.conf` points at CoreDNS, which resolves service names against its in-memory registry, never leaving the cluster. I've seen engineers chase mysterious resolution failures in k8s for an hour before realizing a manually edited `/etc/hosts` on the node was intercepting queries before CoreDNS ever saw them.

On a full recursive resolution (a true cache miss), the resolver starts at a root server. Not to get the final answer — to get a referral. The root knows which nameservers are authoritative for `.com`, `.io`, `.dev`. The resolver follows the referral to the TLD nameserver, which returns a referral to the domain's authoritative nameservers. A third query to the authoritative server finally yields the record.

The elaborate recursive machinery exists for cache misses. Which, in practice, means cold starts and TTL expirations.

---

## Root Servers and TLD Servers: The Directory Layer

There are not 13 root servers. There are 13 root server *names* — `a.root-servers.net` through `m.root-servers.net` — backed by over 1,600 physical instances distributed globally via anycast. The "13" cap is a direct artifact of original DNS design constraints: a UDP packet couldn't exceed 512 bytes, which capped the A record count at 13. Anycast sidesteps this entirely — your resolver queries `198.41.0.4`, and BGP routes that packet to whichever physical instance is topologically nearest.

What root servers actually do is narrower than most engineers assume. They don't return final IPs. They don't know where `google.com` lives. They inspect the rightmost label of a query — the TLD — and respond with NS records pointing to the authoritative TLD servers for that zone.

The TLD layer is where scale becomes impressive. Verisign operates `.com` and `.net` — `.com` alone carries approximately 170 million registered domains and fields billions of queries per day. The TLD nameservers hold NS records for every registered domain under that zone. That delegation — root to TLD to authoritative — is what makes DNS a distributed system rather than a centralized database.

This also explains something that frustrates engineers during deploys: new domain registrations can take up to 48 hours to resolve correctly. TLD zone files aren't updated in real time. Registrars batch-submit zone file updates, and those propagate according to scheduled cycles. I've seen engineers provision infrastructure, register a fresh domain, and spend an afternoon confused about why their resolver returns NXDOMAIN — the TLD hasn't published the NS delegation yet.

---

## TTLs and the Propagation Trap

Here's the counterintuitive part of DNS that burns the most engineers: **you don't control when the internet "sees" your DNS change. You only control how long resolvers are allowed to cache the previous answer.**

TTL is a lease duration, not a cache expiry signal. Every DNS record carries a TTL value — set by the zone owner — that tells resolvers how many seconds they may serve that answer from cache before re-querying. A `3600` on an A record means any resolver that fetched it can serve the cached IP for up to an hour. Once that window closes, the resolver queries upstream and gets whatever answer exists at that moment.

"DNS propagation" is just the gradual expiration of cached copies scattered across tens of thousands of recursive resolvers worldwide, each on its own independent TTL countdown. There is no central push, no broadcast, no synchronization event.

<!-- GIF_SLOT_2: TTL/caching concept — something showing a countdown timer, expiring cache, or gradual "spread" across nodes. Search Giphy: "cache expiry" or "countdown timer network" or "propagation wave" -->

**The migration trap.** I've watched this burn engineers repeatedly during blue-green cutovers: the zone record sits at `TTL 3600`. Migration window opens, engineer drops TTL to `60` and updates the A record simultaneously. Half the internet is already caching the old IP — with a full hour left on their local TTL clock. That TTL change is invisible to them; they already have the answer.

The fix requires discipline: **lower your TTL to 60–300 seconds 24–48 hours before the cutover.** Let the short TTL propagate at the original TTL's pace. Then do the cutover. Then restore the long TTL post-migration.

Negative caching compounds this. NXDOMAIN responses are also cached, with TTL governed by the `minimum` field in your zone's SOA record. Delete a record, then immediately recreate it? Resolvers that caught the deletion can serve `NXDOMAIN` for the full negative cache duration — often 30 minutes to an hour — regardless of whether the new record exists.

One more edge case that bit us: some ISP resolvers impose a minimum cache floor. They ignore TTLs below 60–300 seconds and cache longer than specified. Fast-failover designs that depend on sub-minute TTLs need to account for this ceiling you don't control.

---

## Production Failure Modes

DNS failure modes are disproportionately severe relative to their apparent complexity. A single misconfigured record, an expired signature, or a lapsed domain registration can silently erase your entire service from the internet.

<!-- GIF_SLOT_3: Production failure mode — something conveying cascading failure, domino effect, or system going offline. Search Giphy: "system failure" or "cascade failure" or "server down" -->

**DNSSEC failures are catastrophic, not graceful.** When DNSSEC is configured correctly, it's invisible. When it breaks — expired RRSIG records, failed key rollovers, broken DS record chains — validating resolvers return hard SERVFAIL for the entire zone. The domain appears to vanish. A classic failure: a zone administrator activates a new Key Signing Key but forgets to publish the updated DS record at the parent zone first. Validating resolvers immediately start failing the delegation chain.

**Split-horizon DNS is operationally treacherous.** Serving different answers to internal vs. external clients breaks silently when misconfigured. A service that resolves correctly from the corporate VPN might return NXDOMAIN from a CI runner with a different resolver path. This surfaces most often when engineers rotate VPN infrastructure or add new subnets without updating view ACLs.

**Thundering herd from short TTLs.** Set your TTL to 30 seconds in a moment of pre-migration caution, then forget to restore it, and you're suddenly hammering your authoritative nameservers with 10x normal query volume under load. Authoritative nameservers that return inconsistent TTLs across their fleet create coordinated re-resolution spikes when the shortest-TTL version expires.

**Registrar-level failures sit above everything else in the stack.** The GoDaddy DNS outage in 2012 took down authoritative nameservers for millions of domains. If your domain registration lapses, no amount of authoritative server redundancy helps. The June 2021 Fastly outage is instructive from the other direction: DNS itself worked fine, but CDN infrastructure dependent on it collapsed.

---

## Practical Takeaways

- **Pre-lower TTLs 24–48 hours before any migration.** Once you flip the record, you've surrendered control to cached copies at the original TTL.
- **DNS failover speed is bounded by TTL, full stop.** If you need sub-minute recovery, layer in application-level health checks and connection retries.
- **CNAME-at-apex is an RFC violation.** Use ALIAS records (Route 53) or CNAME Flattening (Cloudflare) when pointing a root domain to a CDN hostname.
- **Treat DNS as infrastructure.** Version-control zone files, manage records via Terraform or provider APIs, and audit regularly for dangling CNAMEs — they're live subdomain takeover vectors.
- **Test GeoDNS from diverse vantage points.** EDNS Client Subnet support varies across resolvers. Your latency models aren't guaranteed.

---

If you want the full deep-dive with more on record types, anycast/GeoDNS internals, and Kubernetes service discovery, the complete version is [on Dev.to](https://dev.to/sai_ram_0000/how-dns-actually-works-resolution-hierarchy-caching-and-production-failure-modes-195h).

---

Have you been bitten by a DNS edge case in production? I'm curious whether the thundering herd from TTL mismanagement is as common as I think it is, or whether there are failure modes I've missed entirely. Drop it in the comments.
