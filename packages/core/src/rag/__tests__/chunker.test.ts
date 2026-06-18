import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "../chunker.js";

describe("chunkMarkdown", () => {
  it("produces one chunk for short content", () => {
    const chunks = chunkMarkdown("# Hello\n\nShort content.");
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].content).toContain("Hello");
  });

  it("preserves heading context in each chunk", () => {
    const md = `# Guide\n\nIntro.\n\n## Installation\n\nInstall steps.\n\n### macOS\n\nMac steps.`;
    const chunks = chunkMarkdown(md);
    const macChunk = chunks.find((c) => c.content.includes("Mac steps"));
    expect(macChunk).toBeDefined();
    expect(macChunk!.headingContext).toContain("Guide");
    expect(macChunk!.headingContext).toContain("Installation");
    expect(macChunk!.headingContext).toContain("macOS");
  });

  it("splits large content into multiple chunks", () => {
    const bigParagraph = "Word ".repeat(500);
    const md = `# Big Section\n\n${bigParagraph}`;
    const chunks = chunkMarkdown(md);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("each chunk heading context is non-empty", () => {
    const md = `# Top\n\nContent.\n\n## Sub\n\nMore content.`;
    const chunks = chunkMarkdown(md);
    for (const chunk of chunks) {
      expect(chunk.headingContext.length).toBeGreaterThan(0);
    }
  });
});
