# Changelog

All notable changes to Inkforge will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-06-27

### Added

#### Content pipeline
- Tombstone v1.0 launch article (3,531 words, narrative/senior/comprehensive) — generated via STORM pipeline from personal on-call incident notes
- Platform versions: Dev.to (live), Substack (live), Medium (backlog), Hashnode (backlog)
- LinkedIn 15-slide HQ carousel at 2× pixel density (deviceScaleFactor=2) — 2.93MB PDF, all slides 170–260KB
- LinkedIn carousel includes: new personal hook (slide 02), flag lifecycle DRAFT→TOMBSTONED (slide 14), USP vs competitors — LaunchDarkly/Unleash/GrowthBook (slide 15)
- Cover image 1400×787px rendered via Playwright headless Chromium
- GIF asset plan with Giphy search keywords for all 5 article sections
- LinkedIn single combined post bridging feature-flags article → Tombstone launch (based on 104-agent deep research, carousel = 7.00% engagement)

#### CLI fix
- `inkforge generate --code <dir>` now walks directory trees (max 10 files), skipping `node_modules/dist/.next/.turbo/.git`, collecting `.ts/.tsx/.js/.jsx/.py/.go/.rs` with file-path headers

#### DX
- `Makefile` at repo root — 27 targets across 9 groups (Setup · Build · Quality · Generate · Publish · Content · Cleanup · Extras)
- `make help` auto-generated from inline `##` comments (Kubernetes awk pattern)
- `make generate TOPIC="..." TONE=senior` wraps full STORM pipeline with guard macros
- `make ci` mirrors GitHub Actions locally
- `make env-check` prints green/red status for every required environment variable
- `-include .env` + `export` auto-bridges `.env` credentials to all recipe shells

### Fixed
- Dev.to publish: correct GitHub URL (`sairam0424/Tombstone`), correct npm package name (`@tombstone/core`), removed broken GIF placeholder images
- All Tombstone articles: version references updated from v1.0.0 → v2.2.0 (Dashboard v1.0.0)

### Content
- Published tracking records for Tombstone v1.0 across Dev.to, Substack, LinkedIn
- Feature flags article tracking updated: LinkedIn carousel ready, Medium/Hashnode backlog

## [0.1.1] - 2026-06-20

### Added
- `inkforge generate --watch` — watches `--input` file with 500ms debounce, re-runs full pipeline on every save; skips overlapping runs; Ctrl+C exits cleanly
- Published tracking records for both articles across Dev.to and Hashnode

### Fixed
- CI: removed duplicate pnpm `version:` key (conflicts with `packageManager` in package.json); bumped Actions Node from 20 to 22
- `emit.ts`: Anvilry mirror now writes `.md` — Velite notes pattern widened to `*.{md,mdx}`
- `publish.ts`: resolves article by `.md` path, scans all category subfolders, parses YAML arrays correctly
- `publishers/devto.ts`: sanitize tags — strip hyphens/spaces, alphanumeric only, max 4 × 20 chars (fixes 422 errors)

### Changed
- `publishers/hashnode.ts`: `gql.hashnode.com` decommissioned June 2026 — throws clear deprecation error, no silent failure
- All docs updated: Hashnode marked manual-only, `--watch` flag added to CLI reference, cross-post order updated

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

[Unreleased]: https://github.com/sairam0424/Inkforge/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/sairam0424/Inkforge/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/sairam0424/Inkforge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sairam0424/Inkforge/releases/tag/v0.1.0
