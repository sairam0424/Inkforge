import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emit } from "../emit.js";
import type { Outline, GenerationParams } from "../../schema/index.js";

const outline: Outline = {
  title: "DNS Explained",
  summary: "How a resolver walks the DNS hierarchy.",
  slug: "dns-explained",
  tags: ["dns"],
  totalWordBudget: 300,
  sections: [
    {
      heading: "Resolvers",
      level: 2,
      keyPoints: ["recursion"],
      wordBudget: 300,
      examples: [],
    },
  ],
};
const params: GenerationParams = {
  tone: "intermediate",
  format: "explainer",
  length: "thread",
  mode: "oneshot",
};
const BODY = "# DNS Explained\n\nResolvers ask the root servers first.\n";
const RAW_INPUT = "How DNS resolution works";
const DATE = "2026-10-11";

let root: string;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "inkforge-emit-"));
  for (const key of ["INKFORGE_CONTENT_DIR", "INKFORGE_ANVILRY_NOTES_DIR"]) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(root, { recursive: true, force: true });
});

function articleBody(path: string): string {
  return readFileSync(path, "utf-8");
}

describe("emit — raw input sink never collides with the article (#63)", () => {
  it("uses the sibling inputs/ directory when the content directory is named articles", () => {
    process.env.INKFORGE_CONTENT_DIR = join(root, "content", "articles");

    const result = emit(BODY, outline, params, [], DATE, "general", RAW_INPUT);

    expect(result.primaryPath).toBe(
      join(root, "content", "articles", "general", "dns-explained.md"),
    );
    expect(articleBody(result.primaryPath)).toContain(
      "Resolvers ask the root servers first.",
    );
    const inputPath = join(
      root,
      "content",
      "inputs",
      "general",
      "dns-explained.md",
    );
    expect(readFileSync(inputPath, "utf-8")).toBe(RAW_INPUT);
  });

  it("keeps the article intact when the content directory has another name", () => {
    process.env.INKFORGE_CONTENT_DIR = join(root, "out");

    const result = emit(
      BODY,
      outline,
      params,
      [],
      DATE,
      "system-design",
      RAW_INPUT,
    );

    expect(result.primaryPath).toBe(
      join(root, "out", "system-design", "dns-explained.md"),
    );
    const written = articleBody(result.primaryPath);
    expect(written).toContain("Resolvers ask the root servers first.");
    expect(written).not.toBe(RAW_INPUT);
    expect(
      readFileSync(
        join(root, "out", "inputs", "system-design", "dns-explained.md"),
        "utf-8",
      ),
    ).toBe(RAW_INPUT);
  });

  it('treats a directory that merely ends in "articles" as a custom directory', () => {
    process.env.INKFORGE_CONTENT_DIR = join(root, "myarticles");

    const result = emit(BODY, outline, params, [], DATE, "general", RAW_INPUT);

    expect(articleBody(result.primaryPath)).toContain(
      "Resolvers ask the root servers first.",
    );
    expect(
      existsSync(
        join(root, "myarticles", "inputs", "general", "dns-explained.md"),
      ),
    ).toBe(true);
    expect(existsSync(join(root, "myinputs"))).toBe(false);
  });

  it("writes no inputs directory when there is no raw input", () => {
    process.env.INKFORGE_CONTENT_DIR = join(root, "content", "articles");

    emit(BODY, outline, params, [], DATE, "general");

    expect(existsSync(join(root, "content", "inputs"))).toBe(false);
  });

  it("reports no mirror path when INKFORGE_ANVILRY_NOTES_DIR is unset", () => {
    process.env.INKFORGE_CONTENT_DIR = join(root, "content", "articles");

    const result = emit(
      BODY,
      outline,
      params,
      ["devto"],
      DATE,
      "general",
      RAW_INPUT,
    );

    expect(result.anvilryPath).toBeUndefined();
    expect(result.slug).toBe("dns-explained");
    expect(result.wordCount).toBeGreaterThan(0);
  });
});
