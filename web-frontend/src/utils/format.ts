/**
 * Pure helper functions — easy to unit test with Vitest.
 * Example given; add validateLoginForm(...), cart helpers etc. (UT-WEB-01..03).
 */
export function formatPrice(value: number): string {
  return `฿${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
