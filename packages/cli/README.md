# @inkforge/cli

Inkforge CLI — generate and publish articles from the terminal.

`inkforge` is a thin [Commander.js](https://github.com/tj/commander.js) shell over [`@inkforge/core`](../core/README.md). It turns a notes file, a topic string, or a code file/directory into a Markdown article through the STORM two-stage pipeline (outline first, then one LLM call per section, then a polish pass), shows a spinner per stage, writes the result to `content/articles/<category>/<slug>.md`, and can publish finished articles to Dev.to, Hashnode and Medium.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Synopsis](#synopsis)
  - [`inkforge generate`](#inkforge-generate)
  - [`inkforge publish`](#inkforge-publish)
  - [`inkforge list`](#inkforge-list)
- [Environment](#environment)
- [Exit codes](#exit-codes)
- [Contributing](#contributing)
- [License](#license)

## Install

> [!NOTE]
> `@inkforge/cli` is not published to npm yet. Until it is, build and run it from the monorepo.

Requires Node >= 20 and pnpm >= 9.

```bash
git clone https://github.com/sairam0424/Inkforge.git
cd Inkforge
pnpm install
pnpm build                              # turbo: builds @inkforge/core, @inkforge/cli and the Next.js web app
node packages/cli/dist/index.js --help
```

The examples below use `inkforge` as shorthand for `node packages/cli/dist/index.js`. If you want the short form, add an alias for the current shell:

```bash
alias inkforge="node $PWD/packages/cli/dist/index.js"
```

Run the CLI from the repository root. The binary loads `.env` from the current working directory (`dotenv/config`), and every output path resolves relative to the directory you run it from. Copy [`.env.example`](../../.env.example) to `.env` and fill in one LLM provider before the first run.

## Usage

### Synopsis

```text
Usage: inkforge [options] [command]

Inkforge CLI — generate and publish articles from the terminal

Options:
  -V, --version       output the version number
  -h, --help          display help for command

Commands:
  generate [options]  Generate an article from notes, a topic, or code
  publish [options]   Publish a generated article to external platforms
  list                List generated articles with status
  help [command]      display help for command
```

### `inkforge generate`

Generate an article from exactly one input source: `--input` (notes mode), `--topic` (topic mode) or `--code` (code mode). If more than one is given, `--input` wins, then `--topic`, then `--code`.

```bash
# From a notes file, as a senior-level explainer
inkforge generate \
  --input content/inputs/system-design/raft-notes.md \
  --tone senior \
  --format explainer \
  --length comprehensive \
  --category system-design

# From a topic string
inkforge generate --topic "How DNS resolution works under the hood" --length short

# From a single source file, as a project showcase
inkforge generate --code packages/core/src/llm/index.ts --format showcase --tone senior

# From a directory (first 10 source files are collected)
inkforge generate --code packages/core/src/rag --format tutorial --category typescript

# Tag the article for later publishing and pin the date
inkforge generate --topic "Zod at the API boundary" \
  --tags zod,typescript,validation --platforms devto,hashnode --date 2026-10-11

# Re-generate every time the notes file is saved (Ctrl+C to stop)
inkforge generate --input content/inputs/general/draft.md --watch
```

| Flag | Argument | Values | Default |
|---|---|---|---|
| `--input` | `<file>` | Path to a Markdown notes file (notes mode) | — |
| `--topic` | `<text>` | Topic string or question (topic mode) | — |
| `--code` | `<file>` | Path to a code file or directory (code mode) | — |
| `--tone` | `<tone>` | `beginner` \| `intermediate` \| `senior` | `intermediate` |
| `--format` | `<format>` | `tutorial` \| `narrative` \| `explainer` \| `opinion` \| `showcase` | `tutorial` |
| `--length` | `<length>` | `thread` \| `short` \| `medium` \| `comprehensive` | `medium` |
| `--mode` | `<mode>` | `oneshot` \| `interactive` \| `iterative` | `oneshot` |
| `--title` | `<title>` | Preferred title: replaces the extracted title in every mode; topic mode forwards it to the outline prompt, notes mode uses it to seed the BM25 query; the outline's own title is what gets written | — |
| `--tags` | `<tags>` | Comma-separated tags, suggested to the outline stage; the final tags are the outline's | inferred by the outline stage |
| `--platforms` | `<platforms>` | Comma-separated: `devto,hashnode` | `""` |
| `--category` | `<category>` | `system-design` \| `typescript` \| `react` \| `ai-engineering` \| `career` \| `general` | `general` |
| `--date` | `<date>` | Publication date, `YYYY-MM-DD` | today |
| `--watch` | — | Watch the `--input` file and regenerate on every save | off |

Details worth knowing:

- **`--length` sets the word budget**: `thread` = 300, `short` = 800, `medium` = 1800, `comprehensive` = 3500 words.
- **`--mode`**: only `oneshot` is implemented. `interactive` and `iterative` are accepted by the option validator but run the same one-shot pipeline today.
- **`--title` does not force the title.** Ingest uses it as the extracted title in every mode; only topic mode forwards it to the outline prompt as a preference, notes mode uses it to seed the BM25 enrichment query, and code mode just replaces the inferred `Deep Dive: <file>` title. The title written to the article is always the one the outline stage returns.
- **`--code` with a directory** walks it recursively, skips `node_modules`, `dist`, `.next`, `.turbo` and `.git`, collects at most 10 files with the extensions `.ts .tsx .js .jsx .py .go .rs`, and fails if none are found.
- **`--platforms`** only stamps the `platforms` frontmatter field and prints the matching `inkforge publish` command afterwards; it does not publish. Values other than `devto` and `hashnode` are dropped.
- **`--watch`** requires `--input`; saves are debounced by 500 ms and a save during an in-flight generation is skipped.
- **Notes mode runs RAG enrichment** before the outline stage: a BM25 index is built over the directory named by `INKFORGE_CONTENT_DIR` (when set) plus any colon-separated directories in `INKFORGE_NOTES_DIRS`, and the top hits are passed to the outline prompt. If indexing fails the run continues without it.

Output of a successful run:

- `content/articles/<category>/<slug>.md` — the article, with frontmatter (`slug`, `title`, `date`, `summary`, `tags`, `draft`, `tone`, `format`, `length`, `category`, `wordCount`, `readingTime`, `generatedBy: inkforge`, `platforms`). The base directory is `INKFORGE_CONTENT_DIR` (default `content/articles`) resolved against the current working directory.
- `content/inputs/<category>/<slug>.md` — the raw notes/topic/code that produced it, so the article can be regenerated. A content directory named `articles` gets a sibling `inputs/` directory (the default `content/articles` → `content/inputs`); any other name gets an `inputs/` directory inside it, so the raw input can never collide with the article.
- `<INKFORGE_ANVILRY_NOTES_DIR>/<slug>.md` — an optional mirror, written only when that variable is set and the directory already exists.

### `inkforge publish`

Publish a generated article to one or more platforms. The slug is the one the outline model chose (printed by `generate` and used verbatim as the filename). The article is located by slug under `INKFORGE_CONTENT_DIR`: first `<category>/<slug>.md` when `--category` is given, then a flat `<slug>.md`, then every category folder (including `<category>/<slug>/index.md`).

```bash
# Draft on Dev.to (default is draft)
inkforge publish --slug how-dns-works --platform devto

# Publish live on Dev.to, pointing canonical_url at your own site
inkforge publish --slug how-dns-works --platform devto --published \
  --canonical-base https://anvilry.vercel.app/notes

# Dev.to and Hashnode in one run; each platform reports success or failure separately
inkforge publish --slug how-dns-works --platform devto hashnode

# Medium: imports the already-live canonical URL via medium.com/p/import
inkforge publish --slug how-dns-works --platform medium \
  --canonical-base https://anvilry.vercel.app/notes
```

| Flag | Argument | Values | Default |
|---|---|---|---|
| `--slug` | `<slug>` | Article slug to publish (required) | — |
| `--platform` | `<platforms...>` | One or more of `devto` `hashnode` `medium` | — (at least one required) |
| `--published` | — | Publish publicly instead of saving a draft | draft |
| `--category` | `<category>` | Category folder to look in | `""` (searches all categories) |
| `--canonical-base` | `<url>` | Canonical URL base; the slug is appended | `INKFORGE_CANONICAL_BASE`, else `https://sairam.dev/notes` |

`--help` prints whatever `INKFORGE_CANONICAL_BASE` resolves to in your `.env` as the `--canonical-base` default.

What each platform needs:

| Platform | Transport | Requirements | Behaviour |
|---|---|---|---|
| `devto` | Dev.to REST API | `DEVTO_API_KEY` | Creates a **new** article on every run (draft unless `--published`); sends `body_markdown`, the first 4 alphanumeric tags, and `canonical_url = <canonical-base>/<slug>`. |
| `hashnode` | [browser-harness](../../docs/publishing.md#hashnode-publishing) driving your own logged-in Chrome | `HASHNODE_EDITOR_URL` (your blog's "Write" screen URL), `browser-harness` on `PATH` or `BROWSER_HARNESS_BIN`, Chrome already logged in to Hashnode | Hashnode's public API was decommissioned in 2026-06. Fills title, body and up to 5 tags; clicks Publish only with `--published`. The canonical URL is **not** scripted — set it in Hashnode's SEO settings. Writes `content/published/hashnode/<slug>.md`. |
| `medium` | browser-harness via `medium.com/p/import` | `--canonical-base` pointing at a **live** page, `browser-harness`, Chrome logged in to Medium | Medium has no public API; it re-parses the live canonical page. The body is checked first and the run aborts on any `###` heading or Markdown table. Clicks Publish only with `--published`. Tags and canonical confirmation in Story Settings are manual. Writes `content/published/medium/<slug>.md`. |

The browser-harness publishers never enter credentials or MFA codes; if Chrome lands on a login wall the command stops with a `LoginRequiredError` and asks you to log in yourself. They only run from this CLI on your own machine, not from the web UI. Substack and LinkedIn are manual flows — see [docs/publishing.md](../../docs/publishing.md) for the full cross-posting order and per-platform rules.

### `inkforge list`

```bash
inkforge list
```

No flags. Reads `INKFORGE_CONTENT_DIR` (default `../../content/articles`, resolved against the current working directory) and prints each article's title, slug, word count, reading time and platform badges from its frontmatter. Prints a hint to run `inkforge generate` when nothing is found.

Known gap: `list` only picks up flat `*.mdx` files directly in that directory, while `generate` writes `<category>/<slug>.md`, so articles produced by this CLI do not appear yet.

## Environment

All variables are read from `.env` in the directory you run the CLI from. See [`.env.example`](../../.env.example) for the template.

| Variable | Used by | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `generate` | `bedrock` (default) or `anthropic` |
| `BEDROCK_ACCESS_KEY_ID`, `BEDROCK_SECRET_ACCESS_KEY` | `generate` | AWS credentials (raw or base64-encoded) when `LLM_PROVIDER=bedrock` |
| `BEDROCK_REGION` | `generate` | Bedrock region; falls back to `AWS_REGION`, then `us-east-1` |
| `BEDROCK_SESSION_TOKEN` | `generate` | Optional STS session token |
| `ANTHROPIC_API_KEY` | `generate` | Required when `LLM_PROVIDER=anthropic` |
| `INKFORGE_CONTENT_DIR` | all commands | Article output/lookup root. `generate` and `publish` default to `content/articles`; `list` defaults to `../../content/articles`; the RAG index only reads it when set |
| `INKFORGE_NOTES_DIRS` | `generate` (notes mode) | Extra colon-separated directories for the RAG index |
| `INKFORGE_ANVILRY_NOTES_DIR` | `generate` | Optional mirror directory for generated articles |
| `INKFORGE_CANONICAL_BASE` | `publish` | Default for `--canonical-base` |
| `DEVTO_API_KEY` | `publish --platform devto` | Dev.to API key |
| `HASHNODE_EDITOR_URL` | `publish --platform hashnode` | Your Hashnode "Write" screen URL |
| `BROWSER_HARNESS_BIN` | `publish --platform hashnode\|medium` | Path to the `browser-harness` binary (default `browser-harness`) |

`generate` refuses to start (exit 1) unless the selected provider's credentials are present. Generation makes several LLM calls per article — one for the outline, one per section, one for polish — so expect provider costs proportional to `--length`.

## Exit codes

| Code | When |
|---|---|
| `0` | Command finished. Also returned when `generate` option validation fails (`✗ Invalid options:` on stderr), when the pipeline throws (`Generation failed` on stderr), and when `publish` fails on an individual platform (each failure is printed inline) — check stderr, not the exit code, when scripting |
| `1` | LLM not configured, `--watch` without `--input`, missing or unreadable input path, no source files in a `--code` directory, no input source given, article slug not found, or no `--platform` given; also any Commander usage error (missing `--slug`, unknown option or command) |

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for the development setup, branching model (`main` <- `develop` <- `feature/*`) and commit conventions. The CLI has no tests of its own yet; the pipeline it wraps is tested in [`@inkforge/core`](../core/README.md#tests).

## License

[MIT](../../LICENSE)
