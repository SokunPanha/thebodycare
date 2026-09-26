import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: `How ${siteConfig.name} handles personal data.`,
  path: "/privacy",
});

// Mirrors the data map in docs/LEGAL.md §6. Update this page whenever a processor or data type is
// added — newsletter, comments and ads each require changes here before they launch.
export default function PrivacyPage() {
  const email = siteConfig.contactEmail;

  return (
    <ProsePage title="Privacy policy" updatedAt={siteConfig.legalUpdatedAt}>
      <p>
        The short version: you can read everything on {siteConfig.name} without an account, we
        don&rsquo;t use advertising or tracking cookies, and we don&rsquo;t sell data.
      </p>

      <h2>Who is responsible</h2>
      <p>
        The data controller for this website is {siteConfig.publisher.legalName},{" "}
        {siteConfig.publisher.country}. You can contact us about anything in this policy at{" "}
        <a href={`mailto:${email}`}>{email}</a>.
      </p>

      <h2>What we collect</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Why</th>
            <th>Legal basis</th>
            <th>How long</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Aggregate page views</td>
            <td>Knowing which articles are read</td>
            <td>Legitimate interest</td>
            <td>Indefinitely — contains no personal data</td>
          </tr>
          <tr>
            <td>IP address and browser details in server logs</td>
            <td>Delivering the site securely and preventing abuse</td>
            <td>Legitimate interest</td>
            <td>Short-term, per our hosting providers&rsquo; defaults</td>
          </tr>
          <tr>
            <td>Your email and message, if you contact us</td>
            <td>Replying to you</td>
            <td>Legitimate interest</td>
            <td>As long as needed to deal with your message</td>
          </tr>
        </tbody>
      </table>
      <p>
        We don&rsquo;t ask for, and don&rsquo;t want, information about your health. Please
        don&rsquo;t send us personal medical details.
      </p>

      <h2>Cookies</h2>
      <p>
        Reading the site sets no cookies. Our analytics are cookieless and don&rsquo;t identify you
        or follow you across sites. The only cookies we use are strictly necessary ones for our
        editors when they sign in to manage content.
      </p>

      <h2>Who processes data for us</h2>
      <ul>
        <li>
          <strong>Vercel</strong> — hosts the website.
        </li>
        <li>
          <strong>Supabase</strong> — hosts our database.
        </li>
      </ul>
      <p>
        Each acts under a data processing agreement. Some of them may process data outside your
        country, under the safeguards those agreements provide.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, or receive a
        copy of personal data we hold about you, and to object to or restrict how we use it. Email{" "}
        <a href={`mailto:${email}`}>{email}</a> and we&rsquo;ll respond within one month. You also
        have the right to complain to your local data protection authority.
      </p>

      <h2>Children</h2>
      <p>
        This site is written for adults and we don&rsquo;t knowingly collect data from children.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy — for example, before adding a newsletter — we&rsquo;ll update this
        page and the date at the top. See also our <Link href="/terms">terms of use</Link>.
      </p>
    </ProsePage>
  );
}
