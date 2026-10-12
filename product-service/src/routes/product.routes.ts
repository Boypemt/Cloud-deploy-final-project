import { Router, RequestHandler } from 'express';

/**
 * STUB ROUTES — they answer 501 until the real implementation is written.
 * The exact request/response format for each route is in docs/API_CONTRACT.md.
 * IMPORTANT: keep the route ORDER — specific paths before "/:id".
 */
const notImplemented =
  (route: string): RequestHandler =>
  (_req, res) => {
    res.status(501).json({ message: `${route} is not implemented yet (see product-service/README.md)` });
  };

const router = Router();

router.get('/', notImplemented('GET /api/products'));
router.get('/:id', notImplemented('GET /api/products/:id'));
router.post('/', notImplemented('POST /api/products'));
router.put('/:id', notImplemented('PUT /api/products/:id'));
router.delete('/:id', notImplemented('DELETE /api/products/:id'));
router.patch('/:id/stock', notImplemented('PATCH /api/products/:id/stock'));

export default router;
