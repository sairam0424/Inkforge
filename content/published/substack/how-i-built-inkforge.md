---
slug: how-i-built-inkforge
title: "How I Built Inkforge: The System That Writes My Technical Articles"
platform: substack
status: draft
paste_workflow: "Open substack.com/new → click body area → Cmd+V to paste rendered HTML. Run: python3 /tmp/render-substack.py (update MD_PATH to this file)"
---

<!-- GIF: show the article generation pipeline in action — terminal output flowing through stages -->

I wanted to write more. So I built a system that would write *for* me.

Then I spent three months fixing the system, which turned out to be harder than just writing.

That's Inkforge in a sentence — an AI article generation system I built because I had a backlog of engineering topics I wanted to cover and a realistic sense of how much time I actually had for writing. What I didn't have was a realistic sense of how hard it would be to make AI-generated content that I'd actually want to put my name on.

## The Part Where the First Version Worked Perfectly and Was Also Terrible

The first version of Inkforge took an afternoon to build. You gave it a topic, it called Claude, it returned an article. The articles looked good. They had the right structure, the right tone, even code snippets.

It took me about two weeks to notice the problem.

Every article it generated had a quality I can only describe as *confidently generic*. Write about distributed tracing? You'd get three sentences about spans and traces, four tool mentions (Jaeger, Zipkin, Datadog, OpenTelemetry — always those four), and a conclusion so hedged it said nothing. The coverage wasn't shallow in the way a first draft is shallow. It was *systematically* shallow, in a way that would require effort to make worse.

The hallucination problem was subtler and scarier. I caught one article citing a specific RFC for a claim about baggage size limits in OpenTelemetry. The URL looked completely real — correct domain, versioned path, plausible numbering. The RFC didn't exist. The claim wasn't even technically wrong; it just wasn't sourced from anything real. If that had shipped, it would have looked authoritative and been unfalsifiable without checking every single link.

I spent two weeks trying to fix this with better prompts. Didn't help. The architecture was the problem.

<!-- GIF: prompt engineering frustration → building something new -->

## The Research Insight That Changed Everything

The Stanford STORM paper landed at exactly the right moment. The core idea sounds obvious once you hear it: expert writing is preceded by structured research across multiple viewpoints. You don't sit down and draft — you investigate, question, gather evidence, *then* write.

Single-pass generation asks the model to be a researcher, editor, and writer simultaneously in one inference call. That's why you get fluent text that's factually thin — the model is optimizing for prose quality while simultaneously trying to reason about coverage gaps it doesn't know it has.

STORM's answer is to decompose the process:

1. Generate expert personas relevant to the topic
2. Each persona surfaces questions from their angle
3. Use those questions to drive retrieval against a real knowledge source
4. Synthesize the retrieved evidence into an outline
5. Write from the outline, with grounded context in the window

I adapted this specifically for engineering content. For each article, Inkforge generates four or five synthetic expert reviewers — a platform engineer, a streaming architect, an SRE, whatever makes sense for the domain. Each pulls in a completely different direction before any retrieval happens.

For an article on Kafka consumer group rebalancing, the SRE immediately asks about failure modes — what happens when a consumer crashes mid-rebalance, how heartbeat timeouts interact with GC pressure. The streaming architect focuses on back-pressure implications and idempotency. The platform engineer wants specifics on `group.initial.rebalance.delay.ms` tuning.

Those three lenses produce a completely different article than a generic "explain Kafka rebalancing" prompt. One reads like someone who's operated the system. The other reads like someone who's read the documentation.

The cost trade-off is real: STORM adds 5–10x latency and LLM call overhead compared to single-shot generation. For Inkforge, that's acceptable. A reader bouncing off a shallow article is a worse outcome than waiting thirty extra seconds.

## The Retrieval Problem (And Why I Didn't Use Vector Embeddings)

The obvious choice for retrieval in 2024 is dense vector embeddings — FAISS, Chroma, whatever. I spent a weekend prototyping this with Amazon Titan Embeddings before asking myself whether the complexity was justified.

For Inkforge's corpus — AWS documentation, engineering blog posts, RFC texts, roughly 30–40k documents — BM25 actually makes more sense. It's deterministic, so when retrieval produces a bad result I can debug it by reading term frequencies rather than interrogating a 1536-dimensional vector space. There's no embedding inference cost per query. And on this corpus size, BM25 hits sub-second latency without tricks.

The retrieval pipeline ended up looking like this:

```typescript
async function retrieve(question: string, topK = 20, topN = 5): Promise<Passage[]> {
  const expandedQuery = await expandQuery(question); // LLM expansion pass
  const candidates = await bm25Search(expandedQuery, topK);
  const reranked = await rerankWithHaiku(question, candidates);
  return reranked.slice(0, topN);
}
```

