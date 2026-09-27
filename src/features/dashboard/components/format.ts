const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
// Sub-cent amounts (a cover image is $0.0035) shown exactly, not rounded to "<$0.01".
const usdSmall = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatUsd(value: number) {
  if (value > 0 && value < 0.01) return usdSmall.format(value);
  return usd.format(value);
}

/** 1,284 → "1.3K" only from 10,000 up; smaller counts read better in full. */
export function formatCount(value: number) {
  return value >= 10_000 ? compact.format(value) : value.toLocaleString("en-US");
}
