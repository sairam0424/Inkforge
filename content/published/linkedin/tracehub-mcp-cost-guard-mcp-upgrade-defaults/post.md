---
slug: tracehub-mcp-cost-guard-mcp-upgrade-defaults
platform: linkedin
type: text-post
status: scheduled
published_url:
chars_defaults: 2089   # post-caption.txt (counts exclude the trailing newline)
chars_whats_new: 2179  # post-caption-whats-new.txt
---

# tracehub-mcp 0.13.1 and cost-guard-mcp 0.6.0: LinkedIn post

## Status

The owner reported on 2026-11-01 that the post is scheduled on LinkedIn. This is owner-reported and was not verified against LinkedIn. Not recorded: the scheduled date and time, which of the two captions was scheduled, and the final hashtag set. The caption edited last at the owner's request was `post-caption-whats-new.txt`, so it is the likelier one, but that is a guess. The post URL is not known yet: when it is live, set `status: live` and `published_url` above and set the matching `chars_*` value as the one that went out. One single post, plain text, no emoji, two hashtags at the end. The series cap is 2,950 characters.

## Checklist (state on 2026-11-01)

1. Done: Dev.to and Substack are live and both URLs are in the captions.
2. Open: re-check the volatile statements listed in `../../assets/tracehub-mcp-cost-guard-mcp-upgrade-defaults/README.md`.
3. Plain text post, nothing attached: there is no video for this one.

## The two captions

`post-caption.txt` (2,089 characters with the live Dev.to and Substack URLs filled in): the defaults-and-refusals angle.

`post-caption-whats-new.txt` (2,179 characters, written 00:28 IST on 2026-11-01): what tracehub-mcp 0.13.1 and cost-guard-mcp 0.6.0 added compared with the versions in the earlier published article (tracehub-mcp 0.12.3, cost-guard-mcp 0.3.3). Neither server gained a tool (19 and 4, checked at the tags), so the post says what changed instead: controls, limits and fields. Written from three independent drafts; a judge checked each claim against the git tags and the source and edited the winner. The "fastmcp 4.0.11 has two advisories" line was also checked against the OSV database (GHSA-7xgj-8392-5q4r, GHSA-vqqp-x5qm-5qp4). Post ONE of the two, not both on the same day.

Edited at the owner's request (00:35 IST, 2026-11-01; the text was 2,582 characters before this edit): the first line now gives both new version numbers (tracehub-mcp 0.13.1, cost-guard-mcp 0.6.0, with the earlier article's 0.12.3 and 0.3.3 as the baseline); the Limits paragraph, the line "Several of these change defaults, so read the upgrade list in the article first." and the closing ask were removed. The limits (no live Snowflake run for cost-guard 0.4.0 to 0.6.0, Databricks never live, no TLS on the tracehub HTTP listener, no default spend limit in cost-guard) are no longer in this post; they remain in the article. The exit 2 fact moved from the first line into the second tracehub bullet.

## Hashtags

Both captions carry `#MCP #OpenSource`. A wider set was discussed on 2026-11-01: `#MCP #AIAgents #Observability #FinOps #OpenSource` (optional extras: `#OpenTelemetry`, `#BigQuery`, `#Snowflake`, `#Python`). The owner's final set is not recorded. LinkedIn follower counts per hashtag were not checked.

