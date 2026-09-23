---
slug: mindforge-v12-0-0-release
title: "MindForge v12.0.0: An Agentic Framework for Claude Code — What It Ships, How to Install It, and What's Actually Enforced"
platform: substack
status: live
published_url: https://sairam0000.substack.com/p/mindforge-v1200-an-agentic-framework?r=2xzeyx&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true
published_date: 2026-09-24
canonical_url: https://anvilry.vercel.app/notes/mindforge-v12-0-0-release
note: "Same grounding/verify caveats as the devto tracking file for this slug -- see that file's note. Substack body uses the workflow's more narrative 'field note' adaptation; title/opening/closing hand-edited across two post-workflow passes: first when v12.0.0 had merged to main (PR #298) with a real CHANGELOG entry but wasn't yet tagged/npm-published, then again once it was -- v12.0.0 is now tagged, published, and live (77 total npm releases; mindforge-mcp-server and mindforge-sdk shipped alongside it at the same version)."
publish_note: |
  LIVE 2026-09-24: published by the user (pasted manually -- no automated substack
  publisher exists in packages/core/src/publishers/ yet, stub-only per Inkforge's
  CLAUDE.md). Verified the URL resolves: HTTP 200 on the exact published_url above.
---

*A field note on a framework that just published, for the second release in a row, a formal account of the fabricated success message it caught itself printing.*

I keep a mental list of agent-tooling launch posts that made me roll my eyes — the ones where "enforced" turns out to mean "mentioned in a markdown file," and "verified" turns out to mean "the README says so." So when I sat down to write about MindForge, I told myself I'd hold it to the same standard I'd want applied to my own work: nothing in here that I hadn't checked against the actual source tree. What follows is the result of that exercise — and, as it turned out, the exercise itself became the more interesting story than the release, because the goalpost moved on me three separate times while I was writing it, and I'm updating this piece now that it's finally landed.

## What MindForge Is (And Isn't)

Let's start with the boring-but-necessary part, because so much confusion in this space comes from skipping it. Agentic frameworks for Claude Code have exploded over the past year — swarms of subagents, skill libraries, protocol layers stacked on top of a single model — and most of them describe what they actually ship in one flattened register: "AI capabilities." MindForge (`mindforge-cc` on npm) is a governance and orchestration layer in that same category, sitting on top of Claude Code. It is not a replacement for Claude Code, and it does not run without it — full stop. What sets it apart, and what took me a while to appreciate, is that it treats its own surface area as five mechanically distinct pieces instead of one undifferentiated pile, and draws an explicit line between what's genuinely enforced and what's just well-organized advice. `v12.0.0` is tagged and live on npm as I write this — both `latest` and `stable` point to it, with a real GitHub Release at the matching tag — and its CHANGELOG entry says, verbatim, this is "MindForge's first release deliberately cut for real external users." I'll come back to how it got there at the end.

Concretely, it ships as three things: an npm package that installs slash commands, skills, personas, subagents, and hooks into a `.claude/` directory (mirrored into `.agent/`); a set of Claude Code plugin-marketplace entries; and a separate MCP server plus TypeScript SDK.

Here's the distinction that took me longest to internalize, and the one I think matters most: almost everything this system ships — the commands, the skills, the personas, the workflow scripts, the governance docs — works by being loaded into the model's context. None of that is code the model is *forced* to obey. It's advice, however well-organized. The one exception, the one piece of this whole apparatus that is a real technical enforcement mechanism, is a small set of Claude Code hooks. Advisory context versus enforced blocking. That's the line, and — this is the part that actually earned my respect — it's the project's own README that draws it, not some outside auditor dragging the truth out of them.

That instinct toward self-correction shows up again almost immediately once you start reading the repo instead of the marketing copy around it. There's a whole strand of "Unified Protocol Engine" language — SwarmController, PersonaFactory, WaveExecutor, `soul-engine.js`, `shard-controller.js` — that circulates in some MindForge-derived global configs. I went looking for the code behind it. It isn't there. And the repo's own `.claude/CLAUDE.md` says so, explicitly: those are "role names in the specs under `.mindforge/engine/`, not importable code." I don't think I've seen a project volunteer that particular kind of correction about its own aspirational branding before shipping to real users. It set the tone for everything else I found.

