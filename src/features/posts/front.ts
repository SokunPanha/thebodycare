import type { PostListing } from "./queries";

type Topic = { slug: string; name: string };

/**
 * The home page's per-topic rows: up to `perTopic` posts for each topic, newest first, in nav
 * order, skipping posts already shown above (`exclude`) and topics with nothing left to show.
 * `posts` is the latest published pool — at a few posts a day, 60 covers every active topic.
 */
export function latestByTopic(
  posts: PostListing[],
  topics: Topic[],
  { perTopic = 3, exclude = [] }: { perTopic?: number; exclude?: PostListing[] } = {},
): { topic: Topic; posts: PostListing[] }[] {
  const shown = new Set(exclude.map((p) => p.id));
  return topics
    .map((topic) => ({
      topic,
      posts: posts
        .filter((p) => p.category.slug === topic.slug && !shown.has(p.id))
        .slice(0, perTopic),
    }))
    .filter((row) => row.posts.length > 0);
}
