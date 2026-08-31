# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

AI-powered article generation system. Takes notes/topic/code → produces `.md` articles via a STORM two-stage pipeline. Outputs to `content/articles/` and optionally mirrors to `../Anvilry/sairam-dev/content/notes/`.

## Commands

```bash
pnpm install                              # install all packages
pnpm build                                # build all packages via turbo (core → cli → web)
pnpm test                                 # run all tests
pnpm typecheck                            # typecheck all packages
pnpm clean                                # remove all dist/ and .next/

pnpm --filter @inkforge/core build        # build core only
pnpm --filter @inkforge/core test         # run vitest tests (11 passing)
pnpm --filter @inkforge/core test:watch   # watch mode
pnpm --filter @inkforge/core typecheck    # typecheck core only
pnpm --filter @inkforge/cli typecheck     # typecheck CLI
pnpm --filter @inkforge/web dev           # Next.js dev server → http://localhost:3000

# CLI (after build)
node packages/cli/dist/index.js generate \
  --topic "How DNS resolution works" \
  --tone senior --format explainer --length comprehensive --category system-design
node packages/cli/dist/index.js list
node packages/cli/dist/index.js publish --slug my-article --platform devto hashnode
```

Turbo build graph: `core` must build before `cli` and `web` (both depend on `@inkforge/core: workspace:*`).

## Architecture

pnpm + Turborepo monorepo. Three packages with strict dependency direction:

```
packages/core  (@inkforge/core)   — STORM pipeline, BM25 RAG, publishers, all Zod schema
packages/cli   (@inkforge/cli)    — Commander.js shell; depends on core
apps/web       (@inkforge/web)    — Next.js 16 + Tailwind v4; depends on core
```

### STORM Pipeline (`packages/core/src/pipeline/`)

The pipeline is orchestrated by `generate.ts`, which calls stages in order and fires `onProgress` callbacks for the CLI spinner and the web SSE stream.

```
ingest.ts   → NormalisedInput      (sync; extracts headings/code/tags)
outline.ts  → Outline              (LLM call; validated against OutlineSchema)
draft.ts    → section strings[]    (one LLM call per section, context-chained)
polish.ts   → polished body        (single humanisation LLM call)
emit.ts     → EmitResult           (writes .md to content/articles/, optionally mirrors to Anvilry)
```

**Stage isolation**: each stage takes the output of the previous as input — no shared mutable state between stages.

**Context chaining in draft**: each section call receives the full outline + summaries of all previously drafted sections. The growing full draft is NOT sent — this caps token usage while preventing repetition.

### LLM Abstraction (`packages/core/src/llm/index.ts`)

Single source of truth for all LLM interactions. Key exports:

| Export | Use |
|---|---|
| `generateText()` | Blocking accumulation — for pipeline intermediate stages |
| `streamText()` | Returns `ReadableStream<Uint8Array>` — for web SSE |
| `isConfigured()` | Boolean env check, no network call |
| `isFallbackEligible(err)` | 429 / 404 / 5xx / connection errors → true; 403 bad-credentials → false |

**Fallback chain (Bedrock):** `us.anthropic.claude-sonnet-4-6` → `us.anthropic.claude-haiku-4-5-20251001-v1:0`
**Fallback chain (Anthropic):** `claude-sonnet-4-6` → `claude-opus-4-7` → `claude-haiku-4-5`

Opus 4.6 is excluded from the Bedrock chain — it requires explicit per-account model enablement. Re-add `us.anthropic.claude-opus-4-6-v1` once enabled in the AWS console.

