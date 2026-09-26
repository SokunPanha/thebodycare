import type { Metadata } from "next";
import Link from "next/link";

import { Container, SearchForm } from "@/components/layout";
import { JsonLd } from "@/components/seo-json-ld";
import { siteConfig } from "@/config/site";
import { FeatureCard, listPublished, PostCard, PostIndex } from "@/features/posts";
import { listCategoriesWithCounts, TopicGrid } from "@/features/taxonomy";
import { websiteGraph } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 600;

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.name, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.name} — understand what your body is telling you` },
};

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
  const [lead, feature, ...rest] = items;
  const grid = rest.slice(0, 4);
  const more = rest.slice(4, 10);

  return (
    <>
      <JsonLd data={websiteGraph()} />

      {/* Hero: soft blobs behind, search front and centre, the newest story beside it. */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-tint-sage opacity-80 blur-3xl" />
          <div className="absolute top-10 right-[-6rem] size-[26rem] rounded-full bg-tint-peach opacity-80 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-1/3 size-[24rem] rounded-full bg-tint-sky opacity-70 blur-3xl" />
        </div>
        <Container className="relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="inline-block rounded-full bg-surface/80 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
              Everyday health, explained
            </p>
            <h1 className="mt-5 text-3xl md:text-4xl">Understand what your body is telling you.</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">{siteConfig.description}</p>
            <div className="mt-8 max-w-xl">
              <SearchForm size="lg" />
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="inline-block rounded-full bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink no-underline shadow-sm hover:bg-surface hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {lead ? (
            <FeatureCard post={lead} eager size="xl" className="h-[26rem] md:h-[30rem]" />
          ) : (
            <p className="rounded-xl bg-surface p-10 text-lg text-ink-muted shadow-sm">
              New articles are on the way.
            </p>
          )}
        </Container>
      </section>

      <Container className="space-y-20 pt-6">
        {(feature || grid.length > 0) && (
          <section aria-labelledby="latest">
            <div className="flex items-end justify-between gap-4">
              <h2 id="latest" className="text-2xl">
                Latest reads
              </h2>
              <Link href="/search" className="text-sm font-semibold no-underline">
                Search all articles →
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {feature && <FeatureCard post={feature} className="md:col-span-2 lg:row-span-2" />}
              {grid.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="topics">
          <h2 id="topics" className="text-2xl">
            Explore by topic
          </h2>
          <p className="mt-2 text-ink-muted">
            Plain-language guides, grouped the way you&rsquo;d look for them.
          </p>
          <div className="mt-8">
            <TopicGrid categories={categories} />
          </div>
        </section>

        {more.length > 0 && (
          <section aria-labelledby="more" className="max-w-4xl">
            <h2 id="more" className="text-2xl">
              More to read
            </h2>
            <div className="mt-6">
              <PostIndex posts={more} />
            </div>
          </section>
        )}

        <section aria-labelledby="how" className="rounded-xl bg-primary-wash p-8 md:p-12">
          <h2 id="how" className="text-2xl">
            How we write
          </h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {principles.map((principle, i) => (
              <li key={principle.title}>
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-surface font-display text-lg font-semibold text-primary shadow-sm"
                >
                  {i + 1}
                </span>
                <p className="mt-4 font-semibold">{principle.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{principle.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm font-semibold">
            <Link href="/about">How articles are made →</Link>
          </p>
        </section>
      </Container>
    </>
  );
}
