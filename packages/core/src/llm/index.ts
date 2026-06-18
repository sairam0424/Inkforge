import Anthropic from "@anthropic-ai/sdk";
import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";

/**
 * LLM provider abstraction for Inkforge's generation pipeline.
 *
 * Adapted from Anvilry's production pattern (sairam-dev/src/lib/llm.ts).
 * Single source of truth for: provider choice, client construction, the model
 * fallback chain, AWS credential decoding, fallback-eligibility, and the
 * streaming-with-fallback loop.
 *
 * Provider: Bedrock (default) → Sonnet 4.6 → Opus 4.6 → Haiku 4.5
 * Toggle via LLM_PROVIDER=anthropic to use direct Anthropic API.
 */

export type LlmProvider = "bedrock" | "anthropic";

const PER_ATTEMPT_TIMEOUT_MS = 30_000; // longer for article generation than chat

const BEDROCK_CHAIN = [
  "us.anthropic.claude-sonnet-4-6",
  "us.anthropic.claude-opus-4-6-v1",
  "us.anthropic.claude-haiku-4-5-20251001-v1:0",
];

const ANTHROPIC_CHAIN = ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"];

const MODEL_UNAVAILABLE_MARKERS = [
  "model identifier is invalid",
  "model id is invalid",
  "could not be found",
  "not authorized to access the model",
  "don't have access to the model",
  "is not supported",
];

export function getProvider(): LlmProvider {
  return process.env.LLM_PROVIDER === "anthropic" ? "anthropic" : "bedrock";
}

function decodeSecret(value: string | undefined): string {
  if (!value) return "";
  try {
    const decoded = Buffer.from(value, "base64").toString("utf-8");
    if (Buffer.from(decoded, "utf-8").toString("base64") === value) return decoded;
  } catch {
    /* fall through */
  }
  return value;
}

export function bedrockCreds() {
  return {
    accessKeyId: decodeSecret(process.env.BEDROCK_ACCESS_KEY_ID),
    secretAccessKey: decodeSecret(process.env.BEDROCK_SECRET_ACCESS_KEY),
    sessionToken: process.env.BEDROCK_SESSION_TOKEN
      ? decodeSecret(process.env.BEDROCK_SESSION_TOKEN)
      : undefined,
    region: process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1",
  };
}

export function isConfigured(): boolean {
  if (getProvider() === "bedrock") {
    const { accessKeyId, secretAccessKey } = bedrockCreds();
    return Boolean(accessKeyId && secretAccessKey);
  }
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function modelChain(): string[] {
  return getProvider() === "bedrock" ? BEDROCK_CHAIN : ANTHROPIC_CHAIN;
}

export function makeClient(): Anthropic {
  if (getProvider() === "bedrock") {
    const { accessKeyId, secretAccessKey, sessionToken, region } = bedrockCreds();
    return new AnthropicBedrock({
      awsRegion: region,
      timeout: PER_ATTEMPT_TIMEOUT_MS,
      providerChainResolver: async () => async () => ({
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      }),
    }) as unknown as Anthropic;
  }
  return new Anthropic({ timeout: PER_ATTEMPT_TIMEOUT_MS });
}

export function isFallbackEligible(err: unknown): boolean {
  if (err instanceof Anthropic.APIConnectionError) return true;
  const status = (err as { status?: number })?.status;
  if (status === 429 || status === 404) return true;
  if (typeof status === "number" && status >= 500) return true;
  if (status === 400) {
    const msg = String((err as { message?: string })?.message ?? "").toLowerCase();
    return MODEL_UNAVAILABLE_MARKERS.some((m) => msg.includes(m));
  }
  return false;
}

export type LlmUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

/**
 * Accumulate a full LLM response to a string (for pipeline intermediate stages).
 * Unlike the streaming variant used in chat routes, article pipeline stages need
 * the full text before passing it to the next stage.
 */
export async function generateText(
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">,
  opts?: { onError?: (err: unknown, model: string) => void },
): Promise<{ text: string; model: string; usage?: LlmUsage }> {
  const chain = modelChain();
  let client: Anthropic;
  try {
    client = makeClient();
  } catch (err) {
    opts?.onError?.(err, "client-init");
    throw new Error(`Failed to initialise LLM client: ${String(err)}`);
  }

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      const response = await client.messages.create({ ...params, model });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b: Anthropic.TextBlock) => b.text)
        .join("");
      const usage: LlmUsage = {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens,
      };
      return { text, model, usage };
    } catch (err) {
      opts?.onError?.(err, model);
      const isLast = i === chain.length - 1;
      if (isLast || !isFallbackEligible(err)) throw err;
    }
  }
  throw new Error("All models in fallback chain exhausted");
}

/**
 * Stream LLM response — for real-time CLI progress display during polish/draft.
 * Returns a ReadableStream of Uint8Array bytes, same interface as Anvilry's chat.
 */
export function streamText(
  params: Omit<Anthropic.MessageStreamParams, "model">,
  opts?: { onError?: (err: unknown, model: string) => void },
): ReadableStream<Uint8Array> {
  const chain = modelChain();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let emittedAny = false;
      let closed = false;
      const close = () => {
        if (!closed) { closed = true; controller.close(); }
      };

      let client: Anthropic;
      try {
        client = makeClient();
      } catch (err) {
        opts?.onError?.(err, "client-init");
        controller.enqueue(encoder.encode(`[Error initialising LLM: ${String(err)}]`));
        close();
        return;
      }

      for (let i = 0; i < chain.length; i++) {
        const model = chain[i];
        const stream = client.messages.stream({ ...params, model });
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
              emittedAny = true;
            }
          }
          close();
          return;
        } catch (err) {
          opts?.onError?.(err, model);
          const isLast = i === chain.length - 1;
          if (emittedAny || isLast || !isFallbackEligible(err)) {
            if (!emittedAny) controller.enqueue(encoder.encode(`\n[LLM error: ${String(err)}]`));
            close();
            return;
          }
        }
      }
      close();
    },
  });
}
