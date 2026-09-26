import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `What ${siteConfig.name} is, how articles are made, and where its limits are.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <ProsePage title={`About ${siteConfig.name}`}>
      <p>
        {siteConfig.name} publishes plain-language guides to everyday health: how to sleep, eat and
        move well, and how to make sense of what your body is telling you. We explain what a symptom
        usually is, how common it is, what tends to help in everyday terms — and, above all, when it
        is worth seeing someone about.
      </p>

      <h2>What we don&rsquo;t do</h2>
      <p>
        We don&rsquo;t practise medicine. You won&rsquo;t find medication or supplement
        recommendations, doses, diagnoses, or claims that anything cures a condition. Those
        decisions belong with a clinician who knows you. What we can do is help you understand
        what&rsquo;s going on and decide when to get it checked.
      </p>

      <h2>How articles are made</h2>
      <p>
        We&rsquo;re open about this, because you should be able to judge what you&rsquo;re reading.
      </p>
      <ul>
        <li>
          <strong>Drafts are written with AI assistance.</strong> Each draft is grounded in
          published sources — health services, medical bodies and peer-reviewed research — and every
          article lists the sources it relied on.
        </li>
        <li>
          <strong>Every article is checked against our editorial rules</strong> before publication,
          both automatically and by a person.
        </li>
        <li>
          <strong>The byline tells you exactly what happened.</strong> An article marked
          &ldquo;reviewed by&rdquo; names the person who reviewed it. If an article hasn&rsquo;t had
          a named human review, it says so. We never imply a review that didn&rsquo;t happen.
        </li>
        <li>
          <strong>Every article ends with &ldquo;When to seek care&rdquo;</strong> — specific signs
          that mean it&rsquo;s time to talk to a professional.
        </li>
        <li>
          <strong>Articles are re-reviewed on a schedule</strong>, and the date of the last review
          is shown at the top.
        </li>
      </ul>

      <h2>Corrections</h2>
      <p>
        If you find an error, please <Link href="/contact">tell us</Link>. Anything that could
        affect someone&rsquo;s safety is taken down while we fix it. Corrected articles carry a
        dated note explaining what changed.
      </p>

      <h2>Not a substitute for care</h2>
      <p>
        Nothing here replaces advice from a doctor, pharmacist or other qualified professional. Read
        our full <Link href="/medical-disclaimer">medical disclaimer</Link>.
      </p>
    </ProsePage>
  );
}
