---
slug: trelix-v3-2-5-release
title: "trelix v3.2.2 to v3.2.5: The Source Tree Was Fine. The Published Package Wasn't."
platform: devto
status: live
published_url: https://dev.to/sai_ram_0000/trelix-v322-to-v325-the-source-tree-was-fine-the-published-package-wasnt-55i
published_date: 2026-09-06
devto_id: 4587467
tags: ["systemdesign", "python", "devops", "testing"]
cover_image: assets/trelix-v3-2-5-release/cover.png
canonical_url: https://anvilry.vercel.app/notes/trelix-v3-2-5-release
note: |
  Covers the v3.2.1 -> v3.2.5 span (four releases: v3.2.2, v3.2.3, v3.2.4, v3.2.5). v3.2.5 IS
  tagged and live on PyPI (dated 2026-08-31) - fully installable, no caveat needed. Distinct
  thesis from the prior article: that one covered tests passing without exercising the code
  they claim to cover; this one covers tests passing on source while the actual published
  PyPI wheel / Docker image / binary was broken. 0 fabrications on the adversarial fact-check
  pass (4 findings total, all inaccuracy/style, all applied during polish). Independently
  re-verified ~22 load-bearing claims by hand against the live repo post-workflow - the exact
  Docker fix commits (aabaa14, 08233f8), the escape_like_pattern() SQL LIKE fix, the real
  verify-release.yml dual-workflow-wait mechanism (gh run list --workflow "$wf" --branch
  "$tag"), and every named parser/collision-audit bug (Java outer_qualified_name, Rust
  module_path, AgentLoop._do_get_symbol, make_scip_symbol_id file_path, walker NFC
  normalization, the frozen-binary sys.frozen check) - all confirmed verbatim against source,
  zero discrepancies. This is the cleanest verification pass in the series so far.

  Note on tags: the CLI reads the first 4 tags from the PRIMARY article frontmatter above,
  normalizes them (lowercase, strips hyphens), and sends only those to Dev.to - editing
  tags: in this file does nothing. Primary order was set so python/devops/testing/opensource
  win over ai-engineering and system-design.
---

Here's the Dev.to-adapted body:

Run this against the real, published image and watch it fail:

```bash
docker run --rm --entrypoint trelix-mcp ghcr.io/sairam0424/trelix:3.2.1 --version
```

Exit code 127. Not a crash inside trelix-mcp, not a stack trace, not a permissions error — `127` is the shell's own way of saying the binary you asked for does not exist. And it didn't. The console script trelix-mcp is supposed to install as part of every trelix package was simply absent from the image, on both the slim tag and the `-local` tag, for the entire life of the 3.2.1 release. Every unit test in the suite was green. Every line of source that builds trelix-mcp was correct. The thing a user would actually get from `docker pull` did not have the binary its own `--version` flag implies exists.

This article covers four releases — v3.2.2, v3.2.3, v3.2.4, and v3.2.5 — spanning 173 commits and 88 changed files since v3.2.1, which is where the last article in this series left off. That one was about tests that pass without exercising the code they claim to cover: a `MagicMock` standing in for a real embedder, an all-ones attention mask that makes masked and unmasked math identical, a unit test that asserted a bug as its own specification. This one, on the heels of the mutation-testing push that closed out that arc, is about a different and in some ways more uncomfortable failure mode: tests that pass while exercising the wrong artifact entirely. A green pytest run against `src/` says nothing about whether the wheel on PyPI, the image on GHCR, or the binary on the GitHub Releases page actually does what it claims. Those are three separate build products, built by three separate pipelines, and none of trelix's 4,353 collected unit tests had ever touched any of them directly. v3.2.2 through v3.2.4 is the story of finding that gap and closing it with an actual gate, not a promise to be more careful next time. v3.2.5 is a short postscript proving the discipline stuck.

## The Docker image that shipped without its own server

