import { env } from "@/env";
import { type Email, notifyRecipients, sendEmail } from "@/lib/email/smtp";

import type { ArticleOutcome } from "./pipeline";

type Drafted = Extract<ArticleOutcome, { status: "success" }>;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The "drafts are waiting for you" email for one cron run, or null when there's nothing to review.
 * Rejections and failures are mentioned as a count only — the dashboard has the detail.
 */
export function reviewEmail(outcomes: ArticleOutcome[], siteUrl: string): Email | null {
  const drafts = outcomes.filter((o): o is Drafted => o.status === "success");
  if (drafts.length === 0) return null;

  const problems = outcomes.filter((o) => o.status === "rejected" || o.status === "failed").length;
  const queue = `${siteUrl}/admin/review`;
  const items = drafts.map((d) => ({
    title: d.title,
    url: `${siteUrl}/admin/review/${d.postId}`,
    note: d.cover ? "" : " (no cover — add one before approving)",
  }));
  const noun = drafts.length === 1 ? "draft" : "drafts";
  const footer = problems > 0 ? `${problems} other topic(s) were rejected or failed this run.` : "";

  return {
    subject: `${drafts.length} new ${noun} to review — The Body Cue`,
    text: [
      `${drafts.length} new ${noun} ${drafts.length === 1 ? "is" : "are"} waiting for your review:`,
      "",
      ...items.map((i) => `- ${i.title}${i.note}\n  ${i.url}`),
      "",
      `Review queue: ${queue}`,
      footer,
    ]
      .filter((line, index, all) => line !== "" || index < all.length - 1)
      .join("\n"),
    html: [
      `<p>${drafts.length} new ${noun} ${drafts.length === 1 ? "is" : "are"} waiting for your review:</p>`,
      "<ul>",
      ...items.map(
        (i) => `<li><a href="${i.url}">${escapeHtml(i.title)}</a>${escapeHtml(i.note)}</li>`,
      ),
      "</ul>",
      `<p><a href="${queue}">Open the review queue</a></p>`,
      footer ? `<p>${footer}</p>` : "",
    ].join("\n"),
  };
}

/**
 * Emails staff about new drafts. Never throws: a mail outage must not fail the cron run
 * (the drafts are saved either way, and the queue is the source of truth).
 */
export async function notifyReview(outcomes: ArticleOutcome[]): Promise<void> {
  const to = notifyRecipients();
  const email = reviewEmail(outcomes, env.NEXT_PUBLIC_SITE_URL);
  if (!to || !email) return;
  try {
    await sendEmail(to, email);
  } catch (error) {
    console.error("[notify-review] email failed:", error);
  }
}
