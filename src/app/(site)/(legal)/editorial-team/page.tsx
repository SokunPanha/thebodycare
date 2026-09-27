import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

const team = siteConfig.editorialTeam;

export const metadata: Metadata = pageMetadata({
  title: "Editorial team",
  description: `Who publishes ${siteConfig.name}'s articles, and how each one is researched and checked.`,
  path: team.path,
});

// The house byline's page. Every claim here must stay true. Since 2026-09-27 (owner's decision)
// articles may be published without a human read, so the page says so plainly; if every article is
// ever human-approved again, it can say that instead.
export default function EditorialTeamPage() {
  return (
    <ProsePage title={team.name}>
      <p>
        Articles on {siteConfig.name} without a named author are published by our editorial team.
        The byline stands for a process rather than a single writer, so here is exactly what that
        process is.
      </p>

      <h2>How an article is made</h2>
      <ul>
        <li>
          <strong>Research from authoritative sources.</strong> Each article starts from what
          government health services, medical institutions, professional bodies and peer-reviewed
          research say. Drafting is assisted by AI, working only from that research.
        </li>
        <li>
          <strong>Every source is checked.</strong> Only pages from recognised health publishers
          that actually load are kept, and every article lists them at the end.
        </li>
        <li>
          <strong>Checked against our editorial rules before publication.</strong> Every draft is
          checked automatically, and nothing that names a medication, gives a dose, diagnoses, or
          promises a cure gets through. Drafts too close to something we&rsquo;ve already published
          are dropped.
        </li>
        <li>
          <strong>Named review when there is one.</strong> Not every article has been read by a
          person before publication. When one has, the reviewer&rsquo;s name appears beside the
          byline; when there&rsquo;s no name, there was no human review. We never imply one that
          didn&rsquo;t happen.
        </li>
      </ul>

      <h2>What we won&rsquo;t do</h2>
      <p>
        We don&rsquo;t practise medicine, and we don&rsquo;t put invented people&rsquo;s names on
        our work. Every article ends with the signs that mean it&rsquo;s time to see a professional.
        Read our <Link href="/medical-disclaimer">medical disclaimer</Link>.
      </p>

      <h2>Corrections</h2>
      <p>
        Found something wrong? <Link href="/contact">Tell us</Link>. Anything that could affect
        someone&rsquo;s safety is taken down while we check it.
      </p>
    </ProsePage>
  );
}
