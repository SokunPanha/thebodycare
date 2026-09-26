import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout";
import { JsonLd } from "@/components/seo-json-ld";
import {
  articleJsonLd,
  articleOgImage,
  ArticleView,
  getArticle,
  getPublishedPost,
  listPublishedSlugs,
} from "@/features/posts";
import { pageMetadata } from "@/lib/seo/metadata";

// Static at build, regenerated hourly; approve/edit will revalidate on demand (M5).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    path: `/posts/${post.slug}`,
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    section: post.category.name,
    image: articleOgImage(post),
  });
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <Container>
      <JsonLd data={articleJsonLd(article)} />
      <ArticleView article={article} />
    </Container>
  );
}
