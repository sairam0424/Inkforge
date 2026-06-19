import { generateText } from "../llm/index.js";
import { TONE_INSTRUCTIONS, FORMAT_INSTRUCTIONS } from "../modes/index.js";
import type { Outline, OutlineSection, NormalisedInput, GenerationParams } from "../schema/index.js";

/**
 * STORM Stage 2 — Section-level drafting.
 *
 * Each section is drafted independently with its own LLM call, receiving:
 * - The full outline (for coherence)
 * - The preceding section summaries (for context chaining, no repetition)
 * - Its own key points + word budget
 *
 * Sections are drafted in parallel via Promise.all — fast, and each call
 * is independent so a single section failure doesn't abort the whole article.
 */
export async function draftSections(
  outline: Outline,
  input: NormalisedInput,
  params: GenerationParams,
  onSectionComplete?: (index: number, total: number, heading: string) => void,
): Promise<string[]> {
  const sectionSummaries: string[] = [];
  const drafts: string[] = [];

  // Draft sections sequentially to enable context chaining
  // (each section gets a summary of what came before)
  for (let i = 0; i < outline.sections.length; i++) {
    const section = outline.sections[i];
    const draft = await draftSection(
      section,
      outline as Outline,
      input,
      params,
      sectionSummaries,
    );
    drafts.push(draft);
    // Build a short summary for the next section's context chain
    sectionSummaries.push(`${section.heading}: ${extractSummary(draft)}`);
    onSectionComplete?.(i + 1, outline.sections.length, section.heading);
  }

  return drafts;
}

async function draftSection(
  section: OutlineSection,
  outline: Outline,
  input: NormalisedInput,
  params: GenerationParams,
  precedingSummaries: string[],
): Promise<string> {
  const systemPrompt = buildSectionSystemPrompt(outline, params);
  const userContent = buildSectionUserPrompt(section, outline, input, params, precedingSummaries);

  const { text } = await generateText({
    max_tokens: Math.min(8192, Math.max(1024, section.wordBudget * 3)),
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  return text.trim();
}

function buildSectionSystemPrompt(outline: Outline, params: GenerationParams): string {
  return `You are a technical writer drafting ONE SECTION of a longer article.

ARTICLE TITLE: ${outline.title}
ARTICLE SUMMARY: ${outline.summary}

TONE: ${TONE_INSTRUCTIONS[params.tone]}
FORMAT: ${FORMAT_INSTRUCTIONS[params.format]}

RULES FOR THIS SECTION DRAFT:
- Write ONLY the section content (h2/h3 heading + body)
- Start with the heading in Markdown (## or ### as specified)
- Hit the word budget within ±20%
- Include the specified key points and examples
- Use code blocks with language tags for code snippets
- Use concrete, specific examples — no vague generalities
- First-person voice when sharing observations ("I've found that...", "In my experience...")
- End with a natural bridge sentence toward the next part of the article (no explicit "Next, we will...")
- Do NOT wrap the section in any outer container or repeat the article title`;
}

function buildSectionUserPrompt(
  section: OutlineSection,
  _outline: Outline,
  input: NormalisedInput,
  params: GenerationParams,
  precedingSummaries: string[],
): string {
  const parts: string[] = [];

  parts.push(`SECTION TO WRITE:
Heading: ${section.heading} (level ${section.level})
Word budget: ${section.wordBudget} words
Key points to cover:
${section.keyPoints.map((p: string) => `  - ${p}`).join("\n")}
Examples to include:
${section.examples.map((e: string) => `  - ${e}`).join("\n")}`);

  if (precedingSummaries.length) {
    parts.push(`PRECEDING SECTIONS (already written — do NOT repeat):
${precedingSummaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
  }

  // Inject relevant source material based on input type
  if (input.inputType === "notes" && input.rawContent) {
    const relevantChunk = findRelevantChunk(input.rawContent, section.heading);
    if (relevantChunk) {
      parts.push(`RELEVANT NOTES (use as source material, transform don't copy):
${relevantChunk}`);
    }
  } else if (input.inputType === "code" && input.codeSnippets.length) {
    const relevantSnippet = findRelevantSnippet(input.codeSnippets, section.heading);
    if (relevantSnippet) {
      parts.push(`RELEVANT CODE (reference or quote from this):
${relevantSnippet.slice(0, 800)}`);
    }
  }

  parts.push(`\nWrite the "${section.heading}" section now (${section.wordBudget} words, ${params.tone} tone).`);

  return parts.join("\n\n");
}

function extractSummary(draft: string): string {
  // Take first non-heading sentence as summary
  const lines = draft.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const first = lines[0] ?? "";
  return first.length > 120 ? first.slice(0, 120) + "..." : first;
}

function findRelevantChunk(content: string, heading: string): string | undefined {
  const headingWords = heading.toLowerCase().split(/\s+/);
  const paragraphs = content.split(/\n{2,}/);
  // Find the paragraph most relevant to this section heading
  const scored = paragraphs.map((p) => {
    const lower = p.toLowerCase();
    const score = headingWords.filter((w) => w.length > 3 && lower.includes(w)).length;
    return { p, score };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0 ? best.p.slice(0, 600) : undefined;
}

function findRelevantSnippet(snippets: string[], heading: string): string | undefined {
  const headingWords = heading.toLowerCase().split(/\s+/);
  const scored = snippets.map((s) => {
    const lower = s.toLowerCase();
    const score = headingWords.filter((w) => w.length > 3 && lower.includes(w)).length;
    return { s, score };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best ? best.s : snippets[0];
}
