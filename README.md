<div align="center">

# ⚒ Inkforge

**AI-powered article generation — notes, topics, or code → human-readable Markdown articles**

[![CI](https://img.shields.io/github/actions/workflow/status/sairam0424/Inkforge/ci.yml?branch=main&label=CI&logo=github)](https://github.com/sairam0424/Inkforge/actions)
[![Tests](https://img.shields.io/badge/tests-11%20passing-brightgreen)](https://github.com/sairam0424/Inkforge/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-0.1.0-orange)](https://github.com/sairam0424/Inkforge/releases/tag/v0.1.0)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange?logo=pnpm)](https://pnpm.io/)

<!-- demo gif here -->

</div>

---

## What it does

Inkforge turns your raw knowledge into polished, publishable articles — and gets them onto Dev.to, Hashnode, and your portfolio in one command.

```
Your notes / topic / code
          ↓
     ⚒ Inkforge
          ↓
    Polished .md article
    ↙              ↘
content/         sairam.dev · Dev.to
articles/           Hashnode · Medium
```

**Key features:**

- 📝 **Three input modes** — paste notes, type a topic, or point at a code file
- 🎛 **Fully tunable** — tone × format × length, independently selectable
- 📤 **One-command publishing** — `inkforge publish` pushes directly to Dev.to and Hashnode
- 🌐 **Web UI** — streaming live preview as your article generates section by section
- 🔗 **Canonical URL** — all cross-posts attribute back to your portfolio, SEO-safe

---

## Quick Start

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Clone and install
git clone https://github.com/sairam0424/Inkforge.git
cd Inkforge
pnpm install

# Configure LLM credentials
cp .env.example .env
# Edit .env — add BEDROCK_ or ANTHROPIC_API_KEY at minimum

# Build
pnpm build

# Generate your first article
node packages/cli/dist/index.js generate \
  --topic "How DNS resolution works" \
  --tone senior \
  --format explainer \
  --length comprehensive \
  --category system-design

# Or use the web UI
pnpm --filter @inkforge/web dev
# → http://localhost:3000
```

---

## Configuration

Copy `.env.example` to `.env` and fill in your credentials.

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | No | `bedrock` (default) or `anthropic` |
| `BEDROCK_ACCESS_KEY_ID` | If Bedrock | AWS Access Key ID |
| `BEDROCK_SECRET_ACCESS_KEY` | If Bedrock | AWS Secret Access Key |
| `BEDROCK_REGION` | No | Default: `us-east-1` |
| `ANTHROPIC_API_KEY` | If `LLM_PROVIDER=anthropic` | Direct Anthropic API key |
| `INKFORGE_CONTENT_DIR` | No | Default: `content/articles` |
| `INKFORGE_ANVILRY_NOTES_DIR` | No | Path to Anvilry portfolio notes folder |
| `INKFORGE_CANONICAL_BASE` | No | Base URL for canonical links (e.g. `https://yoursite.com/notes`) |
| `DEVTO_API_KEY` | For Dev.to publishing | Dev.to API key |
| `HASHNODE_API_KEY` | For Hashnode publishing | Hashnode API key |
| `HASHNODE_PUBLICATION_ID` | For Hashnode publishing | Your Hashnode publication ID |

---

## CLI Reference

```bash
inkforge generate [options]    # Generate an article
inkforge publish  [options]    # Publish to Dev.to or Hashnode
inkforge list                  # List generated articles
```

**Generate flags:**

| Flag | Values | Default |
|---|---|---|
| `--input <file>` | Markdown notes file | — |
| `--topic <text>` | Topic string | — |
| `--code <file>` | Code file path | — |
| `--tone` | `beginner` / `intermediate` / `senior` | `intermediate` |
| `--format` | `tutorial` / `narrative` / `explainer` / `opinion` / `showcase` | `tutorial` |
| `--length` | `thread` / `short` / `medium` / `comprehensive` | `medium` |
| `--category` | `system-design` / `typescript` / `react` / `ai-engineering` / `career` / `general` | `general` |
| `--platforms` | `devto,hashnode` | — |

---

## Architecture

```
packages/
  core/   @inkforge/core  — STORM pipeline, BM25 RAG, publishers, schema
  cli/    @inkforge/cli   — Commander.js terminal interface
apps/
  web/    @inkforge/web   — Next.js 16 + Tailwind v4 web UI
content/
  articles/   generated articles (gitignored)
  inputs/     raw notes (gitignored)
  published/  tracking records per platform (committed)
```

### STORM Pipeline

Inkforge uses a two-stage pipeline where the outline is an explicit first-class artifact:

| Stage | Description |
|---|---|
| **Outline** (Stage 1) | LLM generates section titles, key points, and word budgets |
| **Draft** (Stage 2) | Each section drafted independently with context chaining |
| **Polish** | Single humanisation pass — voice, concreteness, transitions |
| **Emit** | Writes `.md` + frontmatter to `content/articles/<category>/` |

See [docs/architecture.md](docs/architecture.md) for full technical detail.

---

## Development

```bash
pnpm build                              # Build all packages
pnpm test                               # Run tests (11/11)
pnpm --filter @inkforge/core build      # Build core only
pnpm --filter @inkforge/core test       # Test core only
pnpm --filter @inkforge/web dev         # Start web UI at localhost:3000
```

---

## Documentation

- [Architecture](docs/architecture.md) — pipeline design, RAG, streaming
- [Publishing Guide](docs/publishing.md) — cross-posting, canonical URLs, platform-specific rules
- [Contributing](CONTRIBUTING.md) — setup, branching, commit convention, adding publishers
- [Security Policy](SECURITY.md) — vulnerability reporting, credential handling

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

---

## License

MIT — see [LICENSE](LICENSE)
