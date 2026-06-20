# @inkforge/core

The generation engine behind Inkforge. Takes notes, topics, or code → polished Markdown articles via a STORM two-stage pipeline.

## Usage

```typescript
import { generate } from '@inkforge/core';

const result = await generate({
  inputType: 'topic',
  content: 'How DNS resolution works under the hood',
  params: {
    tone: 'senior',
    format: 'explainer',
    length: 'comprehensive',
    mode: 'oneshot',
  },
  tags: ['dns', 'networking', 'system-design'],
  platforms: ['devto'],
  category: 'system-design',
}, {
  onProgress: ({ stage, detail }) =>
    console.log(`[${stage}]${detail ? ` ${detail}` : ''}`),
});

console.log(`Written: ${result.emitResult.primaryPath}`);
console.log(`Words: ${result.emitResult.wordCount}`);
```

## Pipeline Stages

| Stage | File | Description |
|---|---|---|
| `ingest` | `src/pipeline/ingest.ts` | Normalises input → `NormalisedInput` |
| `outline` | `src/pipeline/outline.ts` | LLM → Outline artifact (STORM Stage 1) |
| `draft` | `src/pipeline/draft.ts` | Section drafts, context-chained (STORM Stage 2) |
| `polish` | `src/pipeline/polish.ts` | Humanisation pass |
| `emit` | `src/pipeline/emit.ts` | Frontmatter + dual file write |

## Generation Parameters

```typescript
type GenerationParams = {
  tone:   'beginner' | 'intermediate' | 'senior';
  format: 'tutorial' | 'narrative' | 'explainer' | 'opinion' | 'showcase';
  length: 'thread' | 'short' | 'medium' | 'comprehensive';
  mode:   'oneshot' | 'interactive' | 'iterative';
};
```

Word budgets: `thread=300` · `short=800` · `medium=1800` · `comprehensive=3500`

## LLM Configuration

```bash
# AWS Bedrock (default) — Sonnet 4.6 → Haiku 4.5 fallback
LLM_PROVIDER=bedrock
BEDROCK_ACCESS_KEY_ID=...
BEDROCK_SECRET_ACCESS_KEY=...
BEDROCK_REGION=us-east-1

# Direct Anthropic API
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
```

## Publishers

```typescript
import { publishToDevto } from '@inkforge/core/publishers/devto';

const result = await publishToDevto(article, {
  published: false,
  canonicalBase: 'https://yoursite.com/notes',
});
// → { id: number, url: string }
```

> **Hashnode:** `publishToHashnode` is exported but throws immediately — `gql.hashnode.com` was decommissioned in June 2026. Publish to Hashnode manually until a replacement API is available.

## Tests

```bash
pnpm --filter @inkforge/core test
# Test Files  2 passed (2)
#       Tests  11 passed (11)
```
