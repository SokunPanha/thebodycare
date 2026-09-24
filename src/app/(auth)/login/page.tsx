import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout";
import { siteConfig } from "@/config/site";
import { getCurrentStaff, LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getCurrentStaff()) redirect("/admin");

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-sm">
        <p className="font-display text-xl font-semibold">{siteConfig.name}</p>
        <h1 className="mt-6 text-xl">Editor sign-in</h1>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
