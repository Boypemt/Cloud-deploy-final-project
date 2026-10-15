import { Router } from 'express';
import { cancelOrder, createOrder, getOrder, listOrders, quoteOrder } from '../controllers/order.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);
router.post('/quote', quoteOrder);
router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;
