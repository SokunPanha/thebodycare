import type { Metadata } from "next";

import { ProsePage } from "@/components/layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${siteConfig.name}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = siteConfig.contactEmail;

  return (
    <ProsePage title="Contact">
      <p>
        Email us at <a href={`mailto:${email}`}>{email}</a>. We read everything and aim to reply
        within a few working days.
      </p>

      <h2>We can&rsquo;t give personal medical advice</h2>
      <p>
        We&rsquo;re not able to answer questions about your own symptoms or treatment. Please speak
        to a doctor, pharmacist, or other qualified health professional.{" "}
        <strong>In an emergency, call your local emergency number.</strong>
      </p>

      <h2>Reporting an error</h2>
      <p>
        Tell us which article, what you think is wrong, and — if you can — a source. Anything that
        could affect someone&rsquo;s safety is taken down while we check it.
      </p>

      <h2>Your data</h2>
      <p>
        To access, correct or delete personal data we hold about you, email the address above with
        &ldquo;Data request&rdquo; in the subject. We&rsquo;ll respond within one month. See our
        privacy policy for details.
      </p>
    </ProsePage>
  );
}
