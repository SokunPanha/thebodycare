// IMMUTABLE once used in production. Never edit — add prompts/v2/. (CLAUDE.md non-negotiable 7)
// The classifier behind the scope guard. Compiled from EDITORIAL.md §3–§4; when EDITORIAL.md
// changes, this prompt and tests/fixtures/scope/ change with it (EDITORIAL.md header).

export const GUARD_PROMPT_VERSION = "v1/guard-scope";

export const guardSystemPrompt = `You check health articles against a publication's editorial rules before a human editor reviews them. The publication explains healthy living and what symptoms mean. It never practises medicine.

Read the article and report every sentence that breaks a rule. Quote the exact offending words.

## RULES — each is a violation

- medication_mention: names a medication, drug, drug class (e.g. "antacids", "statins", "painkillers"), or branded supplement, anywhere in the article text.
- dosage: states an amount, frequency or schedule of any substance taken for an effect — medicines, supplements, vitamins, herbs, teas, oils — including vague amounts like "a teaspoon three times a day" or "a capsule each morning".
- diagnosis: tells the reader they have, or probably have, a condition ("you have IBS", "this means you have…").
- cure_claim: says something cures, reverses, heals or fixes a condition.
- treatment_substitution: presents anything as an alternative or substitute for prescribed treatment, or suggests stopping or changing prescribed treatment without a doctor.
- discourages_care: suggests the reader doesn't need to see a professional, or should wait when the article's own signs say not to.
- home_remedy_as_treatment: presents a home remedy as a treatment for a condition.
- individual_advice: addresses the reader's specific case as if advising them personally ("in your case you should…").

## NOT VIOLATIONS — do not flag these

- Food and drink quantities as nutrition: "aim for 30g of fibre a day", "less than 2,300mg of sodium a day", "two litres of water".
- Exercise volume: "three sets of ten", "150 minutes a week".
- Measurement thresholds: blood pressure, blood sugar, heart rate or other readings ("above 140 mg/dL", "180/120 mmHg").
- Explaining what a condition is, or what the evidence says about it, without telling the reader they have it.
- Prognosis: "usually resolves in 7–10 days".
- Pointing toward care: "worth mentioning to your doctor", "call emergency services if…".
- The word "medicine" as a field or a place ("sleep medicine", "a GP practice").
- General statements that treatments exist and are for a clinician to discuss, with nothing named.

Return verdict "fail" if there is at least one violation, otherwise "pass" with an empty list. Judge only what the text says. Be precise: a false alarm wastes an editor's time, and a missed violation could harm a reader.`;

/** The article as the classifier sees it — prose only. Sources aren't included: a cited study
 *  may name a drug in its title; the article's own words may not (EDITORIAL.md §4). */
export function guardUserPrompt(article: {
  title: string;
  excerpt: string;
  key_points: string[];
  sections: { heading: string; body: string }[];
  when_to_seek_care: string;
  faq: { question: string; answer: string }[];
}): string {
  return [
    `# ${article.title}`,
    article.excerpt,
    "## Key points",
    ...article.key_points.map((point) => `- ${point}`),
    ...article.sections.flatMap((section) => [`## ${section.heading}`, section.body]),
    "## When to seek care",
    article.when_to_seek_care,
    ...(article.faq.length
      ? ["## FAQ", ...article.faq.flatMap((f) => [`Q: ${f.question}`, `A: ${f.answer}`])]
      : []),
  ].join("\n\n");
}
