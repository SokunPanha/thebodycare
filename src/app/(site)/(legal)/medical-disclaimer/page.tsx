import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Medical disclaimer",
  description: `${siteConfig.name} is educational and does not provide medical advice.`,
  path: "/medical-disclaimer",
});

export default function MedicalDisclaimerPage() {
  return (
    <ProsePage title="Medical disclaimer" updatedAt={siteConfig.legalUpdatedAt}>
      <p>
        <strong>
          If you think you may be having a medical emergency, call your local emergency number
          immediately.
        </strong>
      </p>

      <h2>Educational content only</h2>
      <p>
        Everything published on {siteConfig.name} is for general information and education. It is
        not medical advice, and it is not a substitute for advice, diagnosis or treatment from a
        doctor, pharmacist, or other qualified health professional who knows your circumstances.
      </p>

      <h2>No diagnosis, no treatment</h2>
      <p>
        Our articles cannot diagnose you. They do not recommend medications, supplements, doses, or
        treatments, and nothing on this site should be read as doing so. Never start, stop or change
        a medication or treatment because of something you read here.
      </p>

      <h2>Don&rsquo;t delay seeking care</h2>
      <p>
        Never ignore professional advice or put off getting help because of something you read on
        this site. If a symptom is severe, getting worse, unusual for you, or worrying you, speak to
        a health professional. Each article&rsquo;s &ldquo;When to seek care&rdquo; section
        describes common warning signs, but it cannot list every situation in which you should get
        help.
      </p>

      <h2>Accuracy and sources</h2>
      <p>
        We base articles on published sources and review them against our editorial rules, but
        health knowledge changes and mistakes can happen. Articles show when they were last reviewed
        and list their sources. We make no warranty that any content is complete, current or
        error-free. If you spot a problem, please <Link href="/contact">let us know</Link>.
      </p>

      <h2>AI-assisted content</h2>
      <p>
        Articles are drafted with the help of AI and checked before publication. Each article states
        whether a named person reviewed it. See <Link href="/about">how articles are made</Link>.
      </p>

      <h2>External links</h2>
      <p>
        We link to other websites as sources. We don&rsquo;t control them and aren&rsquo;t
        responsible for their content.
      </p>
    </ProsePage>
  );
}
