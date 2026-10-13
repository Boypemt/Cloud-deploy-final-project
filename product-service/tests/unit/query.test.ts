import { buildProductQuery } from '../../src/utils/query';

// UT-PROD-02
describe('buildProductQuery', () => {
  it('uses page 1 and limit 20 by default', () => {
    expect(buildProductQuery({})).toEqual({ filter: {}, page: 1, limit: 20, skip: 0 });
  });

  it('caps limit at 100', () => {
    expect(buildProductQuery({ limit: '500' }).limit).toBe(100);
  });

  it('calculates skip from page and limit', () => {
    expect(buildProductQuery({ page: '3', limit: '10' })).toMatchObject({ page: 3, limit: 10, skip: 20 });
  });

  it.each(['0', '-2', 'abc', '1.5'])('falls back to defaults for a bad number %p', (bad) => {
    expect(buildProductQuery({ page: bad, limit: bad })).toMatchObject({ page: 1, limit: 20 });
  });

  it('search becomes a case-insensitive regex on name', () => {
    const { filter } = buildProductQuery({ search: 'pen' });
    expect(filter.name).toBeInstanceOf(RegExp);
    expect(filter.name?.flags).toContain('i');
    expect(filter.name?.test('Blue Gel PEN')).toBe(true);
  });

  it('escapes regex special characters in search', () => {
    const regex = buildProductQuery({ search: 'Pen (3-pack)' }).filter.name;
    expect(regex?.test('Blue Gel Pen (3-pack)')).toBe(true);
    expect(buildProductQuery({ search: '.*' }).filter.name?.test('anything')).toBe(false);
  });

  it('filters by category', () => {
    expect(buildProductQuery({ category: 'food' }).filter).toEqual({ category: 'food' });
  });

  it('ignores search/category that are not plain strings (e.g. ?search[$ne]=x)', () => {
    expect(buildProductQuery({ search: { $ne: 'x' }, category: ['a', 'b'] }).filter).toEqual({});
  });

  it('ignores an empty search', () => {
    expect(buildProductQuery({ search: '   ' }).filter).toEqual({});
  });
});
