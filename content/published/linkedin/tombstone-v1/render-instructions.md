# Tombstone v1.0 Carousel — Render Instructions

## Canvas

- 13 slides
- 1080×1080px each
- `deviceScaleFactor: 2` (outputs 2160×2160px source PNGs — downsampled to 1080 for PDF)
- Format: PNG → assembled into PDF via `img2pdf` or similar

---

## Typography

- **Headings / UI:** Inter (same as feature-flags carousel)
- **Code blocks / badges / terminal output:** JetBrains Mono
- **Body text:** Inter, 400 weight, 18–20px, generous leading (1.5–1.6)
- **Slide headlines:** Inter, 700 weight, 36–48px depending on length
- **Hero stats (Slides 04, 07, 09):** Inter, 700–900 weight, 60–72px

---

## Color Palette

Tombstone is a production/ops tool. Dark-on-dark, accent-driven. NOT startup-playful.

| Token | Hex | Use |
|-------|-----|-----|
| Background (primary) | `#0f1117` | All slide backgrounds |
| Background (card/panel) | `#1a1f2e` | Code blocks, badge panels, stat boxes |
| Foreground (body text) | `#e2e8f0` | Body copy |
| Foreground (subdued) | `#94a3b8` | Captions, labels, secondary text |
| Teal (primary accent) | `#00d4aa` | Brand color, cover, CTA, tombstoned badge, SDK icons |
| Red (danger/alert) | `#ef4444` | Stat slides (Knight Capital $), circuit breaker, BLOCKED badge |
| Amber (warning/attention) | `#f59e0b` | "What Changed?", HIGH badge, ML ensemble |
| Yellow (info) | `#eab308` | MEDIUM badge |
| Green (safe) | `#22c55e` | LOW badge, auto-approved |
| White (highlight) | `#ffffff` | Hero numbers, key emphasis |

---

## Slide-by-Slide Render Notes

### Slide 01 — Cover
- Background: `#0f1117`
- "Tombstone" in Inter 900 weight, 60px, color `#00d4aa`
- "v1.0" in Inter 400, 28px, `#94a3b8`
- Tagline in Inter 400, 20px, `#e2e8f0`
- Byline in Inter 400, 16px, `#94a3b8`
- Bottom-left: a subtle geometric tombstone icon (rectangle + arch top, stroke only, `#00d4aa`, ~80px tall)
- Bottom-right corner: `@sairam.dev` in Inter 400, 13px, `#94a3b8`

### Slide 02 — Hook (2am story)
- Background: `#0f1117`
- Headline in Inter 700, 40px, `#ffffff`
- Quote block: left border `4px solid #ef4444`, padded, quote text in italic Inter 400, 22px
- "That silence was the real incident." — Inter 700, 18px, `#ef4444`
- No decorative elements — the emptiness is intentional

### Slide 03 — Problem
- Background: `#0f1117`
- Headline in Inter 700, 38px, `#f59e0b`
- Body: Inter 400, 18px, `#e2e8f0`
- Optional: two-column layout with "You think" / "Reality" in subdued cards (`#1a1f2e`), 14px Inter 400

### Slide 04 — Knight Capital Stat (BIG NUMBER SLIDE)
- Background: `#0f1117`
- "$440,000,000" in Inter 900, 68px, `#ef4444`
- "in 45 minutes." in Inter 700, 36px, `#f59e0b`
- "Knight Capital, 2012." in Inter 400, 18px, `#94a3b8`
- Body text in Inter 400, 16px, `#e2e8f0`
- Minimal. The numbers carry this slide.

### Slide 05 — Tombstoning
- Background: `#0f1117`
- Headline in Inter 700, 36px, `#00d4aa`
- Body in Inter 400, 18px, `#e2e8f0`
- Mock status badge block (card, `#1a1f2e`, `border: 1px solid #00d4aa`):
  ```
  TOMBSTONED
  key: dark_launch_v2
  retired: 2026-03-14
  status: LOCKED — key cannot be reused
  ```
  JetBrains Mono, 14px, `#00d4aa` for TOMBSTONED/LOCKED, `#94a3b8` for labels

### Slide 06 — What Changed? (Incident Correlation)
- Background: `#0f1117`
- Headline in Inter 700, 36px, `#f59e0b`
- Body in Inter 400, 18px, `#e2e8f0`
- Mock correlation output card (`#1a1f2e`, border `#f59e0b`):
  ```
  Incident: production-error-spike-2026-06-27T03:14Z
  ─────────────────────────────────────────────────
  #1  dark_mode_v3          score: 0.94   [ROLLBACK]
  #2  checkout_redesign_b   score: 0.71   [ROLLBACK]
  #3  image_lazy_load_exp   score: 0.38   [ROLLBACK]
  ```
  JetBrains Mono, 13px. Score numbers in amber. [ROLLBACK] in teal.

### Slide 07 — Circuit Breaker Auto-Rollback (BIG NUMBER SLIDE)
- Background: `#0f1117`
- "5%" in Inter 900, 72px, `#ef4444`
- "errors over 100 requests." in Inter 700, 30px, `#ffffff`
- "Rollback. Automatic." in Inter 700, 30px, `#00d4aa`
- Body text in Inter 400, 16px, `#e2e8f0`
- Small state machine diagram below text: three pill badges → CLOSED (`#22c55e`) → OPEN (`#ef4444`) → HALF_OPEN (`#f59e0b`) with arrow connectors in `#94a3b8`

