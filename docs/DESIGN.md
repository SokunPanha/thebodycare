# Design System — The Body Cue

**Direction:** B — *Daylight*
**Domain:** thebodycue.com
**Covers:** none (see §6)
**Locked:** 2026-09-24

The implementation of this file is `src/styles/tokens.css`. Nothing in the codebase hardcodes a
colour, size, or font — rule 6 in `STRUCTURE.md`.

---

## 1. Keeping *Daylight* from looking generic

Worth being straight about, since I flagged it as the risk when you picked it: blue-on-white with
rounded cards is the default look of every health app on the internet. Four decisions below are what
separate this from that default, and they're all load-bearing — if any get dropped during build,
the site drifts back toward the template.

1. **Bricolage Grotesque for display.** A variable grotesque with real character in the `g`, `a` and
   `R`, and an optical-size axis. This is the single biggest differentiator and the reason not to
   fall back to Inter "just for now".
2. **Periwinkle, not corporate blue.** `#4A63D6` sits toward violet. It reads friendly and
   contemporary where `#0066CC` reads insurance company.
3. **Coral is semantic only.** It appears on "when to seek care" and nowhere else. One colour with
   one meaning across 1,275 articles is worth more than a decorative second accent.
4. **Dense index listings, not airy card grids.** Forced by the no-covers decision, and it's the
   right call anyway — see §6.

---

## 2. Colour

Semantic names, never literal ones. `--color-primary`, never `--color-blue`.

### Light (default)

| Token | Hex | Role |
|---|---|---|
| `--ground` | `#FBFBFE` | Page background — cool near-white, not pure |
| `--surface` | `#FFFFFF` | Cards, raised panels |
| `--surface-subtle` | `#F4F5FA` | Wells, table stripes, code |
| `--line` | `#E4E6F0` | Hairlines, card borders |
| `--line-strong` | `#CFD3E4` | Inputs, dividers that must read |
| `--ink` | `#1A2036` | Body and headings |
| `--ink-muted` | `#6E7691` | Deks, metadata, captions |
| `--ink-subtle` | `#939AB0` | Placeholders, disabled |
| `--primary` | `#4A63D6` | Links, category labels, buttons |
| `--primary-hover` | `#3A51BC` | Hover / active |
| `--primary-wash` | `#EEF0FC` | Tinted backgrounds, selected rows |
| `--on-primary` | `#FFFFFF` | Text on primary fills |
| `--accent` | `#E8664A` | **Attention only** — see-care borders, icons |
| `--accent-ink` | `#B0432B` | Accent text (the raw coral fails contrast) |
| `--accent-wash` | `#FDEEEA` | See-care block background |

The neutral is deliberately blue-biased — `#6E7691` rather than a pure grey — so the greys belong to
the same family as the primary instead of sitting next to it.

### Dark

Not an inversion. The ground gains a navy cast, and the primary lightens to `#8E9CF2` because
`#4A63D6` at 5:1 on white drops to unreadable on a dark ground.

| Token | Hex |
|---|---|
| `--ground` | `#101425` |
| `--surface` | `#171C31` |
| `--surface-subtle` | `#1E2440` |
| `--line` | `#2A3150` |
| `--line-strong` | `#3A436B` |
| `--ink` | `#E6E8F2` |
| `--ink-muted` | `#969DBA` |
| `--ink-subtle` | `#6E7694` |
| `--primary` | `#8E9CF2` |
| `--primary-hover` | `#A6B1F6` |
| `--primary-wash` | `#1C2244` |
| `--on-primary` | `#0E1222` |
| `--accent` | `#FF8A6B` |
| `--accent-ink` | `#FF8A6B` |
| `--accent-wash` | `#2A1D1A` |

### Contrast, verified

| Pair | Ratio | |
|---|---|---|
| `ink` on `ground` (light) | 14.8:1 | ✓ AAA |
| `ink-muted` on `surface` (light) | 4.6:1 | ✓ AA |
| `primary` on `surface` (light) | 5.1:1 | ✓ AA |
| `accent-ink` on `accent-wash` | 5.4:1 | ✓ AA |
| `ink` on `ground` (dark) | 14.1:1 | ✓ AAA |
| `primary` on `ground` (dark) | 7.2:1 | ✓ AAA |
| `ink-muted` on `surface` (dark) | 4.9:1 | ✓ AA |

Raw `--accent` is a border and icon colour, never text. `--accent-ink` exists because `#E8664A` on
white is 3.1:1 and fails.

### No category colours — deliberate

Seven categories in seven hues on a blue-and-white site reads as a dashboard, not a publication, and
it would spend the boldness that §1.3 reserves for coral. Categories are identified by their
**uppercase label in `--primary`**, consistently, everywhere. Listings get their scannability from
typography and density instead.

---

## 3. Type

Both self-hosted through `next/font/google`, which downloads at build time — no CDN request, no
layout shift, no CSP problem.

| Role | Face | Usage |
|---|---|---|
| Display | **Bricolage Grotesque** | Headlines, card titles, section heads. Weights 500/600/700 |
| Body & UI | **Public Sans** | Everything else. Weights 400/500/600 |

Two families, no third. Metadata uses Public Sans with `font-variant-numeric: tabular-nums` rather
than pulling in a mono.

### Scale — 1.25 major third, 18px base

