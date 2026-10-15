import { config } from '../config';
import { HttpError } from '../utils/httpError';

export interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  stock: number;
}

async function requestProduct(path: string, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(`${config.productServiceUrl}${path}`, init);
    if (response.status >= 500) throw new HttpError(502, 'Product service unavailable');
    return response;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'Product service unavailable');
  }
}

function isProductSnapshot(value: unknown): value is ProductSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const product = value as Record<string, unknown>;
  return typeof product.id === 'string' && typeof product.name === 'string' &&
    typeof product.price === 'number' && Number.isFinite(product.price) &&
    typeof product.stock === 'number' && Number.isInteger(product.stock);
}

export async function getProduct(id: string): Promise<ProductSnapshot> {
  const response = await requestProduct(`/api/products/${id}`);
  if (response.status === 404) throw new HttpError(404, `Product not found: ${id}`);
  if (!response.ok) throw new HttpError(502, 'Product service unavailable');
  try {
    const product: unknown = await response.json();
    if (!isProductSnapshot(product)) throw new Error('Unexpected product response');
    return product;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'Product service unavailable');
  }
}

export async function changeStock(id: string, quantity: number, name = id): Promise<void> {
  const response = await requestProduct(`/api/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-internal-key': config.internalApiKey },
    body: JSON.stringify({ quantity }),
  });
  if (response.status === 404) throw new HttpError(404, `Product not found: ${id}`);
  if (response.status === 409) throw new HttpError(409, `Insufficient stock for ${name}`);
  if (!response.ok) throw new HttpError(502, 'Product service unavailable');
}
