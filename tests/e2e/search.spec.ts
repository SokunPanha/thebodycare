import { expect, test } from "@playwright/test";

import { deletePosts, insertPost, service } from "../integration/local-supabase";

test("search from the header finds a published post and opens it", async ({ page }) => {
  const post = await insertPost("published", { sourceCount: 3 });
  await service()
    .from("posts")
    .update({ title: "Quokka breathing rhythm explained" })
    .eq("id", post.id);
  try {
    await page.setViewportSize({ width: 1366, height: 800 });
    await page.goto("/");
    // The home page has two search boxes (header and hero); use the header's.
    const box = page.getByRole("banner").getByRole("searchbox", { name: "Search articles" });
    await box.fill("quokka breathing");
    await box.press("Enter");

    await expect(page).toHaveURL(/\/search\?q=quokka\+breathing/);
    await expect(page.getByRole("status")).toContainText("1 article matches");
    await page.getByRole("link", { name: /Quokka breathing rhythm explained/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Quokka breathing rhythm explained",
    );
  } finally {
    await deletePosts([post.id]);
  }
});

test("search results are noindex, and a no-match query says so", async ({ page }) => {
  await page.goto("/search?q=zzzqqqnomatch");
  await expect(page.getByRole("status")).toContainText("No articles match");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("phone: the header search icon opens the search page, focused", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL("/search");
  await expect(page.getByRole("searchbox", { name: "Search articles" })).toBeFocused();
});
