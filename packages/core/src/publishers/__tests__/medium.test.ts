import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ArticleOutput } from "../../schema/index.js";

const ensureLoggedInMock = vi.fn();
const runBrowserHarnessScriptMock = vi.fn();
const writePublishedTrackingRecordMock = vi.fn();

vi.mock("../browser-harness-client.js", () => ({
  ensureLoggedIn: (...args: unknown[]) => ensureLoggedInMock(...args),
  runBrowserHarnessScript: (...args: unknown[]) => runBrowserHarnessScriptMock(...args),
}));
vi.mock("../published-tracking.js", () => ({
  writePublishedTrackingRecord: (...args: unknown[]) => writePublishedTrackingRecordMock(...args),
}));

import { publishToMedium } from "../medium.js";

function makeArticle(overrides: Partial<ArticleOutput> = {}): ArticleOutput {
  return {
    slug: "how-dns-works",
    title: "How DNS Actually Works",
    summary: "A deep dive into DNS resolution.",
    date: "2026-09-09",
    tags: ["dns", "networking", "systems"],
    readingTime: 8,
    wordCount: 1600,
    tone: "senior",
    format: "explainer",
    length: "medium",
    category: "system-design",
    platforms: ["medium"],
    body: "## Intro\n\nDNS resolves names to IPs.\n\n## How it works\n\nRecursive resolvers ask root servers.",
    ...overrides,
  };
}

describe("publishToMedium", () => {
  beforeEach(() => {
    ensureLoggedInMock.mockReset();
    runBrowserHarnessScriptMock.mockReset();
    writePublishedTrackingRecordMock.mockReset();
  });

  it("throws when canonicalBase is not provided", async () => {
    await expect(
      publishToMedium(makeArticle(), { canonicalBase: "" } as never),
    ).rejects.toThrow(/requires opts.canonicalBase/);
    expect(ensureLoggedInMock).not.toHaveBeenCalled();
  });

  it("throws MediumContentValidationError when the body has H3 headings, before touching the browser", async () => {
    const article = makeArticle({ body: "## Intro\n\n### Sub-point\n\nBody text." });
    await expect(
      publishToMedium(article, { canonicalBase: "https://anvilry.vercel.app/notes" }),
    ).rejects.toThrow(/Line 3/);
    expect(ensureLoggedInMock).not.toHaveBeenCalled();
  });

  it("imports via medium.com/p/import and writes a draft tracking record on success", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://medium.com/p/abc123def/edit" });

    const result = await publishToMedium(makeArticle(), {
      canonicalBase: "https://anvilry.vercel.app/notes",
      published: false,
    });

    expect(ensureLoggedInMock).toHaveBeenCalledWith("Medium", "https://medium.com/p/import");
    expect(result).toEqual({ id: "abc123def", url: "https://medium.com/p/abc123def/edit" });
    expect(writePublishedTrackingRecordMock).toHaveBeenCalledTimes(1);
    const [platform, record] = writePublishedTrackingRecordMock.mock.calls[0];
    expect(platform).toBe("medium");
    expect(record.status).toBe("draft");
    expect(record.canonicalUrl).toBe("https://anvilry.vercel.app/notes/how-dns-works");
  });

  it("throws a clear error when the import script reports failure", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    runBrowserHarnessScriptMock.mockResolvedValue({ status: "error", message: "Medium Import button not found" });

    await expect(
      publishToMedium(makeArticle(), { canonicalBase: "https://anvilry.vercel.app/notes" }),
    ).rejects.toThrow(/Import button not found/);
    expect(writePublishedTrackingRecordMock).not.toHaveBeenCalled();
  });

  it("throws and does NOT write a 'live' tracking record when the Publish click could not be confirmed", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    // Simulates the browser-harness script's behavior when PUBLISH_AFTER_IMPORT
    // is true but the Publish/"Publish now" button was never found — the script
    // must surface this as a status:"error", not a silent status:"ok".
    runBrowserHarnessScriptMock.mockResolvedValue({
      status: "error",
      message: "Medium Publish button not found after import - article was imported as a draft but NOT published",
    });

    await expect(
      publishToMedium(makeArticle(), {
        canonicalBase: "https://anvilry.vercel.app/notes",
        published: true,
      }),
    ).rejects.toThrow(/imported as a draft but NOT published/);
    expect(writePublishedTrackingRecordMock).not.toHaveBeenCalled();
  });
});
