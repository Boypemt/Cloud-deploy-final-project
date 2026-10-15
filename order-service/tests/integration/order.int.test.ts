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
