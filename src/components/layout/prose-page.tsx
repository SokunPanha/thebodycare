import type { ReactNode } from "react";

import { formatDate } from "@/lib/utils/format-date";

import { Container } from "./container";

// Static text pages: About, Contact, and the legal set.
export function ProsePage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <Container className="pt-12">
      <article className="max-w-(--measure)">
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {updatedAt && (
          <p className="tabular mt-3 text-xs text-ink-muted">
            Last updated {formatDate(updatedAt)}
          </p>
        )}
        <div className="prose mt-8">{children}</div>
      </article>
    </Container>
  );
}
