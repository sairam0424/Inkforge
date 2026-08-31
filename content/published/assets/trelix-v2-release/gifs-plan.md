# trelix v2.7.0 (Dev.to) — GIF Asset Plan

Article: "trelix v1.0 to v2.7: When 'It Works' Meets 'It Scales'"
Platform target: Dev.to (native markdown, embed via `![alt text](giphy_url)` on its own line)

---

## GIF 1 — Hero / Article Open (the decoy-config feeling)

**Concept:** Something that looks correctly set up but is silently ignoring you — a dial being turned that has no effect, a control panel where nothing responds, or the classic "it's plugged in but nothing happens" confusion.

**Giphy search keywords:**
- `confused this is fine nothing works`
- `turning knob no effect confused`
- `it should be working why isnt it`
- `programmer confused debugging screen`
- `wait what happened confused math`

**Article placement:** Top of article, immediately after the opening paragraph about the `AdaptiveRouter` config bug, before the "That fix landed in v2.7.0..." paragraph.

**Caption text:**
> The exact feeling of setting a config override and watching the system quietly ignore it anyway.

---

## GIF 2 — Knowledge Graph (connecting the dots)

**Concept:** A web or network of connections lighting up, nodes linking together, a detective board with string connecting clues — visualizing "flat list becomes a connected graph."

**Giphy search keywords:**
- `network graph connections lighting up`
- `connecting the dots detective board`
- `web of connections forming`
- `nodes linking network animation`
- `mapping connections investigation`

**Article placement:** In "From flat search to a knowledge graph," right after the paragraph introducing `CodeGraph` as a `NetworkX MultiDiGraph`.

**Caption text:**
> From a flat symbol list to a traversable graph — modules cluster, and the graph knows which symbols actually matter.

---

## GIF 3 — Seven Retrieval Legs (things converging / fusion)

**Concept:** Multiple streams merging into one, several paths converging on a single point, puzzle pieces coming together — reinforcing "seven separate signals fused into one ranking."

**Giphy search keywords:**
- `multiple streams merging into one`
- `puzzle pieces coming together fitting`
- `paths converging one point`
- `assembling pieces together animation`
- `voltron combining forming one`

**Article placement:** In "Seven legs, one fusion function," after the paragraph listing the RAPTOR/HyDE/multi-query legs, before the FLARE paragraph.

**Caption text:**
> Seven independent retrieval signals, one Reciprocal Rank Fusion pass — no single leg has to be right on its own.

---

## GIF 4 — Agentic Loop (an agent deciding to act)

**Concept:** A character or system pausing mid-task, thinking, then deciding to take another action instead of just answering immediately — "let me check one more thing" energy.

**Giphy search keywords:**
- `wait let me check something thinking`
- `robot thinking deciding what to do`
- `hold on one more thing`
- `pause and reconsider thinking gif`
- `ai agent computer thinking processing`

**Article placement:** In "Teaching it to act, not just retrieve," right after the sentence describing the CodeAct-style ReAct loop deciding it needs another lookup.

**Caption text:**
> Instead of one retrieval-then-answer pass, the agent can decide it needs to look again before committing to an answer.

---

## GIF 5 — DimensionGuard (the silent-failure save)

**Concept:** A near-miss being caught just in time — a guard rail stopping something from going over an edge, a safety net catching a fall, a red warning light flashing right before disaster.

**Giphy search keywords:**
- `caught just in time safety net`
- `guard rail stopping fall`
- `close call near miss saved`
- `warning light flashing danger`
- `stopped right before disaster`

**Article placement:** In "Production hardening: guards built before the bugs happened," right after the sentence explaining that mismatched embedding dimensions don't crash, they just return quietly wrong results.

**Caption text:**
> The failure mode DimensionGuard exists to prevent: no crash, no stack trace — just a confidently wrong answer.

---

## GIF 6 — Federation / Finding the Twin (multiple repos, one search)

**Concept:** Searching across many places at once and finding a match — a magnifying glass sweeping across multiple screens/windows simultaneously, or twins/matching pairs being identified in a lineup.

**Giphy search keywords:**
- `searching multiple screens at once`
- `finding the match spot the difference`
- `twins matching pair found`
- `scanning multiple sources simultaneously`
- `parallel search multiple windows`

**Article placement:** In "Federation, and finding your code's twin," after the paragraph introducing `DiffEmbedder` and `search_similar_diffs()`.

**Caption text:**
> Federated search across every registered repo, and a diff-similarity search that finds your code's closest historical twin.

---

## GIF 7 — CTA / Close (steady, disciplined restraint)

**Concept:** Something being deliberately held back or kept simple despite the temptation to add more — a minimalist "less is more" moment, or someone calmly declining to overcomplicate something.

**Giphy search keywords:**
- `keep it simple minimalist`
- `less is more calm`
- `no thanks im good simple`
- `steady as she goes calm`
- `disciplined restraint calm nod`

**Article placement:** Near the end, in "Scale work, and holding the frontier to a real bar," right before the closing paragraph about every new feature being opt-in behind a flag that defaults to off.

**Caption text:**
> Seven retrieval legs, a knowledge graph, an agentic loop, and federation — and the infrastructure footprint never grew. Every new layer ships off by default.

---

## Notes for Giphy selection

- Prefer looping GIFs (seamless loop), under 3MB for Dev.to page load performance
- Dev.to markdown: `![alt text](https://media.giphy.com/media/[ID]/giphy.gif)` on its own line
- Prefer dark-background or transparent GIFs to match the technical/dev-tool tone — avoid bright, cartoonish options
- Avoid GIFs with text overlays that would clash with the caption text above
- Giphy direct GIF URL format: `https://media.giphy.com/media/[ID]/giphy.gif`
