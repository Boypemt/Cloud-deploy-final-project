import { isNonNegativeNumber } from '../../src/utils/validation';

describe('isNonNegativeNumber (example unit test)', () => {
  it.each([0, 1, 99.5])('accepts %p', (value) => {
    expect(isNonNegativeNumber(value)).toBe(true);
  });

  it.each([-1, NaN, Infinity, '10', null, undefined])('rejects %p', (value) => {
    expect(isNonNegativeNumber(value)).toBe(false);
  });
});
