import { renderLogo } from "@/lib/seo/og";

// The publisher logo referenced by structured data (lib/seo/json-ld.ts). Google wants a raster
// image of at least 112px.
export const dynamic = "force-static";

export function GET() {
  return renderLogo(512);
}
