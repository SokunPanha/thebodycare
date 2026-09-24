// LOCAL ONLY. Creates a staff account on the local Supabase stack and prints a generated password.
//
//   pnpm staff:create you@example.com            → admin
//   pnpm staff:create editor@example.com editor  → editor
//
// Public sign-up is disabled (supabase/config.toml), so this is how local accounts are made.
// Production: invite the user from the Supabase dashboard, then set their role with SQL —
// see CLAUDE.md.

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const [email, role = "admin"] = process.argv.slice(2);
if (!email || !["admin", "editor"].includes(role)) {
  console.error("Usage: pnpm staff:create <email> [admin|editor]");
  process.exit(1);
}

const out = execSync("pnpm exec supabase status -o json", {
  stdio: ["ignore", "pipe", "ignore"],
}).toString();
const status = JSON.parse(out.slice(out.indexOf("{")));
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(status.API_URL)) {
  throw new Error(`Refusing to create accounts on ${status.API_URL}`);
}

const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const password = randomBytes(18).toString("base64url");
const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) throw error;

const { error: roleError } = await db.from("profiles").update({ role }).eq("id", data.user.id);
if (roleError) throw roleError;

console.log(
  `Created ${role} ${email}\nPassword: ${password}\nSign in at http://localhost:3000/login`,
);
