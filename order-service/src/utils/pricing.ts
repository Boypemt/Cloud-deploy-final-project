import { roundMoney } from './money';
import { HttpError } from './httpError';

export interface QuantityItem {
  productId: string;
  quantity: number;
}

export interface PricedItem extends QuantityItem {
  price: number;
}

/** Combine duplicate product ids before asking product-service for stock. */
export function mergeItems<T extends QuantityItem>(items: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of items) {
    const existing = merged.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(item.productId, { ...item });
    }
  }
  return [...merged.values()];
}

export function calculateSubtotal(items: PricedItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

export function normalizeDiscountCode(code: string | null | undefined): string | null {
  if (code === null || code === undefined) return null;
  return code.trim().toUpperCase();
}

/** Returns only the discount amount; controllers store the normalised code separately. */
export function applyDiscount(subtotal: number, code: string | null | undefined): number {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    if (code !== null && code !== undefined) throw new HttpError(400, 'Invalid discount code');
    return 0;
  }
  if (normalized === 'WELCOME10') return roundMoney(Math.min(subtotal, subtotal * 0.1));
  if (normalized === 'CAMPUS50') {
    if (subtotal < 300) throw new HttpError(400, 'Discount requires subtotal of at least 300');
    return roundMoney(Math.min(subtotal, 50));
  }
  throw new HttpError(400, 'Invalid discount code');
}

export function calculateTotals(items: PricedItem[], code: string | null | undefined) {
  const subtotal = calculateSubtotal(items);
  const discount = applyDiscount(subtotal, code);
  return {
    subtotal,
    discountCode: normalizeDiscountCode(code),
    discount,
    total: roundMoney(Math.max(0, subtotal - discount)),
  };
}
