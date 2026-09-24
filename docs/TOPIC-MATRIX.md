# Topic Matrix

**File:** `supabase/seed/topic-matrix.csv` — 203 cells, 29 per category. Edit it in a spreadsheet;
it converts to `seed.sql` at task M2.6.

This is the fuel for the generation pipeline and the thing that decides whether the site ranks.
Every cell was selected against the long-tail rule in `GROWTH.md` §2–3, not to cover the subject
evenly.

---

## 1. The categories

| Category | Slug | What it covers |
|---|---|---|
| Sleep | `/category/sleep` | Sleep quality, timing, night waking, shift work |
| Digestion | `/category/digestion` | Gut, bloating, appetite, food reactions |
| Movement | `/category/movement` | Exercise, joints, posture, desk-body problems |
| Food | `/category/food` | Nutrition, hydration, energy |
| Mind | `/category/mind` | Stress, focus, mood, burnout — non-clinical |
| Everyday Body | `/category/everyday-body` | Skin, hair, nails, teeth, eyes, ears |
| Prevention | `/category/prevention` | Screening awareness, ageing, health numbers |

**Note what isn't here: a "Symptoms" category.** It would become a dumping ground and it would
compete with its own siblings. Instead, symptom content lives in the category it belongs to, and
`/symptoms` is a **cross-cutting index page** filtering every `is-this-normal` piece across all
seven. Same content, better architecture, no orphan category.

**Everyday Body is the sleeper.** Skin, nails, ears and teeth are unglamorous, extremely
high-volume, and the big health sites cover them thinly because they're low-value per visit. It's
probably the easiest category here to rank in.

---

## 2. The axes

**`angle`** — what the piece does:

| Angle | Purpose |
|---|---|
| `is-this-normal` ⭐ | Reassurance plus a threshold. **The differentiator** — see `GROWTH.md` §2 |
| `what-is-happening` | Mechanism explainer |
| `what-helps` | Lifestyle levers |
| `why-it-happens-to-you` | A specific cause for a specific group |
| `how-to-tell-the-difference` | Distinguishing two things people confuse |
| `what-the-evidence-says` | Myth-check or evidence review |
| `building-the-habit` | Behaviour change |

**`audience`** — 30+ values, from `desk workers` and `shift workers` to `over-70s`, `new parents`,
`menopausal women`, `on-feet workers`. Specificity is the point: "sleep problems for night-shift
workers" is winnable; "sleep problems" is not.

**`format`** — `explainer` · `is-it-normal` · `checklist` · `comparison` · `myth-check` · `timeline`

**`target_query`** — the actual search phrase, in the words a person would type. This is what makes
the matrix useful rather than a list of subjects. Most are 5–9 words, question-shaped.

---

## 3. Known problem: format is skewed

| Format | Count | |
|---|---|---|
| explainer | 109 | **54% — too high** |
| is-it-normal | 30 | |
| checklist | 25 | |
| comparison | 18 | |
| myth-check | 17 | |
| timeline | 4 | |

The `format` axis exists to stop 1,275 articles sharing one skeleton, and more than half the seed
currently points at the same format. Two fixes, and you want both:

1. **Rebalance as you extend** — push new cells toward `comparison`, `timeline`, `checklist` and
   `myth-check`. Target under 40% explainer.
2. **Make `explainer` itself vary.** The drafting prompt must not produce a fixed section skeleton —
   this is exactly what spike prompt A4 tests. If A4 comes back with identical structure, this is
   the lever to pull.

Flagging it rather than hiding it: it's the most likely way this seed set disappoints at volume.

---

## 4. Runway — this is ~7 weeks, not a year

203 cells ÷ 3.5 posts/day ≈ **58 days.**

The matrix is a starting seed, not a supply. You need roughly **100 new cells a month** to sustain
the cadence, and `topic_matrix.status = 'open'` running low is the signal — surfaced on
`/admin/topics` with an exhaustion warning (`PLAN.md` §7).

Where the next cells come from, in order of value:

1. **Search Console** once live — queries showing impressions at position 11–30 are proven demand
   you're already nearly ranking for. This is by far the best source and costs nothing.
2. **"People also ask" and autocomplete** on existing titles — nests several levels deep.
3. **Reddit** — `site:reddit.com <topic>` for how people actually phrase things.
4. **New audience × existing subtopic** — the cheapest expansion. "Waking at 3am" already exists for
   adults; it's a different article for new parents, shift workers, and over-60s.
5. **Gemini**, last — it produces plausible topics, not *demanded* ones. Always pass the existing
   title list and filter output through step 1's evidence.

---

## 5. Selection rules for new cells

Before anything enters the matrix:

- [ ] **Google it incognito.** All of page one Healthline/WebMD/Mayo/Cleveland Clinic → **reject.**
      One or two independent sites ranking → accept.
- [ ] 4+ words, question-shaped, informational intent
- [ ] Answerable **without** naming a medication, dose, or treatment (`EDITORIAL.md` §3)
- [ ] A real `when_to_seek_care` threshold exists — if there's no honest answer to "when should I
      worry about this", it's the wrong topic for this site
- [ ] Not semantically within 0.86 of an existing cell (the pipeline checks this, but checking by
      eye saves a wasted generation)

---

## 6. Watch-list: cells near the editorial boundary

These are legitimate and in scope, but they're where the model is most likely to drift into
treatment. **Review these outputs personally** rather than approving quickly, and any leak becomes a
fixture in `tests/fixtures/scope/violations/`:

| Cell | The risk |
|---|---|
| `what cholesterol numbers mean in plain english` | Explaining a number is fine; the model may drift to lowering it with drugs |
| `what is insulin resistance in simple terms` | Same shape |
| `which vaccinations are offered as you get older` | Informational only — must not recommend |
| `questions to ask at a health review` | Must stay procedural, never "ask about drug X" |
| `when is being tired all the time worth checking` | Fatigue has serious causes; threshold must be strong without alarming |
| `physical symptoms of anxiety and when to check` | Overlaps with cardiac symptoms — the escalation advice has to be right |
| `how to protect bone health through diet and movement` | Phrased deliberately to exclude supplements. Watch for calcium/vitamin D dosing. |

The last row shows the pattern: **where a topic invites a supplement answer, write the exclusion
into the subtopic itself.** Cheaper than catching it downstream.

---

## 7. Pillar structure

`GROWTH.md` §4 wants one pillar per category with 15–25 clusters beneath. The matrix is the cluster
layer — the **7 pillars don't exist yet** and shouldn't be generated:

> Understanding your sleep · Understanding your gut · Moving well at any age · Eating for energy ·
> Looking after your mind · Your body's everyday signals · Staying well as you age

These are the pages that earn backlinks and carry authority down to the clusters. If the spike comes
back amber or red, **these seven are exactly what you write by hand** — 30 articles of human work
that makes the other 1,200 credible.
