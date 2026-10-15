import { SALT_ROUNDS, hashPassword, verifyPassword } from '../../src/utils/password';

// UT-AUTH-02
describe('hashPassword / verifyPassword', () => {
  const plain = 'secret123';

  it('never stores the plain password and uses the contract cost of 10 rounds', async () => {
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).not.toContain(plain);
    expect(SALT_ROUNDS).toBe(10);
    expect(hash).toMatch(/^\$2[aby]\$10\$/); // bcrypt format: $2b$<rounds>$<salt+hash>
  });

  it('gives a different hash every time (random salt), but both still verify', async () => {
    const [first, second] = await Promise.all([hashPassword(plain), hashPassword(plain)]);
    expect(first).not.toBe(second);
    expect(await verifyPassword(plain, first)).toBe(true);
    expect(await verifyPassword(plain, second)).toBe(true);
  });

  it('accepts the correct password and rejects a wrong one', async () => {
    const hash = await hashPassword(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
    expect(await verifyPassword('SECRET123', hash)).toBe(false); // case matters
    expect(await verifyPassword('', hash)).toBe(false);
  });
});
