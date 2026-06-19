# ⚒ Inkforge

AI-powered article generation system. Takes notes, topics, or code → produces structured, human-readable Markdown articles. Built for engineers who want to publish without the writing bottleneck.

## What It Does

```
Your notes / topic / code
         ↓
    Inkforge CLI
         ↓
   Polished .md article
    ↙           ↘
content/        Anvilry
articles/    (portfolio mirror)
```

- **Three input modes** — paste notes, type a topic, or point at code
- **Tunable dials** — tone (beginner/intermediate/senior) × format (tutorial/narrative/explainer/opinion/showcase) × length (thread/short/medium/comprehensive)
- **Dual output** — writes to `content/articles/` and mirrors to your Anvilry portfolio
- **One-command publishing** — push directly to Dev.to and Hashnode with canonical URL

## Stack

- **pnpm + Turborepo** monorepo
- **`@inkforge/core`** — STORM two-stage pipeline (ingest → outline → draft → polish → emit), BM25 RAG, publishers
- **`@inkforge/cli`** — Commander.js CLI with streaming progress
- **`@inkforge/web`** — Next.js 16 + Tailwind v4 web UI (streaming generation preview)
- **LLM** — AWS Bedrock (Sonnet 4.6 → Opus 4.6 → Haiku 4.5 fallback) or direct Anthropic API

## Quick Start

```bash
# Install
pnpm install

# Copy env and fill in your LLM credentials
cp .env.example .env

# Generate an article
node packages/cli/dist/index.js generate \
  --topic "How RAFT consensus works" \
  --tone senior --format explainer --length comprehensive

# List generated articles
node packages/cli/dist/index.js list

# Publish to Dev.to
node packages/cli/dist/index.js publish \
  --slug your-article-slug \
  --platform devto
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | No | `bedrock` (default) or `anthropic` |
| `BEDROCK_ACCESS_KEY_ID` | If using Bedrock | AWS Access Key |
| `BEDROCK_SECRET_ACCESS_KEY` | If using Bedrock | AWS Secret Key |
| `BEDROCK_REGION` | No | Default: `us-east-1` |
| `ANTHROPIC_API_KEY` | If `LLM_PROVIDER=anthropic` | Direct API key |
| `INKFORGE_CONTENT_DIR` | No | Default: `content/articles` |
| `INKFORGE_ANVILRY_NOTES_DIR` | No | Path to Anvilry notes folder |
| `DEVTO_API_KEY` | For Dev.to publishing | Dev.to API key |
| `HASHNODE_API_KEY` | For Hashnode publishing | Hashnode API key |
| `HASHNODE_PUBLICATION_ID` | For Hashnode publishing | Your publication ID |

## Project Structure

```
packages/
  core/     @inkforge/core — pipeline, RAG, publishers, schema
  cli/      @inkforge/cli — terminal interface
apps/
  web/      @inkforge/web — Next.js web UI
content/
  articles/ generated articles (gitignored)
  inputs/   raw input notes (gitignored)
  drafts/   work in progress
  published/ tracking records per platform
```

## Commands

```bash
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm --filter @inkforge/core build  # Build core only
pnpm --filter @inkforge/web dev     # Start web UI
```

## License

MIT
