import type { NextConfig } from "next";

// Validates every env var at build/boot — a missing key fails `pnpm build`. (STRUCTURE.md §5)
import { env } from "./src/env";

const supabase = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabase.hostname);

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    // Cover uploads: the covers bucket allows 5 MB, plus multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    // Covers only, from our own bucket — nothing else can be proxied through the optimizer.
    remotePatterns: [new URL(`${supabase.origin}/storage/v1/object/public/covers/**`)],
    qualities: [75],
    formats: ["image/avif", "image/webp"],
    // Local Supabase serves from 127.0.0.1, which the optimizer blocks by default. Only ever
    // enabled for that case — never against a hosted project.
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
};

export default nextConfig;
