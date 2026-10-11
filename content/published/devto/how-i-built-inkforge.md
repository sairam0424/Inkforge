---
slug: how-i-built-inkforge
title: "How I Built Inkforge: Designing an AI-Powered Article System with STORM Pipeline, BM25 RAG, and AWS Bedrock"
platform: devto
status: draft-published
published_date: 2026-06-27
published_url: https://dev.to/sai_ram_0000/how-i-built-inkforge-designing-an-ai-powered-article-system-with-storm-pipeline-bm25-rag-and-aws-g2n-temp-slug-2132717
canonical_url: https://anvilry.vercel.app/notes/how-i-built-inkforge
tags: ["showdev","opensource","typescript","ai"]
---

![Building Inkforge — the pipeline that generated this article](gif-placeholder)

## The Problem with Naive LLM Article Generation

Most LLM content generators fail in ways that look successful. The first version of Inkforge proved this perfectly — I shipped it in an afternoon, and it worked so well that the problems took weeks to notice.

The output had all the surface characteristics of quality technical writing: confident declarative sentences, reasonable heading hierarchy, even code snippets. But spend five minutes reading carefully and the cracks showed. Every article on "distributed tracing" opened with the same three-sentence definition of spans and traces, hit the same four tool mentions (Jaeger, Zipkin, Datadog, OpenTelemetry), and wrapped with a nearly identical "choose the right tool for your use case" conclusion. The coverage wasn't shallow — it was predictably, reproducibly shallow. I was getting the first two pages of Google search results serialized into prose, and nothing deeper.

The hallucination problem was worse because it was invisible. During a manual review, I caught a generated article citing `opentelemetry.io/rfcs/trace-context-propagation-v2` for a specific claim about baggage size limits. The URL was plausible — correct domain, versioned path structure, everything. The RFC doesn't exist. The claim it supported wasn't technically wrong, but it wasn't sourced from anywhere real either.

Token window constraints introduced a second failure mode. Anything past ~2,000 words showed coherence degradation in the final third. The model was losing the thread of what it had already written.

I spent two weeks trying to engineer my way out of this through prompt refinement. Better instructions, more examples, stronger disclaimers — none of it fixed the fundamental problem: **I was asking the model to be a researcher and a writer simultaneously.** LLMs are genuinely mediocre researchers. The architecture was the problem, not the prompt.

## Discovering STORM: Research Before Writing

The Stanford STORM paper landed when I'd already burned enough time on prompt engineering to know it wouldn't help. The core observation — that expert writing is preceded by structured research across multiple viewpoints, not a single top-down drafting pass — felt obvious in retrospect, but the operationalization was what I needed.

**STORM** (Synthesis of Topic Outlines through Retrieval and Multi-perspective questioning) decomposes long-form generation into four sequential phases:

1. Perspective generation
2. Question-driven retrieval
3. Grounded synthesis
4. Writing

The sequencing *is* the point. By the time you touch a drafting model, every claim has a retrieval trace behind it. You're not asking an LLM to hallucinate structure — you're asking it to organize evidence that already exists in your context window.

I adapted STORM's persona simulation loop specifically for engineering content. For each article topic, Inkforge generates 4–5 synthetic expert reviewers drawn from role archetypes relevant to the domain. For a topic like "Kafka consumer group rebalancing":

- The **platform engineer** asks about partition assignment strategies, cooperative vs. eager rebalancing protocols, and `group.initial.rebalance.delay.ms` tuning.
- The **streaming data architect** focuses on back-pressure implications, consumer lag spikes during rebalance windows, and idempotency requirements.
- The **SRE** immediately goes to failure modes: what happens when a consumer crashes mid-rebalance, how heartbeat timeouts interact with `session.timeout.ms` under GC pressure.

Those three lenses produce a question corpus that shapes retrieval queries → grounding context → final article structure. Without them, you get a competent Wikipedia summary. With them, you get something that reads like it was written by someone who's actually operated Kafka at scale.

## Building the BM25 Retrieval Layer

Dense vector embeddings were the obvious default. I spent a weekend prototyping a FAISS-based retrieval layer with Titan Embeddings before stepping back and asking whether the complexity was justified. For Inkforge's use case — a corpus of roughly 30–40k documents that changes incrementally — BM25 made more sense:

- **Deterministic**: debugging a bad retrieval result means reading term frequencies, not interrogating a 1536-dimensional vector space
- **Zero embedding cost** per query
- **Sub-second latency** on corpora under ~50k documents without caching tricks

The BM25 implementation lives entirely in TypeScript (the rest of Inkforge is Node-based). The index structure stores per-term frequency maps in DynamoDB and the inverted index serialized as JSON in S3. At query time, the hot path loads only the IDF table into memory; term frequency lookups are batched DynamoDB reads. Cold start runs around 400ms; warm retrieval for a query against 35k chunks takes ~180ms.

