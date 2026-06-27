# Tombstone v1 — Cover Image Spec

## Dimensions & Format

- **Canvas:** 1400 × 787px (16:9, Medium/Dev.to/Hashnode standard)
- **Format:** PNG (not SVG — Medium rejects SVG)
- **Thumbnail-safe zone:** Center 920 × 520px — all critical text and visual elements
  must be legible inside this zone (feed thumbnail is ~460 × 300px)

---

## Color Palette

Production/ops tools read as dark and precise. The cover should feel like a terminal
that knows something is wrong — not a startup landing page.

| Role | Color | Hex |
|------|-------|-----|
| Background | Near-black charcoal | `#0d1117` |
| Surface / card | Dark slate | `#161b22` |
| Primary accent | Tombstone red (danger) | `#e53e3e` |
| Secondary accent | Terminal green (healthy) | `#38a169` |
| Text primary | Off-white | `#f0f6fc` |
| Text secondary | Muted gray | `#8b949e` |
| Border / rule | Subtle gray | `#30363d` |

Rationale: matches GitHub dark mode aesthetics — familiar to the developer audience and
reinforces the "production system" feel. Red/green mirrors monitoring dashboards.

---

## Typography

**Title text to render:**
```
Tombstone
```
- Font style: Bold, monospace or semi-serif (Fira Code, JetBrains Mono, or Inter Bold)
- Size: ~96–120px
- Color: `#f0f6fc` (off-white)
- Treatment: optionally add a subtle red underline or glow to "Tombstone"

**Subtitle text to render:**
```
I built this after a 2am on-call incident.
```
- Font style: Regular weight, same family
- Size: ~32–36px
- Color: `#8b949e` (muted gray)

**Tag/badge text (optional, small, bottom-right):**
```
v1.0 · Open Source
```
- Size: ~20px
- Color: `#38a169` (terminal green) with a pill background at `#161b22`

---

## Visual Elements

### Primary visual: tombstone illustration (center-left)
A minimalist flat-design gravestone with:
- Rounded top arch shape
- Engraved text on stone: `FLAG_KEY_ROLLOUT_V2` (in monospace, faded)
- Small RIP marker or crossed-flag icon below the text
- Stone color: `#30363d` with `#8b949e` highlight stroke
- Position: left-center of canvas, vertically centered

### Secondary visual: status dashboard panel (right side)
A simplified dark-mode dashboard card showing:
- A single metric line: `Error Rate ↑ 847%` in red
- A circuit-breaker status badge: `TRIPPED` in amber/orange
- A "What Changed?" correlation entry: `ROLLOUT_V2 enabled 3 min ago` in muted text
- Panel background: `#161b22`, border: `#30363d`, 8px border-radius
- Position: right-center, overlapping slightly with the tombstone for depth

### Background texture (subtle)
- Faint grid pattern or dot matrix at 4% opacity (`#30363d` on `#0d1117`)
- Adds depth without competing with foreground elements

### Accent: red alert pulse (top-right corner, optional)
- A small blinking or static red dot (`#e53e3e`) with a semi-transparent halo
- Labeled in small text: `INCIDENT ACTIVE`
- Reinforces the "something is wrong" narrative before the reader reads a word

---

## Composition Layout

```
┌─────────────────────────────────────────────────────────┐
│  [●] INCIDENT ACTIVE                                    │
│                                                         │
│   ┌──────────┐    ┌────────────────────────────────┐   │
│   │   RIP    │    │  Error Rate ↑ 847%             │   │
│   │  FLAG_   │    │  Circuit Breaker: TRIPPED      │   │
│   │  KEY_    │    │  What Changed?                 │   │
│   │ ROLLOUT  │    │  → ROLLOUT_V2 enabled 3m ago  │   │
│   │   _V2   │    └────────────────────────────────┘   │
│   └──────────┘                                          │
│                                                         │
│   TOMBSTONE                                             │
│   I built this after a 2am on-call incident.           │
│                                        v1.0 · Open Source│
└─────────────────────────────────────────────────────────┘
```

---

## Mood / Tone

- **Mood:** Tense, precise, professional — the quiet competence of a system that handled
  the incident so you didn't have to.
- **NOT:** Scary, chaotic, or cartoonish. This is a tool for engineers who have been
  burned. Respect the problem.
- **Inspiration references:** Datadog incident dashboard, GitHub dark mode, PagerDuty
  alert UI, terminal/CLI aesthetics.
- **One-word brief:** "Controlled."

---

## Rendering Instructions

Use Playwright headless Chromium for HTML → PNG rendering (never macOS qlmanage):

```python
# Playwright render pattern
page = await browser.new_page(viewport={"width": 1400, "height": 787})
await page.set_content(cover_html)
await page.screenshot(path="cover.png", clip={"x": 0, "y": 0, "width": 1400, "height": 787})
```

HTML source: Build as a single self-contained HTML file with inline CSS.
Use system fonts (monospace stack) or embed a base64 font to avoid external deps.

---

## Output File

Save as: `cover.png` in this directory.
Verify thumbnail legibility by viewing at 460×300px (50% scale down) before publishing.
