// Public shell — header, footer and skip link land here in M3.1.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <main className="mx-auto max-w-(--shell) px-4 md:px-8">{children}</main>;
}
