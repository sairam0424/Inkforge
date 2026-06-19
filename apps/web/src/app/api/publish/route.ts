import { publishToDevto } from "@inkforge/core/publishers/devto";
import { publishToHashnode } from "@inkforge/core/publishers/hashnode";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { contentDir, canonicalBase } from "@/lib/env";

function parseArticle(mdx: string): Record<string, unknown> {
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n?/);
  const result: Record<string, unknown> = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const ci = line.indexOf(":");
      if (ci < 0) continue;
      const k = line.slice(0, ci).trim();
      result[k] = line.slice(ci + 1).trim().replace(/^"(.*)"$/, "$1");
    }
  }
  result.body = mdx.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
  result.tags = result.tags
    ? String(result.tags).replace(/[\[\]"]/g, "").split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];
  return result;
}

export async function POST(req: Request) {
  const { slug, platform, published = false } = await req.json() as { slug: string; platform: string; published?: boolean };
  const path = resolve(contentDir(), `${slug}.mdx`);
  if (!existsSync(path)) return Response.json({ error: "Article not found" }, { status: 404 });

  const article = parseArticle(readFileSync(path, "utf-8"));
  const opts = { published, canonicalBase: canonicalBase() };

  try {
    let result: { url: string };
    if (platform === "devto") {
      result = await publishToDevto(article as Parameters<typeof publishToDevto>[0], opts);
    } else if (platform === "hashnode") {
      result = await publishToHashnode(article as Parameters<typeof publishToHashnode>[0], opts);
    } else {
      return Response.json({ error: "Unknown platform" }, { status: 400 });
    }
    return Response.json({ url: result.url });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
