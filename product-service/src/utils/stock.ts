/**
 * Can `quantity` be added to `stock` without going below zero?
 * quantity < 0 = take from stock (an order), quantity > 0 = put back (a cancel).
 * The real update is done atomically in MongoDB (see product.controller.ts) —
 * this function holds the same rule so it can be unit tested (UT-PROD-03).
 */
export function canApplyStockChange(stock: number, quantity: number): boolean {
  if (!Number.isInteger(stock) || !Number.isInteger(quantity)) return false;
  return stock + quantity >= 0;
}
