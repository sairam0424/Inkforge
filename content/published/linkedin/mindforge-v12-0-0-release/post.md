---
slug: mindforge-v12-0-0-release
platform: linkedin
status: draft
published_url: ""
published_date: ""
---

## Posting instructions (links now in the body, per explicit user request 2026-09-24)

Earlier rounds in this series settled on a zero-URL-in-body / links-in-first-comment
workaround after LinkedIn's link-preview crawler repeatedly broke ("Cannot display
preview") on posts containing more than one URL-shaped string, or an unreachable one, in
the body. The user asked this time for the real links to live inside the post itself
instead, so `post-caption.txt` now ends with 4 links (Dev.to writeup, Substack, npm,
GitHub Release) as its own paragraph after the closing line, rather than moving them to
`first-comment.txt`. This reintroduces the exact risk factor (multiple URLs in one body)
that broke the preview in an earlier round — flagged here, not silently avoided, per the
user's explicit call.

1. Paste `post-caption.txt` as the post body (links included).
2. Publish.
3. `first-comment.txt` is left as a fallback file (not the primary plan this time) — still
   has all 6 links (adds MCP server + SDK) in case the preview breaks again and you want to
   revert to the two-step pattern: delete the links from `post-caption.txt`, republish, then
   paste `first-comment.txt` as the first comment.

LinkedIn renders no markdown — both files are already plain text with no
backticks/asterisks/headings.

## Context / fact-check notes

Grounded in the same 8-pillar dynamic-workflow research + verify/polish pass as the primary
article (`content/articles/system-design/mindforge-v12-0-0-release.md`) — see that file's
frontmatter summary and the devto tracking file's `note` field for the full verification
trail. Two version-framing corrections were folded in after the workflow completed and I
re-checked the live MindForge repo directly:

- The workflow's own verify stage caught its dossier's first-pass claim of "29 npm releases
  from v10.0.1" as wrong — the real, live npm history is 76 releases from v1.0.0 through
  v11.9.9. That correction is reflected here (this caption says "release 76").
- Mid-research, the workflow independently discovered the live repo had moved onto a branch
  named `fix/v12-release-audit` whose commit called v12.0.0 "the first-user-release cut" —
  and found, unprompted, the exact same class of bug (a fabricated install success banner)
  the project's own in-flight audit was fixing. Re-checked the repo twice more by hand
  after the workflow finished: first when v12.0.0 had merged to `main` (PR #298) with a
  formal CHANGELOG entry ("[12.0.0] — First release aimed at real external users"), fixing
  1 CRITICAL + 4 HIGH + 8 MEDIUM/LOW findings (10/10 independently re-verified before
  fixing), but was not yet tagged/published; then again once it was. **v12.0.0 is now
  tagged and live on npm** — `latest`/`stable` both point to it, `mindforge-mcp-server` and
  `mindforge-sdk` shipped alongside it at the same version, and it's the 77th total
  release. This caption was updated to match that final, confirmed state.

Coordinated with a concurrent peer session (name: not-humans-world-2b) that was doing the
real v12.0.0 fix/merge/publish work live while this research ran — confirmed no file
conflicts throughout (their work was entirely inside the MindForge repo; this content
lives in Inkforge).
