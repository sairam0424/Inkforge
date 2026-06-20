# @inkforge/cli

The terminal interface for Inkforge. Wraps `@inkforge/core` with a streaming progress UI.

## Commands

### `inkforge generate`

Generate an article from notes, a topic, or code.

```bash
# From a notes file
inkforge generate \
  --input my-notes.md \
  --tone senior \
  --format explainer \
  --length comprehensive \
  --category system-design

# From a topic
inkforge generate \
  --topic "How RAFT consensus works" \
  --tone intermediate \
  --format tutorial \
  --length medium

# From code
inkforge generate \
  --code ./src/lib/llm.ts \
  --format showcase \
  --tone senior
```

**All flags:**

| Flag | Values | Default |
|---|---|---|
| `--input <file>` | Path to `.md` notes file | — |
| `--topic <text>` | Topic string or question | — |
| `--code <file>` | Path to code file | — |
| `--tone` | `beginner` / `intermediate` / `senior` | `intermediate` |
| `--format` | `tutorial` / `narrative` / `explainer` / `opinion` / `showcase` | `tutorial` |
| `--length` | `thread` / `short` / `medium` / `comprehensive` | `medium` |
| `--mode` | `oneshot` / `interactive` / `iterative` | `oneshot` |
| `--category` | `system-design` / `typescript` / `react` / `ai-engineering` / `career` / `general` | `general` |
| `--platforms` | `devto,hashnode` | — |
| `--title` | Override auto-generated title | — |
| `--tags` | Comma-separated tags | auto-inferred |
| `--date` | `YYYY-MM-DD` | today |
| `--watch` | Re-generate on every file save (requires `--input`) | off |

### `inkforge publish`

Publish a generated article to external platforms.

```bash
# Publish as draft to Dev.to
inkforge publish --slug how-dns-works --platform devto

# Publish live to Dev.to
inkforge publish --slug how-dns-works --platform devto --published
```

> **Hashnode:** `gql.hashnode.com` was decommissioned in June 2026 — no public API exists. Publish to Hashnode manually at https://hashnode.com. See [docs/publishing.md](../../docs/publishing.md).

### `inkforge list`

List all generated articles.

```bash
inkforge list
```

Shows: title, slug, category, word count, reading time, platform publish badges.

## Environment

Requires at minimum one LLM provider configured — see `.env.example` in the repo root.

```bash
# Run with env file
node --env-file=../../.env packages/cli/dist/index.js generate --topic "..."

# Or set env vars directly
LLM_PROVIDER=bedrock BEDROCK_ACCESS_KEY_ID=... node packages/cli/dist/index.js generate ...
```
