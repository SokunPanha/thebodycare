# The Body Cue — thebodycue.com

A health blog that helps people live healthily and understand what their body is signalling.
Next.js 16 + Supabase + Gemini. Articles are AI-generated on a schedule, deduplicated against
everything already published, scope-checked, and approved by a human before going live.

**The site does not practise medicine.** No drugs, no dosages, no diagnosis — see `docs/EDITORIAL.md`.

---

## ▶ Status: M1–M3 + M5.1–5.3 done — next is M4 (needs spike results)

**Before M4 is written, the user should run `docs/spike/README.md`** — a 45-minute, no-code
validation in AI Studio that Gemini + Search grounding actually produces publishable, in-scope,
well-cited health content. M4 is two sessions built on that assumption. If the spike comes back red,
M4's design changes (human-written pillars, AI clusters only). **Ask for the spike results before
starting M4.**

**Next:** M4 needs the spike results and a real `GEMINI_API_KEY`. Remaining M5 (5.4 post list,
5.5 dashboard, 5.6 topic matrix view) doesn't depend on M4.

**M4 must honour two contracts the review screen already reads:** `generation_runs.scope_verdict`
must match `scopeVerdictSchema` in `features/posts/schema.ts`, and each draft needs a
`generation_runs` row linking `topic_id` → `post_id` so approve/reject update the topic and cell.

Built: M1 foundation · M2 schema, RLS, seed, typed queries · M3 public site — home, article,
category (+ `/page/N`), About/Contact/Disclaimer/Privacy/Terms, markdown pipeline, CSS-only
reading progress, pgvector related posts. 37 tests.
`.env.local` points at the **local** Supabase stack. `pnpm db:seed:dev` loads 4 sample articles.

**Before launch, confirm in `src/config/site.ts`:** `publisher.legalName` (a real data controller),
`contactEmail`. The legal pages render from these.

**Blocked on the user:** Supabase keys, `GEMINI_API_KEY`, domain registration.

**Next.js 16, not 15** — read `AGENTS.md`; check `node_modules/next/dist/docs/` before writing
route/caching/proxy code. `middleware.ts` is now `proxy.ts`.

---

## Docs — read in this order

| File | What it settles |
|---|---|
| `docs/PLAN.md` | Architecture, DB schema, dedup design, costs, phases |
| `docs/MVP.md` | **What to build next.** Scope, ordered tasks, definition of done |
| `docs/EDITORIAL.md` | What may and may not be published — the safety boundary |
| `docs/DESIGN.md` | Colour, type, spacing, component specs |
| `docs/STRUCTURE.md` | Folder layout, naming, the seven rules |
| `docs/TESTING.md` | Test scenarios, especially the scope-guard fixtures |
| `docs/GROWTH.md` | How anyone finds the site. Keyword method, distribution, decision gates |
| `docs/OPERATIONS.md` | Backups, alerting, content re-review, runbooks |
| `docs/LEGAL.md` | Required pages, GDPR, consent, AdSense prerequisites |
| `docs/TOPIC-MATRIX.md` | The 7 categories and the topic seed. Data: `supabase/seed/topic-matrix.csv` |
| `docs/spike/` | **Run before M4.** Validates Gemini output quality with no code |

---

## Non-negotiables

Break any of these and the project fails in a way that's expensive to unwind.

1. **`app/` has no business logic.** Routes compose; features do the work.
2. **Features are imported through `index.ts` only** — never a deep path into another feature.
3. **DB access lives in `features/*/queries.ts` and `actions.ts`.** Nowhere else. No component
   builds its own Supabase query.
4. **`SUPABASE_SERVICE_ROLE_KEY` has exactly one importer:** `lib/supabase/admin.ts`, marked
   `server-only`, used only from `app/api/**` and server actions. It bypasses all RLS.
5. **Every Gemini response is `.parse()`d through Zod** before it touches the database. A partial
   write at 3am is worse than a clean failure.
6. **No raw colour, font, or spacing value in a component.** Tokens only — `src/styles/tokens.css`.
7. **Prompts are immutable.** Never edit `prompts/v1/`; add `v2/`. Every `generation_runs` row
   records the version that produced it.

Full reasoning for each in `docs/STRUCTURE.md` §3.

---

## Conventions

- Files `kebab-case`; components `PascalCase` matching the filename
- Reads `get*` / `list*`; writes are verb-first in `actions.ts`
- DB is `snake_case` **all the way to the component** — no camelCase mapping layer
- Migrations `NNNN_verb_noun.sql`; regenerate `database.types.ts` in the same commit
- Commits: Conventional Commits (`feat(generation): add scope guard`)
- Alias `@/*` → `src/*`

---

## Design quick reference

Direction **B — Daylight**. Full spec in `docs/DESIGN.md`.

