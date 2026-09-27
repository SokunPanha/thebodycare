import Link from "next/link";

import { requireStaff, staffMetadata } from "@/features/auth";
import {
  listReviewQueue,
  publishAllUnreviewed,
  PublishAllForm,
  ReviewQueue,
} from "@/features/posts";

export const generateMetadata = () => staffMetadata("Review queue");

export default async function ReviewQueuePage({ searchParams }: PageProps<"/admin/review">) {
  await requireStaff(); // page-level guard — see ../layout.tsx
  const [items, params] = await Promise.all([listReviewQueue(), searchParams]);
  const published = typeof params.published === "string" ? params.published : null;
  const publishedAll = typeof params.publishedAll === "string" ? params.publishedAll : null;
  // What "Publish all" will take: AI drafts with the three sources publishing requires.
  const ready = items
    .filter((i) => i.source === "ai" && (i.sources[0]?.count ?? 0) >= 3)
    .map((i) => i.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Review queue</h1>
        <p className="tabular mt-1 text-sm text-ink-muted">{items.length} waiting · oldest first</p>
      </div>

      {published && (
        <p role="status" className="rounded bg-primary-wash p-4 text-sm font-semibold">
          Published. <Link href={`/posts/${published}`}>View it live →</Link>
        </p>
      )}
      {publishedAll && (
        <p role="status" className="rounded bg-primary-wash p-4 text-sm font-semibold">
          Published {publishedAll} {publishedAll === "1" ? "article" : "articles"}, unreviewed.{" "}
          <Link href="/">View the site →</Link>
        </p>
      )}
      {ready.length > 0 && <PublishAllForm postIds={ready} action={publishAllUnreviewed} />}
      {params.rejected && (
        <p role="status" className="rounded bg-surface-subtle p-4 text-sm font-semibold">
          Rejected and archived.
        </p>
      )}

      <ReviewQueue items={items} />
    </div>
  );
}
