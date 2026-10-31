# Notes for tracehub-mcp-cost-guard-mcp-upgrade-defaults

Written 2026-10-31 from the audited evidence packs in cost-guard-mcp/scratch-pad/article-pack-2026-11 and tracehub-mcp/scratch-pad/article-pack-2026-11 (gitignored), by two multi-agent workflows (wf_30f77b87-0d5: briefs, two drafts, judge panel, fact-check, polish; wf_1dbe7936-ab4: second edit, fresh fact-checks, line edit, integrity diff). Run files: a local scratch folder (mcpsmiths-article-run-2026-11).

The evidence packs, the run folder, the fact map and the downloaded GIF files are local and are not in this repository, so the claims in the article could not be re-checked from the repository alone. A second, independent review on 2026-11-01 re-checked the live Dev.to and Substack posts, the download counts and the GIF files against public sources.

Canonical choice: this article is not mirrored to Anvilry, so the series rule (canonical = anvilry.vercel.app/notes/<slug>) was not used. Dev.to was published first with no canonical set, which makes the Dev.to URL the canonical original; the Medium file points its canonical at it. Substack has no canonical field.

## What is in the article and where it came from

- Terminal outputs in the four code blocks are verbatim captures from the evidence packs (tracehub DEMOS.md captures from the published 0.13.0 wheel; cost-guard captures from in-process fakes at v0.6.0). On 2026-10-31 the exit-2 refusal was re-run on the published tracehub-mcp 0.13.1 wheel and gave the same message, which is why the opening says "0.13.0 or later".
- Five literal Giphy GIFs sit at the end of five sections (see `gifs-plan.md` here for the verification of each). They were added after the first publish on 2026-10-31 and the live post was edited to include them. No memes. Add a real terminal recording only if you can capture one against the released builds.
- The fact map for every number and claim is kept in the local run folder (`final-factmap.md`); it is not in this repository.

## Check again before posting LinkedIn or publishing Medium (these can change)

| Statement in the article | Value on 2026-10-31 | How to re-check |
|---|---|---|
| Current releases | tracehub-mcp 0.13.1, cost-guard-mcp 0.6.0 | `gh release view -R mcpsmiths/<repo>` |
| "No 0.6.1 planned"; main is ahead only by docs, CI, lock, test and comment changes | 11 commits ahead of v0.6.0 | `gh api repos/mcpsmiths/cost-guard-mcp/compare/v0.6.0...main` |
| OTel docs fix pull request open, behind main, pip-audit and image build failed | cost-guard-mcp PR 130 | `gh pr checks 130 -R mcpsmiths/cost-guard-mcp`; delete the sentence if it merged |
| Open issues named | tracehub 49, 51, 56; cost-guard 100, 126 | `gh issue view` on each |
| Snowflake job opt-in since 2026-10-31 (PR 139), no new Snowflake account | merged 2026-10-31T16:51Z | re-read PR 139; update if you took a Snowflake account |
| Private vulnerability reporting on for cost-guard-mcp and the org .github repo | switched on 2026-10-31 | repo Security settings |
| Release-tag rulesets and branch-policy-only environments | both repos, rulesets since 2026-10-14 | `gh api repos/mcpsmiths/<repo>/rulesets` and `/environments` |
| The provenance block has not shipped | not in 0.13.1 or main | grep the source for a provenance field; if you build it, rewrite the last section |

## Status

| Platform | State on 2026-11-01 | Where |
|---|---|---|
| Dev.to | LIVE since 2026-10-31T17:45:11Z (id 4954041); edited once at 18:16:39Z to add five GIFs | https://dev.to/sai_ram_0000/upgrading-tracehub-mcp-013-and-cost-guard-mcp-06-the-defaults-i-changed-and-what-to-set-39bb |
| Substack | LIVE since 2026-10-31T18:39:10Z, published by the owner. KNOWN DEFECT: the live post carries the Dev.to body, so its two tables are flattened into run-on paragraphs ("Setting changedBeforeNowOpt-out or fix..."), and it has no "Originally published at" line. The Substack file in this repository holds the list-form text meant to replace them; the live post has not been updated to it | https://sairam0000.substack.com/p/upgrading-tracehub-mcp-013-and-cost |
| LinkedIn | Owner reported it scheduled (2026-11-01); not verified against LinkedIn. Scheduled time, which caption (`post-caption.txt` or `post-caption-whats-new.txt`) and the final hashtags were not recorded; post URL not known | see `../../linkedin/tracehub-mcp-cost-guard-mcp-upgrade-defaults/post.md` |
| Medium | not published (no report from the owner) | `../../medium/tracehub-mcp-cost-guard-mcp-upgrade-defaults.md`; set canonical to the Dev.to URL |

## Placeholders

None remain. `[DEVTO_URL]` was replaced with the live Dev.to URL in the LinkedIn captions and the Substack and Medium files.

## Measure

Snapshot taken 2026-11-01 00:43 IST (19:13 UTC), about 1.5 hours after the Dev.to publish (17:45 UTC) and about 35 minutes after the Substack publish (18:39 UTC), to compare against on 2026-11-14. Counts at this age are expected to be zero, so the 2026-11-14 comparison is the real test:

| Signal | Value |
|---|---|
| Dev.to post 4954041 | 0 reactions, 0 comments (page views are not public) |
| Substack post | 0 hearts, 0 comments |
| PyPI downloads since 2026-10-01, mirrors excluded (data to 2026-10-30) | cost-guard-mcp 697, tracehub-mcp 709 |
| GitHub stars / forks | cost-guard-mcp 1 / 0, tracehub-mcp 0 / 0 |
| GitHub views, 14 days (unique visitors) | cost-guard-mcp 40 (5), tracehub-mcp 16 (3) |

Downloads are not users: 77 to 79 percent come from unidentified clients (cost-guard-mcp 77, tracehub-mcp 79). The GitHub traffic row is read from the repository Insights pages, which are not public, so it cannot be re-checked by a reader. The test is at least one outside reply or reaction within 14 days of publishing (by 2026-11-14). The earlier combined article on these servers (tracehub-mcp 0.12.3, 6,928 words) drew none.
