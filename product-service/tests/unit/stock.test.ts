import { canApplyStockChange } from '../../src/utils/stock';

// UT-PROD-03
describe('canApplyStockChange', () => {
  it.each([
    [10, -3, true],
    [2, -3, false],
    [0, 5, true],
    [3, -3, true],
    [5, 1.5, false],
    [5.5, 1, false],
  ])('stock %p, quantity %p -> %p', (stock, quantity, expected) => {
    expect(canApplyStockChange(stock, quantity)).toBe(expected);
  });
});
