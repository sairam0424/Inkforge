# Publishing Guide

## Supported Platforms

| Platform | Method | API Support | Notes |
|---|---|---|---|
| **sairam.dev (Anvilry)** | Auto-mirror on generate | ✅ Native | Velite picks up `.mdx` on `pnpm content` |
| **Dev.to** | `inkforge publish --platform devto` | ✅ REST API | Requires `DEVTO_API_KEY` |
| **Hashnode** | `inkforge publish --platform hashnode` | ✅ GraphQL v2 | Requires `HASHNODE_API_KEY` + `HASHNODE_PUBLICATION_ID` |
| **Medium** | Manual paste via `medium.com/p/import` | ❌ Deprecated | Import from URL preserves formatting |
| **Substack** | Manual paste | ❌ No API | Add attribution line at bottom |
| **LinkedIn** | Manual upload (PDF carousel) | ❌ No public API | Use generated `linkedin-carousel-*.pdf` |

---

## Cross-Posting Order (SEO safe)

Always publish in this order to establish canonical authority:

```
1. Anvilry (sairam.dev)     ← sets the canonical source
       ↓ wait for deploy (~2 min)
2. Medium                   ← import from URL → canonical auto-set
3. Dev.to                   ← canonical_url field in API call
4. Hashnode                 ← originalArticleURL field in API call
5. Substack / LinkedIn      ← copy-paste with attribution
```

The `canonical_url` tells Google which URL is the "original" — cross-posting WITH canonical = safe. Without canonical = splits search ranking signals.

---

## Medium Publishing Rules

Medium's editor has specific limitations verified against official docs (2025-2026):

| Element | Support |
|---|---|
| H1 (Header) | ✅ `Cmd+Opt+1` |
| H2 (Subheader) | ✅ `Cmd+Opt+2` |
| H3 | ❌ Does not exist — use bold instead |
| Tables | ❌ Not supported |
| Code blocks | ✅ No syntax highlighting — use GitHub Gist embeds |
| Images (PNG/JPG/GIF) | ✅ Upload directly |
| SVG | ❌ Not accepted — convert to PNG first |
| Bold/italic | ✅ |

**Import from URL (recommended):**
1. Publish article on Anvilry first
2. Go to `medium.com/p/import`
3. Paste the live Anvilry URL
4. Medium imports and preserves H1/H2/bold/italic/code blocks
5. Set canonical URL in Story Settings → SEO

**Cover image:** 1400×787px PNG (use `assets/cover-medium.png`)

**Tags:** max 5 — use `System Design`, `Programming`, `Software Engineering`, `Computer Science`, `Technology`

---

## Dev.to Publishing

Dev.to is the most implementation-ready target (Forem REST API v1):

```bash
# Draft (default)
inkforge publish --slug your-slug --platform devto

# Live
inkforge publish --slug your-slug --platform devto --published
```

The canonical URL is automatically set to `INKFORGE_CANONICAL_BASE/your-slug`.

Frontmatter fields sent:
- `title` — from article frontmatter
- `body_markdown` — article body
- `published` — true/false
- `tags` — first 4 tags from article (Dev.to max)
- `canonical_url` — from `INKFORGE_CANONICAL_BASE`

---

## Hashnode Publishing

```bash
inkforge publish --slug your-slug --platform hashnode
```

Uses GraphQL `publishPost` mutation. Requires both `HASHNODE_API_KEY` and `HASHNODE_PUBLICATION_ID` (find your publication ID in Hashnode dashboard → Settings).

---

## LinkedIn Carousel (PDF)

LinkedIn document/carousel posts achieve 7.00% avg engagement rate (Socialinsider, 1.3M posts, 2025 data) — highest of all post formats.

**Workflow:**
1. Generate 10 PNG slides using Playwright (see `content/published/linkedin/<slug>/slides/`)
2. Combine into PDF: `content/published/linkedin/<slug>/assets/<slug>.pdf`
3. On LinkedIn: Start a post → click document icon (📄) → upload PDF
4. Set document title in the upload dialog
5. Add caption from `content/published/linkedin/<slug>/post.md`
6. Post and reply to every comment within 2 hours (+30% engagement, Buffer study)

**Caption rules:**
- Keep caption SHORT — let the slides do the work
- Put article links IN the caption body (not in first comment) — unverified if links suppress reach
- Use genuine question at end, not engagement-bait
- Max 5 hashtags in `#SystemDesign #Networking` style

---

## Substack Publishing

No developer API exists. Workaround:

1. Copy article body from `content/articles/<category>/<slug>/index.md` (everything below frontmatter)
2. Paste into Substack editor
3. Add at the bottom:
   > *Originally published at [your portfolio URL]*
4. This is the attribution that tells Google the original source

---

## Canonical URL Strategy

Set `INKFORGE_CANONICAL_BASE` in `.env`:

```bash
INKFORGE_CANONICAL_BASE=https://anvilry.vercel.app/notes
```

All publishers automatically append `/<slug>` to form the full canonical URL:
```
https://anvilry.vercel.app/notes/how-dns-works
```

This tells Google: your portfolio is the original, all cross-posts are mirrors. No SEO penalty for cross-posting as long as canonical is set correctly.
