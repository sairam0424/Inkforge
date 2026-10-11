---
slug: how-dns-works
title: "How DNS Actually Works: Resolution Hierarchy, Caching, and Production Failure Modes"
platform: medium
status: draft
canonical_url: https://anvilry.vercel.app/notes/how-dns-works
devto_url: https://dev.to/sai_ram_0000/how-dns-actually-works-resolution-hierarchy-caching-and-production-failure-modes-195h
medium_tags: [System Design, Programming, Software Engineering, Computer Science, Technology]
import_workflow: "medium.com/p/import → paste https://anvilry.vercel.app/notes/how-dns-works → canonical set automatically"
---

# Medium Version — How DNS Actually Works

## Medium Pre-Publish Checklist
- [ ] No `###` headings — only `##` and **bold**
- [ ] No tables
- [ ] Opening paragraph comes before first `##`
- [ ] GIF placeholders replaced with real Giphy URLs (paste URL on its own line in editor)
- [ ] Code blocks → GitHub Gist embed URLs ready
- [ ] Cover image: 1400×787 PNG in assets/
- [ ] Canonical URL set in Story Settings → SEO → https://anvilry.vercel.app/notes/how-dns-works
- [ ] 5 tags set: System Design, Programming, Software Engineering, Computer Science, Technology
- [ ] Article is human-authored/reviewed — not raw AI output
- [ ] Story Preview title and subtitle set manually

---

## Article Body (Medium-ready)

**TL;DR**
- DNS is a decoupling mechanism, not a lookup table — the name is the contract, the IP is an implementation detail
- The resolution hierarchy is a layered cache: browser → OS → recursive resolver → root → TLD → authoritative — most queries never reach the root
- TTL is a lease duration, not a cache expiry signal — "propagation" is just cached copies draining independently across thousands of resolvers
- Pre-lower TTLs 24–48 hours before any migration; changing them at cutover doesn't help clients who already have the old answer cached
- DNSSEC failures are catastrophic (full SERVFAIL on the zone), CNAME-at-apex is an RFC violation, and registrar-level failures sit above everything else in your reliability stack

---

I've been burned by DNS more times than I'd like to admit.

The worst was a midnight migration gone sideways: we had done everything right — pre-lowered TTLs, updated A records, verified from multiple vantage points — and still a subset of users were hitting the old server six hours later. An ISP resolver somewhere had decided our 60-second TTL was a suggestion.

That incident forced me to understand DNS at the mechanism level rather than the "update the record and wait" level. What I found was an elegantly designed distributed system that most engineers dramatically underuse — and occasionally catastrophically misuse. Here's what I wish I'd known earlier.

## The Phonebook Metaphor Is Actively Misleading

Everyone reaches for the phonebook analogy. It's wrong in a load-bearing way. A phonebook is a static mapping: name → number, done. DNS is a **decoupling mechanism** — it separates stable human-readable identifiers from the volatile, ephemeral IP addresses underneath them.

When Google migrates a backend cluster from one datacenter to another, no client breaks. No user re-bookmarks anything. No API integration requires a config change. The domain `google.com` stays fixed while the IP reality beneath it shifts completely. The name is the contract; the address is an implementation detail.

CDN edge nodes, anycast load balancers, blue-green deployment targets, multi-cloud failover — none of these work without DNS as a transparent redirection primitive. When Cloudflare routes you to their nearest PoP, or AWS Route 53 returns a different A record based on your source region, they're exploiting this indirection to shape traffic without touching the client.

Here's the counterintuitive part: DNS isn't slow because it's distributed. It's *fast* because of that distribution — aggressive resolver caching at every layer combined with anycast routing means most queries never travel far. The latency you occasionally see in DNS is almost always a cache miss penalty, not a steady-state property of the system.

This reframes what TTL tuning actually is. It's not an ops detail — it's you setting the durability of the indirection contract.

## The Resolution Hierarchy: From Keystroke to IP

The resolution hierarchy is a layered fallback chain, and each layer is a cache hit opportunity that short-circuits everything below it:

