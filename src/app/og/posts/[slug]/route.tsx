import { getPublishedPost } from "@/features/posts";
import { renderOgImage } from "@/lib/seo/og";
import { coverUrl } from "@/lib/supabase/storage";

// A stable URL (unlike the file convention's hashed one), so JSON-LD can reference it. The page
// links it with ?v=<updated_at>: social platforms cache images hard, and an edited headline
// should get a fresh card.
export async function GET(_request: Request, { params }: RouteContext<"/og/posts/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return new Response("Not found", { status: 404 });

  return renderOgImage({
    eyebrow: post.category.name,
    title: post.title,
    cover: post.cover_path ? coverUrl(post.cover_path) : null,
  });
}
