import { apiFetch } from "./client";
export type Category =
  "stationery" | "electronics" | "food" | "clothing" | "other";
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}
export type NewProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;
export const listProducts = (
  search: string,
  page: number,
  signal?: AbortSignal,
  category = "",
) =>
  apiFetch<{ items: Product[]; total: number; page: number; limit: number }>(
    `/api/products?${new URLSearchParams({ search, page: String(page), limit: "20", ...(category ? { category } : {}) })}`,
    { signal },
  );
export const createProduct = (product: NewProduct) =>
  apiFetch<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
