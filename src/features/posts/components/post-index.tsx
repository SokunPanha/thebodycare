import type { PostListing } from "../queries";
import { PostRow } from "./post-row";

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
    return <p className="rounded-lg bg-surface p-8 text-center text-ink-muted">{empty}</p>;
  }

  return (
    <ol className="space-y-1">
      {posts.map((post) => (
        <li key={post.id}>
          <PostRow post={post} showCategory={showCategory} />
        </li>
      ))}
    </ol>
  );
}
