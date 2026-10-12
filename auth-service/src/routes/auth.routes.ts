import { Router, RequestHandler } from 'express';

/**
 * STUB ROUTES — they answer 501 until the real implementation is written.
 * The exact request/response format for each route is in docs/API_CONTRACT.md.
 * Replace each stub with a controller (see README "What you must build").
 */
const notImplemented =
  (route: string): RequestHandler =>
  (_req, res) => {
    res.status(501).json({ message: `${route} is not implemented yet (see auth-service/README.md)` });
  };

const router = Router();

router.post('/register', notImplemented('POST /api/auth/register'));
router.post('/login', notImplemented('POST /api/auth/login'));
router.get('/me', notImplemented('GET /api/auth/me'));

export default router;
