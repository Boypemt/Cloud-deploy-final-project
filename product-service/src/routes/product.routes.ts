import { Router } from 'express';
import {
  changeStock,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/product.controller';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalKey } from '../middleware/requireInternalKey';

/**
 * Product routes — request/response format for each one is in docs/API_CONTRACT.md §4.
 * IMPORTANT: keep the route ORDER — specific paths before "/:id".
 */
const router = Router();

router.get('/', listProducts); // public
router.patch('/:id/stock', requireInternalKey, changeStock); // order-service only
router.get('/:id', getProduct); // public
router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
