import { applyDiscount, calculateSubtotal, calculateTotals, mergeItems } from '../../src/utils/pricing';

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

  it('merges duplicate products and never returns a negative total', () => {
    expect(mergeItems([{ productId: 'a', quantity: 1 }, { productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }]))
      .toEqual([{ productId: 'a', quantity: 3 }, { productId: 'b', quantity: 1 }]);
    expect(calculateTotals([{ productId: 'a', price: 45, quantity: 2 }], 'WELCOME10'))
      .toEqual({ subtotal: 90, discountCode: 'WELCOME10', discount: 9, total: 81 });
  });
});
