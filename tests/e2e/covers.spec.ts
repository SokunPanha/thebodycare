import { solidPng } from "../helpers/png";
import { deletePosts, insertPost } from "../integration/local-supabase";
import { expect, signIn, test } from "./fixtures";

test("upload a cover in the editor — it replaces the generated art on the live page", async ({
  page,
  staff,
}) => {
  const post = await insertPost("published", { sourceCount: 3 });
  try {
    await signIn(page, staff);
    await page.goto(`/admin/posts/${post.id}/edit`);

    // No MINIMAX_API_KEY in the local env: the AI button is present but disabled.
    await expect(page.getByRole("button", { name: "Generate with AI" })).toBeDisabled();

    // Too small is refused with a reason.
    await page.getByLabel(/^Image/).setInputFiles({
      name: "small.png",
      mimeType: "image/png",
      buffer: solidPng(400, 250),
    });
    await page.getByLabel(/^Alt text/).fill("A calm bedroom at dawn");
    await page.getByRole("button", { name: "Upload cover" }).click();
    await expect(page.getByText(/at least 1200px wide/)).toBeVisible();
    // A rejected upload keeps what the editor typed.
    await expect(page.getByLabel(/^Alt text/)).toHaveValue("A calm bedroom at dawn");

    await page.getByLabel(/^Image/).setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: solidPng(1600, 1000),
    });
    await page.getByLabel(/^Alt text/).fill("A calm bedroom at dawn");
    await page.getByRole("button", { name: "Upload cover" }).click();
    await expect(page.getByText("Uploaded", { exact: true })).toBeVisible();

    await page.context().clearCookies();
    await page.goto(`/posts/${post.slug}`);
    const cover = page.getByRole("img", { name: "A calm bedroom at dawn" });
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute("src", /_next\/image\?url=.*covers/);

    await signIn(page, staff);
    await page.goto(`/admin/posts/${post.id}/edit`);
    await page.getByRole("button", { name: "Remove cover" }).click();
    await expect(page.getByText(/No cover yet/)).toBeVisible();
  } finally {
    await deletePosts([post.id]);
  }
});
