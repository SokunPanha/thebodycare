import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description: `The terms for using ${siteConfig.name}.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use" updatedAt={siteConfig.legalUpdatedAt}>
      <p>
        By using {siteConfig.name} you agree to these terms. If you don&rsquo;t agree, please
        don&rsquo;t use the site.
      </p>

      <h2>Not medical advice</h2>
      <p>
        The site is for general education only. It does not provide medical advice, diagnosis or
        treatment, and using it does not create any professional relationship. Our{" "}
        <Link href="/medical-disclaimer">medical disclaimer</Link> forms part of these terms.
      </p>

      <h2>Using our content</h2>
      <p>
        The articles, design and other content on this site belong to{" "}
        {siteConfig.publisher.legalName} unless stated otherwise. You&rsquo;re welcome to read,
        share links to, and quote short extracts from our articles with a link back. Please
        don&rsquo;t republish whole articles or use our content to train or feed automated systems
        without permission.
      </p>

      <h2>Accuracy</h2>
      <p>
        We work to keep content accurate and up to date, but we provide the site &ldquo;as
        is&rdquo;, without warranties of any kind. Health information changes, and an article may
        not reflect the latest guidance or your circumstances.
      </p>

      <h2>Links to other sites</h2>
      <p>
        We link to other websites as sources and further reading. We don&rsquo;t control them and
        aren&rsquo;t responsible for their content or practices.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, {siteConfig.publisher.legalName} is not liable for any
        loss or harm arising from your use of the site or reliance on its content. Nothing in these
        terms limits liability that cannot be limited by law.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows when they last changed, and continuing
        to use the site means you accept the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <Link href="/contact">get in touch</Link>.
      </p>
    </ProsePage>
  );
}
