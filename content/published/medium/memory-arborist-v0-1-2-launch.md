---
slug: memory-arborist-v0-1-2-launch
title: "memory-arborist 0.1.2: a propose-only clean-up for Claude Code memory"
platform: medium
status: draft
canonical_url: https://dev.to/sai_ram_0000/memory-arborist-012-a-propose-only-clean-up-for-claude-code-memory-1db2
publish_note: |
  NOT PUBLISHED (draft here means a local file only). Medium-ready for the paste route (medium.com/p/import keeps only part of a long post; paste the HTML with real events, as done for the prompt-lift article). Nine ## headings kept as H2, no H3, no tables; the code blocks are plain. In Story settings set the canonical URL to the live Dev.to address (the footer line below carries it too) and choose up to five topics, for example Programming, Software Engineering and Technology; no cover image exists for this article, so add one or skip it. Medium embeds a GIF when its Giphy page URL is pasted on its own line: the five image lines in this file are Giphy media URLs, so paste each Giphy page URL from assets/memory-arborist-v0-1-2-launch/gifs-plan.md instead. The staged-report capture sits in a four-backtick fence: check it after pasting, and make sure no ### line renders as a heading.
---

A note that says deploys run on Tuesdays can outlive the move to Thursdays. Claude Code's auto memory is a folder of such notes, and memory-arborist 0.1.2 is a public beta plugin that drafts small edits to them from your past terminal sessions, checks each one and shows you a diff. I maintain it. Install is two commands, then you type /memory-arborist:tend, and it asks before any step that costs money. Its model-calling steps send note text to the provider your claude command uses, and the proposal lanes also send redacted session excerpts.

The README labels the free half stable (snapshots, restore, lint, a secret scan, a session-start hint, the doctor) and the half that calls a model experimental. A gap in the record: the README records no run where a real model's proposals went all the way through the recall check on the staged edits, promote (which writes the edits to your notes) and the check after it. Every promote and restore capture below uses a scripted model.

Per the README, nothing is applied to your notes until you say yes and any change can be undone; the limits of undo are listed below. Here, an edit is applied when you run a command called promote, and undone by restoring the backup, called a snapshot, taken just before. The aim is that no single call both proposes and approves an edit, and the sections below say where that holds and where it does not. The last checker is you.

## Quick start

You need macOS or Linux, Python 3.11 or newer and Claude Code. The recall check needs 25 to 32 fixed questions about facts in your notes, so a memory with fewer than about 25 notes worth asking about cannot reach that minimum.

Login: only Amazon Bedrock is tested. Subscription, API-key, Vertex and gateway logins are untested, and `doctor --live` makes one call of at most $0.05 and tells you whether yours works.

Claude Code: the README says the session-start hint needs 2.1.139 or newer and the model-backed steps 2.1.169 or newer. The README lists 2.1.322 and 2.1.325 as tested, the confirmation hook also 2.1.326, and older and newer versions as untested.

Two commands install the plugin from https://github.com/sairam0424/memory-arborist. At the time of writing the stable branch installs version 0.1.2, the tag memory-arborist--v0.1.2 dated 19 November 2026 (UTC). That branch moves only when a new version is released.

```text
claude plugin marketplace add sairam0424/memory-arborist#stable
claude plugin install memory-arborist@memory-arborist
```

Both commands install the plugin into your own Claude Code configuration. Then run the doctor in a terminal from the project whose memory you want to tidy, and type the skill's command in Claude Code.

```text
python3 -B -I ~/.claude/plugins/cache/memory-arborist/memory-arborist/<version>/engine/doctor/memory_doctor.py
/memory-arborist:tend
```

You type both. The captures call the skill's scripts directly, and no chat from /memory-arborist:tend is recorded here.

## Auto memory and how it goes stale

By default, auto memory lives in ~/.claude/projects/<project>/memory/: a MEMORY.md index with one line per memory, and one topic file per memory, called a note here. The docs say: "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation." The pages quoted here were read on 20 November 2026.

