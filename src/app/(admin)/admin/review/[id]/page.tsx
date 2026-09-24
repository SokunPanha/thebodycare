import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff, staffMetadata } from "@/features/auth";
import {
  approvePost,
  ArticleView,
  getReviewArticle,
  rejectPost,
  ReviewActions,
  ReviewPanel,
} from "@/features/posts";

export const generateMetadata = () => staffMetadata("Review");

export default async function ReviewPage({ params }: PageProps<"/admin/review/[id]">) {
  await requireStaff(); // page-level guard — see ../../layout.tsx
  const { id } = await params;
  const review = await getReviewArticle(id);
  if (!review) notFound();
  const { post, article } = review;

  return (
    <div>
      <Link href="/admin/review" className="text-sm">
        ← Review queue
      </Link>

      <section
        aria-label="Review"
        className="mt-4 grid gap-8 rounded border border-line bg-surface p-6 lg:grid-cols-2"
      >
        <ReviewPanel post={post} />
        {post.status === "in_review" ? (
          <ReviewActions
            postId={post.id}
            approve={approvePost.bind(null, post.id)}
            reject={rejectPost.bind(null, post.id)}
          />
        ) : (
          <p className="text-sm text-ink-muted">
            This post is {post.status.replace("_", " ")}, so it can&rsquo;t be approved or rejected
            here.
          </p>
        )}
      </section>

      <p className="eyebrow mt-12">Preview — as readers will see it</p>
      <div className="border-t border-line">
        <ArticleView article={article} />
      </div>
    </div>
  );
}
