import { isValidEmail } from '../../src/utils/validation';

describe('isValidEmail (example unit test)', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('bio@campusmart.local')).toBe(true);
  });

  it.each(['', 'no-at-sign', 'a@b', 123, null, undefined])('rejects %p', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});
