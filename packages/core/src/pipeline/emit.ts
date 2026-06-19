import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { computeReadingTime } from "../modes/index.js";
import type { Outline, GenerationParams, ArticleOutput, EmitResult, Platform, Category } from "../schema/index.js";

// Resolve output paths relative to wherever the CLI is invoked from (process.cwd()),
// NOT relative to this compiled file's location. This means INKFORGE_CONTENT_DIR=content/articles
// resolves to <cwd>/content/articles — predictable regardless of package structure.
const CWD = process.cwd();

/**
 * Serialise ArticleOutput to MDX frontmatter + body and write to both sinks.
 *
 * Primary sink:  INKFORGE_CONTENT_DIR (defaults to ../../content/articles/)
 * Anvilry sink:  INKFORGE_ANVILRY_NOTES_DIR (optional, skipped if not set)
 */
export function emit(
  polishedBody: string,
  outline: Outline,
  params: GenerationParams,
  platforms: Platform[],
  date: string,
  category: Category = "general",
  rawInput?: string,        // original notes/topic/code that produced this article
): EmitResult {
  const wordCount = countWords(polishedBody);
  const readingTime = computeReadingTime(wordCount);

  // Strip the leading `# Title` from the body (it's in the frontmatter)
  const bodyWithoutTitle = polishedBody.replace(/^#\s+.+\n/, "").trim();

  const article: ArticleOutput = {
    slug: outline.slug,
    title: outline.title,
    summary: outline.summary,
    date,
    tags: outline.tags,
    readingTime,
    wordCount,
    tone: params.tone,
    format: params.format,
    length: params.length,
    category,
    platforms,
    body: bodyWithoutTitle,
  };

  const mdx = buildMdx(article);
  // Primary sink uses .md — plain markdown, publishable anywhere without MDX tooling.
  // Anvilry mirror keeps .mdx since Velite requires it.
  const filename = `${outline.slug}.md`;
  const anvilryFilename = `${outline.slug}.mdx`;

  // Primary sink — articles go into content/articles/<category>/<slug>.mdx
  const baseContentDir = resolve(CWD, process.env.INKFORGE_CONTENT_DIR ?? "content/articles");
  const primaryDir = resolve(baseContentDir, category);
  ensureDir(primaryDir);
  const primaryPath = resolve(primaryDir, filename);
  writeFileSync(primaryPath, mdx, "utf-8");

  // Input source sink — save raw input to content/inputs/<category>/<slug>.md
  // This ensures the original notes are never lost and can be regenerated.
  if (rawInput) {
    const inputsBase = baseContentDir.replace(/articles$/, "inputs");
    const inputDir = resolve(inputsBase, category);
    ensureDir(inputDir);
    writeFileSync(resolve(inputDir, `${outline.slug}.md`), rawInput, "utf-8");
  }

  // Anvilry mirror sink (optional)
  let anvilryPath: string | undefined;
  const anvilryDir = process.env.INKFORGE_ANVILRY_NOTES_DIR;
  if (anvilryDir) {
    const absAnvilryDir = resolve(CWD, anvilryDir);
    if (existsSync(absAnvilryDir)) {
      ensureDir(absAnvilryDir);
      anvilryPath = resolve(absAnvilryDir, anvilryFilename);
      writeFileSync(anvilryPath, mdx, "utf-8");
    }
  }

  return { slug: outline.slug, primaryPath, anvilryPath, wordCount, readingTime };
}

function buildMdx(article: ArticleOutput): string {
  const lines = [
    "---",
    `slug: ${article.slug}`,
    `title: "${escapeFrontmatter(article.title)}"`,
    `date: ${article.date}`,
    `summary: "${escapeFrontmatter(article.summary)}"`,
    `tags: [${article.tags.map((t: string) => `"${t}"`).join(", ")}]`,
    "draft: false",
    `tone: ${article.tone}`,
    `format: ${article.format}`,
    `length: ${article.length}`,
    `category: ${article.category}`,
    `wordCount: ${article.wordCount}`,
    `readingTime: ${article.readingTime}`,
    "generatedBy: inkforge",
    `platforms: [${article.platforms.map((p: string) => `"${p}"`).join(", ")}]`,
    "---",
    "",
    article.body,
  ];
  return lines.join("\n");
}

function escapeFrontmatter(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ");
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function countWords(text: string): number {
  // Strip markdown syntax before counting
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, " ")
    .replace(/#{1,6}\s+/g, " ")
    .replace(/[*_~]/g, "")
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}
