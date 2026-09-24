// IMMUTABLE. Never edit this file — add prompts/v2/. (CLAUDE.md non-negotiable 7)
// Every AI cover records COVER_PROMPT_VERSION in its generation_runs row.

export const COVER_PROMPT_VERSION = "v1/cover-image";

type CoverInput = { title: string; excerpt: string; category: string };

/**
 * A realistic editorial photograph for an article. The exclusions carry EDITORIAL.md into the
 * image: nothing that reads as medication, treatment or diagnosis, and nothing alarming — the
 * reader may be anxious, and the picture should lower the temperature, not raise it.
 * MiniMax has no negative-prompt field, so exclusions are stated in the prompt itself.
 */
export function coverImagePrompt({ title, excerpt, category }: CoverInput): string {
  return [
    "Editorial lifestyle photograph for a health and wellbeing magazine article.",
    `Article topic (${category}): "${title}". ${excerpt}`,
    "Show an everyday, relatable scene that evokes the topic — people, places or objects from daily life.",
    "Style: realistic photography, natural soft daylight, calm and reassuring mood, shallow depth of field,",
    "clean uncluttered composition with space around the subject, gentle muted colours with cool blue-violet tones.",
    "People, if shown, are ordinary adults of varied ages and backgrounds, relaxed, not posed like stock models.",
    "Do not include: any text, letters, numbers, logos or watermarks; pills, tablets, capsules, supplements,",
    "syringes, medicine bottles or any medication; hospital or clinical settings, medical equipment or doctors;",
    "blood, wounds, injury or visible illness; distress, pain or fear; nudity; famous or recognisable people.",
  ].join(" ");
}

/** Alt text we can stand behind without seeing the image: what it's for, and that it's AI-made. */
export function coverImageAlt(title: string): string {
  return `AI-generated photo illustrating: ${title}`;
}
