import type { ArticleOutput } from "../schema/index.js";

export type DevtoPublishResult = { id: number; url: string };

/**
 * Publish to Dev.to via REST API v1.
 * https://developers.forem.com/api/v1
 *
 * Auth: api-key header (DEVTO_API_KEY env var)
 * Content: body_markdown with YAML frontmatter stripped (sent as separate fields)
 */
export async function publishToDevto(
  article: ArticleOutput,
  opts?: { published?: boolean; canonicalBase?: string },
): Promise<DevtoPublishResult> {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) throw new Error("DEVTO_API_KEY environment variable is not set");

  const canonicalUrl = opts?.canonicalBase
    ? `${opts.canonicalBase.replace(/\/$/, "")}/${article.slug}`
    : undefined;

  const payload = {
    article: {
      title: article.title,
      body_markdown: article.body,
      published: opts?.published ?? false,
      tags: article.tags.slice(0, 4),
      ...(canonicalUrl ? { canonical_url: canonicalUrl } : {}),
    },
  };

  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(no body)");
    throw new Error(`Dev.to API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { id: number; url: string };
  return { id: data.id, url: data.url };
}
