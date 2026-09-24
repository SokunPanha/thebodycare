import { SiteFooter, SiteHeader } from "@/components/layout";
import { listCategories } from "@/features/taxonomy";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const categories = await listCategories();

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded bg-primary px-4 py-2 font-semibold text-on-primary no-underline focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>
      <SiteHeader categories={categories} />
      <main id="main">{children}</main>
      <SiteFooter categories={categories} />
    </>
  );
}
