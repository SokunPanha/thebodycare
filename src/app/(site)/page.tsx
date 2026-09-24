import Link from "next/link";

import { CoverArt } from "@/components/art";
import { Container } from "@/components/layout";
import { siteConfig } from "@/config/site";
import { LeadPost, listPublished, PostCard, PostIndex } from "@/features/posts";
import { listCategoriesWithCounts, TopicGrid } from "@/features/taxonomy";

export const revalidate = 600;

const GRID_SIZE = 6;

const principles = [
  {
    title: "Every claim is sourced",
    body: "Articles list the health services and research they rely on, so you can check them.",
  },
  {
    title: "Always: when to seek care",
    body: "Every article ends with the specific signs that mean it's time to talk to a professional.",
  },
  {
    title: "No pills, no diagnoses",
    body: "We explain what's happening and what helps day to day. Treatment belongs with your clinician.",
  },
] as const;

export default async function HomePage() {
  const [{ items }, categories] = await Promise.all([listPublished(), listCategoriesWithCounts()]);
  const [lead, ...rest] = items;
  const grid = rest.slice(0, GRID_SIZE);
  const more = rest.slice(GRID_SIZE);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow">Everyday health, explained</p>
            <h1 className="mt-3 text-3xl md:text-4xl">Understand what your body is telling you.</h1>
            <p className="mt-4 max-w-(--measure) text-lg text-ink-muted">
              {siteConfig.description}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="inline-block rounded-full border border-line-strong px-4 py-1.5 text-sm font-semibold text-ink no-underline hover:border-primary hover:bg-primary-wash hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden grid-cols-2 gap-3 sm:grid" aria-hidden="true">
            {(["sleep", "digestion", "movement", "mind"] as const).map((motif, i) => (
              <CoverArt
                key={motif}
                seed={`hero-${motif}`}
                category={motif}
                ratio="16/10"
                className={`rounded ${i % 2 ? "translate-y-6" : ""}`}
              />
            ))}
          </div>
        </Container>
      </section>

      <Container className="space-y-16 pt-12">
        {lead ? (
          <LeadPost post={lead} />
        ) : (
          <p className="text-lg text-ink-muted">New articles are on the way.</p>
        )}

        {grid.length > 0 && (
          <section aria-labelledby="latest">
            <h2 id="latest" className="text-xl">
              Latest articles
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {more.length > 0 && (
          <section aria-labelledby="more" className="max-w-(--measure)">
            <h2 id="more" className="text-xl">
              More to read
            </h2>
            <div className="mt-4">
              <PostIndex posts={more} />
            </div>
          </section>
        )}

        <section aria-labelledby="topics">
          <h2 id="topics" className="text-xl">
            Browse by topic
          </h2>
          <div className="mt-6">
            <TopicGrid categories={categories} />
          </div>
        </section>

        <section aria-labelledby="how" className="rounded bg-primary-wash p-6 md:p-10">
          <h2 id="how" className="text-xl">
            How we write
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {principles.map((principle) => (
              <li key={principle.title}>
                <p className="font-semibold">{principle.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{principle.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm">
            <Link href="/about">How articles are made →</Link>
          </p>
        </section>
      </Container>
    </>
  );
}
