export function formatMoney(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents > 100000 ? 0 : 2,
  }).format(cents / 100);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "n/a";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
