import Link from "next/link";

import { requireStaff, staffMetadata } from "@/features/auth";
import { listReviewQueue, ReviewQueue } from "@/features/posts";

export const generateMetadata = () => staffMetadata("Review queue");

export default async function ReviewQueuePage({ searchParams }: PageProps<"/admin/review">) {
  await requireStaff(); // page-level guard — see ../layout.tsx
  const [items, params] = await Promise.all([listReviewQueue(), searchParams]);
  const published = typeof params.published === "string" ? params.published : null;

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
      {params.rejected && (
        <p role="status" className="rounded bg-surface-subtle p-4 text-sm font-semibold">
          Rejected and archived.
        </p>
      )}

      <ReviewQueue items={items} />
    </div>
  );
}