The 127 above wasn't hypothetical or reconstructed after the fact — it's the literal command a human ran by hand against the real published v3.2.1 image, now baked verbatim into `scripts/verify_release.py`'s Docker check with a comment explaining why: "this exact command returned exit 127 on the published 3.2.1 image before trelix-mcp was added to the Dockerfile." Root cause was doubly blocked. The Dockerfile's builder stage never had a `COPY packages/trelix-mcp/` line — it only ever copied and installed core trelix. And even if someone had added that line, the repo's `.dockerignore` had a single bare entry, `packages/`, that would have silently excluded the whole directory from the build context anyway. Two independent gaps, each individually sufficient to explain the missing binary, both present at once — the kind of thing an ordinary Dockerfile-diff review would not catch, since the second gap lives in a different file entirely. The fix, across commits `aabaa14` and `08233f8`, rewrites `.dockerignore` to `packages/*` followed by `!packages/trelix-mcp`, and adds the missing `COPY packages/trelix-mcp/ packages/trelix-mcp/` plus its install into the same `pip install` invocation as core. Bundling it costs roughly 84MB on the slim tag by the release's own measurement — trelix-mcp's dependencies are `mcp`, `fastmcp`, and `trelix` itself, nothing that pulls in torch — but that 84MB figure is reported prose in the changelog, not a number any script in this repo computes or asserts. The mechanism that makes it plausible (no ML dependency in trelix-mcp's own `pyproject.toml`) is verifiable; the exact delta isn't.

The second 3.2.2 bug lived one layer up, in the console script itself. Before the fix, `trelix-mcp`'s `main()` never inspected `sys.argv` at all — not incorrectly, not partially, not at all. There was no `import argparse`, no reference to `sys.argv`, nothing. Running `trelix-mcp --help` from a real shell didn't print usage; it silently launched the actual MCP stdio server and sat waiting for JSON-RPC input on stdin, the exact opposite of every CLI convention a `--help` flag implies. The fix is small enough to quote in full:

```python
def main() -> None:
    """Entry point for the trelix-mcp server (stdio transport).

    Parses argv only for --help/--version/unknown-flag rejection — the normal path (no
    args, launched by an MCP client's server config) falls straight through to running
    the server, unchanged from before this parser existed.
    """
    parser = argparse.ArgumentParser(
        prog="trelix-mcp",
        description="MCP server for trelix — semantic code search over stdio.",
    )
    parser.add_argument("--version", action="version", version=f"trelix-mcp {__version__}")
    parser.parse_args()
```

Both 3.2.2 bugs share the same shape: something was correct in principle and broken in the specific packaging or invocation path a real user takes. Neither one could have failed a unit test, because no unit test in the suite ever installed a wheel, pulled an image, or ran a console script as a subprocess against `sys.argv`. They were found by a manual production-verification pass — installing and running the actual shipped PyPI packages and Docker images rather than the source tree — and that pass had, by this point, been run by hand twice: once for 3.2.1, once for 3.2.2. Running it a third time by hand was the thing the rest of this arc exists to stop doing.

## The wildcard leak and the response that mattered more than the fix

v3.2.3's actual bug is narrow and specific: `Database.bm25_search`'s `path_filter` branch, plus three `path_filter`-scoped queries in `src/trelix/retrieval/grep_search.py`, built a SQL `LIKE` pattern directly from a caller-supplied path without escaping it. `LIKE` treats `%` and `_` as wildcards inside the pattern value itself, which has nothing to do with SQL injection — every one of these queries was already parameterized with `?` — and everything to do with `LIKE`'s own semantics. A `path_filter` of `src_auth` matches not just the directory `src_auth` but also, say, `srcXauth`, because the underscore in the filter is read as "any single character," not a literal underscore. Given how common underscores are in real directory and file names (`test_utils.py`, `my_function`), this wasn't an edge case; it was a routine collision waiting for the right two sibling paths to exist in the same repository. The fix lives in `escape_like_pattern()` at `src/trelix/store/db.py:291`, whose docstring is worth quoting because it states the distinction precisely:

```python
def escape_like_pattern(value: str) -> str:
    """Escape `%`, `_`, and `\\` in `value` so it is safe as a SQL LIKE pattern segment.

    LIKE treats `%` and `_` as wildcards in the PATTERN VALUE itself — this has nothing
    to do with SQL injection (the callers here already use `?` parameterization) and
    everything to do with LIKE's own semantics.
    """
```

The sibling method `get_index_metadata_with_prefix` had already been doing this correctly for a while, pairing `escape_like_pattern()` with an explicit `ESCAPE '\\'` clause — so the fix wasn't a novel idiom, it was applying an already-proven pattern to the four call sites that had been missed. It's also not a total fix: `grep_search.py`'s own docstring flags a second, separate, still-open instance of the same defect class on the symbol-name prefix match in `_name_search`, explicitly out of scope for this release. I'd rather state that than let the fix read as more complete than it is.

