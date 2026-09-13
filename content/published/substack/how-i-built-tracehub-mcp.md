---
slug: how-i-built-tracehub-mcp
title: "tracehub-mcp: Giving AI Assistants a Real Query Interface Into Your LLM Traces"
platform: substack
status: live
published_url: https://sairam0000.substack.com/p/tracehub-mcp-giving-ai-assistants?r=2xzeyx&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true
published_date: 2026-09-13
canonical_url: https://anvilry.vercel.app/notes/how-i-built-tracehub-mcp
---

## The Copy-Paste Problem

Here's what debugging an LLM application looks like for most people today, including me until recently: something is slow, or wrong, or expensive, and the AI assistant sitting in your editor wants to help. It can read your code. It can read your logs if you paste them in. What it cannot do, natively, is ask your trace backend a question. So you open Jaeger or Datadog in a browser tab, find the trace, copy the JSON blob, and paste it into the chat window. Then you do it again for the next trace, because "compare the last five calls to this model" isn't a query you can run — it's five manual round trips.

tracehub-mcp exists to delete that loop. It's an MCP (Model Context Protocol) server that gives Claude, Cursor, Windsurf, Gemini CLI, or any MCP client a direct query interface into your OpenTelemetry trace backend. Instead of pasting JSON, the assistant calls a tool — `search_traces`, `get_llm_expensive_traces`, `get_llm_model_stats` — and gets back structured trace data it can actually reason about. Find expensive calls, debug errors, compare model performance across providers, track token usage over a time window: these become questions you ask, not spreadsheets you build by hand.

The part that matters most for an LLM-observability tool specifically is that it doesn't treat a trace as an anonymous bag of span attributes. It speaks OpenTelemetry's `gen_ai.*` semantic conventions natively: prompts and completions pulled from actual span events, a token-usage fallback chain for providers that don't emit a clean total, finish reasons as a queryable field rather than a string buried in an attributes dictionary. That's why this is worth building over pointing an assistant at a generic OTel viewer, and it's the throughline for the rest of this piece: the five backends, the hardening bar, and the scope decision about which parts of the code get held to it.

Today is 2026-09-13. tracehub-mcp is at version 0.3.0, live on PyPI, tagged `v0.3.0` — the shipping version I'm describing, not a changelog recap of getting from 0.2 to 0.3.

## From Three Backends to Five, and What "Full Implementation" Means

tracehub-mcp didn't start as a five-backend project. It inherited three — Jaeger, Grafana Tempo, and Traceloop — and the growth story worth telling is how it became a five-backend, security-hardened server without the two new backends being thin wrappers bolted on for coverage.

Every backend implements the same `BaseBackend` interface (`src/opentelemetry_mcp/backends/base.py`), so every MCP tool works identically no matter which backend is configured — `search_traces`, `search_spans`, `get_trace`, `list_services`, `get_service_operations`, `health_check`, whether you're pointed at a local Jaeger container with no auth or a paid Datadog account with an API key and app key pair. Jaeger and Tempo cover local/self-hosted setups; Traceloop covers cloud LLM observability with API-key auth. Those three came from the upstream fork.

Datadog and Sentry are new, and genuinely new: full implementations of all four MCP-facing operations for each, not stubs that return "not implemented" past a basic search. `src/opentelemetry_mcp/backends/datadog.py` and `src/opentelemetry_mcp/backends/sentry.py` each implement `search_traces`, `search_spans`, `get_trace`, and `list_services` as independent code paths with their own request building, pagination, and parsing logic. That's the bar I hold "full backend" to: every tool a client can call has to actually work, not just the one that made for a good demo.

The more interesting decision was holding those two backends to a security bar that's specific rather than generic. "We hardened it" means nothing on its own. Here's what it concretely means:

**HTTPS-only enforcement.** Both refuse to construct at all if the configured URL isn't `https://` — a `ValueError` raised in `__init__`:

```python
if not self.url.startswith("https://"):
    raise ValueError(
        "Datadog backend requires an https:// URL - DD-API-KEY and "
        "DD-APPLICATION-KEY must not be sent over plain http"
    )
```

