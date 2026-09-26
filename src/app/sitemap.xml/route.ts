import { siteConfig } from "@/config/site";
import { countPublishedPosts, SITEMAP_CHUNK } from "@/features/posts";

// The sitemap index. Next.js splits sitemaps (generateSitemaps) but doesn't write the index that
// ties them together, so this route does. Submit this URL to Search Console. (MVP.md M6.3)
export const revalidate = 3600;

export async function GET() {
  const chunks = Math.max(1, Math.ceil((await countPublishedPosts()) / SITEMAP_CHUNK));
  const sitemaps = [
    `${siteConfig.url}/category/sitemap.xml`,
    ...Array.from({ length: chunks }, (_, id) => `${siteConfig.url}/posts/sitemap/${id}.xml`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join("\n")}
</sitemapindex>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
