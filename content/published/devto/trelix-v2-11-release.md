---
slug: trelix-v2-11-release
title: "Trelix v2.11.0: Jira and Linear Now Live Inside the Code Graph"
platform: devto
status: live
published_url: https://dev.to/sai_ram_0000/trelix-v2110-jira-and-linear-now-live-inside-the-code-graph-3e6l
published_date: 2026-08-02
devto_id:
tags: ["python", "opensource", "programming", "productivity"]
cover_image: assets/trelix-v2-11-release/cover.png
canonical_url: https://anvilry.vercel.app/notes/trelix-v2-11-release
note: "The old security-bug-framed draft at https://dev.to/sai_ram_0000/trelix-v2100-v2110-i-shipped-an-unauthenticated-path-traversal-bug-in-the-same-release-that-1f63-temp-slug-8268909 is now stale/superseded -- delete or archive it on Dev.to to avoid two drafts for the same release."
---

I've had the same conversation with trelix a hundred times: "what does `_verify_auth` do." It answers instantly, correctly, and completely uselessly for the question I actually had, which was why does this function exist. Git blame gets you partway there — a commit message, maybe a PR description if you're lucky. But the real answer, the actual requirement, almost always lives somewhere else entirely: a Jira ticket, a Linear issue, a bug report. Code and "the work" have always lived in two systems that never talk to each other. trelix v2.11.0, shipped 2026-08-02, is the release where that stops being true.

The headline feature is two new connectors — Jira and Linear — joining the Xray and TestRail connectors trelix already had for test-management platforms, with all four now sharing one interface. Sync a project's tickets and by the time the command returns, those tickets are already wired into the code graph and already influencing search ranking. Not a CSV dump, not a webhook you have to build your own consumer for. Real typed integrations, with each platform's actual authentication quirks handled correctly, sitting behind one shared contract.

## One interface, four connectors

Every connector — `JiraConnector`, `LinearConnector`, `XrayConnector`, `TestRailConnector` — implements the same `ArtifactSource` abstract base class (`src/trelix/indexing/connectors/base.py`). Two methods: `validate_config()` and `fetch()`. That's it.

`validate_config()` exists specifically so a missing credential fails loud and fast. Look at what `JiraConnector.validate_config()` actually checks:

```python
missing = [
    name
    for name, val in (
        ("TRELIX_JIRA_BASE_URL", self._config.base_url),
        ("TRELIX_JIRA_EMAIL", self._config.email),
        ("TRELIX_JIRA_API_TOKEN", self._config.api_token),
        ("TRELIX_JIRA_PROJECT_KEY", self._config.project_key),
    )
    if not val
]
if missing:
    raise ValueError(f"JiraConnector is missing required config: {', '.join(missing)}")
```

If you forgot `TRELIX_JIRA_API_TOKEN`, you get told that directly, before a single HTTP request goes out — not a 401 three requests deep into a paginated search, not a silent empty result you have to debug later. `fetch()` is the other half of the contract: paginate internally, however the target platform does pagination, and hand back a fully materialized `list[Artifact]`. Callers never see a page token or a cursor.

That uniform shape is the whole reason adding Linear as the fourth `ArtifactSource` implementation was tractable inside this release cycle instead of a future one. It didn't have to invent its own calling convention — it just had to satisfy the same two methods over a completely different platform reality underneath.

The part that actually matters for what you get out of this, though, is `sync()`, which lives once on the base class and every connector inherits unchanged:

```python
def sync(
    self,
    db_writer: ArtifactWriter,
    linker: ArtifactLinker | None = None,
) -> ConnectorSyncResult:
    self.validate_config()
    fetched = self.fetch()
    written = 0
    errors = 0
    edges_linked = 0
    for artifact in fetched:
        try:
            db_writer.upsert_artifact(artifact)
            written += 1
        except Exception:
            errors += 1
            continue
        if linker is not None:
            try:
                edges_linked += linker.link_one(artifact.source_ref)
            except Exception:
                pass
    return ConnectorSyncResult(
        artifacts_fetched=len(fetched),
        artifacts_written=written,
        errors=errors,
        edges_linked=edges_linked,
    )
```

