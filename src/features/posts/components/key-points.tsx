// The answer before the essay — most symptom searchers want only this. (DESIGN.md §7)
export function KeyPoints({ points }: { points: string[] }) {
  return (
    <section aria-labelledby="key-points" className="rounded-lg bg-tint-sage p-6 md:p-8">
      <h2 id="key-points" className="text-lg">
        Key points
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 marker:text-primary">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}
