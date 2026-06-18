import type { ArticleOutput } from "../schema/index.js";

export type HashnodePublishResult = { id: string; url: string };

const HASHNODE_GQL = "https://gql.hashnode.com";

const PUBLISH_MUTATION = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        url
      }
    }
  }
`;

/**
 * Publish to Hashnode via GraphQL API v2.
 * Auth: Authorization header (HASHNODE_API_KEY env var)
 * Publication: HASHNODE_PUBLICATION_ID env var
 */
export async function publishToHashnode(
  article: ArticleOutput,
  opts?: { published?: boolean; canonicalBase?: string },
): Promise<HashnodePublishResult> {
  const apiKey = process.env.HASHNODE_API_KEY;
  const publicationId = process.env.HASHNODE_PUBLICATION_ID;

  if (!apiKey) throw new Error("HASHNODE_API_KEY environment variable is not set");
  if (!publicationId) throw new Error("HASHNODE_PUBLICATION_ID environment variable is not set");

  const canonicalUrl = opts?.canonicalBase
    ? `${opts.canonicalBase.replace(/\/$/, "")}/${article.slug}`
    : undefined;

  const input: Record<string, unknown> = {
    title: article.title,
    contentMarkdown: article.body,
    publicationId,
    tags: article.tags.slice(0, 5).map((t: string) => ({ name: t, slug: t.toLowerCase().replace(/\s+/g, "-") })),
    ...(canonicalUrl ? { originalArticleURL: canonicalUrl } : {}),
  };

  // Hashnode uses isDraft to control visibility
  if (!opts?.published) input["isDraft"] = true;

  const response = await fetch(HASHNODE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query: PUBLISH_MUTATION, variables: { input } }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(no body)");
    throw new Error(`Hashnode API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    data?: { publishPost?: { post?: { id: string; url: string } } };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    throw new Error(`Hashnode GraphQL error: ${data.errors.map((e) => e.message).join(", ")}`);
  }

  const post = data.data?.publishPost?.post;
  if (!post) throw new Error("Hashnode returned no post data");

  return { id: post.id, url: post.url };
}
