import type { Metadata } from "next";
import { Figtree, Outfit } from "next/font/google";

import { siteConfig } from "@/config/site";

import "@/styles/globals.css";

// Variable fonts, self-hosted at build time. tokens.css maps these onto
// --font-display / --font-body. (DESIGN.md §3)
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
