/**
 * Pure helper functions (no database, no Express) — easy to unit test.
 */
export const CATEGORIES = ['stationery', 'electronics', 'food', 'clothing', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
  imageUrl: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Plain JSON object (not null, not an array). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks a product body against the rules in API_CONTRACT §4.
 * - Strict types: "45" is NOT a valid price, { $ne: null } is NOT a valid name (blocks NoSQL injection).
 * - Only known fields are copied into `value`, so a client cannot set _id, createdAt, ...
 * - partial = true (PUT): every field is optional, but the ones that are sent must be valid.
 */
export function validateProductInput(
  body: unknown,
  options: { partial?: boolean } = {},
): ValidationResult<Partial<ProductInput>> {
  const partial = options.partial ?? false;
  if (!isPlainObject(body)) return { ok: false, message: 'Request body must be a JSON object' };

  const value: Partial<ProductInput> = {};
  const has = (field: keyof ProductInput) => body[field] !== undefined;
  const missing = (field: keyof ProductInput) => !partial && !has(field);

  if (missing('name')) return { ok: false, message: 'name is required' };
  if (has('name')) {
    const name = body.name;
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return { ok: false, message: 'name must be a string of 1-100 characters' };
    }
    value.name = name.trim();
  }

  if (missing('price')) return { ok: false, message: 'price is required' };
  if (has('price')) {
    if (!isNonNegativeNumber(body.price)) return { ok: false, message: 'price must be a number >= 0' };
    value.price = body.price as number;
  }

  if (missing('stock')) return { ok: false, message: 'stock is required' };
  if (has('stock')) {
    const stock = body.stock;
    if (!Number.isInteger(stock) || (stock as number) < 0) {
      return { ok: false, message: 'stock must be an integer >= 0' };
    }
    value.stock = stock as number;
  }

  if (missing('category')) return { ok: false, message: 'category is required' };
  if (has('category')) {
    if (!CATEGORIES.includes(body.category as Category)) {
      return { ok: false, message: `category must be one of: ${CATEGORIES.join(', ')}` };
    }
    value.category = body.category as Category;
  }

  if (has('description')) {
    if (typeof body.description !== 'string' || body.description.length > 500) {
      return { ok: false, message: 'description must be a string of at most 500 characters' };
    }
    value.description = body.description;
  } else if (!partial) {
    value.description = '';
  }

  if (has('imageUrl')) {
    if (typeof body.imageUrl !== 'string') return { ok: false, message: 'imageUrl must be a string' };
    value.imageUrl = body.imageUrl;
  } else if (!partial) {
    value.imageUrl = '';
  }

  if (partial && Object.keys(value).length === 0) {
    return { ok: false, message: 'Send at least one product field to update' };
  }
  return { ok: true, value };
}

/** A MongoDB ObjectId written as 24 hex characters. */
export function isObjectIdString(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}
