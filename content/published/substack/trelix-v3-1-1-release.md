---
slug: trelix-v3-1-1-release
title: "trelix v2.11.0 to v3.1.1: Six Feature Areas, Every One of Them Off By Default"
platform: substack
status: live
published_url: https://sairam0000.substack.com/p/trelix-v2110-to-v311-six-feature?r=2xzeyx&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true
published_date: 2026-08-15
canonical_url: https://anvilry.vercel.app/notes/trelix-v3-1-1-release
---

Seed three events into an audit database, then reach past the application and change one row by hand:

```
$ sqlite3 audit.db "UPDATE audit_log SET principal='attacker' WHERE id=2"
$ trelix audit verify --db audit.db
Audit chain TAMPERED — first divergent entry id: 2
$ echo $?
1
```

Delete the newest row instead and it still catches it, naming id 3, even though the surviving rows form a perfectly valid chain. Point it at something SQLite cannot open and it exits 2 rather than 0, because "I could not check" and "I checked and it is clean" must never collapse into the same green build.

None of that existed six releases ago. `trelix audit verify` is one command out of six feature areas that landed in trelix v3.0.0, and it is the one that most changes what the project is for.

## What the major bump actually is

The span from v2.11.0 to v3.1.1 is six releases — v2.11.1, v2.12.0, v3.0.0, v3.0.1, v3.1.0 and v3.1.1, the last of them dated 2026-08-15 — 68 commits, 137 files changed, +19,829/-1,211 lines. v2.11.0 closed out the Jira and Linear connector work, which has its own story. Everything after it is a different kind of release.

v3.0.0 carries six new feature areas: Anthropic extended thinking, a model-aware context budget, a VS Code extension that acts instead of merely displaying, a hash-chained append-only audit trail, OIDC SSO, and query-conditioned context compression. Alongside them, an opt-in FTS5 declaration boost for keyword ranking.

It is a major bump because of scope, not breakage. Every one of those six is additive and off by default: `TRELIX_AUDIT_ENABLED=false`, `TRELIX_OIDC_ENABLED=false`, `TRELIX_LLM_THINKING_ENABLED=false`, `TRELIX_RETRIEVAL_COMPRESSION=false`, `declaration_boost_enabled` False, and `context_token_budget` still the exact `12_000` integer it was in v2.12.0. A default v3.0.0 install assembles context byte-identically to a default v2.12.0 install, and there is a test that proves it rather than a release note that asserts it.

## An audit trail you can hand to somebody else

The trail is a separate SQLite file. `AuditConfig.resolved_db_path` defaults to `<cwd>/.trelix/audit.db`, never the index database, for one blunt reason: the index is disposable, and an audit trail that disappears on reindex is not an audit trail.

Each row's `entry_hash` is `sha256(prev_hash || canonical_json(content))`, canonicalised in ten lines of `src/trelix/audit/store.py` with `sort_keys=True` and `separators=(",", ":")`. Exactly eleven columns are hashed, in a fixed `_CONTENT_COLUMNS` tuple, and the DB-assigned `id` is deliberately not among them: a writer cannot hash a value it does not have until after the INSERT.

That exclusion is why row ordering needs a second defence, and it explains the deleted-tail catch from the opening: a hash chain is structurally blind to truncation. An `audit_meta` table carries a running `count` and `head_hash`, upserted inside the same `with self._conn:` transaction as the insert, and `verify_chain` checks both against the chain it just walked. `audit_log.id` is `INTEGER PRIMARY KEY AUTOINCREMENT` rather than a rowid alias, so a delete-then-refill cannot close the gap it made.

`export TRELIX_AUDIT_ENABLED=true` turns the trail on and `trelix serve ./my-repo` starts recording (`TRELIX_AUDIT_DB_PATH` moves the file if you want it off `<cwd>/.trelix/audit.db`), `trelix audit list -n 50` reads it, and `trelix audit export --format ndjson` writes one JSON object per line so a SIEM can be fed by Filebeat or Vector. All of it is stdlib `sqlite3`, 54 tests cover the surface, and the store is fail-open by default (`AuditConfig.fail_closed: bool = False`) so a full disk is not an outage.

