import type { Length, Format, Tone } from "../schema/index.js";

/** Word budget per length mode */
export const WORD_BUDGETS: Record<Length, number> = {
  thread: 300,
  short: 800,
  medium: 1800,
  comprehensive: 3500,
};

/** Reading speed: 265 wpm average */
export function computeReadingTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 265));
}

/** Tone instruction injected into every generation prompt */
export const TONE_INSTRUCTIONS: Record<Tone, string> = {
  beginner:
    "Write for someone who is new to this topic. Explain every concept from first principles. Avoid jargon without definition. Use concrete everyday analogies. Short sentences. Friendly, encouraging tone.",
  intermediate:
    "Write for a practising developer who knows the basics. Assume familiarity with standard tooling. Focus on the WHY behind decisions. Include trade-offs. Conversational but precise.",
  senior:
    "Write for an experienced engineer. Skip introductory scaffolding. Lead with architecture and trade-offs. Use precise technical language. Include edge cases, failure modes, and production considerations. Peer-to-peer tone.",
};

/** Format-specific structural instructions */
export const FORMAT_INSTRUCTIONS: Record<Format, string> = {
  tutorial:
    "Structure as a hands-on tutorial: Problem statement → Prerequisites → Step-by-step implementation (numbered) → Code snippets at each step → Common mistakes → What you built summary.",
  narrative:
    "Structure as a personal engineering narrative: The situation I was in → The problem I hit → What I tried (including failures) → The insight or solution → What I learned. First-person voice.",
  explainer:
    "Structure as a concept explainer: Hook with a surprising or counterintuitive insight → Core concept definition → How it works (with diagram description if useful) → Real-world use cases → Key takeaways.",
  opinion:
    "Structure as an opinionated take: Bold thesis statement in the first sentence → 3 supporting arguments (each with evidence or example) → Strongest counterargument steelmanned → Why you still hold your position → Call to action or question for readers.",
  showcase:
    "Structure as a project showcase: What it does and why it exists → The technical problem it solves → Architecture overview → Key implementation decisions and trade-offs → Results/metrics → Links and next steps.",
};

/** Length-to-section-count heuristics */
export const SECTION_COUNTS: Record<Length, { min: number; max: number }> = {
  thread: { min: 2, max: 3 },
  short: { min: 3, max: 4 },
  medium: { min: 4, max: 6 },
  comprehensive: { min: 6, max: 9 },
};
