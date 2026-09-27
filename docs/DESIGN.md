# Design System — The Body Cue

**Direction:** Soft wellness — chosen 2026-09-26, replacing "Daylight" (periwinkle, dense text index,
no covers). Reference points: Calm, Headspace, Oura's journal.
**Covers:** real photos — AI-generated (MiniMax) or uploaded; a plain tinted placeholder until then.
**Implementation:** `src/styles/tokens.css`. Nothing in the codebase hardcodes a colour, size, or
font — rule 6 in `STRUCTURE.md`, enforced by lint.

---

## 1. The idea

A calm, premium wellness magazine. Warm cream instead of clinical white, photographs instead of
diagrams, soft rounded cards that lift on hover, and a search box you can't miss. The reader may be
anxious and looking something up at midnight — everything should lower the temperature.

Four decisions carry the look; drop one and it drifts back to a generic blog:

1. **Warm cream ground** (`--ground`), never pure white. Cards are white on cream.
2. **Real photos, big and rounded** — the hero, the bento feature, the article cover.
3. **Soft tints per topic** (sage, peach, sky, lilac, butter) on topic tiles, pills and headers.
4. **Generous radius** (16–32px) and warm, diffuse shadows.

---

## 2. Colour

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ground` | `#FAF6F0` | `#171614` | Page background — warm cream |
| `--surface` | `#FFFFFF` | `#211F1C` | Cards, search box, raised panels |
| `--surface-subtle` | `#F3EDE4` | `#2A2824` | Footer, wells, placeholders |
| `--line` / `--line-strong` | `#EBE3D8` / `#D9CEBF` | `#34312C` / `#46423B` | Hairlines, inputs |
| `--ink` | `#2A2925` | `#F3EFE8` | Text — warm charcoal |
| `--ink-muted` | `#66615A` | `#B8B1A6` | Standfirsts, metadata |
| `--primary` | `#3D6B55` | `#93C2A8` | Sage — links, buttons, active states |
| `--primary-wash` | `#E4EEE7` | `#22302A` | "How we write" panel, soft highlights |
| `--accent` / `--accent-ink` / `--accent-wash` | terracotta | lightened | **"When to seek care" only** |
| `--tint-{sage,peach,sky,lilac,butter}` | pastel | deep muted | Topic tiles, pills, placeholders |
| `--on-photo`, `--scrim` | white, dark gradient | same | Headlines laid over photos |

Topic → tint lives in `src/config/categories.ts`. Tints are decoration: a topic is always named in
text too.

**Contrast, computed (not eyeballed) — every text pair passes WCAG AA in both themes.** Lowest
light-mode pairs: `ink-muted` on the tints ≈ 5.0:1, `accent-ink` on `accent-wash` 5.1:1,
`primary` on `primary-wash` 5.2:1. Buttons: white on sage 6.1:1. Re-run the check when changing a
colour (the script is in the 2026-09-26 session; any WCAG calculator works).

**Terracotta stays reserved.** Peach is a *tint*; terracotta is *attention*. The "when to seek care"
block is the only terracotta on a page, with a 2px border, an icon and its heading — never colour alone.

---

## 3. Type

| Role | Face | Use |
|---|---|---|
| Display | **Outfit** (600) | Headlines, card titles, section heads |
| Body & UI | **Figtree** (400–600) | Everything else |

Self-hosted by `next/font/google`. The social-image renderer reads the same faces from
`assets/fonts/` (see its README).

Scale (rem → px): 0.75 → 12 · 0.875 → 14 · 1 → 16 · **1.125 → 18 body** · 1.375 → 22 · 1.75 → 28 ·
2.25 → 36 · 3 → 48 (article h1) · 4 → 64 (home hero).

Line height 1.75 body · 1.1 display · 1.45 UI. Tracking −0.03em on display. Measure 68ch.
Headlines capped at 70 characters (schema and DB).

---

## 4. Shape and depth

Radius: `sm` 10 · default 16 · `lg` 24 (cards, tiles) · `xl` 32 (hero cards, big panels) · full (pills).
Shadows are warm (brown-tinted), three steps: `sm` resting cards, `md` hover and feature cards, `lg` rare.
Cards lift 2px on hover. Motion is limited to hover transitions and the reading progress bar, all
inside `prefers-reduced-motion: no-preference`.

---

## 5. Covers

- Every post gets a real photo: AI-generated with MiniMax `image-01` from its title and standfirst
  (`features/generation/prompts/v1/cover-image.ts`), or uploaded in the editor. "Generate missing
  covers" on `/admin/posts` fills them in, five per click.
- The image prompt carries `EDITORIAL.md`: no pills, supplements, clinical settings, medical
  equipment, injury or distress, no text.
- **Until a post has a photo**, cards show a plain two-tint gradient in its topic's colours —
  deliberately not an illustration. The article page shows no cover at all until there's a photo.
- AI images carry no caption on the article (removed 2026-09-27); the admin cover editor still shows the source.
- Photos render through `next/image` in a fixed aspect-ratio box, so they never shift layout.

---

## 6. Components

**Header.** Cream, blurred, logo mark + wordmark, topic pills (active pill is white with a shadow),
search pill, About. One row pinned from 1280px; below that, a search icon and topics on their own
scrolling row (widths measured, not guessed).

**Home.** Hero with soft blurred tint blobs: headline, standfirst, large search pill, topic chips —
and the newest article as a big photo feature card. Then "Latest reads" as a bento grid (one 2×2
feature card + four photo cards), "Explore by topic" tint tiles, "More to read" list, and the
"How we write" panel.

**Feature card.** Photo fills the card; headline, pill and excerpt sit on a dark scrim in white. On a
placeholder the text stays ink.

**Post card.** Photo on top (16:10), topic pill, title, two-line excerpt, meta. Rounded 24px.

**Article.** Centred header (pill, headline, standfirst) → big rounded cover (only if a photo exists)
→ trust bar card → key points on sage → body → FAQ → when to seek care (terracotta) → sources card →
disclaimer → related as photo cards. TOC in a sticky rail card from 1024px.

**Trust bar.** Last reviewed · read time · sources · attribution. It must never imply a review that
didn't happen (`EDITORIAL.md` §7).

---

## 7. Accessibility

Visible 2px sage focus ring on everything. Colour never carries meaning alone. Body text resizes to
200% without horizontal scroll; no page scrolls sideways at any width (checked 390–1920px). Photos
in cards are decorative (`alt=""`) because the title beside them names the link; the article cover
carries real alt text.
