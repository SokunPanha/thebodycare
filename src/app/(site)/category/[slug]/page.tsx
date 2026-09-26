import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listByCategory } from "@/features/posts";
import { pageMetadata } from "@/lib/seo/metadata";
import { getCategoryBySlug, listCategories } from "@/features/taxonomy";

import { CategoryListing } from "./category-listing";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return pageMetadata({
    title: category.name,
    description: category.description,
    image: `/og/category/${category.slug}`,
    path: `/category/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = await listByCategory(category.id);
  return <CategoryListing category={category} page={page} />;
}
