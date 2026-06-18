import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import { chunkMarkdown, type Chunk } from "./chunker.js";

/**
 * In-memory BM25 index over personal knowledge base markdown files.
 *
 * At personal KB scale (< 10MB of notes), an in-memory BM25 index is
 * faster and simpler than a vector DB. No external dependencies needed.
 *
 * BM25 parameters: k1=1.5, b=0.75 (standard TREC defaults)
 */

const BM25_K1 = 1.5;
const BM25_B = 0.75;

export type IndexEntry = Chunk & { filePath: string; id: number };

export class NoteIndex {
  private entries: IndexEntry[] = [];
  private tf: Map<number, Map<string, number>> = new Map();
  private df: Map<string, number> = new Map();
  private avgDocLen = 0;

  index(dirPaths: string[]): void {
    const mdFiles = dirPaths.flatMap(collectMarkdownFiles);
    for (const filePath of mdFiles) {
      try {
        const content = readFileSync(filePath, "utf-8");
        const chunks = chunkMarkdown(content, filePath);
        for (const chunk of chunks) {
          const id = this.entries.length;
          this.entries.push({ ...chunk, filePath, id });
          const terms = tokenise(chunk.content);
          const termFreqs = new Map<string, number>();
          for (const term of terms) {
            termFreqs.set(term, (termFreqs.get(term) ?? 0) + 1);
          }
          this.tf.set(id, termFreqs);
          for (const term of termFreqs.keys()) {
            this.df.set(term, (this.df.get(term) ?? 0) + 1);
          }
        }
      } catch {
        // Skip unreadable files silently
      }
    }
    const totalTokens = Array.from(this.tf.values())
      .reduce((sum, tf) => sum + Array.from(tf.values()).reduce((a, b) => a + b, 0), 0);
    this.avgDocLen = this.entries.length ? totalTokens / this.entries.length : 1;
  }

  search(query: string, topK = 5): IndexEntry[] {
    if (!this.entries.length) return [];
    const queryTerms = tokenise(query);
    const N = this.entries.length;
    const scores: Array<{ id: number; score: number }> = [];

    for (const entry of this.entries) {
      const tf = this.tf.get(entry.id) ?? new Map();
      const docLen = Array.from(tf.values()).reduce((a, b) => a + b, 0);
      let score = 0;
      for (const term of queryTerms) {
        const termTf = tf.get(term) ?? 0;
        if (termTf === 0) continue;
        const df = this.df.get(term) ?? 0;
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
        const tfNorm = (termTf * (BM25_K1 + 1)) / (termTf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / this.avgDocLen)));
        score += idf * tfNorm;
      }
      if (score > 0) scores.push({ id: entry.id, score });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => this.entries[s.id]);
  }

  get size(): number {
    return this.entries.length;
  }
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = resolve(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        files.push(...collectMarkdownFiles(full));
      } else if ([".md", ".mdx"].includes(extname(full))) {
        files.push(full);
      }
    }
  } catch {
    // Skip unreadable dirs
  }
  return files;
}
