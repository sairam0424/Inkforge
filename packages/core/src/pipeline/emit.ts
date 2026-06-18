import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeReadingTime } from "../modes/index.js";
import type { Outline, GenerationParams, ArticleOutput, EmitResult, Platform } from "../schema/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// packages/core/src/pipeline/ → packages/core/
const PACKAGE_ROOT = resolve(__dirname, "../../..");

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
    platforms,
    body: bodyWithoutTitle,
  };

  const mdx = buildMdx(article);
  const filename = `${outline.slug}.mdx`;

  // Primary sink
  const primaryDir = resolve(
    PACKAGE_ROOT,
    process.env.INKFORGE_CONTENT_DIR ?? "../../content/articles",
  );
  ensureDir(primaryDir);
  const primaryPath = resolve(primaryDir, filename);
  writeFileSync(primaryPath, mdx, "utf-8");

  // Anvilry mirror sink (optional)
  let anvilryPath: string | undefined;
  const anvilryDir = process.env.INKFORGE_ANVILRY_NOTES_DIR;
  if (anvilryDir) {
    const absAnvilryDir = resolve(PACKAGE_ROOT, anvilryDir);
    if (existsSync(absAnvilryDir)) {
      ensureDir(absAnvilryDir);
      anvilryPath = resolve(absAnvilryDir, filename);
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
