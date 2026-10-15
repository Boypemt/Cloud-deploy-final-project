import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false;
  const claims = value as Record<string, unknown>;
  return typeof claims.sub === 'string' && typeof claims.email === 'string' &&
    typeof claims.name === 'string' && (claims.role === 'user' || claims.role === 'admin');
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const claims = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (!isAuthUser(claims)) throw new Error('Invalid JWT claims');
    req.user = claims;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
