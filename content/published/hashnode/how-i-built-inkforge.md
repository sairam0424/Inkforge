---
slug: how-i-built-inkforge
title: "How I Built Inkforge: Designing an AI-Powered Article System with STORM Pipeline, BM25 RAG, and AWS Bedrock"
platform: hashnode
status: draft
published_date:
published_url:
canonical_url: https://anvilry.vercel.app/notes/how-i-built-inkforge
publish_note: "Hashnode public API decommissioned June 2026. Publish manually at https://hashnode.com/new. Set originalArticleURL in story settings to canonical_url above."
series: "Building in Public"
hashnode_tags: [TypeScript, AI, AWS, Open Source, Engineering]
reading_time: 14
---

# Hashnode Manual Publish Reference

**Publish at:** https://hashnode.com/new
**originalArticleURL:** https://anvilry.vercel.app/notes/how-i-built-inkforge
**Series:** Building in Public
**Cover:** Upload cover-medium.png (1400×787px)

---

## Article Body (Hashnode-ready — full markdown supported)

*How I built a STORM pipeline + BM25 RAG system on AWS Bedrock to generate structured, grounded long-form technical content — and everything that went wrong.*

---

## The Problem with Naive LLM Article Generation

Most LLM content generators fail in ways that look successful. The first version of Inkforge proved this perfectly — I shipped it in an afternoon, and it worked so well that the problems took weeks to notice.

The output had all the surface characteristics of quality technical writing: confident declarative sentences, reasonable heading hierarchy, even code snippets. But spend five minutes reading carefully and the cracks showed. Every article on "distributed tracing" opened with the same three-sentence definition of spans and traces, hit the same four tool mentions (Jaeger, Zipkin, Datadog, OpenTelemetry), and wrapped with a nearly identical "choose the right tool for your use case" conclusion. The coverage wasn't shallow — it was predictably, reproducibly shallow. I was getting the first two pages of Google search results serialized into prose.

The hallucination problem was worse because it was invisible. During a manual review, I caught a generated article citing `opentelemetry.io/rfcs/trace-context-propagation-v2` for a specific claim about baggage size limits. The URL was plausible — correct domain, versioned path structure, everything. The RFC doesn't exist.

Token window constraints introduced a second failure mode. Anything past ~2,000 words showed coherence degradation in the final third. The model was losing the thread.

I spent two weeks trying to engineer my way out of this through prompt refinement. Better instructions, more examples, stronger disclaimers — none of it fixed the fundamental problem: I was asking the model to be a researcher and a writer simultaneously. **The architecture was the problem, not the prompt.**

---

## Discovering STORM: Research Before Writing

The Stanford STORM paper landed when I'd already burned enough time on prompt engineering to know it wouldn't help. The core observation — that expert writing is preceded by structured research across multiple viewpoints, not a single top-down drafting pass — felt obvious in retrospect.

**STORM** (Synthesis of Topic Outlines through Retrieval and Multi-perspective questioning) decomposes long-form generation into four sequential phases: perspective generation, question-driven retrieval, grounded synthesis, and writing. The sequencing *is* the point. By the time you touch a drafting model, every claim has a retrieval trace behind it.

Single-pass generation conflates researcher, editor, and writer into one inference call. That's why you get fluent text that's factually thin — the model is optimizing for prose quality while simultaneously trying to reason about coverage gaps it doesn't know it has.

I adapted STORM's persona simulation loop specifically for engineering content. For each article topic, Inkforge generates 4–5 synthetic expert reviewers drawn from role archetypes relevant to the domain. For a topic like "Kafka consumer group rebalancing":

- The **platform engineer** asks about partition assignment strategies, cooperative vs. eager rebalancing protocols, and `group.initial.rebalance.delay.ms` tuning.
- The **streaming data architect** focuses on back-pressure implications, consumer lag spikes during rebalance windows, and idempotency requirements at the application layer.
- The **SRE** immediately goes to failure modes: what happens when a consumer crashes mid-rebalance, how heartbeat timeouts interact with `session.timeout.ms` under GC pressure.

Those three lenses produce a question corpus that shapes retrieval queries → grounding context → final article structure. Without them, you get a competent Wikipedia summary. With them, you get something that reads like it was written by someone who's actually operated Kafka at scale.

I accepted the cost trade-off early. STORM adds 5–10x latency and LLM call overhead compared to single-shot generation. For Inkforge's use case — quality technical reference content — that's a reasonable exchange.

---

## Building the BM25 Retrieval Layer

