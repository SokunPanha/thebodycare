import { env } from "@/env";

export const siteConfig = {
  name: "The Body Cue",
  description:
    "Plain-language guides to living well and understanding what your body is signalling.",
  url: env.NEXT_PUBLIC_SITE_URL,

  // ⚠ CONFIRM BEFORE LAUNCH (LEGAL.md §2). Rendered into the privacy policy, terms and contact
  // page. The privacy policy must name a real data controller — "The Body Cue" is not a legal person.
  publisher: {
    legalName: "The Body Cue",
    country: "Cambodia",
  },
  contactEmail: "hello@thebodycue.com",
  // The date the legal pages were last materially changed. Update with the copy.
  legalUpdatedAt: "2026-09-24",
} as const;