The only automatic upkeep the docs describe happens inside a session. When MEMORY.md nears or passes a limit, Claude Code tells Claude to shorten it and to merge or drop stale entries. The README names two problems: stale, contradicted or half-duplicated notes, and an index that creeps toward the limit where Claude Code stops reading it.

If your index is short enough to re-read comfortably, edit it by hand; I would expect the steps below to be more work than the problem. This is for memories you can no longer re-read, where you want each edit tied to a quote from a past session.

In the synthetic memory behind most of the captures below, one note says "Deploys run every Tuesday at noon." and its index line repeats it. A later made-up session says deploys moved to Thursday afternoons.

Three limits differ. Claude Code loads the first 200 lines or the first 25KB of the index, whichever comes first; lint warns at 160 lines or 20,000 characters; this tool's own session-start hint fires at 140 lines or 18,500 characters. The hint script was called directly, outside a live session. On a synthetic memory whose index is under 18,500 characters it prints nothing at 139 lines and speaks at 140; the capture shows 140.

Every capture except the doctor run comes from a synthetic memory; the doctor run used empty folders. Captures introduced as scripted use a scripted model, so they show layout and mechanics and say nothing about model quality. Paths are shortened: <plugin> is the installed plugin, <notes> your memory folder and <demo> the example setup's root folder; ~ is a throwaway home and [...] marks cut lines. Snapshot and run ids are UTC timestamps.

```text
$ python3 -B -I <plugin>/engine/memory_headroom_nudge.py --dir <demo>/edge/lines140/memory
Memory index is 6686 characters and 140 lines (Claude Code's documented read limit is 200 lines or 25KB; lint warns at 20000 characters and 160 lines). Tell the user it is getting full and suggest the memory-arborist:tend skill, memory_hygiene.py lint or hand-trimming; do not run any of them unless the user asks.
```

