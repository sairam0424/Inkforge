import { describe, it, expect } from "vitest";
import { ingest } from "../ingest.js";

describe("ingest — notes mode", () => {
  it("extracts headings from markdown notes", () => {
    const result = ingest({
      inputType: "notes",
      content: "# My Guide\n\nSome intro text.\n\n## Installation\n\nStep 1.",
      params: { tone: "intermediate", format: "tutorial", length: "medium", mode: "oneshot" },
      tags: [],
      platforms: [],
    });
    expect(result.inputType).toBe("notes");
    expect(result.headings).toContain("My Guide");
    expect(result.headings).toContain("Installation");
  });

  it("uses override title when provided", () => {
    const result = ingest({
      inputType: "notes",
      content: "# Original Title\n\nContent here.",
      params: { tone: "intermediate", format: "tutorial", length: "medium", mode: "oneshot" },
      title: "My Override Title",
      tags: [],
      platforms: [],
    });
    expect(result.extractedTitle).toBe("My Override Title");
  });

  it("extracts code blocks", () => {
    const result = ingest({
      inputType: "notes",
      content: "Some text.\n\n```typescript\nconst x = 1;\n```\n\nMore text.",
      params: { tone: "intermediate", format: "tutorial", length: "medium", mode: "oneshot" },
      tags: [],
      platforms: [],
    });
    expect(result.codeSnippets.length).toBeGreaterThan(0);
    expect(result.codeSnippets[0]).toContain("const x = 1");
  });

  it("strips frontmatter before processing", () => {
    const result = ingest({
      inputType: "notes",
      content: "---\ntitle: Test\ndate: 2026-01-01\n---\n# Real Title\n\nContent.",
      params: { tone: "intermediate", format: "tutorial", length: "medium", mode: "oneshot" },
      tags: [],
      platforms: [],
    });
    expect(result.rawContent).not.toContain("---");
    expect(result.headings).toContain("Real Title");
  });
});

describe("ingest — topic mode", () => {
  it("uses topic string as rawContent", () => {
    const result = ingest({
      inputType: "topic",
      content: "How RAFT consensus algorithm works in distributed systems",
      params: { tone: "senior", format: "explainer", length: "comprehensive", mode: "oneshot" },
      tags: [],
      platforms: [],
    });
    expect(result.inputType).toBe("topic");
    expect(result.rawContent).toContain("RAFT");
  });

  it("infers distributed-systems tag from topic", () => {
    const result = ingest({
      inputType: "topic",
      content: "Distributed consensus and RAFT protocol",
      params: { tone: "senior", format: "explainer", length: "medium", mode: "oneshot" },
      tags: [],
      platforms: [],
    });
    expect(result.extractedTags).toContain("distributed-systems");
  });
});

describe("ingest — code mode", () => {
  it("processes pasted code content", () => {
    const result = ingest({
      inputType: "code",
      content: "export async function streamWithFallback(params: any): ReadableStream { }",
      params: { tone: "intermediate", format: "showcase", length: "medium", mode: "oneshot" },
      tags: [],
      platforms: [],
    });
    expect(result.inputType).toBe("code");
    expect(result.headings).toContain("streamWithFallback");
  });
});
