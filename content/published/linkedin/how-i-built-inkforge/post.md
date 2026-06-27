---
slug: how-i-built-inkforge
title: "How I Built Inkforge: An AI Article Generation System"
platform: linkedin
status: draft
carousel_slides: 0
published_date:
published_url:
---

I wanted to write more. So I built a system that would write FOR me. Then I had to decide which part was actually mine.

That's Inkforge — an open-source AI article generation system I built because I had a backlog of engineering topics I wanted to cover and a realistic sense of how much time I had for writing.

The first version took an afternoon. The articles looked great. The problems took weeks to show up.

Every article came out confidently generic — the same four tools mentioned, the same hedged conclusion, the same first-two-pages-of-Google-serialized-into-prose quality. And there were hallucinated citations that *looked* completely real.

The fix wasn't better prompts. It was a completely different architecture.

Inkforge now runs a STORM pipeline — a Stanford research approach that decomposes article generation into distinct phases: perspective generation, question-driven retrieval, grounded synthesis, then writing. Before the model drafts a single word, it's generated multiple expert personas for the topic, each asking different questions, driving retrieval against a real BM25-indexed knowledge source. The model doesn't hallucinate structure — it organizes evidence that already exists in the context window.

The retrieval layer is BM25 (not vector embeddings — deterministic, debuggable, sub-second on a 35k-chunk corpus, zero embedding cost per query). Everything runs on AWS Bedrock with a three-tier model routing scheme: Haiku for classification and re-ranking, Sonnet for synthesis, Opus for final editorial review only.

The result: articles that read like they were written by someone who's operated the system — not someone who's read the documentation.

What I actually learned building this: architecture matters far more than model choice. Swapping Claude for GPT-4 changed the prose style. Adding the STORM pipeline changed the quality ceiling. The model is a renderer. The pipeline is the design.

Inkforge is open source. If you're building content infrastructure or just want to see how a multi-stage AI pipeline works in production, everything's at the link below.

Full deep-dive: https://anvilry.vercel.app/notes/how-i-built-inkforge
GitHub: https://github.com/sairamugge/inkforge

#BuildingInPublic #OpenSource #AI #TypeScript
