import { categoryTint, tintPartner } from "@/config/categories";

type Props = {
  category: string;
  className?: string;
  ratio?: "16/10" | "16/9" | "4/1" | "1/1" | "fill";
};

/**
 * Shown only until a post has its real cover photo: a soft two-tint gradient in the topic's
 * colours. Deliberately plain — no drawn shapes — so it reads as "photo coming", not as art.
 */
export function CoverPlaceholder({ category, className = "", ratio = "16/10" }: Props) {
  const tint = categoryTint(category);
  const partner = tintPartner[tint];
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden ${className}`}
      style={{
        ...(ratio === "fill" ? {} : { aspectRatio: ratio }),
        background: `radial-gradient(120% 90% at 15% 10%, var(--tint-${tint}) 0%, transparent 60%), radial-gradient(110% 100% at 90% 95%, var(--tint-${partner}) 0%, transparent 65%), var(--surface-subtle)`,
      }}
    />
  );
}
