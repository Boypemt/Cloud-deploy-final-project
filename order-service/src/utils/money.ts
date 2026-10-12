/**
 * Pure helper functions (no database, no Express) — easy to unit test.
 * Example given; add calculateSubtotal(...), applyDiscount(...) etc. here.
 */

/** Round a money value to 2 decimal places (avoids 0.1 + 0.2 = 0.30000000000000004). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
