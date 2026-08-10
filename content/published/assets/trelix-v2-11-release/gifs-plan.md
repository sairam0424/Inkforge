# trelix v2.10.0-v2.11.0 (Dev.to) — GIF Asset Plan

Article: "trelix v2.10.0-v2.11.0: I Shipped an Unauthenticated Path-Traversal Bug in the Same Release That Shipped the Auth to Prevent It"
Platform target: Dev.to (native markdown, embed via `![alt text](giphy_url)` on its own line)

Sourced by 7 specialized agents in parallel, one per section, each independently searching Giphy and verifying its own pick via WebFetch before reporting back. One duplicate was caught and resolved during review (two agents independently converged on the same network-animation GIF for two different sections) and one cross-article duplicate was caught against the trelix v2.9.0 article's plan.

---

## GIF 1 — Hero / Article Open (the auth that wasn't turned on)

**Concept:** The security feature existed but wasn't actually engaged — not a missing lock, a lock that fails to click shut. Matches the opening beat exactly: the auth feature shipped in the same release as the bug it should have gated, but was off by default.

**Verified GIF:** "Fail Gate" — a gate padlock visibly failing to engage (real footage, not stock/stunt content)
- Page: https://giphy.com/gifs/fail-gate-Skx32VOazLRMk
- Direct: `https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXpnaTJ5Y3MzZzM0N3dsM3E1eGZrbTFxdmwwanV6bDE5cjExanhociZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Skx32VOazLRMk/giphy.gif

**Article placement:** Top of article, immediately after the opening paragraph describing the `/parse` endpoint and the "Security" changelog section with exactly one entry.

**Caption text:**
> The security feature was there. It just wasn't turned on.

---

## GIF 2 — Retry Storms (running in place, effort multiplying)

**Concept:** A hamster wheel — expending effort in a loop without actually escaping it, which fits the retry-stacking failure mode better than a straight cascade: the danger isn't one thing triggering the next, it's the same failure spinning in place and multiplying (retries × retries) rather than making progress.

**Verified GIF:** "Hamster Wheel" GIF
- Page: https://giphy.com/gifs/hamster-roborovski-bouledeup-R29bZRi2ximJhWfIui
- Direct: `https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnVmNmR0dDdlZHBnZTl4bDhjODNubjRwMmwyZ2lwZzRrbjE2M2lvcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/R29bZRi2ximJhWfIui/giphy.gif

**Article placement:** In "Retry storms and log lines that finally agree with each other," right after the sentence describing the retries×retries multiplicative stacking risk.

**Caption text:**
> When your retry wrapper retries the SDK's own internal retry logic, one failure doesn't retry once — it spins in place and multiplies.

---

## GIF 3 — Jira Live-Testing (mocks lied, reality was different)

**Concept:** The Everybody Loves Raymond "admit it / tell the truth" clip — repurposed here for the mocks-vs-reality theme: the mocked tests said one thing, running against the real API revealed something else entirely.

**Verified GIF:** "Admit It Tell The Truth" GIF by TV Land (Everybody Loves Raymond)
- Page: https://giphy.com/gifs/tvland-tv-land-rayromano-everybodylovesraymond-QYuvwTmYQVQmVoRHlN
- Direct: `https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHZheTg5M2lkMHk4cTk1Ynpiemxodm9rZzBna2JzMHNlendicWR0ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QYuvwTmYQVQmVoRHlN/giphy.gif

**Article placement:** In "What mocks can't tell you: the Jira live-test," right after the sentence explaining `isinstance(description, str)` passed against every mocked test but failed against every real ticket.

**Caption text:**
> The mocks had been telling the same comfortable lie for as long as the tests existed. The real API told a different story the first time anyone actually asked it.

---

## GIF 4 — PageRank / Graph Edges (importance flowing both ways)

**Concept:** An expanding network animation — nodes branching and connecting outward — visualizing the bidirectional-edge design decision: importance has to flow back through the graph, not just outward to a ticket node.

**Verified GIF:** "Expanding social network" GIF by Matthew Butler
- Page: https://giphy.com/gifs/animation-internet-technology-3oKIPpFhwsMNrRIjN6
- Direct: `https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnVucGl4NTJ6djNiN3R6emQ5OW9mbHQ5eTUza201cmd6NTl6bmZhZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPpFhwsMNrRIjN6/giphy.gif

