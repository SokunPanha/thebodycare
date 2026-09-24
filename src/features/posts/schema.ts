import { z } from "zod";

// posts.faq is jsonb, so the database only guarantees "an array". Parse it before rendering.
export const faqSchema = z.array(
  z.object({ question: z.string().min(1), answer: z.string().min(1) }),
);
