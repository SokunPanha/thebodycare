# MVP Scope & Action Plan

**Goal of the MVP:** thebodycue.com is live, Google can index it, and a cron job produces
non-duplicate, in-scope draft articles that you approve from an admin screen.

That is the whole bet. Everything else — search, comments, newsletter, ads — is amplification of a
loop that either works or doesn't, and none of it is worth building before the loop is proven.

**Target:** 6 milestones, ~10–12 working sessions.

---

## 1. In / out

### In the MVP

| Area | Scope |
|---|---|
| Public | Home (dense index), `/posts/[slug]`, `/category/[slug]`, About, Medical Disclaimer, Privacy |
| Article page | Eyebrow → headline → standfirst → trust bar → key points → body → **when to seek care** → sources → disclaimer → related posts |
| Admin | Email login, **review queue** (read → edit → approve/reject → publish), post list |
| Pipeline | Topic matrix → select topic → dedup gates 1–3 → draft → scope guard → persist as `in_review`; daily cron |
| SEO | Per-page metadata, sitemap, robots, JSON-LD, typographic OG images |
| Design | `tokens.css` + the components in `DESIGN.md` §7, light + dark via OS preference |
| Deploy | Vercel, custom domain, cron live |

### Deliberately out

| Deferred | Why |
|---|---|
| Search | Needs a corpus to be useful. Nobody searches a 20-post site. |
| Tags | Categories are enough at MVP scale; tags multiply admin work |
| Comments, reactions | Zero audience on day one. Pure cost. |
| Newsletter | Nothing to send yet. Add once posting is steady. |
| Ads, affiliate | AdSense needs traffic to approve. Building slots now is speculative. |
| Dedup gate 4 (outline overlap) | Gates 1–3 catch the real duplicates; gate 4 is a refinement |
| Search Console performance sync | The `post_performance` table ships in M2, but there's no data to sync until pages index — wire the job around month 2 |
| Content re-review job | Nothing is stale yet. Build it before month 12, not now. |
| Theme toggle | OS preference only at MVP; the token file already supports the toggle |
| RSS | Cheap, but nothing consumes it yet |
| Author profiles, view counts | Single author, and analytics covers views |

The cut list matters as much as the build list. A 20-post site with comments and a newsletter looks
like a site nobody reads. A 20-post site that's clean, fast and indexed looks like a new publication.

---

## 2. Action plan

Tasks are sized to be individually completable and verifiable. `→` marks a dependency.

### M0 · Spike — no code, do this first

| # | Task | Done when |
|---|---|---|
| 0.1 | Run `docs/spike/` in AI Studio — 4 articles + the adversarial probe | Scoring sheet filled in |
| 0.2 | Green / amber / red decision recorded | M4's design confirmed or revised |

45 minutes. M4 is two sessions built on the assumption that grounded Gemini output is publishable.
Validate it before writing it, not after. M1–M3 can proceed in parallel regardless of the outcome.

### M1 · Foundation

| # | Task | Done when |
|---|---|---|
| 1.1 | `create-next-app` — TS, App Router, Tailwind v4, `src/`, `@/*` alias | `pnpm dev` serves a page |
| 1.2 | Folder skeleton per `STRUCTURE.md` §1, with `index.ts` stubs | Tree matches the doc |
| 1.3 | ESLint flat config + Prettier + `no-restricted-imports` for rule 2 | Cross-feature deep import fails lint |
| 1.4 | `src/env.ts` — Zod schema, imported by `next.config.ts` | Build fails on a missing key |
| 1.5 | husky + lint-staged; typecheck + lint on staged | Bad commit is blocked |
| 1.6 | `tokens.css` wired in + `next/font` for Bricolage Grotesque & Public Sans | Fonts render; dark mode flips with OS |

### M2 · Data layer → M1

| # | Task | Done when |
|---|---|---|
| 2.1 | Supabase project; keys into `.env.local` | Client connects |
| 2.2 | `0001_init.sql` — profiles, categories, posts, post_sources | `supabase db push` clean |
| 2.3 | `0002_pgvector.sql` — extension, `post_embeddings`, HNSW index | Cosine query returns |
| 2.4 | `0003_topic_matrix.sql` — `topic_matrix`, `topic_queue`, `generation_runs` | Unique constraint holds |
| 2.5 | RLS on every table + policy tests | Anon reads published only; anon write denied |
| 2.6 | `seed.sql` from `supabase/seed/topic-matrix.csv` — 7 categories + 203 matrix cells | Seeded and queryable (`TOPIC-MATRIX.md`) |
| 2.7 | `supabase gen types` → `database.types.ts`, committed | Typed client, no `any` |
| 2.8 | `features/posts/queries.ts` — `getPostBySlug`, `listPublished`, `listByCategory` | Return typed rows |

### M3 · Public site → M2

| # | Task | Done when |
|---|---|---|
| 3.1 | `(site)/layout.tsx` — header, footer, shell, skip link | Renders at all breakpoints |
| 3.2 | Post row + dense index listing | Matches `DESIGN.md` §7 |
| 3.3 | Home page | Lead post + index + category strip |
| 3.4 | Article page — full anatomy, `PLAN.md` §—, TOC + sticky rail ≥1024px | Renders a seeded post |
| 3.5 | `TrustBar`, `WhenToSeekCare`, `KeyPoints`, `SourceList` | Visually per spec |
| 3.6 | Markdown → HTML pipeline, styled to the token scale | Headings, lists, tables, quotes correct |
| 3.7 | Category page + pagination | 20/page, correct counts |
| 3.8 | About, Medical Disclaimer, Privacy, Terms, **Contact** | Real copy, not placeholder (`LEGAL.md` §1) |
| 3.9 | Reading progress bar | Respects `prefers-reduced-motion` |
| 3.10 | `RelatedPosts` via pgvector neighbours | Returns 3 relevant posts |

