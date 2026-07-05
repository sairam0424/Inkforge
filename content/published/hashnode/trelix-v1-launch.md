---
slug: trelix-v1-launch
title: "I Built trelix: A Code Intelligence Engine That Answers Questions About Your Codebase"
platform: hashnode
status: draft
series: "Building in Public"
originalArticleURL: https://anvilry.vercel.app/notes/trelix-code-intelligence-engine
tags: ["python", "opensource", "ai", "machinelearning", "developer-tools"]
---

I spent my first day on a new team grepping through 80,000 lines of code trying to find where authentication worked.

Four hours. Three teammates interrupted. Twelve dead ends. The code was fine — well-written, well-organized, reasonably documented. The tooling was the problem. I was using grep to understand something that wasn't a text search problem. Code has structure: call edges, import chains, type hierarchies, AST relationships. Grep ignores all of it.

I know this problem from both sides. At Ascendion we built AAVA Code — an AI coding plugin for VS Code used by 3K+ developers daily across 5+ client environments. Every new client onboarding meant day one was archaeology: unfamiliar codebase, no fast way to answer "how does X work?" without interrupting someone who knew. The tooling gap was consistent regardless of how good the code was.

I built trelix to fix this. It's an open-source Python code intelligence engine that indexes any repository with Tree-sitter, embeds every symbol, and answers natural-language questions using hybrid BM25 + vector + call-graph search. It works offline with no API key. Zero infrastructure.

```bash
pip install "trelix[local]"
trelix index ./my-repo
trelix ask ./my-repo "how does authentication work?"
```

## Why Existing Tools Aren't Enough

The tools we have for understanding code — editors, grep, language servers, ctags — were designed for writing code, not for understanding it at scale. They're excellent at navigating to a known destination. They're poor at answering questions like "how does the request lifecycle work end-to-end?" when you don't already know the answer.

Grep's fundamental limitation: it treats your codebase as a document corpus. It finds strings. Code isn't a document corpus — it's a graph. Functions call other functions. Modules import other modules. Classes extend other classes. When you ask "how does authentication work?", the answer is a traversal of that graph, not a text search.

Vector search solves part of this — semantic similarity gets you closer to the right files without knowing exact tokens. But pure vector search misses structural relationships. It doesn't know that `UserRepository.get_by_token()` is always called by `AuthMiddleware.verify()`, which is called by every protected route handler. That's call-graph knowledge. trelix uses both.

## What trelix Does

trelix indexes any repository into a single SQLite file (`.trelix/index.db`) and then answers questions about it.

The index contains: every symbol extracted via Tree-sitter (functions, classes, methods with source and line spans); directed call edges and import edges between symbols and files; a hybrid search layer combining sqlite-vec HNSW vectors with FTS5 BM25; and a Code Property Graph (NetworkX MultiDiGraph) unifying call + import + type hierarchy edges.

Queries go through a 3-tier adaptive router:

**Tier 1 (Direct)** — simple factual patterns (`what is X`, `define X`) skip retrieval entirely. No unnecessary round-trips.

**Tier 2 (8-intent classification)** — for most code queries, trelix classifies intent and routes to the right retrieval strategy. The 8 intents are: `symbol_lookup`, `file_overview`, `feature_flow`, `project_overview`, `comparison`, `config_lookup`, `dependency_map`, `blast_radius`. Each intent has a different set of active retrieval legs, graph expansion depth, and context assembly strategy.

**Tier 3 (Multi-step decomposition)** — for complex queries (`walk me through the request lifecycle end-to-end`), trelix uses an LLM to decompose into 2-3 sub-queries, runs each independently, and merges the results via RRF.

## The Architecture: How trelix Indexes Code

The indexing pipeline runs in four phases:

**Phase 1 — Parse.** Tree-sitter walks every file and extracts symbols with their source bodies, line spans, and AST structure. Parallelized via ThreadPoolExecutor (default: 4 workers). Supports 20+ languages: Python, TypeScript/TSX, JavaScript/JSX, Go, Java, Rust, C, C++, C#, Kotlin, Ruby, plus config formats (JSON, TOML, YAML) and markup (Markdown, HTML, CSS, Razor, CSHTML).

