# Notes for memory-arborist-v0-1-2-launch

Written 2026-11-20 from the public repository at tag `memory-arborist--v0.1.2` (https://github.com/sairam0424/memory-arborist) and from Claude Code and Anthropic pages read the same day. The terminal captures come from a synthetic memory run with a stub `claude` (no model was called), except the doctor capture, which ran a real Claude Code on empty folders; the captures labelled FAKE MODEL use a scripted model from the repository's own test fixtures. Nothing in the article describes real notes except the README's own sentences.

Canonical choice: this article is not mirrored to Anvilry, so the series rule (canonical = anvilry.vercel.app/notes/<slug>) was not used. Dev.to goes first with no canonical set, which makes the Dev.to URL the canonical original; the Substack and Medium files point to it. Substack has no canonical field.

## What is in the article

- One body for all three platforms: nine `##` sections, no tables, no `###` headings, plain code fences, five single-line GIF embeds at section ends (`gifs-plan.md`), the README's non-affiliation sentence as the footer. The Substack and Medium files add an 'Originally published at' last line.
- The four-backtick fence around the staged report (it holds triple-backtick fences and `###` lines) is the one construct that may not render everywhere: check it in each editor.
- Placeholders: `[DEVTO_URL]` was replaced with the live Dev.to URL in the Substack and Medium files and the LinkedIn caption on 2026-11-20; `[SUBSTACK_URL]` was replaced with the live Substack URL on 2026-11-20 (clean form, without share parameters).

## Check again before you publish (these can change)

Run the git commands in a clone with tags fetched, or read the same files with `gh api repos/sairam0424/memory-arborist/contents/<path>?ref=<tag>`.

| Statement in the article | How to re-check |
|---|---|
| The terminal captures, the first-person statements and the 1,692 test sum | the author re-runs the demo and the six suites, or rephrases what cannot be re-run; the captures come from one demo run and their ids are that run's timestamps |
| Version 0.1.2, tag `memory-arborist--v0.1.2`, `stable` at the release commit | `git ls-remote https://github.com/sairam0424/memory-arborist` |
| No GitHub Release exists, so the article does not link one | `gh api repos/sairam0424/memory-arborist/releases --jq length` |
| CI passed on the release commit, ubuntu and macOS, Python 3.11 to 3.15 | `gh run list -R sairam0424/memory-arborist --workflow ci --limit 5 --json number,headSha,conclusion`, then `gh run view <number> -R sairam0424/memory-arborist --json jobs --jq '.jobs[]|[.name,.conclusion]'` |
| The README sentences the article quotes (quality line, the 0.33 and 1.30 figures, the sandbox-copy sentence, the footer) | `git show memory-arborist--v0.1.2:README.md` |
| Claude Code docs quotes (first 200 lines or 25KB, the skills placeholder rule) | re-fetch the code.claude.com/docs memory and skills pages |
| Anthropic Dreams docs, the announcement and arXiv 2504.13171 | re-fetch each and compare the wording the article uses |
| Eight distinct dollar figures in the 0.1.0 skill text, none in 0.1.1 and 0.1.2 | `git show <tag>:skills/tend/SKILL.md` then `grep -oE '\$[0-9]+(\.[0-9]+)?' | sort -u | wc -l` |
| 1,692 tests in six suites | run the six README test commands in a foreground shell with CLAUDE_CONFIG_DIR unset and add the counts |
| Install and removal commands work | run them in a throwaway Claude Code config dir |
| Security route: the article names the Security contact request issue form | check whether GitHub private vulnerability reporting is switched on for the repository, and update the sentence if it is |

## Status

| Platform | State on 2026-11-20 | Where |
|---|---|---|
| Dev.to | LIVE since 2026-11-20T12:44:36Z (id 5081852), https://dev.to/sai_ram_0000/memory-arborist-012-a-propose-only-clean-up-for-claude-code-memory-1db2 | `../../devto/memory-arborist-v0-1-2-launch.md` |
| Substack | LIVE since 2026-11-20T12:48:13Z, https://sairam0000.substack.com/p/memory-arborist-012-a-propose-only |
| Medium | not published | `../../medium/memory-arborist-v0-1-2-launch.md`; set canonical to the Dev.to URL |
| LinkedIn | POSTED 2026-11-20 with the demo video as an add-on (post URL not recorded) | `../../linkedin/memory-arborist-v0-1-2-launch/post.md` |

## Measure

After publishing, record a baseline (Dev.to reactions and comments, Substack hearts and comments, the GitHub page's stars, forks and open issues) and compare 14 days later. The article asks for one thing: how the confirmation prompt looks in default, accept-edits, auto and bypass modes.
