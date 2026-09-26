import { service } from "../integration/local-supabase";
import { expect, signIn, test } from "./fixtures";

// M5.6: open cells per category visible; admins steer, editors look.

test("admin retires a cell and reprioritises another; coverage updates", async ({
  page,
  admin,
}) => {
  const db = service();
  const { data: cells } = await db
    .from("topic_matrix")
    .select("id, target_query, priority")
    .eq("status", "open")
    // The page's own order (priority, query), so the cell is on page 1.
    .order("priority")
    .order("target_query")
    .limit(1);
  const cell = cells![0]!;
  try {
    await signIn(page, admin);
    await page.getByRole("link", { name: "Topics" }).click();
    await expect(page.getByRole("heading", { name: "Topic matrix" })).toBeVisible();
    const openBefore = await page
      .getByText("Open cells")
      .locator("..")
      .locator("p")
      .nth(1)
      .textContent();

    const row = page.getByRole("row", { name: new RegExp(cell.target_query) });
    await row.getByRole("button", { name: "Retire" }).click();
    await expect(row.getByRole("button", { name: "Reopen" })).toBeVisible();
    const openAfter = await page
      .getByText("Open cells")
      .locator("..")
      .locator("p")
      .nth(1)
      .textContent();
    expect(Number(openAfter)).toBe(Number(openBefore) - 1);

    await row.getByLabel("Priority (1 is first)").selectOption("5");
    await expect
      .poll(
        async () =>
          (await db.from("topic_matrix").select("priority").eq("id", cell.id).single()).data
            ?.priority,
      )
      .toBe(5);
  } finally {
    await db
      .from("topic_matrix")
      .update({ status: "open", priority: cell.priority })
      .eq("id", cell.id);
  }
});

test("editor sees the matrix read-only", async ({ page, staff }) => {
  await signIn(page, staff);
  await page.goto("/admin/topics");
  await expect(page.getByText("Only admins can change priorities")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retire" })).toHaveCount(0);
});
