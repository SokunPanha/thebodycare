import { renderOgImage } from "@/lib/seo/og";

// The site-wide social image: home, standing pages, search.
export const dynamic = "force-static";

export function GET() {
  return renderOgImage({
    eyebrow: "Everyday health, explained",
    title: "Understand what your body is telling you.",
  });
}
