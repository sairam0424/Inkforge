# Published Articles

Track published versions of articles across all platforms.

## Folder Structure

```
published/
  medium/          ← Articles live on medium.com
  substack/        ← Articles live on substack.com
  hashnode/        ← Articles live on hashnode.com
  devto/           ← Articles live on dev.to
  linkedin/        ← LinkedIn Articles (long-form)
```

## How to Use

When you publish an article to any platform, create a record file here:

**Filename:** `<slug>.md`  
**Location:** `published/<platform>/<slug>.md`

**Template:**
```markdown
---
slug: how-dns-works
title: "How DNS Actually Works"
published_url: https://medium.com/@sairam/how-dns-works-abc123
published_date: 2026-06-19
canonical_url: https://anvilry.vercel.app/notes/how-dns-works
status: live       # live | draft | scheduled
views: 0
claps: 0
---

Notes: any platform-specific notes, edits made before publishing, etc.
```

## Quick Reference — Platform Rules

| Platform | Canonical URL | Max Tags | Code Highlighting |
|----------|--------------|----------|-------------------|
| Medium   | Set in Story Settings → SEO | 5 topics | Via GitHub Gist embed |
| Dev.to   | `canonical_url` frontmatter | 4 tags | Native (fenced code blocks) |
| Hashnode | `originalArticleURL` field | 5 tags | Native |
| Substack | Add attribution line manually | N/A | Copy-paste only |
| LinkedIn | Not supported | 3 hashtags | Copy-paste only |

## Publishing Order (SEO safe)

1. Publish on **Anvilry** (sairam.dev) first — this is the canonical source
2. **Medium** — import via medium.com/p/import using the live URL
3. **Dev.to** — publish with canonical_url field
4. **Hashnode** — publish with originalArticleURL field
5. **Substack / LinkedIn** — copy-paste with attribution link
