---
slug: trelix-v1-launch
title: "I Built trelix Because I Was Tired of Grepping My Way Through Codebases"
platform: devto
status: draft
tags: ["python", "opensource", "ai", "codesearch"]
cover_image: assets/trelix-v1/cover.png
canonical_url: https://anvilry.vercel.app/notes/trelix-code-intelligence-engine
---

I spent my first day on a new team grepping through 80,000 lines of code trying to find where authentication worked.

Four hours. Three teammates interrupted. Twelve dead ends across files I didn't understand. The code was fine — it was well-written, well-organized, reasonably documented. The tooling was the problem. I was using grep to understand something that wasn't a text search problem. Code has structure: call edges, import chains, type hierarchies, AST relationships. Grep ignores all of it.

That day stuck with me. I kept running into the same pattern on different teams, different codebases, different languages. Every time I joined something new or came back to a project after six months away, the first few days were archaeology. Tracing calls manually. Reconstructing context that should have been queryable.

I know this problem from both sides. At Ascendion we built AAVA Code — an AI coding plugin for VS Code used by 3K+ developers daily across 5+ client environments. Every new client onboarding meant day one was archaeology: unfamiliar codebase, no fast way to answer "how does X work?" without interrupting someone who knew. The tooling pain was consistent regardless of how good the codebase was.

I built trelix to fix this. It's an open-source code intelligence engine that indexes any repository with Tree-sitter, embeds every symbol, and answers natural-language questions using hybrid BM25 + vector + call-graph search. It works offline. No API key needed. Zero infrastructure.

```bash
pip install "trelix[local]"
trelix index ./my-repo
trelix ask ./my-repo "how does the authentication middleware work?"
```

## The Problem With Code Search

The tools we have for understanding code — editors, grep, ctags, language servers — were designed for writing code, not for understanding it at scale. They're excellent at navigating to a known destination. They're poor at answering questions like "how does the request lifecycle work end-to-end?" or "what calls this function, and what does that caller depend on?" when you don't already know the answer.

The fundamental limitation of grep is that it treats your codebase as a document corpus. It finds strings. Code isn't a document corpus — it's a graph. Functions call other functions. Modules import other modules. Classes extend other classes. When you ask "how does authentication work?", the answer isn't a file or even a few files. It's a traversal of that graph, starting from a semantic entry point and following edges to collect the relevant context.

Vector search solves part of this — semantic similarity gets you closer to the right files without knowing the exact tokens. But pure vector search misses structural relationships. It doesn't know that `UserRepository.get_by_token()` is always called by `AuthMiddleware.verify()` which is called by every protected route handler. That's call-graph knowledge, not embedding knowledge.

trelix uses both.

## What trelix Does

trelix indexes any repository into a single SQLite file (`.trelix/index.db`) and then answers questions about it.

The index contains: every symbol extracted via Tree-sitter (functions, classes, methods, their bodies and line spans); call edges and import edges between symbols and files; a hybrid search index combining sqlite-vec HNSW vectors with FTS5 BM25; and since v2.1.0, a Code Property Graph that unifies all of the above into a traversable NetworkX graph.

A query like `trelix ask ./repo "explain how authentication works"` goes through a 3-tier adaptive router:

**Tier 1 (Direct)** — for simple factual patterns like "what is X" or "define X", trelix skips retrieval entirely and answers from the LLM directly. No unnecessary round-trips.

**Tier 2 (8-intent)** — for most code queries, it classifies the intent into one of eight categories (symbol_lookup, feature_flow, dependency_map, blast_radius, etc.) and runs the appropriate retrieval strategy.

**Tier 3 (Multi-step)** — for complex queries like "walk me through the request lifecycle end-to-end", it decomposes the question into 2-3 sub-queries, runs each independently, and merges the results.

Results from all active retrieval legs are fused via Reciprocal Rank Fusion (k=60) before being assembled into the context window for LLM synthesis.

## How It Actually Works

The indexing pipeline runs in four phases:

**Phase 1 (Parse)** — Tree-sitter walks every file and extracts symbols with their source, line spans, and AST structure. Runs in parallel via ThreadPoolExecutor.

**Phase 2 (Write)** — Symbols and chunks are written to SQLite. Cross-file parent_id relationships are resolved.

**Phase 3 (Embed)** — Every chunk is embedded asynchronously in batches of 4 concurrent API calls. With the local provider (sentence-transformers, no API key), this runs entirely offline.

**Phase 4 (Resolve)** — Cross-file call edges are resolved with a 3-priority strategy: qualified name first, then type_hint+name, then name-only fallback. This gives about 40% fewer false-positive cross-file edges compared to name-only matching.

The result is a single `.trelix/index.db` file that contains everything: vectors, BM25, call graph, import graph, symbols, file hashes for incremental updates.

## Zero Infrastructure, Full Power

This was a deliberate design decision and one I keep coming back to.

Most code intelligence tools require running a vector database, a relational database, and often a separate API server. That's a lot of infrastructure to maintain for what is fundamentally a local developer tool. trelix's default is a single SQLite file using sqlite-vec for HNSW vector search and FTS5 for BM25. Zero external infrastructure. Works on a laptop with no internet connection.

When you need to scale: LanceDB backend for 100k+ chunks (3-5× faster vector insert on ARM/Apple Silicon), Qdrant for 500k+ chunk deployments with multi-repo shared collections. But the default handles most codebases and most developers will never need to switch.

```bash
# Default (sqlite) — up to ~100k chunks
trelix index ./my-repo

# LanceDB — 100k+ chunks
TRELIX_STORE_BACKEND=lance trelix index ./my-repo

# Qdrant — 500k+ chunks
TRELIX_STORE_BACKEND=qdrant trelix index ./my-repo
```

## Beast Mode: Seven Retrieval Legs

The default setup (BM25 + vector + grep + call graph) handles most questions well. But trelix has five additional retrieval legs that you can enable when you need higher recall or more sophisticated query handling:

**Leg 5: File-summary semantic search** — RAPTOR-style (arXiv:2401.18059). At index time, trelix generates LLM summaries of every file and embeds those summaries separately. This surface is especially good for "explain this codebase" or "what files deal with payment processing?" queries — questions where the answer is at the file level, not the symbol level.

**Leg 6: SPLADE-Code** — sparse+dense hybrid via learned sparse retrieval. SPLADE encodes queries into sparse high-dimensional token vectors, expanding vocabulary beyond exact matches in a way that complements both BM25 and dense vector search.

**Leg 7: Multi-granularity** — indexes code at block AND statement level simultaneously. Some queries are better answered by a full function body; others are better answered by a single statement. Having both granularities in the index improves recall on precise questions.

Plus query-side enhancements: **HyDE** (generates a hypothetical code answer as the ANN query vector, improving recall on abstract questions), **FLARE** (confidence-gated re-retrieval — when synthesis spans show uncertainty, trelix re-queries before finalizing the answer), and since v2.2.0, an **agentic ReAct loop** that does multi-turn retrieve→observe→re-retrieve with self-correction.

The agentic loop and FLARE aren't academic — I built RAG + ReAct pipelines in production at Ascendion (Pensieve, 2K+ daily users; the Execution Engine, 1.5K+ users). The pattern of retrieve→observe→re-retrieve is what those systems actually needed to produce reliable structured output. trelix's agentic mode comes directly from that experience.

```bash
# Enable everything
TRELIX_RETRIEVAL_AGENTIC=true \
TRELIX_GRAPH_SEARCH_ENABLED=true \
TRELIX_RETRIEVAL_FILE_SUMMARY_LEG=true \
TRELIX_RETRIEVAL_HYDE_FALLBACK=true \
TRELIX_RETRIEVAL_FLARE=true \
TRELIX_RETRIEVAL_SPARSE=true \
TRELIX_CHUNKER_MULTI_GRANULARITY=true \
trelix ask ./my-repo "explain the full request lifecycle"
```

