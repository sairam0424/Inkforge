import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { contentDir } from "@/lib/env";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const path = resolve(contentDir(), `${slug}.mdx`);
  if (!existsSync(path)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ slug, content: readFileSync(path, "utf-8") });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const path = resolve(contentDir(), `${slug}.mdx`);
  if (!existsSync(path)) return Response.json({ error: "Not found" }, { status: 404 });
  unlinkSync(path);
  return Response.json({ ok: true });
}
