# Project Structure & Conventions

Companion to `PLAN.md`. This is the shape the codebase gets built into, and the rules that keep it
from rotting once there are 1,275 posts and a generation pipeline running four times a day.

The organising idea is **feature-first, not type-first**. A `components/` + `utils/` + `hooks/`
layout looks tidy on day one and becomes a junk drawer by month three, because nothing tells you
where a new file belongs. Here, everything that makes "posts" work lives in one folder.

---

## 1. Folder layout

```
health-blog/
├── docs/
│   ├── PLAN.md                     # roadmap, phases, decisions
│   ├── STRUCTURE.md                # this file
│   ├── EDITORIAL.md                # the in-scope / out-of-scope rules (§2 of PLAN)
│   └── DESIGN.md                   # tokens, once a direction is chosen
│
├── supabase/
│   ├── migrations/                 # 0001_init.sql, 0002_topic_matrix.sql …
│   ├── seed.sql                    # categories + starter topic matrix
│   └── config.toml
│
├── public/
│   └── fonts/                      # self-hosted, loaded via next/font/local
│
└── src/
    ├── app/                        # ROUTING ONLY — no business logic
    │   ├── (site)/                 # public shell: header, footer, nav
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                        # home
    │   │   ├── posts/[slug]/page.tsx
    │   │   ├── category/[slug]/page.tsx
    │   │   ├── tag/[slug]/page.tsx
    │   │   ├── search/page.tsx
    │   │   └── (legal)/
    │   │       ├── about/page.tsx
    │   │       ├── medical-disclaimer/page.tsx
    │   │       └── privacy/page.tsx
    │   │
    │   ├── (admin)/admin/          # separate shell, auth-gated in layout
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                        # dashboard
    │   │   ├── review/page.tsx                 # the main screen
    │   │   ├── posts/[id]/edit/page.tsx
    │   │   ├── topics/page.tsx                 # matrix + coverage
    │   │   ├── runs/page.tsx
    │   │   ├── comments/page.tsx
    │   │   └── subscribers/page.tsx
    │   │
    │   ├── api/
    │   │   ├── cron/generate/route.ts          # the pipeline entrypoint
    │   │   └── newsletter/
    │   │       ├── subscribe/route.ts
    │   │       └── confirm/route.ts
    │   │
    │   ├── feed.xml/route.ts
    │   ├── sitemap.ts                          # index-split, >1k URLs
    │   ├── robots.ts
    │   └── opengraph-image.tsx
    │
    ├── features/                   # ★ where the actual work lives
    │   ├── posts/
    │   │   ├── components/
    │   │   │   ├── post-card.tsx
    │   │   │   ├── post-header.tsx
    │   │   │   ├── post-body.tsx
    │   │   │   ├── trust-bar.tsx
    │   │   │   ├── when-to-seek-care.tsx
    │   │   │   ├── source-list.tsx
    │   │   │   └── related-posts.tsx
    │   │   ├── queries.ts          # all reads   — getPostBySlug, listPublished
    │   │   ├── actions.ts          # all writes  — "use server"
    │   │   ├── schema.ts           # zod
    │   │   ├── types.ts
    │   │   └── index.ts            # ← the ONLY public surface
    │   │
    │   ├── generation/
    │   │   ├── pipeline.ts         # orchestrates the steps below, in order
    │   │   ├── steps/
    │   │   │   ├── select-topic.ts         # walk the topic matrix
    │   │   │   ├── check-duplicate.ts      # gates 1–4
    │   │   │   ├── draft-article.ts
    │   │   │   ├── guard-scope.ts          # no meds / dosage / diagnosis
    │   │   │   └── finalize.ts             # seo, slug, persist
    │   │   ├── prompts/
    │   │   │   └── v1/
    │   │   │       ├── plan-topic.ts
    │   │   │       ├── draft-article.ts
    │   │   │       └── guard-scope.ts
    │   │   ├── schema.ts           # the responseSchema contract
    │   │   └── index.ts
    │   │
    │   ├── taxonomy/               # categories, tags, topic matrix
    │   ├── comments/
    │   ├── newsletter/
    │   ├── engagement/             # reactions, view counts
    │   └── monetization/           # ad-slot, affiliate-link, disclosure
    │
    ├── components/
    │   ├── ui/                     # shadcn primitives ONLY — never edited by hand
    │   └── layout/                 # header, footer, container, theme-toggle
    │
    ├── lib/                        # generic, feature-agnostic
    │   ├── supabase/
    │   │   ├── server.ts           # RLS-respecting, request-scoped
    │   │   ├── browser.ts
    │   │   ├── admin.ts            # ⚠ service role — see rule 4
    │   │   └── database.types.ts   # generated, committed
    │   ├── ai/
    │   │   ├── client.ts
    │   │   ├── models.ts           # model IDs in ONE place
    │   │   └── embed.ts
    │   ├── seo/
    │   │   ├── metadata.ts
    │   │   └── json-ld.ts
    │   └── utils/
    │       ├── slug.ts
    │       ├── reading-time.ts
    │       └── cn.ts
    │
    ├── config/
    │   ├── site.ts                 # name, url, socials, author
    │   ├── categories.ts
    │   └── generation.ts           # cadence, thresholds, cost caps
    │
    ├── styles/
    │   ├── globals.css
    │   └── tokens.css              # ← the chosen design direction
    │
    └── env.ts                      # zod-validated, throws at boot
```

---