Sentry has the identical check, worded for its single bearer token instead of an API-key pair. Datadog goes further and disables automatic redirect-following on its `httpx` client, because its non-standard `DD-API-KEY`/`DD-APPLICATION-KEY` headers aren't stripped by `httpx` on a cross-origin redirect the way a standard `Authorization` header is — a subtlety Sentry's own module docstring calls out as the reason it doesn't need the same override. The hardening was reasoned about per-backend, not copy-pasted.

**Query-injection-safe escaping.** Every value spliced into a Datadog query goes through `_escape_dd_query_value`, which escapes embedded backslashes and quotes and wraps the result in exact quotes. Field *names* — the part you'd assume is safer because it isn't free text — go through a separate allowlist, `_VALID_DD_FIELD_RE = re.compile(r"^@?[A-Za-z0-9_.]+$")`, before they're anywhere near the query string, because a filter's `field` parameter is an unvalidated string reachable from any MCP tool call. Sentry has the equivalent pair, `_escape_sentry_query_value` and `_VALID_SENTRY_FIELD_RE`, adapted to Sentry's syntax.

**Bounded pagination.** Datadog's span search loops through cursor pages capped at `_MAX_SEARCH_PAGES = 10`, stopping when the requested `limit` is satisfied or the cursor (`meta.page.after`) runs out, whichever comes first, and logs a warning if it hits the cap with more data available:

```python
for _ in range(_MAX_SEARCH_PAGES):
    remaining = limit - len(collected)
    if remaining <= 0:
        break
    ...
    cursor = page_meta.get("after")
    if not isinstance(cursor, str) or not cursor:
        break
else:
    logger.warning("Search truncated at %d pages", _MAX_SEARCH_PAGES)
```

Sentry does the same shape of loop through HTTP `Link`-header cursors instead, matching how its pagination actually works, also capped at 10 pages. A single tool call can't turn into an unbounded crawl against either backend, and the code says so out loud when it truncates rather than returning a partial result silently.

**Exact-ID re-verification.** This one has the sharpest story. Datadog has no "get trace by ID" endpoint, so `get_trace` reconstructs a trace by searching for spans matching the trace ID and grouping the results — inherently a search, which means it could match more broadly than intended. So before any span leaves the function, it's re-checked against the exact ID that was asked for:

```python
# Belt-and-suspenders: only keep spans that exactly match the
# requested trace_id, in case the query above ever matches more
# broadly than intended.
if span and span.trace_id == trace_id:
    spans.append(span)
```

Sentry's `get_trace` does the same re-check after calling its native `/trace/{id}/` endpoint, and its parser goes one step further: it rejects a trace item that's missing its own `trace_id` rather than falling back to the requested ID, because substituting the requested ID would make the whole re-verification check a no-op.

**No fabricated data on malformed responses.** Both backends reject a span outright — return `None`, log a warning — rather than filling in a placeholder. Datadog's parser has explicit rejection blocks for missing timestamps and for missing service/operation identity, with comments stating why: a substituted `now()` would silently corrupt trace ordering, a substituted `"unknown"` would silently merge unrelated spans. Sentry mirrors this and adds a sanity bound on duration — anything past ten years in milliseconds is rejected as almost certainly a clock-skew artifact.

None of this landed in one pass. Two rounds of adversarial CodeRabbit review hit the Datadog backend: the first cites eight actionable findings addressed (HTTPS enforcement, redirect-disabling, exact-ID re-verification, cursor pagination, trace-ID escaping, timestamp rejection, and others); the second, an explicit follow-up after CodeRabbit re-reviewed the code the first round had just introduced, addressed four more — query escaping, response-shape validation, and `get_trace`'s pagination limit handling, the same wording in the commit subject line. A hardening pass can introduce its own gaps; it's worth re-reviewing the fix, not just the original code.

One honest caveat on Sentry: its module docstring says plainly that several response-shape assumptions — exact column names in raw event rows, the shape of Sentry's `SerializedTraceItem` type, the escaping convention its Discover query syntax expects — were built from published documentation and source reading, not verified against a live Sentry account. That's disclosed in the code, and I'm disclosing it here rather than implying this backend has been battle-tested in production.

The test suites reflect the same weight: `tests/test_datadog.py` runs 781 lines and `tests/test_sentry.py` runs 1117, with named tests for exactly the things above — `test_datadog_backend_rejects_non_https_url`, `test_equals_rejects_injection_field`, `test_escapes_trace_id_in_query`, `test_requests_full_pagination_capacity`, `test_malformed_data_field_does_not_crash`. That's the difference between a README bullet list and something a future contributor can actually run and watch fail if they break it.

