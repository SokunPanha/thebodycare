import type { Route } from "next";
import Link from "next/link";

import { Pagination } from "@/components/layout";
import { requireStaff, staffMetadata } from "@/features/auth";
import {
  BulkCoverButton,
  countPostsWithoutCover,
  generateMissingCovers,
  listPostsForStaff,
  StaffPostList,
  type PostStatus,
} from "@/features/posts";
import { isImageGenerationConfigured } from "@/lib/ai/minimax";

export const generateMetadata = () => staffMetadata("Posts");

// "Generate missing covers" runs up to five image generations in one action.
export const maxDuration = 300;

const filters: { status?: PostStatus; label: string }[] = [
  { label: "All" },
  { status: "published", label: "Published" },
  { status: "in_review", label: "In review" },
  { status: "draft", label: "Drafts" },
  { status: "archived", label: "Archived" },
];

function href(status: PostStatus | undefined, page = 1): Route {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return (query ? `/admin/posts?${query}` : "/admin/posts") as Route;
}

export default async function PostsPage({ searchParams }: PageProps<"/admin/posts">) {
  await requireStaff(); // page-level guard — see ../layout.tsx
  const params = await searchParams;
  const status = filters.find((filter) => filter.status && filter.status === params.status)?.status;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const [posts, missingCovers] = await Promise.all([
    listPostsForStaff({ status, page }),
    countPostsWithoutCover(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Posts</h1>
        <p className="tabular mt-1 text-sm text-ink-muted">
          {posts.total} · most recently changed first
        </p>
      </div>
      <BulkCoverButton
        missing={missingCovers}
        aiEnabled={isImageGenerationConfigured()}
        action={generateMissingCovers}
      />
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = filter.status === status;
          return (
            <Link
              key={filter.label}
              href={href(filter.status)}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm font-semibold no-underline ${
                active
                  ? "border-primary bg-primary-wash text-primary"
                  : "border-line-strong text-ink-muted"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>
      <StaffPostList posts={posts.items} />
      <Pagination page={posts.page} pageCount={posts.pageCount} hrefFor={(n) => href(status, n)} />
    </div>
  );
}
