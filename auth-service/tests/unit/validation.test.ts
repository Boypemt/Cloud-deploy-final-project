import {
  isPlainObject,
  isValidEmail,
  validateLoginInput,
  validateRegisterInput,
} from '../../src/utils/validation';

describe('isValidEmail (example unit test)', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('bio@campusmart.local')).toBe(true);
  });

  it.each(['', 'no-at-sign', 'a@b', 123, null, undefined])('rejects %p', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('isPlainObject', () => {
  it.each([{}, { a: 1 }])('accepts %p', (value) => {
    expect(isPlainObject(value)).toBe(true);
  });

  it.each([null, undefined, 'text', 5, [1, 2]])('rejects %p', (value) => {
    expect(isPlainObject(value)).toBe(false);
  });
});

// UT-AUTH-01
describe('validateRegisterInput', () => {
  const valid = { name: '  Bio ', email: '  Bio@CampusMart.Local ', password: 'secret123' };

  it('accepts valid data, trims the name and lower-cases the email', () => {
    expect(validateRegisterInput(valid)).toEqual({
      ok: true,
      value: { name: 'Bio', email: 'bio@campusmart.local', password: 'secret123' },
    });
  });

  it('ignores fields that are not part of the register body (a client cannot send role)', () => {
    const result = validateRegisterInput({ ...valid, role: 'admin', _id: 'x' });
    expect(result.ok && Object.keys(result.value).sort()).toEqual(['email', 'name', 'password']);
  });

  it.each([
    ['missing name', { email: 'a@b.co', password: 'secret123' }],
    ['empty name', { ...valid, name: '   ' }],
    ['name over 50 chars', { ...valid, name: 'a'.repeat(51) }],
    ['bad email', { ...valid, email: 'abc' }],
    ['missing email', { name: 'Bio', password: 'secret123' }],
    ['short password', { ...valid, password: '123' }],
    ['missing password', { name: 'Bio', email: 'a@b.co' }],
    ['name as a NoSQL operator', { ...valid, name: { $ne: null } }],
    ['email as a NoSQL operator', { ...valid, email: { $ne: null } }],
    ['password as a NoSQL operator', { ...valid, password: { $ne: null } }],
    ['password as a number', { ...valid, password: 1234567 }],
  ])('rejects %s', (_label, body) => {
    const result = validateRegisterInput(body);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toEqual(expect.any(String));
  });

  it.each([null, undefined, 'text', [1, 2]])('rejects a body that is not an object: %p', (body) => {
    expect(validateRegisterInput(body).ok).toBe(false);
  });
});

// UT-AUTH-01 (login half)
describe('validateLoginInput', () => {
  it('accepts email + password and normalises the email', () => {
    expect(validateLoginInput({ email: ' DEMO@campusmart.local ', password: 'Demo@1234' })).toEqual({
      ok: true,
      value: { email: 'demo@campusmart.local', password: 'Demo@1234' },
    });
  });

  it('accepts a short password (length is only checked on register, wrong ones give 401)', () => {
    expect(validateLoginInput({ email: 'a@b.co', password: 'x' }).ok).toBe(true);
  });

  it.each([
    ['missing email', { password: 'Demo@1234' }],
    ['missing password', { email: 'demo@campusmart.local' }],
    ['empty password', { email: 'demo@campusmart.local', password: '' }],
    ['bad email', { email: 'abc', password: 'Demo@1234' }],
    // TC-SEC-001: this is the NoSQL injection attempt — it must never become a Mongo query.
    ['NoSQL operators', { email: { $ne: null }, password: { $ne: null } }],
  ])('rejects %s', (_label, body) => {
    const result = validateLoginInput(body);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toEqual(expect.any(String));
  });

  it.each([null, undefined, 'text', [1, 2]])('rejects a body that is not an object: %p', (body) => {
    expect(validateLoginInput(body).ok).toBe(false);
  });
});
