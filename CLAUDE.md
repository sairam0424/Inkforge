# Inkforge — Claude Code Configuration

## What This Is
AI-powered article generation system. Takes notes/topic/code → produces human-readable MDX articles.
Standalone project; outputs MDX to own `content/articles/` AND mirrors to `../Anvilry/sairam-dev/content/notes/`.

## Commands
```bash
pnpm install              # Install all packages
pnpm build                # Build all packages (turbo)
pnpm test                 # Run all tests
pnpm --filter @inkforge/core build   # Build core only
pnpm --filter @inkforge/core test    # Test core only

# CLI (after build)
node packages/cli/dist/index.js generate --topic "..." --tone senior --format explainer --length medium
node packages/cli/dist/index.js list
node packages/cli/dist/index.js publish --slug my-article --platform devto hashnode
```

## Project Structure
```
packages/
  core/         @inkforge/core — all generation logic (no UI dependency)
    src/
      llm/      streamWithFallback (adapted from Anvilry)
      pipeline/ ingest → outline → draft → polish → emit
      rag/      BM25 in-memory chunker + indexer + enricher
      publishers/ devto, hashnode, substack stub
      schema/   Zod types for all pipeline interfaces
      modes/    tone/format/length constants + word budgets
  cli/          @inkforge/cli — Commander.js shell over core
    src/
      commands/ generate, publish, list
content/
  articles/     primary MDX output sink
```

## LLM Layer
Bedrock (default): Sonnet 4.6 → Opus 4.6 → Haiku 4.5 fallback chain.
Toggle via `LLM_PROVIDER=anthropic` for direct Anthropic API.
Pattern adapted from `Anvilry/sairam-dev/src/lib/llm.ts` — do NOT import from there, the copy in `packages/core/src/llm/index.ts` is the source of truth for Inkforge.

## Pipeline (STORM two-stage)
1. `ingest` — normalise input (notes/topic/code) → NormalisedInput
2. `outline` — LLM call → explicit Outline artifact (h2/h3 tree + word budgets)
3. `draft` — one LLM call per section, context-chained, sequential
4. `polish` — single humanisation pass (voice, concreteness, transitions)
5. `emit` — MDX frontmatter + dual file write

## Schema / Types
All types live in `packages/core/src/schema/index.ts` (Zod-validated).
Key types: GenerationRequest, GenerationParams, Outline, ArticleOutput, EmitResult.

## Anvilry Integration
- `velite.config.ts` extended with optional Inkforge fields (tone/format/length/wordCount/readingTime/generatedBy/platforms)
- `src/lib/content.ts` exports `inkforgeNotes` filter
- Anvilry mirror path set via `INKFORGE_ANVILRY_NOTES_DIR` env var

## Rules
- Never import from Anvilry — copy patterns, keep Inkforge self-contained
- All new pipeline stages must have a unit test with mock LLM responses
- Files under 500 lines; split large pipeline stages into focused modules
- `content/articles/` is gitignored (generated output, not source)

## Content Folder Structure
```
content/
  articles/
    <category>/          # system-design | typescript | react | ai-engineering | career | general
      <slug>/
        index.md         # article body (plain .md NOT .mdx — Medium/Substack compatible)
        assets/
          cover-medium.png       # 1400×787px cover image for Medium
          diagram-*.png          # technical diagrams (rendered from SVG via Playwright)
          diagram-*.svg          # source SVGs (kept for re-rendering)
          gifs.md                # GIF recommendations per section
  inputs/
    <category>/
      <slug>.md           # raw input notes (always saved alongside output)
  drafts/
    .gitkeep
  published/              # track published versions per platform
    README.md             # explains the structure and templates
    medium/               # one <slug>.md per published article
    substack/             # one <slug>.md per published article
    hashnode/             # one <slug>.md per published article
    devto/                # one <slug>.md per published article
    linkedin/
      <slug>/             # one folder per article/post
        post.md           # caption text + notes
        assets/           # PDF carousel (upload this to LinkedIn)
        slides/           # individual PNG slides (01–10)
```

