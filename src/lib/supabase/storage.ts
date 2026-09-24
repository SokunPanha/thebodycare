import { env } from "@/env";

export const COVERS_BUCKET = "covers";

/** Public URL of an object in the covers bucket. Pure string — no client, safe anywhere. */
export function coverUrl(path: string): string {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${COVERS_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
