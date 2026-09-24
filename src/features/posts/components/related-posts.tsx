import type { PostListing } from "../queries";
import { PostIndex } from "./post-index";

export function RelatedPosts({ posts }: { posts: PostListing[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related">
      <h2 id="related" className="text-xl">
        Keep reading
      </h2>
      <div className="mt-4">
        <PostIndex posts={posts} />
      </div>
    </section>
  );
}
