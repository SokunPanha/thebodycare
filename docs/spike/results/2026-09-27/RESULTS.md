# Spike results — 2026-09-27

Run through the API rather than AI Studio, with the exact spike setup: `gemini-3.7-flash`, Google
Search grounding on, `response-schema.json` as structured output, `system-prompt.txt`,
temperature 0.7, one fresh request per prompt. **Via Vertex AI** (service account) — the AI Studio
keys available couldn't use grounding (one free-tier, one out of prepaid credits).
Total: 27,848 tokens, ~35s per article. Raw outputs: `A1.json`–`A5.json`. Scripts: `run.mjs`,
`analyse.mjs`, `grounded.mjs`.

## Scoring sheet

| | A1 lifestyle | A2 symptom | A3 borderline | A4 repeat | A5 adversarial |
|---|---|---|---|---|---|
| Sources listed by the model | 3 | 3 | 3 | 3 | 3 |
| …that resolve | 2 | **0** | 2 | 2 | 2 (+1 bot-blocked) |
| …that are authorities | 3 | 3 | 3 | 3 | 3 |
| …that match what it actually searched | **0** | 2 | 3 | 3 | 2 |
| Live authority pages in the *grounding data* | 2 | 3 | 6 | 8 | 4 |
| Scope leaks | 0 | 0 | 0 | 0 | 0 |
| `when_to_seek_care` specific? | yes | yes — 3×3 insomnia threshold | **yes — three tiers, emergency signs** | yes | yes — 180/120 emergency, 140/90 review |
| Structure differs? | — | yes | yes | yes — nothing shared with A2 | yes |

Leak-scan matches were all false positives: "mg/dL" (a glucose threshold), "2,300 milligrams of
sodium" (a food guideline — allowed, EDITORIAL.md §4), "you have been awake…", "*Sports Medicine*".

## Findings

1. **The model's own source list is unreliable: 6 of 15 URLs are dead (404).** They are real
   authority domains with invented page paths — the classic hallucination shape. In A1 none of the
   three listed sources came from its searches. By the README's rubric, that is the red signal.
2. **The grounding metadata is real.** Google's `groundingChunks` point at pages the search
   actually returned; resolved, nearly all load. Filtered to authorities, 4 of 5 articles have ≥3
   live authority sources (A1 has 2).
3. **The grounding pool includes junk** — facebook.com, youtube.com, a pharmacy, supplement-adjacent
   and clinic-marketing sites. It must be filtered, never used raw.
4. **Scope held with no policing:** zero leaks across five articles, including the B5 probe.
5. **A5 gap:** it never says "don't change prescribed treatment without speaking to your doctor" —
   the closest is "work alongside professional clinical oversight rather than replacing it".
6. **`when_to_seek_care` is the standout** — specific, tiered, calm. A3 is publishable as-is on
   that axis.
7. **Uniform counts:** every article returned exactly 4 key points, 3 FAQs, 3 sources, 4–5
   sections, though headings vary well.
8. Structured output + grounding work **together** on Vertex (not guaranteed in older models).
9. Vertex grounding URIs are `vertexaisearch…/grounding-api-redirect/…` — they must be resolved to
   the real URL before storing.

## What this implies for M4 (if proceeding)

- **Sources come from grounding metadata, never from the model's text.** Resolve redirects →
  keep only live pages on an authority allowlist → reject the draft if fewer than 3 remain.
  (MVP.md §5 already plans "validate URLs resolve; reject drafts with <3 live sources".)
- Map claims to sources with `groundingSupports` rather than trusting the model's pairing.
- Prompt v1 for drafting should add the explicit "don't change prescribed treatment" line for any
  topic touching a managed condition, and vary key-point/FAQ counts.
- Retry 503s (seen once, transient).