| Token | rem | px | Use |
|---|---|---|---|
| `--text-2xs` | 0.72 | 11.5 | Eyebrows, badges |
| `--text-xs` | 0.9 | 14.4 | Metadata, captions |
| `--text-sm` | 1.0 | 16 | Secondary UI |
| `--text-base` | 1.125 | 18 | **Article body** |
| `--text-lg` | 1.406 | 22.5 | Standfirst, H3 |
| `--text-xl` | 1.758 | 28 | H2 |
| `--text-2xl` | 2.197 | 35 | Card titles, H1 small |
| `--text-3xl` | 2.746 | 44 | Article H1 |
| `--text-4xl` | 3.433 | 55 | Home hero |

**18px body, not 16px.** Health readers skew older, and this is a site people read for six minutes
at a time. 16px is a young designer's default.

### Rules

- Line height: `1.7` body · `1.15` display · `1.4` UI
- Measure: `65ch`, hard cap on article body
- Tracking: `-0.025em` on display ≥28px, `0` on body, `+0.14em` on uppercase eyebrows
- `text-wrap: balance` on every heading, `text-wrap: pretty` on deks
- **Headlines capped at 70 characters** in the Gemini response schema, so display type never breaks
  to four lines on mobile

---

## 4. Space, radius, elevation

Space is a 4px scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Nothing off-scale.

Radius is a controlled set of three, not a free choice:

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Chips, badges, inputs |
| `--radius` | 10px | Cards, buttons, blocks |
| `--radius-full` | 999px | Pills, avatars |

Elevation is borders first. Two shadows exist — `--shadow-sm` for hover lift, `--shadow-md` for
overlays — both tinted with the ink hue rather than black, so they don't grey out the page.

---

## 5. Motion

A reading progress bar, 150ms hover transitions on interactive elements, and nothing else. Nothing
animates while someone is reading about their symptoms. All of it inside
`@media (prefers-reduced-motion: no-preference)`.

---

## 6. No cover images — what follows

You chose no covers, and it's the right call at this cadence. Real consequences:

**What it buys you**
- No image sourcing for 1,275 posts a year, no licensing exposure, no Supabase Storage in phase 1
- LCP becomes a text node — Core Web Vitals will be excellent nearly for free
- No generic stock photography, which is the fastest way for a content site to look like a content farm

**What has to compensate**

*Article page* opens on type alone: category eyebrow → headline at `--text-3xl` → standfirst at
`--text-lg` in `--ink-muted` → trust bar → hairline. That sequence has to carry the top of the page,
which is exactly why Bricolage Grotesque is non-negotiable.

*Listings* shift from an airy card grid to a **dense index** — single column, full-width rows,
hairline separators, title + dek + metadata. It scans faster than a grid, fits more per screen, and
looks intentional rather than like a grid with the images missing. This is the layout change §1.4
refers to.

**One exception: OG images.** Social previews still need an image, or links to the site render as a
grey box on Facebook, LinkedIn and X. These are generated per-post at request time by `next/og` —
purely typographic, title on the primary wash. They never appear on the site itself, cost nothing to
produce, and there's no manual work. Different thing from a cover; assuming you want these, they stay.

**Schema effect:** `posts.cover_image_url` is dropped, and Supabase Storage moves out of phase 1.

---

## 7. Component specs

**Post row (listing).** Full width, `--space-24` vertical padding, `--line` bottom border.
Eyebrow in `--primary` · title `--text-lg` display 600 · dek `--text-sm` `--ink-muted`, two lines
clamped · footer row: read time · source count · date, `--text-xs` tabular. Hover tints the row
`--primary-wash`; whole row is one link target.

**Trust bar.** Directly under the standfirst, above the fold. Last reviewed · read time · source
count · "AI-assisted · human-reviewed". `--text-xs`, `--ink-muted`, hairline above and below. Quiet
by design — it needs to be findable, not loud.

**When to seek care.** `--radius` block, `--accent-wash` background, 3px `--accent` left border.
Heading in `--accent-ink` uppercase `--text-2xs`. The only coral on the page. Never contains an ad,
never collapses.

**Key points.** `--surface-subtle` well above the first ad slot, 3–5 items. Most symptom searchers
want the answer, not the essay — this is where they get it.

**Ad slot.** Fixed reserved height so nothing shifts on load, `--ink-subtle` "Advertisement" label
above. Positions: after key points, mid-article, sticky rail. Never above the headline, never inside
the see-care block.

**Buttons.** Primary: `--primary` fill, `--on-primary`, `--radius`, 600. Secondary: `--line-strong`
border, transparent. Focus: 2px `--primary` outline at 2px offset, always visible.

---

## 8. Layout

| Breakpoint | Behaviour |
|---|---|
| `< 768px` | Single column, 16px gutters, inline TOC above body |
| `768–1023px` | Single column, 65ch measure centred, 32px gutters |
| `≥ 1024px` | Article 65ch + 280px sticky rail (TOC, then ad) |
| `≥ 1440px` | Caps at 1200px total; the measure never grows |

The measure is fixed at 65ch at every width. Extra viewport becomes margin, never longer lines.

---

## 9. Accessibility

Every interactive element gets a visible 2px `--primary` focus ring. Colour never carries meaning
alone — the see-care block is identified by its heading, not its coral. Body text is resizable to
200% without horizontal scroll. All of §2's pairs meet WCAG AA, most meet AAA.
