import { validateOrderInput } from '../../src/utils/validation';

const productId = '66f200000000000000000001';
const items = [{ productId, quantity: 2 }];

describe('validateOrderInput — discountCode', () => {
  it.each([
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['null', null],
  ])('accepts %s as "no discount code"', (_label, discountCode) => {
    expect(validateOrderInput({ items, discountCode }))
      .toEqual({ ok: true, value: { items, discountCode: null } });
  });

  it('accepts an omitted discountCode', () => {
    expect(validateOrderInput({ items }))
      .toEqual({ ok: true, value: { items, discountCode: null } });
    expect(validateOrderInput({ items, discountCode: undefined }))
      .toEqual({ ok: true, value: { items, discountCode: null } });
  });

  it('keeps a real code, trimmed', () => {
    expect(validateOrderInput({ items, discountCode: '  WELCOME10 ' }))
      .toEqual({ ok: true, value: { items, discountCode: 'WELCOME10' } });
  });

  it('still accepts an unknown code here — pricing rejects it with 400', () => {
    expect(validateOrderInput({ items, discountCode: 'FAKE' }))
      .toEqual({ ok: true, value: { items, discountCode: 'FAKE' } });
  });

  it('rejects a non-string discountCode', () => {
    expect(validateOrderInput({ items, discountCode: 123 }))
      .toEqual({ ok: false, message: 'discountCode must be a string' });
    expect(validateOrderInput({ items, discountCode: { $ne: null } }))
      .toEqual({ ok: false, message: 'discountCode must be a string' });
  });
});
