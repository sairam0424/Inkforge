import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Command } from "commander";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List generated articles with status")
    .action(async () => {
      const chalk = (await import("chalk")).default;
      const contentDir = resolve(process.env.INKFORGE_CONTENT_DIR ?? "../../content/articles");

      if (!existsSync(contentDir)) {
        console.log(chalk.dim("No articles yet. Run: inkforge generate --topic \"...\""));
        return;
      }

      const files = readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));
      if (!files.length) {
        console.log(chalk.dim("No articles yet. Run: inkforge generate --topic \"...\""));
        return;
      }

      console.log("\n" + chalk.bold("Generated Articles") + "\n" + "─".repeat(56));
      for (const file of files) {
        const mdx = readFileSync(resolve(contentDir, file), "utf-8");
        const fm = parseFrontmatter(mdx);
        const slug = String(fm.slug ?? file.replace(".mdx", ""));
        const title = String(fm.title ?? slug);
        const wc = fm.wordCount ? chalk.dim(` ${fm.wordCount}w`) : "";
        const rt = fm.readingTime ? chalk.dim(` ${fm.readingTime}min`) : "";
        const platforms = Array.isArray(fm.platforms) ? fm.platforms.join(",") : String(fm.platforms ?? "");
        const platLabel = platforms ? chalk.cyan(` [${platforms}]`) : "";
        console.log(`  ${chalk.white(title)}${wc}${rt}${platLabel}`);
        console.log(`  ${chalk.dim(slug)}\n`);
      }
    });
}

function parseFrontmatter(mdx: string): Record<string, unknown> {
  const match = mdx.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const raw = line.slice(colonIdx + 1).trim();
    if (raw.startsWith("[")) {
      result[key] = raw.slice(1, -1).split(",").map((s) => s.trim().replace(/^"(.*)"$/, "$1"));
    } else {
      result[key] = raw.replace(/^"(.*)"$/, "$1");
    }
  }
  return result;
}
