# Tombstone v1 — Visual Asset Tracker

Article: "I Built Tombstone After a 2am On-Call Incident Involving Feature Flags"
Topic: Self-hosted production intelligence platform for feature flags — circuit breaker
auto-rollback, blast radius scoring, causal incident correlation ("What Changed?"),
tombstoning (permanent flag key archival).

---

## Asset Status

| Asset | File | Status | Notes |
|-------|------|--------|-------|
| Cover image (1400×787 PNG) | `cover.png` | PENDING | Spec in `cover-spec.md` |
| GIF 1 — 2am alert hero | *(Giphy embed)* | PENDING | Keywords in `gifs-plan.md` |
| GIF 2 — Tombstoning concept | *(Giphy embed)* | PENDING | Keywords in `gifs-plan.md` |
| GIF 3 — Circuit breaker rollback | *(Giphy embed)* | PENDING | Keywords in `gifs-plan.md` |
| GIF 4 — Blast radius scoring | *(Giphy embed)* | PENDING | Keywords in `gifs-plan.md` |
| GIF 5 — Incident correlation | *(Giphy embed)* | PENDING | Keywords in `gifs-plan.md` |
| Architecture diagram | *(Excalidraw)* | PENDING | 8 services, data flow |
| Dashboard screenshot | `dashboard-screenshot.png` | PENDING | "What Changed?" UI |

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `README.md` | This tracker |
| `gifs-plan.md` | Giphy search keywords + placement + captions for all 5 GIFs |
| `cover-spec.md` | Detailed spec for cover image (palette, typography, layout, render instructions) |
| `cover.png` | Final cover image — **TO BE GENERATED** |

---

## GIF workflow

GIFs are sourced from Giphy, not stored locally.

1. Search Giphy using the keywords in `gifs-plan.md`
2. Copy the Giphy page URL (`https://giphy.com/gifs/...`)
3. For **Medium**: paste the URL on its own line in the editor — auto-embeds
4. For **Dev.to**: use `![caption](https://media.giphy.com/media/[ID]/giphy.gif)`
5. For **Hashnode**: use the built-in media embed dialog
6. For **Substack**: paste Giphy embed URL directly

Record chosen Giphy URLs in the table below once selected.

### Chosen Giphy URLs (fill in during article publishing)

| GIF | Giphy URL | Confirmed |
|-----|-----------|-----------|
| GIF 1 — 2am alert | | |
| GIF 2 — Tombstoning | | |
| GIF 3 — Circuit breaker | | |
| GIF 4 — Blast radius | | |
| GIF 5 — Correlation | | |

---

## Cover image workflow

1. Read `cover-spec.md` for full spec
2. Build a self-contained HTML file (inline CSS, system monospace fonts)
3. Render with Playwright at 1400×787 (see render instructions in spec)
4. Save as `cover.png` in this directory
5. Verify legibility at 50% scale (460×300 thumbnail)
6. Upload to each platform's cover image slot before publishing

---

## Platform publishing checklist (assets)

- [ ] Cover image uploaded (Medium story settings, Dev.to cover, Hashnode OG image)
- [ ] All 5 GIF URLs confirmed and embedded in article draft
- [ ] Architecture diagram embedded (Excalidraw export as PNG if needed)
- [ ] Dashboard screenshot captured from local Tombstone instance
- [ ] All images alt-text filled in (accessibility)
