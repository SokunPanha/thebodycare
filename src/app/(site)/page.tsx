import type { Metadata } from "next";
import Link from "next/link";

import { Container, SearchForm } from "@/components/layout";
import { JsonLd } from "@/components/seo-json-ld";
import { siteConfig } from "@/config/site";
import {
  FeatureCard,
  FirstAidBand,
  HeadlineList,
  latestByTopic,
  listPublished,
  TopicSection,
} from "@/features/posts";
import { listCategoriesWithCounts, TopicRow } from "@/features/taxonomy";
import { websiteGraph } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 600;

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.name, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.name} — understand what your body is telling you` },
};

const FIRST_AID_SLUG = "symptoms";

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

// Editorial front page: top stories, topics, first aid, then a row per topic.
export default async function HomePage() {
  const [{ items }, categories] = await Promise.all([
    listPublished({ pageSize: 60 }),
    listCategoriesWithCounts(),
  ]);
  const [lead, ...others] = items;
  const latest = others.slice(0, 4);
  const top = lead ? [lead, ...latest] : [];
  const topics = latestByTopic(items, categories, { exclude: top });
  const firstAid = categories.find((c) => c.slug === FIRST_AID_SLUG);
  const firstAidPosts = items.filter((p) => p.category.slug === FIRST_AID_SLUG).slice(0, 4);

  return (
    <>
      <JsonLd data={websiteGraph()} />

      <Container className="pt-8 md:pt-12">
        {/* Masthead line — compact, so the stories lead. The big search is phones only: from
            768px the header's search box is on screen, and two search boxes read as a mistake. */}
        <div className="flex flex-col gap-5 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Everyday health, explained
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl">Understand what your body is telling you.</h1>
          </div>
          <p className="hidden max-w-sm text-ink-muted md:block">{siteConfig.description}</p>
          <div className="w-full md:hidden">
            <SearchForm size="lg" />
          </div>
        </div>
      </Container>

      <Container className="space-y-16 pt-8 md:space-y-20">
        {lead ? (
          <section
            aria-label="Top stories"
            className={`grid gap-8 ${latest.length ? "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" : ""}`}
          >
            <FeatureCard post={lead} eager size="xl" className="h-[24rem] md:h-[32rem]" />
            {latest.length > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Latest
                </h2>
                <HeadlineList posts={latest} />
              </div>
            )}
          </section>
        ) : (
          <p className="rounded-xl bg-surface p-10 text-lg text-ink-muted shadow-sm">
            New articles are on the way.
          </p>
        )}

        <section aria-labelledby="topics">
          <h2 id="topics" className="sr-only">
            Browse by topic
          </h2>
          <TopicRow categories={categories} />
        </section>

        {firstAid && <FirstAidBand posts={firstAidPosts} topicSlug={firstAid.slug} />}

        {topics.map(({ topic, posts }) => (
          <TopicSection key={topic.slug} topic={topic} posts={posts} />
        ))}

        <section aria-labelledby="how" className="rounded-xl bg-primary-wash p-8 md:p-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="how" className="text-2xl">
              How we write
            </h2>
            <Link href="/editorial-team" className="text-sm font-semibold no-underline">
              How articles are made <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {principles.map((principle, i) => (
              <li key={principle.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface font-display text-lg font-semibold text-primary shadow-sm"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{principle.title}</p>
                  <p className="mt-1 text-sm text-ink-muted">{principle.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
