---
slug: dual-release-trelix-v2-tombstone-v1-4
platform: linkedin
type: text-post
status: draft
---

## Post text

Two releases this week:

**trelix v2.7.0** — code intelligence for your entire codebase, still zero-infra
- Knowledge graph with community detection + PageRank symbol boosting
- 7 fused retrieval legs (BM25, vector, call graph, RAPTOR, HyDE, multi-query, FLARE)
- Agentic ReAct loop + data-flow/taint analysis
- Federated multi-repo search
- Automated GitHub PR review (`trelix review --pr`)
- 1,508 tests, one SQLite file, no vector DB required

**Tombstone v1.4.2** — production intelligence for feature flags
- Helm chart now deploys all 5 services (was 2)
- Python SDK reaches full evaluation parity with the TypeScript SDK
- Redoc API explorer embedded in flag-api
- Flux CD + Argo CD GitOps, split-responsibility design
- Blast-radius scoring now gates Kubernetes canary rollouts
- CI hardened — no more `|| true`, all Actions pinned to SHAs

Both MIT licensed, both self-hosted.

trelix: https://github.com/sairam0424/trelix
Tombstone: https://github.com/sairam0424/Tombstone

Full writeups:
https://sairam0000.substack.com/p/trelix-v10-to-v27-when-it-works-meets
https://sairam0000.substack.com/p/tombstone-v13-v14-resilience-was

## Upload instructions

1. Go to LinkedIn -> Create post
2. Paste the "Post text" block above as the post body
3. Add a genuine reply to the first few comments within 2 hours
