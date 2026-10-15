import { describe, expect, it } from "vitest";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  cartCount,
  toOrderItems,
  readCart,
} from "../src/utils/cart";
const product = {
  productId: "000000000000000000000001",
  name: "Notebook",
  price: 45,
};
describe("UT-WEB-02 cart mutations", () => {
  it("adds a product without mutating input", () => {
    const cart = [{ ...product, quantity: 1 }];
    expect(addToCart([], product)).toEqual(cart);
    expect(addToCart(cart, product)[0].quantity).toBe(2);
    expect(cart[0].quantity).toBe(1);
  });
  it("updates quantity and removes at zero", () => {
    const cart = [{ ...product, quantity: 2 }];
    expect(updateQuantity(cart, product.productId, 3)[0].quantity).toBe(3);
    expect(updateQuantity(cart, product.productId, 0)).toEqual([]);
    expect(removeFromCart(cart, product.productId)).toEqual([]);
  });
  it.each([-1, 1.5, 100, NaN])("ignores invalid quantity %s", (quantity) => {
    const cart = [{ ...product, quantity: 2 }];
    expect(updateQuantity(cart, product.productId, quantity)).toEqual(cart);
  });
  it("caps quantity at 99 and distinct products at 20", () => {
    expect(addToCart([{ ...product, quantity: 99 }], product)[0].quantity).toBe(
      99,
    );
    const cart = Array.from({ length: 20 }, (_, i) => ({
      ...product,
      productId: String(i),
      quantity: 1,
    }));
    expect(addToCart(cart, product)).toHaveLength(20);
  });
});
describe("UT-WEB-03 count and order payload", () => {
  it("counts units and sends only ids and quantities", () => {
    const cart = [
      { ...product, quantity: 2 },
      { ...product, productId: "000000000000000000000002", quantity: 3 },
    ];
    expect(cartCount(cart)).toBe(5);
    expect(toOrderItems(cart)).toEqual(
      cart.map(({ productId, quantity }) => ({ productId, quantity })),
    );
    expect(cartCount([])).toBe(0);
  });
});
describe("persisted cart validation", () => {
  it("restores valid data", () => {
    const cart = [{ ...product, quantity: 2 }];
    expect(readCart(JSON.stringify(cart))).toEqual(cart);
  });
  it.each([
    "bad json",
    "{}",
    "[null]",
    JSON.stringify([{ ...product, quantity: -1 }]),
    JSON.stringify([
      { ...product, quantity: 1 },
      { ...product, quantity: 2 },
    ]),
  ])("discards malformed storage", (value) => {
    expect(readCart(value)).toEqual([]);
  });
});
