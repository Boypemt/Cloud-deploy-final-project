import { RequestHandler } from 'express';

/**
 * 403 = "I know who you are, but you are not allowed". Must run AFTER requireAuth.
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin only' });
    return;
  }
  next();
};
