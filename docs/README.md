# Inkforge documentation

The root [README](../README.md) covers installation and first use. The documents below hold the depth: how the generation pipeline works, how publishing to each platform works, and how to contribute.

## Guides

| Document | What it covers |
|---|---|
| [Architecture](architecture.md) | Overview; the STORM two-stage core pipeline (ingest → outline → draft → polish → emit); the BM25 RAG layer; the LLM abstraction and fallback chains; the web application (SSE streaming, path resolution, design system); content structure; SVG → PNG conversion |
| [Publishing Guide](publishing.md) | Supported platforms table; SEO-safe cross-posting order (canonical source first); Medium rules (no H3, no tables); Dev.to; Hashnode; LinkedIn carousel (PDF); Substack; canonical URL strategy |

## Project policies (repository root)

| Document | What it covers |
|---|---|
| [Contributing](../CONTRIBUTING.md) | Development setup, branching (`main` ← `develop` ← `feature/*`), Conventional Commits, PR process, code style, testing, adding a publisher, adding a generation format |
| [Security Policy](../SECURITY.md) | Supported versions, how to report a vulnerability, credential and LLM input/output handling, supply chain, GitHub Actions |
| [Code of Conduct](../CODE_OF_CONDUCT.md) | Community standards (Contributor Covenant) |
| [Changelog](../CHANGELOG.md) | Release history in Keep a Changelog format |
| [License](../LICENSE) | MIT |

## Package reference

| Package | README |
|---|---|
| `@inkforge/core` — generation pipeline, RAG, publishers, schema | [packages/core/README.md](../packages/core/README.md) |
| `@inkforge/cli` — the `inkforge` command (`generate`, `publish`, `list`) | [packages/cli/README.md](../packages/cli/README.md) |
| `@inkforge/web` — Next.js UI (`/generate`, `/articles`, `/settings`, SSE API) | [apps/web/README.md](../apps/web/README.md) |

For the authoritative list of CLI flags, run `node packages/cli/dist/index.js generate --help` and `node packages/cli/dist/index.js publish --help` after `pnpm build`; for the repo task runner, run `make help`.

## Adding documentation

Put user-facing guides in this folder and link them from the table above. The root README carries the overview, quick start and a reference summary (flags, variables, platforms); anything longer or more detailed belongs here. `assets/social-preview.png` is rendered from `assets/social-preview.html` (recipe in that file's header comment) and must be regenerated when the tagline changes.