```typescript
async function retrieve(question: string, topK = 20, topN = 5): Promise<Passage[]> {
  const expandedQuery = await expandQuery(question); // LLM expansion pass
  const candidates = await bm25Search(expandedQuery, topK);
  const reranked = await rerankWithHaiku(question, candidates);
  return reranked.slice(0, topN);
}
```

The `rerankWithHaiku` step is a lightweight Claude Haiku call that scores each candidate passage for relevance to the *original* question — not the expanded one.

**Query expansion was born from pain.** BM25 scoring degrades badly on short queries — anything under four or five tokens produces unreliable recall. The fix was an LLM pre-pass that expands short queries before they hit the index:

`Bedrock invoke model timeout` → `AWS Bedrock InvokeModel API request timeout configuration retry policy`

On a held-out eval set of 150 questions, recall at K=20 jumped from 61% to 89% after adding this step.

## Integrating AWS Bedrock: Model Selection, Routing, and Cost Control

AWS Bedrock's value isn't just managed inference — it's a single API contract across a roster of foundation models, which lets you route pipeline stages to cost-appropriate models without re-architecting your client layer.

My three-tier routing scheme:
- **Claude Haiku** — re-ranking BM25 candidates and outline expansion (high-volume, low-complexity, ~1/15th the cost of Opus)
- **Claude Sonnet** — synthesis where coherence actually matters
- **Claude Opus** — final editorial review only

**InvokeModel vs. InvokeModelWithResponseStream** was a mistake I made early. Synchronous `InvokeModel` had synthesis calls blocking for 18–22 seconds. Switching to streaming dropped perceived latency to near-zero:

```typescript
const stream = await bedrockClient.send(
  new InvokeModelWithResponseStreamCommand({ modelId, body })
);
let assembled = "";
for await (const event of stream.body) {
  if (event.chunk?.bytes) {
    const partial = JSON.parse(
      Buffer.from(event.chunk.bytes).toString("utf-8")
    );
    assembled += partial.delta?.text ?? "";
  }
}
```

Edge case that bit me: if the stream connection drops mid-response, `assembled` contains a syntactically valid but semantically truncated article section. I added a completion-token sentinel check — if the stop reason isn't `"end_turn"`, the result is discarded and the call retried.

**Throttling was the most operationally painful part.** Bedrock enforces per-model TPM and RPM quotas at the account level — a rogue background job can exhaust your Sonnet RPM budget and starve foreground requests. During a load test, the synthesis stage hit Sonnet's RPM ceiling, the job queue backed up, and the cascade manifested as a 45-second timeout on API Gateway — converting into cold 504s for every in-flight request. I implemented a token-bucket rate limiter with exponential backoff and full jitter.

## Orchestrating the Full Pipeline in TypeScript

Early prototypes used a single orchestrator class — a `StormPipeline` god object that held all state internally. Untestable in isolation, impossible to replay individual stages. I rebuilt around composable async functions with explicit data contracts:

```typescript
interface PerspectiveSet {
  topic: string;
  personas: Persona[];
  generatedAt: string;
}

interface RetrievalContext {
  perspectiveSet: PerspectiveSet;
  retrievedChunks: Record<string, BM25Result[]>; // keyed by persona.id
}

interface SynthesisBundle {
  retrievalContext: RetrievalContext;
  outlines: Record<string, SectionOutline[]>;
  mergedOutline: SectionOutline[];
}
```

Defining these as strict interfaces caught three schema mismatches during a refactor — cases where I'd renamed a field in an upstream stage and the downstream consumer would have silently received `undefined`.

For durable orchestration, each stage runs as a Lambda inside an **AWS Step Functions** state machine. The STORM phases map directly:

```
perspective generation → retrieval → synthesis → writing → editorial review
```

Step Functions handles retry logic declaratively — exponential backoff on Bedrock throttle errors, dead-letter transitions on synthesis failures.

**S3 checkpointing** was the critical production decision. Before each Lambda returns, it writes its full output to a deterministic S3 key:

```typescript
const key = `pipelines/${executionId}/${stageName}/output.json`;
await s3.putObject({ Bucket: CHECKPOINT_BUCKET, Key: key, Body: JSON.stringify(output) });
```

If a downstream stage fails, I resume from the last successful checkpoint rather than starting from scratch. Retrieval running in parallel across personas dropped wall-clock time from ~4 minutes to ~90 seconds on a five-persona run.

## Failure Modes I Hit in Production

### Context Window Overflow in Synthesis

With five personas each retrieving their top-5 documents, synthesis was regularly receiving 25 passage blocks before I'd written a single token. The fix was a deduplication pass using Jaccard similarity across passage trigrams:

```typescript
function deduplicatePassages(passages: string[], threshold = 0.72): string[] {
  return passages.filter((p, i) =>
    passages.slice(0, i).every(prev => jaccardSimilarity(trigrams(p), trigrams(prev)) < threshold)
  );
}
```

