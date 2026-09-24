import { formatDate } from "@/lib/utils/format-date";

type Props = { readingTime: number; sourceCount: number; date: string | null };

// read time · source count · date — tabular so the columns line up down an index. (DESIGN.md §7)
export function PostMeta({ readingTime, sourceCount, date }: Props) {
  const parts = [
    `${readingTime} min read`,
    `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`,
    date ? formatDate(date) : null,
  ].filter(Boolean);

  return <p className="tabular text-xs text-ink-muted">{parts.join(" · ")}</p>;
}
