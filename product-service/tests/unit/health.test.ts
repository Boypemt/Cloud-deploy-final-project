import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /health', () => {
  it('returns 200 with the service name', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('product-service');
  });

  it('returns 404 JSON for an unknown route', async () => {
    const res = await request(createApp()).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});

describe('error handling', () => {
  it('returns 400 JSON (not 500) for a malformed JSON body', async () => {
    const res = await request(createApp())
      .post('/api/products')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid JSON body' });
  });
});
