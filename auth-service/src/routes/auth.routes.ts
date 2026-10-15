import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

/**
 * Auth routes — request/response format for each one is in docs/API_CONTRACT.md §3.
 * /register and /login are public (you cannot have a token yet); /me needs one.
 */
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

export default router;
