/**
 * Pure helper functions (no database, no Express) — easy to unit test.
 * Example given; add validateProductInput(...), buildProductFilter(...) etc. here.
 */
export function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
