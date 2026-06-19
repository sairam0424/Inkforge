import { generate, GenerationRequestSchema } from "@inkforge/core";
import type { NextRequest } from "next/server";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = GenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
        } catch { /* stream closed */ }
      };

      try {
        const result = await generate(parsed.data, {
          date: new Date().toISOString().slice(0, 10),
          onProgress: ({ stage, detail }) => send({ type: "progress", stage, detail }),
        });
        send({
          type: "complete",
          slug: result.emitResult.slug,
          wordCount: result.emitResult.wordCount,
          readingTime: result.emitResult.readingTime,
          primaryPath: result.emitResult.primaryPath,
          anvilryPath: result.emitResult.anvilryPath,
        });
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