**Phase 2 — Write.** Symbols and chunks are inserted into SQLite. Cross-file `parent_id` relationships (nested classes, inner functions) are remapped.

**Phase 3 — Embed.** Every chunk is embedded asynchronously via `asyncio.gather` with a `Semaphore(4)` for concurrency control. With the `local` provider (sentence-transformers `all-MiniLM-L6-v2`), this runs entirely offline with no API key.

**Phase 4 — Resolve.** Cross-file call edges are resolved with a 3-priority strategy: qualified name first (highest precision), then type_hint+name, then name-only fallback. This gives ~40% fewer false-positive cross-file edges compared to name-only matching.

## Hybrid Search: Why One Leg Is Never Enough

Each retrieval leg captures different things:

**BM25 (FTS5)** — exact lexical match. Best for symbol names, error message strings, specific API names. Fast and precise when you know the term.

**Vector ANN** — semantic similarity. Best for concept queries ("how does session management work?") where you don't know the exact function names.

**Grep** — exact and regex. Best for finding specific patterns like UUID formats, specific error codes, exact string literals.

**Call-graph BFS** — structural. Finds code that's related by call relationships even when it shares no vocabulary with the query. Starting from a semantic seed (found by vector search), BFS traversal surfaces the entire call chain.

All results are fused via Reciprocal Rank Fusion with k=60. RRF is robust to score scale differences between legs — it uses rank position, not raw scores, so a BM25 score of 3.7 and a cosine similarity of 0.82 are directly comparable.

## Beast Mode: All Seven Retrieval Legs

The default (BM25 + vector + grep + call graph) handles most queries well. Five additional legs are available:

**Leg 5: File-summary semantic** — RAPTOR-style (arXiv:2401.18059). At index time, trelix generates LLM summaries of every file and embeds them separately. Good for "what files deal with payment processing?" — questions answered at the file level, not symbol level.

**Leg 6: SPLADE-Code** — sparse+dense hybrid. SPLADE encodes queries into sparse high-dimensional token vectors, expanding vocabulary beyond exact BM25 matches while staying interpretable.

**Leg 7: Multi-granularity** — indexes code at block AND statement level simultaneously. Some queries are better answered by a full function body; others by a single statement. Having both granularities improves recall on precise questions.

Plus query-side enhancements: **HyDE** (generates a hypothetical code snippet as the ANN query vector), **FLARE** (arXiv:2305.06983 — confidence-gated re-retrieval, re-queries when synthesis output shows uncertainty), and an **agentic ReAct loop** (multi-turn retrieve→observe→re-retrieve with self-correction).

The agentic loop isn't theoretical. At Ascendion I co-built Pensieve (2K+ daily users) and the Execution Engine (1.5K+ users) — both production multi-agent systems using RAG + ReAct pipelines. The retrieve→observe→re-retrieve pattern is what those systems needed to produce reliable, structured output at scale. trelix's agentic mode is the distillation of what actually worked in those environments.

```bash
# Enable all 7 legs
TRELIX_RETRIEVAL_AGENTIC=true \
TRELIX_GRAPH_SEARCH_ENABLED=true \
TRELIX_RETRIEVAL_FILE_SUMMARY_LEG=true \
TRELIX_RETRIEVAL_HYDE_FALLBACK=true \
TRELIX_RETRIEVAL_FLARE=true \
TRELIX_RETRIEVAL_SPARSE=true \
TRELIX_CHUNKER_MULTI_GRANULARITY=true \
trelix ask ./my-repo "explain the full request lifecycle"
```

## MCP Integration: trelix Inside Claude Code and Cursor

Since v0.5.0, trelix ships a separate `trelix-mcp` package that exposes an MCP server for Claude Code, Cursor, Windsurf, and Continue.dev.

```bash
pip install trelix-mcp
claude mcp add trelix -- trelix-mcp
```

The MCP server exposes four tools: `search_code` (hybrid semantic + BM25), `index_codebase` (index a repo), `get_symbol` (get full source of any symbol), and `blast_radius` (find everything that depends on a symbol).

