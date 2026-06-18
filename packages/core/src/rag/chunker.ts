/**
 * Hierarchical Markdown chunker.
 *
 * Strategy (adapted from PKB's verified pattern — PKB github.com/dlants/pkb, 3-0 adversarial vote):
 * 1. Hard splits on h1-h6 headings (always split here)
 * 2. Soft splits on paragraphs/code blocks when chunk exceeds TARGET_SIZE
 * 3. Each chunk carries its full heading-hierarchy context string
 */

export const TARGET_CHUNK_SIZE = 2000; // chars (matches PKB's verified TARGET_CHUNK_SIZE)
const CHARACTER_SPLIT_OVERLAP = 200;

export type Chunk = {
  content: string;
  headingContext: string; // e.g. "# Guide > ## Installation > ### macOS"
  startLine: number;
};

export function chunkMarkdown(markdown: string, filePath?: string): Chunk[] {
  const lines = markdown.split("\n");
  const chunks: Chunk[] = [];
  const headingStack: string[] = [];
  let currentLines: string[] = [];
  let startLine = 0;

  function flush(lineIndex: number): void {
    const content = currentLines.join("\n").trim();
    if (content.length > 0) {
      const headingContext = headingStack.join(" > ") || (filePath ?? "root");
      chunks.push(...splitLargeChunk({ content, headingContext, startLine }));
    }
    currentLines = [];
    startLine = lineIndex + 1;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flush(i);
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      // Maintain heading stack at this level
      headingStack.splice(level - 1);
      headingStack[level - 1] = `${"#".repeat(level)} ${title}`;
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  flush(lines.length);

  return chunks;
}

function splitLargeChunk(chunk: Chunk): Chunk[] {
  if (chunk.content.length <= TARGET_CHUNK_SIZE) return [chunk];

  const paragraphs = chunk.content.split(/\n{2,}/);
  const result: Chunk[] = [];
  let current = "";
  let lineOffset = chunk.startLine;

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > TARGET_CHUNK_SIZE && current) {
      result.push({ content: current.trim(), headingContext: chunk.headingContext, startLine: lineOffset });
      // Overlap: keep last CHARACTER_SPLIT_OVERLAP chars of previous chunk
      current = current.slice(-CHARACTER_SPLIT_OVERLAP) + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
    lineOffset += para.split("\n").length + 1;
  }
  if (current.trim()) {
    result.push({ content: current.trim(), headingContext: chunk.headingContext, startLine: lineOffset });
  }

  return result.length > 0 ? result : [chunk];
}
