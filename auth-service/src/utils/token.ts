import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

/** Claims inside every CampusMart JWT (API_CONTRACT §2) — product-service uses the same interface. */
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

function isAuthUser(payload: unknown): payload is AuthUser {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.sub === 'string' &&
    typeof p.email === 'string' &&
    typeof p.name === 'string' &&
    (p.role === 'user' || p.role === 'admin')
  );
}

/**
 * Signs the token the whole system trusts: product-service and order-service verify it
 * themselves with the shared JWT_SECRET, so the payload must stay EXACTLY { sub, email, name,
 * role } (plus jsonwebtoken's own iat/exp). `sub` is the user id as a string because order-service
 * stores it as the order's userId.
 */
export function signToken(user: AuthUser): string {
  const options: SignOptions = {
    // HS256 is set explicitly: the verifiers pass algorithms: ['HS256'], and pinning the
    // algorithm on both sides blocks algorithm-confusion attacks (e.g. a forged alg: none token).
    algorithm: 'HS256',
    // config.jwtExpiresIn is a plain env string ("1h"); the type is jsonwebtoken's stricter
    // StringValue template literal, so it needs a cast here.
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const payload: AuthUser = { sub: user.sub, email: user.email, name: user.name, role: user.role };
  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Verifies signature + expiry and checks the claims are the ones we promised.
 * THROWS on anything suspicious (bad signature, expired, wrong shape) — callers turn that into
 * 401 instead of trusting half a token.
 */
export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  if (!isAuthUser(payload)) throw new Error('Token payload is not a CampusMart user');
  return payload;
}
