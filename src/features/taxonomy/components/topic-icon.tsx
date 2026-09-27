// One simple line icon per topic, drawn in currentColor on a 24px grid. Decorative only — the topic
// is always named in text beside it.

const paths: Record<string, string> = {
  // crescent moon
  sleep: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z",
  // bowl
  digestion: "M3 11h18a9 9 0 0 1-18 0Zm5-4c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M8 21h8",
  // walking figure
  movement: "M13 4.5a1.5 1.5 0 1 0 0-.01M10 21l2-6 3 3v3M8 11l3-3 3 1 2 3m-5-4-1 6-3 2",
  // apple
  food: "M12 7c-4-2-8 0-8 5s3 9 5 9c1.5 0 2-.7 3-.7s1.5.7 3 .7c2 0 5-4 5-9s-4-7-8-5Zm0 0c0-2 1-4 3-4",
  // head with thought
  mind: "M9 21v-3H6.5a1.5 1.5 0 0 1-1.5-1.5V14l-2-1 2-3.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7c0 2.5-1 4-2 5v6",
  // hand
  "everyday-body":
    "M7 13V6.5a1.5 1.5 0 0 1 3 0V12m0-6.5v-1a1.5 1.5 0 0 1 3 0V12m0-6a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.5L3.5 13a1.5 1.5 0 0 1 2.5-1.5L7 13",
  // shield with check
  prevention: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  // first-aid box
  symptoms:
    "M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm5 0V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8m-3 3v6m-3-3h6",
};

export function TopicIcon({ slug, className = "" }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[slug] ?? paths.prevention} />
    </svg>
  );
}
