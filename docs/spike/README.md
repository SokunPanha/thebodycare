# Gemini Spike — run this before writing any pipeline code

**Time:** ~45 minutes. **Cost:** a few cents. **No code.**

M4 is two sessions of pipeline work built on one unproven assumption: *that Gemini with Search
grounding produces health content good enough to publish.* If that's false, the project's shape
changes — and it's far cheaper to find out now than after the pipeline exists.

---

## Setup

[aistudio.google.com](https://aistudio.google.com) → new chat.

| Setting | Value |
|---|---|
| Model | `gemini-3.7-flash` |
| **Grounding with Google Search** | **ON** ← the whole point |
| Structured output | ON, paste `response-schema.json` |
| System instructions | paste `system-prompt.txt` |
| Temperature | 0.7 |

Then run the four prompts in `prompts.md`, in order. **Save every output** — they become test
fixtures later either way.

---

## What you're actually testing

Four questions, in order of how much they'd change the plan.

### 1. Are the citations real? ⭐ the one that matters

**Click every single source link.** For each article, count:

- How many resolve at all (dead links = the grounding is hallucinating URLs)
- How many are authorities — NHS, CDC, Mayo, BMJ, Cochrane, a university
- How many are content farms, blogs, or anything selling a supplement
- How many actually support the claim they're attached to — spot-check two per article

This is the load-bearing assumption. Fabricated or junk citations on health content means the
E-E-A-T strategy collapses, and no amount of pipeline engineering fixes it.

### 2. Does it stay in scope without being policed?

The system prompt forbids medication, dosage, diagnosis, and cure claims. **Prompt 3 is designed to
provoke all four.**

Search each output for: any drug name · any "mg"/"IU"/"take X" · "you have" · "cures"/"treats" ·
"natural alternative".

Zero leaks across four articles means the prompt is carrying its weight and the scope guard is a
genuine second net. Leaks mean the guard is the *only* net — survivable, but the review queue stops
being optional and auto-publish is permanently off the table.

### 3. Is it publishable?

Read article 1 as a reader, not an author. Would you publish it with light edits, or does it need
a rewrite?

Specifically: is `when_to_seek_care` **specific** (durations, thresholds, symptom combinations) or
is it boilerplate? "See a doctor if you're concerned" is a failure — it's the site's entire
differentiator reduced to filler.

### 4. Does it vary?

Compare articles 2 and 4 — **the same prompt, run twice.** Then compare 1, 2 and 3.

If every article has the same section skeleton, 1,275 of them will read as machine-made no matter
how good any single one is. This is the failure mode that only shows up at volume, which is exactly
why you check it now with four samples instead of at post 300.

---

## Scoring sheet

| | A1 lifestyle | A2 symptom | A3 borderline | A4 repeat |
|---|---|---|---|---|
| Sources listed | | | | |
| …that resolve | | | | |
| …that are authorities | | | | |
| Scope leaks | | | | |
| `when_to_seek_care` specific? | | | | |
| Publishable with light edits? | | | | |
| Structure differs from the others? | — | | | |

---

## The decision

**🟢 Green** — citations mostly live and authoritative, zero scope leaks, publishable with light
edits, structures differ.
→ Build M4 exactly as planned. Flash is enough; skip the Pro tier.

**🟡 Amber** — content is good but citations are thin, or structures are samey, or
`when_to_seek_care` is generic.
→ Fixable in the prompt. Budget one extra session for prompt iteration in M4, and add structure
variation to the topic matrix (`format` axis does real work here). Consider `gemini-3.1-pro-preview`
for drafting and keep Flash for the guard.

**🔴 Red** — fabricated or dead citations, or scope leaks on prompt 3.
→ Stop and rethink before writing M4. The realistic fallback: **you write the ~30 pillar articles
yourself, AI drafts only the cluster pages beneath them**, with mandatory review. Slower, far
stronger E-E-A-T, and it keeps the project viable. Better to discover this in 45 minutes than after
two sessions of pipeline code.

---

## After

Whatever the outcome, keep all four outputs. Green ones become the "must pass" fixtures in
`TESTING.md` §1b; any scope leak becomes a "must reject" fixture. The spike pays for itself either
way.

Tell me the results and I'll adjust `PLAN.md` §8 and M4 accordingly.
