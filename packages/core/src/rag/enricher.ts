import { NoteIndex } from "./indexer.js";
import type { NormalisedInput } from "../schema/index.js";

/**
 * Enrich notes-dump inputs by retrieving related context from the
 * personal knowledge base index.
 *
 * Top-5 BM25 hits are assembled into a context block that gets injected
 * into the outline stage prompt — the same pattern as claude-obsidian's
 * two-layer hot→index→page retrieval (3-0 adversarial vote).
 */
export function buildEnrichmentContext(
  input: NormalisedInput,
  index: NoteIndex,
): string | undefined {
  if (index.size === 0) return undefined;
  if (input.inputType === "topic" && input.rawContent.length < 20) return undefined;

  const query = [
    input.extractedTitle ?? "",
    input.rawContent.slice(0, 300),
    ...(input.extractedTags ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const hits = index.search(query, 5);
  if (!hits.length) return undefined;

  return hits
    .map((h, i) => `[${i + 1}] (from ${h.headingContext})\n${h.content.slice(0, 400)}`)
    .join("\n\n---\n\n");
}

/** Build a shared index from env-configured note directories */
export function buildNoteIndex(): NoteIndex {
  const dirs: string[] = [];

  const contentDir = process.env.INKFORGE_CONTENT_DIR;
  if (contentDir) dirs.push(contentDir);

  const extraDirs = process.env.INKFORGE_NOTES_DIRS;
  if (extraDirs) dirs.push(...extraDirs.split(":").filter(Boolean));

  const index = new NoteIndex();
  if (dirs.length) index.index(dirs);
  return index;
}
