---
slug: prompt-lift-v0-4-0-launch
platform: linkedin
type: text-post
status: live
published_url: ""
published_date: 2026-10-20
chars: 2958
---

# prompt-lift v0.4.0: LinkedIn launch post

## Status

Posted by the owner on 2026-10-20 (evening IST) with the hook line below, the live Dev.to and Substack URLs, and the v2 launch film `brag.mp4` attached as native video. The post URL was not captured at posting time; `published_url` stays empty until the owner provides it.

## Post text

Hook line changed on 2026-10-20 at the owner's request to frame the launch ("Launching my first Claude Code mod, prompt-lift v0.4.0: …"); the repo had been public since 0.2.0 under the old name, so the line says "first mod" and "launching", not "first public release".

See `linkedin-post-caption.txt` in this folder (2958 characters, live Dev.to and Substack URLs filled in on 2026-10-20; the hard cap for this series is 2,950, LinkedIn's own limit is 3,000). Plain text: no markdown, no emoji, three hashtags at the very end and nowhere else.

## Before posting: replace the two placeholders

- `SUBSTACK_URL` on the `Full writeup:` line -> the live Substack URL of the long-form article (`/tmp/pl-wf-out/primary-final.md`, slug `prompt-lift-v0-4-0-launch`). Series precedent: `https://sairam0000.substack.com/p/<slug>`.
- `DEVTO_URL` on the `Dev.to:` line -> the live Dev.to URL. Series precedent: `https://dev.to/sai_ram_0000/<title-slug>-<4 chars>`; the article title is long, so expect about 130 characters.

The caption was trimmed to leave room for this: with a ~70-character Substack URL and a ~130-character Dev.to URL swapped in, the projected length is about 2979 characters. If the real Dev.to slug is longer and the total passes 3,000, drop the words "(Claude Code v2.1.287 or later)" from the first bullet (31 characters) before anything else.

Post order (series convention, SEO-safe): Substack and Dev.to must be live first so both links resolve; LinkedIn goes last.

## When to post

- Same day the Substack and Dev.to articles go live, within an hour of them, so the "all checked 2026-10-20" line and the status column stay true. If posting slips to another day, re-run the live checks below and change the date in that line.
- Weekday, 09:00-11:00 IST or 18:00-20:00 IST (the hours this series has used for developer-tool launches); avoid posting while the catalogue PR status is changing.
- Re-check before pasting, all read-only: `gh api repos/sairam0424/claude-prompt-lift --jq '{stars:.stargazers_count,forks:.forks_count,issues:.open_issues_count}'` (caption says 0 / 0 / 0), `gh api repos/sairam0424/claude-prompt-lift/releases/latest --jq .tag_name` (caption says v0.4.1 is latest), `gh api repos/karanb192/awesome-claude-code-mods/pulls/341 --jq .state` (caption says open, changes requested), `curl -s -o /dev/null -w '%{http_code}' https://mods.aidojo.si/mods/sairam0424--claude-prompt-lift--prompt-lift/` (caption says 404). If any of those moved, edit the matching status fragment, not the rest of the post.

## What to pin

- Pin the launch film as the post's media: the MP4 `prompt-lift-0.4.0-launch.mp4` attached to the v0.4.0 release (1920x1080, 23.8 s, with sound, 4,585,621 bytes) uploaded as native LinkedIn video. Native video beats a link preview, and LinkedIn previews have broken before on posts with several URLs in the body (see the mindforge-v12-0-0-release and tracehub-v0-12-3 post notes). Fallback if video upload fails: `docs/demo.gif` from the tag (944x608, 25.7 s, 284,536 bytes) as an image, or no media and let the first URL preview.
- Pin the first comment: paste the install block as the first comment and pin it, so the one command stays on top of the thread:
  `/plugin install prompt-lift --marketplace sairam0424/claude-prompt-lift`
  then `/reload-plugins`, then `/prompt-lift probe`.
- If the preview breaks ("Cannot display preview") after publishing, the fallback is the series' two-step pattern: move the five URL lines of "Where it lives today" plus the two writeup links into that pinned first comment and republish the body without them.

## Source of every fact in the caption

All facts come from `/tmp/pl-wf-out/primary-final.md` (the verified long-form article) and were re-checked read-only on 2026-10-20 before writing:

- Hook / one-liner: `README.md:7` at `v0.4.0` (`git show v0.4.0:README.md`).
- Install command: `README.md:18-35` at `v0.4.0`. Minimum version v2.1.287 from `https://code.claude.com/docs/en/plugins/mods/overview.md:97` (fetched 2026-10-20 by the verify stage); the README states no minimum.
- Demo done row `fable · 0 cached · 12.3k in · 144 out · $0.18 · +42 words`: verbatim in `docs/demo.cast` at `v0.4.0`.
- Pre-guard refusals: `hooks/preguard.ts:36,53,62,70` at `v0.4.0` (minWords default 3, maxDraftChars default 4000).
- Post-rewrite refusals: `hooks/guards.ts:264,273,282,321` and `hooks/enhance.ts:61` at `v0.4.0`; 14-step pass per `guards.ts:236-350`.
- Cap command and test name: `hooks/caps.ts:38`, `tests/caps.test.ts:184` at `v0.4.0`.
- Chain default `fable,sonnet,haiku`: `hooks/config.ts:61`; every-rung billing test `tests/enhance-cost.test.ts:113`; `$? · (no price)` in `hooks/chain.ts:224`.
- Undo re-arm: `hooks/actions.ts:33,40,41` (`UNDO_REARM_MS = 10_000`).
- preview / probe: `hooks/commands.ts:332` (dynamic block marker), `hooks/commands.ts:73` (`PROBE_PROMPT = "ping"`).
- No `http.fetch` / `process.run` / `setTimeout` / `setInterval` under `hooks/`: `git grep` over `v0.4.0 -- hooks/` returns no file. Absolute `<source>` paths: `hooks/context.ts:293`, `README.md:124-139` at the tag.
- Honest gap: PR #341 reviews by karanb192 at 2026-10-20T07:02:30Z and 15:59:52Z, both CHANGES_REQUESTED (`gh api .../pulls/341/reviews`); 0.4.1 fixes per `CHANGELOG.md` on `main` (45d7130); cross-session race documented at `README.md:234` on `main`. Three other Enhance-band enhancers: `mods.json` built 2026-10-20T07:21:42Z (risen372/claude-mods, aravindsriraj/claude-code-mods, yonatangross/orchestkit).
- Closing stat: 130 commits (`git rev-list --count v0.4.0`), 329 top-level `test(`/`it(` in 31 `tests/*.test.ts(x)` files at the tag, first commit 2026-10-16 14:54 IST, tag 2026-10-19 21:57 IST pointing at `1aa0b4f`.
- Live statuses, checked 2026-10-20T16:27Z: repo public, MIT, `main` at 45d7130, 0 stars / 0 forks / 0 open issues, six topics; v0.4.0 published 2026-10-19T17:11:15Z with MP4 + poster; v0.4.1 published 2026-10-20T14:34:20Z, no assets, `latest`; PR 341 open; mods.aidojo.si page HTTP 404; claude.ai/directory not applied for (`plugins/publish.md:139`: paid plan required). All four GitHub URLs returned HTTP 200.

## Deliberate omissions

- No Desktop/VS Code claim: the README calls the mod terminal-only, the docs list the band on Desktop too, and it is untested there.
- No "14 options" / "23 options" count: `plugin.json` at the tag has no top-level `options` key, so the count was not re-verified here.
- No price-table numbers: the README's Bedrock prices were "verified 2026-10-16" by the author and not re-verified for the article.
- No claim of a published catalogue grade: the scan log graded L2 but the page and badge are 404.
