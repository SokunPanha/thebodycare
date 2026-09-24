const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatUsd(value: number) {
  if (value > 0 && value < 0.01) return "<$0.01";
  return usd.format(value);
}

/** 1,284 → "1.3K" only from 10,000 up; smaller counts read better in full. */
export function formatCount(value: number) {
  return value >= 10_000 ? compact.format(value) : value.toLocaleString("en-US");
}