SSO is the identity half, and it is deliberately narrow: trelix is a resource server, not an OIDC client. No `/login`, no `/callback`, no code exchange, no refresh. It verifies tokens callers already hold. Three variables stand it up — `TRELIX_OIDC_ENABLED=true`, `TRELIX_OIDC_ISSUER` and `TRELIX_OIDC_AUDIENCE` — on top of `pip install 'trelix[sso]'`; `TRELIX_OIDC_ALGORITHMS` defaults to `["RS256", "ES256"]` and is asymmetric-only, enforced in `OidcVerifier.__init__`, again in `authenticate` against the unverified JWS header before any key resolution, and a third time in `jwt.decode`. The test that matters skips trelix's own header gate entirely: it signs a token with HS256 using a real 2048-bit public key's PEM as the HMAC secret — the canonical algorithm-confusion forgery — and asserts `jwt.decode` alone still refuses it. `Principal.principal_id` is `f"{self.subject}@{self.issuer}"`, never derived from email, because email-keyed identity is an account-takeover primitive, and the JWKS fetch is HTTPS-only, host-pinned and capped at 1 MiB — not hypothetical, since the pre-fix `response.read()` let a hostile issuer drive RSS from 59 MB to about 662 MB in 0.2 seconds.

The limits are in the docs rather than the marketing. The trail is tamper-evident, not tamper-proof: the chain and the anchor that checks it live in the same file, so anyone with write access can rewrite a row, recompute every subsequent hash and update the anchor in one transaction. There is sha256 and no key. Only the HTTP surface is audited, so an MCP-only deployment produces an empty trail and the agent loop's per-turn calls are invisible. `TRELIX_AUDIT_RETENTION_DAYS` is declarative only — nothing prunes — and `/health` is audited, so liveness probes will dominate the row count. This is authentication, not authorization — OIDC `groups` are captured and stored but enforced nowhere — and there is no SAML, with no plan for it; put a broker in front.

## Thinking, and a budget that knows which model you are talking to

Extended thinking is a request parameter, not a model. `AnthropicBackend._thinking_kwargs()` returns one dict, merged into both `messages.create` and `messages.stream`:

```python
return {
    "thinking": {
        "type": "enabled",
        "budget_tokens": self._config.thinking_budget_tokens,
    }
}
```

No model string in trelix changes. `TRELIX_LLM_THINKING_ENABLED` defaults False and `TRELIX_LLM_THINKING_BUDGET_TOKENS` to 4096.

Only one component opts in — `RetrievalSynthesizer`, at two call sites. The index-time callers, `ContextualChunker` and `FileSummarizer`, do not pass the keyword at all; a single global flag would have turned an indexing run into roughly five to ten times the LLM cost to produce reasoning nobody reads.

One consequence is worth stating plainly: enabling thinking forces `temperature` to 1.0 in both `complete()` and `stream()`, overriding whatever the caller passed — and the synthesizer does pass 0.0 and 0.2, so a flag named `thinking_enabled` silently ends near-deterministic synthesis. Thinking also bills as output tokens with no separate counter, so `ChatResponse.output_tokens` mixes answer and reasoning.

The model-aware budget is opt-in via a value rather than a flag. `context_token_budget: int | None` still defaults to `12_000`; set it to `null`, `none`, `auto` or empty and `Retriever._resolve_effective_budget()` returns `int(window * context_window_fraction)`, fraction defaulting to 0.5. `resolve_window()` is a first-match scan over a hand-ordered 37-entry table in `src/trelix/llm/context_windows.py`, so `gpt-4o-2024-11-20` resolves to 128000. Provider-prefixed Bedrock ids do not resolve: `us.anthropic.claude-sonnet-4-20250514-v1:0` returns `None` and falls back to 12,000 with a WARNING — exactly the default a Bedrock user setting `auto` was trying to escape.

Raising the budget alone changes very little, and the config docstring says so: `rerank_top_n` defaults to 15 and `top_k_vector`/`top_k_bm25` to 20/20, which cap the candidate pool before the packer ever sees a budget. `TRELIX_RETRIEVAL_SCALE_TOP_K_TO_BUDGET` is the explicit opt-in that multiplies `top_k_vector` and `rerank_top_n` — but not `top_k_bm25` — by `effective_budget / 12_000`, taking `top_k_vector` from 20 to 106 on gpt-4o's 64,000. It stays off because it raises per-query cost on three axes at once.

## Compression that cannot cost you a result

`pack_compressed` runs two waves. Wave 1 is the exact pre-existing uncompressed pack, with the compressor never called. Wave 2 walks the same candidate pool and skips anything already selected, so it only ever gets a second look at candidates wave 1 could not fit — the ones the old packer silently dropped. Accepted entries are appended, never substituted, then re-sorted into ranking order. The compressed selection is a strict superset of the uncompressed one, so Recall, MRR and nDCG cannot regress by construction. That is a property you read; no ranking experiment required. It cannot blow the ceiling either: `remaining` is recomputed per candidate, and anything that will not fit even at `_FLOOR_RATIO = 0.01` lands in `stats["skipped"]`.

