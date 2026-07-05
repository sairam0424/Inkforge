---
slug: trelix-v1-launch
title: "I Built trelix Because I Was Tired of Grepping My Way Through Codebases"
platform: substack
status: draft
canonical_url: https://anvilry.vercel.app/notes/trelix-code-intelligence-engine
paste_workflow: "SUBSTACK PASTE: Run python3 /tmp/render-substack-trelix.py — opens browser, Cmd+A, Cmd+C — then paste into Substack editor body"
---

I spent my first day on a new team grepping through 80,000 lines of code trying to find where authentication worked.

Four hours. Three teammates interrupted. Twelve dead ends across files I didn't understand. The code was fine — it was well-written, well-organized, reasonably documented. The tooling was the problem. I was using grep to understand something that wasn't a text search problem.

Code has structure: call edges, import chains, type hierarchies, AST relationships. Grep ignores all of it.

That day stuck with me. I kept running into the same pattern on different teams, different codebases, different languages. Every time I joined something new or came back to a project after six months away, the first few days were archaeology. Tracing calls manually. Reconstructing context that should have been queryable.

I know this problem from both sides. At Ascendion I co-built AAVA Code — an AI coding plugin for VS Code used by 3K+ developers daily across 5+ client environments. Every new client onboarding meant day one was archaeology: unfamiliar codebase, no fast way to answer "how does X work?" without interrupting someone who knew.

I built trelix to fix this.

## What trelix Is

trelix is an open-source code intelligence engine. It indexes any repository with Tree-sitter AST parsing, embeds every symbol, and answers natural-language questions using hybrid BM25 + vector + call-graph search. It works offline. No API key needed. Zero infrastructure — everything lives in a single SQLite file.

```
pip install "trelix[local]"
trelix index ./my-repo
trelix ask ./my-repo "how does the authentication middleware work?"
```

That's the whole install. No Docker. No Postgres. No Redis. A single `.trelix/index.db` file that contains vectors, BM25, call graph, import graph, and every symbol in your codebase.

## The Problem With Code Search

The tools we have for understanding code were designed for writing code, not understanding it at scale. They're excellent at navigating to a known destination. They're poor at answering questions like "how does the request lifecycle work end-to-end?" when you don't already know the answer.

The fundamental limitation of grep is that it treats your codebase as a document corpus. It finds strings. Code isn't a document corpus — it's a graph. Functions call other functions. Modules import other modules. Classes extend other classes.

When you ask "how does authentication work?", the answer isn't a file. It's a traversal of that graph, starting from a semantic entry point and following edges to collect the relevant context.

Vector search solves part of this — semantic similarity gets you closer to the right files without knowing the exact tokens. But pure vector search misses structural relationships. It doesn't know that `UserRepository.get_by_token()` is always called by `AuthMiddleware.verify()` which is called by every protected route handler. That's call-graph knowledge, not embedding knowledge.

trelix uses both.

## How It Works

The indexing pipeline has four phases:

**Parse** — Tree-sitter walks every file and extracts symbols with their source, line spans, and AST structure. Runs in parallel across files. Supports 20+ languages: Python, TypeScript, Go, Java, Rust, C, C++, C#, Kotlin, Ruby, JavaScript, and more.

**Write** — Symbols and chunks are written to SQLite. Cross-file parent_id relationships are resolved.

**Embed** — Every chunk is embedded asynchronously in batches of concurrent API calls. With the local provider (sentence-transformers), this runs entirely offline with no API key.

**Resolve** — Cross-file call edges are resolved with a 3-priority strategy: qualified name first, then type hint + name, then name-only fallback. This gives about 40% fewer false-positive cross-file edges compared to name-only matching.

When you run `trelix ask`, a 3-tier adaptive router decides how to answer:

**Tier 1 (Direct)** — for simple factual patterns like "what is X", trelix skips retrieval entirely and answers from the LLM directly.

**Tier 2 (8-intent)** — for most code queries, it classifies intent (symbol lookup, feature flow, dependency map, blast radius, etc.) and runs the appropriate retrieval strategy.

**Tier 3 (Multi-step)** — for complex queries, it decomposes the question into sub-queries, runs each independently, and merges the results.

All retrieval legs — BM25, vector, grep, call-graph BFS, file summaries, SPLADE-Code, multi-granularity — are fused via Reciprocal Rank Fusion before synthesis.

## The Features I'm Most Proud Of

**GitHub PR review** (v2.4.0). `trelix review --pr owner/repo#42` fetches the PR diff, retrieves codebase context for each changed hunk, runs an LLM review, and posts findings back to GitHub with `--post-comments`. The insight is simple: reviewing a diff without understanding the surrounding codebase is like proofreading a sentence you've never read in context.

**Federated search** (v2.3.0). `trelix search-all "query"` fans out across all registered repos simultaneously and RRF-merges the results. With `trelix watch-all`, a single file-watcher monitors all registered repos at once. The TTL cache gives about 90% hit rate for typical debugging-session query patterns.

**MCP integration**. One command and trelix is available inside Claude Code, Cursor, Windsurf, and Continue.dev:

```
pip install trelix-mcp
claude mcp add trelix -- trelix-mcp
```

**Agentic ReAct loop** (v2.2.0). With `TRELIX_RETRIEVAL_AGENTIC=true`, trelix does multi-turn retrieve→observe→re-retrieve with self-correction. If the first retrieval pass doesn't surface enough context, it reasons about what's missing and queries again. FLARE (confidence-gated re-retrieval) adds a complementary layer: when synthesis spans show uncertainty, it re-queries before finalizing the answer.

## What Surprised Me

I expected the hardest part to be the embedding and retrieval architecture. It wasn't. The hardest part was making the call-graph resolver precise enough to be useful.

My first version used name-only matching for cross-file call edges. `login()` in file A calls `login()` in file B. This produced a dense, noisy graph with roughly 40% false-positive edges. The fix was a 3-priority resolution strategy: qualified name first (most precise), then type hint + name, then name-only as fallback. That cut false positives significantly while maintaining recall on codebases without full type annotations.

The other thing I didn't expect: how much of the value comes from the structural metadata rather than the semantic embeddings. The call graph, import graph, and type hierarchy are what make trelix's answers qualitatively different from vector search over code files. Semantic similarity gets you to the right neighborhood. Graph traversal gets you to the right answer.

## How to Try It

```
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

Everything is MIT licensed, on PyPI, and at [github.com/sairam0424/trelix](https://github.com/sairam0424/trelix).

---

What's the longest you've spent trying to understand a piece of code you didn't write? I've had four-hour archaeology sessions on codebases with good documentation. I'd like to know how much of that time was the code being genuinely complex versus the tooling failing you.