The `expandQuery` step was born from pain. BM25 degrades badly on short queries — anything under four or five tokens. "Bedrock invoke model timeout" becomes "AWS Bedrock InvokeModel API request timeout configuration retry policy" before the index sees it. Recall at K=20 jumped from 61% to 89% after adding this step on my eval set.

The reranker is a lightweight Claude Haiku call scoring each of the 20 pre-fetched candidates for relevance to the original question. Haiku is about 15x cheaper than Opus for this kind of classification task and plenty accurate enough.

## What Running This on AWS Actually Taught Me

I want to be honest about the parts that hurt.

AWS Bedrock throttles per-model TPM and RPM at the account level — meaning a background job can exhaust your Sonnet quota and starve foreground requests. During a load test, I hit Sonnet's RPM ceiling, the job queue backed up, and every in-flight article request got a cold 504. I implemented a token-bucket rate limiter with exponential backoff. That made throttle errors recoverable rather than fatal.

The streaming API switch was obvious in retrospect. Synchronous `InvokeModel` was blocking for 18–22 seconds on 2,000-word synthesis calls. Switching to streaming (`InvokeModelWithResponseStream`) dropped perceived latency to near-zero. The edge case that bit me: if the connection drops mid-stream, you get a syntactically valid but semantically truncated section with no error raised. Added a sentinel check — if the stop reason isn't `"end_turn"`, discard and retry.

AWS Step Functions Express Workflows have a 5-minute execution cap. I hit this silently. A complex article with 12 retrieval rounds timed out and returned a partial result with no error surfaced to the caller. My API response contained three complete sections and four empty ones. The caller had no idea. I migrated to Standard Workflows (up to a year), accepted the higher per-state-transition cost, and added an explicit completion check.

Every one of these was a production incident before it was a lesson.

## The Part That Actually Worked: Evaluating Without a Human

Shipping without human review meant I needed automated quality signal I could trust. I built an eval harness that scores every generated article across four dimensions before it touches the publish queue:

- **Factual grounding ratio**: what fraction of claims are traceable to a retrieved passage
- **Structural coherence**: section alignment against the STORM outline
- **Lexical diversity**: MTLD score
- **Coverage breadth**: percentage of STORM questions that get substantive answers

The grounding check uses Claude Haiku as a sentence-level judge with one key constraint: if the claim is supported, it must copy the exact substring from the passage that supports it. If it can't find a verbatim span, it classifies as ungrounded. Haiku can't hallucinate a span that doesn't exist. That single constraint made the check structurally honest.

This harness caught a real regression when I updated the retrieval corpus. It also caught a real improvement — after adding AWS re:Post threads, grounding ratio on infrastructure topics jumped from 74% to 88%. The harness detected the improvement, flagged it, and auto-promoted the new index version. No human review needed in either direction.

<!-- GIF: eval harness green/red status board across multiple article runs -->

## What I Actually Learned About Building With AI

The most durable lesson from this project: **architecture matters far more than model choice.** Swapping Claude Sonnet for GPT-4 changed the prose style. Adding STORM's research decomposition changed the quality ceiling. The model is a renderer. The pipeline is the design.

The second lesson is harder to internalize: **cost and quality are usually aligned, not opposed.** The changes that most improved output quality — query expansion, passage deduplication, grounding validation — also reduced cost. They work by catching failures early, before they trigger expensive downstream re-runs. Good architecture is defect prevention. Defect prevention is cost control.

The third is the most practical: **instrument everything before you need to debug anything.** Adding structured logging to every Bedrock call — prompt hash, model ID, token counts, latency, stage label, output sample — transformed debugging from "re-read the article and guess" to "query logs and find the exact stage where quality degraded." Regression debugging went from hours to minutes.

I started this project wanting to write more. I ended up spending most of my time building the infrastructure that makes writing at this quality level possible. The articles Inkforge generates are ones I'd write myself — not because the model writes like me, but because the pipeline forces the same research depth I'd apply manually.

Whether that's the right trade-off is a question I'm still working through.

---

*Inkforge is open source. The full pipeline, BM25 implementation, and eval harness are at [github.com/sairamugge/inkforge](https://github.com/sairamugge/inkforge).*

*Full technical deep-dive at [anvilry.vercel.app](https://anvilry.vercel.app/notes/how-i-built-inkforge).*

---

**What systems have you built to extend your own capacity to write or think? I'm curious whether people lean toward tooling vs. just writing more — hit reply.**