## Published Tracking

When an article is published to any platform, create a record at:
`content/published/<platform>/<slug>.md`

```markdown
---
slug: how-dns-works
title: "Article Title"
published_url: https://medium.com/@sairam/...
published_date: 2026-06-19
canonical_url: https://anvilry.vercel.app/notes/how-dns-works
status: live   # live | draft | scheduled
views: 0
claps: 0
---
Notes about edits made before publishing, platform-specific changes, etc.
```

## Article File Format Rules
- Output is `.md` (not `.mdx`) for primary sink — plain markdown works on all platforms
- Anvilry mirror keeps `.mdx` since Velite requires it
- Frontmatter fields: slug, title, date, summary, tags, draft, tone, format, length, category, wordCount, readingTime, generatedBy, platforms
- `generatedBy: inkforge` on all generated articles
- Images referenced as `assets/filename.png` (relative to article folder)
- GIF slots use `GIF_PLACEHOLDER_NAME` until replaced with real URLs

## Medium Publishing Rules (verified 2026-06-19)
- Medium supports ONLY H1 (Header) and H2 (Subheader) — NO H3
  → Use `##` for section headings, bold `**text**` for sub-points (never `###`)
- No tables — Medium editor does not support tables
- No syntax highlighting — code blocks render plain; use GitHub Gist embeds for highlighted code
- Cover image: 1400×787px PNG (use Playwright renderer, NOT qlmanage — qlmanage adds whitespace)
- GIF embeds: paste Giphy URL on its own blank line in Medium editor — auto-embeds
- Import from URL: medium.com/p/import → paste Anvilry URL → preserves all formatting
- Canonical URL: always set to https://anvilry.vercel.app/notes/<slug> in Story Settings → SEO
- Tags (topics): max 5 — use: System Design, Programming, Software Engineering, Computer Science, Technology
- AI-generated content is DISQUALIFIED from Medium Boost and General Distribution
  → Articles must be human-authored to get meaningful reach beyond followers
- Opening heading: do NOT start with an H2 — Medium title is set in Story Preview, the first ## is redundant

## Dev.to Publishing Rules
- Canonical URL field: `canonical_url` in frontmatter or API body — already wired in publishers/devto.ts
- Max 4 tags — first 4 from the article tags array
- Body sent as `body_markdown` — renders native markdown including code blocks

## Hashnode Publishing Rules
- `originalArticleURL` field sets canonical — already wired in publishers/hashnode.ts
- Max 5 tags
- Content sent as `contentMarkdown`

## SVG → PNG Conversion
- ALWAYS use Playwright headless Chromium (NOT qlmanage or sips)
- qlmanage renders to square canvas and adds whitespace — broken output
- Playwright renders at exact SVG viewBox dimensions — pixel-perfect
- Script pattern: wrap SVG in HTML page, set body to exact dimensions, screenshot with clip
- See: assets/diagram-*.svg for source files

## Cross-Posting Order (SEO safe)
1. Publish to Anvilry/sairam.dev FIRST (sets the canonical source)
2. Wait for Anvilry to deploy (Vercel, ~2 min)
3. Import to Medium via medium.com/p/import using the live URL → canonical set automatically
4. Publish to Dev.to with canonical_url pointing to Anvilry URL
5. Publish to Hashnode with originalArticleURL pointing to Anvilry URL

## Article Checklist Before Publishing to Medium
- [ ] No `###` headings in body — only `##` and bold
- [ ] No tables
- [ ] Opening section: no redundant H2 before first paragraph
- [ ] GIF placeholders replaced with real Giphy URLs
- [ ] Code blocks: create GitHub Gist for any bash/code that needs syntax highlighting
- [ ] Cover image: 1400×787 PNG exists in assets/
- [ ] Canonical URL set in Medium Story Settings
- [ ] 5 Medium-compatible tags set (System Design, Programming, etc.)
- [ ] Article is human-authored/reviewed — not raw AI output