### M4 · AI pipeline → M2 *(the core)*

| # | Task | Done when |
|---|---|---|
| 4.1 | `lib/ai/client.ts` + `models.ts` — model IDs in one place | Verified against current Google docs |
| 4.2 | `lib/ai/embed.ts` + `upsertEmbedding` | Vector stored, dimension matches |
| 4.3 | `generation/schema.ts` — Zod + Gemini `responseSchema`, enforcing `when_to_seek_care`, `sources`, 70-char title | Malformed response throws |
| 4.4 | `prompts/v1/` — plan-topic, draft-article, guard-scope | Versioned, immutable |
| 4.5 | `steps/select-topic.ts` — walk matrix, prefer `open` + high priority | Returns an unused cell |
| 4.6 | `steps/check-duplicate.ts` — gates 1–3 | Near-duplicate fixture rejected with a reason |
| 4.7 | `steps/draft-article.ts` — Pro + Search grounding → typed draft | Real citations returned |
| 4.8 | `steps/guard-scope.ts` — Flash classifier vs `EDITORIAL.md` | Rejects all adversarial fixtures |
| 4.9 | `steps/finalize.ts` — slug, reading time, SEO, persist `in_review` | Row appears with sources |
| 4.10 | `pipeline.ts` + `api/cron/generate` — `CRON_SECRET`, cost cap, run logging | End-to-end produces a draft |
| 4.11 | `vercel.json` cron + healthchecks.io ping on success | Fires on schedule; missed run emails you |
| 4.12 | Internal linking — every draft cites 2–3 existing posts from its embedding neighbours | Links render and resolve (`GROWTH.md` §4) |

### M5 · Admin → M3, M4

| # | Task | Done when |
|---|---|---|
| 5.1 | Supabase Auth + `(admin)` layout guard by role | Non-admin gets 404, not a login loop |
| 5.2 | Review queue list — drafts, dedup score, scope verdict | Sorted oldest first |
| 5.3 | Review detail — rendered draft, sources, edit, approve/reject | Approve sets `published` + `published_at` |
| 5.4 | Post list + markdown editor with preview | Edit and save a published post |
| 5.5 | Dashboard — counts by status, runs, spend | Numbers match the DB |
| 5.6 | Topic matrix view + coverage/exhaustion | Open cells per category visible |

### M6 · SEO & launch → M3, M5

| # | Task | Done when |
|---|---|---|
| 6.1 | `metadata.ts` — title template, canonical, OG/Twitter | Valid on every route |
| 6.2 | JSON-LD — Article, MedicalWebPage, FAQPage, BreadcrumbList | Rich Results Test passes |
| 6.3 | `sitemap.ts` index-split + `robots.ts` | Valid XML, <50k URLs/file |
| 6.4 | `opengraph-image.tsx` — typographic, on-brand | Renders per post |
| 6.5 | **Cookieless** analytics (Plausible/Umami) | Pageviews recorded, **no consent banner needed** (`LEGAL.md` §4) |
| 6.5b | Sentry + weekly markdown backup to Git | Error alerts arrive; restore tested once (`OPERATIONS.md` §1) |
| 6.6 | Lighthouse ≥95 across all four categories | On the real article page |
| 6.7 | Deploy + `thebodycue.com` + env vars in Vercel | HTTPS, cron live |
| 6.8 | Google Search Console, sitemap submitted | Verified, indexing |
| 6.9 | Generate 15–20 real posts, review and publish | Site has genuine content |

---

## 3. Critical path

```
M1 ──► M2 ──┬──► M3 ──┐
            │         ├──► M5 ──► M6
            └──► M4 ──┘
```

**M3 and M4 are independent** once the schema exists. M4 is the risky one — it's where the
unknowns live (grounding quality, dedup thresholds, scope-guard accuracy), so start it early rather
than saving it for last. If M4 turns out to need two more sessions of tuning, that's much better to
discover in week two than in week five.

---

## 4. Definition of done

The MVP ships when all of these are true:

- [ ] A visitor can read an article at `thebodycue.com/posts/<slug>` on phone and desktop
- [ ] The article has a when-to-seek-care block, cited sources, and a disclaimer
- [ ] Cron produces drafts on schedule without manual intervention
- [ ] A near-duplicate of an existing post is rejected, with the reason visible in admin
- [ ] Every adversarial fixture in the scope-guard suite is rejected
- [ ] You can approve a draft to published in under 60 seconds
- [ ] Lighthouse ≥95 on an article page
- [ ] Search Console shows pages indexed
- [ ] 15+ real posts live
- [ ] Privacy, disclaimer, terms and contact pages are live and real (`LEGAL.md` §1)
- [ ] A missed cron run sends you an email (`OPERATIONS.md` §2)
- [ ] The backup has been restored once, successfully

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| Gemini grounding returns weak or dead citations | Validate URLs resolve in `finalize`; reject drafts with <3 live sources |
| Dedup threshold wrong (0.86 is a guess) | Tune against the first 50 real drafts; it's an env var, not a constant |
| Scope guard leaks a medication mention | Adversarial fixture suite (`TESTING.md` §4) + review queue as the human backstop |
| Cost overrun from a retry loop | `GENERATION_DAILY_COST_CAP_USD` checked before every call, not after |
| Google doesn't index a new AI-content domain | Start at 2/day, real Search Console monitoring, don't ramp until pages index |
| Model IDs change | All in `lib/ai/models.ts`; verify against Google's docs at build time |
