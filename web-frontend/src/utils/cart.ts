export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}
export const removeFromCart = (cart: CartItem[], id: string) =>
  cart.filter((item) => item.productId !== id);
export function updateQuantity(
  cart: CartItem[],
  id: string,
  quantity: number,
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return cart;
  return quantity === 0
    ? removeFromCart(cart, id)
    : cart.map((item) =>
        item.productId === id ? { ...item, quantity } : item,
      );
}
export function addToCart(
  cart: CartItem[],
  product: Omit<CartItem, "quantity">,
): CartItem[] {
  const existing = cart.find((item) => item.productId === product.productId);
  if (existing)
    return updateQuantity(
      cart,
      product.productId,
      Math.min(99, existing.quantity + 1),
    );
  return cart.length >= 20 ? cart : [...cart, { ...product, quantity: 1 }];
}
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.quantity, 0);
export const toOrderItems = (cart: CartItem[]) =>
  cart.map(({ productId, quantity }) => ({ productId, quantity }));
export function readCart(value: string | null): CartItem[] {
  try {
    const data: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(data) || data.length > 20) return [];
    const ids = new Set<string>();
    for (const item of data) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.productId !== "string" ||
        !/^[a-f0-9]{24}$/i.test(item.productId) ||
        ids.has(item.productId) ||
        typeof item.name !== "string" ||
        typeof item.price !== "number" ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      )
        return [];
      ids.add(item.productId);
    }
    return data as CartItem[];
  } catch {
    return [];
  }
}
