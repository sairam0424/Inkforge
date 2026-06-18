import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Command } from "commander";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Publish a generated article to external platforms")
    .requiredOption("--slug <slug>", "Article slug to publish")
    .option("--platform <platforms...>", "Platforms: devto hashnode")
    .option("--published", "Publish publicly (default: draft)")
    .option("--canonical-base <url>", "Canonical URL base", process.env.INKFORGE_CANONICAL_BASE ?? "https://sairam.dev/notes")
    .action(async (opts) => {
      const chalk = (await import("chalk")).default;
      const ora = (await import("ora")).default;

      const contentDir = process.env.INKFORGE_CONTENT_DIR ?? "../../content/articles";
      const mdxPath = resolve(contentDir, `${opts.slug}.mdx`);

      if (!existsSync(mdxPath)) {
        console.error(chalk.red(`✗ Article not found: ${mdxPath}`));
        console.error(chalk.dim(`  Run: inkforge generate first`));
        process.exit(1);
      }

      const mdx = readFileSync(mdxPath, "utf-8");
      const article = parseMdxFrontmatter(mdx);
      const platforms: string[] = opts.platform ?? [];

      if (!platforms.length) {
        console.error(chalk.red("✗ Specify at least one --platform devto|hashnode"));
        process.exit(1);
      }

      for (const platform of platforms) {
        const spinner = ora(`Publishing to ${platform}…`).start();
        try {
          if (platform === "devto") {
            const { publishToDevto } = await import("@inkforge/core/publishers/devto");
            const result = await publishToDevto(article as Parameters<typeof publishToDevto>[0], {
              published: opts.published ?? false,
              canonicalBase: opts.canonicalBase,
            });
            spinner.succeed(chalk.green(`Dev.to: ${result.url}`));
          } else if (platform === "hashnode") {
            const { publishToHashnode } = await import("@inkforge/core/publishers/hashnode");
            const result = await publishToHashnode(article as Parameters<typeof publishToHashnode>[0], {
              published: opts.published ?? false,
              canonicalBase: opts.canonicalBase,
            });
            spinner.succeed(chalk.green(`Hashnode: ${result.url}`));
          } else {
            spinner.fail(chalk.yellow(`Unknown platform: ${platform}`));
          }
        } catch (err) {
          spinner.fail(chalk.red(`${platform}: ${String(err)}`));
        }
      }
    });
}

function parseMdxFrontmatter(mdx: string): Record<string, unknown> {
  const match = mdx.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result: Record<string, unknown> = {};
  for (const line of yaml.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const raw = line.slice(colonIdx + 1).trim();
    result[key] = raw.replace(/^"(.*)"$/, "$1");
  }
  // Extract body (everything after frontmatter)
  result["body"] = mdx.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  return result;
}
