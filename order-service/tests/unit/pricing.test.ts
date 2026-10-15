import { HttpError } from '../../src/utils/httpError';
import {
  applyDiscount,
  calculateSubtotal,
  calculateTotals,
  mergeItems,
  normalizeDiscountCode,
} from '../../src/utils/pricing';

describe('order pricing', () => {
  it('calculates subtotal and rounds floating-point values', () => {
    expect(calculateSubtotal([{ productId: 'a', price: 45, quantity: 2 }, { productId: 'b', price: 35, quantity: 1 }]))
      .toBe(125);
    expect(calculateSubtotal([])).toBe(0);
    expect(calculateSubtotal([{ productId: 'a', price: 0.1, quantity: 3 }])).toBe(0.3);
  });

  it('applies the supported discount codes case-insensitively', () => {
    expect(applyDiscount(100, 'WELCOME10')).toBe(10);
    expect(applyDiscount(100, 'welcome10')).toBe(10);
    expect(applyDiscount(300, 'CAMPUS50')).toBe(50);
    expect(applyDiscount(100, null)).toBe(0);
    expect(() => applyDiscount(299, 'CAMPUS50')).toThrow('Discount requires subtotal of at least 300');
    expect(() => applyDiscount(100, 'FAKE')).toThrow('Invalid discount code');
  });

  it('treats a missing or blank discount code as no discount', () => {
    expect(applyDiscount(100, '')).toBe(0);
    expect(applyDiscount(100, '   ')).toBe(0);
    expect(applyDiscount(100, null)).toBe(0);
    expect(applyDiscount(100, undefined)).toBe(0);
    expect(normalizeDiscountCode('')).toBeNull();
    expect(normalizeDiscountCode('   ')).toBeNull();
    expect(normalizeDiscountCode(null)).toBeNull();
    expect(normalizeDiscountCode(undefined)).toBeNull();

    // A blank code must not appear on the order, and a non-blank unknown code is still a 400.
    expect(calculateTotals([{ productId: 'a', price: 45, quantity: 2 }], '   '))
      .toEqual({ subtotal: 90, discountCode: null, discount: 0, total: 90 });
    let thrown: unknown;
    try {
      applyDiscount(100, 'FAKE');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(HttpError);
    expect((thrown as HttpError).status).toBe(400);
    expect((thrown as HttpError).message).toBe('Invalid discount code');
  });

  it('merges duplicate products and never returns a negative total', () => {
    expect(mergeItems([{ productId: 'a', quantity: 1 }, { productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }]))
      .toEqual([{ productId: 'a', quantity: 3 }, { productId: 'b', quantity: 1 }]);
    expect(calculateTotals([{ productId: 'a', price: 45, quantity: 2 }], 'WELCOME10'))
      .toEqual({ subtotal: 90, discountCode: 'WELCOME10', discount: 9, total: 81 });
  });
});
