import bcrypt from 'bcryptjs';

/**
 * Password hashing (API_CONTRACT §3: bcryptjs, 10 salt rounds).
 *
 * Why hash at all: if the database leaks, plain passwords would leak with it.
 * Why bcrypt and not SHA-256: bcrypt is deliberately slow and salts every hash, so two users
 * with the same password get different hashes and brute-forcing is expensive.
 */
export const SALT_ROUNDS = 10;

/** Never log `plain` — it is the user's real password. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** The salt and the cost are stored inside `hash`, so bcrypt can re-hash and compare. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
