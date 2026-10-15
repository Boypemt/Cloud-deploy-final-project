import { RequestHandler } from 'express';
import { AuthUser, verifyToken } from '../utils/token';

export type { AuthUser };

// Lets handlers read req.user with the right type (same augmentation as product-service).
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * 401 = "who are you?" — no token, a broken token, a wrong signature or an expired token.
 * Same middleware as in product-service, so /me behaves exactly like the protected product routes.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    // Never echo the reason (expired vs forged) or the token itself — it would leak information.
    res.status(401).json({ message: 'Unauthorized' });
  }
};
