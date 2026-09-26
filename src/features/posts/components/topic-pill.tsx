import { categoryTint, tintBg } from "@/config/categories";

/** The category, as a small tinted pill. Text carries the meaning; the tint is decoration. */
export function TopicPill({
  category,
  className = "",
}: {
  category: { slug: string; name: string };
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-2xs font-semibold tracking-wide text-ink ${tintBg[categoryTint(category.slug)]} ${className}`}
    >
      {category.name}
    </span>
  );
}