https://giphy.com/gifs/drawing-notes-scribble-hqqu3NvxUJ07boRjqP

The part that isn't theater, though, is the actual working loop: plan-phase → execute-phase → verify-phase → ship. It's worth walking through because it's genuinely detailed machinery, not just four command names in a row. Plan-phase spawns a research subagent and writes atomic XML plan files with explicit `<verify>` steps. Execute-phase runs dependency-aware waves against a five-level escalating validation ladder — static, unit, build, integration, edge — and writes a Deviation Report per task. Verify-phase walks a human through the REQUIREMENTS.md deliverables and writes UAT.md, spawning a debug subagent if something fails. Ship gates on UAT.md actually reading "All passed," then runs `tsc --noEmit`, `eslint`, `npm test`, and `npm audit` before generating the PR description. That's real scaffolding. But even here there's a live wrinkle I'd be doing you a disservice to smooth over: `ship.md`'s Step 4 currently hardcodes a literal branch name into its `git push` instead of deriving the active branch, so anyone not literally on that named branch could push somewhere they didn't intend to. Small thing. Worth knowing before you rely on it.

## Five Mechanisms, Five Different Levels of Trust

If there's one thing I wish more launch posts did, it's this: instead of flattening "we ship commands and skills and agents" into one undifferentiated pile of "AI capabilities," actually explain how each piece works mechanically — because in MindForge's case, the differences aren't cosmetic. Here's the whole surface area, verified count by verified count, before I walk through it:

| Mechanism | Count | Invoked via | What it mechanically is | Enforced or advisory |
|---|---|---|---|---|
| Slash commands | 221 | `/mindforge:<name>` | `.md` prompt specs the model reads and can choose to follow | Advisory |
| Skills — engine tier | 232 | Auto-triggered by keyword match | An LLM-followed protocol spec does the matching — non-deterministic, not a parser | Advisory |
| Skills — extended tier | 122 | Invoked explicitly by name | Same skill mechanism, lenient schema (only a name is required) | Advisory |
| Personas | 216 | `/mindforge:agent <name>` | An in-session role overlay — same context, not a new agent | Advisory |
| Subagents | 164 (154 adapted from VoltAgent's MIT-licensed library + 10 original) | Claude Code's native subagent mechanism, via the plugin marketplace | A genuinely isolated execution context — a separate mechanism from personas | Advisory (the definition; the isolation itself is Claude Code's) |
| Dynamic workflows | 35, across 5 tiers (Research 5 / Dev 14 / Ops 6 / Intelligence 7 / Beast 3) | Claude Code's own host-level `Workflow` tool | Curated orchestration scripts targeting a host capability MindForge doesn't itself implement | Advisory |
| Hooks | 8 registered (7 executed, 3 "deny-class") | Automatic, on tool-call boundaries | Real shell scripts wired into Claude Code's own hook system | **Enforced** — the one row that actually is |

That last row is the whole ballgame, and I'll get to exactly what "enforced" does and doesn't cover in a minute. First, the other six rows, in plain language:

**Commands** are 221 slash-command `.md` files under `.claude/commands/mindforge/`, mirrored exactly in `.agent/mindforge/` — I counted the files myself rather than trusting the README's number. They're prompt specs the model reads and follows; nothing about them executes independently of the model choosing to follow along.

**Skills** split into two tiers totaling 354 files: 232 "engine tier" skills under `.mindforge/skills/`, auto-triggered by keyword match, and 122 "extended tier" skills under `.agent/skills/`, explicitly invoked by name. The engine tier enforces a real schema — verified via `tests/skills-platform.test.js` — requiring a semver version, a status field, at least ten trigger terms, and a "Mandatory actions" section. The extended tier only requires a name. Here's where I have to be honest about something the CHANGELOG is already honest about: the file that's supposed to do the actual trigger-matching, `bin/engine/skill-loader.js`, is dead code. It's a four-line stub — `loadSkill: () => null, matchTriggers: () => []` — with zero real callers. The real trigger-matching mechanism is `.mindforge/engine/skills/loader.md`, which is an LLM-followed protocol spec, not deterministic code. Which means "skill triggering" in this system is non-deterministic by design. The model decides what counts as a match. There's no parser making that call for it.

**Personas** are 216 named role-overlay files under `.mindforge/personas/`, loaded via `/mindforge:agent <name>` into the *same* session context — a role swap, not a new agent. I appreciated that MindForge's own docs draw this distinction plainly rather than letting "persona" and "subagent" blur together for effect, because the next mechanism is genuinely different.

**Subagents** are 164 real Claude-Code-native subagent definition files under `subagents/categories/`, each with proper frontmatter (name, description, tools, model) built for Claude Code's isolated-context subagent mechanism — actually separate execution contexts, unlike personas. 152 of those files are attributed to VoltAgent's MIT-licensed `awesome-claude-code-subagents`, full license text reproduced, and that attribution checks out against the vendored upstream repo when you go compare them directly. One small correction worth naming, because I think it's the kind of thing that should get named rather than repeated uncritically: the README's claimed "152 adapted / 12 original" split undercounts the adapted set by two. `dotnet-framework-48-expert.md` and `powershell-51-expert.md` are near-byte-identical VoltAgent copies, with the dots stripped from the filenames for path safety — so the real split is closer to 154 adapted / 10 original.

https://giphy.com/gifs/cmx1gjLskcGWytbLm6

**Dynamic workflows** are 35 JavaScript scripts across five tiers — Research (5), Dev (14), Ops (6), Intelligence (7), Beast (3) — under `.mindforge/dynamic-workflows/scripts/`. The ones I read in full are genuinely substantial multi-agent orchestration code. `security-hardening.js`, for instance, runs five parallel OWASP scout agents, and for every critical or high finding it spins up a nested three-vote adversarial verification round — refute, challenge-exploitability, assess-impact — requiring a real two-of-three quorum before accepting the finding. That's not a cosmetic label sitting on top of a glorified prompt. But here's the structural fact that I think matters more than the impressive part: the actual execution primitives these scripts call — `agent()`, `parallel()`, `phase()` — aren't implemented anywhere in the MindForge repository. They're supplied entirely by Claude Code's own host-level Workflow tool at runtime. MindForge ships the script library, the JSON registry, and the CLI browser; it doesn't ship a self-contained execution engine. Every one of these scripts also contains a top-level `return` statement, which means literally none of them are valid standalone Node.js files — they only run wrapped by that external harness. I don't think this is a defect. I do think a launch post that said "35 dynamic workflows" without this context would be quietly misleading you about what MindForge alone can do.

## The Line Between Advisory and Enforced

This is the section most agent-tooling projects never write, and I want to sit with why MindForge did, because it changed how I read everything before it. There's a dedicated "What is actually enforced" section in the README, and it says: hooks are the only real blocking mechanism in the entire framework, and they only block on Claude Code, via the npx installer's `--local` target. Not on Cursor, Copilot, Gemini, or Antigravity. Not on `--global` installs. Not on self-installs. Not on Windows.

https://giphy.com/gifs/emiratesfacup-save-goalkeeper-schmeichel-4RU2qRC7QaeWhuVA0c

https://giphy.com/gifs/cliftonvillefc-goal-cliftonville-jack-keaney-S8OcIF0t0iZJWmPcIR

I went and checked the live numbers behind that claim rather than taking them on faith, and they held up. The repo's own `.claude/settings.json` registers exactly 8 hooks — 2 PostToolUse, 4 PreToolUse, 2 SessionStart. Of those, 7 are executed by the installer's preflight check (one, `mindforge-check-update`, is deliberately skipped). Of the 7 executed, only 3 are "deny-class" — actually capable of returning a hard block: `trust-gate`, `mindforge-block-no-verify`, and `mindforge-config-protection`. I confirmed live that all three return exit code 2 on trigger. Everything else — the 221 commands, the 354 skills, the 216 personas, the 35 workflows, every governance and audit doc in the repo — can be ignored by the model at any time. I'd genuinely push back on any framing that implies installing MindForge "activates" or "enforces" its governance or security-scan language across arbitrary tools or install paths. It doesn't. It narrows enforcement to three specific hooks on one specific install channel, and it says so itself.

## The Audit Chain, and Why This Particular Release Felt Different

MindForge maintains a tamper-evident audit log at `.planning/AUDIT.jsonl`, hash-chained with SHA-256 via a shared hasher (`bin/governance/audit-hash.js`) used by both the writer and the verifier. I ran the verifier live against this repo's own log and it came back: "audit chain valid: 6396 entries." SECURITY.md is careful about scoping that claim — the chain detects mid-file mutation and deletion, and explicitly does *not* detect tail truncation or replay — and there's a dedicated honesty test suite (`tests/audit-claims-honesty.test.js`) whose entire job is checking that the documentation doesn't overclaim beyond that boundary, right down to confirming the writer doesn't sign entries and the docs never call this a Merkle tree.

https://giphy.com/gifs/chuber-user-error-l2R06FEpVRk6IroNq

But the audit log itself wasn't the part that stayed with me. It was what the project's own pre-ship audits actually catch — a real mix of genuine bugs and genuine overclaiming, disclosed rather than buried. The v11.9.9 release, one before this one, describes an eight-agent audit workflow run as a release gate before shipping to real external users, and it wasn't a rubber stamp: that pass found 5 CRITICAL issues, including a jailbreak skill named "godmode" that had been shipping live, a security check with no real CLI entrypoint (meaning it could structurally never fail), and a `--minimal` install flag that silently shipped the full persona set anyway — plus 9 HIGH findings on top. I verified that neither the godmode skill nor any of its assets exist anywhere in the shipped tree, and there's now a packaging-allowlist test that explicitly asserts its absence.

That same audit pass also fixed a set of docs — `help.md`, `status.md`, `health.md`, `security-scan.md` — that had been overclaiming a post-quantum-signature feature (PQAS) and biometric gating as active. The real code is honest about this now: `bin/governance/quantum-crypto.js` labels its Dilithium-5 implementation "SIMULATED... NOT real ML-DSA/FIPS-204," gated off by default in config.

I want to be straight about two things that audit hadn't fully closed, because naming them here felt more useful than pretending this dossier is a clean bill of health. First, that PQAS-overclaim pattern had a residual instance the 11.9.9 audit missed: `.mindforge/governance/policies/sovereign-default.json` still marked PQAS and biometric checks as "ENABLED," but that file is dead config — the real `PolicyEngine` reads a completely different directory and never loads it. Second, the same "feature that isn't wired to what it implies" pattern showed up somewhere the audits hadn't caught: MindForge's README describes a "two-model adversarial PR review" and a "4-voice consensus council," but as currently wired, both mechanisms route every voice and every round to the exact same single backing model — the cross-review engine's caller-supplied model names are used only as display labels, and the council's four voices all resolve through an unmapped persona to the same tier-2 default. Nothing in the CHANGELOG flagged it as of v11.9.9. I'd rather tell you now than let you discover it later.

A few smaller, still-open items are worth knowing too: `/mindforge:health --repair` silently drops the `--repair` flag; `spawn <persona>` still exits 1 with "not implemented in v1.0"; `docs/commands-reference.md` still lists a CLI command, `quantum-verify`, that doesn't exist (I ran it — it doesn't); and `docs/tutorial.md` still documents an `--ads` flag on `/mindforge:plan-phase` that was never wired into the actual command file.

## Cost-Aware Model Routing: The Version I'd Actually Trust

MindForge advertises cost-aware, difficulty-aware model routing across five real providers — Anthropic, OpenAI, Gemini, Bedrock, and Ollama — and I'll say plainly: the provider layer is genuinely live. Each provider makes real HTTPS calls and computes real per-call cost through a shared pricing registry. That part isn't vaporware.

What's worth being precise about is what actually decides which model gets used in production, because it's a narrower story than "difficulty-aware" implies: it's persona plus a caller-supplied security tier (0–3), not computed task difficulty. Here's the part that surprised me most in the whole dossier: there are, in fact, three separate difficulty-aware routing systems built into this codebase, and none of them are live. A real 1–10 difficulty scorer exists and is unit-tested, but its only caller runs it in shadow mode. A second system, a full "multi-cloud arbitrage" broker with its own passing tests, is required nowhere except its own test file — it even lists a fourth "azure" provider with no corresponding implementation anywhere. A third, a MIR-based steering engine, is imported by the one module that's supposed to call it — but never actually invoked. I don't read this as sloppiness so much as a pattern the project already knows about: the CHANGELOG documents fixing a near-identical prior bug in the same routing module, so "wired but not connected" recurring in cost routing isn't new here — it's known, just not fully cleaned up yet.

## The Shipping Surface: MCP Server, SDK, and Three Real Channels

MindForge ships three real, independently checkable channels, not one, and I checked all three rather than taking the "npm" badge at face value. `mindforge-mcp-server@12.0.0` is genuinely published on npm right now, matches the repo source exactly (including SLSA provenance), and registers exactly 8 MCP tools. Worth flagging honestly, because the project's own README already does: the official MCP registry listing for this server lags one patch version behind what's actually published on npm — which I found refreshingly unusual for a project that could have just... not mentioned that.

`mindforge-sdk@12.0.0` is also live on npm and matches source. Its `batchExecute` spawns real child processes with SIGTERM-then-SIGKILL escalation — and there's a named regression test in the SDK's own test suite that exists specifically to guard against a previously-shipped fake stub that used to return `{executed:true}` without doing anything at all.

Underneath all of this, the persistence layer for MindForge's local knowledge graph is a genuinely zero-native-dependency setup: `sql.js`, a WASM-compiled SQLite, backing an 11.8MB file with real FTS4 full-text search. The live dashboard at `localhost:7339` is a real Express + SSE server, bearer-token-authenticated, rate-limited, localhost-only. And here's a place I want to be precise rather than generous: the more elaborate dashboard sub-features that show up in some MindForge-adjacent marketing language — a Temporal Slider, Hindsight Steering Vectors, a $100/hr AgRevOps ROI hub — were not independently verified beyond confirming the dashboard's base HTTP response.

## Installing MindForge

https://giphy.com/gifs/safe-i-made-it-finally-here-CtXgzu7MRnivxPrL7v

There are five real, independently-checkable ways to get MindForge, and I want to actually walk through all five rather than just giving you the one command everyone pastes and moves on from — every one of them installs `v12.0.0` directly as of this writing.

The one most people want is **npx**, which writes `.mindforge/` governance, memory, and planning into your project and registers the 8 hooks I described above:

```bash
npx mindforge-cc@latest --claude --local      # Claude Code, this project only
npx mindforge-cc@latest --antigravity --local # Antigravity, this project only
npx mindforge-cc@latest                       # interactive wizard, pre-selects a detected runtime
```

Run it non-interactively — CI, piped input, anything scripted — and it skips the wizard and installs `--claude` by default regardless of what's actually on the machine. Want it system-wide instead of per-project? `npx mindforge-cc@latest --claude --global` — and a small gotcha worth flagging: `npm install -g mindforge-cc@latest` on its own only puts the binaries on your PATH, it doesn't scaffold anything, so you still need to run that `--global` command once. Other runtimes (`--cursor`, `--copilot`, `--gemini`) follow the same pattern. If you want more control: `--runtime claude,cursor` combines runtimes in one pass, `--minimal` skips the persona library, and `--force` rewrites an existing schema file with the current, stricter one.

If you'd rather not have anything written to your project at all, there's the **Claude Code plugin marketplace** — only the plugin's hooks fire, nothing else touches disk:

```bash
/plugin marketplace add sairam0424/MindForge
/plugin install mindforge@mindforge
```

There are 9 more focused sub-packs beyond the full install if you only want, say, the language-specific agents.

If you just want the tool-calling surface without any of the command/skill tree, there's a **standalone MCP server**:

```bash
claude mcp add mindforge -- npx -y mindforge-mcp-server
```

I'll note, because I checked, that the official MCP Registry listing for this server can lag behind what's actually on npm — install `mindforge-mcp-server` directly if you care about pinning an exact version.

There's also **Homebrew**:

```bash
brew install sairam0424/tap/mindforge
```

I checked the formula itself rather than assuming — it pins to a specific npm tarball with a checked sha256, currently pointed at `mindforge-cc-12.0.0.tgz`. That's a real, current formula, not a stale mirror someone forgot to update.

And if you're building on top of MindForge rather than just using it, there's the **SDK**:

```bash
npm i mindforge-sdk
```

## What v12.0.0 Actually Means

I want to close on the number itself, because I think it's the most honest thing about this whole release — and the story moved on me three separate times before I could finish writing it. First, mid-research: the live repository jumped from v11.9.9's own framing as a "release-readiness milestone" onto a branch whose commit named v12.0.0, explicitly, as the real first-user-release cut. Then: `package.json` on `main` read **12.0.0**, merged via PR #298, with a CHANGELOG entry titled "[12.0.0] — First release aimed at real external users" — but not yet tagged or published. And now, as I update this piece: it's actually done. `v12.0.0` is tagged, published, and live — `latest` and `stable` on npm both point to it, and `mindforge-mcp-server`/`mindforge-sdk` shipped alongside it at the same version. The CHANGELOG entry says plainly what that title implies and nothing more — a milestone marker, not a breaking change; every item in it is a fix.

It shipped because a second, independent eight-agent audit — security and STRIDE threat modeling, staff-engineer code review, dependency and license review, a live production dry-run across all six supported runtimes, docs-accuracy checking, deferred-backlog re-verification, test-coverage gap analysis, and a full CI/CD pipeline trace — checked whether v11.9.9 was actually ready for real external users. It wasn't, quite: 1 CRITICAL and 4 HIGH findings, plus 8 MEDIUM/LOW, all independently re-verified — 10 out of 10 confirmed, zero refuted — before being fixed.

Here's the part I didn't expect to find, and the part that made me rewrite this closing section twice: the CRITICAL finding is the same species of bug I'd independently caught mid-flight, the same week, while writing this piece. A `--global` install printed a fabricated "PAYLOAD MANIFEST" claiming 216 personas and 122 skills were "active," while writing none of them. It's fixed now, replaced with an honest message describing exactly what a global install does and doesn't include. The HIGH fixes closed a related install-banner overclaim, a crash path in one of the dynamic-workflow scripts, and added two regression tests guarding the 11.9.9 fixes against silently regressing. The MEDIUM/LOW list is the unglamorous kind of hardening that doesn't make headlines but is exactly what "ready for real users" should mean in practice: a missed dropper-chain pattern in the install-time security gate, a prototype-pollution guard on a shared config singleton, a CodeQL-flagged regex bug, a reverted non-LTS Docker base image, a persona-table doc regenerated from source, and a release-pipeline step that had been silently failing on four consecutive prior releases for a root-caused, now-fixed reason.

I think that's actually the most credible launch story available here — not because a version number is some finish line, but because the discipline of catching real bugs before shipping to real users kept recurring, release after release, right up through the moment this one actually went out the door, with one more real critical bug caught and fixed along the way. A mature, iteratively-hardened orchestration layer, now on its 77th npm publish, just finished — and disclosed the results of — a second thorough self-audit, and shipped exactly what its own CHANGELOG calls itself. That's the kind of release note I'd want every tool in this category to be capable of writing about itself. Most can't. This one, warts and all, just did — twice in a row, and then actually followed through.