- Primary `#4A63D6` periwinkle · accent `#E8664A` coral
- **Coral is semantic only** — the "when to seek care" block, nowhere else
- Bricolage Grotesque (display) + Public Sans (body), self-hosted via `next/font/google`
- Body text **18px**, measure **65ch**, hard-capped
- **Covers (revised 2026-09-25):** AI-generated photos (MiniMax `image-01`) or staff uploads, with
  code-generated art as the fallback — `DESIGN.md` §6. Coral never appears in covers.
- No per-category colours — categories are an uppercase label in `--primary`

---

## Gotchas

- **Gemini model IDs: use `gemini-3.7-flash`.** Verified 2026-09-24. Do not write `gemini-2.5-*`
  from memory — that's two generations stale, and it's the mistake this plan already made once.
  All IDs go in `lib/ai/models.ts` and nowhere else. `PLAN.md` §8 has the full table.
- **Prior art lives in `../Youtube Automation/backend`** — a production Gemini pipeline in Python.
  Worth reading before writing `lib/ai/`: `utils/gemini_text.py` (transient-vs-permanent error
  classification, thinking-config fallback ladder, `unwrap_json` — markdown fences still appear in
  JSON mode, so parse defensively) and `core/costs.py` (prefix-matched pricing so `-preview` and
  dated suffixes still resolve). Different language, but the failure modes are already mapped.
- **Dedup thresholds (0.86 / 0.90) are guesses.** They're env vars for a reason — tune against the
  first ~50 real drafts.
- **CLS must be zero.** With no images there's no image shift, so any CLS is an unreserved ad slot.
- **Scope-guard false positives matter as much as leaks.** A guard that rejects everything looks
  like a guard that works. `docs/TESTING.md` §1b tests for this.
- **When a guard leak is found in production, add the fixture in the same commit as the fix.**
- The `topic_matrix` is what keeps generation from starving at 4 posts/day. Random topic ideation
  hits a wall around month three — see `docs/PLAN.md` §3.2.

---

## Commands

```bash
pnpm dev              # dev server
pnpm build            # production build (fails on bad env)
pnpm typecheck        # next typegen && tsc — typegen provides LayoutProps/PageProps
pnpm lint             # eslint, zero warnings allowed
pnpm format           # prettier (Markdown is excluded on purpose)
pnpm test             # vitest — integration tests need `pnpm db:start` first
pnpm test:e2e         # playwright: builds, starts on :3200, runs E3/E4/E5 against local Supabase
pnpm db:start         # local Supabase (Docker). Applies migrations + seed on first start
pnpm db:reset         # re-apply all migrations + seed.sql from scratch
pnpm db:types         # regenerate database.types.ts — same commit as the migration
pnpm db:seed:build    # topic-matrix.csv → supabase/seed.sql
```

**Search (added 2026-09-25, pulled forward from post-MVP):** Postgres full-text — `posts.search_vector`
(generated, weighted title > standfirst > body) + `search_posts()` (migration 0009). `/search` is
dynamic and `noindex, follow`. Header: single row with search box only from 1280px (measured — all
seven topics + a search box don't fit narrower); below that, a search icon and topics on their own row.

**Covers:** `posts.cover_*` + the public `covers` bucket (migration 0008). `PostCover` renders the
photo or falls back to `CoverArt`. AI generation needs `MINIMAX_API_KEY` in `.env.local` (optional —
the editor's "Generate with AI" button is disabled without it). The storage SELECT policy is
required: without it, deleting a replaced cover silently does nothing (tested).

**Admin auth — read before adding any admin page or action:** every admin **page** and **server
action** must call `requireStaff()` itself. The layout's call is not enough: Next renders layouts and
pages in parallel, and a page under a layout that 404s still streams its content into the response
(verified — it leaked the page body to a reader). Non-staff get 404, never a redirect. Public
sign-up is off (`[auth] enable_signup = false`); do **not** set `[auth.email] enable_signup = false`
— that disables email login entirely. Local accounts: `pnpm staff:create <email> [admin|editor]`.
Production: invite from the Supabase dashboard, then `update profiles set role = 'admin' …`, and
turn off "Allow new users to sign up" in the dashboard — config.toml only affects local.

**Caching:** public pages use ISR (`export const revalidate`) + `generateStaticParams`, not Cache
Components — `notFound()` must return a real 404 for SEO. Approve/edit (M5) must call
`revalidatePath`. **Styles:** base/component CSS lives in `@layer base`/`@layer components`; any
unlayered rule beats every Tailwind utility.

**Supabase gotchas:** the CLI is a devDependency (`pnpm exec supabase …`), not global. Public pages
read through `createPublicClient()` (cookieless, stays static); `createSessionClient()` is for
admin/auth. Promote a user: `update profiles set role = 'admin' where id = (select id from auth.users where email = '…');`

The pre-commit hook runs lint-staged (eslint + prettier on staged code) and `pnpm typecheck`.