Since v2.3.0, trelix also exposes MCP Resources — URI-addressable data that MCP clients can subscribe to: `trelix://index/stats` (aggregate statistics), `trelix://repo/{path}/manifest` (indexed file list), `trelix://repo/{path}/symbols/{qualified_name}` (symbol source). And MCP Prompts for structured LLM interaction templates (`trelix-search`, `trelix-explain`, `trelix-blast-radius`).

In v2.4.0, `search_code` got cursor pagination: it now returns `{results, next_cursor, total_available}` instead of a flat list. This is a breaking change if you're iterating the result directly — update to `response["results"]` and pass `response["next_cursor"]` as `cursor=` for the next page.

The MCP integration design comes directly from building AAVA Code — an AI coding plugin for VS Code with 150+ skills, 40+ tools, and ~60 commands that we built at Ascendion for 3K+ developers. The lesson from that work: the right level of abstraction for IDE integration is tools that understand the structure of the codebase, not just its text. trelix-mcp is the open-source version of that principle.

## The Features I Kept Reaching For

**GitHub PR review (v2.4.0).** `trelix review --pr owner/repo#42` fetches the PR diff from GitHub, retrieves codebase context for each changed hunk via `DiffReviewer`, runs an LLM review, and posts findings back with `--post-comments`. Token from `GITHUB_TOKEN` env var only. Handles all 7 file status values. The insight: reviewing a diff without codebase context is like proofreading a sentence you've never read before.

**Federated search (v2.3.0).** `trelix search-all "query"` fans out across all registered repos in parallel via ThreadPoolExecutor, RRF-merges results, and deduplicates by `(file_path, symbol_id)`. The `FederatedRetriever` TTL cache (v2.4.0, default 120s) gives ~90% hit rate for typical debugging-session query patterns. `trelix watch-all` uses a single `watchfiles.awatch()` call watching all registered repos simultaneously with a hash guard that prevents re-index cascade loops.

**DimensionGuard (v2.3.0).** Detects embedding provider/dimension mismatch at `Retriever.__init__` startup and raises `DimensionMismatchError` with the exact recovery instruction (`trelix migrate-vectors --reset`). Prevents the silent wrong-results bug when switching e.g. from Azure (3072-dim) to local (384-dim) embeddings without re-indexing.

## What v2.4.0 Added

Six backlog items shipped in v2.4.0:

`flare_max_retries` replaces `flare_max_iterations` (backward-compat via Pydantic `AliasChoices`, old name removed in v3.0.0).

`ExpandResult(queries, llm_used, elapsed_ms)` dataclass returned by `MultiQueryExpander.expand()`, with three new nullable columns in `query_telemetry` for observability.

`FederatedRetriever(registry, cache_ttl=120.0)` — SHA-256-keyed in-memory TTL cache, thread-safe.

`GitHubPRClient` + `trelix review --pr owner/repo#N --post-comments` — GitHub PR API integration.

`MultiRepoWatcher` + `trelix watch-all` — single watchfiles.awatch() over all registered repos.

`search_code` pagination: cursor-based offset, `{results, next_cursor, total_available}` envelope, `index_codebase` progress notifications via `ctx.report_progress()`.

## Try It Now

```bash
# Offline — no API key
pip install "trelix[local]"
trelix index ./your-repo
trelix ask ./your-repo "how does your main feature work?"

# Full power with OpenAI
pip install trelix
export OPENAI_API_KEY=sk-...
trelix ask ./your-repo "explain the full request lifecycle"

# MCP in Claude Code / Cursor
pip install trelix-mcp
claude mcp add trelix -- trelix-mcp

# GitHub PR review
trelix review --pr owner/repo#42 --post-comments

# Federated search across repos
trelix federation add api ./services/api
trelix search-all "JWT validation"
```

Everything is MIT licensed, 1,508 tests, on PyPI at `trelix`, `trelix-mcp`, `trelix-langchain`, `trelix-llama-index`. Source: [github.com/sairam0424/trelix](https://github.com/sairam0424/trelix).

---

What's the longest you've spent doing code archaeology — tracing calls, reconstructing context, trying to understand a system you didn't build? I've had four-hour sessions on well-documented codebases. I'd like to know how much of that time you think was the code's fault versus the tooling's.
