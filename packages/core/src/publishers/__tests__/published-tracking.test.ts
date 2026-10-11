import { describe, it, expect, afterEach } from "vitest";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writePublishedTrackingRecord } from "../published-tracking.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = resolve(__dirname, "__fixtures__/published");

describe("writePublishedTrackingRecord", () => {
  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("writes a frontmatter record matching the documented template", () => {
    const filePath = writePublishedTrackingRecord(
      "medium",
      {
        slug: "how-dns-works",
        title: "How DNS Actually Works",
        publishedUrl: "https://medium.com/@sairam/how-dns-works-abc123",
        publishedDate: "2026-09-09",
        canonicalUrl: "https://anvilry.vercel.app/notes/how-dns-works",
        status: "live",
      },
      { contentDir: TEST_DIR },
    );
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("slug: how-dns-works");
    expect(content).toContain('title: "How DNS Actually Works"');
    expect(content).toContain("published_url: https://medium.com/@sairam/how-dns-works-abc123");
    expect(content).toContain("canonical_url: https://anvilry.vercel.app/notes/how-dns-works");
    expect(content).toContain("status: live");
  });

  it("creates the platform subdirectory if it does not exist", () => {
    const filePath = writePublishedTrackingRecord(
      "hashnode",
      {
        slug: "test-article",
        title: "Test Article",
        publishedUrl: "https://sairam.hashnode.dev/test-article",
        publishedDate: "2026-09-09",
        status: "draft",
      },
      { contentDir: TEST_DIR },
    );
    expect(filePath).toContain(`${TEST_DIR}/hashnode/test-article.md`.replace(/\//g, resolve("/")[0] === "/" ? "/" : "\\"));
    expect(existsSync(filePath)).toBe(true);
  });
});
