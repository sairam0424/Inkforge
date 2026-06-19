import { z } from "zod";

export const ToneSchema = z.enum(["beginner", "intermediate", "senior"]);
export const FormatSchema = z.enum(["tutorial", "narrative", "explainer", "opinion", "showcase"]);
export const LengthSchema = z.enum(["thread", "short", "medium", "comprehensive"]);
export const ModeSchema = z.enum(["oneshot", "interactive", "iterative"]);
export const InputTypeSchema = z.enum(["notes", "topic", "code"]);
export const PlatformSchema = z.enum(["devto", "hashnode"]);

export const GenerationParamsSchema = z.object({
  tone: ToneSchema.default("intermediate"),
  format: FormatSchema.default("tutorial"),
  length: LengthSchema.default("medium"),
  mode: ModeSchema.default("oneshot"),
});

export const CategorySchema = z.enum([
  "system-design",
  "typescript",
  "react",
  "ai-engineering",
  "career",
  "general",
]);

export const GenerationRequestSchema = z.object({
  inputType: InputTypeSchema,
  content: z.string().min(1, "Content cannot be empty"),
  filePaths: z.array(z.string()).optional(),
  params: GenerationParamsSchema,
  title: z.string().optional(),
  tags: z.array(z.string()).default([]),
  platforms: z.array(PlatformSchema).default([]),
  category: CategorySchema.default("general"),
});

export const OutlineSectionSchema = z.object({
  heading: z.string(),
  level: z.union([z.literal(2), z.literal(3)]),
  keyPoints: z.array(z.string()),
  wordBudget: z.number().int().positive(),
  examples: z.array(z.string()).default([]),
});

export const OutlineSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(OutlineSectionSchema),
  totalWordBudget: z.number().int().positive(),
  slug: z.string(),
  tags: z.array(z.string()),
});

export const ArticleOutputSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  date: z.string(),
  tags: z.array(z.string()),
  readingTime: z.number(),
  wordCount: z.number(),
  tone: ToneSchema,
  format: FormatSchema,
  length: LengthSchema,
  category: CategorySchema,
  platforms: z.array(PlatformSchema),
  body: z.string(),
});

export const EmitResultSchema = z.object({
  slug: z.string(),
  primaryPath: z.string(),
  anvilryPath: z.string().optional(),
  wordCount: z.number(),
  readingTime: z.number(),
});

export const NormalisedInputSchema = z.object({
  rawContent: z.string(),
  inputType: InputTypeSchema,
  extractedTitle: z.string().optional(),
  extractedTags: z.array(z.string()).default([]),
  codeSnippets: z.array(z.string()).default([]),
  headings: z.array(z.string()).default([]),
});

export type Tone = z.infer<typeof ToneSchema>;
export type Format = z.infer<typeof FormatSchema>;
export type Length = z.infer<typeof LengthSchema>;
export type Mode = z.infer<typeof ModeSchema>;
export type InputType = z.infer<typeof InputTypeSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type GenerationParams = z.infer<typeof GenerationParamsSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type OutlineSection = z.infer<typeof OutlineSectionSchema>;
export type Outline = z.infer<typeof OutlineSchema>;
export type ArticleOutput = z.infer<typeof ArticleOutputSchema>;
export type EmitResult = z.infer<typeof EmitResultSchema>;
export type NormalisedInput = z.infer<typeof NormalisedInputSchema>;
