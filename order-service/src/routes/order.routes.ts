import { Router, RequestHandler } from 'express';

/**
 * STUB ROUTES — they answer 501 until the real implementation is written.
 * The exact request/response format for each route is in docs/API_CONTRACT.md.
 * IMPORTANT: keep the route ORDER — "/quote" must be registered before "/:id".
 */
const notImplemented =
  (route: string): RequestHandler =>
  (_req, res) => {
    res.status(501).json({ message: `${route} is not implemented yet (see order-service/README.md)` });
  };

const router = Router();

router.post('/quote', notImplemented('POST /api/orders/quote'));
router.post('/', notImplemented('POST /api/orders'));
router.get('/', notImplemented('GET /api/orders'));
router.get('/:id', notImplemented('GET /api/orders/:id'));
router.patch('/:id/cancel', notImplemented('PATCH /api/orders/:id/cancel'));

export default router;
