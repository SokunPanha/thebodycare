import Image from "next/image";

import { CoverPlaceholder } from "@/components/art";
import { coverUrl } from "@/lib/supabase/storage";

type CoverFields = {
  slug: string;
  category: { slug: string };
  cover_path: string | null;
  cover_alt: string | null;
  cover_width: number | null;
  cover_height: number | null;
};

type Props = {
  post: CoverFields;
  ratio: "16/10" | "16/9" | "4/1" | "1/1" | "fill";
  /** Responsive `sizes` for the optimizer — the rendered width at each breakpoint. */
  sizes: string;
  className?: string;
  /** Only the one above-the-fold, likely-LCP image: the article's cover or the home lead. */
  eager?: boolean;
  /**
   * In cards the title beside the image already names the link, so the image is decorative
   * (alt=""). On the article page it carries its real alt text.
   */
  decorative?: boolean;
};

/**
 * The post's cover photo, or a plain tinted placeholder until it has one. The box has a fixed aspect
 * ratio either way, so swapping one for the other never shifts layout. (CLS must be zero.)
 */
export function PostCover({ post, ratio, sizes, className = "", eager, decorative }: Props) {
  if (!post.cover_path || !post.cover_width || !post.cover_height) {
    return <CoverPlaceholder category={post.category.slug} ratio={ratio} className={className} />;
  }

  return (
    <div
      // "fill" boxes are positioned by the caller (absolute inset-0 in a feature card); anything
      // else needs `relative` so next/image's fill has a positioned parent.
      className={`overflow-hidden bg-surface-subtle ${ratio === "fill" ? "" : "relative"} ${className}`}
      style={ratio === "fill" ? undefined : { aspectRatio: ratio }}
    >
      <Image
        src={coverUrl(post.cover_path)}
        alt={decorative ? "" : (post.cover_alt ?? "")}
        fill
        sizes={sizes}
        quality={75}
        className="object-cover"
        {...(eager ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
      />
    </div>
  );
}
