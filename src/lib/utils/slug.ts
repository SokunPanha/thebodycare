const MAX_LENGTH = 80;

/**
 * "Why You Wake at 3am — & What Helps!" → "why-you-wake-at-3am-what-helps".
 * Accents are folded ("café" → "cafe"); anything else non-alphanumeric becomes a separator.
 * Uniqueness (the -2 suffix) is the database's job: public.unique_post_slug().
 */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return "post";
  if (slug.length <= MAX_LENGTH) return slug;
  // Cut at a word boundary, never mid-word.
  const cut = slug.slice(0, MAX_LENGTH);
  return cut
    .slice(0, cut.lastIndexOf("-") > 20 ? cut.lastIndexOf("-") : MAX_LENGTH)
    .replace(/-+$/, "");
}
