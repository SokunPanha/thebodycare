# Growth, Metrics & Kill Criteria

The rest of the docs answer *how to build it*. This one answers **whether anyone will find it**,
which is the actual constraint.

---

## 1. The honest starting position

A brand-new domain, publishing AI-assisted content, in the single most competitive category on the
internet, against sites with twenty-year-old backlink profiles and staff physicians.

Two things follow.

**Volume is not the strategy.** Google's position on scaled AI content means 1,275 generic articles
is closer to a liability than an asset. The cadence only pays off if each article is *more specific*
and *more useful* than what already ranks. That's a topic-selection problem, not a pipeline problem —
which is why §3 matters more than anything in `MVP.md`.

**You cannot win the head. Don't try.** "Sleep hygiene tips" is owned by Healthline and always will
be. The opportunity is the long tail, and the plan should be built around that from day one.

---

## 2. Where this site can actually win

Healthline tells you what a symptom *is*. Mayo tells you what a condition *is*. Almost nobody
answers the question people actually type at midnight:

> **"Is this normal, and should I be worried?"**

That's the gap, and it's exactly what `EDITORIAL.md` already commits to — the "when to seek care"
block isn't just a safety feature, it's **the product differentiator**. The plan built the right
thing for the wrong stated reason.

Three angles the big sites structurally can't serve well:

| Angle | Why they can't | Example |
|---|---|---|
| **Reassurance with a threshold** | Liability makes them hedge everything into uselessness | "Why do I wake at 3am every night" |
| **Specific populations** | Too niche for their traffic model | "Sleep problems for night-shift nurses" |
| **Everyday, unglamorous questions** | Too low-volume individually | "Why does my knee click when I squat" |

**This should reshape the topic matrix.** Prioritise 4+ word, question-shaped, low-competition
queries. Reject any cell whose head term is owned by a top-10 health site.

---

## 3. Keyword method (free tools only)

Per topic, before it enters the matrix:

1. **Google the query in an incognito window.** If page one is all Healthline / WebMD / Mayo /
   Cleveland Clinic with no independent site, **skip it.** Seeing one or two small sites ranking is
   the signal you want.
2. **Mine "People also ask" and autocomplete** — these are literal user questions and they nest
   several levels deep.
3. **Mine Reddit.** `site:reddit.com <symptom>` surfaces how people actually phrase things. Their
   wording is your title; Healthline's wording is not.
4. **Check intent is informational**, not transactional. You cannot compete for anything commercial.
5. Once live, **Search Console is the best tool you have** — the "impressions but position 15–30"
   queries are your highest-leverage rewrite targets.

---

## 4. Structure: pillars and clusters

Related posts via embeddings gives you *relevance*; it doesn't give you *architecture*. Deliberate
internal linking is how content sites rank.

```
PILLAR: "Understanding your sleep"          ← broad, updated, links to all children
  ├── cluster: waking at 3am
  ├── cluster: sleep and shift work
  ├── cluster: screens before bed
  └── …15–25 children, each linking back up
```

One pillar per category, 15–25 clusters beneath it. Every cluster links up to its pillar; the pillar
links down to all. This concentrates authority instead of spreading it across 1,275 orphans.

**Add to the generation step:** every draft must include 2–3 internal links to existing posts, chosen
from the nearest embedding neighbours. Free to implement, and it's the difference between a site and
a pile of pages.

---

## 5. Distribution — don't bet only on Google

Ranked by fit for this project.

| Channel | Effort | Payback | Notes |
|---|---|---|---|
| **Google organic** | Built-in | 6–18 mo | The long game. Necessary, slow, not sufficient. |
| **Pinterest** | Low | 1–3 mo | Genuinely large for health/wellness, pins rank for *years*, and text-based pins work fine — which suits a site with no cover images. The highest-ROI channel here. |
| **YouTube** ⭐ | Medium | 3–6 mo | **You already own `Youtube Automation`.** Articles → short explainers is the same content, a second audience, and a second revenue stream. No other project has this advantage. |
| **Email list** | Low | Compounding | The only audience you own. Google can delist you; your list can't be taken. |
| **Reddit / forums** | Medium | Immediate | Answer questions genuinely, link rarely. Self-promotion gets banned — treat it as research first, traffic second. |
| **Quora** | Low | Slow | Old answers keep earning. Low ceiling. |

**Start Pinterest at launch, not later.** It's the only channel with meaningful payback inside the
first quarter, and it buys patience for the organic bet.

---

## 6. Metrics

**Leading** (weekly — these move first):
pages indexed · total impressions · queries in positions 11–30 · average position · new referring domains

**Lagging** (monthly):
organic clicks · pageviews · email subscribers · returning visitors

**Health of the machine** (weekly):
posts published · dedup rejection rate · scope-guard rejection rate · cost per published post · **review time per post**

Watch the **dedup rejection rate** especially. Climbing past ~40% means the matrix is exhausting and
needs new cells — see `PLAN.md` §3.2. That's a months-of-warning signal if you're looking at it.

---

## 7. Decision gates

Set now, while you're unattached to the outcome. Otherwise you'll publish into a void for a year
because stopping feels like quitting.

| Gate | Pass | If it fails |
|---|---|---|
| **Month 1** | 50+ pages indexed | Technical SEO or quality problem. Stop publishing, diagnose. Do not add volume to an unindexed site. |
| **Month 3** | 100+ indexed · 500+ impressions/mo · 3+ queries in top 50 | Wrong keywords. Re-run §3 on the whole matrix; cut anything head-term. |
| **Month 6** | 5,000+ impressions/mo · 100+ clicks/mo | The organic bet is underperforming. Shift effort to Pinterest + YouTube; reduce cadence to 1/day and raise quality. |
| **Month 12** | 10,000+ pageviews/mo | Organic has failed. Either commit fully to a different channel or wind it down. Running costs stay under $10/mo, so "park it and keep the domain" is a legitimate third option. |

**Failing month 1 is the most important one to catch.** Publishing 350 more articles onto a site
Google won't index is the single most expensive mistake available here.

---

## 8. Revenue, honestly

Health AdSense RPM runs roughly **$5–20**. At $10:

| Pageviews/mo | Ads/mo |
|---|---|
| 5,000 | ~$50 |
| 20,000 | ~$200 |
| 50,000 | ~$500 |
| 100,000 | ~$1,000 |

Realistic year one, *if* the organic bet works: somewhere between near-zero and 30k pageviews/month —
so **$0–300/month**. Against ~$5/month of running costs, that's fine. Against the hours, it's a
long-term play, not an income.

Three implications worth internalising:

1. **AdSense won't approve you at launch.** It wants real traffic and real content first. Build the
   slots, leave them empty, apply around month 3–6.
2. **The email list may be worth more than the ads.** 5,000 engaged health subscribers is a far more
   valuable asset than 20,000 monthly pageviews, and it isn't subject to an algorithm update.
3. **Affiliate beats display at low traffic.** At 5,000 pageviews, ads make $50; a handful of
   relevant, genuinely-recommended products can beat that — provided it never compromises
   `EDITORIAL.md`. If a recommendation wouldn't survive the scope rules, it doesn't go in.
