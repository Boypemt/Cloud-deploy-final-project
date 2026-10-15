import { apiFetch } from "./client";
export interface OrderItem {
  productId: string;
  quantity: number;
}
export interface Quote {
  items: (OrderItem & { name: string; price: number; lineTotal: number })[];
  subtotal: number;
  discountCode: string | null;
  discount: number;
  total: number;
}
export interface Order extends Quote {
  id: string;
  userId: string;
  status: "PLACED" | "CANCELLED";
  createdAt: string;
}
export const quoteOrder = (
  items: OrderItem[],
  discountCode: string,
  signal?: AbortSignal,
) =>
  apiFetch<Quote>("/api/orders/quote", {
    method: "POST",
    body: JSON.stringify({ items, ...(discountCode ? { discountCode } : {}) }),
    signal,
  });
export const createOrder = (items: OrderItem[], discountCode: string) =>
  apiFetch<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ items, ...(discountCode ? { discountCode } : {}) }),
  });
export const listOrders = (signal?: AbortSignal) =>
  apiFetch<Order[]>("/api/orders", { signal });
export const cancelOrder = (id: string) =>
  apiFetch<Order>(`/api/orders/${encodeURIComponent(id)}/cancel`, {
    method: "PATCH",
  });
