---
slug: trelix-v1-launch
platform: linkedin
type: text-post
status: draft
carousel_slides: 15
carousel_pdf: carousel.pdf
---

## Post caption (for carousel upload)

See post-caption.txt

## Post text (single text post — alternative to carousel)

I spent my first day on a new team grepping through 80,000 lines of code trying to understand where authentication worked.

4 hours. Three teammates interrupted. Twelve dead ends.

The code was fine. The tooling was the problem.

I built trelix to fix this.

trelix indexes any codebase with Tree-sitter AST, then answers questions using hybrid BM25 + vector + call-graph search, fused via Reciprocal Rank Fusion across 7 retrieval legs. It works offline. No API key. Single SQLite file. Zero infra.

The three things I keep coming back to:

`trelix review --pr owner/repo#42 --post-comments` — GitHub PR review with full codebase context, posts findings back automatically.

`trelix search-all "JWT validation"` — federated search across all your repos simultaneously.

`claude mcp add trelix -- trelix-mcp` — one command to make trelix available inside Claude Code and Cursor.

The design choice I'd make again: zero infrastructure by default. Everything lives in a single SQLite file. Most developers don't want to run a vector database just to search their own code.

1,508 tests. 20+ languages. MIT licensed. On PyPI today.

Full story in the first comment.

What's the longest you've spent trying to understand a piece of code you didn't write?

https://github.com/sairam0424/trelix

## Upload instructions

1. Go to LinkedIn → Create post → Add document
2. Upload carousel.pdf (1.68MB, 15 slides)
3. Add cover title: "trelix — Code Intelligence Engine"
4. Paste post-caption.txt as the post body
5. First comment: link to Dev.to article
