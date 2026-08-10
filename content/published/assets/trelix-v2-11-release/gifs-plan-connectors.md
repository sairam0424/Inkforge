# Trelix v2.11.0 — Jira/Linear Connectors (Dev.to) — GIF Asset Plan

Article: "Trelix v2.11.0: Jira and Linear Now Live Inside the Code Graph" (connectors-first rewrite)
Platform target: Dev.to (native markdown, embed via `![alt text](giphy_url)` on its own line)

This plan replaces the earlier 7-GIF plan written for the previous, security-bug-framed draft of this same release (`gifs-plan.md` in this same asset folder). That file covered a different article structure (path-traversal hero, retry storms, etc.) and is now stale — kept for reference, not for use with the current article body. This file was sourced by 6 specialized agents in parallel, one per section of the rewritten article, each independently searching Giphy and verifying its own pick via WebFetch. Two rounds of duplicate/fit conflicts were caught and resolved during review — see notes at the bottom.

---

## GIF 1 — Hero / Article Open (two disconnected systems finally connecting)

**Concept:** Code and "the work" (tickets) have always lived in two separate systems that never talked to each other — this release is the one where they finally connect. A git merge is a literal, on-the-nose visual for two previously separate branches becoming one.

**Verified GIF:** "Git Merge" GIF
- Page: https://giphy.com/gifs/git-merge-cFkiFMDg3iFoI
- Direct: `https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWpkdDAxMHJ1Zmg5a2l5d2tpajZzZnRraDE2cmFuN2Q0bThlbzBrciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cFkiFMDg3iFoI/giphy.gif

**Article placement:** Top of article, right after the opening two paragraphs (the `_verify_auth` anecdote and "Code and 'the work' have always lived in two systems that never talk to each other").

**Caption text:**
> Code and tickets finally merge into one system.

---

## GIF 2 — One Interface, Four Connectors (uniform contract, automatic downstream action)

**Concept:** Four different integrations (Jira, Linear, Xray, TestRail) all implement the exact same two-method interface, and syncing automatically triggers linking — no manual step. Interlocking gears meshing together visualize "when one part moves, the connected parts move with it automatically."

**Verified GIF:** "Loop Processing" (gears/cooperation) GIF by bigblueboo
- Page: https://giphy.com/gifs/ToMjGpDvCkRu9lHREUE
- Direct: `https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZG56aXdtN3AzbWh5NjM4ZXc4ZjRhMWdrZnBuc21hbjI5eXNyaWl0OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ToMjGpDvCkRu9lHREUE/giphy.gif

**Article placement:** In "One interface, four connectors," right after the paragraph explaining `sync()`'s auto-link behavior (the `linker.link_one()` call inside the loop).

**Caption text:**
> Four connectors, one interface. When `sync()` returns, every downloaded item is already linked into the knowledge graph — the gears just mesh.

---

## GIF 3 — Jira vs Linear (same contract, opposite platforms)

**Concept:** Both connectors satisfy the identical interface while being built completely differently underneath (REST/Basic-auth/ADF vs. GraphQL/no-Bearer-prefix/complexity-budgets) — a "same shape, different substance" contrast, not a dilemma or indecision.

**Verified GIF:** "different" GIF (from gifntext.com)
- Page: https://giphy.com/gifs/different-UI7EYk96rzq24
- Direct: `https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnZlZnhuM2RqNzJla3g2a3phMmI2NjN5dWJiNmY1YXY5ZHk2d3VieSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UI7EYk96rzq24/giphy.gif

**Caveat:** this GIF's exact visual content wasn't fully described during verification (only its title/tag, not a confirmed on-screen action) — confirmed to exist and load, but eyeball it yourself before publishing in case the actual animation doesn't read clearly at a glance. If it doesn't land, search "versus" or "twins" for a backup.

**Article placement:** In "Jira and Linear: same contract, opposite platforms," right after the paragraph introducing the section (before the Jira REST/ADF details begin).

**Caption text:**
> Same interface, completely different underneath.

---

## GIF 4 — ArtifactLinker Precision (filtering signal from noise)

**Concept:** The matching system deliberately excludes ~40 common English/programming words from bare-name matching so a ticket saying "the test failed to run" doesn't spuriously link to functions named test/run — a sieve that catches the right things and lets noise pass through.

**Verified GIF:** "Hands Reduce" GIF by Common Ground Compost (hands sorting/sifting material)
- Page: https://giphy.com/gifs/CommonGroundCompost-garbage-sorting-sifting-z1S4gUzt5YZQlwT2Pa
- Direct: `https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHliMjVqOWl6cjFqN3ZzNTZxeHZ1bHN2NzFkbWNjbjlhcnF3eWx0ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/z1S4gUzt5YZQlwT2Pa/giphy.gif

