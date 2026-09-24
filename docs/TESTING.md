# Testing Scenarios

A content site doesn't earn broad unit-test coverage — but this one has two subsystems that do,
because they're the only things standing between the project and either a Google penalty or an
article that tells someone to take a drug.

**Test heavily:** the scope guard, the dedup gates, RLS.
**Test lightly:** rendering, routing, formatting.
**Don't test:** layout minutiae, third-party SDKs, anything a typechecker already proves.

Stack: **Vitest** (unit/integration) · **Playwright** (E2E) · fixtures in `tests/fixtures/`.

---

## 1. Scope guard — the safety suite

The highest-value tests in the project. Two corpora, both hand-written, both committed.

### 1a. Must reject — `tests/fixtures/scope/violations/`

Each fixture is a plausible draft with exactly one violation, so a failure tells you which rule leaked.

| # | Fixture | Contains | Expect |
|---|---|---|---|
| V1 | `names-medication.md` | "…many people take ibuprofen for this." | reject · `medication_mention` |
| V2 | `gives-dosage.md` | "…400mg, twice daily." | reject · `dosage` |
| V3 | `diagnoses.md` | "If you have these three symptoms, you have IBS." | reject · `diagnosis` |
| V4 | `claims-cure.md` | "This routine cures insomnia." | reject · `cure_claim` |
| V5 | `natural-alternative.md` | "A natural alternative to statins." | reject · `treatment_substitution` |
| V6 | `supplement-protocol.md` | "Take 2000 IU of vitamin D each morning." | reject · `dosage` |
| V7 | `discourages-care.md` | "You don't need to see a doctor for this." | reject · `discourages_care` |
| V8 | `missing-seek-care.md` | Valid content, `when_to_seek_care` empty | reject · `schema` |
| V9 | `no-sources.md` | Valid content, `sources: []` | reject · `insufficient_sources` |
| V10 | `subtle-dosage.md` | "…about a teaspoon, three times a day." | reject · `dosage` |

V10 exists because V2 is easy and a regex will catch it. V10 is the one that tells you whether the
guard actually works.

### 1b. Must pass — `tests/fixtures/scope/valid/`

False positives are a real failure mode: a guard that rejects everything is useless, and you won't
notice from the reject count alone.

| # | Fixture | The trap |
|---|---|---|
| P1 | `mentions-doctor.md` | Says "speak to your doctor" — must not trip `discourages_care` |
| P2 | `names-condition.md` | Explains what IBS *is* without diagnosing the reader |
| P3 | `food-quantities.md` | "Aim for 30g of fibre a day" — nutrition, not dosage |
| P4 | `exercise-reps.md` | "Three sets of ten" — must not trip `dosage` |
| P5 | `cites-drug-study.md` | A source titled *"…metformin trial"* in `sources[]`, not the body |
| P6 | `symptom-duration.md` | "Usually resolves in 7–10 days" — prognosis, not treatment |

```ts
describe("scope guard", () => {
  it.each(violations)("rejects $name with reason $reason", async (f) => {
    const r = await guardScope(f.draft);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe(f.reason);
  });

  it.each(valid)("passes $name", async (f) => {
    expect((await guardScope(f.draft)).ok).toBe(true);   // false positives fail the build
  });
});
```

**Rule: every guard leak found in production becomes a new fixture in the same commit as the fix.**
This suite is the institutional memory of everything that has ever slipped through.

---

## 2. Dedup gates

Uses pre-computed embeddings committed as JSON — no live API calls, so it runs in CI for free and
deterministically.

| # | Scenario | Expect |
|---|---|---|
| D1 | Identical title | Gate 1 reject · `exact_title` |
| D2 | Same slug, different title | Gate 1 reject · `exact_slug` |
| D3 | *"10 Benefits of Morning Walks"* vs *"Why Walking Each Morning Helps"* | Gate 2 reject · `semantic_topic` |
| D4 | *"Walking after meals"* vs *"Sleep and screen time"* | passes all gates |
| D5 | Similarity exactly at `DEDUPE_TOPIC_THRESHOLD` | reject — boundary is inclusive |
| D6 | Similarity 0.001 below threshold | passes |
| D7 | Distinct topics, converged bodies | Gate 3 reject · `semantic_body` |
| D8 | Gate 3 rejection | exactly one regeneration attempt, then reject |
| D9 | Empty corpus (first ever post) | passes; no crash on an empty vector table |
| D10 | Rejected candidate | `topic_queue.reject_reason` written and visible in admin |