The 403 fallback distinction is intentional: IAM per-model deny (`is not authorized to invoke`) is fallback-eligible; 403 bad-credentials is not (retrying other models won't fix it).

AWS credentials can be stored as either raw strings or base64-encoded. `decodeSecret()` in `llm/index.ts` handles both transparently.

### Path Resolution Invariant

`emit.ts` resolves all output paths against `process.cwd()` at module load time. This means `INKFORGE_CONTENT_DIR=content/articles` always resolves relative to wherever the CLI or Next.js server was invoked — not relative to the compiled file. Run the CLI and the web server from the Inkforge project root.

### Web Streaming Architecture

The `/api/generate` route returns SSE (`text/event-stream`). Each pipeline stage fires a `progress` event; final completion fires `complete`. Event shape:

```
data: {"type": "progress", "stage": "draft", "detail": "2/5 — Introduction"}
data: {"type": "complete", "slug": "...", "wordCount": 1842, ...}
data: {"type": "error", "message": "..."}
```

The `maxDuration = 120` export on the route guard is required for Vercel — the polish stage sends a full assembled draft and can take >30s.

### Schema (`packages/core/src/schema/index.ts`)

All Zod schemas and inferred TypeScript types live here. The canonical type hierarchy:

```
GenerationRequest  →  (ingest)  →  NormalisedInput
NormalisedInput    →  (outline) →  Outline (OutlineSection[])
Outline            →  (draft)   →  section strings
section strings    →  (emit)    →  ArticleOutput  →  EmitResult
```

### RAG Layer (`packages/core/src/rag/`)

Used when input type is `notes`. BM25 in-memory index (k1=1.5, b=0.75) over the local `content/` directory. No external DB required.

- `chunker.ts` — hierarchical markdown chunker: h1-h6 hard splits, ~2000 char soft splits, heading context string preserved per chunk
- `indexer.ts` (`NoteIndex`) — BM25 search, returns top-5 chunks
- `enricher.ts` — injects top-5 hits into the outline stage prompt

### Publishers (`packages/core/src/publishers/`)

Each publisher is a subpath export (`./publishers/devto`, `./publishers/hashnode`). `substack.ts` is a stub (no API yet). Publishers read auth from env vars and set `canonical_url` / `originalArticleURL` automatically.

Adding a new publisher requires: the publisher file, a `package.json` subpath export, wiring into `packages/cli/src/commands/publish.ts`, a `.env.example` entry, and a CLAUDE.md publishing rules section.

## Schema / Types

All types are in `packages/core/src/schema/index.ts` (Zod-validated). Never add ad-hoc type definitions elsewhere. Add new tone/format/length constants to `packages/core/src/modes/index.ts` — this file also holds `WORD_BUDGETS`, `TONE_INSTRUCTIONS`, `FORMAT_INSTRUCTIONS`, and `SECTION_COUNTS`.

Adding a new format requires changes in four places: `schema/index.ts`, `modes/index.ts`, `cli/src/commands/generate.ts`, and `apps/web/src/components/generator/GeneratorForm.tsx`.

## Rules

- Never import from Anvilry — copy patterns, keep Inkforge self-contained
- All new pipeline stages must have unit tests with mock LLM responses
- Tests live in `src/**/__tests__/` (vitest glob: `src/**/__tests__/**/*.test.ts`)
- `content/articles/` and `content/inputs/` are gitignored — generated output, not source
- `content/published/` is committed — it is the source of truth for what is live where
- Output format is `.md` (not `.mdx`) for the primary sink — plain markdown is cross-platform; Anvilry mirror also uses `.md` since Velite accepts both via `notes/**/*.{md,mdx}`

## Branching

```
main      ← production releases only (protected)
develop   ← integration branch — all features merge here
feature/* ← branch from develop, PR back to develop
```

Never branch from or merge directly to `main`. Always branch from `develop`.

## Content Structure

```
content/
  articles/<category>/<slug>.md   ← GITIGNORED (generated output)
  inputs/<category>/<slug>.md     ← GITIGNORED (raw input saved alongside output)
  drafts/                         ← GITIGNORED
  published/
    <platform>/<slug>.md          ← COMMITTED (publish tracking records)
    linkedin/<slug>/              ← post.md + assets/ (carousel PDF) + slides/ (01-10 PNGs)
```

Categories: `system-design` | `typescript` | `react` | `ai-engineering` | `career` | `general`

## Frontmatter Fields

Required on all generated articles: `slug`, `title`, `date`, `summary`, `tags`, `draft`, `tone`, `format`, `length`, `category`, `wordCount`, `readingTime`, `generatedBy: inkforge`, `platforms`.

## Published Tracking Record Format

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
Notes about edits made before publishing.
```

## Cross-Posting Order (SEO Safe)

1. Publish to Anvilry/sairam.dev first (sets the canonical source)
2. Wait for Vercel deploy (~2 min)
3. Medium: import via `medium.com/p/import` → paste live URL → canonical set automatically
4. Dev.to: publish with `canonical_url` pointing to Anvilry URL
5. Hashnode: publish with `originalArticleURL` pointing to Anvilry URL

## Platform Publishing Rules

**Medium (verified 2026-06-19):**
- Only `##` and `**bold**` — NO `###`, NO tables
- Cover image: 1400×787px PNG — use Playwright (never `qlmanage` — adds whitespace)
- GIF embeds: paste Giphy URL on its own blank line in the editor
- Canonical URL: set in Story Settings → SEO
- Max 5 tags: System Design, Programming, Software Engineering, Computer Science, Technology
- AI-generated content is disqualified from Boost and General Distribution
- Opening: do NOT start with an `##` before first paragraph (Medium title is set separately)

**Dev.to:** `canonical_url` field in frontmatter; max 4 tags; body sent as `body_markdown`

**Hashnode:** `originalArticleURL` field; max 5 tags; body sent as `contentMarkdown`

## SVG → PNG Conversion

Always use Playwright headless Chromium — never `qlmanage` or `sips`:

```python
async with async_playwright() as p:
    browser = await p.chromium.launch()
    page = await browser.new_page(viewport={"width": W, "height": H})
    await page.set_content(f"<html><body style='margin:0'>{svg}</body></html>")
    await page.screenshot(path=out, clip={"x":0,"y":0,"width":W,"height":H})
```

## Medium Pre-Publish Checklist

- [ ] No `###` headings — only `##` and bold
- [ ] No tables
- [ ] No redundant `##` before the first paragraph
- [ ] GIF placeholders replaced with real Giphy URLs
- [ ] GitHub Gist created for any code needing syntax highlighting
- [ ] Cover image: 1400×787 PNG in `assets/`
- [ ] Canonical URL set in Medium Story Settings
- [ ] 5 Medium-compatible tags set
- [ ] Article is human-authored/reviewed — not raw AI output
