import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Command } from "commander";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Publish a generated article to external platforms")
    .requiredOption("--slug <slug>", "Article slug to publish")
    .option("--platform <platforms...>", "Platforms: devto hashnode medium")
    .option("--published", "Publish publicly (default: draft)")
    .option("--category <category>", "Category folder (default: searches all categories)", "")
    .option("--canonical-base <url>", "Canonical URL base", process.env.INKFORGE_CANONICAL_BASE ?? "https://sairam.dev/notes")
    .action(async (opts) => {
      const chalk = (await import("chalk")).default;
      const ora = (await import("ora")).default;

      const CWD = process.cwd();
      const baseContentDir = resolve(CWD, process.env.INKFORGE_CONTENT_DIR ?? "content/articles");

      // Resolve article path — check explicit category first, then scan all category folders
      const mdPath = findArticlePath(baseContentDir, opts.slug, opts.category);

      if (!mdPath) {
        console.error(chalk.red(`✗ Article not found for slug: ${opts.slug}`));
        console.error(chalk.dim(`  Searched in: ${baseContentDir}`));
        console.error(chalk.dim(`  Run: inkforge generate first`));
        process.exit(1);
      }

      const md = readFileSync(mdPath, "utf-8");
      const article = parseFrontmatter(md);
      const platforms: string[] = opts.platform ?? [];

      if (!platforms.length) {
        console.error(chalk.red("✗ Specify at least one --platform devto|hashnode|medium"));
        process.exit(1);
      }

      console.log(chalk.dim(`Publishing "${article["title"]}" (${opts.published ? "live" : "draft"})\n`));

      const { resolvePublisher } = await import("@inkforge/core/publishers/registry");

      for (const platform of platforms) {
        const spinner = ora(`Publishing to ${platform}…`).start();
        try {
          const { modulePath, exportName } = resolvePublisher(platform);
          const mod = (await import(modulePath)) as Record<
            string,
            (article: unknown, opts: unknown) => Promise<{ url: string }>
          >;
          const publishFn = mod[exportName];
          const result = await publishFn(article, {
            published: opts.published ?? false,
            canonicalBase: opts.canonicalBase,
          });
          spinner.succeed(chalk.green(`${platform}: ${result.url}`));
        } catch (err) {
          spinner.fail(chalk.red(`${platform}: ${err instanceof Error ? err.message : String(err)}`));
        }
      }
    });
}

function findArticlePath(baseDir: string, slug: string, category: string): string | undefined {

  // Direct path: baseDir/<category>/<slug>.md
  if (category) {
    const direct = resolve(baseDir, category, `${slug}.md`);
    if (existsSync(direct)) return direct;
  }

  // Flat path: baseDir/<slug>.md (legacy)
  const flat = resolve(baseDir, `${slug}.md`);
  if (existsSync(flat)) return flat;

  // Scan all category subdirectories
  if (!existsSync(baseDir)) return undefined;
  for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = resolve(baseDir, entry.name, `${slug}.md`);
    if (existsSync(candidate)) return candidate;
    // Also check <category>/<slug>/index.md
    const index = resolve(baseDir, entry.name, slug, "index.md");
    if (existsSync(index)) return index;
  }

  return undefined;
}

function parseFrontmatter(md: string): Record<string, unknown> {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result: Record<string, unknown> = {};
  for (const line of yaml.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const raw = line.slice(colonIdx + 1).trim();
    // Parse inline arrays: ["a", "b", "c"] or [a, b, c]
    if (raw.startsWith("[") && raw.endsWith("]")) {
      result[key] = raw
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^"(.*)"$/, "$1"))
        .filter(Boolean);
    } else {
      result[key] = raw.replace(/^"(.*)"$/, "$1");
    }
  }
  result["body"] = md.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  return result;
}
