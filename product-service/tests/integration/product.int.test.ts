import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { config } from '../../src/config';
import { Product } from '../../src/models/Product';
import { seedProducts } from '../../src/seed';

/**
 * Product API against a REAL MongoDB (skipped without MONGO_URI_TEST, same as db.int.test.ts).
 * Tokens are signed here with the same JWT_SECRET the service uses — auth-service is not needed.
 */
const uri = process.env.MONGO_URI_TEST;
const describeIfDb = uri ? describe : describe.skip;

const app = createApp();
const tokenFor = (role: 'user' | 'admin') =>
  jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), email: `${role}@test.local`, name: role, role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
const adminAuth = `Bearer ${tokenFor('admin')}`;
const userAuth = `Bearer ${tokenFor('user')}`;
const newProduct = { name: 'Test Pencil', price: 10, stock: 5, category: 'stationery' as const };

describeIfDb('integration: product API', () => {
  beforeAll(async () => {
    await mongoose.connect(uri as string, { serverSelectionTimeoutMS: 15000 });
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // IT-PROD-01
  it('admin: create -> get -> update -> delete, then get is 404', async () => {
    const created = await request(app).post('/api/products').set('Authorization', adminAuth).send(newProduct);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...newProduct, description: '', imageUrl: '' });
    expect(created.body.id).toMatch(/^[a-f0-9]{24}$/);
    expect(created.body).not.toHaveProperty('_id');
    expect(created.body).not.toHaveProperty('__v');
    const id = created.body.id;

    const got = await request(app).get(`/api/products/${id}`);
    expect(got.status).toBe(200);
    expect(got.body.name).toBe('Test Pencil');

    const updated = await request(app).put(`/api/products/${id}`).set('Authorization', adminAuth).send({ price: 12 });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ id, price: 12, stock: 5 });

    const deleted = await request(app).delete(`/api/products/${id}`).set('Authorization', adminAuth);
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ message: 'Product deleted' });

    const gone = await request(app).get(`/api/products/${id}`);
    expect(gone.status).toBe(404);
    expect(gone.body).toEqual({ message: 'Product not found' });
  });

  // IT-PROD-02
  it('normal user cannot create a product (403), no token is 401', async () => {
    const asUser = await request(app).post('/api/products').set('Authorization', userAuth).send(newProduct);
    expect(asUser.status).toBe(403);
    expect(asUser.body).toEqual({ message: 'Admin only' });

    const noToken = await request(app).post('/api/products').send(newProduct);
    expect(noToken.status).toBe(401);
    expect(noToken.body).toEqual({ message: 'Unauthorized' });

    const badToken = await request(app).post('/api/products').set('Authorization', 'Bearer not-a-jwt').send(newProduct);
    expect(badToken.status).toBe(401);

    const wrongSecret = jwt.sign({ sub: 'x', email: 'a@b.c', name: 'x', role: 'admin' }, 'other-secret');
    const forged = await request(app).post('/api/products').set('Authorization', `Bearer ${wrongSecret}`).send(newProduct);
    expect(forged.status).toBe(401);

    expect(await Product.countDocuments()).toBe(0);
  });

  // IT-PROD-03
  it('stock PATCH: 200 with the key, 403 without, 409 below zero', async () => {
    const id = (await Product.create(newProduct))._id.toString();
    const url = `/api/products/${id}/stock`;

    const ok = await request(app).patch(url).set('x-internal-key', config.internalApiKey).send({ quantity: -2 });
    expect(ok.status).toBe(200);
    expect(ok.body.stock).toBe(3);

    const noKey = await request(app).patch(url).send({ quantity: -1 });
    expect(noKey.status).toBe(403);
    const wrongKey = await request(app).patch(url).set('x-internal-key', 'wrong').send({ quantity: -1 });
    expect(wrongKey.status).toBe(403);

    const tooMany = await request(app).patch(url).set('x-internal-key', config.internalApiKey).send({ quantity: -4 });
    expect(tooMany.status).toBe(409);
    expect(tooMany.body).toEqual({ message: 'Insufficient stock' });

    const putBack = await request(app).patch(url).set('x-internal-key', config.internalApiKey).send({ quantity: 2 });
    expect(putBack.body.stock).toBe(5);

    const notInt = await request(app).patch(url).set('x-internal-key', config.internalApiKey).send({ quantity: '1' });
    expect(notInt.status).toBe(400);

    const missing = await request(app)
      .patch(`/api/products/${new mongoose.Types.ObjectId()}/stock`)
      .set('x-internal-key', config.internalApiKey)
      .send({ quantity: -1 });
    expect(missing.status).toBe(404);
  });

  it('stock PATCH is atomic: 10 parallel orders of 1 on stock 5 -> exactly 5 succeed', async () => {
    const id = (await Product.create(newProduct))._id.toString();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).patch(`/api/products/${id}/stock`).set('x-internal-key', config.internalApiKey).send({ quantity: -1 }),
      ),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(5);
    expect(results.filter((r) => r.status === 409)).toHaveLength(5);
    expect((await Product.findById(id))?.stock).toBe(0);
  });

  it('seed inserts the 8 contract products once; list, search and paging work', async () => {
    await seedProducts();
    await seedProducts(); // second call must not duplicate
    expect(await Product.countDocuments()).toBe(8);

    const list = await request(app).get('/api/products');
    expect(list.status).toBe(200);
    expect(list.body).toMatchObject({ total: 8, page: 1, limit: 20 });
    const names = list.body.items.map((p: { name: string }) => p.name);
    expect(names).toContain('CMU Notebook A5');
    expect(names).toEqual([...names].sort());

    const search = await request(app).get('/api/products?search=NOTEBOOK');
    expect(search.body.items.map((p: { name: string }) => p.name)).toEqual(['CMU Notebook A5']);
    expect(search.body.total).toBe(1);

    const food = await request(app).get('/api/products?category=food');
    expect(food.body.total).toBe(2);

    const page2 = await request(app).get('/api/products?page=2&limit=3');
    expect(page2.body).toMatchObject({ total: 8, page: 2, limit: 3 });
    expect(page2.body.items).toHaveLength(3);
  });

  it('GET /:id: 400 for an invalid id, 404 for an unknown id', async () => {
    expect((await request(app).get('/api/products/abc')).status).toBe(400);
    const unknown = await request(app).get('/api/products/000000000000000000000000');
    expect(unknown.status).toBe(404);
  });

  it('admin validation and missing products: 400 / 404', async () => {
    const bad = await request(app).post('/api/products').set('Authorization', adminAuth).send({ ...newProduct, price: '10' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toEqual(expect.any(String));

    const unknownId = new mongoose.Types.ObjectId().toString();
    expect((await request(app).put(`/api/products/${unknownId}`).set('Authorization', adminAuth).send({ price: 1 })).status).toBe(404);
    expect((await request(app).delete(`/api/products/${unknownId}`).set('Authorization', adminAuth)).status).toBe(404);
    expect((await request(app).put('/api/products/abc').set('Authorization', adminAuth).send({ price: 1 })).status).toBe(400);
  });
});