Citation fidelity is structural. `format_compressed_blocks()` emits one `[Lines a-b] <qualified_name>` header per kept span with an explicit `# ... N lines elided ...` marker in every gap, and each header's text is sliced from the body by the same arithmetic that produced the header. Spans are clamped where they are created and re-filtered again at render time — two independent gates on one invariant, which matters because roughly 35 extractor sites store a truncated body while keeping the full AST span. A header claiming lines its own text does not contain manufactures a confident, wrong citation in a prompt that will quote it verbatim.

`ExtractiveCompressor`, the default provider, does zero query-time inference — it reads sub-chunk vectors that already exist from index time. The tripwire that lets me claim the off path is unchanged is `tests/unit/test_assembler_backcompat_golden.py`, which loads the pre-compression assembler out of `git show v2.12.0:src/trelix/retrieval/assembler.py` and diffs the new one across 8 intents — 177 assertions, including `[id(r) for r in new_ctx.results] == [id(r) for r in old_ctx.results]`, so no reordering hides behind equal text.

The headline "query-conditioned" path is by default lexically conditioned: sub-chunk rows require `TRELIX_CHUNKER_MULTI_GRANULARITY=true` (default false), are Python-only even then, and need the query embedding already resident in the embedder's LRU. The changelog's performance claim keeps its hedge: roughly 30-60% fewer synthesis input tokens and 15-35% lower latency on a network-API synthesis path, on the compressible intents. That is an expectation, not a benchmark.

## The editor surface, and one ranking flag

The VS Code extension is the most visible feature of the release and it needed no server work, because the MCP surface already was the API: it spawns `trelix-mcp` over stdio and builds all four features from `search_code`, `get_symbol`, `ask_agent` and `blast_radius`.

Code lenses re-fire on every keystroke, so the performance contract is enforced in the provider rather than documented. `provideCodeLenses` makes zero MCP calls — its only external call is `vscode.executeDocumentSymbolProvider` — and only the count-bearing lens reaches MCP, through `resolveCodeLens`, for lenses VS Code actually paints, keyed on `${docUri}@${docVersion}::${symbolName}`. The version component is the difference between a cache and a correctness bug: any edit must miss rather than show a stale dependent count.

Chat became possible because of a bug fix that is the same change as the feature. `TrelixMcpClient.ask()` used to call `getPrompt({ name: "trelix-search" })` and render the joined result as the answer — but `getPrompt` returns a filled-in prompt *template*, so what users saw was scaffolding telling them to use the `search_code` tool. No type checker could have caught it, because both calls return well-formed data and only one of them is an answer. The fix calls `ask_agent`, which runs the multi-turn ReAct loop and returns `{answer, session_id, turn_count}`; that `session_id` is what makes follow-up questions work, so multi-turn chat was structurally impossible until `ask()` moved. The regression test asserts `getPromptCalls === 0`.

The limitations sit next to the constants that cause them. `const THREAD_KEY = "default"` exists because the 1.95 chat API gives the handler no stable thread id, so two chat threads open at once share one agent session. The `/explain`, `/search` and `/impact` slash commands are stateless one-shot calls carrying no session at all. The extension is not on the Marketplace: `cd workspace-vscode && npm install && npm run build && npm run package` gets you a `.vsix`. Its manifest is still at 0.3.0, so the file name does not tell you which feature set it contains.

The declaration boost is the smallest feature in the release and the easiest to demonstrate, because trelix's own search engine could not find its own search engine. Query the live self-index for `bm25_search` and the method that implements it — `Database.bm25_search` in `src/trelix/store/db.py` — comes back at rank 34 of 90 matches under default unweighted FTS5, beaten by sixteen test functions and four documentation headings that merely mention the term. With `top_k_bm25` defaulting to 20 that is a recall failure, not a ranking nuisance: it is out of the candidate pool before fusion or reranking runs. `declaration_boost_weight=5.0` moves it to rank 9. The mechanism is a reweighted `bm25(symbols_fts, ?, ?, 1.0, 1.0, 1.0)` call applying the weight to `name` and `qualified_name` only — no schema change, no reindex — and it is one-directional: rows with no name match score byte-identically at both weights. It is gated twice, `declaration_boost_enabled` False and `declaration_boost_weight` 1.0, with the default no-op pinned by an exact-equality test over the returned score pairs. To reproduce the rank move: `export TRELIX_RETRIEVAL_DECLARATION_BOOST=true` and `export TRELIX_RETRIEVAL_DECLARATION_BOOST_WEIGHT=5.0`.

## Then three releases proving the surface was true

A big feature drop earns a specific obligation, and v3.0.1, v3.1.0 and v3.1.1 are what paying it looks like.

