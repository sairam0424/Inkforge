---
slug: nh-skills-v0-2-4-first-user-release
title: "nh-chaos-monkey 0.2.4: agents try to break one module in a git worktree"
platform: devto
status: live
published_url: https://dev.to/sai_ram_0000/nh-chaos-monkey-024-agents-try-to-break-one-module-in-a-git-worktree-2a7a
published_date: 2026-11-25
devto_id: 5117242
tags: ["claudecode","ai","testing","opensource"]
note: "Written 2026-11-25 from the public repository at tag v0.2.4 (c86ef68), the six GitHub release notes and the public PRs and issue 25. No private run reports or employer material were used."
publish_note: |
  LIVE since 2026-11-25 17:04 UTC (22:34 IST), Dev.to id 5117242, four Giphy GIFs (see assets/gifs-plan.md). Created as a draft with the Inkforge CLI, updated with PUT /api/articles/5117242, then published with PUT {article:{published:true}}. Edit later ONLY with PUT /api/articles/5117242; never re-run publish (it creates a new post). Re-running assemble.py write overwrites this file and drops these fields. canonical_url is Dev.to itself (no mirror).
  2026-11-26: two body sentences reworded to the Not-Humans lead ("a Not-Humans skill for Claude Code", "the Not-Humans collection of Claude Code skills") with PUT /api/articles/5117242 (body only; title, tags, URL and published state unchanged; checked afterwards: live body equals this record). The Substack copy still has the old two sentences and must be edited by hand.
---

nh-chaos-monkey 0.2.4 is a Not-Humans skill for Claude Code in which agents try to break one module of code you own, inside a throwaway git worktree, and then try to fix what they confirm. You decide what gets merged. It executes your project's code, and nobody but me has run it.

nh-chaos-monkey is the only skill in nh-skills so far, the Not-Humans collection of Claude Code skills. It is licensed Apache-2.0.

Use it when you have a module with a real test command and want to know what that suite does not catch. It will not help with faults in running services or networks, production or third-party code, or runs where nobody confirmed the contract.

## How a run works

You give a target and your own test command as the judge, then confirm the contract: judge, protected paths, caps and the sandbox. In a headless session nothing asks, so the prompt or command line carries the target, the judge and any caps (and `--accept-no-sandbox` if you run without a sandbox), and the session is told to use 1 round and 3 findings for any cap you leave unset. Protected paths (existing tests, fixtures, snapshots, config and lockfiles) are off limits to the fixer; add what the defaults miss, such as `setup.py` or `.env` (the repo does not say how to do that in a headless run). The session creates a git worktree outside your repository on a `chaos/*` branch from HEAD, so commit first: uncommitted changes are not tested. Gitignored folders such as `node_modules` are absent from the worktree, so a judge can be green in your checkout and red there.

One breaker agent per lens writes reproducers. A lens is a way of attacking the target, and a reproducer is a small script that fails while the break is present. The faults lens is told to use test doubles or stubs in the reproducers and never real services, an instruction that only a sandbox enforces. A confirmer runs each reproducer twice. A break is confirmed only if both runs fail, the confirmer quotes the line that runs your project's code, and none of your documents accepts the behaviour. The script checks only that a quoted line (and, for an accepted behaviour, a document reference) is present, not that it is true, so read each reproducer yourself. A fixer adds a regression test. A fresh verifier re-runs the judge (your own test command), checks the test count went up, and runs the regression test on the tree from before the fix, where it must fail.

Each finding ends as `fixed-agent-verified`, `confirmed-unfixed`, `superseded`, `lead` (plausible but not confirmed) or `invalid`. Your session re-checks at the end; the README says that step is an instruction to the session, not something the script enforces. Only after it passes is a fix `fixed-verified`. A confirmed break shows that a behaviour exists. Read each one against the module's contract to decide whether it is a bug. The judge is usually only your test command, so run your own lint, type check and CI on the branch before merging.

