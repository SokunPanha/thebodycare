import { getCategoryBySlug } from "@/features/taxonomy";
import { renderOgImage } from "@/lib/seo/og";

export async function GET(_request: Request, { params }: RouteContext<"/og/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return new Response("Not found", { status: 404 });

  return renderOgImage({ eyebrow: "Topic", title: `${category.name}: ${category.description}` });
}