v3.0.1 is the consequential one. `PythonParser.parse()` recorded local indices into its `symbols` list during the walk, then ran `symbols.insert(0, <module>)` afterwards whenever the module had a docstring — shifting every recorded index by one. `Symbol.parent_id`, `CallEdge.caller_id` and `TypeEdge.from_symbol_id` all pointed into that list, so one off-by-one corrupted the call graph, the symbol hierarchy and the type graph at once. It never raised and never produced a NULL, because `Indexer` builds `local_to_db` from the final symbols list, so a pre-insert index still resolved to a valid row. Just the wrong one. A validity check passes; only a correctness check catches this. The fix reserves `symbols[0]` before the walk. The release-time measurement was 8,815 of 8,815 index references wrong across 139 source files, which is arithmetic rather than sampling: all 2,179 symbols lived in the 131 docstring-bearing files.

**v3.0.1 requires a reindex.** v3.0.0's release note said upgrading from v2.12.0 needed no reindex and no migration — true of the schema, false of the graph. The graph the old parser wrote is wrong on disk and no code path corrects it in place. If you upgraded from v2.12.0 or v3.0.0 and did not reindex, your call graph is still wrong: run `trelix index ./my-repo` again. v3.1.0 and v3.1.1 need no reindex and no schema change.

v3.1.0 is a rendering-correctness release, and its best proof needs no attacker at all: `src/trelix/indexing/parser/extractors/rust.py:1035` contains `re.sub(r"^//[/!]?\s?", ...)`, which Rich reads as an unmatched closing tag, so `trelix ask` against trelix's own repository died with `MarkupError` instead of showing results. The silent mode is worse: a balanced-looking pair is swallowed and the command exits 0 having dropped characters. A directory named `deep[` then raised the same `MarkupError` from inside the `except` block meant to skip one file, discarding the whole index run and hiding its own cause.

The machine-readable side needed the opposite fix: `_print_json()` leaves the payload byte-identical and disables the renderer instead. `soft_wrap=True` is the part that mattered, because Rich hard-wraps at console width and a wrap landing inside a JSON string injects a newline that `json.loads` rejects — which the existing short-payload contract tests were too short to catch. Under `FORCE_COLOR=1`, routinely set in CI, `trelix graph --json | jq` produced garbage at exit 0 because the spinner wrote to stdout. 51 new regression tests, all but five demonstrated failing against v3.0.1 — the exceptions are negative and byte-identity controls that must pass on both sides — and the markup tests each assert the payload's literal characters appear in the output rather than merely that nothing raised.

v3.1.1's headline is a safety guarantee that was never true. From v2.x through v3.1.0, `SECURITY.md` said trelix "does not follow symlinks outside the repo boundary." `FileWalker` had no symlink handling at all: `_iter_files` used `entry.is_dir()`/`entry.is_file()`, both of which follow, and `rel_path` is computed on the unresolved path, so an out-of-tree file was indexed *and* reported as sitting inside the repo. `TRELIX_WALKER_FOLLOW_SYMLINKS=false` now makes the boundary real by comparing resolved paths on both sides, because `Path.is_relative_to` is lexical and an unresolved comparison would let `repo/link -> /etc` straight through. It is opt-in for a non-security reason: confining by default would silently drop files from any repository that symlinks to vendored directories.

The unit suite sits at 2,457 collected on this branch, from 2,341 at v3.0.0 and 2,445 at v3.1.0. One fact about that span is more telling than the count: `src/trelix/audit/` and `src/trelix/auth/` have not been touched since the commit that introduced them. The integrity core and the token verifier needed zero source changes across three releases; the code that renders them needed three. And the `audit verify` guard that started this article shipped with a test that only ever passed a directory — a path SQLite genuinely cannot open — so it exercised the branch that already worked. Covering the working half of a two-branch guard buys confidence rather than earning it, which is exactly what three releases of looking for the other halves were for.

## What the 3.x line is for

If you are deciding whether to build on trelix, the useful summary is not the feature list. It is that the 3.x line has a verifiable trail with a CI-gateable exit code, a real OIDC resource-server gate with a forged-token test rather than a config assertion, a context packer whose quality floor is provable by reading it, and an editor integration built entirely out of the MCP surface. Each is off until you turn it on, and each has its boundaries written next to the code that draws them: tamper-evident and HTTP-only, authentication without authorization, lexical compression by default, one agent session across two chat threads.

`pip install 'trelix[serve,sso]'` at 3.0.0 or later gets you the audit and SSO surface. v3.1.1 is cut and dated but not yet tagged or published; when it lands it will change nothing at default settings. The one instruction that carries real consequences is the oldest in the span: if you came from v2.12.0 or v3.0.0, reindex.

*Originally published at [https://anvilry.vercel.app/notes/trelix-v3-1-1-release](https://anvilry.vercel.app/notes/trelix-v3-1-1-release)*
