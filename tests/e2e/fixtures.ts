import { randomUUID } from "node:crypto";

import { test as base, type Page } from "@playwright/test";

import { deletePosts, insertPost, service } from "../integration/local-supabase";

type Staff = { email: string; password: string };

/** A throwaway local staff account and an in_review draft, both removed after each test. */
export const test = base.extend<{
  staff: Staff;
  draft: { id: string; slug: string; title: string };
}>({
  staff: async ({}, use) => {
    const db = service();
    const email = `e2e-${randomUUID()}@example.test`;
    const password = randomUUID();
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    await db.from("profiles").update({ role: "editor" }).eq("id", data.user.id);
    await use({ email, password });
    await db.auth.admin.deleteUser(data.user.id);
  },
  draft: async ({}, use) => {
    const post = await insertPost("in_review", { sourceCount: 3, source: "ai" });
    await use({ ...post, title: "Test in_review post" });
    await deletePosts([post.id]);
  },
});

export { expect } from "@playwright/test";

export async function signIn(page: Page, staff: Staff) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(staff.email);
  await page.getByLabel("Password").fill(staff.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/admin");
}
