/**
 * Pure helper functions (no database, no Express) — easy to unit test.
 * Rules come from API_CONTRACT §3; same ValidationResult shape as product-service.
 */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 6;

export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Plain JSON object (not null, not an array). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks a register body (API_CONTRACT §3).
 * - Strict types: anything that is not a string is rejected, so {"email": {"$ne": null}}
 *   never reaches mongoose as a query operator (NoSQL injection, TC-SEC-001).
 * - Only name/email/password are copied into `value`, so a client cannot send role: "admin".
 * - The email is returned trimmed and lower-cased — the one place that normalises it, so the
 *   unique index and login always see the same string.
 */
export function validateRegisterInput(body: unknown): ValidationResult<RegisterInput> {
  if (!isPlainObject(body)) return { ok: false, message: 'Request body must be a JSON object' };

  const name = body.name;
  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > NAME_MAX_LENGTH) {
    return { ok: false, message: `name must be a string of 1-${NAME_MAX_LENGTH} characters` };
  }

  if (!isValidEmail(body.email)) return { ok: false, message: 'email must be a valid email address' };

  const password = body.password;
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `password must be a string of at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  return {
    ok: true,
    value: { name: name.trim(), email: (body.email as string).trim().toLowerCase(), password },
  };
}

/**
 * Checks a login body (API_CONTRACT §3).
 * Only the *shape* is checked here (400). Whether the credentials are right is a 401 decided
 * by the controller — that difference is what keeps TC-SEC-001 at 400 instead of 401.
 */
export function validateLoginInput(body: unknown): ValidationResult<LoginInput> {
  if (!isPlainObject(body)) return { ok: false, message: 'Request body must be a JSON object' };

  if (!isValidEmail(body.email)) return { ok: false, message: 'email must be a valid email address' };

  const password = body.password;
  if (typeof password !== 'string' || password.length < 1) {
    return { ok: false, message: 'password must be a non-empty string' };
  }

  return { ok: true, value: { email: (body.email as string).trim().toLowerCase(), password } };
}
