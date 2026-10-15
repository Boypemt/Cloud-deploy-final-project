import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { config } from '../../src/config';
import { User } from '../../src/models/User';
import { seedUsers } from '../../src/seed';
import { verifyToken } from '../../src/utils/token';

/**
 * Auth API against a REAL MongoDB (skipped without MONGO_URI_TEST, same as db.int.test.ts).
 * These tests are the contract check for the other services: whatever passes here is what
 * product-service and order-service will receive.
 */
const uri = process.env.MONGO_URI_TEST;
const describeIfDb = uri ? describe : describe.skip;

const app = createApp();
const newUser = { name: 'Bio', email: 'bio@campusmart.local', password: 'secret123' };

describeIfDb('integration: auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(uri as string, { serverSelectionTimeoutMS: 15000 });
    // The unique index on email is what makes the duplicate-email test deterministic.
    await User.syncIndexes();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // IT-AUTH-01
  it('register -> login -> /me with the token', async () => {
    const registered = await request(app).post('/api/auth/register').send(newUser);
    expect(registered.status).toBe(201);
    expect(registered.body.user).toMatchObject({ name: 'Bio', email: newUser.email, role: 'user' });
    expect(registered.body.user.id).toMatch(/^[a-f0-9]{24}$/);
    expect(registered.body.user.createdAt).toEqual(expect.any(String));

    const loggedIn = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password });
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.user).toMatchObject({ id: registered.body.user.id, email: newUser.email });
    expect(typeof loggedIn.body.token).toBe('string');

    // The claims other services rely on (API_CONTRACT §2).
    expect(verifyToken(loggedIn.body.token)).toMatchObject({
      sub: registered.body.user.id,
      email: newUser.email,
      name: 'Bio',
      role: 'user',
    });

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loggedIn.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user).toMatchObject({ id: registered.body.user.id, email: newUser.email });
  });

  // IT-AUTH-02
  it('registering the same email twice gives 409 (also with different case)', async () => {
    expect((await request(app).post('/api/auth/register').send(newUser)).status).toBe(201);

    const again = await request(app).post('/api/auth/register').send(newUser);
    expect(again.status).toBe(409);
    expect(again.body).toEqual({ message: 'Email already registered' });

    const upperCase = await request(app)
      .post('/api/auth/register')
      .send({ ...newUser, email: 'BIO@CampusMart.Local' });
    expect(upperCase.status).toBe(409);

    expect(await User.countDocuments()).toBe(1);
  });

  it('a register response never contains the password or its hash', async () => {
    const registered = await request(app).post('/api/auth/register').send(newUser);
    expect(registered.body.user).not.toHaveProperty('passwordHash');
    expect(registered.body.user).not.toHaveProperty('password');
    expect(registered.body.user).not.toHaveProperty('_id');
    expect(registered.body.user).not.toHaveProperty('__v');
    expect(JSON.stringify(registered.body)).not.toContain(newUser.password);

    // ...but the hash IS in the database, and it is a hash, not the password.
    const stored = await User.findOne({ email: newUser.email });
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
  });

  it('register validation: 400 for a bad email, a short password or a missing name', async () => {
    const cases = [
      { ...newUser, email: 'abc' },
      { ...newUser, password: '123' },
      { email: newUser.email, password: newUser.password },
    ];
    for (const body of cases) {
      const res = await request(app).post('/api/auth/register').send(body);
      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(expect.any(String));
    }
    expect(await User.countDocuments()).toBe(0);
  });

  it('a new user is always role "user", even when the body asks for admin', async () => {
    const registered = await request(app)
      .post('/api/auth/register')
      .send({ ...newUser, role: 'admin' });
    expect(registered.status).toBe(201);
    expect(registered.body.user.role).toBe('user');
  });

  it('login: wrong password and unknown email both give 401 with the SAME message', async () => {
    await request(app).post('/api/auth/register').send(newUser);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@campusmart.local', password: newUser.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Identical answers → an attacker cannot tell which emails have an account.
    expect(wrongPassword.body).toEqual({ message: 'Invalid email or password' });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(wrongPassword.body).not.toHaveProperty('token');
  });

  // TC-SEC-001
  it('login with NoSQL operators or a missing password gives 400, never a token', async () => {
    await request(app).post('/api/auth/register').send(newUser);

    const injection = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(injection.status).toBe(400);
    expect(injection.body).not.toHaveProperty('token');

    const emptyPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: '' });
    expect(emptyPassword.status).toBe(400);
  });

  it('/me: 401 without a token, with a broken one and with a foreign secret', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me')).body).toEqual({ message: 'Unauthorized' });

    const headers = ['Bearer not-a-jwt', 'Bearer', 'not-a-bearer-header', ''];
    for (const header of headers) {
      const res = await request(app).get('/api/auth/me').set('Authorization', header);
      expect(res.status).toBe(401);
    }

    const claims = { sub: new mongoose.Types.ObjectId().toString(), email: 'a@b.co', name: 'x', role: 'user' };
    const foreign = jwt.sign(claims, 'some-other-secret', { algorithm: 'HS256', expiresIn: '1h' });
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${foreign}`)).status).toBe(401);

    const expired = jwt.sign(claims, config.jwtSecret, { algorithm: 'HS256', expiresIn: '-1s' });
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`)).status).toBe(401);
  });

  it('/me with a valid token for a deleted user gives 404', async () => {
    const registered = await request(app).post('/api/auth/register').send(newUser);
    const loggedIn = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password });

    await User.deleteOne({ _id: registered.body.user.id });

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loggedIn.body.token}`);
    expect(profile.status).toBe(404);
    expect(profile.body).toEqual({ message: 'User not found' });
  });

  it('seedUsers() is idempotent and the admin can log in with an admin token', async () => {
    expect(await seedUsers()).toBe(2);
    expect(await seedUsers()).toBe(0); // second start-up must not duplicate anything
    expect(await User.countDocuments()).toBe(2);

    const admin = await request(app)
      .post('/api/auth/login')
      .send({ email: config.adminEmail, password: config.adminPassword });
    expect(admin.status).toBe(200);
    expect(admin.body.user).toMatchObject({ name: 'Admin', email: config.adminEmail, role: 'admin' });
    // product-service's requireAdmin reads exactly this claim.
    expect(verifyToken(admin.body.token).role).toBe('admin');

    const demo = await request(app)
      .post('/api/auth/login')
      .send({ email: config.demoEmail, password: config.demoPassword });
    expect(demo.status).toBe(200);
    expect(demo.body.user).toMatchObject({ name: 'Demo User', email: config.demoEmail, role: 'user' });
    expect(verifyToken(demo.body.token).role).toBe('user');
  });

  it('shared error format: 400 for malformed JSON, 404 for an unknown route', async () => {
    const badJson = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(badJson.status).toBe(400);
    expect(badJson.body).toEqual({ message: 'Invalid JSON body' });

    const unknown = await request(app).get('/api/auth/nope');
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ message: 'Route not found' });
  });
});
