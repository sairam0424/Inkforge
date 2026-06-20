import type { ArticleOutput } from "../schema/index.js";

export type HashnodePublishResult = { id: string; url: string };

/**
 * Hashnode's public GraphQL API (gql.hashnode.com) was decommissioned in 2026.
 * The endpoint now returns a 301 redirect to an announcement page.
 * No replacement public API has been announced as of 2026-06.
 *
 * Publish manually at https://hashnode.com until an API is restored.
 */
export async function publishToHashnode(
  _article: ArticleOutput,
  _opts?: { published?: boolean; canonicalBase?: string },
): Promise<HashnodePublishResult> {
  throw new Error(
    "Hashnode publish API unavailable — gql.hashnode.com was decommissioned in 2026. " +
    "Publish manually at https://hashnode.com"
  );
}
