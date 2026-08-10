---
slug: trelix-v2-release
platform: linkedin
type: text-post
status: draft
---

## Post caption (longer variant — primary)

See post-caption.txt

## Post text (shorter single-text-post alternative)

trelix v2.7.0 is out — code intelligence for your entire codebase, still zero-infra.

New since v1.0:
- Knowledge Graph: community detection, PageRank symbol boosting, incremental updates on file watch
- 7 fused retrieval legs (BM25, vector, call graph, RAPTOR file summaries, HyDE, multi-query, FLARE)
- Agentic ReAct loop + data-flow/taint analysis + SPLADE-Code sparse retrieval
- Federated multi-repo search with cross-repo symbol resolution
- `trelix review --pr owner/repo#N --post-comments` — automated GitHub PR review + Actions workflow
- DimensionGuard — fails fast on embedding mismatch instead of silently returning wrong results
- VS Code extension scaffold + MCP resource subscriptions

1,508 tests. Still one SQLite file, no vector DB required.

GitHub: https://github.com/sairam0424/trelix

## Upload instructions

1. Go to LinkedIn -> Create post
2. Paste post-caption.txt as the post body (or use the shorter variant above if you want a tighter post)
3. Add a genuine reply to the first few comments within 2 hours
4. Link: https://github.com/sairam0424/trelix