**Article placement:** In "Teaching the graph who to trust," right after the sentence explaining that a one-way `symbol->ticket` edge would only ever boost the ticket node, never the symbol.

**Caption text:**
> The graph learns which symbols matter by tracking how importance flows backward through an edge — make it two-way, or rank gets stuck at the ticket.

---

## GIF 5 — Connector Auth Footgun (a near miss, caught in time)

**Concept:** A literal close call — someone narrowly avoiding a train on the tracks — for the Linear connector's missing-Bearer-prefix detail: exactly the kind of small inconsistency that silently breaks if you copy-paste a pattern without checking, caught here by checking carefully instead of by luck.

**Verified GIF:** "Train Lucky Close Call" GIF
- Page: https://giphy.com/gifs/train-lucky-close-call-YnDkNJ3rLtK1y
- Direct: `https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGZjZ3BmczJtYzhyYWN0dThnY3VyeXpoNzVicDkweTByYTNoOGgwMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YnDkNJ3rLtK1y/giphy.gif

**Article placement:** In "Two connectors, one auth footgun avoided by inches," right after the sentence explaining Linear's `Authorization` header has no `Bearer` prefix, unlike every other connector.

**Caption text:**
> Checking Linear's actual docs instead of copy-pasting the pattern from Jira or Xray is the only reason this didn't silently break in production.

---

## GIF 6 — Docs and Binaries Rot (dust settling on the neglected)

**Concept:** Someone blowing dust off a book — the literal visual for "nobody was watching this, and it quietly went stale."

**Verified GIF:** "Book" GIF by Yordizzle
- Page: https://giphy.com/gifs/book-yordani-yordizzle-FjUj50lqK9lCOuiX35
- Direct: `https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExampvcmJ0b3B5Y21iY2pwODJ5d2owbTFsOG9oZzZnMXl0Nm1hNTMxbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FjUj50lqK9lCOuiX35/giphy.gif

**Article placement:** In "The recurring pattern: docs and binaries rot in the dark," right after the sentence describing the macOS binary crash reproducing identically across two prior releases with zero warning to anyone.

**Caption text:**
> The macOS binary had been broken for two releases. Nobody was watching it closely enough to notice.

---

## GIF 7 — Close (honest disclosure, not spin)

**Concept:** An "admit it / tell the truth" sitcom beat, reused here in its literal sense — the closing section is about the team writing down two real, unfixed security findings plainly in the changelog instead of hiding or quietly deferring them.

**Verified GIF:** reuse of GIF 3's "Admit It Tell The Truth" GIF, OR pick a distinct alternative below if reuse within one article feels repetitive.

**Alternative option (distinct from GIF 3):** search single-word terms like "honesty" or "confession" for a second, different pick if you'd rather not reuse GIF 3's asset within the same article.

**Recommended:** Skip a dedicated GIF here, or reuse GIF 1 (the fail-gate) as a bookend — opening on "the safety measure wasn't engaged" and closing on "here's the safety measure we know is still incomplete, written down honestly" gives the piece a visual rhyme rather than introducing a seventh new asset for the shortest, quietest section.

**Article placement (if used):** In "What I didn't fix, on purpose," right after the sentence about the two known non-blocking issues found in pre-release security review.

**Caption text (if used):**
> We found two more gaps in the same review. We wrote them down instead of hiding them.

---

## Notes for Giphy selection

- Prefer looping GIFs (seamless loop), under 3MB for Dev.to page load performance
- Dev.to markdown: `![alt text](https://media.giphy.com/media/[ID]/giphy.gif)` on its own line — or paste the `giphy.com/gifs/...` page URL on its own line, which Dev.to auto-embeds
- All 6 links above (GIF 1-6) were verified as real, existing Giphy pages via WebFetch before inclusion — none are fabricated IDs. GIF 7 is left as an open choice rather than force a seventh distinct asset for the article's quietest section.
- Two duplicate risks were caught during sourcing and resolved: two agents independently picked the same "expanding network" GIF for two different sections (kept for the graph/PageRank section only, replaced for retry-storms); and the retry-storms section's first pick (a domino chain-reaction GIF) turned out to already be used in the trelix v2.9.0 article's `gifs-plan.md` — replaced with the hamster-wheel GIF instead.