## The Features I'm Most Proud Of

**GitHub PR review.** This is v2.4.0 and it's become one of the most-used features. `trelix review --pr owner/repo#42` fetches the PR diff from GitHub, retrieves codebase context for each changed hunk, runs an LLM review, and can post findings back as a single batched review comment with `--post-comments`. The key insight is that reviewing a diff without understanding the surrounding codebase is like proofreading a sentence you've never read before.

```bash
trelix review --pr sairam0424/trelix#42
trelix review --pr sairam0424/trelix#42 --post-comments
```

**Federated search.** `trelix search-all "query"` fans out across all registered repos in parallel via ThreadPoolExecutor and RRF-merges the results. With `trelix watch-all`, a single `watchfiles.awatch()` call watches all registered repos simultaneously. The TTL cache on FederatedRetriever gives about 90% hit rate for typical debugging-session query patterns.

```bash
trelix federation add api ./services/api
trelix federation add web ./services/web
trelix search-all "JWT validation"
trelix watch-all
```

**MCP integration.** One command and trelix is available inside Claude Code, Cursor, Windsurf, and Continue.dev:

```bash
pip install trelix-mcp
claude mcp add trelix -- trelix-mcp
```

Then inside Claude Code: *"index my repo at /path/to/repo, then find how authentication works"*.

We built AAVA Code as an AI coding plugin for VS Code with 150+ skills and 40+ tools. The MCP integration in trelix is the open-source version of what I learned from that work — getting intelligence about a codebase into the IDE context where the developer is actually working, without context-switching.

## What Surprised Me Building This

I expected the hardest part to be the embedding and retrieval architecture. It wasn't. The hardest part was making the system opinionated enough to be useful without being so opinionated that it broke on unusual codebases.

The call-graph resolver was the most representative example. My first version used name-only matching for cross-file call edges — `login()` in file A calls `login()` in file B. This produced a dense, noisy graph with maybe 40% false-positive edges. The fix was a 3-priority resolution strategy: try qualified name first (most precise, lowest recall), then type hint + name (moderate precision), then name-only as fallback. That reduced false positives significantly while maintaining recall on codebases that don't have full type annotations.

The other thing that surprised me was how much value came from the structural metadata rather than the semantic embeddings. The call graph, import graph, and type hierarchy are what make trelix's answers qualitatively different from a vector search over code files. Semantic similarity gets you to the right neighborhood. Graph traversal gets you to the right answer.

## What I'm Still Uncertain About

The 3-tier query router works well for the queries I've tested it on. I'm less confident about it on very large codebases (millions of lines) where the graph becomes expensive to traverse. The current implementation caps BFS depth at 2, which is usually right but occasionally misses important connections. I'm still figuring out the right heuristics for adaptive depth.

I'm also still calibrating the GraphRAG map-reduce threshold. The current default (activate at >20 results or >8k tokens) is conservative. For some query types it activates too eagerly; for others, not eagerly enough. This is the main retrieval parameter I'm watching in practice.

## Try It

```bash
# Offline — no API key
pip install "trelix[local]"
trelix index ./your-repo
trelix ask ./your-repo "how does your main feature work?"

# With LLM synthesis
pip install trelix
export OPENAI_API_KEY=sk-...
trelix ask ./your-repo "explain the request lifecycle end-to-end"

# MCP in Claude Code
pip install trelix-mcp
claude mcp add trelix -- trelix-mcp

# Review a PR
trelix review --pr owner/repo#42 --post-comments
```

Everything is MIT licensed, on PyPI, and at [github.com/sairam0424/trelix](https://github.com/sairam0424/trelix). The full documentation is in the repo README including the beast-mode activation block if you want all seven retrieval legs at once.

What's the longest you've spent trying to understand a piece of code you didn't write? I've had 4-hour archaeology sessions on codebases with good documentation. I'd like to know how much of that time you think was the code being genuinely complex versus the tooling failing you.
