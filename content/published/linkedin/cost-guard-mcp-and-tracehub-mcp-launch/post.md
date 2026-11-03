---
slug: cost-guard-mcp-and-tracehub-mcp-launch
platform: linkedin
type: text-post
status: draft
note: |
  Combined single-post announcement for both mcpsmiths MCP server launches, released
  the same day. User trimmed the first merged draft further by hand (tracehub-mcp now
  leads, 2 bullets per project instead of 4, license/injection-detail bullets cut) —
  this file reflects that user-edited version, then adds two things on request:

  1. One "how to use it today" bullet per project, with the exact install command
     verified against each project's own README (uvx tracehub-mcp --backend jaeger
     --url http://localhost:16686; uvx cost-guard-mcp) rather than invented.
  2. A "Published:" section listing BOTH live platforms per project (Dev.to + Substack),
     not just the Substack link the earlier draft had.

  Also added a "claude mcp add" one-liner for tracehub-mcp only, not cost-guard-mcp -
  checked both READMEs first. tracehub-mcp's Jaeger backend needs no credentials, so
  `claude mcp add tracehub-mcp -e BACKEND_TYPE=jaeger -e BACKEND_URL=... -- uvx
  tracehub-mcp` is a genuine one-liner (verified in the README at two separate lines).
  User then asked directly whether cost-guard-mcp really has no Claude Code path. Checked
  further: the README's own "fastest path" quickstart confirms GOOGLE_APPLICATION_CREDENTIALS
  must be explicitly set inside the client's server config - `gcloud auth
  application-default login` alone is not picked up automatically by the server process.
  No `claude mcp add` one-liner is documented in the repo (only `add-json` with a full
  JSON object, or a manual .mcp.json edit) - but `claude mcp add` supports `-e KEY=value`
  the same way the tracehub-mcp line uses, so a real, valid command exists even though
  cost-guard-mcp's own README never writes it this way. Asked the user whether to include
  it given it needs a placeholder path (not copy-paste-verbatim like tracehub-mcp's, whose
  Jaeger default needs no credentials at all) - user chose to include it.

  User then finalized the file by hand: dropped the "Published:" section back down to
  just the two Substack "Full writeups" links (no separate Dev.to lines), and turned the
  closing "Zero infrastructure, 60 tests..." line into its own -> bullet. This file
  reflects that final, user-approved version verbatim.

  No backticks - LinkedIn renders no markdown. 233 words / 1,972 chars total for both
  projects combined.

  This post is the one intended to actually go out for the simultaneous launch. The two
  standalone per-project captions remain on disk as valid assets for any future context
  where the two need to be announced separately.
---

## Post text

See post-caption.txt

## Upload instructions — zero links in the body, all 4 in the first comment

Two failed attempts before this version, both confirmed by the user's own screenshots:
  1. All 4 links in the body (2 GitHub + 2 Substack) -> "Cannot display preview."
  2. Trimmed to 1 real link (tracehub-mcp's Substack writeup) plus 2 `http://localhost:16686`
     example strings inside command lines -> still "Cannot display preview."
Checked all 4 real URLs directly (curl with a LinkedIn-bot user agent) - every one returns
valid, complete Open Graph tags. Nothing on the source side was ever broken.

Attempt 2 failing points at the likely real cause: `http://localhost:16686` appeared earlier
in the body than the Substack link, and a loopback address can never resolve from LinkedIn's
servers. If LinkedIn's crawler tries the FIRST url-shaped string it finds and gives up on
failure rather than trying the next one, that alone explains both failures - a dead link
earlier in the text would poison the whole preview attempt regardless of what's later on.

Rather than keep guessing at the exact picking algorithm, this version removes every
url-shaped string from the body - INCLUDING the two localhost command examples, rewritten as
`--url <your-jaeger-url>` / `GOOGLE_APPLICATION_CREDENTIALS=<your-service-account-path>`
placeholders instead of literal addresses. Verified by regex (matching both `http(s)://` and
`www.` patterns): zero hits in post-caption.txt. A post with no link candidates at all cannot
show "Cannot display preview," regardless of LinkedIn's exact algorithm - this is the most
robust fix available without being able to test directly against LinkedIn's crawler.

All 4 real links (2 GitHub + 2 Substack writeups, tracehub-mcp then cost-guard-mcp to match
the body's own ordering) now live only in first-comment.txt.

1. Go to LinkedIn -> Create post
2. Clear the compose box completely, then paste ONLY post-caption.txt as the post body
3. Confirm no "Cannot display preview" banner appears (there should be no preview attempt at all now, since there's nothing url-shaped in the text)
4. Post it
5. Find your own post in the feed, click Comment, and paste ONLY first-comment.txt there
6. Add a genuine reply to the first few comments within 2 hours