Read that loop carefully: when a linker is supplied, every successfully-written artifact gets passed through `linker.link_one()` in the same call. Not queued for a later batch job. Immediately, synchronously, before `sync()` returns. Run `trelix connector sync ./repo jira` and the output isn't "downloaded 84 tickets into a table" — it's `Synced jira: fetched 84, wrote 84, errors 0, linked 79 edge(s)`. Those 79 edges already exist in `generic_edges` and are already visible to PageRank the moment the process exits. There's a standalone `trelix link-artifacts` command if you want a manual full re-link pass — useful after a `--no-link` bulk sync, or after a schema change surfaces new matches against artifacts you already synced — but it's an option, not a requirement. The default path gives you a fully linked graph in one command.

## Jira and Linear: same contract, opposite platforms

This is the part I find genuinely interesting to build, because Jira and Linear satisfy the identical `ArtifactSource` contract while being about as different as two ticket-tracker APIs can be.

Jira Cloud is REST, authenticated with HTTP Basic — email plus API token, Jira's own recommended scheme for this kind of integration, no OAuth dance required. Pagination is a cursor token (`nextPageToken`), not offset/limit. The interesting wrinkle is the description field: Jira Cloud's v3 API returns `description` as Atlassian Document Format, a nested JSON tree, on every single ticket, unconditionally — never a plain string. That's not a rare shape you might hit on a rich-text ticket; it's the only shape. So the connector ships a real renderer, `_adf_to_text()`, that walks the tree — paragraphs, headings, bullet and ordered lists, code blocks, inline code, blockquotes, panels, expand sections, rules, links, embedded cards — and produces plain text good enough for `ArtifactLinker`'s regex matching downstream. It's not a full ADF renderer (no tables, no user-mention name resolution), but it covers everything actually observed on a live Jira Cloud site.

Linear is a different animal entirely. There's no REST surface at all — it's GraphQL-only, a single POST endpoint (`https://api.linear.app/graphql`), and there's no official Python SDK, only a TypeScript one. Pagination is Relay-style: `first`/`after` arguments, `pageInfo { hasNextPage, endCursor }`. The loop has to terminate on `hasNextPage`, not on a short page — Relay pagination can legitimately hand back fewer results than requested while `hasNextPage` is still true, so checking `len(results) < page_size` the way TestRail and Xray do would end the sync early and silently drop issues.

The auth detail is worth calling out by name, because it's the exact kind of thing that breaks silently if you're not paying attention: Linear's personal API key goes into the `Authorization` header with no `Bearer` prefix. Just the raw key. Every other connector in this codebase uses `Bearer <token>` — Xray's connector literally does `f"Bearer {self._token}"` — so copy-pasting that pattern for Linear produces a request that authenticates against nothing and fails with a 401 whose message doesn't obviously point at the missing prefix. The module docstring in `linear.py` calls this out explicitly as "the one detail most likely to get corrected back to Bearer by someone skimming Xray's connector — don't."

Linear also runs a real query-complexity budget: 10,000 points per request, where a connection multiplies its children's cost by its own `first` argument. This connector's field selection costs roughly 7.7 points per issue, so at `page_size=100` that's about 1 + 770 ≈ 771 points — comfortably under the cap, with real headroom for schema drift. And Linear signals rate-limiting differently from everything else in this codebase: HTTP 400, not 429, carrying a GraphQL body error with `extensions.code == "RATELIMITED"`, and no `Retry-After` header at all. Reset timing has to come from reading `X-RateLimit-Requests-Reset`/`X-RateLimit-Complexity-Reset` response headers directly, so `_fetch_issues_page()` runs its own small, connector-local retry loop for exactly this case rather than teaching the shared retry contract a Linear-specific response shape.

## What actually makes a synced ticket useful

Downloading a ticket into a table doesn't do anything by itself. The piece that turns a synced artifact into something that changes search results is `ArtifactLinker` (`src/trelix/indexing/artifact_linker.py`), and it's worth walking through because the design has a real precision problem baked into it that's easy to get wrong.

Stage one is regex extraction: `_IDENTIFIER_RE` finds identifier-shaped tokens in an artifact's title and body — function/class/variable-looking strings — and checks each one, casefolded, against an index of every symbol name and qualified name in the codebase. A hit becomes a `GenericEdge` with `edge_kind="references_artifact"` and `weight=1.0` — a real graph edge connecting that ticket directly to that code symbol.

