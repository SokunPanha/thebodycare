import Link from "next/link";

import { Container } from "@/components/layout";

export default function NotFound() {
  return (
    <Container className="py-24">
      <div className="max-w-(--measure)">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-2xl md:text-3xl">We couldn&rsquo;t find that page</h1>
        <p className="mt-4 text-lg text-ink-muted">
          It may have moved, or the address may be mistyped.{" "}
          <Link href="/">Go to the home page</Link>.
        </p>
      </div>
    </Container>
  );
}
