# Editorial Rules

This file is the source of truth for what The Body Cue publishes. It is not a style guide — it is a
**safety boundary**, and it gets compiled into three places:

1. `features/generation/prompts/v1/draft-article.ts` — the constraints given to the model
2. `features/generation/prompts/v1/guard-scope.ts` — the classifier that checks the output
3. `tests/fixtures/scope/` — the fixtures that prove the classifier works

Change this file and all three must change with it, in the same commit.

---

## 1. The premise

The Body Cue helps people **live healthily** and **understand what their body is doing**. It does not
practise medicine. Its authority comes from explaining things clearly and knowing where its
competence ends — not from pretending to clinical expertise it doesn't have.

The single most useful sentence on this site is *"here's when this is worth seeing someone about."*

---

## 2. In scope

**Healthy living** — nutrition, movement, sleep, hydration, stress, posture, recovery, ergonomics,
ageing well, habit formation.

**Symptom literacy** — what a symptom is, what the body is signalling, how common it is, how long it
typically lasts, what tends to make it better or worse *in lifestyle terms*.

**When to seek care** — the threshold at which something is worth raising with a clinician. Every
symptom article must answer this.

**Prevention and awareness** — screening awareness, risk factors, understanding your own baseline.

**First aid** (added 2026-09-27, with the Symptoms & First Aid category) — the immediate, practical
steps a bystander can take until professional help arrives or the problem settles: cool a burn under
running water, press on a bleeding wound, rest and raise a sprain. Rules:

- **Steps come only from recognised first-aid bodies** — NHS, Red Cross, St John Ambulance,
  Resuscitation Council, national health services. Never improvised, never folk remedies (butter
  on a burn) except to say not to.
- **Emergencies lead with the call.** Where a situation can be an emergency, "call your local
  emergency number" comes first, before any step.
- **Still no medicines, by name or dose.** Where official first aid involves one (an adrenaline
  auto-injector, aspirin during a heart attack), say only "use their own prescribed emergency
  medicine if they have one" or "the call handler may tell you what to do" — never the drug or dose.
- **No skills that need training to do safely** as step-by-step instructions (CPR, the Heimlich
  manoeuvre): describe what to expect, follow the call handler, and point to a first-aid course.
- First aid is never presented as the whole answer: every first-aid article still ends with when
  to seek care.

---

## 3. Out of scope — hard blocks

| # | Block | Example of a violation |
|---|---|---|
| B1 | **Medication names** | "Many people take ibuprofen for this." |
| B2 | **Dosages** — of anything, including supplements | "400mg twice daily" · "2000 IU each morning" |
| B3 | **Diagnosis** | "If you have these three symptoms, you have IBS." |
| B4 | **Cure / reversal claims** | "This routine cures insomnia." |
| B5 | **Treatment substitution** | "A natural alternative to statins." |
| B6 | **Discouraging care** | "You don't need to see a doctor for this." |
| B7 | **Home remedies as treatment** | "Apply X to clear up the infection." |
| B8 | **Individual medical advice** | "In your case, you should…" |

B5 deserves emphasis: *"natural alternatives to [drug]"* is the single most common way a health blog
goes from harmless to dangerous, because it directly encourages someone to stop a prescription. It
is an absolute block regardless of framing.

---

## 4. The distinctions the guard must get right

These are where a naive filter fails. Each has a fixture in `TESTING.md` §1b.

| Allowed | Blocked | The line |
|---|---|---|
| "Aim for around 30g of fibre a day" | "Take 2000 IU of vitamin D" | Food quantities are nutrition; supplement amounts are dosage |
| "Three sets of ten" | "Three times a day" (of a substance) | Exercise volume isn't dosage |
| "IBS is a condition where…" | "You have IBS" | Explaining a condition ≠ diagnosing the reader |
| "Usually resolves in 7–10 days" | "This will clear it up" | Prognosis ≠ treatment promise |
| A cited study whose title names a drug | The body naming a drug | Sources may mention drugs; prose may not |
| "Worth mentioning to your doctor" | "No need to see anyone" | Always toward care, never away |
| "Cool the burn under cool running water for 20 minutes" | "Put honey on the burn to heal it" | Official first-aid steps are allowed; remedies that treat are not |
| "Use their own prescribed auto-injector if they have one" | "Give them adrenaline" / "Chew a 300mg aspirin" | First aid may point to the person's own emergency medicine, never name or dose it |

---

## 5. Required structure

Enforced in the Gemini `responseSchema` — the model cannot return an article without these, so they
cannot quietly go missing at post 800.

| Field | Requirement |
|---|---|
| `title` | ≤70 characters |
| `key_points` | 3–5 items |
| `when_to_seek_care` | **Non-empty.** Every article, including pure lifestyle ones. |
| `sources` | ≥3, each with a live URL and publisher |
| `disclaimer` | Rendered on every page; not model-generated |

---

## 6. Voice

Plain, calm, second person. Short sentences. No hype, no fear.

Say "often" and "usually", never "always" and "never" — hedging is accurate here, not weak. Don't
open with a scare ("Could this be a sign of something serious?"). Don't sell. Don't use exclamation
marks. Assume the reader is anxious and looking something up at midnight, and write to lower the
temperature rather than raise it.

---

## 7. Attribution

Articles carry no per-article AI label (owner's decision, 2026-09-27); the site-wide disclosure
lives on the Medical Disclaimer page. A reviewed article shows **"Reviewed by [name]"** with the
review date; an unreviewed one shows no attribution. What it must never do is imply a review that
didn't happen, or credit a person who didn't write or review it.

**Human review is not guaranteed** (owner's decision, 2026-09-27: the first 50 articles were
published on passing the automated checks — sources, dedup, scope guard — without a human read).
The Editorial Team, About and Medical Disclaimer pages say so. AI-drafted posts carry the house
byline, "The Body Cue Editorial Team". If every article is human-approved again, those pages may
say so again.
