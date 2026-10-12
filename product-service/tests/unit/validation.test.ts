import { isNonNegativeNumber, validateProductInput } from '../../src/utils/validation';

describe('isNonNegativeNumber (example unit test)', () => {
  it.each([0, 1, 99.5])('accepts %p', (value) => {
    expect(isNonNegativeNumber(value)).toBe(true);
  });

  it.each([-1, NaN, Infinity, '10', null, undefined])('rejects %p', (value) => {
    expect(isNonNegativeNumber(value)).toBe(false);
  });
});

// UT-PROD-01
describe('validateProductInput', () => {
  const valid = { name: '  CMU Notebook A5 ', price: 45, stock: 120, category: 'stationery' };

  it('accepts a valid product, trims the name and fills defaults', () => {
    const result = validateProductInput(valid);
    expect(result).toEqual({
      ok: true,
      value: { name: 'CMU Notebook A5', price: 45, stock: 120, category: 'stationery', description: '', imageUrl: '' },
    });
  });

  it('ignores fields that are not part of a product', () => {
    const result = validateProductInput({ ...valid, _id: 'x', role: 'admin' });
    expect(result.ok && Object.keys(result.value).sort()).toEqual(
      ['category', 'description', 'imageUrl', 'name', 'price', 'stock'],
    );
  });

  it.each([
    ['price -1', { ...valid, price: -1 }],
    ['price as a string', { ...valid, price: '45' }],
    ['stock 1.5', { ...valid, stock: 1.5 }],
    ['negative stock', { ...valid, stock: -1 }],
    ['unknown category', { ...valid, category: 'toys' }],
    ['empty name', { ...valid, name: '   ' }],
    ['name over 100 chars', { ...valid, name: 'a'.repeat(101) }],
    ['description over 500 chars', { ...valid, description: 'a'.repeat(501) }],
    ['NoSQL operator as name', { ...valid, name: { $ne: null } }],
    ['imageUrl not a string', { ...valid, imageUrl: 5 }],
    ['missing price', { name: 'x', stock: 1, category: 'other' }],
  ])('rejects %s', (_label, body) => {
    const result = validateProductInput(body);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toEqual(expect.any(String));
  });

  it.each([null, 'text', [1, 2]])('rejects a body that is not an object: %p', (body) => {
    expect(validateProductInput(body).ok).toBe(false);
  });

  it('partial update with only price is ok and adds no defaults', () => {
    expect(validateProductInput({ price: 50 }, { partial: true })).toEqual({ ok: true, value: { price: 50 } });
  });

  it('partial update still validates the fields that are sent', () => {
    expect(validateProductInput({ stock: 1.5 }, { partial: true }).ok).toBe(false);
  });

  it('partial update with no product fields is rejected', () => {
    expect(validateProductInput({}, { partial: true }).ok).toBe(false);
  });
});
