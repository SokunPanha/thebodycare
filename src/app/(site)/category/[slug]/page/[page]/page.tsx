import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { listByCategory } from "@/features/posts";
import { getCategoryBySlug } from "@/features/taxonomy";

import { CategoryListing } from "../../category-listing";

export const revalidate = 3600;

// Nothing prerendered at build; each page is rendered on first request, then cached (ISR).
export async function generateStaticParams() {
  return [];
}

// "2" → 2. Anything else ("02", "1.5", "abc") is not a page.
function parsePage(value: string): number | null {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]/page/[page]">): Promise<Metadata> {
  const { slug, page } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} — page ${page}`,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}/page/${page}` },
  };
}

export default async function CategoryPagedPage({
  params,
}: PageProps<"/category/[slug]/page/[page]">) {
  const { slug, page: pageParam } = await params;
  const pageNumber = parsePage(pageParam);
  if (pageNumber === null) notFound();
  if (pageNumber === 1) permanentRedirect(`/category/${slug}`);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = await listByCategory(category.id, { page: pageNumber });
  if (pageNumber > page.pageCount) notFound();

  return <CategoryListing category={category} page={page} />;
}
