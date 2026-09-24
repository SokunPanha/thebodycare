# Health Blog — Implementation Plan

**Working name:** `health-blog` (rename once the domain is picked)
**Date:** 2026-09-24

---

## 1. Decisions locked in

| Area | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript, Server Components) |
| Styling | Tailwind CSS + shadcn/ui |
| Database / Auth / Storage | Supabase (Postgres + pgvector + Auth + Storage) — *keys coming later* |
| AI | Google Gemini — drafting, outlining, embeddings |
| Content source | AI auto-generation first; human authoring supported from day one |
| Language | English only |
| Hosting | Vercel (Hobby to start) + Vercel Cron |
| **Niche** | **Non-medicine health** — healthy living + symptom literacy. No treatments, no drugs. |
| **Cadence** | **3–4 posts/day** (~105/month, ~1,275/year) |
| **Domain** | **thebodycue.com** — ~$10.44/yr at Cloudflare Registrar (~$0.90/mo) |
| **Brand** | **The Body Cue** |
| **Design** | Direction **B — Daylight**. Periwinkle `#4A63D6` + coral `#E8664A`, Bricolage Grotesque / Public Sans. See `DESIGN.md` |
| **Cover images** | **None.** Text-only listings and article heads; OG images generated typographically. See `DESIGN.md` §6 |

---

## 2. Editorial scope — what this site is and isn't

The niche you described is a genuinely good one, and it's sharper than "health." Writing it down
precisely matters because **this definition becomes the system prompt** that constrains every
generated article.

**In scope**
- How to get and stay healthy: nutrition, movement, sleep, hydration, stress, posture, habits,
  recovery, workplace ergonomics, ageing well
- **Symptom literacy** — what a symptom *is*, what the body is signalling, how common it is, how long
  it typically lasts, what tends to make it better or worse in lifestyle terms
- **"When to see a doctor"** — this is the safe, valuable, high-trust version of symptom content
- Prevention, screening awareness, understanding your own baseline

**Out of scope — hard blocks in the prompt**
- ❌ Any medication, supplement, or dosage recommendation
- ❌ Diagnosis, or language that implies one ("you likely have…")
- ❌ Treatment protocols, home remedies presented as cures
- ❌ "Natural alternatives to [drug]" framing — the most common way health blogs turn harmful
- ❌ Claims of curing, reversing, or healing any condition

**Every symptom article ends the same way:** a "when to seek care" block and a disclaimer that the
piece is educational, not medical advice. This is enforced structurally in the response schema —
the model literally cannot return an article without those fields populated.

---

## 3. Two things to flag before we build

### 3.1 Health is YMYL

Google holds health content to its strictest quality bar, and "scaled content abuse" — mass-published
AI articles with no human oversight — is an explicitly penalisable violation. So the pipeline below
is fully automatic as you asked, but AI output lands in **`in_review`** by default with a one-click
approve screen, carries **cited sources** (Gemini + Google Search grounding), and shows an
**"AI-assisted"** byline. An `AUTO_PUBLISH=true` flag exists if you want it hands-off — just off by
default. Flip it whenever you want; it's your call.

The good news: **your niche choice massively reduces this risk.** Lifestyle and symptom-literacy
content is far less dangerous than treatment content, which is exactly why the scope boundary above
is worth enforcing strictly.

### 3.2 Cadence vs. niche width — a real tension

3–4 posts/day in a *narrow* niche is ~1,275 articles/year on a deliberately limited subject area.
Two consequences:

1. **The dedup gates will start rejecting heavily** — probably from month 3–4. That's the system
   working correctly, but random topic ideation will hit a wall.
2. **Volume itself is a spam signal** when paired with thin content.

The fix is to plan topics **systematically instead of randomly** — see §6. Rather than asking Gemini
"give me 4 health topics," the system walks a structured **topic matrix**:

```
category × subtopic × angle × audience × format
  Sleep  ×  insomnia ×  causes  ×  shift workers  ×  explainer
  Sleep  ×  insomnia ×  habits  ×  new parents    ×  checklist
```

That's a combinatorially large, *auditable* space — you can see coverage and exhaustion on a
dashboard rather than discovering it through rejection rates. I'd also suggest starting at **2/day
for the first month**, watching indexation, then ramping to 4. Starting a brand-new domain at 4
AI posts/day from day one is the single riskiest thing in this plan. Your call — I'll build the rate
as a config value either way.

---