```
Keystroke → Browser cache (0ms)
          → OS stub resolver + /etc/hosts (~1ms)
          → Recursive resolver cache (~5ms)
          → Root nameserver (cache miss, ~20–100ms full round-trip)
          → TLD nameserver
          → Authoritative nameserver
          → Response back up the chain
```

The overwhelming majority of DNS queries never leave the recursive resolver's cache. Cloudflare's 1.1.1.1 resolver fields billions of queries daily, and nearly all of them are served from memory. The elaborate recursive machinery exists for cache misses — which in practice means cold starts and TTL expirations.

**Browser and OS layers.** The browser maintains its own DNS cache with independent TTL tracking — Chrome exposes this at `chrome://net-internals/#dns`. A cache hit here costs nothing measurable. Miss, and the query drops to the OS stub resolver, which checks `/etc/hosts` before consulting the configured recursive resolver. The stub resolver is deliberately thin: it doesn't perform recursion itself, it delegates.

**Why `/etc/hosts` still matters.** It's evaluated before any network query, which makes it a blunt but effective override. Local dev environments exploit this constantly — mapping `api.myapp.local` to `127.0.0.1` without touching DNS infrastructure. Kubernetes uses the same principle: each pod's `/etc/resolv.conf` points at CoreDNS, which resolves service names against its in-memory registry without leaving the cluster. I've seen engineers chase mysterious resolution failures in k8s for an hour before realizing a manually edited `/etc/hosts` on the node was intercepting queries before CoreDNS ever saw them.

**The full recursive miss.** On a real cache miss, the resolver starts at a root server — not to get the final answer, but to get a referral. The root knows which nameservers are authoritative for `.com`, `.io`, `.dev`. The resolver follows the referral to the TLD nameserver, which returns a referral to the domain's authoritative nameservers. A third query to the authoritative server finally yields the record. Each layer's response is cached with the TTL specified in that response.

## Root Servers and TLD Servers

There are not 13 root servers. There are 13 root server *names* — `a.root-servers.net` through `m.root-servers.net` — backed by over 1,600 physical instances distributed globally via anycast routing. The "13" number is a direct artifact of original DNS design constraints: a UDP packet carrying root server data couldn't exceed 512 bytes, which capped the A record count at 13. Anycast sidesteps this entirely — your resolver queries `198.41.0.4`, and BGP routes that packet to whichever physical instance is topologically nearest, often within single-digit milliseconds.

What root servers actually do is narrower than most engineers assume. They don't return final IPs. They don't know where `google.com` lives. They inspect the rightmost label of a query — the TLD — and respond with NS records pointing to the authoritative TLD servers for that zone. Root servers are directory pointers, not answer sources.

The TLD layer is where scale becomes impressive. Verisign operates the `.com` and `.net` TLDs — `.com` alone carries approximately 170 million registered domains and fields billions of queries per day. The TLD nameservers hold NS records for every registered domain under that zone.

This delegation chain explains something that frustrates engineers during deployments: new domain registrations can take up to 48 hours to resolve correctly. TLD zone files aren't updated in real time — registrars batch-submit zone file updates, and those propagate according to scheduled cycles rather than immediately. The domain exists in the registrar's database, but that's a separate system from the live zone file Verisign is serving.

## DNS Record Types That Matter in Production

The authoritative nameserver owns exactly one zone, holds the canonical records for it, and signals that ownership by setting the AA (Authoritative Answer) bit in its responses.

**A and AAAA** are the terminal answers — IPv4 and IPv6 addresses respectively. Everything else either routes toward them or carries out-of-band metadata.

**CNAME** introduces an alias: `www.example.com CNAME example-prod.cdn.net` tells resolvers to restart the lookup with the new name. The constraint that bites teams constantly: a CNAME cannot coexist with other records at the same node. At the zone apex — `example.com` itself — you're required to have NS and SOA records. A CNAME there is illegal per RFC 1912.

