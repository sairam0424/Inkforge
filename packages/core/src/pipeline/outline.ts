import { generateText } from "../llm/index.js";
import { TONE_INSTRUCTIONS, FORMAT_INSTRUCTIONS, SECTION_COUNTS, WORD_BUDGETS } from "../modes/index.js";
import type { NormalisedInput, GenerationParams, Outline } from "../schema/index.js";
import { OutlineSchema } from "../schema/index.js";

/**
 * STORM Stage 1 — Generate an explicit Outline artifact.
 *
 * The outline is a first-class data structure (not a prompt side-effect):
 * it contains section titles, key points per section, and per-section word budgets.
 * All downstream stages receive the outline as structured input.
 */
export async function generateOutline(
  input: NormalisedInput,
  params: GenerationParams,
  enrichmentContext?: string,
): Promise<Outline> {
  const sectionCount = SECTION_COUNTS[params.length];
  const totalBudget = WORD_BUDGETS[params.length];

  const systemPrompt = `You are an expert technical writer and editor. Your task is to produce a detailed article OUTLINE — not the article itself.

TONE: ${TONE_INSTRUCTIONS[params.tone]}
FORMAT: ${FORMAT_INSTRUCTIONS[params.format]}

Output ONLY valid JSON matching this exact structure (no prose, no markdown fences):
{
  "title": "string — compelling, specific article title",
  "summary": "string — one sentence summary for article preview",
  "slug": "string — lowercase-kebab-case URL slug",
  "tags": ["array", "of", "relevant", "tags"],
  "totalWordBudget": number,
  "sections": [
    {
      "heading": "string",
      "level": 2 or 3,
      "keyPoints": ["point 1", "point 2", "point 3"],
      "wordBudget": number,
      "examples": ["real-world example or analogy to include"]
    }
  ]
}

RULES:
- Produce ${sectionCount.min}–${sectionCount.max} sections
- Total word budget across all sections must sum to ${totalBudget}
- Every section must have 2–5 keyPoints
- Include at least one concrete real-world example per section
- Title must be specific, not generic ("How I Built X" not "Building Things")
- Slug must match the title (lowercase, hyphens, no special chars)
- Tags: 3–6 relevant technical tags`;

  const userContent = buildOutlineUserPrompt(input, params, enrichmentContext);

  const { text } = await generateText({
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  // Parse and validate JSON output
  const parsed = parseOutlineJSON(text);
  return OutlineSchema.parse(parsed);
}

function buildOutlineUserPrompt(
  input: NormalisedInput,
  params: GenerationParams,
  enrichmentContext?: string,
): string {
  const parts: string[] = [];

  if (input.inputType === "topic") {
    parts.push(`TOPIC: ${input.rawContent}`);
    if (input.extractedTitle) parts.push(`PREFERRED TITLE: ${input.extractedTitle}`);
  } else if (input.inputType === "notes") {
    parts.push(`INPUT NOTES:\n${input.rawContent.slice(0, 4000)}`);
    if (input.headings.length) {
      parts.push(`EXISTING HEADINGS (preserve these as anchors):\n${input.headings.join("\n")}`);
    }
  } else if (input.inputType === "code") {
    parts.push(`CODE CONTEXT:\n${input.rawContent.slice(0, 2000)}`);
    if (input.headings.length) {
      parts.push(`KEY FUNCTIONS/EXPORTS:\n${input.headings.join(", ")}`);
    }
    if (input.codeSnippets.length) {
      parts.push(`KEY CODE SNIPPETS (reference these in sections):\n${input.codeSnippets[0].slice(0, 1000)}`);
    }
  }

  if (input.extractedTags.length) {
    parts.push(`SUGGESTED TAGS: ${input.extractedTags.join(", ")}`);
  }

  if (enrichmentContext) {
    parts.push(`RELATED CONTEXT (from knowledge base — use to enrich examples):\n${enrichmentContext}`);
  }

  parts.push(`\nGenerate a ${params.format} article outline in ${params.tone} tone, targeting ${WORD_BUDGETS[params.length]} words.`);

  return parts.join("\n\n");
}

function repairTruncatedJSON(s: string): string {
  // Close any unclosed strings, arrays, and objects so JSON.parse can recover
  // from max_tokens truncation mid-output.
  let repaired = s;
  // If we're inside an unclosed string, close it
  const quoteCount = (repaired.match(/(?<!\\)"/g) ?? []).length;
  if (quoteCount % 2 !== 0) repaired += '"';
  // Count open braces/brackets and close them in reverse order
  const opens: string[] = [];
  for (const ch of repaired) {
    if (ch === "{" || ch === "[") opens.push(ch);
    else if (ch === "}" || ch === "]") opens.pop();
  }
  for (const open of opens.reverse()) {
    repaired += open === "{" ? "}" : "]";
  }
  return repaired;
}

function parseOutlineJSON(raw: string): unknown {
  // Strip any accidental markdown fences the LLM might add despite the prompt
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  // 1. Try verbatim parse
  try {
    return JSON.parse(cleaned);
  } catch { /* try repair */ }
  // 2. Try extracting the outermost JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* try repair */ }
    // 3. Attempt truncation repair on the extracted object
    try { return JSON.parse(repairTruncatedJSON(match[0])); } catch { /* fall through */ }
  }
  throw new Error(`LLM returned invalid JSON for outline (${cleaned.length} chars):\n${raw.slice(0, 300)}`);
}
