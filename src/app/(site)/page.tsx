import Link from "next/link";

import { Container } from "@/components/layout";
import { siteConfig } from "@/config/site";
import { LeadPost, listPublished, PostIndex } from "@/features/posts";
import { listCategories } from "@/features/taxonomy";

export const revalidate = 600;

export default async function HomePage() {
  const [{ items }, categories] = await Promise.all([listPublished(), listCategories()]);
  const [lead, ...rest] = items;

  return (
    <Container className="pt-12">
      <h1 className="sr-only">{siteConfig.name}</h1>
      {lead ? (
        <LeadPost post={lead} />
      ) : (
        <p className="max-w-(--measure) text-lg text-ink-muted">{siteConfig.description}</p>
      )}

      <section aria-labelledby="latest" className="mt-16 max-w-(--measure)">
        <h2 id="latest" className="eyebrow">
          Latest
        </h2>
        <div className="mt-2">
          <PostIndex posts={rest} empty="New articles are on the way." />
        </div>
      </section>

      <section aria-labelledby="topics" className="mt-16">
        <h2 id="topics" className="eyebrow">
          Topics
        </h2>
        <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                className="font-display text-lg font-semibold no-underline"
              >
                {category.name}
              </Link>
              <p className="text-sm text-ink-muted">{category.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
