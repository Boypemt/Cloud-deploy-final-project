import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/** Claims inside every CampusMart JWT (API_CONTRACT §2). */
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

// Lets handlers read req.user with the right type.
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

function isAuthUser(payload: unknown): payload is AuthUser {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return typeof p.sub === 'string' && (p.role === 'user' || p.role === 'admin');
}

/**
 * 401 = "who are you?" — no token, a broken token, a wrong signature or an expired token.
 * product-service checks the token itself with the shared JWT_SECRET (no call to auth-service).
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (!isAuthUser(payload)) throw new Error('bad payload');
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
