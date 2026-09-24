import { expect, signIn, test } from "./fixtures";

// TESTING.md §5 — E3 is the core product loop. If only one E2E test survives, it's that one.

test("E3: approve a draft — 404 before, live after", async ({ page, staff, draft }) => {
  const before = await page.goto(`/posts/${draft.slug}`);
  expect(before?.status()).toBe(404);

  await signIn(page, staff);
  await page.getByRole("link", { name: "Review queue" }).click();
  await page.getByRole("link", { name: draft.title }).click();
  await expect(page.getByText("Preview — as readers will see it")).toBeVisible();
  await page.getByRole("button", { name: "Approve and publish" }).click();

  await expect(page.getByRole("status")).toContainText("Published");
  await page.getByRole("link", { name: "View it live →" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(draft.title);
  await expect(page.getByText(/reviewed by/)).toBeVisible();

  // A fresh, signed-out visitor sees it too — the cached 404 was revalidated.
  await page.context().clearCookies();
  const after = await page.goto(`/posts/${draft.slug}`);
  expect(after?.status()).toBe(200);
});

test("E4: reject a draft — leaves the queue, stays unpublished", async ({ page, staff, draft }) => {
  await signIn(page, staff);
  await page.goto(`/admin/review/${draft.id}`);
  await page.getByLabel("Reject — reason").fill("Names a medication");
  await page.getByRole("button", { name: "Reject", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Rejected");
  await expect(page.getByRole("link", { name: draft.title })).toHaveCount(0);

  await page.context().clearCookies();
  const response = await page.goto(`/posts/${draft.slug}`);
  expect(response?.status()).toBe(404);
});

test("E5: signed-out /admin is a 404 with no admin content", async ({ page, draft }) => {
  for (const path of ["/admin", "/admin/review", `/admin/review/${draft.id}`]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    const html = await response!.text();
    expect(html, path).not.toContain(draft.title);
    expect(html, path).not.toContain("Review queue");
    expect(html, path).not.toMatch(/<title>[^<]*Admin/);
  }
});

test("edit a draft: validation errors inline, then save", async ({ page, staff, draft }) => {
  await signIn(page, staff);
  await page.goto(`/admin/posts/${draft.id}/edit`);

  await page.getByLabel("Headline").fill("x".repeat(71));
  await page.getByLabel("Key points").fill("Only one");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("70 characters at most")).toBeVisible();
  await expect(page.getByText("At least 3 key points")).toBeVisible();

  await page.getByLabel("Headline").fill("An edited headline");
  await page.getByLabel("Key points").fill("One\nTwo\nThree");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(`/admin/review/${draft.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("An edited headline");
});
