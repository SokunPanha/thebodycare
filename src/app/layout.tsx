import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";

import { siteConfig } from "@/config/site";

import "@/styles/globals.css";

// Variable fonts, self-hosted at build time. tokens.css maps these onto
// --font-display / --font-body. (DESIGN.md §3)
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
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
    <html lang="en" className={`${bricolage.variable} ${publicSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
