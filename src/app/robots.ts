import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// /search stays crawlable on purpose: it's `noindex, follow`, and a crawler has to fetch the page
// to see that. Disallowing it would hide the noindex and let bare URLs get indexed anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/api/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
