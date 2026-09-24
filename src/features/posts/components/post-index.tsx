import type { PostListing } from "../queries";
import { PostRow } from "./post-row";

// Single column, hairline-separated — not a card grid. (DESIGN.md §6)
export function PostIndex({
  posts,
  showCategory = true,
  empty = "Nothing published here yet.",
}: {
  posts: PostListing[];
  showCategory?: boolean;
  empty?: string;
}) {
  if (posts.length === 0) {
    return <p className="border-y border-line py-12 text-ink-muted">{empty}</p>;
  }

  return (
    <ol className="divide-y divide-line border-y border-line">
      {posts.map((post) => (
        <li key={post.id}>
          <PostRow post={post} showCategory={showCategory} />
        </li>
      ))}
    </ol>
  );
}
