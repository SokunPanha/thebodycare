import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff, staffMetadata } from "@/features/auth";
import { getPostForStaff, PostEditForm, updatePost } from "@/features/posts";
import { listCategories } from "@/features/taxonomy";

export const generateMetadata = () => staffMetadata("Edit");

export default async function EditPostPage({
  params,
  searchParams,
}: PageProps<"/admin/posts/[id]/edit">) {
  await requireStaff(); // page-level guard — see ../../../layout.tsx
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [post, categories] = await Promise.all([getPostForStaff(id), listCategories()]);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl">Edit</h1>
        <div className="flex gap-4 text-sm">
          {post.status === "published" ? (
            <Link href={`/posts/${post.slug}`}>View live</Link>
          ) : (
            <Link href={`/admin/review/${post.id}`}>Back to review</Link>
          )}
        </div>
      </div>
      {query.saved && (
        <p role="status" className="rounded bg-primary-wash p-4 text-sm font-semibold">
          Saved. The live page has been updated.
        </p>
      )}
      <PostEditForm values={post} categories={categories} action={updatePost.bind(null, post.id)} />
    </div>
  );
}
