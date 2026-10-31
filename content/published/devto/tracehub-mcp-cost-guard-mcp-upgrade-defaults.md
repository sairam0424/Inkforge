---
slug: tracehub-mcp-cost-guard-mcp-upgrade-defaults
title: "Upgrading tracehub-mcp 0.13 and cost-guard-mcp 0.6: the defaults I changed and what to set"
platform: devto
status: live
published_url: https://dev.to/sai_ram_0000/upgrading-tracehub-mcp-013-and-cost-guard-mcp-06-the-defaults-i-changed-and-what-to-set-39bb
published_date: 2026-10-31
devto_id: 4954041
tags: ["mcp","security","python","devops"]
note: "Written 2026-10-31 from the audited evidence packs in cost-guard-mcp/scratch-pad/article-pack-2026-11 and tracehub-mcp/scratch-pad/article-pack-2026-11 (gitignored), by two multi-agent workflows (wf_30f77b87-0d5: briefs, two drafts, judge panel, fact-check, polish; wf_1dbe7936-ab4: second edit, fresh fact-checks, line edit, integrity diff). Run files: Not-Humans-World/scratch-pad/mcpsmiths-article-run-2026-11."
publish_note: |
  Published LIVE to Dev.to on 2026-10-31 at 17:45:11Z (23:15 IST) with `inkforge publish --slug tracehub-mcp-cost-guard-mcp-upgrade-defaults --platform devto --category ai-engineering --published --canonical-base ""`; the empty canonical base leaves canonical_url unset so Dev.to is the canonical original (Dev.to stores its own URL as canonical). Verified against the public API after upload: id 4954041, title and tags (mcp, security, python, devops) as intended, body identical to the primary except that Dev.to added language labels to three bare code fences (plaintext) and one sql label, its usual behaviour. Re-running publish would create a SECOND post; edit through PUT /api/articles/4954041 instead. Edited once that way at 2026-10-31T18:16:39Z to add five GIF embed lines (body only; title, tags, canonical and publish time unchanged); after that edit the live body equals the body below except for a leading blank line and the four code-fence language labels (three plaintext, one sql) that Dev.to added (checked against the public API on 2026-11-01).
---

Start tracehub-mcp 0.13.0 or later with `--transport http --host 0.0.0.0` and no token, and it exits with status 2. Call cost-guard-mcp 0.6.0's `run_query_bounded` on a query that returns 1500 rows without `max_rows`, and it returns `status: refused` with the first 1000 rows, after the query has run. The changelog calls that a billed execution, and I saw it only against a fake BigQuery client in the same process with network access blocked. Both are defaults I changed in response to an agent-run audit, and both have an opt-out.

I maintain both in the mcpsmiths GitHub org. tracehub-mcp lets an agent query traces from eight backends: Jaeger, Tempo, Traceloop, Datadog, Sentry, X-Ray, New Relic and Honeycomb. cost-guard-mcp lets an agent estimate and run queries on BigQuery, Snowflake or Databricks. The current releases are tracehub-mcp 0.13.1 (2026-10-31) and cost-guard-mcp 0.6.0 (2026-10-19).

The breaking changes arrived in tracehub-mcp 0.13.0 on 2026-10-14 and in cost-guard-mcp 0.4.0 on 2026-10-14, 0.5.0 on 2026-10-15 and 0.6.0. They came from an audit of my own code on 2026-10-12. The tracehub README has no upgrade text for 0.13.0, and the cost-guard release notes for 0.4.0 to 0.6.0 list pull requests only. This is the upgrade note I should have written then.

## tracehub-mcp: what to set

Before 0.13.0 the HTTP listener defaulted to 0.0.0.0 with no authentication. The default is now 127.0.0.1. A non-loopback bind without a token exits with status 2:

```
Error: --transport http on a non-loopback host (0.0.0.0) exposes every tool to any network peer with no authentication. Either set MCP_HTTP_BEARER_TOKEN (preferred; clients then send `Authorization: Bearer <token>`), bind loopback with `--host 127.0.0.1` behind an authenticating reverse proxy, or pass --allow-unauthenticated-http (MCP_ALLOW_UNAUTHENTICATED_HTTP=true) to accept that risk explicitly.
```

