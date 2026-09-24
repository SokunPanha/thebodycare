// Adult silent reading of non-fiction runs ~200–250 wpm; 225 errs slightly long, which is kinder
// than promising "3 min" for a 4-minute read.
const WORDS_PER_MINUTE = 225;

/** Minutes to read a markdown body, counting words only — not syntax, URLs or table rules. */
export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/<[^>]+>/g, " ") // stray html
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, " ") // table separator rows
    .replace(/[#>*_`|~-]/g, " "); // remaining markdown punctuation

  const words = text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