What makes v3.2.3 matter for this article isn't the bug — it's what came after it. The team's own reasoning, written into the new test suite's module docstring, is that no existing test, including Click's `CliRunner`-style in-process mocking and the MCP SDK's own official in-memory `Client`, is structurally capable of seeing a defect at the real process boundary — the exact class that let trelix-mcp's `--help` bug ship in 3.2.1. In-memory transports never cross an actual OS process boundary; they can't see a console script that isn't installed, or a subprocess that hangs instead of exiting. So `tests/e2e/test_mcp_stdio_e2e.py` spawns trelix-mcp as a genuine child process, located via `shutil.which("trelix-mcp")` — the test fails loudly if the binary isn't on `PATH`, not just importable from `src/` — and talks to it over real stdin/stdout JSON-RPC via the MCP SDK's `stdio_client`. A companion test, `test_pypi_dist_install_e2e.py`, builds real wheels for all four published packages, installs each into a fresh venv, and asserts the installed `__version__` matches the working tree — never editable, never a live PyPI pull, by explicit design.

That test suite only matters if something forces it to run before a release goes out. In `.github/workflows/release.yml`, the `publish` job's dependencies now include a new `smoke-test-built-artifacts` job that downloads the just-built wheel artifacts, installs them with `pip install` — never editable — and runs the e2e suite against that install before `publish` is permitted to execute. It is a real edge in the workflow's dependency graph, not a comment or a convention. Two smaller CI extensions round it out: `ci.yml`'s Docker job now runs `docker run --rm --entrypoint trelix-mcp trelix:ci-test --version` against every built image, and `helm-lint.yml` asserts the rendered Helm chart's image tag matches `Chart.yaml`'s `appVersion`. Both are the kind of cheap check that would have caught a 3.2.1-shaped regression on the next PR instead of the next production audit.

## Automating the verification instead of re-typing it

v3.2.4's capstone answers a question the last two releases raised without answering: once you've written the checks, who runs them, and when? Before this release, the answer was a person, watching the GitHub Actions tab for both the Release and Docker Publish workflows to finish, then running `scripts/verify_release.py` by hand and reading its output. `.github/workflows/verify-release.yml` replaces that with a workflow that listens for `workflow_run` completion events from both `Release` and `Docker Publish`. Because that event fires twice — once per upstream workflow finishing — the job does a single, non-blocking check via the GitHub CLI (`gh run list --workflow "$wf" --branch "$tag"`) to see whether the *other* workflow has also gone green for the same tag; if not, it exits cleanly rather than polling, and whichever of the two triggering runs happens to fire second is the one that proceeds. Once both are confirmed green, it runs the same `scripts/verify_release.py` script a human used to run by hand — PyPI installs into fresh venvs for all four packages, Docker images smoke-tested with the exact `--entrypoint trelix-mcp` command that returned 127 on 3.2.1, a Helm chart checked out into an isolated worktree and rendered across all three backends, a GitHub Release binary actually executed, and a `pip-audit` plus wheel-content secret scan — and posts its own pass/fail summary as a workflow run. `CONTRIBUTING.md` still documents the manual command for ad-hoc re-verification, which matters, because automating the check doesn't mean giving up the ability to run it by hand when you're debugging the check itself.

## The other audit: when a symbol's nickname collides with someone else's

Running in parallel with the artifact-verification work, v3.2.4 also shipped a distinct methodology: an audit for silent symbol-collision, not artifact drift. The pattern, once named, shows up in four unrelated corners of the codebase: something that should carry a full, unique address instead answers to a bare nickname, and when two different things share that nickname, one of them silently disappears or gets misattributed.

