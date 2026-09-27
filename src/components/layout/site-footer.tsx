import Link from "next/link";

import { siteConfig } from "@/config/site";

import { Container } from "./container";
import { LogoMark } from "./icons";

type NavCategory = { slug: string; name: string };

const pages = [
  { href: "/about", label: "About" },
  { href: "/editorial-team", label: "Editorial team" },
  { href: "/contact", label: "Contact" },
  { href: "/medical-disclaimer", label: "Medical disclaimer" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter({ categories }: { categories: NavCategory[] }) {
  return (
    <footer className="mt-24 rounded-t-xl bg-surface-subtle">
      <Container className="grid gap-10 py-14 text-sm md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-(--measure)">
          <p className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-(--tracking-display) text-ink">
            <LogoMark className="size-8" />
            {siteConfig.name}
          </p>
          <p className="mt-2 text-ink-muted">
            Educational content about everyday health. Not medical advice, diagnosis or treatment —
            if you&rsquo;re worried about a symptom, talk to a qualified health professional.{" "}
            <Link href="/medical-disclaimer">Read the full disclaimer</Link>.
          </p>
        </div>
        <nav aria-label="Topics footer">
          <p className="eyebrow">Topics</p>
          <ul className="mt-3 space-y-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-ink-muted no-underline hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site">
          <p className="eyebrow">The site</p>
          <ul className="mt-3 space-y-2">
            {pages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-ink-muted no-underline hover:text-primary">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-line py-6 text-xs text-ink-muted">
        © {new Date().getFullYear()} {siteConfig.publisher.legalName}
      </Container>
    </footer>
  );
}