D5/D6 exist because an off-by-one on a `>` vs `>=` in the threshold comparison is invisible in
manual testing and silently changes the site's entire content strategy.

D9 matters because it's the literal first run in production.

---

## 3. RLS policies

Integration tests against a local Supabase, one per role. These protect the database from the
service-role key having a single fingerprint out of place.

| # | As | Action | Expect |
|---|---|---|---|
| R1 | anon | select `published` post | ✅ allowed |
| R2 | anon | select `in_review` post | ❌ empty, not an error |
| R3 | anon | insert into `posts` | ❌ denied |
| R4 | anon | insert into `subscribers` | ✅ allowed |
| R5 | anon | select from `subscribers` | ❌ denied (no email harvesting) |
| R6 | authed reader | update someone else's comment | ❌ denied |
| R7 | admin | select `in_review` | ✅ allowed |
| R8 | anon | select `generation_runs` | ❌ denied (leaks cost + prompt data) |

---

## 4. Pipeline integration

Gemini mocked at the client boundary — real pipeline, fake model.

| # | Scenario | Expect |
|---|---|---|
| G1 | Happy path | Post row `in_review`, sources rows, embedding, `generation_runs` `success` |
| G2 | Gemini returns malformed JSON | Zod throws, run logged `failed`, **no partial post row** |
| G3 | Gemini times out | Retried with backoff, then logged `failed` |
| G4 | Daily cost cap already reached | Exits before any API call, logged `skipped` |
| G5 | Dedup rejects | Topic marked `rejected`, no post created, run `rejected` |
| G6 | Scope guard rejects | Same, reason recorded |
| G7 | `AUTO_PUBLISH=true` | Status is `published` with `published_at` set |
| G8 | `AUTO_PUBLISH=false` | Status is `in_review`, invisible to anon |
| G9 | Cron hit without `CRON_SECRET` | 401, nothing runs |
| G10 | Two cron runs overlap | Second exits; no duplicate post from the same topic |

G2 is the one that matters most: a partial write at 3am that looks like a real article is worse
than an outright failure.

---

## 5. E2E — Playwright

Five journeys. Not more; these are slow and they should stay trustworthy.

| # | Journey | Assertions |
|---|---|---|
| E1 | **Reader** — home → click a post → read | Headline, trust bar, when-to-seek-care, sources, disclaimer all present |
| E2 | **Category** — nav → category → paginate | Correct posts, page 2 differs, canonical is right |
| E3 | **Admin approve** — login → review → approve → view live | Post publicly reachable; was 404 before |
| E4 | **Admin reject** — reject a draft | Leaves the queue, stays unpublished |
| E5 | **Auth boundary** — logged-out visit to `/admin` | Redirect or 404; never a flash of admin content |

E3 is the core product loop. If only one E2E test survives, it's this one.

---

## 6. Unit — the small deterministic things

| Module | Cases |
|---|---|
| `slug.ts` | Unicode, punctuation, 200-char title, collision → `-2` suffix, empty input |
| `reading-time.ts` | Known word count → known minutes; markdown syntax excluded from the count |
| `env.ts` | Missing key throws; malformed number throws; valid parses |
| `metadata.ts` | Title template, canonical, OG fields present |
| `json-ld.ts` | Valid schema.org shape; no `undefined` in output |

---

## 7. Manual QA — before each deploy

**Visual** — article at 375 / 768 / 1280 / 1920 · light and dark · long headline (70 chars) wraps
cleanly · empty category · post with 1 source and with 12 · reduced-motion on.

**Accessibility** — keyboard-only through a full article · visible focus everywhere · axe DevTools
clean · 200% zoom without horizontal scroll · screen-reader pass on the article page.

**SEO** — Rich Results Test on an article · sitemap valid · canonical on paginated pages · OG
preview renders · `robots.txt` correct.

**Performance** — Lighthouse ≥95 on a real article page, throttled mobile. CLS must be 0: no covers
means no image shift, so any CLS at all is a bug in the ad-slot reservation.

---

## 8. CI

```
on: pull_request
  typecheck  ·  lint  ·  vitest (unit + integration)  ·  build
on: push to main
  the above  +  playwright  +  deploy
```

Playwright doesn't gate PRs — too slow and too flaky to block on. Scope-guard and dedup tests *do*
gate PRs, and they run in well under a second because every embedding is a committed fixture.
