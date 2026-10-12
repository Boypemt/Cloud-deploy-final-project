/**
 * Pure helper functions (no database, no Express) — easy to unit test.
 * Example given; add validateRegisterInput(...) etc. here (UT-AUTH-01).
 */
export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
