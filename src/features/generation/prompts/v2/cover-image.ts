// IMMUTABLE. Never edit this file — add prompts/v3/. (CLAUDE.md non-negotiable 7)
//
// v2 (2026-09-26), after reviewing v1's first real outputs: the bloating article's cover showed a
// torso close-up in underwear, with blurred bottles in the background that read as medication.
// v1 excluded "nudity" and "medicine bottles"; that wasn't enough. v2 changes three things:
//   1. People are fully clothed in everyday clothes — no underwear, swimwear or bare torsos.
//   2. The scene is the everyday *context* of the topic, framed wide — never a close-up of a body
//      part or the symptom itself.
//   3. No bottles, jars, tubs, packaging or containers of any kind (they read as medication).

export const COVER_PROMPT_VERSION = "v2/cover-image";

type CoverInput = { title: string; excerpt: string; category: string };

export function coverImagePrompt({ title, excerpt, category }: CoverInput): string {
  return [
    "Editorial lifestyle photograph for a calm, premium health and wellbeing magazine.",
    `The article (${category}): "${title}". ${excerpt}`,
    "Show the everyday setting around this topic — a room, a meal, a walk, a morning routine, a",
    "workspace — framed as a medium or wide shot. If people appear they are ordinary adults of varied",
    "ages and backgrounds, fully clothed in everyday casual clothes, relaxed and at ease.",
    "Style: realistic photography, soft natural daylight, warm and reassuring mood, shallow depth of",
    "field, clean uncluttered composition, gentle muted colours with sage green, cream and warm tones.",
    "Do not include: any text, letters, numbers, logos or watermarks; underwear, swimwear, bare torsos,",
    "nudity or close-ups of bare skin or body parts; bottles, jars, tubs, packaging or containers of any",
    "kind; pills, tablets, capsules, supplements, syringes or any medication; hospitals, clinics, doctors",
    "or medical equipment; blood, wounds or visible illness; pain, distress or fear; famous or",
    "recognisable people.",
  ].join(" ");
}

/** Alt text we can stand behind without seeing the image: what it's for, and that it's AI-made. */
export function coverImageAlt(title: string): string {
  return `AI-generated photo illustrating: ${title}`;
}
