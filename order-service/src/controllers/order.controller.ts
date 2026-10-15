import { RequestHandler } from 'express';
import { changeStock, getProduct, ProductSnapshot } from '../clients/productClient';
import { Order } from '../models/Order';
import { HttpError } from '../utils/httpError';
import { calculateTotals, mergeItems, PricedItem } from '../utils/pricing';
import { isObjectIdString, validateOrderInput } from '../utils/validation';
import { roundMoney } from '../utils/money';

interface ResolvedItem extends PricedItem {
  name: string;
  lineTotal: number;
}

async function resolveItems(items: { productId: string; quantity: number }[]): Promise<ResolvedItem[]> {
  const resolved: ResolvedItem[] = [];
  for (const item of mergeItems(items)) {
    const product: ProductSnapshot = await getProduct(item.productId);
    if (product.stock < item.quantity) throw new HttpError(409, `Insufficient stock for ${product.name}`);
    resolved.push({
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      lineTotal: roundMoney(product.price * item.quantity),
    });
  }
  return resolved;
}

function parseOrderBody(body: unknown) {
  const input = validateOrderInput(body);
  if (!input.ok) throw new HttpError(400, input.message);
  return input.value;
}

/** POST /api/orders/quote — resolve trusted prices without changing state. */
export const quoteOrder: RequestHandler = async (req, res) => {
  const input = parseOrderBody(req.body);
  const items = await resolveItems(input.items);
  res.json({ items, ...calculateTotals(items, input.discountCode) });
};

/** POST /api/orders — reserve stock, rolling it back if a later reservation fails. */
export const createOrder: RequestHandler = async (req, res) => {
  const input = parseOrderBody(req.body);
  const items = await resolveItems(input.items);
  const totals = calculateTotals(items, input.discountCode);
  const reserved: ResolvedItem[] = [];

  try {
    for (const item of items) {
      await changeStock(item.productId, -item.quantity, item.name);
      reserved.push(item);
    }
  } catch (error) {
    // Best effort: a failed rollback must not hide the original useful stock error.
    await Promise.allSettled(reserved.map((item) => changeStock(item.productId, item.quantity, item.name)));
    throw error;
  }

  const order = await Order.create({ userId: req.user!.sub, items, ...totals, status: 'PLACED' });
  res.status(201).json(order);
};

/** GET /api/orders — only the current user's orders, newest first. */
export const listOrders: RequestHandler = async (req, res) => {
  const orders = await Order.find({ userId: req.user!.sub }).sort({ createdAt: -1 });
  res.json(orders);
};

async function findOwnedOrder(id: string, userId: string) {
  if (!isObjectIdString(id)) throw new HttpError(400, 'Invalid order id');
  const order = await Order.findOne({ _id: id, userId });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

export const getOrder: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await findOwnedOrder(req.params.id, req.user!.sub));
};

export const cancelOrder: RequestHandler<{ id: string }> = async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user!.sub);
  if (order.status !== 'PLACED') throw new HttpError(409, 'Only PLACED orders can be cancelled');

  for (const item of order.items) {
    await changeStock(item.productId, item.quantity, item.name);
  }
  order.status = 'CANCELLED';
  await order.save();
  res.json(order);
};
