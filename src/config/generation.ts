import "server-only";

import { env } from "@/env";

// Generation knobs are data, not code — all tunable from env. (STRUCTURE.md §6)
export const generationConfig = {
  postsPerDay: env.GENERATION_POSTS_PER_DAY,
  autoPublish: env.GENERATION_AUTO_PUBLISH,
  dedupe: {
    topicThreshold: env.DEDUPE_TOPIC_THRESHOLD,
    bodyThreshold: env.DEDUPE_BODY_THRESHOLD,
  },
  dailyCostCapUsd: env.GENERATION_DAILY_COST_CAP_USD,
  coverCostUsd: env.GENERATION_COVER_COST_USD,
} as const;
