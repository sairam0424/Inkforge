# Changelog

All notable changes to Inkforge will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `inkforge generate --watch`: watches `--input` file with 500ms debounce, re-runs full pipeline on every save

### Fixed
- CI: removed duplicate pnpm `version:` key (conflicts with `packageManager` in `package.json`); bumped Node to 22
- `emit.ts`: Anvilry mirror now writes `.md` (not `.mdx`); Velite notes pattern updated to `*.{md,mdx}`
- `publish.ts`: article resolved by `.md` path scanning all category subfolders; YAML array parsing fixed for `tags`/`platforms`

### Changed
- Hashnode publisher (`publishToHashnode`) now throws a clear deprecation error — `gql.hashnode.com` was decommissioned June 2026, no replacement API exists
- All docs updated to reflect Hashnode manual-only workflow

## [0.1.0] - 2026-06-19

### Added

#### @inkforge/core
- STORM two-stage pipeline: ingest → outline → draft → polish → emit
- BM25 in-memory RAG with hierarchical Markdown chunker (h1-h6 hard splits, 2000 char soft splits)
- AWS Bedrock LLM provider with Sonnet 4.6 → Haiku 4.5 fallback chain
- Direct Anthropic API provider support (`LLM_PROVIDER=anthropic`)
- 403 explicit-deny treated as fallback-eligible (per-model IAM policy handling)
- 4096 token outline budget with JSON truncation repair
- Dev.to publisher (REST API v1) with `canonical_url` support
- Hashnode publisher (GraphQL v2) with `originalArticleURL` support
- Substack stub publisher with clear error message (no public API)
- Zod-validated schema for all pipeline types (`GenerationRequest`, `Outline`, `ArticleOutput`)
- Category routing: system-design | typescript | react | ai-engineering | career | general
- Dual output: `content/articles/<category>/` + optional Anvilry portfolio mirror
- Input source persisted to `content/inputs/<category>/` alongside output

#### @inkforge/cli
- `inkforge generate` — 3 input modes (notes/topic/code), tone × format × length × category
- `inkforge publish` — Dev.to + Hashnode with canonical URL
- `inkforge list` — article library with word count + platform badges
- Streaming stage progress: ora spinners + chalk color-coded labels
- RAG enrichment auto-runs for `--input` mode (indexes `content/` directory)

#### @inkforge/web
- `/generate` page: 2-column GeneratorForm + live SSE StreamingPreview
- `/articles` page: library grid with format filter pills + skeleton loading
- `/articles/[slug]` page: detail view with stats sidebar + one-click publish buttons
- `/settings` page: config status (LLM provider, paths, API keys — boolean flags only)
- `DialSelector` component: Motion spring animated pill (stiffness:420, damping:34)
- `PipelineProgress` tracker: Circle → Loader2 (spin) → CheckCircle2
- `StreamingPreview`: live SSE display with terminal cursor animation
- 5 API routes: `/api/generate`, `/api/articles`, `/api/articles/[slug]`, `/api/publish`, `/api/config`
- Dark theme matching Anvilry portfolio: `#07080d` bg, `#38e1ff` accent

#### Content system
- Per-category article folder structure
- Published tracking per platform: Medium, Substack, Dev.to, Hashnode, LinkedIn
- LinkedIn carousel PDF pipeline (Playwright-rendered, 10 slides, 1080×1080px each)
- SVG → PNG conversion via Playwright headless Chromium (pixel-perfect, no whitespace)
- `published/README.md`: template + platform quick-reference table

#### Developer experience
- pnpm + Turborepo monorepo with proper `outputs` caching
- GitHub Actions CI workflow (build, test, TypeScript, security audit)
- Issue templates (bug report, feature request) with YAML form format
- PR template with checklist
- SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md (Contributor Covenant 2.1)
- Per-package README.md for `@inkforge/core` and `@inkforge/cli`
- `docs/architecture.md` and `docs/publishing.md`

### Technical

- TypeScript strict mode across all packages
- 11/11 tests passing (vitest)
- Conventional Commits enforced
- Branching strategy: `main` (releases) ← `develop` (integration) ← `feature/*`

[Unreleased]: https://github.com/sairam0424/Inkforge/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sairam0424/Inkforge/releases/tag/v0.1.0