**This is the CNAME-at-apex problem.** The canonical workaround is vendor-specific. Cloudflare's CNAME Flattening resolves the CNAME chain internally and returns the final A record. AWS Route 53's ALIAS record does the same — it's a Route 53 abstraction that lets you map `example.com` directly to an ALB or CloudFront distribution. Both solve the RFC violation by doing the indirection server-side before the response leaves the nameserver. I've seen this misconfiguration burn teams who migrate to a CDN, correctly update `www`, then wonder why the naked domain returns SERVFAIL.

**SOA (Start of Authority)** is the zone's metadata header: primary nameserver, admin contact, serial number, and the refresh/retry/expire/minimum TTL intervals. The serial number is the synchronization primitive — secondaries compare their local serial against the primary's SOA serial, and a higher primary serial triggers a zone transfer. Forget to increment the serial after edits on a primary, and secondaries will silently serve stale data.

**TXT records** carry arbitrary text but are load-bearing infrastructure in practice. SPF records tell receiving MTAs which IPs are authorized to send mail for your domain. DKIM records publish the public key that verifies message signatures. When your mail infrastructure changes and the DNS records don't follow, deliverability degrades silently — messages land in spam, the feedback loop is slow, and the DNS drift often goes unnoticed for days.

## Caching, TTLs, and the Propagation Delay Trap

You don't control when the internet "sees" your DNS change. You only control how long resolvers are *allowed* to cache the previous answer.

**TTL is a lease duration, not a cache expiry signal.** Every DNS record carries a TTL that tells resolvers how many seconds they may serve that answer from cache before re-querying. A `3600` on an A record means any resolver that fetched it can serve the cached IP for up to an hour without touching your authoritative nameserver again.

"DNS propagation" is just the gradual expiration of cached copies scattered across tens of thousands of recursive resolvers worldwide, each on its own independent TTL countdown. There is no central push. No broadcast. No synchronization event.

**The migration trap — I've watched this repeatedly.** Zone record sits at `TTL 3600`. Migration window opens. Engineer drops TTL to `60` and updates the A record simultaneously. Half the internet is already caching the old IP with a full hour left on their local TTL clock. That TTL change is invisible to them; they already have the answer. The new 60-second TTL only applies to resolvers fetching *after* the change.

**The fix:** lower your TTL to 60–300 seconds **24–48 hours before** the cutover. Let the short TTL propagate at the original TTL's pace. Do the cutover. Then restore the long TTL post-migration.

**Negative caching compounds this.** NXDOMAIN responses are also cached, with TTL governed by the `minimum` field in your zone's SOA record. Delete a record, then immediately recreate it? Resolvers that caught the deletion can serve NXDOMAIN for the full negative cache duration — often 30 minutes to an hour — regardless of the new record's existence.

**Resolver-side TTL clamping.** Some ISP resolvers impose a minimum cache floor, ignoring TTLs below 60–300 seconds and caching longer than specified. AWS Route 53 health-check failover nominally fires within one TTL interval at `60s`, but in practice ISP clamping can extend client impact by several minutes. Fast-failover designs that depend on sub-minute TTLs need to account for this ceiling you don't control.

## Anycast and GeoDNS

When you query `1.1.1.1`, you're not talking to a single server. You're talking to whichever of Cloudflare's 300+ points of presence BGP has decided is topologically closest to you at that moment. The IP is the same everywhere. The server handling your query is not.

**Anycast routing** works by announcing the same IP prefix from multiple autonomous systems simultaneously. BGP's path selection naturally routes each query to the nearest PoP. No client-side configuration, no explicit load balancing tier, no DNS round-robin. The network fabric itself is the load balancer. Cloudflare's anycast deployment achieves a median global query latency under 14ms precisely because most queries never travel more than a few hundred miles.

**GeoDNS** operates at a higher layer — it returns different *answers* based on where the query originates. Same domain name, different IP pools depending on region. Netflix does this at scale: `open.netflix.com` resolves to US edge clusters for US users and EU edge clusters for European users, enabling both latency optimization and data residency compliance.

