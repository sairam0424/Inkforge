import { generateText } from "../llm/index.js";
import { TONE_INSTRUCTIONS } from "../modes/index.js";
import type { Outline, GenerationParams } from "../schema/index.js";

/**
 * Humanisation pass — takes the assembled draft and runs a single
 * LLM call focused on voice, concreteness, and narrative coherence.
 *
 * This stage targets the signals that distinguish human writing:
 * - Personal voice ("I found that...", "This surprised me...")
 * - Concrete numbers and specifics over vague generalities
 * - Smooth transitions between sections
 * - Varying sentence length (not all medium-length sentences)
 * - A clear problem→journey→solution story arc
 */
export async function polish(
  assembledDraft: string,
  outline: Outline,
  params: GenerationParams,
): Promise<string> {
  const systemPrompt = `You are a technical editor. Your task is to POLISH a draft article to make it read authentically human-written, not AI-generated.

TONE: ${TONE_INSTRUCTIONS[params.tone]}

POLISHING RULES (apply ALL of these):
1. VOICE: Add first-person observations where natural ("I've noticed...", "In practice...", "This bit me once...")
2. CONCRETENESS: Replace vague statements with specific numbers or named examples ("a lot" → "~40%", "popular library" → "Zod or Yup")
3. TRANSITIONS: Ensure each section flows naturally into the next — not jarring cuts
4. SENTENCE VARIETY: Break up runs of similar-length sentences; mix short punchy ones with longer ones
5. STORY ARC: The article should feel like it moves from a problem or question → exploration/journey → insight or solution
6. REMOVE AI TELLS: Delete phrases like "In conclusion,", "It's worth noting that", "This is important because", "In this article, we will", "In summary"
7. OPENING HOOK: Make the first 2 sentences grab attention — a surprising fact, a counterintuitive insight, or a relatable frustration
8. KEEP ALL CODE: Do not modify any code blocks — pass them through unchanged
9. PRESERVE STRUCTURE: Keep all headings and their hierarchy — do not add or remove sections
10. LENGTH: Final output should be within 10% of the draft word count — edit, don't rewrite from scratch

Output the complete polished article in Markdown. Start with the title as # heading.`;

  const userContent = `ARTICLE TITLE: ${outline.title}

DRAFT TO POLISH:
${assembledDraft}

Polish this draft following all 10 rules above. Output the full polished article.`;

  const { text } = await generateText({
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ] as Parameters<typeof generateText>[0]["system"],
    messages: [{ role: "user", content: userContent }],
  });

  return text.trim();
}

/** Assemble section drafts into a single document with title header */
export function assembleDraft(outline: Outline, sectionDrafts: string[]): string {
  const parts = [`# ${outline.title}\n`];
  for (const draft of sectionDrafts) {
    parts.push(draft);
    parts.push(""); // blank line between sections
  }
  return parts.join("\n");
}
