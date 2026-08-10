# trelix v2.7 to v2.9 (Dev.to) — GIF Asset Plan

Article: "trelix v2.7 to v2.9: The Release Where the Pipeline Itself Became the Product"
Platform target: Dev.to (native markdown, embed via `![alt text](giphy_url)` on its own line)

---

## GIF 1 — Hero / Article Open (the binary-collision bug)

**Concept:** A chain reaction triggered by one small, overlooked cause — a domino topple viewed close-up, emphasizing cause-and-effect at the physics level. Matches the opening beat: one bare-basename collision quietly cost a whole release its third binary asset.

**Verified GIF:** "chain reaction physics" GIF
- Page: https://giphy.com/gifs/physics-domino-fAgdyrGILMq2I
- Direct: `https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJvOXRyendjY2h2bmN2czdtZDB6dmE5NWRsd21oeWIyOThweHdkOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fAgdyrGILMq2I/giphy.gif

**Article placement:** Top of article, immediately after the opening paragraph about counting two binary assets where there should have been three.

**Caption text:**
> One collision, one overwritten file, and no way to tell from the published release which OS survived.

---

## GIF 2 — Concurrency Bugs (juggling under load)

**Concept:** Someone actively juggling — multiple things in the air simultaneously, the visual language for "many concurrent things being handled at once, one dropped ball away from disaster."

**Verified GIF:** "Juggling Juggle" GIF by Krebs Video Productions
- Page: https://giphy.com/gifs/KrebsVideoProductions-juggling-mikekrebs-work-RBjPwwwrMfoudSUzWk
- Direct: `https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHN3MW93dnV1anNibXR5a3NkbmF5YXJwN2o5dTNibzFhNThvOTgzaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RBjPwwwrMfoudSUzWk/giphy.gif

**Article placement:** In "Five concurrency bugs, found only once I wrote real stress tests," right after the sentence introducing the TOCTOU race in the sparse embedder's lazy-load.

**Caption text:**
> Five threads, one shared connection, and a `check_same_thread=False` flag that only *sounds* like a safety guarantee.

---

## GIF 3 — Becoming Deployable (shipping container)

**Concept:** A real shipping container — the literal, industrial version of "shipping" — visually reinforcing the shift from "clone it and run the CLI" to "here's an official Docker image and Helm chart."

**Verified GIF:** "Shipping Container" GIF by Hapag-Lloyd AG
- Page: https://giphy.com/gifs/HapagLloydAG-shipping-container-discharge-v4YVFwJvAbrCikdfog
- Direct: `https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdG5xcmxlNWtoMDhzeHkyNnBtdDBydno5YWp6N2p6MGY1MjVlaHY1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/v4YVFwJvAbrCikdfog/giphy.gif

**Article placement:** In "Becoming genuinely deployable, not just runnable," right after the paragraph introducing the TypeScript SDK and typed REST response models.

**Caption text:**
> Typed responses, a real SDK, an OpenTelemetry trace, a Docker image, and a Helm chart — in that order, on purpose.

---

## GIF 4 — Python 3.13 Migration (one small swap, big blast radius)

**Concept:** An expanding, branching network animation — one origin point spreading outward into many connected nodes. Matches the "one dependency swap cascaded into six parser bugs" narrative directly.

**Verified GIF:** "expanding social network" GIF by Matthew Butler
- Page: https://giphy.com/gifs/animation-internet-technology-3oKIPpFhwsMNrRIjN6
- Direct: `https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmU4ZnNvc2NyaHRtc3Uxc2cyeXdreXljaGw3N2Q5NWYxa3JpY3NzcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPpFhwsMNrRIjN6/giphy.gif

**Article placement:** In "Python 3.13, and how one dependency swap turned into six bugs," right after the sentence noting the fix is one swap at one chokepoint, but not the whole blast radius.

**Caption text:**
> One line changed at the grammar-loading chokepoint. Six language extractors quietly broke downstream.

---

## GIF 5 — VS Code + GitHub App (the XSS fix, unsoftened)

**Concept:** A direct hacker/security-breach visual — no metaphor, no softening. This section's content (a real XSS vulnerability, an admission that a Check "never posted a single real annotation") calls for the most literal, unhedged image in the set.

**Verified GIF:** "hacker" GIF
- Page: https://giphy.com/gifs/hacker-MM0Jrc8BHKx3y
- Direct: `https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGdyejJ2YmxzY3ViemgwOHJyMGMydGt6Mzd2cWg2cGZrdmdhZ2g4eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MM0Jrc8BHKx3y/giphy.gif

**Article placement:** In "The VS Code extension, the GitHub App, and an admission I'm not going to soften," right after the sentence describing the unescaped LLM answer string interpolated directly into the Webview's HTML.

**Caption text:**
> No CSP, no script restrictions, and a raw LLM answer string interpolated straight into HTML. That's the whole vulnerability.

---

## GIF 6 — Multi-Repo Federation (the pre-push security catch)

**Concept:** Access/information being deliberately shared and made visible — a straightforward, professional "transparency" visual matching a security fix that was caught *before* it shipped to users, in a pre-push audit.

**Verified GIF:** "Information" GIF by Transparency International
- Page: https://giphy.com/gifs/TransparencyInternational-access-to-information-right-transaparency-xACk31Ey9Z2kt9Vs71
- Direct: `https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDM5emMzcHR4bGhxNHh1NTd5NGcwcjIyMGVleWsxYzE4NHVrOWNxNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xACk31Ey9Z2kt9Vs71/giphy.gif

**Article placement:** In "Multi-repo federation, and the security fix found before it hit anyone," right after the sentence explaining the config-path validation gap that let an MCP client point registry I/O at an arbitrary filesystem path.

**Caption text:**
> Found in a pre-push audit, before it ever reached anyone running the released version — the way a security fix is supposed to happen.

---

## GIF 7 — Close (what's still open)

**Concept:** Reuse GIF 1's domino/chain-reaction visual, or keep this section GIF-free — the closing section is deliberately understated (deferred work, an unreleased fix still in progress), and a GIF here risks working against the tone of quiet honesty the section is going for.

**Recommendation:** Skip a dedicated GIF for this section. If one is wanted, the Transparency International GIF from slot 6 can be reused here instead — its "openness" framing fits an honest "here's what's still unfinished" close better than introducing a new, unrelated visual this late in the article.

---

## Notes for Giphy selection

- Prefer looping GIFs (seamless loop), under 3MB for Dev.to page load performance
- Dev.to markdown: `![alt text](https://media.giphy.com/media/[ID]/giphy.gif)` on its own line — or paste the `giphy.com/gifs/...` page URL on its own line, which Dev.to auto-embeds
- Avoid GIFs with text overlays that would clash with the caption text above
- Giphy direct GIF URL format: `https://media.giphy.com/media/[ID]/giphy.gif`
- All 6 links above were verified as real, existing Giphy pages before inclusion — none are fabricated IDs
