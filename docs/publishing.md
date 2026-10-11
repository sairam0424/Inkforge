# Publishing Guide

## Supported Platforms

| Platform | Method | API Support | Notes |
|---|---|---|---|
| **sairam.dev (Anvilry)** | Auto-mirror on generate | ✅ Native | Velite picks up `.md` + `.mdx` on `pnpm content` |
| **Dev.to** | `inkforge publish --platform devto` | ✅ REST API | Requires `DEVTO_API_KEY` |
| **Hashnode** | `inkforge publish --platform hashnode` | ❌ API decommissioned (2026-06) | browser-harness automation against your own logged-in Chrome — requires `HASHNODE_EDITOR_URL`; manual fallback below |
| **Medium** | `inkforge publish --platform medium` | ❌ No public API | browser-harness automation via `medium.com/p/import` against your own logged-in Chrome; manual fallback below |
| **Substack** | Manual paste | ❌ No API | Add attribution line at bottom |
| **LinkedIn** | Manual upload (PDF carousel) | ❌ No public API | Use generated `linkedin-carousel-*.pdf` |

---

## Cross-Posting Order (SEO safe)

Always publish in this order to establish canonical authority:

```
1. Anvilry (sairam.dev)     ← sets the canonical source
       ↓ wait for deploy (~2 min)
2. Medium                   ← browser-harness automation via medium.com/p/import → canonical auto-set
3. Dev.to                   ← canonical_url field in API call (automated)
4. Hashnode                 ← browser-harness automation against your own logged-in Chrome (API decommissioned 2026-06)
5. Substack / LinkedIn      ← copy-paste with attribution
```

The `canonical_url` tells Google which URL is the "original" — cross-posting WITH canonical = safe. Without canonical = splits search ranking signals.

---

## Medium Publishing Rules

**Automated (recommended):** `inkforge publish --slug your-slug --platform medium --canonical-base https://anvilry.vercel.app/notes`
Drives your own logged-in Chrome via `browser-harness` — never touches your password. If you are not logged in to Medium, it stops and tells you to log in yourself. Scripts the import + Publish click; canonical URL/tags in Story Settings still need a manual check (recorded in the tracking note it writes to `content/published/medium/<slug>.md`).

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

**Automated (recommended):** set `HASHNODE_EDITOR_URL` in `.env` to your blog's "Write" screen URL once, then `inkforge publish --slug your-slug --platform hashnode`.
Drives your own logged-in Chrome via `browser-harness` — never touches your password. If you are not logged in to Hashnode, it stops and tells you to log in yourself. Canonical URL in SEO settings still needs a manual check (recorded in the tracking note it writes to `content/published/hashnode/<slug>.md`).

**Manual workflow (until API is restored):**
1. Copy article body from `content/articles/<category>/<slug>.md` (everything below frontmatter)
2. Go to **https://hashnode.com** → your blog → **Write**
3. Paste the article body, set title, tags, and cover image
4. In **SEO settings**: set canonical URL to `INKFORGE_CANONICAL_BASE/<slug>`
5. Publish as draft first, review, then publish live

Keep `HASHNODE_API_KEY` and `HASHNODE_PUBLICATION_ID` in `.env` — they will be used automatically if/when Hashnode restores API access.

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
