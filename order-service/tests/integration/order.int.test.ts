import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const uri = process.env.MONGO_URI_TEST;
const describeIfDb = uri ? describe : describe.skip;
const productId = '66f200000000000000000001';
const products = new Map([[productId, { id: productId, name: 'CMU Notebook A5', price: 45, stock: 120 }]]);

describeIfDb('integration: orders with a stub product-service', () => {
  let server: Server;
  let app: ReturnType<typeof import('../../src/app').createApp>;
  let Order: typeof import('../../src/models/Order').Order;
  let database: typeof import('mongoose');
  let stubClosed = false;
  let failStockRestore = false;
  const stockPatches: Array<{ id: string; quantity: number }> = [];

  const tokenFor = (sub: string) => jwt.sign(
    { sub, email: `${sub}@example.test`, name: sub, role: 'user' },
    'order-test-secret',
    { algorithm: 'HS256' },
  );

  beforeAll(async () => {
    const stub = express();
    stub.use(express.json());
    stub.get('/api/products/:id', (req, res) => {
      const product = products.get(req.params.id);
      if (!product) return void res.status(404).json({ message: 'Product not found' });
      res.json(product);
    });
    stub.patch('/api/products/:id/stock', (req, res) => {
      const product = products.get(req.params.id);
      const quantity: unknown = req.body.quantity;
      if (!product) return void res.status(404).json({ message: 'Product not found' });
      // Simulates product-service breaking while order-service puts stock back (+quantity).
      if (failStockRestore && Number.isInteger(quantity) && (quantity as number) > 0) {
        return void res.status(503).json({ message: 'Service unavailable' });
      }
      if (!Number.isInteger(quantity) || product.stock + (quantity as number) < 0) {
        return void res.status(409).json({ message: 'Insufficient stock' });
      }
      product.stock += quantity as number;
      stockPatches.push({ id: product.id, quantity: quantity as number });
      res.json(product);
    });
    await new Promise<void>((resolve) => {
      server = stub.listen(0, '127.0.0.1', () => resolve());
    });

    process.env.PRODUCT_SERVICE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.JWT_SECRET = 'order-test-secret';
    process.env.INTERNAL_API_KEY = 'order-test-key';
    jest.resetModules();
    const importedApp = require('../../src/app') as typeof import('../../src/app');
    app = importedApp.createApp();
    ({ Order } = require('../../src/models/Order') as typeof import('../../src/models/Order'));
    database = require('mongoose') as typeof import('mongoose');
    await database.connect(uri as string, { serverSelectionTimeoutMS: 15000 });
  });

  beforeEach(async () => {
    products.set(productId, { id: productId, name: 'CMU Notebook A5', price: 45, stock: 120 });
    stockPatches.length = 0;
    failStockRestore = false;
    jest.restoreAllMocks();
    await Order.deleteMany({});
  });

  afterAll(async () => {
    if (!stubClosed) {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await database.connection.dropDatabase();
    await database.disconnect();
  });

  it('creates an order with trusted totals and reserves stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor('66f100000000000000000001')}`)
      .send({ items: [{ productId, quantity: 2 }], discountCode: 'WELCOME10' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ subtotal: 90, discount: 9, total: 81, status: 'PLACED' });
    expect(stockPatches).toEqual([{ id: productId, quantity: -2 }]);
  });

  it('hides an order from a different user', async () => {
    const owner = tokenFor('66f100000000000000000001');
    const created = await request(app).post('/api/orders').set('Authorization', `Bearer ${owner}`)
      .send({ items: [{ productId, quantity: 1 }] });

    const other = await request(app).get(`/api/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenFor('66f100000000000000000002')}`);
    expect(other.status).toBe(404);
    expect(other.body).toEqual({ message: 'Order not found' });
  });

  it('accepts a blank discountCode as "no discount"', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor('66f100000000000000000001')}`)
      .send({ items: [{ productId, quantity: 2 }], discountCode: '   ' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ subtotal: 90, discountCode: null, discount: 0, total: 90 });
  });

  it('puts the reserved stock back when saving the order fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Order, 'create').mockRejectedValueOnce(new Error('mongo write failed'));

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor('66f100000000000000000001')}`)
      .send({ items: [{ productId, quantity: 2 }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error' });
    expect(stockPatches).toEqual([{ id: productId, quantity: -2 }, { id: productId, quantity: 2 }]);
    expect(products.get(productId)?.stock).toBe(120);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('keeps a cancelled-but-unrestored order PLACED and answers 502', async () => {
    const token = tokenFor('66f100000000000000000001');
    const created = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId, quantity: 3 }] });
    expect(created.status).toBe(201);

    failStockRestore = true;
    const failed = await request(app).patch(`/api/orders/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(failed.status).toBe(502);
    expect(failed.body).toEqual({ message: 'Product service unavailable' });
    expect((await Order.findById(created.body.id))?.status).toBe('PLACED');
    expect(products.get(productId)?.stock).toBe(117);

    // Still PLACED, so cancelling again once product-service is healthy is safe.
    failStockRestore = false;
    const retried = await request(app).patch(`/api/orders/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(retried.status).toBe(200);
    expect(retried.body.status).toBe('CANCELLED');
    expect(products.get(productId)?.stock).toBe(120);
  });

  it('returns 502 when product-service is unavailable', async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    stubClosed = true;
    const res = await request(app).post('/api/orders/quote')
      .set('Authorization', `Bearer ${tokenFor('66f100000000000000000001')}`)
      .send({ items: [{ productId, quantity: 1 }] });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ message: 'Product service unavailable' });
    // This is intentionally the final test: the stub is closed to simulate a network outage.
  });
});
