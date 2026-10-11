# @inkforge/core

Inkforge generation pipeline engine.

`@inkforge/core` turns notes, a topic, or source code into a Markdown article using a STORM-style two-stage pipeline: an explicit outline artifact first, then one context-chained LLM call per section, then a single humanisation pass. It also ships the LLM provider layer (Amazon Bedrock or the Anthropic API, with model fallback), a BM25 note index for retrieval-augmented outlining, and publishers for Dev.to, Hashnode and Medium. It has no UI dependency; [`@inkforge/cli`](../cli/README.md) and [`@inkforge/web`](../../apps/web/README.md) are thin shells over it.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [`generate()`](#generate)
  - [Request and result types](#request-and-result-types)
  - [Individual stages](#individual-stages)
  - [RAG helpers](#rag-helpers)
  - [LLM layer](#llm-layer)
  - [Mode constants](#mode-constants)
- [Pipeline stages](#pipeline-stages)
- [Publishers](#publishers)
- [Environment](#environment)
- [Tests](#tests)
- [Contributing](#contributing)
- [License](#license)

## Install

> [!NOTE]
> `@inkforge/core` is not published to npm yet. Inside this monorepo, depend on it with `"@inkforge/core": "workspace:*"`; from outside, clone the repository and build it.

```bash
git clone https://github.com/sairam0424/Inkforge.git
cd Inkforge
pnpm install
pnpm --filter @inkforge/core build      # emits dist/ (tsc)
```

Requirements: Node >= 20. The package is ESM-only (`"type": "module"`) and exposes these entry points:

| Specifier | What it exports |
|---|---|
| `@inkforge/core` | `generate()`, schema types and Zod schemas, LLM helpers, RAG helpers, individual stages, mode constants |
| `@inkforge/core/publishers/devto` | `publishToDevto()` |
| `@inkforge/core/publishers/hashnode` | `publishToHashnode()` |
| `@inkforge/core/publishers/medium` | `publishToMedium()` |
| `@inkforge/core/publishers/registry` | `resolvePublisher()`, `supportedPlatforms()` |

## Usage

### `generate()`

```ts
import { generate } from "@inkforge/core";

const { emitResult, outline } = await generate(
  {
    inputType: "topic",
    content: "How DNS resolution works under the hood",
    params: { tone: "senior", format: "explainer", length: "comprehensive", mode: "oneshot" },
    tags: ["dns", "networking"],
    platforms: ["devto"],
    category: "system-design",
  },
  {
    date: "2026-10-11",
    onProgress: ({ stage, detail }) => console.log(stage, detail ?? ""),
  },
);

console.log(outline.title);              // title chosen by the outline stage
console.log(emitResult.primaryPath);     // content/articles/system-design/<slug>.md
console.log(emitResult.wordCount, emitResult.readingTime);
```

```ts
function generate(
  request: GenerationRequest,
  opts?: {
    onProgress?: (progress: GenerationProgress) => void;
    enrichmentContext?: string;   // extra context injected into the outline prompt (see RAG helpers)
    date?: string;                // YYYY-MM-DD, defaults to today
  },
): Promise<GenerationResult>;
```

`onProgress` fires at every stage transition, in order:

| `stage` | `detail` |
|---|---|
| `"ingest"` | — |
| `"outline"` | — |
| `"draft"` | `"0/<n> sections"`, then `"<done>/<n> — <heading>"` after each section |
| `"polish"` | — |
| `"emit"` | — |

Validate untrusted input with the exported Zod schema before calling `generate()`; the function itself does not re-validate:

```ts
import { GenerationRequestSchema } from "@inkforge/core";

const parsed = GenerationRequestSchema.safeParse(body);
if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));
await generate(parsed.data);
```

### Request and result types

All types are inferred from Zod schemas in `src/schema/index.ts` and re-exported from the package root.

`GenerationRequest`

| Field | Type | Default | Notes |
|---|---|---|---|
| `inputType` | `"notes" \| "topic" \| "code"` | required | Selects the ingest strategy |
| `content` | `string` (min 1) | required | Notes text, topic string, or concatenated source |
| `filePaths` | `string[]` | — | Code mode only: each file is read from disk and appended to `content` (unreadable paths are noted, not fatal); also used to infer a fallback title (`Deep Dive: <basename>`) |
| `params` | `GenerationParams` | required object | See below |
| `title` | `string` | — | Replaces the extracted title in every mode; forwarded to the outline prompt only for topic input (notes input uses it to seed the BM25 query); the final title is `Outline.title` |
| `tags` | `string[]` | `[]` | Suggested to the outline stage; the final tags are `Outline.tags` (the LLM may drop or add) |
| `platforms` | `("devto" \| "hashnode" \| "medium")[]` | `[]` | Stamped into frontmatter only |
| `category` | `Category` | `"general"` | `system-design` \| `typescript` \| `react` \| `ai-engineering` \| `career` \| `general` — becomes the output subfolder |

`GenerationParams`

| Field | Values | Default |
|---|---|---|
| `tone` | `beginner` \| `intermediate` \| `senior` | `intermediate` |
| `format` | `tutorial` \| `narrative` \| `explainer` \| `opinion` \| `showcase` | `tutorial` |
| `length` | `thread` (300 words) \| `short` (800) \| `medium` (1800) \| `comprehensive` (3500) | `medium` |
| `mode` | `oneshot` \| `interactive` \| `iterative` | `oneshot` |

`mode` is validated but `generate()` always runs the one-shot pipeline; the other two values are reserved. Callers who want a different loop can compose the [individual stages](#individual-stages).

`GenerationResult`

```ts
type GenerationResult = {
  emitResult: EmitResult;   // { slug, primaryPath, anvilryPath?, wordCount, readingTime }
  outline: Outline;         // { title, summary, slug, tags, totalWordBudget, sections[] }
};
```

Each `Outline.sections[]` entry is `{ heading, level: 2 | 3, keyPoints: string[], wordBudget: number, examples: string[] }`. `ArticleOutput` (the publishers' input type) and `NormalisedInput` are exported as well, together with the `GenerationRequestSchema`, `GenerationParamsSchema` and `CategorySchema` Zod objects.

### Individual stages

Every stage that `generate()` chains is exported so you can run them separately:

```ts
import { ingest, generateOutline, draftSections, assembleDraft, polish, emit } from "@inkforge/core";

const input    = ingest(request);                                   // NormalisedInput (sync)
const outline  = await generateOutline(input, request.params, enrichmentContext);
const sections = await draftSections(outline, input, request.params, (done, total, heading) => {});
const draft    = assembleDraft(outline, sections);                  // "# Title\n" + sections
const body     = await polish(draft, outline, request.params);
const result   = emit(body, outline, request.params, request.platforms, "2026-10-11", request.category, request.content);
```

### RAG helpers

```ts
import { buildNoteIndex, buildEnrichmentContext, NoteIndex, ingest } from "@inkforge/core";

const index = buildNoteIndex();                 // indexes INKFORGE_CONTENT_DIR (only when set) + INKFORGE_NOTES_DIRS (colon-separated)
console.log(index.size);                        // number of chunks
const context = buildEnrichmentContext(ingest(request), index);   // top-5 BM25 hits as a text block, or undefined
await generate(request, { enrichmentContext: context });

// Or index arbitrary directories yourself
const custom = new NoteIndex();
custom.index(["./notes", "./docs"]);
custom.search("consensus leader election", 5); // IndexEntry[] with content, headingContext, filePath
```

The index is in-memory BM25 (k1 = 1.5, b = 0.75) over Markdown files, chunked hierarchically by heading with ~2000-character soft splits. `buildEnrichmentContext()` returns `undefined` when the index is empty, when a topic input is shorter than 20 characters, or when nothing matches.

### LLM layer

```ts
import { generateText, streamText, isConfigured, getProvider } from "@inkforge/core";

getProvider();        // "bedrock" | "anthropic"  (LLM_PROVIDER, default bedrock)
isConfigured();       // true when the selected provider's credentials are present; no network call

const { text, model, usage } = await generateText(
  { max_tokens: 1024, messages: [{ role: "user", content: "Say hi" }] },
  { onError: (err, model) => console.warn(model, err) },
);

const stream: ReadableStream<Uint8Array> = streamText({ max_tokens: 1024, messages: [...] });
```

Both helpers accept the Anthropic SDK message params minus `model` and walk a fallback chain, trying the next model when an attempt fails with a connection error, HTTP 429/404/5xx, a 400 whose message marks the model as invalid or unavailable, or a 403 that is a per-model explicit deny. A plain 403 (bad credentials) is not retried. Each attempt has a 120-second timeout.

| Provider | Chain (in order) |
|---|---|
| `bedrock` (default) | `us.anthropic.claude-sonnet-4-6` -> `us.anthropic.claude-haiku-4-5-20251001-v1:0` (Opus is left out because Bedrock needs per-account model enablement; add it to `BEDROCK_CHAIN` in `src/llm/index.ts` if your account has it) |
| `anthropic` | `claude-sonnet-4-6` -> `claude-opus-4-7` -> `claude-haiku-4-5` |

`streamText()` emits text deltas as UTF-8 bytes; once any text has been emitted it will not switch models. If the client cannot be initialised it writes `[Error initialising LLM: ...]` into the stream; on an error before the first byte it writes `[LLM error: ...]`; in both cases the stream then closes.

### Mode constants

```ts
import { WORD_BUDGETS, TONE_INSTRUCTIONS, FORMAT_INSTRUCTIONS, computeReadingTime } from "@inkforge/core";

WORD_BUDGETS.comprehensive;        // 3500
computeReadingTime(1800);          // minutes at 265 wpm, minimum 1
TONE_INSTRUCTIONS.senior;          // prompt text injected for that tone
FORMAT_INSTRUCTIONS.explainer;     // structural instructions for that format
```

## Pipeline stages

| Stage | Module | LLM calls | Input -> output |
|---|---|---|---|
| `ingest` | `src/pipeline/ingest.ts` | 0 | `GenerationRequest` -> `NormalisedInput` (title, tags, headings and code snippets extracted per input type) |
| `outline` | `src/pipeline/outline.ts` | 1 | `NormalisedInput` + params (+ enrichment context) -> `Outline` validated against `OutlineSchema`; section count and total budget follow `length` |
| `draft` | `src/pipeline/draft.ts` | 1 per section, sequential | Each call sees the outline, its section spec and summaries of the preceding sections -> `string[]` |
| `polish` | `src/pipeline/polish.ts` | 1 | Assembled draft -> humanised body (voice, concreteness, transitions, varied sentence length) |
| `emit` | `src/pipeline/emit.ts` | 0 | Body + outline -> `.md` with frontmatter at `<INKFORGE_CONTENT_DIR>/<category>/<slug>.md`, raw input saved to the sibling `inputs/<category>/<slug>.md`, optional mirror to `INKFORGE_ANVILRY_NOTES_DIR` -> `EmitResult` |

Paths in `emit` resolve against `process.cwd()`, so run the host process from the repository root or set `INKFORGE_CONTENT_DIR` to an absolute path. The raw input is saved next to the articles: a directory named `articles` gets a sibling `inputs/` (the default `content/articles` → `content/inputs`); any other name gets `inputs/` inside it, and `emit` never writes the raw input to the article's own path. The frontmatter written is `slug`, `title`, `date`, `summary`, `tags`, `draft: false`, `tone`, `format`, `length`, `category`, `wordCount`, `readingTime`, `generatedBy: inkforge`, `platforms`.

## Publishers

Publishers live under subpath exports so that importing one does not pull in the others. All of them take an `ArticleOutput` and return `{ id, url }`.

| Subpath | Function | Transport | Required | Options | Returns |
|---|---|---|---|---|---|
| `./publishers/devto` | `publishToDevto(article, opts?)` | Dev.to REST API (`POST https://dev.to/api/articles`) | `DEVTO_API_KEY` | `published?: boolean` (default `false`), `canonicalBase?: string` | `{ id: number; url: string }` |
| `./publishers/hashnode` | `publishToHashnode(article, opts?)` | `browser-harness` driving the operator's logged-in Chrome | `HASHNODE_EDITOR_URL` or `opts.editorUrl`; `browser-harness` binary | `published?`, `canonicalBase?`, `editorUrl?` | `{ id: string; url: string }` |
| `./publishers/medium` | `publishToMedium(article, opts)` | `browser-harness` via `https://medium.com/p/import` | `opts.canonicalBase` (the article must already be live there); `browser-harness` binary | `published?`, `canonicalBase` (required), `force?` | `{ id: string; url: string }` |
| `./publishers/registry` | `resolvePublisher(platform)`, `supportedPlatforms()` | — | — | — | `{ modulePath, exportName }` for dynamic import; `["devto", "hashnode", "medium"]` |

Contracts to be aware of:

- **Dev.to** always creates a new article; there is no update path. Tags are lower-cased, stripped of hyphens and spaces and capped at 20 characters; any tag that still contains a character outside `a-z0-9` is dropped rather than sanitised, and the first four survivors are sent. `canonical_url` is `<canonicalBase>/<slug>` when `canonicalBase` is given. Non-2xx responses throw `Dev.to API error <status>: <body>`.
- **Hashnode** exists because Hashnode's public GraphQL API was decommissioned in 2026-06. The publisher fills the title, body and up to 5 tags, clicks Publish only when `published` is true, and does not touch the SEO/canonical panel. The returned `id` is the article slug.
- **Medium** has no public API, so the publisher imports the live canonical page. Before touching the browser it runs a content check and throws a `MediumContentValidationError` (`err.name === "MediumContentValidationError"`, `err.warnings: ({ type: "h3-heading", line, text } | { type: "table", line })[]`) if the body contains any `###`-or-deeper heading or a Markdown table; pass `force: true` to bypass. The returned `id` is Medium's post id parsed from the URL when available.
- **Login safety.** Both browser publishers first open the target page and throw `LoginRequiredError` if the resulting URL looks like a login wall. They never type credentials or MFA codes. `browser-harness` is resolved from `BROWSER_HARNESS_BIN` (default `browser-harness` on `PATH`) with a 60-second timeout per script.
- **Published tracking.** `publishToHashnode` and `publishToMedium` write a record to `content/published/<platform>/<slug>.md` (resolved against `process.cwd()`) with frontmatter `slug`, `title`, `published_url`, `published_date`, optional `canonical_url`, `status` (`live` | `draft`), `views: 0`, `claps: 0`, followed by free-text notes about what still has to be done by hand. `publishToDevto` does not write a record. The writer (`writePublishedTrackingRecord` in `src/publishers/published-tracking.ts`) is internal and not part of the public exports.
- **Substack** has no publish API; `src/publishers/substack.ts` is an internal stub that throws with instructions to paste manually and is not exported.

```ts
import { publishToDevto } from "@inkforge/core/publishers/devto";
import { resolvePublisher } from "@inkforge/core/publishers/registry";

await publishToDevto(article, { published: false, canonicalBase: "https://example.com/notes" });

const { modulePath, exportName } = resolvePublisher("medium");   // throws "Unknown platform: ..." otherwise
const mod = await import(modulePath);
await mod[exportName](article, { canonicalBase: "https://example.com/notes" });
```

Platform rules, the recommended cross-posting order and the manual Substack/LinkedIn flows are in [docs/publishing.md](../../docs/publishing.md).

## Environment

The package reads configuration from `process.env`; load a `.env` file in the host process (the CLI and web app both do). Template: [`.env.example`](../../.env.example).

| Variable | Default | Used by |
|---|---|---|
| `LLM_PROVIDER` | `bedrock` | LLM layer |
| `BEDROCK_ACCESS_KEY_ID`, `BEDROCK_SECRET_ACCESS_KEY` | — | LLM layer (raw or base64-encoded) |
| `BEDROCK_SESSION_TOKEN` | — | LLM layer (optional) |
| `BEDROCK_REGION` | `AWS_REGION`, then `us-east-1` | LLM layer |
| `ANTHROPIC_API_KEY` | — | LLM layer when `LLM_PROVIDER=anthropic` |
| `INKFORGE_CONTENT_DIR` | `content/articles` for `emit`; no default for `buildNoteIndex` | `emit`, `buildNoteIndex` (indexed only when set) |
| `INKFORGE_NOTES_DIRS` | — | `buildNoteIndex` (colon-separated extra directories) |
| `INKFORGE_ANVILRY_NOTES_DIR` | — | `emit` mirror (skipped if unset or missing) |
| `DEVTO_API_KEY` | — | `publishToDevto` |
| `HASHNODE_EDITOR_URL` | — | `publishToHashnode` |
| `BROWSER_HARNESS_BIN` | `browser-harness` | Hashnode and Medium publishers |

## Tests

```bash
pnpm --filter @inkforge/core test
```

Vitest picks up `src/**/__tests__/**/*.test.ts`. Eight files cover `ingest`, the Markdown chunker, the Medium and Hashnode publishers, the browser-harness client, the Medium content validator, the tracking-record writer and the publisher registry (browser-harness is mocked with `vi.mock`); none of it calls an LLM provider. Untested today: the LLM-backed stages (`outline`, `draft`, `polish`), `publishToDevto`, `emit`, `generate()`, `NoteIndex` and `buildEnrichmentContext`, the fallback-eligibility rules in `src/llm/index.ts`, and `computeReadingTime`. [CONTRIBUTING.md](../../CONTRIBUTING.md) requires mocked-LLM unit tests for any new stage.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md), in particular the "Adding a Publisher" and "Adding a Generation Format" sections. Every new pipeline stage needs a unit test with mocked LLM output, and `src/llm/index.ts` is the single source of truth for provider configuration.

## License

[MIT](../../LICENSE)
