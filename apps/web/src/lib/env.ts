import { resolve } from "node:path";
import { existsSync } from "node:fs";

// process.cwd() when Next.js dev/build runs is the project root (apps/web/).
// ../../ from apps/web/ lands at Inkforge/ — the monorepo root where content/ lives.
const REPO_ROOT = resolve(process.cwd(), "../..");

export function contentDir(): string {
  return resolve(REPO_ROOT, process.env.INKFORGE_CONTENT_DIR ?? "content/articles");
}

export function anvilryNotesDir(): string | null {
  const d = process.env.INKFORGE_ANVILRY_NOTES_DIR;
  return d ? resolve(REPO_ROOT, d) : null;
}

export function isLlmConfigured(): boolean {
  const provider = process.env.LLM_PROVIDER ?? "bedrock";
  if (provider === "bedrock") {
    return !!(process.env.BEDROCK_ACCESS_KEY_ID && process.env.BEDROCK_SECRET_ACCESS_KEY);
  }
  return !!process.env.ANTHROPIC_API_KEY;
}

export function canonicalBase(): string {
  return process.env.INKFORGE_CANONICAL_BASE ?? "https://sairam.dev/notes";
}

export function contentDirExists(): boolean {
  return existsSync(contentDir());
}