Set `MCP_HTTP_BEARER_TOKEN` to 32 or more printable ASCII characters, no spaces. A shorter token also exits 2, and the message suggests `openssl rand -hex 32`. Clients send the token in the Authorization header with the Bearer scheme. I ran the 0.13.0 PyPI wheel with a valid token in front of a fake Jaeger backend on 127.0.0.1. `/health` answered 200 with no credentials. `/mcp` answered 401 with no credential or a wrong token, and 200 with the right one. The token never appeared in the log.

**The refusal covers non-loopback binds only.** On 127.0.0.1 with no token the server starts, logs the warning below, and answers an unauthenticated `initialize` with 200:

```
WARNING - Serving /mcp with NO caller authentication on 127.0.0.1:18814 - every peer that can reach this port runs every tool under the configured backend credential
```

Reading the code, the explicit opt-out `--allow-unauthenticated-http` leaves `/mcp` unauthenticated on any host. I did not run it, because it needs a non-loopback bind. If anything untrusted shares the machine, set a token on loopback too.

The listener has no TLS option. 0.13.0 starts uvicorn without an `ssl_*` setting, and neither the README nor SECURITY.md mentions TLS. On a network bind the bearer token crosses the wire in cleartext unless a reverse proxy terminates TLS. That is tracehub-mcp issue 51, and it is open. Behind a proxy, the `Host` and `X-Forwarded-For` rows below apply to you.

The Docker image's CMD is `--host 0.0.0.0`, so a container started with the old command line hits the same refusal. I reproduced the refusal on the wheel, not in a container. Add `-e MCP_HTTP_BEARER_TOKEN` to the run command, or `-e MCP_ALLOW_UNAUTHENTICATED_HTTP=true` to restore the old behaviour.

Credentials embedded in a backend URL are also rejected now, which affects stdio users too. A credentialed `BACKEND_URL`, `--url` or `SECONDARY_BACKEND_URL` fails at startup with exit 1. The message names the source, for example `Configuration error: BACKEND_URL must not embed credentials (user:password@host)`, and `doctor` prints it as `[FAIL] Configuration: ...` on stdout. Move the secret to `BACKEND_API_KEY`, and for Tempo Basic auth also set `BACKEND_TEMPO_INSTANCE_ID`. httpx request lines now appear only at `LOG_LEVEL=DEBUG`.

The changelog lists 14 breaking-change bullets. Two are the changes above, two concern only my publish workflows, and the table covers the other ten. On stdio, the response cap, redirects, filter limits and keys, the cache TTL ceiling (if the query cache is on) and the Honeycomb wait apply. A Honeycomb query that cannot get a slot within `BACKEND_TIMEOUT` now fails with `HoneycombRateLimitedError`, so raise `BACKEND_TIMEOUT` for long waits.

| Setting changed | Before | Now | Opt-out or fix |
|---|---|---|---|
| Decoded response size | no cap | over 64 MiB rejected | `BACKEND_MAX_RESPONSE_BYTES`, up to 1 GiB |
| Redirects | followed | other scheme, host or port refused | set `BACKEND_URL` to the final origin |
| Filter limits | none | more than 50 filters, more than 50 tags, more than 100 values in a filter, or a field name longer than 256 characters rejected | split the query |
| Filter keys and operands | unknown keys ignored | unknown key, bad number or bad boolean rejected | remove the key, send real types |
| Query cache (opt-in) | any positive TTL, unbounded | TTL over 86400 s or non-finite fails startup, LRU at 1024 entries | lower the TTL, `QUERY_CACHE_MAX_ENTRIES` (max 100000) |
| `/ready` | probed the backend every call | cached 30 s (5 s after a failure), 503 after 10 s | `READINESS_CACHE_SECONDS=0` |
| Caller trace context (`params._meta.traceparent`) on HTTP | adopted | not adopted, which matters only with `OTEL_EXPORTER_OTLP_ENDPOINT` set | `MCP_TRUST_CLIENT_TRACE_CONTEXT=true` |
| `X-Forwarded-For` | 127.0.0.1 trusted | not trusted, so proxied clients share one rate bucket | `FORWARDED_ALLOW_IPS=127.0.0.1` behind a same-host proxy |
| `Host` header on a loopback bind | unchecked | non-loopback Host gets 421 | `MCP_ALLOWED_HOSTS` (`*` disables) |
| Idle sessions | lived until deleted | closed after 1800 s, the id then answers 404 | `SESSION_IDLE_TIMEOUT_SECONDS`, and clients must re-initialize |

