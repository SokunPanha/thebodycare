import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { countPublishedPosts, listPostsForSitemap, SITEMAP_CHUNK } from "@/features/posts";
import { coverUrl } from "@/lib/supabase/storage";

// /posts/sitemap/0.xml, /posts/sitemap/1.xml … — 10,000 posts each, well under Google's 50,000.
// Listed by the index at /sitemap.xml. (MVP.md M6.3)
export const revalidate = 3600;

export async function generateSitemaps() {
  const chunks = Math.max(1, Math.ceil((await countPublishedPosts()) / SITEMAP_CHUNK));
  return Array.from({ length: chunks }, (_, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const posts = await listPostsForSitemap(Number(await id));
  return posts.map((post) => ({
    url: `${siteConfig.url}/posts/${post.slug}`,
    lastModified: post.updated_at,
    // Image sitemap entries: covers can rank in image search.
    ...(post.cover_path ? { images: [coverUrl(post.cover_path)] } : {}),
  }));
}
