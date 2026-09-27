import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));
vi.mock("@/lib/email/smtp", () => ({ notifyRecipients: () => null, sendEmail: vi.fn() }));

const { reviewEmail } = await import("./notify-review");

const site = "https://thebodycue.com";
const draft = (title: string, cover = true) =>
  ({
    status: "success",
    runId: "r",
    postId: `p-${title}`,
    slug: "s",
    title,
    costUsd: 0,
    cover,
  }) as const;

describe("reviewEmail", () => {
  it("sends nothing when no draft was produced", () => {
    expect(reviewEmail([{ status: "skipped", reason: "cap" }], site)).toBeNull();
    expect(
      reviewEmail(
        [{ status: "rejected", runId: "r", step: "guard", reason: "x", costUsd: 0 }],
        site,
      ),
    ).toBeNull();
  });

  it("links each draft and the queue, and counts problems", () => {
    const email = reviewEmail(
      [
        draft("Why am I tired"),
        draft("Knee <pain>", false),
        { status: "failed", runId: "r", step: "draft", error: "boom", costUsd: 0 },
      ],
      site,
    )!;
    expect(email.subject).toBe("2 new drafts to review — The Body Cue");
    expect(email.text).toContain(`${site}/admin/review/p-Why am I tired`);
    expect(email.text).toContain("no cover");
    expect(email.text).toContain("1 other topic(s) were rejected or failed");
    expect(email.html).toContain(`href="${site}/admin/review"`);
    expect(email.html).toContain("Knee &#60;pain&#62;"); // titles are escaped
  });
});
