// Public API surface for @inkforge/core

// Generation pipeline
export { generate } from "./pipeline/generate.js";
export type { GenerationProgress, GenerationResult } from "./pipeline/generate.js";

// Schema types
export type {
  GenerationRequest,
  GenerationParams,
  ArticleOutput,
  EmitResult,
  Outline,
  NormalisedInput,
  Tone,
  Format,
  Length,
  Mode,
  InputType,
  Platform,
  Category,
} from "./schema/index.js";

export {
  GenerationRequestSchema,
  GenerationParamsSchema,
  CategorySchema,
} from "./schema/index.js";

// LLM utilities (for publisher integrations)
export { generateText, streamText, isConfigured, getProvider } from "./llm/index.js";

// RAG
export { buildNoteIndex, buildEnrichmentContext } from "./rag/enricher.js";
export { NoteIndex } from "./rag/indexer.js";

// Individual pipeline stages (for interactive/iterative modes)
export { ingest } from "./pipeline/ingest.js";
export { generateOutline } from "./pipeline/outline.js";
export { draftSections } from "./pipeline/draft.js";
export { polish, assembleDraft } from "./pipeline/polish.js";
export { emit } from "./pipeline/emit.js";

// Mode constants
export {
  WORD_BUDGETS,
  TONE_INSTRUCTIONS,
  FORMAT_INSTRUCTIONS,
  computeReadingTime,
} from "./modes/index.js";
