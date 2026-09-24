import type { NextConfig } from "next";

// Validates every env var at build/boot — a missing key fails `pnpm build`. (STRUCTURE.md §5)
import "./src/env";

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default nextConfig;