**The resolver IP vs. client IP problem.** An authoritative GeoDNS server doesn't see the end user's IP — it sees the recursive resolver's IP. A user in São Paulo hitting Google Public DNS (`8.8.8.8`) might get routed to a US east coast cluster because Google's resolver appears to originate from a US data center. EDNS Client Subnet (ECS) addresses this by embedding a truncated client subnet prefix in the query. The trade-off is cache fragmentation: the resolver now caches responses keyed on subnet, not just query name, which meaningfully reduces resolver-side hit rates.

## Production Failure Modes

DNS failure modes are disproportionately severe relative to their apparent complexity. A single misconfigured record, an expired signature, or a lapsed domain registration can silently erase your entire service from the internet.

**DNS-based failover has a TTL floor.** If your A record has a 300-second TTL and your primary datacenter goes down at T+0, resolvers with cached responses will keep sending traffic there until T+300 — minimum. Design your failover SLAs around this reality.

**Split-horizon DNS is operationally treacherous.** Serving different answers to internal vs. external clients breaks silently when misconfigured. A service that resolves correctly from the corporate VPN might NXDOMAIN from a CI runner with a different resolver path. The failure doesn't announce itself.

**DNSSEC failures are catastrophic, not graceful.** When DNSSEC breaks — expired RRSIG records, failed key rollovers, broken DS record chains — validating resolvers return hard SERVFAIL for the entire zone. The domain appears to vanish. A classic failure: a zone administrator activates a new Key Signing Key but forgets to publish the updated DS record at the parent zone first. Validating resolvers immediately start failing the delegation chain. The fix requires parent zone cooperation and propagation time you don't have during an incident.

**Registrar-level failures sit above everything else in the stack.** The GoDaddy DNS outage in 2012 took down authoritative nameservers for millions of domains via a botched internal router update — nameserver reliability is irrelevant when the NS delegation itself is unreachable. If your domain registration lapses, no amount of authoritative server redundancy helps.

**DNS amplification.** Attackers spoof a victim's IP, send small queries to open resolvers, and those resolvers send large responses — up to 50x amplification — to the spoofed address. Mitigation requires BCP38 egress filtering upstream and disabling open recursion on your authoritative infrastructure.

## DNS in Kubernetes and Service Discovery

Kubernetes CoreDNS resolves names like `my-service.my-namespace.svc.cluster.local` to the cluster-internal virtual IP of a Service. For headless services (`ClusterIP: None`), DNS returns all backing pod IPs directly — exactly what StatefulSets need so clients can address `postgres-0.postgres.default.svc.cluster.local` as a stable identity across rescheduling.

The operational trap is TTL interaction with connection pooling. CoreDNS typically returns TTLs of 5–30 seconds, but HTTP/2 and gRPC clients hold persistent connections. When a pod restarts and gets a new IP, pooled connections targeting the stale IP continue routing to a dead endpoint until the connection errors out — the DNS TTL becomes irrelevant because the client never re-resolved.

The fundamental trade-off DNS-based discovery makes is freshness for ubiquity. Understanding that trade-off is what separates its correct use from its misuse in latency-sensitive or high-churn environments.

## What to Take Away

**Pre-lower TTLs 24–48 hours before any migration.** Once you flip the record, you've surrendered control to cached copies at the original TTL — there's no mechanism to invalidate them.

**DNS failover speed is bounded by TTL, full stop.** If you need sub-minute recovery, layer in application-level health checks and connection retries. Shorter TTLs alone increase resolver load without closing the gap meaningfully.

**CNAME-at-apex is an RFC violation.** Use ALIAS records (Route 53) or CNAME Flattening (Cloudflare) when pointing a root domain to a CDN or load balancer hostname.

**GeoDNS accuracy isn't guaranteed.** ECS support varies across resolvers. Test from diverse vantage points before trusting your latency models.

**Treat DNS as infrastructure.** Version-control zone files, manage records via Terraform or provider APIs, and audit regularly for dangling CNAMEs. A CNAME pointing to a deprovisioned S3 bucket or Heroku app is a live subdomain takeover vector. Zone changes belong in PRs, not console sessions.

---

*Originally published at [anvilry.vercel.app](https://anvilry.vercel.app/notes/how-dns-works). Part of my System Design series.*
