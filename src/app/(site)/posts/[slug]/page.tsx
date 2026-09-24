import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout";
import { ArticleView, getArticle, getPublishedPost, listPublishedSlugs } from "@/features/posts";

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
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <Container>
      <ArticleView article={article} />
    </Container>
  );
}