## The Decision Not to Touch Jaeger, Tempo, or Traceloop

The part I think is actually the most interesting design decision in the project: I did not retrofit any of that discipline onto the three inherited backends.

Open `jaeger.py` next to `datadog.py` and the gap is immediate. Four lines into Jaeger's span parser, the default service name is the literal string `"unknown"` — if neither the processes map nor the span's own `process` field resolves a real name, that placeholder ships as-is rather than the span being rejected. `traceloop.py` has the same shape of problem: it falls back to an empty string for `service.name` when the field is absent. Neither Jaeger nor Tempo has an HTTPS check anywhere — `BaseBackend.__init__` just stores the URL, no scheme validation, so both will happily talk to a plain `http://` endpoint. Tempo's TraceQL builder, `_filter_to_traceql`, splices filter values directly into f-strings with no escaping function anywhere in the file — the exact pattern `_escape_dd_query_value` and `_escape_sentry_query_value` exist to close off.

I could have quietly left that gap unaddressed and let the README imply the hardening covers "the backends." I could also have spent a week retrofitting Jaeger, Tempo, and Traceloop to match. I did neither. The README states the position directly:

"The three backends inherited from upstream — Jaeger, Tempo, Traceloop — predate this discipline and haven't been retrofitted; that's deliberate scope discipline, not an oversight, mirroring this project's own precedent of not reaching into shared/inherited code without full regression coverage for it."

There's a specific kind of dishonesty in open source that's more common than outright lying: a security-adjacent hardening pass described as covering "the project" when it actually covers the two files someone happened to be working in that week. The work that got done, got done — but the framing implies a blanket guarantee that was never earned. The honest alternative isn't silence about the gap, and it isn't burning a week retrofitting code you don't have the depth of intuition for well enough to trust the retrofit. It's saying plainly which parts got the bar and which didn't, and why. "These three predate this discipline" is a true, checkable statement — I just checked it against the actual source above. "Zero known issues" would not have been.

That "full regression coverage" framing matters because Jaeger, Tempo, and Traceloop are code I didn't write and don't have the same depth of intuition for. Reaching in to add HTTPS checks or escaping without a test suite built to catch the ways I could break it quietly is how a regression goes unnoticed until a production trace query starts silently dropping spans — which is exactly what happened in a different corner of the codebase.

## The Bugs That Taught Me the Hard Way

The hardening bar on Datadog and Sentry didn't come from first principles. It came partly from bugs I hit and fixed in the inherited code, which is why I trust the no-fabrication rule enough to enforce it strictly on new code.

The sharpest one: any span carrying a `gen_ai.response.finish_reasons` value — any LLM span representing a completed response — was silently disappearing from every query result on both Jaeger and Tempo. Not erroring, disappearing. I found it during a live end-to-end dry run against a real Jaeger container and the actual published PyPI package, not a unit test. The root cause was a type mismatch: `finish_reasons` is typed `list[str]` in `attributes.py`'s `SpanAttributes` model, but Jaeger hands the value over as a JSON-encoded string, and Tempo's OTLP parser was stringifying the raw `arrayValue` structure into an unparseable repr instead of extracting the actual elements. Both shapes failed Pydantic validation, and both backends wrapped span construction in a broad `except` that returned `None` — so a parse failure and "no span here" were indistinguishable. The fix added a `field_validator` that coerces any of those shapes into a real list without raising, and rewrote Tempo's `arrayValue` handling to pull each element's scalar value by key presence rather than truthiness, so a real `0` or `False` doesn't get dropped along with it.

That bug is why the no-fabrication rule on Datadog and Sentry isn't theoretical caution — it's a lesson learned on the backends that predate it, and it's a large part of why I trust the new backends' stricter behavior (reject the span, log why) over the older ones' looser one (silently return nothing).

