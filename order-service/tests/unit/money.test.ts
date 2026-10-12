import { roundMoney } from '../../src/utils/money';

describe('roundMoney (example unit test)', () => {
  it('fixes floating point noise', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('rounds to 2 decimals', () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(99.994)).toBe(99.99);
  });
});