![A gray concrete cylinder stands under a steel press, then bursts into a dust cloud and falls apart into broken chunks.](https://media0.giphy.com/media/3ov9jHhVmhvNAj26Dm/giphy.gif)

## Install

Declared minimums (every live run was on one Mac): macOS or Linux with a POSIX shell, git 2.31 or newer, Node.js 20 or newer, and a Claude Code release with the Workflow tool (dynamic workflows) turned on. Claude Code's documentation puts the minimum for the in-session one-command plugin install at 2.1.275. Native Windows is not supported and WSL is untested.

As a plugin, pinned to the release this article describes:

```text
/plugin marketplace add sairam0424/nh-skills#v0.2.4
/plugin install nh-chaos-monkey@nh-skills
```

The one-command form `/plugin install nh-chaos-monkey --marketplace sairam0424/nh-skills` follows the default branch, which can be newer than v0.2.4. After a plugin install, type `/nh-chaos-monkey:nh-chaos-monkey` where this article says `/nh-chaos-monkey`.

To copy a tagged release instead:

```bash
# run this from a scratch folder, not inside the repository you will test
git clone --depth 1 --branch v0.2.4 https://github.com/sairam0424/nh-skills.git
SKILLS=~/.claude/skills
mkdir -p "$SKILLS"
cp -r nh-skills/nh-chaos-monkey "$SKILLS"/
ls "$SKILLS"/nh-chaos-monkey/SKILL.md
```

The version is 0.x, so behaviour can change between minor versions; read the changelog before updating. Replace any earlier copy with v0.2.4: copies older than v0.2.1 could send a shell credential through a project `.npmrc` expansion, and the settings example before v0.2.4 does not deny reads of `~/.claude.json` and `~/.claude/settings.json`.

Tags are unsigned and releases carry no provenance attestation, so read what your session will act on before you run it: `SKILL.md` (122 lines, which holds the shell commands the session runs) and the two scripts. `chaos-loop.js` (1,378 lines) runs inside Claude Code's Workflow tool, and `sandbox-probe.mjs` (248 lines) is plain Node using only built-in modules.

## Run it in a sandbox

It executes your project's code, and the agents read it, so it reaches your model provider. Start the session in a sandbox that denies reads of credential files and has no network (the model traffic is unaffected). Allow writes to only an empty worktree directory, an empty scratch directory and your repository's own `.git`, with `hooks` and `config` write-denied. Create the two empty directories yourself (absolute paths made only of letters, digits, `.`, `_`, `/` and `-`) and give the session their exact paths; in a headless run, put them in the prompt. The settings example is `nh-chaos-monkey/references/safety-runner.md` in the repo.

Claude Code's built-in sandbox covers shell commands and their child processes, and only when it is on and fail-closed. The file tools (Read, Write, Edit), hooks, MCP servers and the model client run outside it, so deny reads of credential paths in your permission rules too. The repo gives this as advice in `docs/safety.md` and has no tested rule list. `/sandbox` alone does not deny credential reads, so use the `denyRead` list from the settings example. Keep `~/.claude.json` and `~/.claude/settings.json` in it: they hold Claude Code's account and settings data, and the probe does not check them.

Because the sandbox has no network, it cannot run an install. Keep dependencies outside the worktree: a virtualenv whose interpreter you use in `--judge` and also pass as `--repro-runner /path/to/venv/bin/python`, or a `node_modules` in a parent directory of the worktree. Tests that need a local server or a unix socket need an allowance, which the same file lists. For Docker it says not to give the sandbox the Docker socket, so a suite that needs Docker and documents no subset without it has no usable judge here.

I have run it sandboxed only in a headless `claude -p` session started with `--settings <your settings file> --setting-sources project,local` and `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`, normally from a cleaned environment, with the allowed tools passed explicitly. With the scrub set, these sessions ran in Claude Code's default permission mode. Pin the model with `--model <full model id>`; without it a headless session uses Claude Code's default model. A variable whose name holds a credential word such as TOKEN, SECRET, PASSWORD or API_KEY, among others, makes the probe fail and the run stops, so unset them; a count such as `*_TOKENS` is not flagged. The repository documents these flags in pieces (the README, `references/safety-runner.md` and the troubleshooting page) and has no single complete launch command. The README records Amazon Bedrock only for the sandboxed runs of 2026-11-23; other setups are untried.

In the headless form a loop still running ten minutes after the session's last turn is stopped; its commits stay on the branch but are unverified leads. A run that may last longer, as fixing runs often do, needs `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` in the launcher with an outer timeout. The README's "Before you run it" section and the skill's own instructions name the stops a headless run can hit. Two of them: the Workflow tool can refuse a script under `~/.claude/skills` or a plugin folder. The session is told to prefer copying `chaos-loop.js` into the working directory under a new file name, confirm with `shasum` that the copy is byte-identical, run it from there and remove only that copy. In a repository that sets `core.hooksPath` (husky, for example) the session is told to stop, an instruction the script does not check.

The first run, from your repository root, with `src/parser` replaced by a small module of your own:

```text
/nh-chaos-monkey src/parser --judge "<your project's test command>" --lead-only --max-rounds 1 --max-findings 2
```

`--lead-only` finds breaks and makes no code changes, but it still runs your tests. Your judge should be your documented test command as a single plain command, green before you start and printing a test count. The script refuses pipes, `;`, output redirection (other than `2>&1`), `$(...)` and flags such as `--bail`, `-u` or `--passWithNoTests`; put anything else in a wrapper script that keeps the exit status and the test count.

Before any of your code runs, `sandbox-probe.mjs` tries writes outside the worktree, 15 credential locations, git hooks and config, a direct network connection and secret-looking environment variable names. The skill's instructions tell your session to stop unless the probe reports enforced, or you accept the risk for code you trust. That stop is an instruction. The script has a `requireSandbox` gate that is off unless the session sets it (the skill's instructions set it when you run inside a sandbox), and it trusts an agent's relay of the probe output. At v0.2.4, `chaos-loop.js` has no code that blocks push, merge, network access or file reads. Read the probe output the session shows you, and do not run the probe by hand outside a sandbox: it briefly writes files in your home directory and tries a TCP connection to a public address.

