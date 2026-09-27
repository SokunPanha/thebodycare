import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { listCategories } from "@/features/taxonomy";

// /category/sitemap.xml — the home page, topic pages and the standing pages. Listed by /sitemap.xml.
export const revalidate = 3600;

const pages = [
  "/about",
  "/editorial-team",
  "/contact",
  "/medical-disclaimer",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await listCategories();
  return [
    { url: siteConfig.url },
    ...categories.map((category) => ({ url: `${siteConfig.url}/category/${category.slug}` })),
    ...pages.map((path) => ({ url: `${siteConfig.url}${path}` })),
  ];
}
