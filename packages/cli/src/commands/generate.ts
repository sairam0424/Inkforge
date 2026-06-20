import { readFileSync, existsSync, watch, statSync, readdirSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import type { Command } from "commander";
import {
  generate,
  GenerationRequestSchema,
  buildNoteIndex,
  buildEnrichmentContext,
  isConfigured,
} from "@inkforge/core";
import type { GenerationProgress } from "@inkforge/core";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate an article from notes, a topic, or code")
    .option("--input <file>", "Path to a markdown notes file (notes mode)")
    .option("--topic <text>", "Topic string or question (topic mode)")
    .option("--code <file>", "Path to a code file or directory (code mode)")
    .option("--tone <tone>", "beginner | intermediate | senior", "intermediate")
    .option("--format <format>", "tutorial | narrative | explainer | opinion | showcase", "tutorial")
    .option("--length <length>", "thread | short | medium | comprehensive", "medium")
    .option("--mode <mode>", "oneshot | interactive | iterative", "oneshot")
    .option("--title <title>", "Override article title")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--platforms <platforms>", "Comma-separated platforms: devto,hashnode", "")
    .option("--category <category>", "system-design | typescript | react | ai-engineering | career | general", "general")
    .option("--date <date>", "Publication date (YYYY-MM-DD), defaults to today")
    .option("--watch", "Watch --input file and regenerate on every save")
    .action(async (opts) => {
      const chalk = (await import("chalk")).default;
      const ora = (await import("ora")).default;

      if (!isConfigured()) {
        console.error(chalk.red("✗ LLM not configured. Set BEDROCK_ACCESS_KEY_ID/BEDROCK_SECRET_ACCESS_KEY or ANTHROPIC_API_KEY."));
        process.exit(1);
      }

      if (opts.watch && !opts.input) {
        console.error(chalk.red("✗ --watch requires --input <file>"));
        process.exit(1);
      }

      // Determine input type and content
      let inputType: "notes" | "topic" | "code" = "topic";
      let content = "";
      const filePaths: string[] = [];

      if (opts.input) {
        const inputPath = resolve(opts.input);
        if (!existsSync(inputPath)) {
          console.error(chalk.red(`✗ Input file not found: ${inputPath}`));
          process.exit(1);
        }
        content = readFileSync(inputPath, "utf-8");
        inputType = "notes";
      } else if (opts.topic) {
        content = opts.topic;
        inputType = "topic";
      } else if (opts.code) {
        const codePath = resolve(opts.code);
        if (!existsSync(codePath)) {
          console.error(chalk.red(`✗ Code path not found: ${codePath}`));
          process.exit(1);
        }
        const stat = statSync(codePath);
        if (stat.isDirectory()) {
          // Collect up to 10 source files from the directory (skip node_modules/dist)
          const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".turbo", ".git"]);
          const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs"]);
          const collected: string[] = [];
          const walk = (dir: string) => {
            if (collected.length >= 10) return;
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
              if (collected.length >= 10) break;
              if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
                walk(join(dir, entry.name));
              } else if (entry.isFile() && CODE_EXTS.has(extname(entry.name))) {
                collected.push(join(dir, entry.name));
              }
            }
          };
          walk(codePath);
          if (!collected.length) {
            console.error(chalk.red(`✗ No source files found in: ${codePath}`));
            process.exit(1);
          }
          content = collected
            .map((f) => `// File: ${f}\n${readFileSync(f, "utf-8")}`)
            .join("\n\n");
          filePaths.push(...collected);
        } else {
          content = readFileSync(codePath, "utf-8");
          filePaths.push(codePath);
        }
        inputType = "code";
      } else {
        console.error(chalk.red("✗ Provide one of --input, --topic, or --code"));
        process.exit(1);
      }

      const platforms = opts.platforms
        ? opts.platforms.split(",").map((p: string) => p.trim()).filter((p: string) => ["devto", "hashnode"].includes(p))
        : [];

      const runGeneration = async (currentContent: string) => {
        const requestResult = GenerationRequestSchema.safeParse({
          inputType,
          content: currentContent,
          filePaths: filePaths.length ? filePaths : undefined,
          params: {
            tone: opts.tone,
            format: opts.format,
            length: opts.length,
            mode: opts.mode,
          },
          title: opts.title,
          tags: opts.tags ? opts.tags.split(",").map((t: string) => t.trim()) : [],
          platforms,
          category: opts.category ?? "general",
        });

        if (!requestResult.success) {
          console.error(chalk.red("✗ Invalid options:"), requestResult.error.flatten().fieldErrors);
          return;
        }

        const request = requestResult.data;

        // RAG enrichment for notes mode
        let enrichmentContext: string | undefined;
        if (inputType === "notes") {
          const spinner = ora({ text: "Indexing knowledge base…", color: "cyan" }).start();
          try {
            const { ingest } = await import("@inkforge/core");
            const normalised = (ingest as (r: typeof request) => ReturnType<typeof ingest>)(request);
            const index = buildNoteIndex();
            enrichmentContext = buildEnrichmentContext(normalised, index);
            spinner.succeed(`Knowledge base indexed (${index.size} chunks)`);
          } catch {
            spinner.warn("Knowledge base indexing skipped");
          }
        }

        let spinner = ora({ color: "cyan" }).start();
        const stageLabels: Record<GenerationProgress["stage"], string> = {
          ingest: chalk.cyan("Ingesting input…"),
          outline: chalk.cyan("Generating outline…"),
          draft: chalk.cyan("Drafting sections…"),
          polish: chalk.cyan("Polishing…"),
          emit: chalk.cyan("Writing files…"),
        };

        try {
          const result = await generate(request, {
            enrichmentContext,
            date: opts.date,
            onProgress: (progress) => {
              const label = stageLabels[progress.stage];
              const detail = progress.detail ? chalk.dim(` [${progress.detail}]`) : "";
              spinner.text = label + detail;
              if (progress.stage === "emit") spinner = ora({ color: "green" }).start();
            },
          });

          spinner.succeed(chalk.green("Article generated!"));

          const { emitResult, outline } = result;

          console.log("\n" + chalk.bold("━".repeat(56)));
          console.log(chalk.bold.white(outline.title));
          console.log(chalk.dim(`Slug: ${emitResult.slug}`));
          console.log(chalk.dim(`Category: ${opts.category ?? "general"} · Words: ${emitResult.wordCount} · Read: ${emitResult.readingTime} min`));
          console.log(chalk.dim(`Tags: ${outline.tags.join(", ")}`));
          console.log("\n" + chalk.green("Files written:"));
          console.log("  " + chalk.underline(emitResult.primaryPath));
          if (emitResult.anvilryPath) {
            console.log("  " + chalk.underline(emitResult.anvilryPath) + chalk.dim(" (Anvilry mirror)"));
          }

          if (platforms.length) {
            console.log(chalk.dim(`\nPublish targets queued: ${platforms.join(", ")}`));
            console.log(chalk.dim(`Run: inkforge publish --slug ${emitResult.slug} --platform ${platforms.join(" ")}`));
          }

          console.log(chalk.bold("━".repeat(56)) + "\n");

          if (opts.watch) {
            console.log(chalk.dim(`Watching ${resolve(opts.input)} for changes… (Ctrl+C to stop)\n`));
          }
        } catch (err) {
          spinner.fail(chalk.red("Generation failed"));
          console.error(chalk.red(err instanceof Error ? err.message : String(err)));
          if (opts.watch) {
            console.log(chalk.dim("Watching for next save…\n"));
          }
        }
      };

      // Run once immediately
      await runGeneration(content);

      if (!opts.watch) return;

      // Watch mode — debounce file saves, re-read and regenerate
      const inputPath = resolve(opts.input);
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let isGenerating = false;

      watch(inputPath, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          if (isGenerating) {
            console.log(chalk.dim("Generation in progress — skipping save…"));
            return;
          }
          isGenerating = true;
          console.log(chalk.cyan(`\n↻  File changed — regenerating…`));
          const updated = readFileSync(inputPath, "utf-8");
          await runGeneration(updated);
          isGenerating = false;
        }, 500);
      });

      // Keep process alive
      process.stdin.resume();
      process.on("SIGINT", () => {
        console.log(chalk.dim("\nWatch mode stopped."));
        process.exit(0);
      });
    });
}
