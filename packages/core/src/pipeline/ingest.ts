import { readFileSync } from "node:fs";
import type { GenerationRequest, NormalisedInput } from "../schema/index.js";

const HEADING_RE = /^#{1,6}\s+(.+)$/m;
const CODE_FENCE_RE = /```[\s\S]*?```/g;
const FRONTMATTER_RE = /^---[\s\S]*?---\n/;

/**
 * Normalise all three input types into a unified NormalisedInput.
 * This is the first pipeline stage — it produces a stable surface that
 * all downstream stages (outline, draft) operate on.
 */
export function ingest(request: GenerationRequest): NormalisedInput {
  switch (request.inputType) {
    case "notes":
      return ingestNotes(request.content, request.title, request.tags);
    case "topic":
      return ingestTopic(request.content, request.title, request.tags);
    case "code":
      return ingestCode(request.content, request.filePaths ?? [], request.title, request.tags);
  }
}

function ingestNotes(
  raw: string,
  overrideTitle?: string,
  overrideTags?: string[],
): NormalisedInput {
  const withoutFrontmatter = raw.replace(FRONTMATTER_RE, "").trim();
  const headings = extractHeadings(withoutFrontmatter);
  const codeSnippets = extractCodeFences(withoutFrontmatter);
  const extractedTitle = overrideTitle ?? headings[0];
  const extractedTags = overrideTags?.length ? overrideTags : inferTagsFromContent(withoutFrontmatter);

  return {
    rawContent: withoutFrontmatter,
    inputType: "notes",
    extractedTitle,
    extractedTags,
    codeSnippets,
    headings,
  };
}

function ingestTopic(
  topic: string,
  overrideTitle?: string,
  overrideTags?: string[],
): NormalisedInput {
  return {
    rawContent: topic,
    inputType: "topic",
    extractedTitle: overrideTitle ?? topic.split("\n")[0].trim(),
    extractedTags: overrideTags?.length ? overrideTags : inferTagsFromContent(topic),
    codeSnippets: [],
    headings: [],
  };
}

function ingestCode(
  content: string,
  filePaths: string[],
  overrideTitle?: string,
  overrideTags?: string[],
): NormalisedInput {
  // Combine pasted content with optional file reads
  const fileContents = filePaths
    .map((p) => {
      try {
        return `// File: ${p}\n${readFileSync(p, "utf-8")}`;
      } catch {
        return `// File: ${p} (could not read)`;
      }
    })
    .join("\n\n");

  const combined = [content, fileContents].filter(Boolean).join("\n\n");
  const codeSnippets = extractCodeFences(combined);
  // For code-first, also treat raw code blocks as snippets
  if (!codeSnippets.length && combined.trim()) {
    codeSnippets.push(combined.slice(0, 2000));
  }

  const narrativeAnchors = extractNarrativeAnchors(combined);
  const extractedTitle = overrideTitle ?? inferTitleFromCode(filePaths, combined);
  const extractedTags = overrideTags?.length ? overrideTags : inferTagsFromContent(combined);

  return {
    rawContent: combined,
    inputType: "code",
    extractedTitle,
    extractedTags,
    codeSnippets: codeSnippets.slice(0, 5), // cap at 5 snippets
    headings: narrativeAnchors,
  };
}

function extractHeadings(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => HEADING_RE.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, "").trim());
}

function extractCodeFences(content: string): string[] {
  const matches = content.match(CODE_FENCE_RE);
  return matches ?? [];
}

function extractNarrativeAnchors(code: string): string[] {
  const anchors: string[] = [];
  // Exported function names as narrative anchors
  const exportedFns = code.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
  for (const m of exportedFns) anchors.push(m[1]);
  // JSDoc @description or leading comment blocks
  const jsdocDescs = code.matchAll(/@description\s+(.+)/g);
  for (const m of jsdocDescs) anchors.push(m[1].trim());
  return anchors.slice(0, 10);
}

function inferTitleFromCode(filePaths: string[], content: string): string {
  if (filePaths.length) {
    const name = filePaths[0].split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
    return name ? `Deep Dive: ${name}` : "Code Showcase";
  }
  // Try to find a module name in the content
  const match = content.match(/(?:module|package|class)\s+(\w+)/);
  return match ? `Inside ${match[1]}` : "Code Showcase";
}

function inferTagsFromContent(content: string): string[] {
  const lower = content.toLowerCase();
  const candidates: [string, string[]][] = [
    ["typescript", ["typescript", " ts ", ".ts", "interface ", "type "]],
    ["javascript", ["javascript", " js ", ".js", "const ", "let ", "async "]],
    ["python", ["python", "def ", "import ", ".py", "fastapi", "django"]],
    ["react", ["react", "jsx", "tsx", "usestate", "useeffect", "component"]],
    ["nextjs", ["next.js", "nextjs", "app router", "pages router", "vercel"]],
    ["ai", ["llm", "openai", "anthropic", "claude", "gpt", "embedding", "rag"]],
    ["distributed-systems", ["distributed", "consensus", "raft", "paxos", "eventual consistency"]],
    ["database", ["database", "sql", "postgres", "mysql", "mongodb", "redis"]],
    ["devops", ["docker", "kubernetes", "ci/cd", "github actions", "deploy"]],
    ["architecture", ["microservice", "monolith", "event-driven", "cqrs", "ddd"]],
  ];

  return candidates
    .filter(([, signals]) => signals.some((s) => lower.includes(s)))
    .map(([tag]) => tag)
    .slice(0, 5);
}
