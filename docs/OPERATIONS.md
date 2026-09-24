# Operations

An unattended pipeline writing to a database nobody watches is how you discover in November that
nothing has published since September.

Everything here is free-tier. None of it is optional.

---

## 1. Backups

**The risk:** Supabase's free tier has limited backup retention and no self-serve point-in-time
recovery. If that project is lost or corrupted, **1,275 articles are gone.** There is no second copy
anywhere in the current plan.

**The fix — weekly export to Git.** A GitHub Action dumps every published post to markdown with
frontmatter and commits it:

```
content-backup/
├── posts/2026-09-24-why-you-wake-at-3am.md
├── topic-matrix.json
└── categories.json
```

Why markdown in Git rather than a SQL dump: it's human-readable, diffable, versioned forever, free,
and if you ever migrate off Supabase the content is already in the most portable format there is. A
SQL dump is only useful if Postgres still exists on the other end.

Run it weekly plus on every publish. Keep the `pg_dump` as well for the relational data
(`generation_runs`, subscribers) — but the content is the irreplaceable part.

**Test the restore once.** A backup you've never restored is a hypothesis.

---

## 2. Monitoring

| What | Tool | Free tier |
|---|---|---|
| Errors + stack traces | **Sentry** | 5k events/mo |
| Cron liveness | **healthchecks.io** | 20 checks |
| Uptime | **Better Stack** or UptimeRobot | plenty |
| Traffic | **Plausible** (self-host) or Vercel Analytics | see `LEGAL.md` §4 |
| Search performance | **Google Search Console** | free |

**The dead-man's switch matters most.** The cron pings healthchecks.io on success; if the ping
doesn't arrive, you get an email. This catches the silent failure mode — Vercel cron misconfigured,
function timing out, API key expired — which otherwise presents as "the review queue looks quiet."

---

## 3. Alerts

| Trigger | Channel | Why |
|---|---|---|
| No successful generation in 48h | email | The silent failure |
| 3 consecutive generation failures | email | Something systemic broke |
| Daily cost cap reached | email | Retry loop or prompt regression |
| Scope guard rejection rate >30% in a day | email | Prompt drift — the model is wandering out of scope |
| Dedup rejection rate >40% for a week | email | Matrix exhausting (`PLAN.md` §3.2) |
| Any 5xx on a public route | Sentry | Reader-facing |
| Supabase >80% of free-tier storage | email | Upgrade before it's urgent |

Email, not Slack. This runs quietly for months and a channel you stop reading is not an alert.

---

## 4. Content maintenance

Nobody plans for this, and by year two it's a bigger job than creation.

### Re-review

Stale health content is an active E-E-A-T liability — "last reviewed 2026" on a 2028 page is worse
than no date at all.

| Content | Cycle |
|---|---|
| Symptom / when-to-seek-care | 12 months |
| Lifestyle, nutrition, movement | 24 months |
| Anything citing a guideline | 12 months, or on guideline change |

Add `posts.next_review_at`. A weekly job surfaces what's due into the admin review queue. The model
can propose an update; a human confirms it. Publishing *stops* being the only job.

### Link rot

Cited sources die, and dead citations on a health page are exactly the E-E-A-T signal you don't want.
A monthly job HEAD-requests every URL in `post_sources`, flags non-200s in admin, and the fix is a
re-grounded regeneration of the sources block only.

### Corrections

Write the policy before you need it:

1. Anyone can report an error — a visible link on every article
2. Unpublish within the hour if it's a safety issue (`status = 'archived'`, 410, out of the sitemap)
3. Fix, re-review, republish with a dated correction note at the top
4. **Add the case to `tests/fixtures/scope/` in the same commit** — see `TESTING.md` §1

Step 4 is what makes this a system that improves instead of one that just apologises.

---

## 5. Environments

One Supabase project means testing against production — a migration mistake takes the live site down.

**Minimum:** a second free Supabase project as staging. Migrations land there first, always.
`GENERATION_AUTO_PUBLISH` stays false and the cron stays disabled in staging.

**Migrations:** forward-only, never edited after they're applied. A mistake becomes a new migration.
Rolling back a schema change against live data is where real damage happens.

---

## 6. Runbooks

**Cron stopped publishing** → check healthchecks, then `generation_runs` for the last error, then
Vercel logs. Usual suspects in order: expired API key, cost cap hit, matrix out of `open` cells.

**Published article violates editorial rules** → unpublish immediately (do not wait to fix it), then
add the fixture, fix the guard, verify against the whole corpus, regenerate, republish.

**Costs spiked** → `generation_runs` groups by prompt version. A jump nearly always traces to a
prompt change producing longer output or a retry loop. Cap first, diagnose second.

**Traffic dropped sharply** → Search Console manual actions first, then Core Web Vitals, then recent
publishing volume. If a manual action for scaled content abuse lands, stop generation entirely before
doing anything else.

**Supabase nearing free-tier limits** → `generation_runs` is the growth culprit, not posts. Archive
rows older than 90 days to cold storage; the last quarter is all you ever query.

---

## 7. Weekly, 15 minutes

- [ ] Review queue cleared
- [ ] Generation runs — any failures?
- [ ] Cost tracking against cap
- [ ] Search Console — new impressions, any coverage errors
- [ ] Dedup + scope rejection rates
- [ ] Anything due for re-review
- [ ] Backup job ran green

The discipline of a standing 15 minutes is what separates this from a project that quietly dies in
month four with nobody noticing.
