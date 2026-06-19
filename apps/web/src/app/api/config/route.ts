import { isLlmConfigured, contentDir, anvilryNotesDir, contentDirExists } from "@/lib/env";
import { existsSync } from "node:fs";

export async function GET() {
  const anvilryDir = anvilryNotesDir();
  return Response.json({
    llmProvider: process.env.LLM_PROVIDER ?? "bedrock",
    llmConfigured: isLlmConfigured(),
    devtoConfigured: !!process.env.DEVTO_API_KEY,
    hashnodeConfigured: !!(process.env.HASHNODE_API_KEY && process.env.HASHNODE_PUBLICATION_ID),
    contentDir: contentDir(),
    contentDirExists: contentDirExists(),
    anvilryDir,
    anvilryDirExists: anvilryDir ? existsSync(anvilryDir) : false,
  });
}
