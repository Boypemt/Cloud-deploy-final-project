import { RequestHandler } from 'express';
import { QueryFilter } from 'mongoose';
import { Product, ProductDoc } from '../models/Product';
import { buildProductQuery } from '../utils/query';
import { isObjectIdString, isPlainObject, validateProductInput } from '../utils/validation';

const NOT_FOUND = { message: 'Product not found' };
const INVALID_ID = { message: 'Invalid product id' };

/** GET /api/products — public list with search, category filter and paging. */
export const listProducts: RequestHandler = async (req, res) => {
  const { filter: built, page, limit, skip } = buildProductQuery(req.query);
  // An unknown ?category= is allowed here and simply matches nothing, so widen the type for mongoose.
  const filter = built as QueryFilter<ProductDoc>;
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
};

/** GET /api/products/:id */
export const getProduct: RequestHandler<{ id: string }> = async (req, res) => {
  if (!isObjectIdString(req.params.id)) return void res.status(400).json(INVALID_ID);
  const product = await Product.findById(req.params.id);
  if (!product) return void res.status(404).json(NOT_FOUND);
  res.json(product);
};

/** POST /api/products (admin) */
export const createProduct: RequestHandler = async (req, res) => {
  const result = validateProductInput(req.body);
  if (!result.ok) return void res.status(400).json({ message: result.message });
  const product = await Product.create(result.value);
  res.status(201).json(product);
};

/** PUT /api/products/:id (admin) — any subset of fields. */
export const updateProduct: RequestHandler<{ id: string }> = async (req, res) => {
  if (!isObjectIdString(req.params.id)) return void res.status(400).json(INVALID_ID);
  const result = validateProductInput(req.body, { partial: true });
  if (!result.ok) return void res.status(400).json({ message: result.message });
  const product = await Product.findByIdAndUpdate(req.params.id, result.value, {
    new: true, // return the product AFTER the update
    runValidators: true,
  });
  if (!product) return void res.status(404).json(NOT_FOUND);
  res.json(product);
};

/** DELETE /api/products/:id (admin) */
export const deleteProduct: RequestHandler<{ id: string }> = async (req, res) => {
  if (!isObjectIdString(req.params.id)) return void res.status(400).json(INVALID_ID);
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return void res.status(404).json(NOT_FOUND);
  res.json({ message: 'Product deleted' });
};

/**
 * PATCH /api/products/:id/stock (internal, order-service only)
 * body { quantity: -2 } takes 2 from stock, { quantity: 2 } puts 2 back.
 *
 * ATOMIC: the check ("is there enough stock?") and the change ($inc) happen in ONE
 * MongoDB operation. If we did find() then save(), two orders arriving at the same
 * time could both see stock = 1 and both succeed → stock -1 (overselling).
 */
export const changeStock: RequestHandler<{ id: string }> = async (req, res) => {
  if (!isObjectIdString(req.params.id)) return void res.status(400).json(INVALID_ID);
  const quantity = isPlainObject(req.body) ? req.body.quantity : undefined;
  if (!Number.isInteger(quantity)) {
    return void res.status(400).json({ message: 'quantity must be an integer' });
  }
  const qty = quantity as number;

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, stock: { $gte: -qty } }, // only match if stock + qty >= 0
    { $inc: { stock: qty } },
    { new: true },
  );
  if (product) return void res.json(product);

  // Nothing matched: either the product does not exist, or there was not enough stock.
  const exists = await Product.exists({ _id: req.params.id });
  if (!exists) return void res.status(404).json(NOT_FOUND);
  res.status(409).json({ message: 'Insufficient stock' });
};