The evidence for this table is mostly unit tests and mutation checks. The TTL ceiling (a startup refusal, exit 1) and the 421 (a running server with no backend attached) were also reproduced live. No real backend was involved.

0.13.1 shipped on 2026-10-31. A fresh install of 0.13.0 resolves fastmcp 4.0.11, the newest release its `fastmcp>=4.0.5,<4.1` range allows, and that release has two advisories. Of authlib, certifi, fastmcp and joserfc, 0.13.0 declared a range only for fastmcp. 0.13.1 raises fastmcp to `>=4.1.3,<4.2` and adds `authlib>=1.9.0`, `certifi>=2026.10.19`, `dnspython>=2.9.0` and `joserfc>=1.7.6`. My maintainer log records joserfc's two vulnerable paths as not reachable from tracehub. I did not re-derive that or re-audit 0.13.1. The relock was checked with the unit suite, pip-audit and OSV, a 19-tool comparison with 0.13.0, and loopback smoke tests. The Docker build and Trivy gate were not run locally.

![A grey barrier post with a red-and-white striped arm that lifts, holds, then lowers back to horizontal on a white background.](https://media0.giphy.com/media/jnJIFn9PX3uwwMLy3a/giphy.gif)

## cost-guard-mcp: what to set

The outputs below come from in-process fakes, not a warehouse. A refused result carries `executed`, which says whether the warehouse ran the statement. Read it before you re-run a refused call.

Since 0.4.0, text with a second statement is refused before any estimate or execute call. It comes back as a tool error, and no `status: refused` result is returned. The message begins `estimate_query_cost/run_query_bounded accept exactly one SQL statement; found ';' followed by more SQL.` and names the opt-out `COST_GUARD_ALLOW_MULTI_STATEMENT_SQL=1`. Only the exact string `1` works, so `true` and `0` keep the check. The opt-out skips only this server's scanner, and Snowflake still rejects multi-statement text.

Since 0.5.0, only statements whose first keyword is SELECT, WITH, VALUES, SHOW, DESCRIBE, DESC or EXPLAIN run. For DELETE, INSERT and a statement that drops a table, the message includes `accept only read statements` and names `COST_GUARD_ALLOW_WRITE_STATEMENTS=1`, which also takes only the exact string `1`. BigQuery scripts that write, or that start with DECLARE, SET or BEGIN, need both opt-outs. `run_query_bounded` is still annotated `read_only_hint=False`, and a write-capable credential is still write-capable, so the grants are the boundary.

Since 0.6.0, an omitted `max_rows` means 1000, and a result is capped at 8 MiB of compact JSON. Against a fake that returned 1500 rows I got `"status": "refused", "executed": true, "reason": "row_cap_exceeded"`, with 1000 rows and the hint `Query returned more than max_rows=1000 rows; showing the first 1000. Add a LIMIT to your query or raise max_rows.` 0.5.0 returned `ok` with all 1500 rows, and so does `max_rows=2000` on 0.6.0. The size cap refuses as `result_size_exceeded`, also with `executed: true`. Of the refusal reasons, only the dollar and byte caps fire before the query is sent to the warehouse.

**cost-guard does not refuse an uncapped query.** With no caps, a fake BigQuery run returned `ok` with `executed: true`, `LIMIT 1001`, `maximum_bytes_billed` null and a 120 s timeout. There is no default spend limit, so pass `max_estimated_cost_usd` or `max_bytes_billed` if you need one. The row and size caps limit what comes back. They do not prevent the run.

On an on-demand BigQuery project the dollar cap is also sent to the provider as `maximumBytesBilled`. With `max_rows` 5 and a cap of 1.0, the job carried `maximum_bytes_billed: 175922741248` and `LIMIT 6`. Snowflake and Databricks have no equivalent, so there the cap is checked only against the estimate. An estimate over the cap refuses before the query runs, as with this fake reporting 100 GiB:

```
Estimated cost $0.6104 exceeds max_estimated_cost_usd=$0.5000. Narrow the query or raise the bound.
```

When the fake reported BigQuery's LOWER_BOUND accuracy (a minimum byte count, with no price attached), `estimate_query_cost` returned `"accuracy_tier": "HEURISTIC"` and `"estimated_cost_usd": null`. With `max_estimated_cost_usd` 1.0 the same input was refused with `cost_cap_exceeded` and `executed: false`. The hint said `refusing rather than running with no cost-cap enforcement` and went on to tell the caller to bound the run with `max_bytes_billed`. Without the cap, that query runs.

On BigQuery that refusal is new in 0.6.0. Through 0.5.0, a statement that referenced a table but reported 0 bytes came back `PRECISE` at $0.00 and passed any cap. Now it is `HEURISTIC` with no figure, and the cap refuses it. The check tests the shape of the estimate, so it also refuses queries that cost nothing, such as metadata `COUNT(*)`, empty tables and pruned partitions. `max_bytes_billed` still runs those.

On Snowflake and Databricks with no query history, the runtime estimate depends only on scanned bytes: 30 s under 10 GiB, 120 s under 100 GiB, 600 s under 1 TiB and 3000 s above. A source comment says it biases toward over-estimating a big query's runtime, "never under". I repeated that in a public dev.to reply on 2026-09-17, and my check supports it only in part. The estimate is never below 30 s and runs high in the middle of each tier, but "never under" is false. If true runtime is 2 s plus bytes divided by 1 GiB/s, which is my assumption, a 10 TiB scan is estimated at 3000 s against about 10242 s. A hypothetical compute-heavy query under 10 GiB that ran 120 s would be estimated at 30 s. Do not treat a dollar figure on these engines as an upper bound.

The two SQL flags above take `1`, and the warehouse flags below take `true`. Any other value leaves the check on.

| Release and setting | Before | Now | Opt-out or fix |
|---|---|---|---|
| 0.4.0, Snowflake secondary roles | user defaults applied | `SNOWFLAKE_SECONDARY_ROLES` defaults to NONE, ALL is the opt-out, any other value is a ConfigError | `=ALL`, or grant objects to `SNOWFLAKE_ROLE` |
| 0.4.0, admin roles | accepted | ACCOUNTADMIN, SECURITYADMIN and ORGADMIN raise ConfigError at first Snowflake config load | none, use a least-privilege role |
| 0.4.0, Snowflake pricing | priced at the size the caller passed (default XSMALL) | priced at the warehouse the server observes. A warehouse it cannot model gets no dollar figure, so a cap refuses | none, omit the dollar cap. If the account is not Standard, set `SNOWFLAKE_EDITION` (default standard), which sets the price per credit |
| 0.4.0, Databricks without statistics | a fixed floor dollar figure | no figure, so a cap refuses | `ANALYZE TABLE`, or omit the cap |
| 0.4.0, in-flight queries | unbounded | 8 concurrent | `COST_GUARD_MAX_IN_FLIGHT_QUERIES`, 1 to 1000, and an invalid value stops startup |
| 0.4.0, result rows | NaN and Inf became null, non-UTF-8 bytes raised after the billed run | bytes come back base64, NaN and infinities as `nan`, `inf`, `-inf` strings | none, decode or CAST |
| 0.5.0, Databricks | check and estimate could start a stopped warehouse | refused unless it is RUNNING | `COST_GUARD_DATABRICKS_ALLOW_WAREHOUSE_START=true` |
| 0.5.0, Snowflake | lookups could resume a warehouse | lookups run only on a started warehouse, else the estimate uses Gen1 rates with a caveat | `COST_GUARD_SNOWFLAKE_ALLOW_WAREHOUSE_RESUME=true` |
| 0.6.0, Snowflake connector | `>=4.7.1` | `>=4.7.1,<5` | none, 5.x is excluded |

The 0.5.0 rows cover lookups, checks and estimates. `run_query_bounded` is unchanged and can still start or resume a warehouse.

The 0.6.0 PyPI page says `pip install "cost-guard-mcp[otel]"`, but that extra does not exist, and setting `OTEL_EXPORTER_OTLP_ENDPOINT` without the OpenTelemetry packages fails startup. A fix pull request is open. Its unit tests pass, its pip-audit and image-build checks failed on the 2026-10-31 run, and it is behind `main`. I am planning no 0.6.1, because `main` is ahead only by docs, CI, lock, test and comment-only changes, with no behaviour change for PyPI users.

![Car dashboard close-up: the digital odometer digits count rapidly upward beneath a speedometer dial.](https://media0.giphy.com/media/YhtiUrWWtpe7QpinHZ/giphy.gif)

## What the live gate caught in cost-guard 0.6.0

At v0.6.0 two CI jobs, `bigquery` and `snowflake`, ran real queries on manual dispatch and on a Monday 06:00 UTC schedule. The gate is not a required check, and the release workflow does not reference it. Since 2026-10-31 the `snowflake` job runs only when I ask for it.

On 2026-10-19 a run dispatched 6 seconds after the release-prep pull request merged failed two of six BigQuery tests. The first was a regression in the default call: `WITH RECURSIVE` inside the `LIMIT` subquery that implements the row cap drew a 400:

```
400 WITH RECURSIVE is only allowed at the top level of the SELECT, CREATE TABLE AS SELECT, CREATE VIEW, INSERT, EXPORT DATA statements.; reason: invalidQuery
```

The unit suite could not see it, because fakes accept any SQL. It had been on `main` since 2026-10-15. The second failure was a pin that expected a duplicate-column error and got `Failed: DID NOT RAISE SanitizedEngineError`. BigQuery accepted the wrapped form of the test query and returned `a_1` for the second `a`. My docs sentence telling users to alias columns was wrong.

A scheduled run about 3 h 12 min earlier had failed the same two tests. No issue or pull request text mentions it, so I cannot show that anyone saw it. The fix merged, and the tag followed four minutes later. The regression is in no release, because v0.5.0 does not contain it and 0.6.0 was uploaded after the fix. As far as I can read the workflows, nothing would have stopped a tag on the failing commit.

The run on the tagged commit still failed. BigQuery passed 6 of 6. Snowflake failed 3 of 3 at connect with error 390913, because the free trial had ended. The Snowflake gate never passed for 0.4 to 0.6, and its last green run was on 2026-10-12 on code identical to v0.3.3.

![A red warning beacon glows and pulses next to a grey horn speaker mounted on a post, with the horn shaking.](https://media4.giphy.com/media/OcrzJh9cKnyJG/giphy.gif)

## How the audit and the fixes were checked

I used the open-source Cloudflare security-audit-skill, run by an agent harness against my own repos. Hunter agents look for problems, fresh verifiers confirm or reject each one, and the harness writes a findings file and a coverage ledger. Agents drafted the fixes and re-verified them. I decided what to change and merged. Each server's first batch of fixes landed as one pull request, and cost-guard's later follow-ups shipped separately. During the audit runs, target code ran only through a macOS sandbox runner that denied all network. The later tracehub runtime passes and the tracehub demos ran the server on loopback against fakes, outside that runner.

The tracehub run produced 37 records: 23 confirmed (1 high, 12 medium, 10 low) and 14 leads the harness could not confirm. The single high finding was the unauthenticated 0.0.0.0 default: the `/mcp` listener ran every tool under the operator's backend credential with no caller authentication. The cost-guard run covered the whole repo and produced 22 records: 8 confirmed, all low, and 14 leads. Neither of these two runs rejected a record. I cannot tell whether the hunters were precise or the verifiers lenient. The 28 leads are unscored. I gave them no severity, so they are not low.

The tracehub run also declared its own coverage not clean. Three areas of the code were deferred and never hunted: two unauthenticated `/ready` resource-exhaustion paths and the cleartext-only HTTP listener. The harness's final coverage check returned stop=false, meaning it did not judge coverage complete.

Both servers were re-audited with smaller runs that covered less. The tracehub re-audit confirmed nothing and closed 35 of 37 earlier records, 12 of them on a second agent reading source only. The cost-guard re-audit ran at 0.4.0 and closed 14 of 22. No audit ran after cost-guard 0.5.0.

On tracehub, separate agents drove the running server against fake backends in four passes: theme verifiers, adversarial probers and a judge. Three passes failed and the fourth passed, with 0 of 24 regression rows changed. The failures were real. A credential prefix leaked through pydantic's truncated `input_value`. A query-string token, and later a matrix-parameter token, reached the access log. That was with the opt-in access log enabled, on branch heads before the fixes. The access log is off by default in 0.13.0. `Host: localhost..` returned 200. The commit the judge tested differs from the merged commit by six files under `.claude/skills/verify`, and neither is the tagged tree, so the pass covers the branch and not the tag.

For cost-guard I removed 8 enforcements one at a time in a scratch copy, and the unit tests caught 7. The one they missed is the connector `<5` cap. Removing it leaves all 1810 unit tests green.

![A robot arm with a camera and scanner head moves slowly over a bladed metal turbine impeller on a pale background.](https://media4.giphy.com/media/uJt3dHkMseCkSx0cmQ/giphy.gif)

## What is still unproven

I have not shown tracehub-mcp 0.13.x to be safe. The first audit was not clean, the re-audit was partial, and the cleartext listener in issue 51 is open. Runtime checks used loopback fakes, with no vendor checks.

No GitHub security advisory exists for these findings, and SECURITY.md supports the latest 0.x only, so upgrading is the remediation. Both repos have had a release-tag ruleset since 2026-10-14, but their publishing environments carry a branch policy and no required reviewers (tracehub issue 49).

For cost-guard-mcp, no live Snowflake run has passed on 0.4.0 to 0.6.0, and Databricks has never had a live job. The recursive-CTE rule applies to Snowflake and Databricks as well, although I observed the failure only on BigQuery. The row cap's `LIMIT 1001` overflow check and the 8 MiB cap were tested against fakes only.

On 2026-10-31 I stopped running the Snowflake job on the weekly schedule (pull request 139) because I decided not to pay for a new Snowflake account. It now runs only when I dispatch it with `include_snowflake=true`. The Monday 2026-11-02 run will exercise BigQuery only, so Snowflake stays unverified live until I get an account.

Private vulnerability reporting was off on cost-guard-mcp while SECURITY.md told reporters to use it. I switched it on for that repo and for the org's `.github` repo on 2026-10-31.

## The provenance block I promised

In a reply to a reader on dev.to on 2026-09-13 I wrote that the fix to add was "a small provenance block on every tool response." The fields were the backend name, the resolved start and end used, requested versus applied limit, a truncated flag and, once it exists, which redaction policy ran. I said the answer to that reader's question was, right now, "not well enough."

That block has not shipped. It is not in 0.13.0, 0.13.1 or `main`, and none of the fifteen tracehub-mcp releases since, 0.5.0 through 0.13.1, adds it. No issue or pull request tracks it, and a draft proposal sits unapproved. I am not naming a version.

The gap shows in the responses. With `MAX_TRACES_PER_QUERY=2`, `limit=100` returned the same two traces as a plain `limit=2` call while the Jaeger fake held three, and nothing in the response reports a clamp. Tool payloads are not redacted. A dummy URL with userinfo and a dummy authorization-named attribute came back verbatim from `get_trace` and `search_spans_tool`. The 0.13.0 userinfo redaction covers only logs, errors, `/ready`, `doctor` and `print-config`.

![Two hands press a black self-inking stamp down onto a printed form on a table, then lift it away.](https://media1.giphy.com/media/ibeDch0qflnPhb7CXm/giphy.gif)

If an upgrade breaks a setup this article did not cover, open an issue on github.com/mcpsmiths/tracehub-mcp or github.com/mcpsmiths/cost-guard-mcp with the version and the exact error text.
