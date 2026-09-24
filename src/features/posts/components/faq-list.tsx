export type FaqItem = { question: string; answer: string };

// Visible on the page — FAQPage structured data (M6) must match content readers can see.
export function FaqList({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="faq">
      <h2 id="faq" className="text-xl">
        Common questions
      </h2>
      <dl className="mt-6 space-y-6">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="font-semibold">{item.question}</dt>
            <dd className="mt-1">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
