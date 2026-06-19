# Architecture

## Overview

Inkforge is a pnpm + Turborepo monorepo with three packages:

```
packages/
  core/   @inkforge/core  — generation engine (no UI dependency)
  cli/    @inkforge/cli   — Commander.js terminal interface
apps/
  web/    @inkforge/web   — Next.js 16 + Tailwind v4 web UI
```

---

## Core Pipeline

### STORM Two-Stage Approach

Inkforge implements an adapted version of the STORM pipeline where the **outline is an explicit first-class artifact** rather than an implicit prompt side-effect.

```
Input (notes / topic / code)
         ↓
   ingest.ts     →  NormalisedInput
                    headings, code blocks, tags extracted
         ↓
   outline.ts    →  Outline artifact              ← STAGE 1
                    h2/h3 tree + keyPoints[]
                    + wordBudget per section
         ↓
   draft.ts      →  Section drafts               ← STAGE 2
                    one LLM call per section
                    context-chained sequentially
         ↓
   polish.ts     →  Humanisation pass
                    voice, concreteness, transitions
         ↓
   emit.ts       →  .md frontmatter + dual write
                    content/articles/<category>/
                    + Anvilry mirror (optional)
```

**Stage 1 — Outline generation:**
The LLM receives the normalised input and generation parameters and returns structured JSON: section titles, key points per section, real-world examples to include, and a word budget per section. The outline is validated against `OutlineSchema` (Zod) before proceeding.

**Stage 2 — Section drafting:**
Each section is drafted independently. Each call receives the full outline + section spec + summaries of all preceding sections (context chaining). This prevents repetition without sending the growing full draft on every call.

**Polish pass:**
A single LLM call targets human-readability: personal voice injection ("I've seen..."), concrete specifics over vague generalities, smooth transitions between sections, varied sentence length.

---

## RAG Layer

For notes-dump inputs, Inkforge uses a BM25 in-memory index over the local `content/` directory:

- **Hierarchical Markdown chunker** (`src/rag/chunker.ts`): h1-h6 hard splits, ~2000 char soft splits, heading context string preserved per chunk (e.g. `# Guide > ## Installation > ### macOS`)
- **NoteIndex** (`src/rag/indexer.ts`): BM25 with k1=1.5, b=0.75 (TREC defaults), no external database needed at personal KB scale
- **Enricher** (`src/rag/enricher.ts`): Top-5 BM25 hits injected into the outline stage prompt as related context

---

## LLM Abstraction

`packages/core/src/llm/index.ts` is the single source of truth for all LLM interactions:

| Export | Use |
|---|---|
| `generateText()` | Blocking accumulation — for pipeline intermediate stages |
| `streamText()` | Streaming `ReadableStream` — for CLI progress display |
| `isConfigured()` | Boolean env check — no network call |
| `makeClient()` | Constructs provider client (Bedrock or Anthropic) |
| `bedrockCreds()` | Decodes base64 credentials, exported for reuse |

**Fallback chain (Bedrock):** Sonnet 4.6 → Haiku 4.5

**Fallback eligibility:** `isFallbackEligible()` returns `true` for 429, 404, 5xx, connection errors, and 403 messages containing "not authorized to perform" (per-model IAM deny). Plain 403 bad-credentials is NOT eligible — no point retrying other models.

---

## Web Application

### Streaming Architecture

```
Browser                    Next.js API Route
   |                              |
   |  POST /api/generate          |
   |  ReadableStream ─────────────|
   |                              |  generate() with onProgress
   |  data: {"type":"progress"}   |  ←── pipeline emits events
   |  data: {"type":"progress"}   |
   |  data: {"type":"complete"}   |
   |                              |
```

The web UI parses SSE events (`data: {json}\n\n`) from a `ReadableStream`. Each pipeline stage fires a `progress` event; completion fires `complete` with the article metadata.

### Path Resolution

All output paths in `emit.ts` resolve relative to `process.cwd()` — the directory from which the CLI or Next.js server is invoked. This makes `INKFORGE_CONTENT_DIR=content/articles` resolve to `<project-root>/content/articles` regardless of package depth.

### Design System

Matches the Anvilry portfolio dark theme — all CSS custom properties defined in `apps/web/src/app/globals.css` and mapped to Tailwind v4 via `@theme inline`.

---

## Content Structure

```
content/
  articles/<category>/<slug>/     ← GITIGNORED (generated output)
    index.md
    assets/
      cover-medium.png            ← 1400×787px, Playwright-rendered
      diagram-*.png               ← technical diagrams
      diagram-*.svg               ← source SVGs
  inputs/<category>/              ← GITIGNORED (raw notes)
  drafts/
  published/                      ← COMMITTED (tracking records)
    <platform>/<slug>.md
```

Generated articles are never committed — they're output, not source. Published tracking records are committed — they're the source of truth for what's live where.

---

## SVG → PNG Conversion

Always use Playwright headless Chromium. Never use macOS `qlmanage` — it renders to a square canvas and adds whitespace below content.

```python
async with async_playwright() as p:
    browser = await p.chromium.launch()
    page = await browser.new_page(viewport={"width": W, "height": H})
    await page.set_content(f"<html><body style='margin:0'>{svg}</body></html>")
    await page.screenshot(path=out, clip={"x":0,"y":0,"width":W,"height":H})
```