## 4. Domain

Checked live against WHOIS on 2026-09-24. Every clean two-word `.com` in this space is long gone;
these are genuinely available.

### Recommended

| Domain | Why | ~Price/yr |
|---|---|---|
| **thebodycue.com** | ⭐ Top pick. Short, brandable, memorable. "Cue" = the signal your body sends — precisely your symptom-literacy angle — without sounding clinical. Works as a logo and a voice. | ~$10.44 |
| **thebodysignals.com** | Most literal fit for the niche. Slightly longer, very clear. | ~$10.44 |
| **thewellcue.com** | Leans wellness/habits over symptoms. | ~$10.44 |
| **wellawaredaily.com** | "Well aware" is a nice double meaning — wellness + awareness. `daily` suits the cadence. | ~$10.44 |
| **smallhealthhabits.com** | Keyword-rich, self-explanatory, strong for SEO. Less brandable. | ~$10.44 |

### Also available
`thewellsignal.com` · `thevitalcue.com` · `wellcues.com` · `bodysignalsdaily.com` ·
`dailywellcue.com` · `wellawareblog.com` · `wellaware.blog` (~$30/yr)

**Registrar:** [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) at $10.44/yr
sells at cost with no renewal markup and free WHOIS privacy (requires Cloudflare nameservers).
[Porkbun](https://porkbun.com/products/domains) is $11.08/yr with more DNS flexibility. Either is
~**$0.90/month** — about 4% of your stated budget.

**Trademark note:** "Body On Cue Health & Fitness" is a single-location gym in Middlebury, Indiana.
Different name, different business category, no federal mark, local scope — low conflict risk for
`thebodycue.com`, but worth a quick USPTO search before you print anything.

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Vercel Cron  (4× daily)                                │
│      ↓                                                  │
│  /api/cron/generate                                     │
│      1. pull next cell from TOPIC MATRIX                │
│      2. DEDUP GATES  ←──── pgvector similarity search    │
│      3. outline + draft   (Gemini + Search grounding)    │
│      4. SCOPE GUARD  ←──── banned-topic classifier       │
│      5. DEDUP GATE on finished body                      │
│      6. SEO meta + cover image                           │
│      7. INSERT posts (status='in_review')               │
└─────────────────────────────────────────────────────────┘
          ↓                              ↓
┌──────────────────┐          ┌────────────────────────┐
│  Supabase        │          │  /admin                │
│  Postgres        │←────────→│  review · edit · publish│
│  + pgvector      │          │  topic matrix · runs    │
│  + Auth · Storage│          │  comments · subscribers │
└──────────────────┘          └────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│  Public site (ISR / static)                             │
│  /  /posts/[slug]  /category/[slug]  /tag/[slug]        │
│  /search  /about  /medical-disclaimer  /privacy         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Database schema (Supabase)

```sql
-- identity
profiles          id→auth.users, display_name, bio, avatar_url, credentials,
                  role ('admin'|'editor'|'reader')

-- taxonomy
categories        id, slug, name, description, icon, sort_order
tags              id, slug, name
post_tags         post_id, tag_id

-- content
posts             id, slug (unique), title, excerpt, body_md,
                  category_id, author_id, reviewer_id,
                  status ('draft'|'in_review'|'published'|'archived'),
                  source ('human'|'ai'|'ai_reviewed'),
                  seo_title, seo_description,
                  reading_time_min, view_count,
                  when_to_seek_care  text NOT NULL,   -- enforced, see §2
                  next_review_at,                     -- content ageing, OPERATIONS.md §4
                  published_at, created_at, updated_at
post_sources      id, post_id, url, title, publisher   -- citations, for E-E-A-T
post_embeddings   post_id, embedding vector(768), content_hash, model

-- AI pipeline
topic_matrix      id, category_id, subtopic, angle, audience, format,
                  status ('open'|'queued'|'drafted'|'published'|'exhausted'),
                  embedding vector(768), priority, performance_score,
                  UNIQUE(subtopic,angle,audience,format)
                  -- performance_score is derived from post_performance: cells whose
                  -- siblings earn impressions get selected sooner. This is what makes
                  -- the system compound instead of merely accumulate.
topic_queue       id, matrix_id, topic, target_keyword,
                  status ('pending'|'generating'|'drafted'|'rejected'|'published'),
                  embedding vector(768), reject_reason, created_at
generation_runs   id, topic_id, post_id, model, prompt_version,
                  tokens_in, tokens_out, cost_usd, status, error, duration_ms, created_at

-- performance feedback loop  (GROWTH.md §6)
post_performance  post_id, week_of, impressions, clicks, avg_position,
                  source ('gsc'), synced_at, PRIMARY KEY(post_id, week_of)
                  -- weekly pull from the Search Console API. Without this the pipeline
                  -- generates 1,275 articles and learns nothing from any of them.

-- engagement
comments          id, post_id, user_id, parent_id, body,
                  status ('visible'|'pending'|'hidden'), created_at
reactions         post_id, user_id, type ('like'|'bookmark')
subscribers       id, email (unique), status ('pending'|'confirmed'|'unsubscribed'),
                  confirm_token, source, created_at
```

**Indexes:** HNSW on both embedding columns (`vector_cosine_ops`), GIN full-text on
`title || excerpt || body_md`, btree on `posts(status, published_at desc)`.

**RLS:** published posts readable by anon; everything else admin/editor only; comments insertable by
authenticated users and readable when `visible`; subscribers insert-only from the public role.

---

## 7. The dedup system

Four gates. A candidate must clear all four.

**Gate 1 — Exact.** Normalised slug + title match against `posts` and `topic_queue`. Free, instant.

**Gate 2 — Semantic topic.** Embed the candidate (`gemini-embedding-001`), cosine search against
`topic_queue` + `post_embeddings`. Reject above a configurable threshold (start **0.86**). This is
what stops *"10 Benefits of Morning Walks"* and *"Why Walking Each Morning Helps"* from both getting
written.

**Gate 3 — Semantic body.** After drafting, embed the body and re-check against published posts.
Catches the case where two different-sounding topics converge. On failure: one regeneration with the
near-duplicate passed in as explicit "do not overlap with this" context, then reject.

**Gate 4 — Outline overlap.** Compare H2 headings against the nearest 3 neighbours; flag if >60% are
near-identical. Cheap heuristic, catches template-y output.

At 4 posts/day the **matrix in §3.2 is what keeps this from starving** — the planner selects an
`open` cell that is semantically distant from everything published, rather than free-associating.
`/admin/topics` shows coverage per category and an exhaustion warning when open cells run low, so you
get months of notice before it becomes a problem.

---

## 8. Gemini integration

- SDK: `@google/genai`
- **Models** — corrected 2026-09-24 against the working config in `../Youtube Automation/backend`
  and [Google's pricing docs](https://ai.google.dev/gemini-api/docs/pricing). My first draft of this
  plan said "Gemini 2.5 Pro/Flash", which was **two generations stale**:

  | Role | Model | Notes |
  |---|---|---|
  | Draft, topic planning, scope guard | **`gemini-3.7-flash`** | $0.75/$3.75 per 1M in/out (introductory, to 31 Dec 2026; then $1.50/$7.50). 1M context. The YouTube project's default. |
  | Quality escalation, if drafts need it | `gemini-3.1-pro-preview` / `gemini-pro-latest` | Several times the cost — only if Flash output proves too weak |
  | Embeddings | *to confirm at build time* | Not verified yet; do not hardcode from memory |

  `gemini-3.8-flash` also exists now. Staying one release behind on 3.7 is deliberate —
  `*-latest` aliases move under you on release day, which is the wrong property for a cron job.
  All IDs live in `lib/ai/models.ts`; nowhere else.

- **Auth** — AI Studio API key (`GEMINI_API_KEY=AIzaSy…`). The YouTube project also has a working
  Vertex AI path (`GEMINI_AUTH=vertex` + service-account file); we don't want it here — service
  account files on Vercel serverless are a needless hassle for a workload this small.
- **Structured output** (`responseSchema`) on every call — drafts return typed JSON
  (`title`, `excerpt`, `sections[]`, `faq[]`, `sources[]`, `when_to_seek_care`, `seo{}`). The schema
  is how §2's editorial rules get enforced mechanically.
- **Google Search grounding** on drafts so claims carry real citations → `post_sources`.
- **Scope guard:** a cheap Flash classifier runs on every finished draft and rejects anything
  containing medication names, dosages, diagnostic language, or cure claims. Belt-and-braces on top
  of the prompt.
- Prompts versioned in `lib/ai/prompts/`, version stamped on every `generation_runs` row.
- Retry with backoff, per-run token ceiling, daily cost cap.

---

## 9. Public site

- **Home** — lead post, dense index of latest, category strip, newsletter block
- **Post** — typographic head (eyebrow → headline → standfirst), trust bar, progress bar, TOC, key
  points, body, **when-to-seek-care block**, sources, disclaimer, share, reactions, comments,
  related posts (free from the dedup embeddings)
- **Category / Tag** — paginated dense-index listings (no covers — `DESIGN.md` §6)
- **Search** — Postgres full-text, semantic search as a fast follow
- **Static** — About, Contact, Medical Disclaimer, Privacy, Terms

**SEO:** per-page metadata, `sitemap.xml` (index-split — you'll exceed 1,000 URLs fast), `robots.txt`,
RSS, dynamic OG images (`next/og`), JSON-LD (`Article` + `MedicalWebPage` + `FAQPage` +
`BreadcrumbList`), canonicals.

**Monetization:** `<AdSlot>` (header / in-article / sidebar), `<AffiliateLink>` forcing
`rel="sponsored nofollow"` + disclosure, sponsored badge, FTC disclosure page. AdSense needs traffic
before approval, so slots ship as no-ops.

---

## 10. Admin panel (`/admin`, Supabase Auth, admin role)

Dashboard (posts by status, runs, cost, top posts) · Post list + markdown editor with live preview ·
**Review queue** — the main screen: read draft, edit, see dedup score + scope-guard result + sources,
approve → publish · **Topic matrix** with coverage/exhaustion view · Generation runs log with token
cost · Comment moderation · Subscriber list + CSV export.

---

## 11. Build phases

| # | Phase | What lands | Est. |
|---|---|---|---|
| 1 | **Foundation** | Next.js + TS + Tailwind + shadcn, Supabase schema + migrations + RLS, seed categories & topic matrix, auth + admin guard | 1 sess |
| 2 | **Public site** | Layout, home, post page, category/tag, static pages, MDX rendering, responsive + dark mode | 1–2 sess |
| 3 | **AI pipeline** | Gemini client, prompts, embeddings, 4 dedup gates, scope guard, topic planner, cron, run logging | 2 sess |
| 4 | **Admin** | Dashboard, editor, review queue, topic matrix, runs log | 1–2 sess |
| 5 | **SEO** | Metadata, split sitemap, RSS, OG images, JSON-LD, analytics | 1 sess |
| 6 | **Engagement** | Search, comments, reactions, newsletter (Resend, double opt-in) | 1–2 sess |
| 7 | **Monetization + ship** | Ad slots, affiliate components, disclosures, Lighthouse, deploy, cron live | 1 sess |

Phases 1–3 give a working site generating its own non-duplicate, in-scope content.

---

## 12. Costs at 3–4 posts/day

| Item | Monthly |
|---|---|
| Domain (.com at cost) | ~$0.90 |
| Vercel Hobby | $0 |
| Supabase Free (500MB — holds ~1,275 posts easily) | $0 |
| Gemini text — 105 articles/mo on `gemini-3.7-flash` | ~$2 |
| Google Search grounding — ~105 requests/mo | $0–4 · **confirm the current rate and free tier** |
| Resend Free (3k emails) | $0 |
| **Total** | **~$3–7/mo** — comfortably inside your $20 ceiling |

First real cost step-up is Supabase Pro ($25/mo) when storage or bandwidth outgrows free, likely
around year two or on a traffic spike.

---

## 13. What I need from you

| Need | When |
|---|---|
| **Register `thebodycue.com`** | Now — the one thing only you can do |
| `GEMINI_API_KEY` (aistudio.google.com, free tier fine) | Phase 3 |
| Supabase URL + anon key + service role key | Phase 1 — placeholders until then |
| 5–8 starting categories | Phase 1 — suggested: Nutrition, Movement, Sleep, Mental Wellbeing, Symptom Guide, Prevention, Healthy Ageing |
| Resend API key | Phase 6 — can wait |

---

## 14. Open questions

**Resolved 2026-09-24:** domain (`thebodycue.com`) · design direction (B — Daylight) · no cover images.

Still open:

1. **Ramp the cadence?** Start 2/day for month one, then 4? (See §3.2.)
2. **Auto-publish from day one, or review queue?** Plan defaults to review queue.
3. **Comment identity** — Supabase Auth (email/Google) vs Giscus (GitHub) vs anonymous + moderated.
4. **Categories** — confirm the starting set (§13).

None of these block phase 1. All four are config values or phase-6 decisions.
