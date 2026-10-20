# Changelog

All notable changes to Inkforge will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.6] - 2026-10-20

### Added

#### Content pipeline
- prompt-lift v0.4.0 launch article: the first write-up of the owner's Claude Code mod (sairam0424/claude-prompt-lift), produced by a 15-agent dynamic workflow against the repository at tag v0.4.0, with the real demo GIF and launch film embedded and five verified GIFs — Dev.to and Substack live, LinkedIn single post with the launch film attached (#72)

## [0.1.5] - 2026-10-11

### Fixed
- `emit` no longer overwrites the generated article with the raw input when `INKFORGE_CONTENT_DIR` does not end in `articles`; the inputs directory is now derived from the last path segment (sibling `inputs/` for `articles`, `<dir>/inputs/` otherwise) with a guard against ever writing to the article's own path (#63, #68)
- `inkforge generate` exits after a successful run in interactive terminals; the stage spinner is recoloured at the emit stage instead of being replaced by a second spinner whose timer kept the process alive (#68)

### Security
- Dependency advisories patched so `pnpm audit` is clean at every severity and the CI Security Audit job is green again (#67): `next` 16.3.3 → 16.3.8 (critical RCE in `next/og`, high SSRF in Image Optimization, four moderate cache/leak advisories, one low), `sharp` 0.35.4 → 0.35.5 (librsvg CVE-2026-96889), `source-map-js` 1.2.1 → 1.2.2 (event-loop DoS), `vitest`/`@vitest/mocker` 4.1.9 → 4.1.11 (path traversal). Supersedes Dependabot #59/#60.

## [0.1.4] - 2026-10-11

### Added
- `apps/web/README.md` (pages, API routes, SSE event shapes, limitations) and a `docs/README.md` index (#62)
- Terminal demo recording `docs/assets/demo.svg` (a real `inkforge generate` run, asciinema + svg-term) and a self-contained social-preview card `docs/assets/social-preview.{html,png}` (#62)

### Changed
- Root `README.md` rewritten to the Standard Readme order: dynamic badges only (CI, CodeQL, OpenSSF Scorecard, release, license), table of contents, Quick Start, Install and Run Options, full `generate`/`publish`/`list` flag tables, every environment variable the code reads, Mermaid pipeline diagram, LLM fallback chains as implemented, Supported Platforms table and an honest Status and Roadmap section (#62)
- `packages/cli/README.md` and `packages/core/README.md` rewritten against the source: exports, defaults, exit codes, publisher contracts, `onProgress` event order, actual test coverage (#62)
- One short description everywhere: README, root `package.json`, a new `apps/web/package.json` description and the GitHub About text; GitHub topics replaced with 20 descriptive ones; `inkforge --help` prints the CLI package description instead of the old "human-readable MDX" tagline (#62)
- GitHub Release `v0.1.3` created from the CHANGELOG so the release badge tracks the latest tag

### Fixed
- Documentation claims corrected in review: `--title` semantics, `pnpm lint` (no linter is wired up), `make ci` audit step is advisory locally, the web app writes relative to `apps/web`, Dev.to tag drop rule, `--platform substack` rejection, Node 20.9 floor from Next.js 16, Commander exit codes, Makefile `.env` parsing, `make publish-status` scope; `SECURITY.md`, `CONTRIBUTING.md`, `docs/architecture.md` and `docs/publishing.md` aligned with the code (#62)

### Known issues
- `emit` overwrites the generated article with the raw input when `INKFORGE_CONTENT_DIR` does not end in `articles` (#63)
- `inkforge generate` does not exit in an interactive terminal because the stage spinner is never stopped
- The CI dependency audit is still red on the `apps/web` advisories listed under 0.1.3; Dependabot #59/#60 (`next` 16.3.8) are pending

## [0.1.3] - 2026-10-11

### Added

#### Content pipeline
- Combined release article for tracehub-mcp v0.12.3 + cost-guard-mcp v0.3.3 (#56) — Dev.to and Substack live; single LinkedIn post listing every surface each server is live on (18 verified links); 5-GIF plan embedded in the body in the single-line `![description](direct-url)` format
- trelix v3.2.2 → v3.3.8 release article (#53) — Dev.to and Substack live
- MindForge v12.0.0 first-user-release launch article (#52) — Dev.to and Substack live
- trelix v3.1.1 and v3.2.1 release articles across Dev.to, Substack and LinkedIn
- Backlog publish: "How I Built Inkforge" (Dev.to draft) plus DNS and Inkforge platform tracking files

#### Publishers
- Medium and Hashnode browser-harness publishers in `@inkforge/core` (#46)

#### CI and tooling
- CodeQL, OSSF Scorecard and gitleaks workflows; dependency audit gate (`pnpm audit --audit-level high`) enforced in CI (#49)
- Dependabot configuration for npm and GitHub Actions
- GitHub Actions SHA-pinned with explicit least-privilege permissions
- Tailored CodeRabbit review configuration (#47)

### Changed
- `next` 16.2.9 → 16.2.11 → 16.3.3 to patch transitive postcss and sharp CVEs (#30, #40); `@tailwindcss/postcss` 4.3.1 → 4.3.3 (#39)

### Security
- Known, not yet fixed: the CI dependency audit currently fails on advisories published after 2026-09-26 in `apps/web`'s tree — `next@16.3.3` (SSRF in Image Optimization, RCE in `next/og`; fixed in ≥16.3.8), `sharp@0.35.4` (librsvg, fixed in ≥0.35.5), `source-map-js`, `vitest`. Dependency bumps are tracked for the next release and are unrelated to the content in this one.

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

[Unreleased]: https://github.com/sairam0424/Inkforge/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/sairam0424/Inkforge/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/sairam0424/Inkforge/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/sairam0424/Inkforge/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/sairam0424/Inkforge/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/sairam0424/Inkforge/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/sairam0424/Inkforge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sairam0424/Inkforge/releases/tag/v0.1.0
