import { isValidObjectId } from 'mongoose';
import { QuantityItem } from './pricing';

export interface OrderInput {
  items: QuantityItem[];
  discountCode: string | null;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isObjectIdString(value: unknown): value is string {
  return typeof value === 'string' && isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value);
}

export function validateOrderInput(body: unknown): ValidationResult<OrderInput> {
  if (!isPlainObject(body)) return { ok: false, message: 'Request body must be a JSON object' };
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
    return { ok: false, message: 'items must be a non-empty array of at most 20 items' };
  }

  const items: QuantityItem[] = [];
  for (const item of body.items) {
    if (!isPlainObject(item) || !isObjectIdString(item.productId)) {
      return { ok: false, message: 'Each item must have a valid productId' };
    }
    if (!Number.isInteger(item.quantity) || (item.quantity as number) < 1 || (item.quantity as number) > 99) {
      return { ok: false, message: 'Each item quantity must be an integer from 1 to 99' };
    }
    items.push({ productId: item.productId, quantity: item.quantity as number });
  }

  const discountCode = body.discountCode;
  if (discountCode !== undefined && discountCode !== null && typeof discountCode !== 'string') {
    return { ok: false, message: 'discountCode must be a string' };
  }
  // Missing, null or blank after trim all mean "no discount" — the web cart posts "" when the
  // discount box is left empty, and that must not block checkout.
  const trimmed = typeof discountCode === 'string' ? discountCode.trim() : '';
  return { ok: true, value: { items, discountCode: trimmed === '' ? null : trimmed } };
}