Dense vector embeddings were the obvious default. I spent a weekend prototyping a FAISS-based retrieval layer with Titan Embeddings before stepping back and asking whether the complexity was justified. For Inkforge's corpus — roughly 30–40k documents — BM25 made more sense:

- **Deterministic**: debugging a bad retrieval result means reading term frequencies, not interrogating a 1536-dimensional vector space
- **No embedding inference cost** per query
- **Sub-second latency** on corpora under ~50k documents without caching tricks

The BM25 implementation lives entirely in TypeScript. The index structure stores per-term frequency maps in DynamoDB and the inverted index serialized as JSON in S3. At query time, the hot path loads only the IDF table into memory; term frequency lookups are batched DynamoDB reads. Cold start ~400ms; warm retrieval against 35k chunks ~180ms.

```typescript
async function retrieve(question: string, topK = 20, topN = 5): Promise<Passage[]> {
  const expandedQuery = await expandQuery(question); // LLM expansion pass
  const candidates = await bm25Search(expandedQuery, topK);
  const reranked = await rerankWithHaiku(question, candidates);
  return reranked.slice(0, topN);
}
```

### Query Expansion

BM25 scoring degrades badly on short queries — anything under four or five tokens. The fix was an LLM pre-pass:

`Bedrock invoke model timeout` → `AWS Bedrock InvokeModel API request timeout configuration retry policy`

On a held-out eval set of 150 questions, recall at K=20 jumped from **61% to 89%** after adding this step.

### Version-Aware Retrieval

AWS SDK v2 and v3 have meaningfully different APIs. Early runs produced articles mixing v2 `AWS.config` patterns with v3 `@aws-sdk/client-*` idioms in the same paragraph. The fix: each indexed chunk carries a `docVersion` metadata field, and retrieval filters by version tag before scoring.

---

## Integrating AWS Bedrock: Model Selection, Routing, and Cost Control

Bedrock's value is a single API contract across a roster of foundation models, letting you route pipeline stages to cost-appropriate models without re-architecting your client layer.

**Three-tier routing:**

| Stage | Model | Rationale |
|---|---|---|
| Re-ranking + outline expansion | Claude Haiku | High-volume, low-complexity; ~1/15th the cost of Opus |
| Synthesis | Claude Sonnet | Coherence matters here |
| Editorial review | Claude Opus | Final quality gate only |

### Streaming Was Non-Negotiable

I started with synchronous `InvokeModel`. Synthesis calls blocking for 18–22 seconds made the UI feel broken. Switching to `InvokeModelWithResponseStream` dropped perceived latency to near-zero:

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

The edge case that bit me: dropped connections produce syntactically valid but semantically truncated output with no error. I added a completion-token sentinel check — if stop reason isn't `"end_turn"`, discard and retry.

### Throttling and Rate Limiting

Bedrock enforces per-model TPM/RPM quotas at the account level. During a load test, the synthesis stage hit Sonnet's RPM ceiling, the job queue backed up, and the cascade manifested as a 45-second timeout on API Gateway — converting to cold 504s for every in-flight request. I implemented a token-bucket rate limiter with exponential backoff and full jitter.

### IAM Scoping

My staging environment had `bedrock:InvokeModel` with a wildcard resource. The corrected policy scopes to explicit model ARNs:

```
arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet*
```

A misconfigured routing decision can no longer silently invoke a model outside the approved set.

---

## Orchestrating the Full Pipeline in TypeScript

Early prototypes used a `StormPipeline` god object — untestable in isolation, impossible to replay individual stages. I rebuilt around composable async functions with explicit data contracts:

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

