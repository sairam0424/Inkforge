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

import { publishToHashnode } from "../hashnode.js";

function makeArticle(overrides: Partial<ArticleOutput> = {}): ArticleOutput {
  return {
    slug: "how-dns-works",
    title: "How DNS Actually Works",
    summary: "A deep dive into DNS resolution.",
    date: "2026-09-09",
    tags: ["dns", "networking"],
    readingTime: 8,
    wordCount: 1600,
    tone: "senior",
    format: "explainer",
    length: "medium",
    category: "system-design",
    platforms: ["hashnode"],
    body: "## Intro\n\nDNS resolves names to IPs.",
    ...overrides,
  };
}

describe("publishToHashnode", () => {
  beforeEach(() => {
    ensureLoggedInMock.mockReset();
    runBrowserHarnessScriptMock.mockReset();
    writePublishedTrackingRecordMock.mockReset();
    delete process.env.HASHNODE_EDITOR_URL;
  });

  it("throws a config error when neither HASHNODE_EDITOR_URL nor opts.editorUrl is set", async () => {
    await expect(publishToHashnode(makeArticle())).rejects.toThrow(/HASHNODE_EDITOR_URL/);
    expect(ensureLoggedInMock).not.toHaveBeenCalled();
  });

  it("publishes via the configured editor URL and writes a draft tracking record", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://sairam.hashnode.dev/how-dns-works" });

    const result = await publishToHashnode(makeArticle(), {
      editorUrl: "https://sairam.hashnode.dev/new",
      canonicalBase: "https://anvilry.vercel.app/notes",
    });

    expect(ensureLoggedInMock).toHaveBeenCalledWith("Hashnode", "https://sairam.hashnode.dev/new");
    expect(result).toEqual({ id: "how-dns-works", url: "https://sairam.hashnode.dev/how-dns-works" });
    const [platform, record] = writePublishedTrackingRecordMock.mock.calls[0];
    expect(platform).toBe("hashnode");
    expect(record.status).toBe("draft");
  });

  it("falls back to the HASHNODE_EDITOR_URL env var when opts.editorUrl is omitted", async () => {
    process.env.HASHNODE_EDITOR_URL = "https://sairam.hashnode.dev/new";
    ensureLoggedInMock.mockResolvedValue(undefined);
    runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://sairam.hashnode.dev/how-dns-works" });

    await publishToHashnode(makeArticle());

    expect(ensureLoggedInMock).toHaveBeenCalledWith("Hashnode", "https://sairam.hashnode.dev/new");
  });

  it("throws a clear error when the publish script reports failure", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    runBrowserHarnessScriptMock.mockResolvedValue({ status: "error", message: "Hashnode body editor not found" });

    await expect(
      publishToHashnode(makeArticle(), { editorUrl: "https://sairam.hashnode.dev/new" }),
    ).rejects.toThrow(/body editor not found/);
  });

  it("writes a 'live' tracking record and passes PUBLISH_AFTER_DRAFT=True when opts.published is true", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://sairam.hashnode.dev/how-dns-works" });

    const result = await publishToHashnode(makeArticle(), {
      editorUrl: "https://sairam.hashnode.dev/new",
      canonicalBase: "https://anvilry.vercel.app/notes",
      published: true,
    });

    expect(result).toEqual({ id: "how-dns-works", url: "https://sairam.hashnode.dev/how-dns-works" });
    const [script] = runBrowserHarnessScriptMock.mock.calls[0];
    expect(script).toMatch(/PUBLISH_AFTER_DRAFT = True/);
    const [platform, record] = writePublishedTrackingRecordMock.mock.calls[0];
    expect(platform).toBe("hashnode");
    expect(record.status).toBe("live");
  });

  it("throws and does NOT write a 'live' tracking record when the Publish click could not be confirmed", async () => {
    ensureLoggedInMock.mockResolvedValue(undefined);
    // Simulates the browser-harness script's behavior when PUBLISH_AFTER_DRAFT
    // is true but the Publish/confirm button was never found — the script must
    // surface this as a status:"error", not a silent status:"ok".
    runBrowserHarnessScriptMock.mockResolvedValue({
      status: "error",
      message: "Hashnode Publish button not found - article was saved as a draft but NOT published",
    });

    await expect(
      publishToHashnode(makeArticle(), {
        editorUrl: "https://sairam.hashnode.dev/new",
        published: true,
      }),
    ).rejects.toThrow(/saved as a draft but NOT published/);
    expect(writePublishedTrackingRecordMock).not.toHaveBeenCalled();
  });
});