![A hand presses a dark grey archive box onto a metal shelf beside another box.](https://media0.giphy.com/media/FovhbDkjBtYs5SxJyS/giphy.gif)

## The dream run: a manual, propose-only pass over past sessions

The skill is /memory-arborist:tend. The repository calls the step that drafts and stages the edits a dream run: a manual, propose-only pass over what happened in past terminal sessions. A person starts the nine-step pass below, nothing schedules it, and every model call goes through your own claude command-line tool. The steps that call a model belong to the experimental half.

By default it works on the current project's memory and learns from terminal sessions only; you can add editor or desktop sessions, but a custom autoMemoryDirectory is not read. Each proposed edit is a hunk: the old passage, the new one and a session quote offered as its evidence.

Anthropic announced dreaming for Claude Managed Agents in May 2026, calls it "a scheduled process", and documents it as a research preview on the Claude Platform API. It is a different product and nothing here uses it. The documented Dreams API is not a Claude Code feature. A 2025 paper, "Sleep-time Compute: Beyond Inference Scaling at Test-time" (arXiv 2504.13171), proposes letting a model work on a context before any question arrives. Its main results are on two modified reasoning tasks, and it did not test Claude Code memory.

## One pass, step by step

Step 0 is the doctor, free unless you add `--live`: it checks Python, Claude Code and your folders and prints names, versions and counts only.

In a clean environment on empty folders, with a real Claude Code 2.1.328 (outside the tested list), the doctor warns about a missing pinned.txt and no recall questions. No paid step ran.

```text
$ python3 -B -I <plugin>/engine/doctor/memory_doctor.py
INFO plugin     memory-arborist 0.1.2
[...]
OK   claude     claude 2.1.328
[...]
WARN pinned     pinned.txt is missing: the dream run stops at once without it
[...]
WARN questions  0 recall questions (the judge needs 25 to 32)
     fix: the question wizard proposes a set from your notes (about 1 USD); see 'Before step 3' in the skill, or run recall/memory_recall_wizard.py propose after a snapshot
[...]
DOCTOR ok=6 warn=2 fail=0 info=3
```

Step 1 is free too: lint, a snapshot whose files are hash-checked against a manifest, and a secret scan. On a copy of the synthetic memory with one fake token-shaped string, the scan prints the file, line and pattern and never the value.

```text
$ python3 -B -I <plugin>/engine/memory_hygiene.py scan --no-log
BLOCK reference-ci-access.md:8:GitHub Token
WARN project-checkout-redesign.md:6:Email
SCAN block=1 warn=1 skipped=0
```

Step 2, also free, builds evidence extracts (the output calls them digests): redacted excerpts of terminal sessions idle for at least six hours, newest first, at most 60 by default.

Six made-up transcripts in the synthetic memory give five extracts, because the sixth was a headless (non-interactive) run, which stays out on purpose; two fake-secret messages are dropped and one e-mail address is masked. The "nothing leaves this machine" line is true of this free step only.

```text
$ python3 -B -I <plugin>/engine/memory_evidence.py build --limit 60
BUILD-START sessions=6 limit=60 (reading a large transcript folder can take a few minutes; nothing leaves this machine)
BUILD ok digests=5 bytes_total=2208 secret_records_dropped=2 skipped_existing=0 pii_records_masked=1 skipped_non_cli=1
[...]
```

Before step 3 you create pinned.txt, the list of index lines a dream run must never edit. `memory_dream.py pin --none` protects none, which suits a first run.

You also accept the 25 to 32 recall questions the paid question wizard proposes. Step 3 is the baseline, which the README says costs cents. The judge asks the questions of your memory twice, to see how much the answers flip on their own. It asks them of an empty memory once, and the baseline refuses a question set that passes too often without your notes.

Step 4 is paid; the cost section below has the figures. Several model calls, called the proposal lanes, look for stale notes, write edits and check them. The checks in the next section then filter the hunks, and at most ten are staged outside your memory directory. Exit code 5 means some calls failed, so an empty result does not mean nothing needed changing.

A scripted model on a synthetic memory produced this report, so it shows the layout you read and says nothing about model quality.

````text
$ cat <demo>/ops-fake/-home-dev-shop-api/dream/20261119T201155Z/report.md
[...]
### h1  project-deploys.md  (edit)

Why: you moved deploys to Thursday afternoons

Evidence:
  - session bf28b409-3990-503d-9efd-82931d33e7e3: "we moved the deploys to Thursday afternoons last week"

Old:

```
Deploys run every Tuesday at noon.
```

New:

```
Deploys run every Thursday afternoon.
```
[...]
````

Step 5 is paid: the judge asks the staged copy the same questions. REGRESSIONS counts questions that passed in every baseline run and fail in every staged run, and a fact the run deliberately changed can appear there. RESURRECTED stays zero unless you wrote questions asking whether an OLD value comes back.

Step 6 is you: read the report and say yes or no to the whole pass. Step 7 is promote, which the skill runs only after that yes; a paid judge check follows it.

On a synthetic memory with a scripted model, the dry run prints the content hash of the staged edits (the output labels it DIGEST), and promote --apply must carry it back with --expect. The dry run is on the run behind the report and the apply on a second copy with the same staged content, so the hash matches although the run ids differ. Promote and restore ran directly, with no confirmation prompt.

```text
$ python3 -B -I <plugin>/engine/memory_dream.py promote 20261119T201155Z
[...]
DIGEST 49d3b2bf0713356c499c88202e400ba50195df26e099ff82e0d5e6302c443aaf
DRY RUN: nothing changed; add --apply --expect 49d3b2bf0713356c499c88202e400ba50195df26e099ff82e0d5e6302c443aaf to promote 2 hunks in 2 notes
```

```text
$ python3 -B -I <plugin>/engine/memory_dream.py promote 20261119T201158Z --apply --expect 49d3b2bf0713356c499c88202e400ba50195df26e099ff82e0d5e6302c443aaf
[...]
DIGEST 49d3b2bf0713356c499c88202e400ba50195df26e099ff82e0d5e6302c443aaf
[...]
PROMOTED 2 notes; pre-promote snapshot 20261119T201157Z; old copies in <demo>/ops-fake/-home-dev-shop-api-undo/archive/20261119T201158Z
```

```text
$ grep -n 'Deploys run\|deploys run' <notes>/project-deploys.md <notes>/MEMORY.md
[...]
<demo>/cfg/projects/-home-dev-shop-api-undo/memory/project-deploys.md:6:Deploys run every Thursday afternoon.
<demo>/cfg/projects/-home-dev-shop-api-undo/memory/MEMORY.md:7:- [Deploy schedule](project-deploys.md) — deploys run every Thursday afternoon
```

Step 8 is undo. `memory_hygiene.py snapshots` lists your snapshots.

Undoing a scripted model's edits on the synthetic memory takes restore: a dry run names the note, and applying archives the live copy first. The same command with --file MEMORY.md restores the index line, and the grep shows both lines at Tuesday again.

```text
$ python3 -B -I <plugin>/engine/memory_hygiene.py restore --snapshot 20261119T201157Z --file project-deploys.md
would restore project-deploys.md from snapshot 20261119T201157Z (live file differs)
```

```text
$ python3 -B -I <plugin>/engine/memory_hygiene.py restore --snapshot 20261119T201157Z --file project-deploys.md --apply --force
archived live copy -> <demo>/ops-fake/-home-dev-shop-api-undo/archive/20261119T201159Z/project-deploys.md
restored project-deploys.md from snapshot 20261119T201157Z
```

```text
$ python3 -B -I <plugin>/engine/memory_hygiene.py restore --snapshot 20261119T201157Z --file MEMORY.md --apply --force
archived live copy -> <demo>/ops-fake/-home-dev-shop-api-undo/archive/20261119T201159Z/MEMORY.md
restored MEMORY.md from snapshot 20261119T201157Z
```

--force is needed because the live note now differs from the snapshot copy; the live copy is archived first.

```text
$ grep -n 'Deploys run\|deploys run' <notes>/project-deploys.md <notes>/MEMORY.md
[...]
<demo>/cfg/projects/-home-dev-shop-api-undo/memory/project-deploys.md:6:Deploys run every Tuesday at noon.
<demo>/cfg/projects/-home-dev-shop-api-undo/memory/MEMORY.md:7:- [Deploy schedule](project-deploys.md) — deploys run every Tuesday at noon
```

![Green glass bottles move in a row under silver filling nozzles on a bottling machine.](https://media0.giphy.com/media/xT5LMQcN29TwKWnDIk/giphy.gif)

## What the code enforces and what rests on you

In the skill's order a proposal meets four checkers: a paid verifier call told to try to refute it, free grounding code that checks its quote, a recall judge, and you. Promote itself never reads the judge's result. It re-checks the hunks and the staged copy, verifies the content hash and refuses if a note changed since the snapshot.

Of this plugin's commands only two write to your notes, promote and restore, each with `--apply`. Claude Code can still write that folder in a live session.

The proposal lanes and the question wizard run claude as child processes with no tools. A run aborts if a child reports any tool. The check compares the reported list and does not watch tool use.

Each hunk then meets one paid verifier call. Its prompt (read, not run) says to try to refute the edit and reject if unsure, yet it runs on the same model setting as the writer and can be wrong.

Free grounding is code. It confirms that each quote exists in an evidence extract and that at least one was typed by a person. It rejects links, paths, commands and figures found in neither the old text nor a typed quote. It cannot judge whether the new words follow from the quote.

The recall judge puts the 25 to 32 questions to your memory and then to the staged copy. Its child processes are not tool-less: they get Read, Grep and Glob. It finds forgetting and does not find leftover staleness.

You are the last checker, because no check can know whether an edit that passes is the one you wanted. Promote needs the content hash that a dry run printed for exactly the staged content. That covers the hunks and staged notes and leaves out the rest of the report, such as its rejected list. A hand-fed test showed a wrong hash and a missing one each refused, with nothing changed. The hash cannot prove you read the diff.

Promote first takes a verified snapshot, or reuses the latest one when nothing changed, which no capture shows. It refuses if a note it would replace has changed since the snapshot the run was staged from. A live session can write a note in the few microseconds while promote or restore swaps one in, and that write can be lost. A power cut is not covered.

Before any call that sends note text, the notes are scanned. A match on one of 19 block-tier secret shapes refuses that run with exit status 4. It prints counts and file names only, and `--allow-secret-shapes` overrides it for that one run. A secret with no recognisable shape passes. I am not claiming a security audit.

With one fake secret shape in the notes of a synthetic memory, the proposal step refused before any model call.

```text
$ python3 -B -I <plugin>/engine/dream/memory_dream_run.py run
[...]
REFUSED: the notes cannot be sent: 1 block-tier secret shape in 1 file: reference-ci-access.md (1). Nothing was sent to the model provider. Remove the text from the note and take a fresh snapshot (memory_hygiene.py scan shows file:line:pattern for the live notes), or pass --allow-secret-shapes if you accept sending it.
```

A hook makes Claude Code ask before promote --apply, restore --apply and any `memory_*` script run with --allow-secret-shapes. It only ever answers "ask". It is a seat belt, not a sandbox: it misses a command assembled at run time. The skill's own asks are instructions to Claude, and no code enforces them. Headless runs on Claude Code 2.1.325 to 2.1.327 refused the gated commands, because a headless ask counts as a refusal. The prompt as a person sees it, auto mode and an interactive bypass session are untested. Until you have seen the prompt appear on your setup, treat the skill's own instruction to ask as your sole human check before promote --apply.

![A key slides into a cut-away brass lock, the spring pins line up, and the key turns the cylinder.](https://media0.giphy.com/media/QnwqzRz2FHtT2/giphy.gif)

## What was measured and what was not

Per the README, quality has been measured only on a synthetic memory: a fixture with eight planted stale facts, eight steady ones and four traps. The README reports five of the eight stale notes fixed and three deferred to the next run by the ten-hunk cap. "Fixed" meant an accepted hunk for the note contained the new value as a case-insensitive substring; nobody graded wording.

The README records two live runs, on two versions of that fixture, and gives one split, five fixed and three deferred. It does not say whether both runs produced it. Every fact there has a clean answer and the new value is typed word for word, so the README warns that the runs guarantee nothing about your notes. They exercised the finder, writer, verifier, grounding and staging, and left out the judge, the wizard, promote and the hook.

For real notes, the README records a full pass on one memory of about 400 notes that proposed nothing. Separately it says "on a sandbox copy of the author's own memory it found nothing to change", and it does not say whether the two are one run. Neither shows that a memory was clean or that the tool can find a stale note in real memory. Neither the number of real stale notes it finds nor how often it proposes something you would reject has been measured, the README says.

In a normal foreground shell with CLAUDE_CONFIG_DIR unset, the six test suites pass, and added up they hold 1,692 tests. They call no real model and say nothing about model quality. CI passed on the release commit on ubuntu and macOS, Python 3.11 to 3.15.

Grounding looks for figures that appear nowhere in the old text or in a quote you typed, but it only sees figures of two or more characters. In a hand-built test the typed evidence said "every two weeks" and a hand-written hunk changed "weekly" to "every 3 weeks"; grounding passed it, because a lone 3 is invisible to it. The paid verifier is the one model call that weighs meaning, and no recorded run shows it catching a wrong number: in the second run the README records it rejecting two hunks that went beyond the evidence, neither with a wrong figure. You have to read the diff.

## What broke on the way

In 0.1.0 the skill's costs used a dollar sign and a digit: eight distinct dollar figures. Claude Code expands placeholders such as `$1` in skill text from the arguments you type, so figures like $0 and $1 could turn into words. The test that guards this records two examples, "about person" and "You.33". Version 0.1.1 writes its costs as "N USD", and a test fails if the old pattern returns.

Versions 0.1.0 and 0.1.1 started a call whenever spending was under the ceiling, the spend at which that command stops. With W workers a run could overshoot it by up to W times a call's cap. Since 0.1.2 a running call counts as spent at its cap: eight workers against a 1 USD ceiling with a 0.25 USD cap now start four calls. It is still not a hard cap: a run can pass the ceiling by less than one call's cap, a call's cap is the child's own estimate, and a timed-out child is charged an assumed cap instead of its billed cost.

A promote killed halfway in 0.1.0 or 0.1.1 left only a one-line message that a note had changed since the snapshot. Now a promote writes a started marker before any note moves. Promoting the same run again, as a dry run or an apply, says the earlier one did not finish, names the snapshot and prints the restore command. No other command looks for a killed promote. The tests kill a real promote with SIGKILL, and a power cut is not covered.

![A grey wrench fits over a hex nut on a teal background, turns it, lifts off and fits again.](https://media0.giphy.com/media/hY2reRurgUNekafQ45/giphy.gif)

## Cost, and what leaves your machine

The README gives these measured costs. The two seeded live runs cost about $0.37 and $0.39. A full pass on one memory of about 400 notes proposed nothing and cost about $0.33; nothing records whether every call in that pass succeeded, so the figure may not describe a fully successful pass. The skill skips steps 5 to 7 when nothing is staged, so that figure leaves out the recall check on the staged copy, promote and the check after it. That is a rule of the skill, not a result of that run. The question wizard cost about $1.30 for its default eight batches on one 393-note memory, sampling up to about 80 notes. The doctor's fix line says "about 1 USD", a round hint; $1.30 is the one measurement. Yours will differ.

In tokens, the plugin adds about 100 to every session and about 4k when you start the skill, by Claude Code's own rounded estimate.

Every paid command prints an ESTIMATE line first, with each call's cap and the ceiling at which that command stops. The default ceilings are $3 for the wizard, $5 for each judge run and $8 for the proposal lanes. If every step spent its full ceiling, with three judge runs counted, the total would come to about $26. That is a ceiling on a sum, not a cost, and the ceilings are soft, as the section above says. How long a paid pass takes was not measured.

Note text goes to the provider your claude command-line tool is configured for, and only the proposal lanes also send redacted transcript excerpts. Each evidence extract also carries the session's working-directory path, and a judge question shows in the process list during its call. Redaction is best effort and misses rot13 or base85 text, look-alike characters, short bare random strings with no cue word, bare UUIDs and any secret with no recognisable shape.

## Remove it, and what to report

To remove it, uninstall, remove the marketplace and delete the data root yourself, normally ~/.claude/memory-arborist/. The tool never deletes from it, so it only grows. prune-plan prints removal lines for old snapshots and purge-plan for the evidence folder; archive/, dream/ and recall/proposed/ have no plan, so you remove them by hand.

```text
claude plugin uninstall memory-arborist@memory-arborist
claude plugin marketplace remove memory-arborist
```

In a throwaway configuration the plugin's cached copy stayed on disk after an uninstall, so delete it by hand if you want it gone.

To report a problem, run the doctor and open an issue with its output, which holds names, versions and counts only. If your login is not Bedrock, report what `doctor --live` says. Support is best effort from one maintainer. For a security problem, use the Security contact request issue form, which asks for no details, and do not open a public issue. I most want to hear how the confirmation prompt looks in default, accept-edits, auto and bypass modes.

![A hand pushes a black power adapter into a brass wall plate until it sits flat.](https://media0.giphy.com/media/mvc9J2LujA3kc/giphy.gif)

memory-arborist is an independent project. It is not made, endorsed or supported by Anthropic.

Originally published at https://dev.to/sai_ram_0000/memory-arborist-012-a-propose-only-clean-up-for-claude-code-memory-1db2
