import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { config } from '../../src/config';

const token = jwt.sign(
  { sub: '66f100000000000000000001', email: 'bio@example.test', name: 'Bio', role: 'user' },
  config.jwtSecret,
  { algorithm: 'HS256' },
);

describe('malformed JSON body', () => {
  it('returns 400 "Invalid JSON body" instead of 500', async () => {
    const res = await request(createApp())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send('{"items": [');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid JSON body' });
  });

  it('returns the same 400 without a token (express.json runs before requireAuth)', async () => {
    const res = await request(createApp())
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{"items": [');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid JSON body' });
  });
});
