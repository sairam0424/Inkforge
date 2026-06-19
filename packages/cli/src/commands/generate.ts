import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
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
    .action(async (opts) => {
      const chalk = (await import("chalk")).default;
      const ora = (await import("ora")).default;

      if (!isConfigured()) {
        console.error(chalk.red("✗ LLM not configured. Set BEDROCK_ACCESS_KEY_ID/BEDROCK_SECRET_ACCESS_KEY or ANTHROPIC_API_KEY."));
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
        content = readFileSync(codePath, "utf-8");
        filePaths.push(codePath);
        inputType = "code";
      } else {
        console.error(chalk.red("✗ Provide one of --input, --topic, or --code"));
        process.exit(1);
      }

      const platforms = opts.platforms
        ? opts.platforms.split(",").map((p: string) => p.trim()).filter((p: string) => ["devto", "hashnode"].includes(p))
        : [];

      const requestResult = GenerationRequestSchema.safeParse({
        inputType,
        content,
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
        process.exit(1);
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

      // Stage spinner
      let spinner = ora({ color: "cyan" }).start();
      const stageLabels: Record<GenerationProgress["stage"], string> = {
        ingest: chalk.cyan("Ingesting input…"),
        outline: chalk.cyan("Generating outline…"),
        draft: chalk.cyan("Drafting sections…"),
        polish: chalk.cyan("Polishing…"),
        emit: chalk.cyan("Writing MDX files…"),
      };

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
    });
}