**Article placement:** In "What actually makes a synced ticket useful," right after the sentence describing `_COMMON_WORD_STOPLIST` and the "the test suite failed to run and update the process" example.

**Caption text:**
> The exclusion list acts as a sieve — ordinary words like "test" and "run" pass through, while real function names get caught and linked.

---

## GIF 5 — Xray/TestRail (the abstraction generalizes)

**Concept:** The same interface built for ticket trackers turned out to also work cleanly for test-management platforms with zero changes — one template producing consistent, structurally identical results across different domains.

**Verified GIF:** "Satisfying Assembly Line" GIF by Ricky Trickartt
- Page: https://giphy.com/gifs/11LK0CKzYtkaic
- Direct: `https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2NuenBqaGh1amxidmVtZGNoNDB6Y21reTNwamFyZzExdDRhbzEzdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/11LK0CKzYtkaic/giphy.gif

**Article placement:** In "Xray and TestRail: proving the abstraction generalizes," right after the opening sentence of the section.

**Caption text:**
> One interface, four systems. The abstraction built for ticket tracking fit test-management platforms without a single changed line — same template, different products rolling off the line.

---

## GIF 6 — The Plumbing Underneath (unglamorous supporting infrastructure)

**Concept:** Retry logic, structured logging, and a ranking tweak are the unglamorous, necessary infrastructure behind the headline feature — the hidden technical specification layer that makes the visible thing actually work in production.

**Verified GIF:** Civil engineering blueprint/drafting footage, University of Victoria
- Page: https://giphy.com/gifs/3gIJALnQCmCFpQqKop
- Direct: `https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2wyOHkycmRobnA2bzBmMGowc3dodTRzN2s1OXBodnZjZm9xZWk1NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3gIJALnQCmCFpQqKop/giphy.gif

**Article placement:** In "The plumbing underneath," right after the opening sentence establishing this section is support material, not the headline.

**Caption text:**
> The blueprints underneath: retry logic, structured logging, and a ranking tweak — the technical specifications that make connectors reliable, not just working.

---

## Notes for Giphy selection

- Prefer looping GIFs (seamless loop), under 3MB for Dev.to page load performance
- Dev.to markdown: `![alt text](https://media.giphy.com/media/[ID]/giphy.gif)` on its own line — or paste the `giphy.com/gifs/...` page URL on its own line, which Dev.to auto-embeds
- All 6 links above were verified as real, existing Giphy pages via WebFetch before inclusion
- No dedicated GIF for the closing section ("What this actually unlocks") — kept deliberately quiet, matching the pattern from the prior v2.9.0/v2.11.0 plans of not forcing a GIF into every single section
- Conflicts caught and resolved during sourcing:
  - GIF 1's first candidate (a puzzle-piece GIF) was already suggested to the user earlier in this conversation for a different article's section — swapped for the git-merge GIF to keep picks distinct across the series
  - GIF 3's first candidate (a "conflicted decision-making" GIF) read as indecision/hesitation rather than the intended neutral "same contract, different implementation" contrast — swapped for a "different" GIF instead
  - GIF 4's first candidate (a spinning dartboard) read as hypnotic randomness rather than precision — swapped for a hands-sorting GIF
  - GIF 6's first candidate (planetary gears) visually overlapped with GIF 2's interlocking-gears pick within the same article — swapped for civil engineering blueprints to keep the two "infrastructure" beats visually distinct
- Cross-checked against every GIF already used in `trelix-v2-release`, `trelix-v2-9-release`, `tombstone-v1-4-release`, and this same article's earlier (now-stale) `gifs-plan.md` — none of the 6 final picks above duplicate a prior article's asset