async function generatePerspectives(topic: string): Promise<PerspectiveSet> { ... }
async function retrieveForPersonas(ps: PerspectiveSet): Promise<RetrievalContext> { ... }
async function synthesizeOutline(rc: RetrievalContext): Promise<SynthesisBundle> { ... }
```

Defining strict interfaces caught three schema mismatches during a refactor — cases where I'd renamed a field upstream and the downstream consumer would have silently received `undefined`.

### AWS Step Functions for Durable Orchestration

Each stage runs as a Lambda inside a Step Functions state machine. Retry logic and error catches live in the state machine definition — exponential backoff on Bedrock throttle errors, dead-letter transitions on synthesis failures.

**S3 checkpointing** is the critical production decision. Before each Lambda returns, it writes its full output to a deterministic key:

```typescript
const key = `pipelines/${executionId}/${stageName}/output.json`;
await s3.putObject({ Bucket: CHECKPOINT_BUCKET, Key: key, Body: JSON.stringify(output) });
```

If a downstream stage fails, I resume from the last successful checkpoint. Retrieval running in parallel across personas dropped wall-clock time from ~4 minutes to ~90 seconds on a five-persona run.

---

## Failure Modes I Hit in Production

### Context Window Overflow in Synthesis

Five personas × top-5 documents = 25 passage blocks before writing a single token. Fix — deduplication via Jaccard similarity on passage trigrams:

```typescript
function deduplicatePassages(passages: string[], threshold = 0.72): string[] {
  return passages.filter((p, i) =>
    passages.slice(0, i).every(prev => jaccardSimilarity(trigrams(p), trigrams(prev)) < threshold)
  );
}
```

Collapsed 25 passages down to 9–12 on average with no measurable quality regression.

### Persona Collapse

For niche technical topics, persona generation would produce five "experts" who were effectively the same person with different job titles. Fix — explicit diversity penalty in the persona prompt:

> "Each persona must have a distinct primary concern. No two personas may share the same first-order question. Reject any persona whose core question overlaps with a previously defined persona by more than 30%."

Paired with higher-temperature generation (0.9 vs. 0.7).

### BM25 Index Cold-Start Latency

First-request latency after Lambda cold start: 8–12 seconds. Fix — move the index to `/tmp` on initialization + scheduled warm-up ping every 4 minutes. Cold-start time dropped to 1.2 seconds.

### Outline Hallucination Loop

The outline expansion stage occasionally generated section headings referencing concepts retrieval had never surfaced. Fix — a grounding check that validates each proposed heading against retrieved passage metadata; zero-coverage headings get dropped or rewritten.

---

## Evaluating Output Quality Without a Human in the Loop

Four metrics gate every article before it touches the publish queue:

1. **Factual grounding ratio** — fraction of claims traceable to a retrieved passage
2. **Structural coherence** — section-to-outline alignment against the STORM question tree
3. **Lexical diversity** — MTLD score
4. **Coverage breadth** — percentage of STORM questions receiving substantive answers

The grounding check uses Claude Haiku as a sentence-level judge with one key constraint:

```
If the claim is supported, you MUST copy the exact substring from the passage 
that supports it. If you cannot find a verbatim span, classify as UNGROUNDED.
```

Haiku can't hallucinate a quoted span that doesn't exist. False positives dropped noticeably.

Regression testing runs against a golden set of 20 reference topics. A grounding ratio drop of more than 5% relative blocks the deploy automatically. After adding AWS re:Post threads to the corpus, grounding ratio on infrastructure topics jumped from 74% to 88% — the harness detected the improvement and auto-promoted the new index version.

---

## Architecture Decisions I'd Make Differently

**DynamoDB for BM25 term frequency storage was wrong.** BM25 indexing requires scan-heavy update patterns that DynamoDB's pricing punishes. I'd use PostgreSQL with a GIN index and `pg_bm25` (ParadeDB's Tantivy-backed extension) from day one.

**Step Functions Express Workflows have a 5-minute execution cap.** A complex article silently timed out and returned a partial result with no error surfaced to the caller — three complete sections and four empty ones, and the caller had no idea. Migrated to Standard Workflows.

**TypeScript interfaces aren't runtime contracts.** Bedrock responses are `unknown` at runtime and I was casting rather than parsing. Three production bugs traced back to malformed stage outputs. A 50-line Zod schema per stage would have caught all three.

**The editorial pass is expensive and often unnecessary.** The Claude Opus rewrite call accounts for ~40% of per-article token cost. After A/B testing on articles with grounding ratio above 85%, I found no measurable quality difference when skipping it — dropping total cost per article by 30%.

---

## What Inkforge Taught Me About Building AI Systems

**Architecture matters far more than model choice.** Swapping Claude Sonnet for GPT-4 changed the prose style — it didn't move the quality ceiling. Adding STORM's research decomposition did. The model is a renderer; the pipeline is the design.

**The single most impactful engineering decision** was adding structured logging to every Bedrock call:

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

Before: debugging a bad article meant re-reading it and guessing. After: querying logs and pinpointing exactly which stage and context degraded quality. Regression debugging went from hours to minutes.

**Cost and quality are usually aligned.** The changes that most improved output quality — query expansion, passage deduplication, grounding validation — also reduced cost. They catch failures early, before they trigger expensive downstream re-runs. Good architecture is defect prevention. Defect prevention is cost control.

---

*Inkforge is open source. Full pipeline, BM25 implementation, and eval harness at [github.com/sairamugge/inkforge](https://github.com/sairamugge/inkforge).*

*Part of the [Building in Public](#) series.*
*Originally published at [anvilry.vercel.app](https://anvilry.vercel.app/notes/how-i-built-inkforge)*