The obvious failure mode here is that plenty of function names are also ordinary English words. A ticket titled "the test suite failed to run and update the process" would, on pure token overlap, spuriously link to functions literally named `run`, `test`, `update`, and `process` — none of which have anything to do with that ticket. `ArtifactLinker` handles this with `_COMMON_WORD_STOPLIST`, roughly 40 common English/programming words (`get`, `set`, `run`, `test`, `process`, `update`, `data`, `file`, `main`, and so on) excluded specifically from the bare-name side of the index. It's a real precision guard, not an afterthought, and it's scoped carefully: it only gates the bare `name` key, not `qualified_name`, so a genuinely qualified match like `auth.run` still links correctly. Only the literal stoplisted string on its own gets excluded.

Stage two is an opt-in embedding-similarity fallback, gated behind `ArtifactLinkerConfig.embedding_fallback_enabled`, and it only runs for artifacts where stage one found zero matches. Those fallback edges get `weight=0.5` — deliberately half the weight of a regex hit — so a fuzzy semantic match never outranks an exact identifier match for PageRank purposes. Exact reference wins; embedding similarity is a second-chance net, not a peer signal.

## Xray and TestRail: proving the abstraction generalizes

If the `ArtifactSource` contract only worked for issue trackers, I'd be less confident in it. Xray and TestRail are both test-management platforms, and they slot into the exact same shape.

TestRail is the simpler of the two: HTTP Basic auth (username plus API key), offset/limit pagination capped at TestRail's own 250-per-page ceiling. Xray Cloud is odder — its tests are Jira issues under the hood, but test-specific content (steps, expected results) has no Jira-native equivalent, so a single GraphQL `getTests` query pulls both the Jira fields and the Xray-specific step data in one call, with no separate REST round-trip needed. Auth is its own thing too: a `client_id`/`client_secret` pair, distinct from a personal Jira API token, exchanged via `POST /api/v2/authenticate` for a short-lived bearer JWT attached to every subsequent request. Both connectors write `artifact_kind="test_case"` records, and both flow through the exact same `sync()` → `ArtifactLinker` path as Jira and Linear's tickets. Same registry lookup, same CLI surface, same auto-link behavior. The abstraction holds.

The CLI is identical across all four: `trelix connector sync ./repo <jira|testrail|xray|linear>`, with a `--link/--no-link` flag defaulting to on, resolved through one factory — `get_artifact_source("jira"|"testrail"|"xray"|"linear")` in `registry.py` — that mirrors the same match-statement pattern trelix already uses for embedder and vector-store selection.

## The plumbing underneath

None of the above would mean much if a sync silently swallowed failures or nobody could tell why a request hung. This release also landed a unified retry/backoff contract (`core/retry.py`, built on tenacity) shared across every LLM backend, embedder, and connector — full-jitter exponential backoff on 429s and 5xx responses, honoring a server's `Retry-After` header when present. Structured JSON logging shipped alongside it, with trace-ID correlation when OpenTelemetry is enabled. And Personalized PageRank landed as an opt-in flag (`TRELIX_RETRIEVAL_PAGERANK_PERSONALIZATION`) that concentrates teleport mass on ticket-linked symbols instead of spreading it uniformly — its own docs flag a real interaction risk: combined with `pagerank_boost_enabled` on a repo with few ticket-linked symbols, it can invert the ranking `get_top_central_symbols()` produces. Opt-in for a reason.

None of this was validated against mocks alone, either. Live-testing the Jira connector against a real production Jira Cloud site turned up two real bugs — ADF descriptions silently rendering as empty bodies on every ticket, and bad credentials silently reporting success because `/rest/api/3/search/jql` returns an identical empty result set for a bad token, no token, and a genuinely empty project. Both got fixed this cycle: a real `_adf_to_text()` renderer for the first, and a pre-flight auth check against `/rest/api/3/myself` for the second, since that endpoint correctly returns a real 401 where the search endpoint doesn't.

## What this actually unlocks

The full unit suite sits at 1,909 passing tests as of this release, up from 1,643 at v2.9.0 — not because coverage was thin before, but because four connectors, a linker, a retry contract, and Personalized PageRank all needed their own test surface.

But the number that matters isn't the test count. It's that trelix can now sit in front of a question like "why does this function exist" and actually answer it, because the ticket that requested the change, or the bug report that prompted the fix, is sitting in the graph one edge away from the symbol itself. Ask "what's supposed to happen when I touch this code" and the answer isn't just call-graph traversal anymore — it's the test case that verifies it, linked in through the same mechanism, the same weight-1.0 edge, the same `ArtifactLinker` pass. Before this release, trelix understood code. Now it understands why the code is there.