### Slide 08 — Blast Radius Gate
- Background: `#0f1117`
- Headline in Inter 700, 36px, `#ffffff`
- Four stacked badge rows, full-width cards (`#1a1f2e`):
  - `BLOCKED` — `#ef4444` fill, white text, Inter 700 — "Cannot proceed. Safety violation."
  - `HIGH` — `#f59e0b` fill, dark text, Inter 700 — "Four-eyes approval required."
  - `MEDIUM` — `#eab308` fill, dark text, Inter 700 — "Logged. Monitoring active."
  - `LOW` — `#22c55e` fill, dark text, Inter 700 — "Auto-approved."
- Body text below in Inter 400, 16px, `#94a3b8`

### Slide 09 — Architecture Stat (BIG NUMBER SLIDE)
- Background: `#0f1117`
- "8 services." in Inter 900, 56px, `#ffffff`
- "5,000+ flags." in Inter 700, 44px, `#00d4aa`
- Service list in JetBrains Mono card (`#1a1f2e`), 13px, two-column if needed
- `make dev` in a mock terminal block: dark panel, teal cursor/prompt, white command text
- JetBrains Mono throughout the code sections

### Slide 10 — ML Layer
- Background: `#0f1117`
- Headline in Inter 700, 36px, `#f59e0b`
- Three model names in JetBrains Mono pills: Z-score (`#f59e0b`), Isolation Forest (`#f59e0b`), EWMA (`#f59e0b`)
- Arrow → `[2/3 VOTE]` in white → `VERDICT` in teal
- LinUCB description in Inter 400, 16px, `#e2e8f0`
- Keep diagram compact (top half), text below

### Slide 11 — SDK Ecosystem
- Background: `#0f1117`
- Headline in Inter 700, 36px, `#00d4aa`
- Icon grid (2×4), each cell: icon placeholder + label
  - TypeScript (blue), Python (yellow), React (teal), Edge (purple), WASM (orange), MCP (teal), VS Code (blue), CLI (white)
  - Labels in Inter 400, 14px, `#e2e8f0`
- Keep icons geometric/simple — not brand logos (avoid copyright complications)

### Slide 12 — Name Origin
- Background: `#0f1117`
- Headline "Why 'Tombstone'?" in Inter 700, 44px, `#00d4aa`
- Body in Inter 400, 20px, `#e2e8f0`, generous leading (1.7)
- Small geometric tombstone icon (rectangle + rounded arch top, stroke only `#00d4aa`, ~60px) centered above headline
- More poetic typesetting — give it breathing room. This is the emotional beat.

### Slide 13 — CTA
- Background: `#0f1117`
- "v1.0.0." in Inter 700, 48px, `#ffffff`
- "Self-hosted. Open source." in Inter 400, 24px, `#00d4aa`
- "Everything runs locally." in Inter 400, 20px, `#94a3b8`
- Terminal block (full-width, `#1a1f2e`, border `#00d4aa`):
  ```
  $ git clone https://github.com/sairam/tombstone
  $ make dev

  ✓ flag-api        :8081
  ✓ gateway         :8080
  ✓ dashboard       :3000
  ✓ intelligence    :8082
  ```
  JetBrains Mono, 14px. `$` in amber, commands in white, output in teal.
- Article link below in Inter 400, 14px, `#94a3b8`

---

## PDF Assembly

After generating 13 PNGs at 2160×2160px:

```bash
# Downscale and assemble
for i in $(seq -w 1 13); do
  sips -Z 1080 slide-${i}.png --out slide-${i}-1080.png
done
img2pdf slide-{01..13}-1080.png -o tombstone-v1-carousel.pdf
```

Or use Python `img2pdf`:
```python
import img2pdf, glob, pathlib
slides = sorted(glob.glob("slides/slide-*-1080.png"))
with open("tombstone-v1-carousel.pdf", "wb") as f:
    f.write(img2pdf.convert(slides))
```

Target file size: < 5MB (LinkedIn PDF limit is 100MB, but < 5MB loads fast).

---

## Consistency Checks Before Export

- [ ] All 13 slides use background `#0f1117`
- [ ] Teal `#00d4aa` appears on slides 01, 05, 07 (rollback), 09, 11, 12, 13
- [ ] Red `#ef4444` appears on slides 02, 04, 07, 08 (BLOCKED)
- [ ] Amber `#f59e0b` appears on slides 03, 06, 08 (HIGH), 10
- [ ] JetBrains Mono used on all code/badge/terminal elements
- [ ] Inter used for all body and heading text
- [ ] Bottom-right `@sairam.dev` watermark on all slides (Inter 400, 13px, `#94a3b8`)
- [ ] Slide numbers bottom-left (optional: `01 / 13` style, same subdued color)
- [ ] No emoji or → arrow glyphs in text (Excalidraw rendering rule — apply here for font consistency)
- [ ] Hero number slides (04, 07, 09) have the large number as the first visual element
