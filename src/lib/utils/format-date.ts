const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "24 Sept 2026". UTC so server and client render the same string. */
export function formatDate(value: string | Date): string {
  return formatter.format(typeof value === "string" ? new Date(value) : value);
}
