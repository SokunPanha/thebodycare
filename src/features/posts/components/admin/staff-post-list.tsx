import Link from "next/link";

import { formatDate } from "@/lib/utils/format-date";

import type { StaffPostListing } from "../../queries";

const label: Record<StaffPostListing["status"], string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  archived: "Archived",
};

export function StaffPostList({ posts }: { posts: StaffPostListing[] }) {
  if (posts.length === 0) {
    return <p className="border-y border-line py-12 text-ink-muted">No posts here.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="tabular w-full text-left text-sm">
        <thead className="bg-surface-subtle text-xs text-ink-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">
              Title
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Updated
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Published
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              <span className="sr-only">Links</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-primary-wash">
              <td className="px-4 py-3">
                <Link
                  href={
                    post.status === "in_review"
                      ? `/admin/review/${post.id}`
                      : `/admin/posts/${post.id}/edit`
                  }
                  className="font-semibold text-ink"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-ink-muted">{post.category.name}</p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{label[post.status]}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(post.updated_at)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {post.published_at ? formatDate(post.published_at) : "—"}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {post.status === "published" && <Link href={`/posts/${post.slug}`}>View</Link>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
