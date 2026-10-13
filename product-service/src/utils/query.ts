/**
 * Turns the query string of GET /api/products into a MongoDB filter + paging values.
 * Pure function → unit tested in tests/unit/query.test.ts (UT-PROD-02).
 */
export interface ProductFilter {
  name?: RegExp;
  category?: string;
}

export interface ProductQuery {
  filter: ProductFilter;
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** "3" -> 3; anything that is not a whole number >= 1 -> fallback. */
function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback;
  const n = Number(value);
  return n >= 1 ? n : fallback;
}

/** Escape . * + ? ( ) [ ] etc. so the user's text is matched literally, not as a regex. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildProductQuery(query: Record<string, unknown>): ProductQuery {
  const filter: ProductFilter = {};

  // Only plain strings are used — ?search[$ne]=x arrives as an object and is ignored.
  if (typeof query.search === 'string' && query.search.trim() !== '') {
    filter.name = new RegExp(escapeRegex(query.search.trim()), 'i');
  }
  if (typeof query.category === 'string' && query.category !== '') {
    filter.category = query.category;
  }

  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  return { filter, page, limit, skip: (page - 1) * limit };
}