The clearest instance is in Java. Before the fix, every nested class got a bare `qualified_name` — a class named `Config` nested inside `ServerConfig` and a different class also named `Config` nested inside `ClientConfig` both indexed under the identical name `Config`, with `parent_id` set to `None` regardless of which outer class actually enclosed them. Re-indexing one silently left the other's stale row permanently in the database. The fix threads an `outer_qualified_name` recursively through the class walk in `java.py`, so a nested class now gets `f"{outer_qualified_name}.{name}"` and a real `parent_id`. The Java record-component bug is a different kind of mistake in the same file: the extractor checked for tree-sitter node types `record_parameters` (the container) and `record_component` (the item) that the installed grammar simply doesn't emit — it emits `formal_parameters` and `formal_parameter` — so every record in the corpus indexed zero fields, silently, because the code was written against a node vocabulary that never existed in the grammar it ran against.

Rust has the identical collision shape one file over. A function defined inside `mod inner { }` previously got the same bare `qualified_name` as any other function of the same name elsewhere in the file — the fix in `rust.py` threads a `module_path` through the module walk and rewrites the qualified name to `inner::nested` for anything defined inside it. A separate Rust fix corrected the brace-import flattener, which checked for node types `use_tree_list` and `use_tree` that don't exist in the installed grammar either — the real node types are `scoped_use_list` and `use_list` — so the dominant Rust import form, `use foo::{Alpha, Beta}`, fell through to a generic fallback that stored the literal text `"{Alpha, Beta}"` as a single bogus import name, making every brace-imported symbol invisible to import-graph queries.

The same audit surfaced the collision shape outside the parsers entirely. `AgentLoop._do_get_symbol`, when asked for an exact qualified name that didn't resolve, used to fall back to an arbitrary bare-name match — silently handing the agent a different symbol's body than the one it asked for, with no error signal. The fix requires exactly one exact match or reports "not found." Federation's `make_scip_symbol_id()` used to hash a cross-repo symbol identity from just `(package, version, qualified_name)`, omitting `file_path` — meaning two different files in the same package defining `def main()` hashed to the identical 16-character id, and `INSERT OR IGNORE` against that id as a primary key silently dropped the second file's row rather than erroring. It's the most explicit statement of the whole pattern in the release: an identity hash that omitted one required scoping field, and a database that dropped the collision without complaint.

Not every bug the same audit pass caught fits that collision shape, and I'd rather say so than force the frame. The chunker's `token_count` bug was a stale cached value — computed against the pre-truncation text instead of the actual, truncated chunk that got stored. `bm25`'s stop-word handling had a related but distinct problem: a query made entirely of stop words was supposed to hit the empty-query fallback and return the FTS5 sentinel path, but the stop-word filter ran after that check instead of before it, so a stop-words-only query was treated as a normal, non-empty query instead. The walker's fix normalizes `rel_path` to NFC via `unicodedata.normalize`, because a single real file could take two different Unicode-normalization forms across walks (NFD from an HFS+ filesystem versus NFC elsewhere), fracturing one file's identity into what change detection read as a phantom delete-and-add. The graph community-detection fix removed a force-cast to `int` on node ids that crashed with `ValueError` on any ticket-linked repo, because ticket node ids are strings by design. And the CLI's `update_index` command now actually checks `result["status"]` and exits 1 on failure, instead of printing the JSON error payload and returning exit 0 regardless. Different defect shapes, same audit pass, same release — worth naming honestly as a second act rather than folding into a pattern it doesn't share.

## A short coda: the binary that gave advice it couldn't act on

v3.2.5 is one fix, and it's a fitting close because it was caught by the same discipline the verify-release capstone exists to encode: someone read the error message the real, shipped v3.2.4 binary actually prints, in production, rather than the source that built it. The standalone GitHub Release binary's local embedder — used when `sentence-transformers` isn't available — told users to run `pip install 'trelix[local]'`. That advice is correct for the pip-installed package. It is actively useless for the frozen PyInstaller binary, which is built with `sentence-transformers`, `torch`, and the rest of the ML stack deliberately excluded to keep it small, and which never consults the host's Python or pip environment at all — installing anything on the host has zero effect on a binary that doesn't read it. The fix, in `src/trelix/embedder/base.py`, checks `getattr(sys, "frozen", False)` — the standard attribute PyInstaller sets — and gives the frozen binary a message pointing at an API-backed provider or the Python package instead, leaving the pip-installed package's message byte-for-byte unchanged. It's covered by a test that asserts the frozen message never contains the string "pip install." One line of misdirection, found the same way the Docker gap and the console-script gap were found ten weeks and four releases earlier: by running the actual thing that ships, not the code that built it.