The rest of this arc is smaller but real. An earlier fix replaced sequential `get_trace` round trips with a single `asyncio.gather` call across the four tools that hydrate full traces after a search — `expensive_traces.py`, `list_models.py`, `model_stats.py`, `slow_traces.py` — turning N sequential calls into one concurrent batch, with a regression test asserting the maximum in-flight call count equals the batch size. The same commit deleted a dead `else 0` branch in `model_stats.py`'s success-rate calculation, left over from before an earlier guard made it unreachable. On the CI side, `v0.3.0` closed off a pattern in `docker-publish.yml` where `${{ github.ref }}` and `${{ github.run_id }}` were textually inlined into shell script text rather than passed through environment variables — not an exploited vulnerability here, since neither value is attacker-influenceable in this step, but a known-dangerous pattern worth closing regardless. The same release removed a step from that workflow that was supposed to flip the published GHCR image to public visibility but always reported success even though its `gh api` calls 404'd under the default `GITHUB_TOKEN`, chained with `||` into a trailing `echo` so the exit code was always zero. Green CI, private package, until someone checked; I removed the fake step and documented the one-time manual flip instead of fake-automating a fix. And `start_locally.sh` had a live Traceloop API key hardcoded as the active default — inherited from before the fork point, still live on the upstream public repo, not mine to rotate — so the fix was scoped honestly: switch the default to the credential-free Jaeger backend, without claiming to have remediated an exposure that predates this repository. The Docker image now publishes to GHCR on every version tag, for `linux/amd64` and `linux/arm64`.

## The Fork, the Pivot, and a Changelog Anomaly

tracehub-mcp began as `traceloop/opentelemetry-mcp-server`, Apache 2.0, with full attribution and fork history preserved in `NOTICE` — created via `git clone` plus `git remote`, not by copying files into a fresh repository, so the original commit history stays visible instead of collapsing into one "initial commit." The first commit landed 2025-11-02, with a first release, `v0.2.0`, on 2025-11-17. There was a long gap, then three commits on 2026-09-12 completed the rename and pivot to `mcpsmiths/tracehub-mcp`: a fork-setup commit adding `NOTICE`, a rename commit, and a follow-up, `fix: complete the tracehub-mcp rename, remove old-org CI dependencies`, closing out roughly 90 stale references to the old name across the README, `CLAUDE.md`, the Dockerfile, `start_locally.sh`, `server.py`, and CI, and dropping CI's dependency on the upstream org's private infrastructure — a self-hosted runner label, a private composite Trivy action, a GitHub App for version bumps — in favor of GitHub-hosted runners and the repo's own token and git identity.

That pivot also explains something you'll notice scrolling `CHANGELOG.md`: two separate `v0.2.0`/`v0.2.1`/`v0.2.2` entries months apart, one set from November 2025 through February 2026, another from September 2026. Resetting `pyproject.toml`'s version to `0.1.0` during the rename left the Commitizen version files still pointing at the old `0.2.2`, so the automated bumper started counting up again on the new codebase — a real, mechanical drift, confirmed by dry-running the actual bump logic rather than assumed, and fixed in a commit that also caught an unrelated bug where a separate "configure git identity" CI step did nothing, because the commitizen action's own entrypoint re-runs `git config` with its own defaults right before committing. I'd rather the changelog look odd and be explained than look clean because I quietly rewrote history.

## What This Actually Is

I ran the test suite directly against this checkout rather than trusting the README: 467 passed, 2 skipped, 87% overall coverage — the README currently says 458, which is stale, and I'm correcting it here instead of repeating it. The two skips are environment-dependent integration tests needing cassette fixture data not present in this run, not disabled tests. There are 5 open pull requests right now, every one a Dependabot bump to a GitHub Action's minor or patch version — `docker/login-action`, `actions/cache`, `sticky-pull-request-comment`, `astral-sh/setup-uv`, `trivy-action` — routine and low-risk. It's listed on the official MCP registry as `io.github.mcpsmiths/tracehub-mcp` and carries a glama.ai score badge. It has 0 GitHub stars as of today.

What I'm actually claiming is narrower than "production-hardened observability platform," and more useful for being narrow: two new backends built to a specific, checkable security bar, three inherited backends explicitly not held to that bar yet, a real data-loss bug found and fixed the hard way, and a test suite I ran myself before writing any of these numbers down. If you're running an LLM application on Datadog or Sentry and want your AI assistant to query the actual trace data instead of you pasting it in by hand, that's what this is for. If you're on Jaeger, Tempo, or Traceloop, it works today, on the discipline the fork already had — just don't assume it has the newer bar until I've said it does.

*Originally published at [https://anvilry.vercel.app/notes/how-i-built-tracehub-mcp](https://anvilry.vercel.app/notes/how-i-built-tracehub-mcp)*
