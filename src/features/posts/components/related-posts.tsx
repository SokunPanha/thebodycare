import type { PostListing } from "../queries";
import { PostCard } from "./post-card";

export function RelatedPosts({ posts }: { posts: PostListing[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related">
      <h2 id="related" className="text-2xl">
        Keep reading
      </h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