This collapsed 25 passages down to 9–12 on average, with no measurable quality regression.

### Persona Collapse

For niche technical topics, the persona generation stage would produce five "experts" who were effectively the same person with different job titles. The fix was an explicit diversity penalty in the persona prompt:

> "Each persona must have a distinct primary concern. No two personas may share the same first-order question. Reject any persona whose core question overlaps with a previously defined persona by more than 30%."

Pairing this with a higher-temperature generation pass (0.9 vs. default 0.7) produced meaningfully differentiated viewpoints.

### BM25 Index Cold-Start Latency

First-request latency after a Lambda cold start: 8–12 seconds, almost entirely spent deserializing the BM25 inverted index from S3. Fix: move the index file to `/tmp` on initialization + a scheduled warm-up ping every 4 minutes. Cold-start time dropped to 1.2 seconds.

### Outline Hallucination Loop

The outline expansion stage occasionally generated section headings referencing concepts that retrieval had never surfaced. I added a grounding check that validates each proposed heading against retrieved passage metadata; any heading with zero metadata coverage gets dropped or rewritten.

## Evaluating Output Quality Without a Human in the Loop

I built an automated eval harness that scores every generated article across four dimensions before it touches the publish queue:

1. **Factual grounding ratio** — what fraction of claims are traceable to a retrieved passage
2. **Structural coherence** — section-to-outline alignment scored against the STORM question tree
3. **Lexical diversity** — MTLD score
4. **Coverage breadth** — percentage of STORM-generated questions that receive a substantive answer

For grounding ratio, I use Claude Haiku as an LLM judge at the sentence level. The key prompt constraint that made it honest:

```
If the claim is supported, you MUST copy the exact substring from the passage 
that supports it. If you cannot find a verbatim span, classify as UNGROUNDED.
```

Haiku can't hallucinate a quoted span that doesn't exist in the passage. This single constraint dropped false positives noticeably.

Regression testing runs against a golden set of 20 reference topics with known ground-truth facts. A grounding ratio drop of more than 5% relative blocks the deploy automatically.

## Architecture Decisions I'd Make Differently

**DynamoDB for the BM25 term frequency store was the wrong call.** BM25 indexing requires scan-heavy update patterns — when a new document arrives, you need to update inverse document frequency across the entire vocabulary. DynamoDB's pricing model punishes full-table scans. If I were starting today I'd use PostgreSQL with a GIN index, probably with `pg_bm25` (ParadeDB's Tantivy-backed BM25 extension).

**Step Functions Express Workflows have a 5-minute execution cap, and I hit it silently.** A "Kubernetes networking internals" article requiring 12 retrieval rounds timed out and returned a partial article with no error surfaced to the caller. I migrated to Standard Workflows (executions up to a year) and accepted the per-state-transition pricing.

**TypeScript interfaces at stage boundaries aren't runtime contracts.** Bedrock responses are `unknown` at runtime and I was casting rather than parsing. Three production bugs traced back to malformed stage outputs that TypeScript's static analysis had no visibility into. A 50-line Zod schema per stage would have caught all three.

**The editorial pass is expensive and often unnecessary.** The final Claude Opus rewrite call accounts for ~40% of per-article token cost. After A/B testing on articles with a grounding ratio above 85%, I found no measurable quality difference when skipping it — dropping total cost per article by 30%.

## What Inkforge Taught Me About Building AI Systems

The most durable lesson: **architecture matters far more than model choice.** Swapping Claude Sonnet for GPT-4 changed the prose style — sentence cadence, bullet list preferences, verbosity on technical asides — but it didn't move the quality ceiling. Adding STORM's research decomposition and BM25-backed retrieval did. The model is a renderer; the pipeline is the design.

The single most impactful engineering decision was adding structured logging to every Bedrock call:

```typescript
logger.info({
  stage: 'synthesis',
  promptHash: hashPrompt(prompt),
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  inputTokens: usage.inputTokens,
  outputTokens: usage.outputTokens,
  latencyMs: Date.now() - startTime,
  outputSample: output.slice(0, 300),
});
```

Before that, debugging a bad article meant re-reading it and guessing. After, it meant querying logs and pinpointing exactly which stage and context degraded quality.

The second insight: **research, synthesis, and writing are cognitively distinct activities.** Conflating them in a single prompt means a single failure propagates everywhere simultaneously. The STORM pipeline enforces that boundary structurally.

I'd also push back on the assumption that cost and quality are in opposition. The changes that most improved output quality — query expansion, passage deduplication, grounding validation — also reduced cost. Good architecture is defect prevention. Defect prevention is cost control.

---

*Inkforge is open source. The full pipeline, BM25 implementation, and eval harness are at [github.com/sairamugge/inkforge](https://github.com/sairamugge/inkforge).*

*Originally published at [anvilry.vercel.app](https://anvilry.vercel.app/notes/how-i-built-inkforge)*
