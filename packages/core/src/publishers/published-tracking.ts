import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type PublishedPlatform = "medium" | "hashnode" | "devto" | "substack" | "linkedin";

export type PublishedTrackingRecord = {
  slug: string;
  title: string;
  publishedUrl: string;
  publishedDate: string; // YYYY-MM-DD
  canonicalUrl?: string;
  status: "live" | "draft" | "scheduled";
  notes?: string;
};

/**
 * Writes content/published/<platform>/<slug>.md, matching the template
 * documented in CLAUDE.md ("Published Tracking") and content/published/README.md.
 */
export function writePublishedTrackingRecord(
  platform: PublishedPlatform,
  record: PublishedTrackingRecord,
  opts?: { contentDir?: string },
): string {
  const baseDir = opts?.contentDir ?? resolve(process.cwd(), "content/published");
  const filePath = resolve(baseDir, platform, `${record.slug}.md`);
  if (!existsSync(dirname(filePath))) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  const frontmatterLines = [
    "---",
    `slug: ${record.slug}`,
    `title: "${record.title.replace(/"/g, '\\"')}"`,
    `published_url: ${record.publishedUrl}`,
    `published_date: ${record.publishedDate}`,
    ...(record.canonicalUrl ? [`canonical_url: ${record.canonicalUrl}`] : []),
    `status: ${record.status}`,
    "views: 0",
    "claps: 0",
    "---",
    "",
    record.notes ?? "",
    "",
  ];
  writeFileSync(filePath, frontmatterLines.join("\n"), "utf-8");
  return filePath;
}
