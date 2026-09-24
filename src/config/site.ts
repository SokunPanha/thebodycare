import { env } from "@/env";

export const siteConfig = {
  name: "The Body Cue",
  description:
    "Plain-language guides to living well and understanding what your body is signalling.",
  url: env.NEXT_PUBLIC_SITE_URL,
} as const;
