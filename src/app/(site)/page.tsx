import { siteConfig } from "@/config/site";

// Placeholder until the home index lands in M3.3. Exercises the type scale and tokens
// so fonts and dark mode can be checked by eye.
export default function HomePage() {
  return (
    <section className="py-24">
      <p className="eyebrow">Foundation</p>
      <h1 className="mt-2 text-4xl">{siteConfig.name}</h1>
      <p className="prose mt-4 text-lg text-ink-muted">{siteConfig.description}</p>
    </section>
  );
}
