import { ingest } from "./ingest.js";
import { generateOutline } from "./outline.js";
import { draftSections } from "./draft.js";
import { polish, assembleDraft } from "./polish.js";
import { emit } from "./emit.js";
import type { GenerationRequest, EmitResult, Outline } from "../schema/index.js";

export type GenerationProgress = {
  stage: "ingest" | "outline" | "draft" | "polish" | "emit";
  detail?: string;
};

export type GenerationResult = {
  emitResult: EmitResult;
  outline: Outline;
};

/**
 * Full one-shot generation pipeline:
 * ingest → outline → draft (per section) → polish → emit
 *
 * onProgress is called at each stage transition for CLI spinner updates.
 */
export async function generate(
  request: GenerationRequest,
  opts?: {
    onProgress?: (progress: GenerationProgress) => void;
    enrichmentContext?: string;
    date?: string;
  },
): Promise<GenerationResult> {
  const { onProgress, enrichmentContext, date = new Date().toISOString().slice(0, 10) } = opts ?? {};

  onProgress?.({ stage: "ingest" });
  const input = ingest(request);

  onProgress?.({ stage: "outline" });
  const outline = await generateOutline(input, request.params, enrichmentContext);

  onProgress?.({ stage: "draft", detail: `0/${outline.sections.length} sections` });
  const sectionDrafts = await draftSections(
    outline,
    input,
    request.params,
    (done, total, heading) => {
      onProgress?.({ stage: "draft", detail: `${done}/${total} — ${heading}` });
    },
  );

  onProgress?.({ stage: "polish" });
  const assembled = assembleDraft(outline, sectionDrafts);
  const polished = await polish(assembled, outline, request.params);

  onProgress?.({ stage: "emit" });
  const emitResult = emit(polished, outline, request.params, request.platforms, date, request.category, request.content);

  return { emitResult, outline };
}
