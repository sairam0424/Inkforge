# @inkforge/web

Inkforge web UI — generate, browse and publish articles from the browser.

A Next.js 16 (App Router) + React 19 + Tailwind CSS v4 front end over [`@inkforge/core`](../../packages/core/README.md). It runs the same STORM two-stage pipeline as the CLI, streams per-stage progress to the page over Server-Sent Events, lists the generated articles, and can publish to Dev.to. The dark theme matches the Anvilry portfolio; design tokens are CSS custom properties in `src/app/globals.css` mapped to Tailwind through `@theme inline`. The package is private and is not published.

## Table of Contents

- [Run it](#run-it)
- [Pages](#pages)
- [API routes](#api-routes)
- [Environment](#environment)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)

## Run it

Requires Node >= 20 and pnpm >= 9. The app imports `@inkforge/core` from its built `dist/`, so build the workspace first.

```bash
git clone https://github.com/sairam0424/Inkforge.git
cd Inkforge
pnpm install
cp .env.example .env            # fill in one LLM provider
pnpm build                      # builds core (and everything else) via turbo
pnpm --filter @inkforge/web dev # or: make dev-web
```

Open <http://localhost:3000>. Production build and start:

```bash
pnpm --filter @inkforge/web build
pnpm --filter @inkforge/web start
```

`next.config.ts` loads the monorepo-root `.env` with `dotenv` at startup, so one `.env` serves the CLI and the web app. All filesystem paths in the API routes resolve against `process.cwd()/../..`, which is the repository root when the server is started through `pnpm --filter @inkforge/web dev|start` (cwd `apps/web`); starting `next` from any other directory breaks the path.

## Pages

| Route | File | What it does |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page: the three input modes, the tone/format/length dials, and the dual-output pitch |
| `/generate` | `src/app/generate/page.tsx` | Generator form (`GeneratorForm`, `DialSelector`), live pipeline progress (`PipelineProgress`) and a streaming preview; posts to `/api/generate` |
| `/articles` | `src/app/articles/page.tsx` | Article library fed by `GET /api/articles` |
| `/articles/[slug]` | `src/app/articles/[slug]/page.tsx` | Single article view fed by `GET /api/articles/[slug]`, with a publish action that calls `POST /api/publish` |
| `/settings` | `src/app/settings/page.tsx` | Read-only status board from `GET /api/config`: LLM provider configured, content and mirror directories present, Dev.to and Hashnode keys set |

`error.tsx`, `not-found.tsx` and `articles/loading.tsx` provide the error, 404 and skeleton states.

## API routes

All routes are Node.js route handlers under `src/app/api/`.

### `POST /api/generate` — streaming generation

Body: a `GenerationRequest` (validated with `GenerationRequestSchema` from `@inkforge/core`; `400` with `{ error, details }` on failure, `400 { error: "Invalid JSON" }` on a bad body).

```json
{
  "inputType": "topic",
  "content": "How DNS resolution works under the hood",
  "params": { "tone": "senior", "format": "explainer", "length": "medium", "mode": "oneshot" },
  "tags": ["dns"],
  "platforms": [],
  "category": "system-design"
}
```

Response: `Content-Type: text/event-stream` (`Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`). Each event is one line `data: <json>` followed by a blank line:

```
data: {"type":"progress","stage":"ingest"}

data: {"type":"progress","stage":"outline"}

data: {"type":"progress","stage":"draft","detail":"0/5 sections"}

data: {"type":"progress","stage":"draft","detail":"1/5 — What a resolver actually does"}

data: {"type":"progress","stage":"polish"}

data: {"type":"progress","stage":"emit"}

data: {"type":"complete","slug":"how-dns-resolution-works","wordCount":1760,"readingTime":7,"primaryPath":"/.../content/articles/system-design/how-dns-resolution-works.md"}
```

| `type` | Fields | Meaning |
|---|---|---|
| `progress` | `stage` (`ingest` \| `outline` \| `draft` \| `polish` \| `emit`), `detail?` | Mirrors `generate()`'s `onProgress` callback |
| `complete` | `slug`, `wordCount`, `readingTime`, `primaryPath`, `anvilryPath` (present only when a mirror file was written) | The `EmitResult`; the stream closes after this |
| `error` | `message` | Pipeline threw; the stream closes after this |

The route sets `maxDuration = 120`. The client (`GeneratorForm`) reads the body as a `ReadableStream`, splits the buffer on newlines and `JSON.parse`s every line that starts with `data: `.

### `POST /api/publish`

Body: `{ "slug": string, "platform": "devto", "published"?: boolean }`. Publishes the article at `<contentDir>/<slug>.mdx` through `publishToDevto` with `canonicalBase` from `INKFORGE_CANONICAL_BASE`. Returns `{ url }`, or `404 { error: "Article not found" }`, `500 { error }` on a Dev.to failure. `platform` values `medium` and `hashnode` return `400` with a message pointing to the CLI, because those publishers drive the operator's own logged-in Chrome and only run locally; any other `platform` value returns `400 { error: "Unknown platform" }`. The body is not schema-validated, so a missing `slug` surfaces as the `404`.

### `GET /api/articles`

Returns the parsed frontmatter of every `.mdx` file directly inside the content directory, newest `date` first (`[]` when the directory is missing or unreadable).

### `GET /api/articles/[slug]` and `DELETE /api/articles/[slug]`

`GET` returns `{ slug, content }` with the raw file text; `DELETE` removes the file and returns `{ ok: true }`. Both look for `<contentDir>/<slug>.mdx` and return `404 { error: "Not found" }` otherwise.

### `GET /api/config`

```json
{
  "llmProvider": "bedrock",
  "llmConfigured": true,
  "devtoConfigured": false,
  "hashnodeConfigured": false,
  "contentDir": "/abs/path/content/articles",
  "contentDirExists": true,
  "anvilryDir": null,
  "anvilryDirExists": false
}
```

## Environment

Read from the repository-root `.env` (template: [`.env.example`](../../.env.example)).

| Variable | Default | Used for |
|---|---|---|
| `LLM_PROVIDER` | `bedrock` | Provider for `/api/generate`; shown on `/settings` |
| `BEDROCK_ACCESS_KEY_ID`, `BEDROCK_SECRET_ACCESS_KEY`, `BEDROCK_REGION` | region `us-east-1` | Bedrock credentials (raw or base64-encoded) |
| `ANTHROPIC_API_KEY` | — | Required when `LLM_PROVIDER=anthropic` |
| `INKFORGE_CONTENT_DIR` | `content/articles` | Where `/api/generate` writes and `/api/articles` reads (relative to the repo root) |
| `INKFORGE_ANVILRY_NOTES_DIR` | — | Optional mirror directory; status shown on `/settings` |
| `INKFORGE_CANONICAL_BASE` | `https://sairam.dev/notes` | `canonical_url` base for `/api/publish` |
| `DEVTO_API_KEY` | — | `/api/publish` with `platform: "devto"` |
| `HASHNODE_API_KEY`, `HASHNODE_PUBLICATION_ID` | — | Only drive the Hashnode status dot on `/settings`; no web publish path uses them |

## Limitations

- Only Dev.to can be published from the browser. Medium and Hashnode require the CLI (`inkforge publish --platform medium|hashnode`) because they automate your own logged-in Chrome via browser-harness; see [docs/publishing.md](../../docs/publishing.md).
- `/api/articles`, `/api/articles/[slug]` and `/api/publish` read flat `<slug>.mdx` files in the content directory, while the pipeline's `emit` stage writes `<category>/<slug>.md`. Articles generated through this UI therefore appear in the library only once the lookup and the writer agree on a layout.
- There is no authentication. The dev server is meant for localhost use with your own credentials.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and the "Web Application" section of [docs/architecture.md](../../docs/architecture.md#web-application) for the streaming and path-resolution design.

## License

[MIT](../../LICENSE)
