import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

type PageMetadata = {
  title: string;
  description: string;
  /** Path from the site root, e.g. "/posts/slug". Becomes the canonical URL. */
  path: string;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  section?: string;
  noindex?: boolean;
  /** Path of the social image — an /og/* route. Defaults to the site-wide card. */
  image?: string;
};

/**
 * Title, description, canonical, Open Graph and Twitter for one page. (MVP.md M6.1)
 * Images are explicit /og/* routes rather than the opengraph-image file convention, whose URLs
 * carry a build hash that structured data can't reference.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  noindex,
  image = "/og/default",
}: PageMetadata): Metadata {
  const images = [{ url: image, width: 1200, height: 630, alt: title }];
  const url = new URL(path, siteConfig.url).toString();
  const openGraph: NonNullable<Metadata["openGraph"]> =
    type === "article"
      ? {
          type: "article",
          ...(publishedTime ? { publishedTime } : {}),
          ...(modifiedTime ? { modifiedTime } : {}),
          ...(section ? { section } : {}),
        }
      : { type: "website" };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...openGraph,
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_GB",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