![A technician in a blue cap and mask works through black gloves in a glass-fronted steel glove box.](https://media0.giphy.com/media/TQFnBno49cL9k4dymy/giphy.gif)

## Cost and time

In the 22 sessions described below, the session's own total (the loop's agents included) was about $1.3 to $1.6 for a lead-only run and $1.6 to $5.0 for a fixing run of one or two rounds. A stop at a red baseline cost under $0.50. With the five default lenses a fixed finding used about 0.2M to 2.7M subagent tokens across the recorded runs; in the 22 sessions it was 0.2M to 0.8M per fixed finding. Three fixes took 12 to 24 minutes on small projects and a real library. In an early four-lens run, eight fixes in two rounds took 76 minutes on a real 350-line module. The longest wall time in the README's evidence table, on v0.2.1 against a real project, was about 9.5 hours (about 7 of them laptop sleep) for 2 fixes. The interactive defaults of 3 rounds and 6 findings per round allow up to 18 fixes, so start with `--max-rounds 1 --max-findings 2`. Set a spending limit (`--max-budget-usd` in a headless session; it is a client-side estimate and can overshoot).

![A red-framed glass hourglass on a white background as dark red sand falls from the top bulb into the bottom bulb.](https://media0.giphy.com/media/fjI4obbsgcvGNyg0F2/giphy.gif)

## What was measured and what was not

The main live evidence is 22 sandboxed headless sessions of the published v0.2.2 plugin, on 24 and 25 November 2026. I ran them on local clones of eight of my own projects: three Python, two Node, one bash, two Go. The sessions used Claude Code 2.1.331 and Sonnet 5.5. Twelve sessions committed 20 fixes. Six stopped early, five of them at a red baseline. Four were lead-only or confirmed no break. Fresh AI agents re-checked every fix and rated 2 sound, 15 sound with notes, 2 doubtful and 1 wrong. The wrong one broke a package my narrowed judge left out. I merged none of the fixes into those projects. The costs are the sessions' own reports from one Mac.

Not exercised on the current version, among other things: an interactive sandboxed session, Claude Code's sandbox on Linux or Windows, a whole-process sandbox, Go reproducers beyond two projects, a project with a build step (TypeScript, for example), and any project that is not mine. No human has audited any of it.

## Cleanup and feedback

Review the branch before deleting anything: `git worktree remove --force` and `git branch -D` discard the loop's work. The worktree shares your `.git`, so the loop also adds `refs/chaos/rejected/*` refs and `git stash` entries named `nh-chaos-monkey rejected ...` to your repository. Do not run a habitual `git stash pop`, because it could apply a rejected attempt. The scratch directory and the git-state snapshot sit outside your repository at the paths the skill prints, and they can hold secrets, so delete both. The commands are in the "Cleaning up" section of the README at github.com/sairam0424/nh-skills.

Report problems on GitHub Issues at github.com/sairam0424/nh-skills; support is best effort from one maintainer in spare time. After a lead-only run on one small module in a sandbox, use the tester report issue form. For a vulnerability, use Report a vulnerability under the Security tab, not a public issue.

![A wooden hand brush sweeps pink rose petals across a pale surface into a black dustpan held in the other hand.](https://media0.giphy.com/media/LPwZuOv1KE5c51Wzkg/giphy.gif)

nh-skills is an independent project. It is not made, endorsed or supported by Anthropic.
