import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { contentDir } from "@/lib/env";

function parseFrontmatter(mdx: string): Record<string, unknown> | null {
  const match = mdx.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const result: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const ci = line.indexOf(":");
    if (ci < 0) continue;
    const k = line.slice(0, ci).trim();
    const raw = line.slice(ci + 1).trim();
    if (raw.startsWith("[")) {
      result[k] = raw.slice(1, -1).split(",").map((s: string) => s.trim().replace(/^"(.*)"$/, "$1")).filter(Boolean);
    } else {
      const v = raw.replace(/^"(.*)"$/, "$1");
      result[k] = v === "true" ? true : v === "false" ? false : (v !== "" && !isNaN(Number(v))) ? Number(v) : v;
    }
  }
  return result;
}

export async function GET() {
  const dir = contentDir();
  if (!existsSync(dir)) return Response.json([]);
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    const articles = files
      .map((f) => parseFrontmatter(readFileSync(resolve(dir, f), "utf-8")))
      .filter((a): a is Record<string, unknown> => a !== null)
      .sort((a, b) => (String(a.date ?? "") < String(b.date ?? "") ? 1 : -1));
    return Response.json(articles);
  } catch {
    return Response.json([]);
  }
}
