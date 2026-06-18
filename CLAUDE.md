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