## 2. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files & folders | `kebab-case`, always | `when-to-seek-care.tsx` |
| React components | `PascalCase`, matching the filename | `WhenToSeekCare` in `when-to-seek-care.tsx` |
| Hooks | `use-` prefix | `use-reading-progress.ts` |
| Read functions | `get*` (one) / `list*` (many) | `getPostBySlug`, `listPublishedPosts` |
| Write functions | verb-first, in `actions.ts` | `approvePost`, `rejectTopic` |
| Booleans | `is` / `has` / `can` | `isPublished`, `hasSources` |
| DB tables | `snake_case`, **plural** | `post_sources`, `generation_runs` |
| DB columns | `snake_case`; timestamps `*_at`; FKs `*_id` | `published_at`, `category_id` |
| Zod schemas | `camelCase` + `Schema` | `draftArticleSchema` |
| Types | `PascalCase`; composed types spell out the join | `Post`, `PostWithSources` |
| Env vars | `SCREAMING_SNAKE`; `NEXT_PUBLIC_` **only** if browser-safe | `GEMINI_API_KEY` |
| Migrations | `NNNN_verb_noun.sql` | `0003_add_topic_matrix.sql` |
| Branches | `type/short-description` | `feat/dedup-gates` |
| Commits | Conventional Commits | `feat(generation): add scope guard` |

**The snake_case/camelCase seam:** Postgres is `snake_case`, TypeScript is `camelCase`. Rather than
mapping in both directions everywhere, generated Supabase types stay `snake_case` all the way to the
component. One convention, no translation layer, no bugs from a mistyped mapper.

---

## 3. The seven rules

These are what actually keep it maintainable. Each one prevents a specific failure I'd otherwise
expect around month three.

**1. `app/` contains no business logic.**
A page file fetches from a feature's `queries.ts` and composes components. If a route file grows a
`.filter()` chain over posts, that logic belongs in the feature. Keeps routing swappable and logic
testable without a request.

**2. Features talk through `index.ts` only.**
`import { PostCard } from "@/features/posts"` — never
`from "@/features/posts/components/post-card"`. Each feature's public surface is explicit, so you can
refactor its internals freely. Enforced by an ESLint `no-restricted-imports` rule, not by memory.

**3. Database access lives in `queries.ts` / `actions.ts`. Nowhere else.**
No component builds its own Supabase query. When a query is slow or a column is renamed, there's one
place to look. This is the rule that pays off most at 1,275 rows of content.

**4. The service-role key has exactly one importer.**
`lib/supabase/admin.ts` is the only file allowed to read `SUPABASE_SERVICE_ROLE_KEY`, it imports
`server-only`, and it may only be used from `app/api/**` and server actions. The service role
bypasses RLS entirely — leaking it into a client bundle exposes the whole database. One file, one
rule, easy to audit.

**5. Every AI response is parsed through Zod before it touches anything.**
Gemini's structured output is a strong contract, not a guarantee. `draftArticleSchema.parse()` at the
boundary means a malformed generation fails loudly in the pipeline instead of writing a half-empty
article into the database at 3am.

**6. No raw colour, font, or spacing value in a component.**
Everything reads from `tokens.css` via Tailwind theme values. This is what makes the four design
directions swappable, and what stops post #900 from having a subtly different green.

**7. Prompts are versioned and immutable.**
Editing `prompts/v1/draft-article.ts` is forbidden; you add `v2/`. Every `generation_runs` row stores
the version that produced it, so when quality shifts you can prove which change caused it. Without
this you have 1,275 articles from an unknown number of prompts and no way to correlate anything.

---

## 4. Tooling

| Concern | Choice | Note |
|---|---|---|
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess` | Non-negotiable given generated content |
| Path alias | `@/*` → `src/*` | Single alias; no `~` or relative chains |
| Lint | ESLint flat config + `eslint-plugin-import` | Carries rule 2's boundary enforcement |
| Format | Prettier + `prettier-plugin-tailwindcss` | Class order stops being a review topic |
| Pre-commit | husky + lint-staged | Typecheck + lint on staged files only |
| Boundaries | `server-only` / `client-only` packages | Build-time error, not a runtime surprise |
| Env | `env.ts` with Zod, imported in `next.config.ts` | Missing key fails the build, not the 3am cron |
| DB types | `supabase gen types typescript` → committed | Regenerate in the same commit as the migration |
| Unit tests | Vitest | Only where logic is real: dedup thresholds, scope guard, slug, reading time |
| E2E | Playwright | Three smoke paths: home → post, search, admin approve → published |
| CI | GitHub Actions | typecheck · lint · test · build on PR |

**On testing:** I'm not proposing broad coverage for a content site — it wouldn't earn its keep. But
the dedup gates and the scope guard are different: they're the two things standing between you and
either a Google penalty or a post that recommends a medication. Those get real tests with real
fixtures.

---

## 5. Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only — see rule 4

# AI
GEMINI_API_KEY=

# Generation
GENERATION_POSTS_PER_DAY=2        # ramp to 4 — see PLAN §3.2
GENERATION_AUTO_PUBLISH=false     # see PLAN §3.1
DEDUPE_TOPIC_THRESHOLD=0.86
DEDUPE_BODY_THRESHOLD=0.90
GENERATION_DAILY_COST_CAP_USD=1.50

# Site
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=                      # guards /api/cron/generate

# Later
RESEND_API_KEY=
```

Every one of these is declared in `src/env.ts` with a Zod schema and a comment. A missing or
malformed value fails the build — the alternative is discovering it from an empty review queue a
week later.

---

## 6. Two conventions specific to this project

**Generation config is data, not code.** Cadence, thresholds and cost caps live in env/`config/`,
never inline. You will tune all of them in the first month, and each one should be a redeploy at
worst — ideally a dashboard toggle.

**Every generated post is traceable.** `generation_runs` links topic → prompt version → model →
token cost → post. When traffic jumps or tanks, you can segment by prompt version and answer *why*.
This costs one table and pays for itself the first time you need it.
