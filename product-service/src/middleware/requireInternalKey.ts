import { RequestHandler } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

/** Compare secrets in constant time (hashing first makes both sides the same length). */
function sameSecret(a: string, b: string): boolean {
  const hash = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(hash(a), hash(b));
}

/**
 * The stock endpoint is for order-service only (service-to-service), not for users,
 * so it is protected by a shared key in the x-internal-key header instead of a JWT.
 */
export const requireInternalKey: RequestHandler = (req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (typeof key !== 'string' || !sameSecret(key, config.internalApiKey)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};
